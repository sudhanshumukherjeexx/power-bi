/* Content review: turns verification dates into maintenance work.
   Fast-moving content carries "verified": {date, review_after_days}. When a review falls due, this opens (or
   updates) one GitHub issue per item, labelled content-review, saying what to check, against which official
   sources, and what else depends on it (lessons, flashcards, certification domains, scenarios). When the item is
   verified again (its date moves), the issue is closed with a comment. Issues are matched by a hidden key, so
   there are never duplicates.
   Usage:
     node tools/content-review.js                      list items due (and due within 14 days)
     node tools/content-review.js --today 2027-06-01   pretend it's another day (testing)
     node tools/content-review.js --sync               create/update/close issues (needs GITHUB_TOKEN, GITHUB_REPOSITORY)
     node tools/content-review.js --sync --dry-run     print what --sync would do, change nothing
   Run weekly by .github/workflows/content-review.yml. */
'use strict';
const fs = require('fs'), path = require('path');
const load = require('./lib/load');

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const has = k => process.argv.includes(k);
const TODAY = arg('--today') || new Date().toISOString().slice(0, 10);
const LABEL = 'content-review';
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

function items() {
  const all = load.all(), out = [];
  const topics = Object.fromEntries(all.modules.flatMap(m => m.topicsData.map(T => [T.id, Object.assign({ module: m }, T)])));
  const certAreas = id => all.certs.flatMap(c => { const v = c.versions[c.versions.length - 1]; return v.areas.filter(a => a.topics.includes(id)).map(a => `${c.code}: ${a.n} (${a.w})`); });
  const push = (key, kind, title, file, v, refs, affected) => { if (v && v.date) out.push({ key, kind, title, file, verified: v.date, context: v.context || v.source || '', due: addDays(v.date, v.review_after_days || 180), refs, affected }); };

  for (const T of Object.values(topics)) push(`topic/${T.id}`, 'Lesson', `${T.module.name}: ${T.name}`, T._file ? path.relative(load.root, T._file).split(path.sep).join('/') : `content/skills/${T.module.id}`, T.verified,
    (T.refs || []).map(r => [r.title, r.url]), {
      'Lesson': [`${T.module.id}.html#${T.id}`], 'Flashcards (topic interview questions)': T.int.length ? [`${T.int.length} cards`] : [],
      'Certification domains': certAreas(T.id), 'Toolkit guides': all.toolkit ? all.toolkit.guides.filter(g => (g.lessons || []).includes(T.id)).map(g => `toolkit/${g.id}.html`) : [] });
  for (const c of all.certs) push(`cert/${c.id}`, 'Certification outline', `${c.code} skills measured`, `content/certifications/${c.id}.json`, c.verified, [['Official study guide', c.url]], {
    'Certification map': ['learn.html#certs'], 'Mapped lessons': [...new Set(c.versions[c.versions.length - 1].areas.flatMap(a => a.topics))].map(id => `${topics[id] ? topics[id].module.id : '?'}.html#${id}`) });
  if (all.toolkit) for (const g of all.toolkit.guides) push(`toolkit/${g.id}`, 'Toolkit guide', g.title, `content/toolkit/guides/${g.id}.md`, g.verified,
    (g.refs || []).filter(r => r.src === 'official').map(r => [r.t, r.u]), { 'Guide': [`toolkit/${g.id}.html`], 'Lessons': (g.lessons || []).map(id => `${topics[id] ? topics[id].module.id : '?'}.html#${id}`), 'Scenarios': g.scenarios || [] });
  if (all.external) push('catalog/external', 'External resource catalog', 'External resource catalog', 'content/resources/external.json', all.external.verified, [], { 'Library': ['resources.html#external'], 'Entries': [`${all.external.items.length} links (run npm run links:external first)`] });
  const xp = path.join(load.root, 'content/experience');
  for (const d of fs.readdirSync(xp)) {
    const f = path.join(xp, d, 'scenario.json'); if (!fs.existsSync(f)) continue;
    const s = JSON.parse(fs.readFileSync(f, 'utf8'));
    push(`scenario/${s.id}`, 'Scenario', `${s.ticket.id}: ${s.title}`, `content/experience/${d}/scenario.json`, s.verified, (s.refs || []).map(r => [r.title, r.url]), { 'Scenario': [`experience/${s.slug}.html`], 'Skills': s.skills || [] });
  }
  return out.sort((a, b) => a.due.localeCompare(b.due));
}

