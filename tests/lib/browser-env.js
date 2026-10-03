/* Runs the site's own scripts (meta.js, paths.js, store.js, progress.js) in a Node vm context, with an in-memory
   localStorage and the few site.js helpers progress.js needs. Tests then call the shipped code, not a copy.
   site.js itself needs a DOM (search, glossary pop-ups), so its storage helpers are reproduced here; the logic
   under test (store.js and progress.js) is loaded unchanged. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { site } = require('./util');

function env({ main = {}, cards = {}, today = '2026-10-02' } = {}) {
  const mem = new Map();
  const localStorage = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  const ctx = vm.createContext({ console, localStorage });
  ctx.window = ctx;
  const run = f => vm.runInContext(fs.readFileSync(path.join(site, 'assets/js', f), 'utf8'), ctx, { filename: f });
  run('meta.js'); run('paths.js'); run('store.js');
  vm.runInContext(`(function(){
    const KEYS={main:'pbi-holy-grail-v1',cards:'pbi-holy-grail-cards-v1'};
    Object.assign(PBI,{KEYS,
      today:()=>${JSON.stringify(today)},
      esc:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),
      load:k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch(e){return {}}},
      save:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),
      migrate:PBI.store.migrate,SCHEMA:PBI.store.SCHEMA,
      loadCards:()=>{const st=PBI.load(KEYS.cards);st.srs=st.srs||{};return st}});
  })()`, ctx);
  ctx.localStorage.setItem('pbi-holy-grail-v1', JSON.stringify(main));
  ctx.localStorage.setItem('pbi-holy-grail-cards-v1', JSON.stringify(cards));
  run('progress.js');
  /* the page-level constants live in the context's script scope, so expose them through a helper */
  const g = name => vm.runInContext(name, ctx);
  return { ctx, P: g('PBI.P'), S: g('PBI.store'), PBI: g('PBI'), MODULES: g('MODULES'), STAGES: g('STAGES'), SKILLS: g('SKILLS'),
    SCENARIO_INDEX: g('SCENARIO_INDEX'), CONCEPT_IDS: g('CONCEPT_IDS'), CERTS: g('CERTS'), KEYS: g('PBI.KEYS'),
    set(m, c) { if (m) ctx.localStorage.setItem('pbi-holy-grail-v1', JSON.stringify(m)); if (c) ctx.localStorage.setItem('pbi-holy-grail-cards-v1', JSON.stringify(c)); } };
}
/* curriculum ids as the browser builds them (PBI.knownIds in site.js) */
function known(e) {
  const k = { topics: new Set(e.MODULES.flatMap(m => m.topics.map(t => t.id))) };
  k.cards = new Set([...Object.values(e.CONCEPT_IDS).flat(), ...e.MODULES.flatMap(m => m.topics.flatMap(t => t.cards))]);
  k.scenarios = {};
  e.SCENARIO_INDEX.forEach(s => k.scenarios[s.id] = { rubric: new Set(s.rubric.map(r => r.id)), del: new Set(s.deliverables.map(d => d.id)), hints: s.hints });
  return k;
}
module.exports = { env, known };
