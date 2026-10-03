/* Imported progress files are untrusted (docs/security-audit.md). Runs the shipped store.js sanitiser against
   hostile and malformed files: script URLs, other origins, prototype-pollution keys, wrong types, oversized
   strings, unknown fields, unknown ids, wrong app id and future versions. */
'use strict';
const { env, known } = require('./lib/browser-env');

module.exports = t => {
  const e = env(), S = e.S, K = e.KEYS, kn = known(e);
  const scen = e.SCENARIO_INDEX[0], topic = e.MODULES[0].topics[0];
  const file = (main, cards = {}, extra = {}) => Object.assign({ app: 'power-bi-holy-grail', version: 3, exported: '2026-10-01T10:00:00.000Z', data: { [K.main]: main, [K.cards]: cards } }, extra);
  const imp = (main, cards, extra, k = kn) => S.sanitizeProgress(file(main, cards, extra), K, k);
  const rejects = (payload, why) => { let threw = false; try { S.sanitizeProgress(payload, K, kn); } catch (err) { threw = err instanceof S.ImportError; } t.ok(threw, `rejected: ${why}`); };

  /* ---------- safe internal links ---------- */
  const bad = ['javascript:alert(1)', 'JAVASCRIPT:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'https://evil.example/', 'http://evil.example/x.html',
    '//evil.example/x.html', '/power-bi/index.html', '../index.html', 'experience/../../x.html', 'beginner.html" onmouseover="x', 'beginner.html#a"b', 'vbscript:x', 'x.html\\@evil', 'javascript:x//y.html', '', null, 42, {}];
  bad.forEach(h => t.eq(S.safeHref(h), null, `safeHref rejects ${JSON.stringify(h)}`));
  ['index.html', 'beginner.html#b-dax:asg:0', 'experience/s04-monday-performance-incident.html', 'toolkit/whats-broken.html#refresh', 'flashcards.html#deck=concepts&cat=DAX']
    .forEach(h => t.eq(S.safeHref(h), h, `safeHref keeps ${h}`));

  /* ---------- a clean round trip keeps everything ---------- */
  const good = {
    schemaVersion: 3, done: { [`${topic.id}-0`]: true }, quiz: { [`${topic.id}-q0`]: 1 }, quizFirst: { [`${topic.id}-q0`]: 2 }, sol: {}, navOpen: {}, theme: 'dark', path: null, goal: null,
    diag: { ans: { 0: 1 }, at: '2026-09-30T08:00:00.000Z', rec: { label: 'Intermediate', href: 'intermediate.html', level: 'intermediate', topic: null }, score: 7 },
    xp: { [scen.id]: { st: 'done', started: '2026-09-01T10:00:00.000Z', updated: '2026-09-02T10:00:00.000Z', doneAt: '2026-09-02T10:00:00.000Z', done: true, hints: 1, sol: true, solEarly: false,
      del: { [scen.deliverables[0].id]: true }, rub: { [scen.rubric[0].id]: 3 }, notes: 'Found the duplicate keys.' } },
    seen: { 'beginner.html': '2026-09-30' }, last: { href: `experience/${scen.slug}.html`, title: 'Resume here', at: '2026-09-30T08:00:00.000Z' }
  };
  const cardId = [...kn.cards][0];
  let r = imp(good, { srs: { [cardId]: { b: 3, d: '2026-10-05', n: 4, l: '2026-09-28' } }, deck: 'concepts', mockN: 10 });
  t.eq(r.dropped.length, 0, 'a well-formed file drops nothing');
  t.eq(JSON.stringify(r.main.xp[scen.id].rub), JSON.stringify({ [scen.rubric[0].id]: 3 }), 'rubric ratings survive');
  t.eq(r.main.xp[scen.id].notes, 'Found the duplicate keys.', 'notes survive');
  t.eq(r.main.quizFirst[`${topic.id}-q0`], 2, 'first answers survive');
  t.eq(r.main.last.href, `experience/${scen.slug}.html`, 'a safe Continue link survives');
  t.eq(r.cards.srs[cardId].b, 3, 'flashcard boxes survive');
  t.eq(r.version, 3, 'version reported'); t.eq(r.exported, '2026-10-01T10:00:00.000Z', 'export date reported');

  /* ---------- hostile links never reach storage ---------- */
  r = imp(Object.assign({}, good, { last: { href: 'javascript:alert(document.domain)', title: 'x', at: '2026-09-30T08:00:00.000Z' } }));
  t.eq(r.main.last, null, 'a javascript: Continue link is removed');
  t.ok(r.dropped.some(p => p.startsWith('last')), 'and reported as dropped');
  r = imp(Object.assign({}, good, { diag: Object.assign({}, good.diag, { rec: { label: 'x', href: 'https://evil.example/' } }) }));
  t.eq(r.main.diag.rec, null, 'an external diagnostic link is removed, the diagnostic kept');
  r = imp(Object.assign({}, good, { seen: { 'https://evil.example/a.html': '2026-09-30', 'beginner.html': '2026-09-30' } }));
  t.eq(Object.keys(r.main.seen).join(), 'beginner.html', 'only internal pages are kept in visit history');

  /* ---------- prototype pollution ---------- */
  const polluted = JSON.parse(`{"schemaVersion":3,"__proto__":{"polluted":true},"done":{"__proto__":{"polluted":true},"${topic.id}-0":true},"quiz":{"__proto__":1},"xp":{"__proto__":{"done":true}},"constructor":{"prototype":{"polluted":true}}}`);
  r = imp(polluted, JSON.parse('{"srs":{"__proto__":{"b":5,"d":"2026-01-01"}}}'));
  const realm = require('vm').runInContext('Object.getPrototypeOf({})', e.ctx);
  t.ok(({}).polluted === undefined && realm.polluted === undefined, 'Object.prototype is untouched (test and page realms)');
  t.ok(Object.getPrototypeOf(r.main.done) === realm && Object.getPrototypeOf(r.main.xp) === realm, 'stored maps keep a plain prototype');
  t.eq(r.main.done[`${topic.id}-0`], true, 'the legitimate entry next to __proto__ survives');
  t.ok(!Object.keys(r.main).includes('constructor'), 'a top-level "constructor" field is dropped');

  /* ---------- types, ranges, lengths, unknown fields, unknown ids ---------- */
  r = imp({ done: { [`${topic.id}-0`]: 'yes', [`${topic.id}-1`]: true }, quiz: { [`${topic.id}-q0`]: 12, [`${topic.id}-q1`]: 1.5 }, theme: 'neon', goal: '<img src=x onerror=alert(1)>', admin: true,
    xp: { [scen.id]: { done: true, hints: 1e9, rub: { [scen.rubric[0].id]: 9, nope: 2 }, notes: 'x'.repeat(60000), del: { [scen.deliverables[0].id]: 'true' }, html: '<script>' }, zzz: { done: true }, s99: { done: true } } },
    { srs: { [cardId]: { b: '4', d: '2026-10-05' }, cBAD$: { b: 1, d: '2026-10-05' } }, deck: 'everything', mockN: 1000, cat: '<b>' });
  t.eq(r.main.done[`${topic.id}-0`], undefined, 'non-boolean ticks are dropped'); t.eq(r.main.done[`${topic.id}-1`], true, 'valid ticks are kept');
  t.eq(Object.keys(r.main.quiz).length, 0, 'out-of-range and fractional answers are dropped');
  t.eq(r.main.theme, null, 'unknown theme values are dropped'); t.eq(r.main.goal, null, 'markup in an id field is dropped');
  t.ok(!('admin' in r.main), 'unknown top-level fields are dropped');
  const x = r.main.xp[scen.id];
  t.ok(x.hints <= scen.hints, 'hints are capped at the scenario\'s hint count'); t.eq(Object.keys(x.rub).length, 0, 'invalid ratings and unknown criteria are dropped');
  t.eq(x.notes, '', 'oversized notes are dropped'); t.eq(Object.keys(x.del).length, 0, 'non-boolean deliverables are dropped'); t.ok(!('html' in x), 'unknown scenario fields are dropped');
  t.ok(!('zzz' in r.main.xp) && !('s99' in r.main.xp), 'scenarios that do not exist are dropped');
  t.eq(Object.keys(r.cards.srs).length, 0, 'flashcard records with wrong types or ids are dropped');
  t.ok(!('deck' in r.cards) && !('mockN' in r.cards) && !('cat' in r.cards), 'invalid flashcard settings are dropped');
  t.ok(r.dropped.length >= 15, `every dropped entry is counted (${r.dropped.length})`);
  r = imp({ done: { 'not-a-topic-0': true } });
  t.eq(Object.keys(r.main.done).length, 0, 'ticks for topics that do not exist are dropped');

  /* ---------- whole-file rejections: nothing is written ---------- */
  rejects(null, 'not an object'); rejects([], 'an array'); rejects('{}', 'a string');
  rejects(file(good, {}, { app: 'other-app' }), 'another app');
  rejects(file(good, {}, { version: 99 }), 'a newer version'); rejects(file(good, {}, { version: '3' }), 'a non-integer version');
  rejects({ app: 'power-bi-holy-grail', version: 3 }, 'no data'); rejects({ app: 'power-bi-holy-grail', version: 3, data: {} }, 'empty data');
  rejects(file([]), 'progress section is an array'); rejects(file({ xp: [] }), '"xp" is an array'); rejects(file({ done: 'all' }), '"done" is a string');
  rejects(file({}, { srs: [] }), '"srs" is an array');

  /* ---------- older files still import ---------- */
  r = S.sanitizeProgress({ app: 'power-bi-holy-grail', data: { [K.main]: { done: { [`${topic.id}-0`]: true }, quiz: { [`${topic.id}-q0`]: 1 } } } }, K, kn);
  t.eq(r.version, 1, 'a file without a version is version 1');
  t.eq(r.main.quizFirst[`${topic.id}-q0`], 1, 'a v1 file gets first answers from its answers');
  t.eq(r.main.schemaVersion, 3, 'and is migrated to schema 3');
  r = S.sanitizeProgress(file(good), K, undefined);
  t.ok(r.main.xp[scen.id] && r.main.done[`${topic.id}-0`], 'without curriculum ids, pattern checks still accept valid data');

  /* ---------- comparison counts ---------- */
  const sum = S.summary(r.main, { srs: { a: {}, b: {} } });
  t.eq(sum.assignments, 1, 'summary counts ticked assignments'); t.eq(sum.scenariosDone, 1, 'summary counts finished scenarios'); t.eq(sum.cards, 2, 'summary counts reviewed cards');
};