const body = it => `<!-- content-review-key: ${it.key} -->
**${it.kind}** \`${it.file}\` was last verified on **${it.verified}**${it.context ? ` (${it.context})` : ''}. Its review was due on **${it.due}**.

### What to do
1. Check the content against the official sources below. Product names, menus, limits, licensing, preview/GA status and exam outlines change often.
2. Fix anything that has changed (in \`${it.file}\`), and update anything listed under *Also affected*.
3. Set \`verified.date\` to the day you checked it. This issue then closes itself on the next weekly run.

### Official sources
${it.refs.length ? it.refs.map(([t, u]) => `- [${t}](${u})`).join('\n') : '- (none listed; add one under `refs`)'}

### Also affected
${Object.entries(it.affected).filter(([, v]) => v.length).map(([k, v]) => `- **${k}:** ${v.map(x => /\.html|#/.test(x) ? `\`${x}\`` : x).join(', ')}`).join('\n') || '- nothing else depends on it'}

<sub>Opened by \`tools/content-review.js\` (weekly). Don't edit the first line; it links this issue to the content.</sub>`;

async function sync(due, dry) {
  const repo = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN;
  if (!repo || (!token && !dry)) { console.error('Set GITHUB_REPOSITORY (owner/name) and GITHUB_TOKEN.'); process.exit(2); }
  const api = async (method, url, data) => {
    const r = await fetch(`https://api.github.com${url}`, { method, headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data ? { 'Content-Type': 'application/json' } : {}) }, body: data ? JSON.stringify(data) : undefined });
    if (!r.ok) throw new Error(`${method} ${url}: ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  };
  const open = [];
  for (let page = 1; ; page++) { const b = await api('GET', `/repos/${repo}/issues?state=open&labels=${LABEL}&per_page=100&page=${page}`); open.push(...b.filter(i => !i.pull_request)); if (b.length < 100) break; }
  const keyOf = i => ((i.body || '').match(/content-review-key: (\S+)/) || [])[1];
  const byKey = new Map(open.map(i => [keyOf(i), i]));
  const act = async (what, fn) => { console.log((dry ? '[dry run] ' : '') + what); if (!dry) await fn(); };
  if (!dry && !open.length) await api('POST', `/repos/${repo}/labels`, { name: LABEL, color: 'D9A514', description: 'Fast-moving content past its review date' }).catch(() => {});
  for (const it of due) {
    const title = `Content review required: ${it.title}`, ex = byKey.get(it.key);
    if (!ex) await act(`open   "${title}"`, () => api('POST', `/repos/${repo}/issues`, { title, body: body(it), labels: [LABEL] }));
    else if (ex.body !== body(it) || ex.title !== title) await act(`update #${ex.number} "${title}"`, () => api('PATCH', `/repos/${repo}/issues/${ex.number}`, { title, body: body(it) }));
    else console.log(`keep   #${ex.number} "${title}"`);
  }
  const dueKeys = new Set(due.map(i => i.key)), all = new Map(items().map(i => [i.key, i]));
  for (const [key, iss] of byKey) {
    if (!key || dueKeys.has(key)) continue;
    const it = all.get(key);
    await act(`close  #${iss.number} (${it ? `verified again on ${it.verified}` : 'content removed'})`, async () => {
      await api('POST', `/repos/${repo}/issues/${iss.number}/comments`, { body: it ? `Verified again on ${it.verified} (next review ${it.due}). Closing.` : 'This content no longer exists. Closing.' });
      await api('PATCH', `/repos/${repo}/issues/${iss.number}`, { state: 'closed', state_reason: 'completed' });
    });
  }
}

if (require.main === module) {
  const list = items(), due = list.filter(i => i.due < TODAY), soon = list.filter(i => i.due >= TODAY && i.due <= addDays(TODAY, 14));
  console.log(`${list.length} dated items as of ${TODAY}: ${due.length} due, ${soon.length} due within 14 days`);
  for (const i of due) console.log(`  DUE   ${i.due}  ${i.kind}: ${i.title}`);
  for (const i of soon) console.log(`  SOON  ${i.due}  ${i.kind}: ${i.title}`);
  if (has('--body') && due[0]) console.log('\n' + body(due[0]));
  if (has('--sync')) sync(due, has('--dry-run')).catch(e => { console.error(e.message); process.exit(1); });
}
module.exports = { items, body };
