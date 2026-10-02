/* Reads everything under content/ into plain objects. Used by tools/build.js and the tests. */
'use strict';
const fs = require('fs'), path = require('path');
const csv = require('./csv');
const root = path.join(__dirname, '..', '..');
const C = (...p) => path.join(root, 'content', ...p);
const readJSON = f => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { throw new Error(`${path.relative(root, f)}: ${e.message}`); }
};
const exists = f => fs.existsSync(f);
const listJSON = dir => exists(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort() : [];

/* skill modules: levels (beginner/intermediate/advanced) and tracks (sql, testing, …) */
function modules() {
  const dir = C('skills');
  return fs.readdirSync(dir).filter(d => exists(path.join(dir, d, '_module.json')))
    .map(d => {
      const m = readJSON(path.join(dir, d, '_module.json'));
      m._dir = path.join('content', 'skills', d);
      m.topicsData = m.topics.map(id => {
        const f = path.join(dir, d, id + '.json');
        if (!exists(f)) throw new Error(`${m._dir}/_module.json lists topic "${id}" but ${id}.json is missing`);
        let t = readJSON(f);
        if (m.kind === 'track') { const { fill } = require('./company-facts'); t = deepFill(t, path.join(m._dir, id + '.json'), fill); }
        t._file = path.join(m._dir, id + '.json'); return t;
      });
      return m;
    })
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'level' ? -1 : 1) || a.order - b.order);
}

function solutions() {
  const out = {};
  for (const f of listJSON(C('solutions'))) {
    let data = readJSON(C('solutions', f));
    if (/\{\{[a-z0-9_]+(\|[a-z0-9]+)?\}\}/i.test(JSON.stringify(data))) { const { fill } = require('./company-facts'); data = deepFill(data, 'content/solutions/' + f, fill); }
    for (const [id, s] of Object.entries(data)) {
      if (out[id]) throw new Error(`duplicate solution id ${id} in content/solutions/${f}`);
      out[id] = Object.assign({ _file: 'content/solutions/' + f }, s);
    }
  }
  return out;
}

/* course datasets: metadata from content/, rows from the generated CSVs */
function datasets() {
  return readJSON(C('datasets', 'datasets.json')).map(d => {
    const { cols, rows } = csv.read(path.join(root, 'data', d.key + '.csv'));
    return Object.assign({}, d, { cols, rows });
  });
}

/* Experience Mode: content/experience/<id>/scenario.json (+ solution.json). {{fact|format}} placeholders
   are filled here from the generated company data, so every consumer sees the same numbers. */
function deepFill(v, where, fill) {
  if (typeof v === 'string') return fill(v, where);
  if (Array.isArray(v)) return v.map((x, i) => deepFill(x, where, fill));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepFill(x, where, fill)]));
  return v;
}
const STAGE_ORDER = ['analyst', 'developer', 'senior', 'engineer', 'architect'];
function scenarios({ raw = false } = {}) {
  const dir = C('experience');
  if (!exists(dir)) return [];
  const { fill } = require('./company-facts');
  return fs.readdirSync(dir).filter(d => exists(path.join(dir, d, 'scenario.json'))).map(d => {
    const base = path.join('content', 'experience', d);
    const s = readJSON(path.join(dir, d, 'scenario.json'));
    const solFile = path.join(dir, d, 'solution.json');
    const sol = exists(solFile) ? readJSON(solFile) : null;
    const out = raw ? s : deepFill(s, base + '/scenario.json', fill);
    out._dir = base; out._folder = d;
    out._solution = sol ? (raw ? sol : deepFill(sol, base + '/solution.json', fill)) : null;
    return out;
  }).sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || a.order - b.order);
}

function optional(rel, fallback) { const f = C(...rel.split('/')); return exists(f) ? readJSON(f) : fallback; }

function all() {
  return {
    modules: modules(),
    solutions: solutions(),
    datasets: datasets(),
    concepts: readJSON(C('flashcards', 'concepts.json')),
    glossary: readJSON(C('glossary', 'glossary.json')),
    roles: readJSON(C('career-paths', 'roles.json')),
    certs: listJSON(C('certifications')).map(f => readJSON(C('certifications', f))).sort((a, b) => (a.order || 0) - (b.order || 0)),
    stages: optional('stages.json', []),
    skills: optional('skills.json', []),
    personas: optional('personas.json', []),
    diagnostic: optional('diagnostic.json', null),
    goals: optional('goals.json', []),
    trackDatasets: optional('datasets/tracks.json', []),
    site: optional('site.json', {}),
    scenarios: scenarios(),
    templates: optional('templates/index.json', []),
    toolkit: require('./toolkit').load(root),
    external: optional('resources/external.json', null),
    root
  };
}

module.exports = { all, modules, solutions, datasets, scenarios, readJSON, root, C };
