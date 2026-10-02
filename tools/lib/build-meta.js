/* assets/js/meta.js: the small index every page can afford to load. Stages, competencies, goals, personas,
   the diagnostic, and a compact outline of every module and topic (enough to compute progress, competency
   and "continue" without loading the full course content). */
'use strict';
const path = require('path'), fs = require('fs');
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };

module.exports = (all, { BANNER, list, J }) => {
  const modules = all.modules.map(m => ({
    id: m.id, kind: m.kind, name: m.name, cls: m.cls, tag: m.years || m.tag || '', tagline: m.tagline || '', order: m.order,
    topics: m.topicsData.map(T => ({
      id: T.id, name: T.name, skills: T.skills || [], stage: T.stage || null,
      g: T.asg.map(a => a.guidance || 'A'),
      as: T.asg.map(a => a.skills || null),
      t: T.asg.map(a => a.t),
      mcq: T.ass.map(q => q.type === 'mcq' ? q.a : null),
      cards: T.int.map(q => 't' + hash(q.q)),
      v: T.verified ? T.verified.date : null
    }))
  }));
  const conceptIds = {};
  all.concepts.forEach(c => (conceptIds[c.c] = conceptIds[c.c] || []).push('c' + hash(c.q)));

  const scenarioIndex = all.scenarios ? all.scenarios.map(s => ({
    id: s.id, slug: s.slug, title: s.title, type: s.type, stage: s.stage, kind: s.ticket.kind, ticket: s.ticket && s.ticket.id, severity: s.ticket && s.ticket.severity,
    summary: s.summary, skills: s.skills || [], minutes: s.minutes, prereq: s.prereq || [], next: s.next || null,
    deliverables: (s.deliverables || []).map(d => ({ id: d.id, t: d.t, artifact: d.artifact || null })),
    rubric: (s.rubric || []).map(r => ({ id: r.id, w: r.w })), hints: (s.hints || []).length, decision: !!s.decision
  })) : [];

  const out = {};
  out['assets/js/meta.js'] = BANNER('content/stages.json, skills.json, goals.json, personas.json, diagnostic.json and the module outlines') +
    list('STAGES', all.stages) +
    list('SKILLS', all.skills) +
    list('GOALS', all.goals) +
    list('PERSONAS', all.personas) +
    `const DIAGNOSTIC=${J(all.diagnostic)};\n` +
    list('MODULES', modules) +
    `const CONCEPT_IDS=${J(conceptIds)};\n` +
    list('SCENARIO_INDEX', scenarioIndex) +
    list('TEMPLATE_INDEX', (all.templates || []).map(t => ({ id: t.id, title: t.title, summary: t.summary, used: t.used || [] })));
  return out;
};
