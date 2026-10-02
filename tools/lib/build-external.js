/* External resource catalog: content/resources/external.json → assets/js/external.js.
   Resources lists the whole catalog; level and track pages show the entries linked to each topic; scenario pages
   show the entries linked to the scenario ("Need more context?"). Links to lessons and scenarios are resolved here,
   so the pages don't need the course data to show them. */
'use strict';
const TIERS = ['official', 'specialist', 'community', 'third-party', 'book'];

function check(x, all) {
  const errs = [];
  const cats = new Set(x.categories.map(c => c.id));
  const stages = new Set(all.stages.map(s => s.id));
  const topics = new Set(all.modules.flatMap(m => m.topicsData.map(t => t.id)));
  const scen = new Set((all.scenarios || []).map(s => s.id));
  const seen = new Set();
  x.items.forEach((it, i) => {
    const at = `content/resources/external.json item ${i + 1} (${it.t})`;
    if (!it.t || !it.d) errs.push(`${at}: needs a title "t" and a description "d"`);
    if (!/^https:\/\//.test(it.u || '')) errs.push(`${at}: url must start with https://`);
    if (/utm_[a-z]+=/.test(it.u || '')) errs.push(`${at}: remove tracking parameters from the url`);
    if (seen.has(it.u)) errs.push(`${at}: duplicate url ${it.u}`);
    seen.add(it.u);
    if (!cats.has(it.c)) errs.push(`${at}: unknown category "${it.c}"`);
    if (!TIERS.includes(it.src)) errs.push(`${at}: src must be one of ${TIERS.join(', ')}`);
    if (!stages.has(it.stage)) errs.push(`${at}: unknown stage "${it.stage}"`);
    if (it.cost && !['free', 'paid'].includes(it.cost)) errs.push(`${at}: cost must be "free" or "paid"`);
    for (const l of it.lessons || []) if (!topics.has(l)) errs.push(`${at}: unknown lesson "${l}"`);
    for (const s of it.scenarios || []) if (!scen.has(s)) errs.push(`${at}: unknown scenario "${s}"`);
  });
  for (const c of x.categories) if (!x.items.some(i => i.c === c.id)) errs.push(`content/resources/external.json: category "${c.id}" is empty`);
  return errs;
}

function build(all, { BANNER, J }) {
  const x = all.external;
  if (!x) return {};
  const errs = check(x, all);
  if (errs.length) throw new Error('external resources:\n  ' + errs.join('\n  '));
  const topic = Object.fromEntries(all.modules.flatMap(m => m.topicsData.map(t => [t.id, { href: `${m.id}.html#${t.id}`, name: `${t.name.split(":")[0]} (${m.name})` }])));
  const scen = Object.fromEntries((all.scenarios || []).map(s => [s.id, { href: `experience/${s.slug}.html`, name: `${s.ticket.id} ${s.title}` }]));
  const stage = Object.fromEntries(all.stages.map(s => [s.id, s.name]));
  const items = x.items.map(it => ({
    c: it.c, t: it.t, d: it.d, u: it.u, src: it.src, stage: it.stage, sn: stage[it.stage], cost: it.cost || 'free',
    l: (it.lessons || []).map(id => [id, topic[id].href, topic[id].name]),
    s: (it.scenarios || []).map(id => [id, scen[id].href, scen[id].name])
  }));
  return {
    'assets/js/external.js': BANNER('content/resources/external.json') +
      `/* External learning catalog. src = authority (official, specialist, community, third-party, book); l = related lessons and s = related scenarios as [id, href, name]. */\n` +
      `const EXTERNAL={verified:${J(x.verified.date)},intro:${J(x.intro)},cats:${J(x.categories.map(c => [c.id, c.name]))},items:[\n${items.map(J).join(',\n')}\n]};\n`
  };
}

module.exports = Object.assign(build, { check });
