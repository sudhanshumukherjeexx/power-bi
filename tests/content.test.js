/* Content integrity: schemas, unique ids, every reference resolves, and saved progress stays valid. */
'use strict';
const fs = require('fs'), path = require('path');
const load = require('../tools/lib/load');
const { validate } = require('./lib/schema');
const { hash, walk, rel, root } = require('./lib/util');

module.exports = t => {
  const schema = n => JSON.parse(fs.readFileSync(path.join(root, 'content/schema', n), 'utf8'));
  const check = (s, data, where) => { const errs = validate(s, data); t.ok(!errs.length, `${where}: ${errs.slice(0, 4).join('; ')}`); };

  /* every JSON file under content/ parses */
  for (const f of walk(path.join(root, 'content'), p => p.endsWith('.json'))) {
    try { JSON.parse(fs.readFileSync(f, 'utf8')); t.ok(true); } catch (e) { t.ok(false, `${rel(f)} is not valid JSON: ${e.message}`); }
  }

  const a = load.all();
  const S = { topic: schema('topic.schema.json'), module: schema('module.schema.json'), sol: schema('solutions.schema.json'), ds: schema('dataset.schema.json') };

  /* modules and topics */
  const topicIds = new Set(), moduleIds = new Set(), asgIds = new Set();
  const dsKeys = new Set(a.datasets.map(d => d.key));
  const extraDs = new Set((a.trackDatasets || []).map(d => d.key));
  const skillIds = new Set(a.skills.map(s => s.id)), stageIds = new Set(a.stages.map(s => s.id));
  for (const m of a.modules) {
    const raw = load.readJSON(path.join(root, m._dir, '_module.json'));
    check(S.module, raw, m._dir + '/_module.json');
    t.ok(!moduleIds.has(m.id), `duplicate module id ${m.id}`); moduleIds.add(m.id);
    t.ok(path.basename(m._dir) === m.id, `${m._dir}: folder name must equal module id "${m.id}"`);
    for (const T of m.topicsData) {
      const rawT = load.readJSON(path.join(root, T._file));
      check(S.topic, rawT, T._file);
      t.ok(path.basename(T._file, '.json') === T.id, `${T._file}: file name must equal topic id "${T.id}"`);
      t.ok(!topicIds.has(T.id), `duplicate topic id ${T.id}`); topicIds.add(T.id);
      for (const d of T.ds) t.ok(dsKeys.has(d) || extraDs.has(d), `${T.id}: unknown dataset "${d}"`);
      for (const s of T.skills || []) t.ok(!skillIds.size || skillIds.has(s), `${T.id}: unknown skill "${s}"`);
      if (T.stage) t.ok(!stageIds.size || stageIds.has(T.stage), `${T.id}: unknown stage "${T.stage}"`);
      T.asg.forEach((x, i) => {
        asgIds.add(`${T.id}-${i}`);
        if (x.guidance && x.guidance !== 'A') t.ok(!!x.brief, `${T.id}-${i}: guidance ${x.guidance} needs a "brief" (the problem, not the procedure)`);
        for (const s of x.skills || []) t.ok(!skillIds.size || skillIds.has(s), `${T.id}-${i}: unknown skill "${s}"`);
      });
      T.ass.forEach((q, i) => { if (q.type === 'mcq') t.ok(q.a >= 0 && q.a < q.o.length, `${T.id}-q${i}: answer index ${q.a} out of range`); });
      const qs = T.int.map(q => q.q); t.ok(new Set(qs).size === qs.length, `${T.id}: duplicate interview question text (flashcard ids would collide)`);
      if (m.kind === 'track' || T.verified) t.ok(!!T.verified, `${T.id}: track topics need "verified" metadata`);
    }
  }

  /* solutions: every assignment has one, every solution belongs to an assignment */
  for (const f of walk(path.join(root, 'content/solutions'), p => p.endsWith('.json'))) check(S.sol, load.readJSON(f), rel(f));
  for (const id of Object.keys(a.solutions)) t.ok(asgIds.has(id), `solution "${id}" (${a.solutions[id]._file}) has no matching assignment`);
  for (const id of asgIds) t.ok(!!a.solutions[id], `assignment ${id} has no worked solution in content/solutions/`);

  /* datasets metadata */
  check(S.ds, load.readJSON(path.join(root, 'content/datasets/datasets.json')), 'content/datasets/datasets.json');

  /* flashcards and glossary */
  const cats = new Set(a.concepts.map(c => c.c));
  const cq = a.concepts.map(c => c.q); t.ok(new Set(cq).size === cq.length, 'duplicate concept flashcard question');
  for (const c of a.concepts) t.ok(c.c && c.l && c.q && c.a, `concept card missing a field: ${c.q || '(no question)'}`);
  const terms = new Set(a.glossary.map(g => g.t));
  t.ok(terms.size === a.glossary.length, 'duplicate glossary term');
  const slugs = a.glossary.map(g => g.t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  t.ok(new Set(slugs).size === slugs.length, 'two glossary terms produce the same anchor slug');
  for (const g of a.glossary) {
    t.ok(g.t && g.c && g.d, `glossary entry missing a field: ${g.t}`);
    for (const s of g.s || []) t.ok(terms.has(s), `glossary "${g.t}" links to missing term "${s}"`);
  }

  /* career paths and certification maps point at real topics and card categories */
  for (const r of a.roles) {
    for (const id of r.core) t.ok(topicIds.has(id), `role ${r.id}: unknown topic ${id}`);
    for (const c of r.cards) t.ok(cats.has(c), `role ${r.id}: unknown card category "${c}"`);
  }
  for (const c of a.certs) {
    const versions = c.versions || [{ areas: c.areas }];
    for (const v of versions) for (const ar of v.areas) {
      for (const id of ar.topics) t.ok(topicIds.has(id), `${c.code}: area "${ar.n}" maps to unknown topic ${id}`);
      for (const k of ar.cards || []) t.ok(cats.has(k), `${c.code}: area "${ar.n}" maps to unknown card category "${k}"`);
      for (const sk of ar.skills || []) for (const id of sk.topics || []) t.ok(topicIds.has(id), `${c.code}: "${sk.n}" maps to unknown topic ${id}`);
    }
    if (c.versions) {
      const eff = c.versions.map(v => v.effective);
      t.ok(eff.every(e => /^\d{4}-\d{2}-\d{2}$/.test(e || '')) && eff.join() === [...eff].sort().join(), `${c.code}: every version needs an effective date, oldest first`);
      t.ok(new Set(c.versions.map(v => v.id)).size === c.versions.length, `${c.code}: duplicate version id`);
      t.ok(!!(c.verified && c.verified.date), `${c.code}: certification needs verified.date`);
    }
  }

  /* progress protection: legacy ids and flashcard hashes never change silently */
  const pins = load.readJSON(path.join(root, 'tests/curriculum/legacy-pins.json'));
  const byId = Object.fromEntries(a.modules.flatMap(m => m.topicsData).map(T => [T.id, T]));
  for (const [id, p] of Object.entries(pins.topics)) {
    const T = byId[id];
    if (!t.ok(!!T, `pinned topic ${id} was removed (learners' progress for it would be lost)`)) continue;
    t.ok(T.asg.length >= p.asg, `${id}: assignments were removed or reordered (pinned ${p.asg}, now ${T.asg.length}). Only append.`);
    t.ok(T.ass.length >= p.ass, `${id}: assessment items were removed (pinned ${p.ass}). Only append.`);
    p.int.forEach((h, i) => t.ok(T.int[i] && 't' + hash(T.int[i].q) === h, `${id}: interview question ${i} text changed, which resets learners' flashcard history for it. If intended, update tests/curriculum/legacy-pins.json.`));
    p.mcqAnswers.forEach((ans, i) => { if (ans !== null) t.ok(T.ass[i] && T.ass[i].a === ans, `${id}-q${i}: the correct answer index changed, which flips saved quiz results`); });
  }
  const conceptIds = new Set(a.concepts.map(c => 'c' + hash(c.q)));
  pins.concepts.forEach(h => t.ok(conceptIds.has(h), `a pinned concept flashcard (${h}) was removed or reworded`));
};
