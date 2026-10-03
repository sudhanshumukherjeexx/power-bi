/* Learner-facing scores mean what they say (docs/progress-scoring-audit.md). Runs the shipped store.js and
   progress.js against constructed progress and pins the rules: one mastery definition, first answers only as
   verified evidence, outcome separate from independence, stages that need quality as well as completion,
   and certification domains weighted by Microsoft's published weights. */
'use strict';
const { env } = require('./lib/browser-env');
const { weigh, parse } = require('../tools/lib/cert-weights');
const load = require('../tools/lib/load');

module.exports = t => {
  const e = env(), { P, S } = e;
  const near = (a, b) => Math.abs(a - b) < 1e-9;

  /* ---------- mastery: one definition ---------- */
  [[undefined, 0], [{ b: 0 }, 0], [{ b: 1 }, .25], [{ b: 2 }, .5], [{ b: 3 }, .75], [{ b: 4 }, 1], [{ b: 5 }, 1]]
    .forEach(([r, m]) => t.eq(S.mastery(r), m, `mastery of box ${r ? r.b : 'unseen'}`));
  t.eq(S.MASTERED_BOX, 4, 'a card is "mastered" at box 4');

  /* ---------- readiness formula and evidence split ---------- */
  const r = S.readinessFrom({ asg: 4, done: 2, mcq: 4, ok: 4, cards: 4, recall: 1 });
  t.eq(r.pct, Math.round(100 * (.5 * .5 + .25 * 1 + .25 * .25)), 'readiness = 50% self + 25% verified + 25% recall');
  t.eq(r.ev.self, 50, 'self-assessed part reported'); t.eq(r.ev.verified, 100, 'verified part reported'); t.eq(r.ev.recall, 25, 'recall part reported');
  t.eq(S.readinessFrom({ asg: 2, done: 2 }).pct, 100, 'missing parts are re-weighted, not counted as zero');

  /* pick a topic that has assignments, multiple choice and cards */
  const topic = e.MODULES.flatMap(m => m.topics).find(x => x.g.length && x.mcq.some(a => a !== null) && x.cards.length);
  const qi = topic.mcq.findIndex(a => a !== null), qid = `${topic.id}-q${qi}`, right = topic.mcq[qi], wrong = (right + 1) % 4;
  const base = () => S.migrate({ schemaVersion: 3 });

  /* ---------- first answer is the verified evidence ---------- */
  let m = base(); m.quiz[qid] = right; m.quizFirst[qid] = wrong;
  t.eq(P.readiness(topic, m, { srs: {} }).ok, 0, 'changing to the right answer after a wrong first answer is not verified');
  m = base(); m.quiz[qid] = wrong; m.quizFirst[qid] = right;
  t.eq(P.readiness(topic, m, { srs: {} }).ok, 1, 'a right first answer stays verified after later changes');
  const v2 = S.migrate({ schemaVersion: 2, quiz: { [qid]: right } });
  t.eq(v2.quizFirst[qid], right, 'v2 → v3 migration seeds first answers from current answers');
  t.eq(v2.schemaVersion, 3, 'migration stamps schema 3');

  /* ---------- the two readiness implementations agree ---------- */
  const c1 = { srs: Object.fromEntries(topic.cards.map((id, i) => [id, { b: i % 6, d: '2026-10-02' }])) };
  m = base(); topic.g.forEach((_, i) => { if (i % 2 === 0) m.done[`${topic.id}-${i}`] = true; }); m.quizFirst[qid] = right; m.quiz[qid] = right;
  const outline = P.readiness(topic, m, c1);
  const recall = topic.cards.reduce((a, id) => a + S.mastery(c1.srs[id]), 0);
  const direct = S.readinessFrom({ asg: topic.g.length, done: outline.done, mcq: topic.mcq.filter(a => a !== null).length, ok: 1, cards: topic.cards.length, recall });
  t.eq(outline.pct, direct.pct, 'outline readiness uses the shared formula and mastery');

  /* ---------- scenarios: outcome is separate from independence ---------- */
  const scen = e.SCENARIO_INDEX.find(s => s.rubric.length >= 3 && s.hints >= 2);
  const full = Object.fromEntries(scen.rubric.map(x => [x.id, 4]));
  const noHelp = P.scenarioScore(scen, { rub: full, hints: 0 });
  const help = P.scenarioScore(scen, { rub: full, hints: 2, solEarly: true });
  t.eq(noHelp.quality, 100, 'all criteria at 4 = 100% outcome');
  t.eq(help.quality, 100, 'hints and an early reveal do not change the outcome');
  t.eq(help.independence, 100 - 20 - 30, 'independence = 100 − 10 per hint − 30 for an early reveal');
  t.eq(P.independence({ hints: 9 }), 60, 'hint deduction is capped at 40');
  t.eq(P.independence({ hints: 9, solEarly: true }), 30, 'independence floor holds');

  /* ---------- professional stage needs quality, not only completion ---------- */
  const stage = e.STAGES[0];
  const xs = e.SCENARIO_INDEX.filter(s => s.stage === stage.id);
  const topicsOf = e.MODULES.flatMap(mm => mm.topics).filter(x => x.stage === stage.id);
  const allSkill = () => { const mm = base(); topicsOf.forEach(x => { x.g.forEach((_, i) => mm.done[`${x.id}-${i}`] = true); x.mcq.forEach((a, i) => { if (a !== null) { mm.quiz[`${x.id}-q${i}`] = a; mm.quizFirst[`${x.id}-q${i}`] = a; } }); }); return mm; };
  const cardsAll = { srs: Object.fromEntries(topicsOf.flatMap(x => x.cards).map(id => [id, { b: 5, d: '2026-12-01' }])) };
  const finish = (mm, rating) => { xs.forEach(s => mm.xp[s.id] = { st: 'done', done: true, hints: 0, del: {}, rub: Object.fromEntries(s.rubric.map(x => [x.id, rating])) }); return mm; };

  let st = P.stages(finish(allSkill(), 0), cardsAll)[0];
  t.eq(st.completion, 100, 'every stage scenario finished');
  t.eq(st.expPct, 0, 'finished scenarios rated 0 earn no experience credit');
  t.ok(!st.cleared, 'a stage is not cleared by finishing scenarios with no quality');
  t.ok(st.pct <= 50, `stage % with zero-quality scenarios is at most half (got ${st.pct})`);
  t.eq(P.currentStage(finish(allSkill(), 0), cardsAll).id, stage.id, 'the learner stays on the stage');

  st = P.stages(finish(allSkill(), 4), cardsAll)[0];
  t.eq(st.expPct, 100, 'finished scenarios rated 4 earn full experience credit');
  t.ok(st.cleared, 'full skill + all scenarios at top quality clears the stage');
  t.ok(P.currentStage(finish(allSkill(), 4), cardsAll).id !== stage.id, 'and the current stage moves on');

  const partial = allSkill(); finish(partial, 4); delete partial.xp[xs[0].id];
  st = P.stages(partial, cardsAll)[0];
  t.eq(st.completion, Math.round(100 * (xs.length - 1) / xs.length), 'completion counts finished scenarios');
  t.eq(st.cleared, 100 * (xs.length - 1) / xs.length >= P.GATES.completion, `clearing follows the ${P.GATES.completion}% completion gate`);

  /* ---------- certification weights ---------- */
  t.eq(parse('25–30%'), 27.5, 'range → midpoint'); t.eq(parse('15-20%'), 17.5, 'hyphen ranges parse'); t.eq(parse('10%'), 10, 'single values parse');
  t.eq(parse('about a third'), null, 'unparseable weights are rejected');
  for (const c of load.all().certs) for (const v of weigh(c).versions) {
    t.ok(v.areas.every(a => a.wm !== null), `${c.code} ${v.id}: every domain weight parses`);
    t.ok(Math.abs(v.areas.reduce((x, a) => x + a.wn, 0) - 1) < .002, `${c.code} ${v.id}: normalised weights sum to 1`);
  }
  const pl = e.CERTS.find(c => c.code === 'PL-300');
  t.ok(pl.areas.every(a => a.wn) && !near(pl.areas[0].wn, pl.areas[3].wn), 'PL-300 domains carry different weights');
  /* tick every assignment in the smallest-weight domain only */
  const small = pl.areas.reduce((a, b) => (b.wn < a.wn ? b : a));
  m = base(); e.MODULES.flatMap(mm => mm.topics).filter(x => small.topics.includes(x.id)).forEach(x => x.g.forEach((_, i) => m.done[`${x.id}-${i}`] = true));
  const R = P.cert(pl, m, { srs: {} });
  const areaCov = R.areas.map(a => a.coverage);
  const expect = Math.round(R.areas.reduce((x, a) => x + a.wn * a.coverage, 0) / R.areas.reduce((x, a) => x + a.wn, 0));
  t.eq(R.coverage, expect, 'coverage is the weighted mean of domain coverage');
  t.ok(R.weighted, 'certification uses published weights');
  t.ok(R.coverage < Math.round(areaCov.reduce((a, b) => a + b, 0) / areaCov.length) || areaCov.every(x => x === areaCov[0]), 'covering only the lightest domain scores below the unweighted mean');

  /* ---------- competency keeps evidence types apart ---------- */
  const onlyCards = { srs: Object.fromEntries(e.MODULES.flatMap(mm => mm.topics.flatMap(x => x.cards)).map(id => [id, { b: 4, d: '2026-12-01' }])) };
  const comp = P.competency(base(), onlyCards);
  const withCards = comp.filter(c => c.ev.cards[1]);
  t.ok(withCards.length > 0 && withCards.every(c => c.types.recall > 0 && !c.types.verified && !c.types.self), 'mastered cards show as recall evidence only');
  t.ok(comp.every(c => c.selfShare === 0), 'no self-assessed share when nothing was ticked');
  const ticked = P.competency(finish(allSkill(), 2), { srs: {} });
  t.ok(ticked.some(c => c.selfShare > 0), 'ticked work shows a self-assessed share');
};
