/* Fast-moving content (Fabric, Service, certifications, scenario platform facts) carries a verification date.
   This warns, without failing, when a review is due, so the weekly CI run surfaces it. */
'use strict';
const load = require('../tools/lib/load');
const { today } = require('./lib/util');
const fs = require('fs'), path = require('path');

module.exports = t => {
  const a = load.all();
  const now = today();
  const due = (v, label) => {
    if (!v || !v.date) return;
    t.ok(/^\d{4}-\d{2}-\d{2}$/.test(v.date) && v.date <= now, `${label}: verified date ${v.date} is invalid or in the future`);
    const days = v.review_after_days || 180;
    const next = new Date(Date.parse(v.date) + days * 86400000).toISOString().slice(0, 10);
    if (next < now) t.warn(`${label}: last verified ${v.date}, review was due ${next}. Re-check against the official docs and update "verified".`);
  };
  a.modules.forEach(m => m.topicsData.forEach(T => due(T.verified, T.id)));
  a.certs.forEach(c => due(c.verified, c.code));
  const xp = path.join(load.root, 'content/experience');
  if (fs.existsSync(xp)) for (const d of fs.readdirSync(xp)) {
    const f = path.join(xp, d, 'scenario.json');
    if (fs.existsSync(f)) due(JSON.parse(fs.readFileSync(f, 'utf8')).verified, 'scenario ' + d);
  }
  t.ok(true);
};
