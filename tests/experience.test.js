/* Experience Mode: every scenario is schema-valid, references resolve (people, files, skills, templates,
   scenarios), rubrics add up, answer keys stay out of the scenario bundle, and the key numbers in the
   briefs are recomputed here from the CSVs with independent code (not tools/lib/company-facts.js). */
'use strict';
const fs = require('fs'), path = require('path');
const load = require('../tools/lib/load');
const { validate } = require('./lib/schema');
const csv = require('../tools/lib/csv');
const { root } = require('./lib/util');

module.exports = t => {
  const raw = load.scenarios({ raw: true });
  const all = load.all();
  const S = all.scenarios;
  if (!S.length) { t.warn('no scenarios yet'); return; }
  const sch = n => JSON.parse(fs.readFileSync(path.join(root, 'content/schema', n), 'utf8'));
  const SS = sch('scenario.schema.json'), SOL = sch('scenario-solution.schema.json');
  const people = new Set(all.personas.map(p => p.id).concat(['you']));
  const skills = new Set(all.skills.map(s => s.id));
  const ids = new Set(S.map(s => s.id));
  const tpl = new Set((all.templates || []).map(x => x.id));
  const seenTickets = new Set();

  for (const r of raw) {
    const s = S.find(x => x.id === r.id);
    const where = r._dir;
    const e1 = validate(SS, Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('_')))); t.ok(!e1.length, `${where}/scenario.json: ${e1.slice(0, 4).join('; ')}`);
    t.ok(r._folder === r.slug, `${where}: folder name must equal slug "${r.slug}"`);
    t.ok(r.slug.startsWith(r.id + '-'), `${where}: slug must start with the id`);
    t.ok(!seenTickets.has(r.ticket.id), `${where}: duplicate ticket id ${r.ticket.id}`); seenTickets.add(r.ticket.id);
    if (r._solution) { const e2 = validate(SOL, r._solution); t.ok(!e2.length, `${where}/solution.json: ${e2.slice(0, 4).join('; ')}`); }
    else t.ok(false, `${where}: missing solution.json`);
    t.ok(people.has(r.ticket.reporter), `${where}: unknown reporter "${r.ticket.reporter}"`);
    for (const m of r.messages) { t.ok(people.has(m.from), `${where}: message from unknown person "${m.from}"`); if (m.to) t.ok(people.has(m.to) || /,/.test(m.to), `${where}: message to unknown person "${m.to}"`); }
    for (const k of r.skills) t.ok(skills.has(k), `${where}: unknown skill "${k}"`);
    for (const p of [...(r.prereq || []), ...(r.next ? [r.next] : [])]) t.ok(ids.has(p), `${where}: refers to unknown scenario "${p}"`);
    for (const e of r.earlier || []) t.ok(ids.has(e.scenario) && S.find(x => x.id === e.scenario).decision, `${where}: earlier decision must point at a decision scenario (${e.scenario})`);
    for (const ev of r.evidence) if (ev.kind === 'file') t.ok(fs.existsSync(path.join(root, ev.file)), `${where}: evidence file ${ev.file} does not exist`);
    for (const d of r.deliverables) if (d.artifact && tpl.size) t.ok(tpl.has(d.artifact), `${where}: deliverable "${d.id}" uses unknown template "${d.artifact}"`);
    const w = r.rubric.reduce((a, x) => a + x.w, 0); t.eq(w, 100, `${where}: rubric weights must sum to 100`);
    t.ok(new Set(r.rubric.map(x => x.id)).size === r.rubric.length, `${where}: duplicate rubric id`);
    t.ok(new Set(r.evidence.map(x => x.id)).size === r.evidence.length, `${where}: duplicate evidence id`);
    if (r.type === 'sprint') t.ok(r.hints.length >= 3, `${where}: sprints need at least three progressive hints`);
    t.ok(!!r.impact && r.impact.length > 40, `${where}: say why a real company would care (impact)`);
    /* the brief must not leak the answer: no solution summary sentence inside the scenario */
    if (r._solution) {
      const body = JSON.stringify(Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith('_')))).toLowerCase();
      for (const rc of r._solution.root_cause || []) { const probe = rc.toLowerCase().slice(0, 60); t.ok(!body.includes(probe), `${where}: the brief contains root-cause text from the solution ("${probe}…")`); }
    }
    /* filled text has no leftover placeholders */
    const PH = /\{\{[a-z0-9_]+(\|[a-z0-9]+)?\}\}/i;
    t.ok(!PH.test(JSON.stringify(s)) && !PH.test(JSON.stringify(s._solution || {})), `${where}: unfilled {{placeholder}}`);
  }
  /* the scenario bundle must not contain model answers */
  const bundle = fs.readFileSync(path.join(root, 'assets/js/experience.js'), 'utf8');
  for (const s of S) if (s._solution) t.ok(!bundle.includes(JSON.stringify(s._solution.summary).slice(1, 80)), `assets/js/experience.js contains the model answer for ${s.id}`);

  /* ---------- independent recomputation of headline numbers ---------- */
  const D = n => csv.objects(path.join(root, 'data/experience/company', n + '.csv'));
  const orders = D('orders'), lines = D('order_lines'), returns = D('returns'), fx = D('fx_rates');
  const O = new Map(orders.map(o => [o.OrderID, o]));
  const rate = (cur, m) => cur === 'EUR' ? +fx.find(f => f.Month === m).USDPerUnit : 1;
  const cents = (local, cur, m) => Math.round(Math.round(local * 100) * rate(cur, m));
  const seen = new Set(), clean = [];
  for (const l of lines) { const k = l.OrderID + '|' + l.LineNo; if (!seen.has(k)) { seen.add(k); clean.push(l); } }
  const ok = o => o.Status === 'Completed' && o.CustomerID !== 'C19999';
  const q1 = (d, y) => d >= `${y}-01-01` && d <= `${y}-03-31`;
  const gross = y => clean.reduce((a, l) => { const o = O.get(l.OrderID); return ok(o) && q1(o.OrderDate, y) ? a + cents(Math.round(+l.Qty * +l.UnitPrice * (100 - +l.DiscountPct)) / 100, o.Currency, o.OrderDate.slice(0, 7)) : a; }, 0);
  const F = require('../tools/lib/company-facts').facts();
  t.eq(lines.length - clean.length, 37, 'company pack: exported duplicate lines');
  const g26 = gross(2026), g25 = gross(2025);
  t.ok(Math.abs(g26 - F.q1_2026_gross) <= 2, `independent Q1 2026 gross ${g26} vs facts ${F.q1_2026_gross}`);
  t.ok(Math.abs(g25 - F.q1_2025_gross) <= 2, `independent Q1 2025 gross ${g25} vs facts ${F.q1_2025_gross}`);
  /* Finance net for Q1 2026: posting date, no Staff, returns by return date incl. shipping refunds */
  const fin = clean.reduce((a, l) => { const o = O.get(l.OrderID); return ok(o) && o.Channel !== 'Staff' && q1(o.PostingDate, 2026) ? a + cents(Math.round(+l.Qty * +l.UnitPrice * (100 - +l.DiscountPct)) / 100, o.Currency, o.PostingDate.slice(0, 7)) : a; }, 0)
    - returns.reduce((a, x) => { const o = O.get(x.OrderID); return ok(o) && o.Channel !== 'Staff' && q1(x.ReturnDate, 2026) ? a + cents(+x.RefundAmount, o.Currency, x.ReturnDate.slice(0, 7)) + cents(+x.ShippingRefund, o.Currency, x.ReturnDate.slice(0, 7)) : a; }, 0);
  t.ok(Math.abs(fin - F.fin_net_q1_2026) <= 4, `independent Finance Q1 2026 net ${fin} vs facts ${F.fin_net_q1_2026}`);
  t.eq(F.bridge_sum, F.fin_net_q1_2026 - F.dash_net_q1_2026, 'S02 bridge components sum to the gap');
  t.eq(F.s01_raw + F.s01_bridge_dup + F.s01_bridge_cancel + F.s01_bridge_test, F.q1_2026_gross, 'S01 reconciliation adds up');
  t.ok(F.gap_q1_2026 > 0, 'S02 needs the dashboard to be higher than Finance (the CFO says it is too high)');
  t.ok(F.yoy_jan > F.yoy_feb && F.yoy_feb > F.yoy_mar, 'S01 story: monthly growth must be slowing Jan > Feb > Mar');
};
