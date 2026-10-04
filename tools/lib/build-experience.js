/* Experience Mode outputs:
   assets/js/experience.js   SCENARIOS: briefs, evidence, tasks, hints and rubrics (no answers)
   assets/js/xp/<id>.js      the model answer for one scenario, loaded only when the learner asks for it
   experience/<slug>.html    one page per scenario (title and description for search engines) */
'use strict';
const P = require('./partials');
const SR = require('./static-render');

const strip = s => { const o = Object.assign({}, s); for (const k of Object.keys(o)) if (k.startsWith('_')) delete o[k]; return o; };

function page(s, stageName, all) {
  const kind = { incident: 'Incident', change: 'Change request', review: 'Review', decision: 'Decision', uat: 'UAT', ticket: 'Ticket' }[s.ticket.kind] || 'Ticket';
  const title = `${s.title}: ${s.type === 'drill' ? 'BI drill' : 'Power BI scenario'} (${s.ticket.id}) · The Power BI Fellowship`;
  const description = s.seo || `${kind} ${s.ticket.id} for the ${stageName} stage: ${s.summary}`;
  const scripts = ['meta', 'experience', 'glossary', 'external', 'store', 'site', 'progress', 'xp'];
  const url = `experience/${s.slug}.html`;
  const jsonld = [P.crumbsLd([['Experience', 'experience.html'], [`Stage: ${stageName}`, `experience.html#stage-${s.stage}`], [s.ticket.id, url]]),
    { '@type': 'LearningResource', name: s.title, description, url: P.site.url + url, learningResourceType: s.type === 'drill' ? 'Exercise' : 'Simulation', educationalLevel: stageName, timeRequired: `PT${s.minutes}M`, inLanguage: 'en', isAccessibleForFree: true, isPartOf: { '@type': 'Course', name: P.site.name, url: P.site.url } }];
  return `${P.head({ title, description, path: url, r: '../', jsonld })}
<body data-root="../" data-scenario="${s.id}">
<a class="skip" href="#app">Skip to content</a>
<!--nav:practice-->
${P.nav('practice', '../')}
<!--/nav-->
<main class="wrap xpwrap" id="app" tabindex="-1">
${SR.scenario(s, all)}
</main>
${P.footer('../')}
${scripts.map(x => `<script src="../assets/js/${x}.js"></script>`).join('\n')}
</body>
</html>
`;
}

module.exports = (all, { BANNER, J }) => {
  const out = {};
  const S = all.scenarios || [];
  out['assets/js/experience.js'] = BANNER('content/experience/<id>/scenario.json (placeholders filled from the company data)') +
    `/* Experience Mode scenarios. Model answers are NOT here: they live in assets/js/xp/<id>.js and load on request. */\n` +
    `const SCENARIOS={\n${S.map(s => J(s.id) + ':' + J(strip(s))).join(',\n')}\n};\n`;
  for (const s of S) {
    if (s._solution) out[`assets/js/xp/${s.id}.js`] = BANNER(`content/experience/${s._folder}/solution.json`) +
      `(window.XP_SOLUTIONS=window.XP_SOLUTIONS||{})[${J(s.id)}]=${J(s._solution)};\n`;
    const st = all.stages.find(x => x.id === s.stage);
    out[`experience/${s.slug}.html`] = page(s, st ? st.name : s.stage, all);
  }
  return out;
};
