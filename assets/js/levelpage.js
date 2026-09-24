/* Builds beginner.html, intermediate.html, advanced.html and resources.html from content.js.
   The page is chosen by <body data-page="...">. Progress is shared with the course page via course.js. */
(function(){
'use strict';
const page=document.body.dataset.page;
const esc=Course.esc,state=Course.state;
const app=document.getElementById('app');
const PAGES=[...LEVELS.map(L=>({id:L.id,name:L.name,cls:L.cls})),{id:'resources',name:'Resources',cls:'yellow'}];
const i=PAGES.findIndex(p=>p.id===page);
const seg=`<nav class="seg" aria-label="Course sections">${PAGES.map(p=>`<a href="${p.id}.html"${p.id===page?' aria-current="page"':''}><span class="dot" style="background:var(--${p.cls})"></span>${p.name}</a>`).join('')}</nav>`;
const prev=PAGES[i-1],next=PAGES[i+1];
const pager=`<div class="pager">${prev?`<a href="${prev.id}.html"><span>← Previous</span>${prev.name}</a>`:`<a href="index.html"><span>← Back</span>Course overview</a>`}${next?`<a class="next" href="${next.id}.html"><span>Next →</span>${next.name}</a>`:`<a class="next" href="flashcards.html"><span>Next →</span>Interview flashcards</a>`}</div>`;

if(page==='resources'){
  app.innerHTML=`<section class="intro"><h1><span class="hl">Resources</span> <span class="tag res">Tools &amp; data</span></h1><p>Everything you need beside the lessons: study tools you can use without Power BI, a ready-made Power BI project, and the 14 practice datasets.</p></section>${seg}
  <section class="sect" id="tools"><h2>Study tools</h2><div class="tools">
    <a href="flashcards.html"><b>🃏 Interview flashcards</b><span>188 plain-English cards with spaced repetition.</span></a>
    <a href="flashcards.html#mock"><b>⏱ Mock interview</b><span>Timed questions, answered out loud.</span></a>
    <a href="glossary.html"><b>📖 Glossary</b><span>${GLOSSARY.length} terms explained without jargon.</span></a>
    <a href="cheatsheet.html"><b>🖨 Cheat sheets</b><span>Printable, one per level.</span></a>
    <a href="index.html#paths"><b>🧭 Pick your path</b><span>Analyst, Developer, Engineer or Lead.</span></a>
    <a href="index.html#certs"><b>🎓 Certification map</b><span>PL-300 and DP-600 coverage.</span></a>
  </div></section>
  <section class="sect" id="starter"><h2>Starter Power BI project</h2>
    <p class="muted" style="max-width:70ch">Want to skip ahead to DAX? This Power BI project has 12 clean tables loaded, typed and related in a star schema, with DimDate marked as the date table. The Beginner modeling topic asks you to build this model yourself, so use the starter only to skip ahead. RawOrdersExport and SurveyWide aren't included: cleaning them is part of the Power Query topics.</p>
    <div class="tools">
      <div class="stat" style="padding:14px 16px"><b style="font-size:1rem;margin-bottom:4px">1. Download and unzip</b><span style="font-family:var(--sans);font-size:.88rem;color:var(--ink-2)">Unzip into <code>C:\\PowerBI\\</code> so the data sits at <code>C:\\PowerBI\\northwind-starter\\data\\</code>.</span><div style="margin-top:10px"><a class="btn primary" href="starter/northwind-starter.zip" download>Download starter (.zip)</a></div></div>
      <div class="stat" style="padding:14px 16px"><b style="font-size:1rem;margin-bottom:4px">2. Open and refresh</b><span style="font-family:var(--sans);font-size:.88rem;color:var(--ink-2)">Open <code>Northwind Starter.pbip</code> in Power BI Desktop (2024 or later) and click <b>Refresh</b>. You get 12 tables and 11 relationships (ShipDate → DimDate is inactive, ready for USERELATIONSHIP), with no measures, because writing those is your job.</span></div>
      <div class="stat" style="padding:14px 16px"><b style="font-size:1rem;margin-bottom:4px">Unzipped somewhere else?</b><span style="font-family:var(--sans);font-size:.88rem;color:var(--ink-2)">Transform data → Edit parameters → <b>DataFolder</b>. Paste your folder path (ending in <code>\\</code>), or this site's data address:</span><div class="urlbox"><code id="dataUrl"></code><button class="btn sm" type="button" id="copyDataUrl">Copy</button></div></div>
    </div>
  </section>
  <section class="sect" id="datasets"><h2>Datasets</h2>
    <p class="muted" style="max-width:70ch">One coherent fictional company, <b>Northwind Outdoors</b>, sells outdoor gear across four regions. All tables join to each other, so any assignment can grow into a full model. Every table is 100 rows or fewer. Use <b>Copy CSV</b> then paste into Excel (save as .csv) or straight into Power BI Desktop via Get Data → Enter Data → paste, or use <b>Download .csv</b>.</p>
    <div class="dsgrid">${Course.datasetsGridHtml()}</div>
    <div>${Course.datasetsListHtml()}</div>
  </section>${pager}`;
  document.getElementById('dataUrl').textContent=new URL('data/',location.href).href;
  document.addEventListener('click',e=>{if(e.target.closest('#copyDataUrl'))Course.copyText(document.getElementById('dataUrl').textContent,'Data address copied')});
}else{
  const L=LEVELS.find(l=>l.id===page);
  app.innerHTML=`<section class="intro"><h1><span class="hl">${L.name}</span> <span class="tag ${L.cls}">${L.years}</span></h1><p>${esc(L.intro)}</p></section>${seg}
  <div class="stats" id="stats"></div>
  <div class="ctl-lbl">Topics in this level</div>
  <nav class="jump" aria-label="Topics in this level">${L.topics.map(T=>`<a href="#${T.id}">${esc(T.name.split(':')[0])}<span class="p" data-jp="${T.id}"></span></a>`).join('')}</nav>
  <div id="topics">${L.topics.map(Course.topicHtml).join('')}</div>${pager}`;
  const stats=()=>{
    let done=0,asg=0,ok=0,mcq=0,learned=0,cards=0,pct=0;
    L.topics.forEach(T=>{const r=PBI.readiness(T,state,Course.cardState);done+=r.done;asg+=r.asg;ok+=r.ok;mcq+=r.mcq;learned+=r.learned;cards+=r.cards;pct+=r.pct;const j=document.querySelector(`[data-jp="${T.id}"]`);if(j)j.textContent=r.pct+'%'});
    document.getElementById('stats').innerHTML=`<div class="stat ok"><b>${Math.round(pct/L.topics.length)}%</b><span>level readiness</span></div><div class="stat"><b>${done}/${asg}</b><span>assignments done</span></div><div class="stat"><b>${ok}/${mcq}</b><span>quiz correct</span></div><div class="stat"><b>${learned}/${cards}</b><span>topic cards learned</span></div>`;
  };
  stats();Course.onChange(stats);
  Course.updateScores();Course.updateReadiness();
  Course.linkTerms(document.getElementById('topics'));
}
PBI.initThemeToggles(next=>{state.theme=next;Course.save()});
Course.scrollToHash();
Course.goHash();
})();
