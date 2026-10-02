/* Builds every Skill Mode module page (levels: beginner/intermediate/advanced, tracks: sql, testing, …)
   and resources.html from content. The page is chosen by <body data-page="...">. Progress is shared with
   the rest of the site through course.js. */
(function(){
'use strict';
const page=document.body.dataset.page;
const esc=Course.esc,state=Course.state;
const app=document.getElementById('app');
const levels=typeof LEVELS!=='undefined'?LEVELS:[],tracks=typeof TRACKS!=='undefined'?TRACKS:[];
const mod=[...levels,...tracks].find(m=>m.id===page);
const kind=mod?(levels.includes(mod)?'level':'track'):'level';
const PAGES=kind==='level'?[...levels.map(L=>({id:L.id,name:L.name,cls:L.cls})),{id:'resources',name:'Resources',cls:'yellow'}]:tracks.map(T=>({id:T.id,name:T.name,cls:T.cls}));
const i=PAGES.findIndex(p=>p.id===page);
const seg=`<nav class="seg${kind==='track'?' scroll':''}" aria-label="${kind==='level'?'Levels':'Tracks'}">${PAGES.map(p=>`<a href="${p.id}.html"${p.id===page?' aria-current="page"':''}><span class="dot" style="background:var(--${p.cls})"></span>${esc(p.name)}</a>`).join('')}</nav>`;
const prev=PAGES[i-1],next=PAGES[i+1];
const pager=`<div class="pager">${prev?`<a href="${prev.id}.html"><span>← Previous</span>${esc(prev.name)}</a>`:`<a href="learn.html"><span>← Back</span>All levels and tracks</a>`}${next?`<a class="next" href="${next.id}.html"><span>Next →</span>${esc(next.name)}</a>`:`<a class="next" href="experience.html"><span>Next →</span>Practise real work</a>`}</div>`;
const crumbs=`<nav class="crumbs" aria-label="Breadcrumb"><a href="learn.html">Learn</a><span aria-hidden="true">/</span>${kind==='track'?'<a href="learn.html#tracks">Tracks</a><span aria-hidden="true">/</span>':''}<span aria-current="page">${esc(mod?mod.name:'Resources')}</span></nav>`;

if(page==='resources'){
  const trackFiles=typeof TRACK_DATA!=='undefined'?Object.entries(TRACK_DATA):[];
  app.innerHTML=`${crumbs}<section class="intro"><h1><span class="hl">Resources</span> <span class="tag res">Tools &amp; data</span></h1><p>Everything you need beside the lessons: study tools you can use without Power BI, a ready-made Power BI project, the practice datasets and the professional templates.</p></section>${seg}
  <section class="sect" id="tools"><h2>Study tools</h2><div class="tools">
    <a href="flashcards.html"><b>🃏 Interview flashcards</b><span>Plain-English cards with spaced repetition.</span></a>
    <a href="flashcards.html#mock"><b>⏱ Mock interview</b><span>Timed questions, answered out loud.</span></a>
    <a href="glossary.html"><b>📖 Glossary</b><span>${GLOSSARY.length} terms explained without jargon.</span></a>
    <a href="cheatsheet.html"><b>🖨 Cheat sheets</b><span>Printable, one per level.</span></a>
    <a href="templates.html"><b>🗂 Professional templates</b><span>Requirements, ADR, incident report, postmortem and more.</span></a>
    <a href="learn.html#certs"><b>🎓 Certification map</b><span>PL-300 and DP-600, current outline.</span></a>
  </div></section>
  <section class="sect" id="starter"><h2>Starter Power BI project</h2>
    <p class="muted" style="max-width:70ch">Want to skip ahead to DAX? This Power BI project has 12 clean tables loaded, typed and related in a star schema, with DimDate marked as the date table. The Beginner modeling topic asks you to build this model yourself, so use the starter only to skip ahead. RawOrdersExport and SurveyWide aren't included: cleaning them is part of the Power Query topics.</p>
    <div class="tools">
      <div class="stat" style="padding:14px 16px"><b style="font-size:1rem;margin-bottom:4px">1. Download and unzip</b><span style="font-family:var(--sans);font-size:.88rem;color:var(--ink-2)">Unzip into <code>C:\\PowerBI\\</code> so the data sits at <code>C:\\PowerBI\\northwind-starter\\data\\</code>.</span><div style="margin-top:10px"><a class="btn primary" href="starter/northwind-starter.zip" download>Download starter (.zip)</a></div></div>
      <div class="stat" style="padding:14px 16px"><b style="font-size:1rem;margin-bottom:4px">2. Open and refresh</b><span style="font-family:var(--sans);font-size:.88rem;color:var(--ink-2)">Open <code>Northwind Starter.pbip</code> in Power BI Desktop (2024 or later) and click <b>Refresh</b>. You get 12 tables and 11 relationships (ShipDate → DimDate is inactive, ready for USERELATIONSHIP), with no measures, because writing those is your job.</span></div>
      <div class="stat" style="padding:14px 16px"><b style="font-size:1rem;margin-bottom:4px">Unzipped somewhere else?</b><span style="font-family:var(--sans);font-size:.88rem;color:var(--ink-2)">Transform data → Edit parameters → <b>DataFolder</b>. Paste your folder path (ending in <code>\\</code>), or this site's data address:</span><div class="urlbox"><code id="dataUrl"></code><button class="btn sm" type="button" id="copyDataUrl">Copy</button></div></div>
    </div>
  </section>
  <section class="sect" id="datasets"><h2>Course datasets</h2>
    <p class="muted" style="max-width:70ch">One coherent fictional company, <b>Northwind Outdoors</b>, sells outdoor gear across four regions. All tables join to each other, so any assignment can grow into a full model. Every table is 100 rows or fewer, so you can check results by eye. Use <b>Copy CSV</b> then paste into Excel (save as .csv) or straight into Power BI Desktop via Get Data → Enter Data → paste, or use <b>Download .csv</b>.</p>
    <div class="dsgrid">${Course.datasetsGridHtml()}</div>
    <div>${Course.datasetsListHtml()}</div>
  </section>
  ${trackFiles.length?`<section class="sect" id="trackdata"><h2>Track and scenario files</h2><p class="muted" style="max-width:70ch">Larger or specialised files used by the SQL, warehousing, testing and automation tracks. They are generated from a fixed seed by <code>tools/generate-data.js</code>, so everyone gets identical numbers.</p><div class="dsgrid">${trackFiles.map(([k,d])=>`<a href="${esc(d.file)}" download>${esc(d.name)}<span>${esc(d.desc||'')}</span></a>`).join('')}</div></section>`:''}
  <section class="sect" id="enterprise"><h2>Enterprise scale pack</h2><p class="muted" style="max-width:70ch">Small data teaches the logic; big data teaches the design. Generate 100 thousand to 50 million realistic sales rows on your own machine (skewed customers, late arrivals, duplicates, several currencies, slowly changing customers) with Node.js: <code>node tools/generate-enterprise-data.js --rows 1000000</code>. See <a href="https://github.com/sudhanshumukherjeexx/power-bi/blob/main/docs/enterprise-data.md">the guide</a> for what each size teaches.</p></section>
  ${pager}`;
  document.getElementById('dataUrl').textContent=new URL('data/',location.href).href;
  document.addEventListener('click',e=>{if(e.target.closest('#copyDataUrl'))Course.copyText(document.getElementById('dataUrl').textContent,'Data address copied')});
  PBI.touch('Resources');
}else if(mod){
  const L=mod;
  const tag=kind==='level'?L.years:(L.tag||'Track');
  app.innerHTML=`${crumbs}<section class="intro"><h1><span class="hl">${esc(L.name)}</span> <span class="tag ${esc(L.cls)}">${esc(tag)}</span></h1><p>${esc(L.intro)}</p>${L.setup?`<div class="setup"><b>Before you start</b> ${esc(L.setup)}</div>`:''}</section>${seg}
  <div class="stats" id="stats"></div>
  <div class="ctl-lbl">Topics</div>
  <nav class="jump" aria-label="Topics on this page">${L.topics.map(T=>`<a href="#${T.id}">${esc(T.name.split(':')[0])}<span class="p" data-jp="${T.id}"></span></a>`).join('')}</nav>
  <div id="topics">${L.topics.map(Course.topicHtml).join('')}</div>${pager}`;
  const stats=()=>{
    let done=0,asg=0,ok=0,mcq=0,learned=0,cards=0,pct=0;
    L.topics.forEach(T=>{const r=PBI.readiness(T,state,Course.cardState);done+=r.done;asg+=r.asg;ok+=r.ok;mcq+=r.mcq;learned+=r.learned;cards+=r.cards;pct+=r.pct;const j=document.querySelector(`[data-jp="${T.id}"]`);if(j)j.textContent=r.pct+'%'});
    document.getElementById('stats').innerHTML=`<div class="stat ok"><b>${Math.round(pct/L.topics.length)}%</b><span>${kind} readiness</span></div><div class="stat"><b>${done}/${asg}</b><span>assignments done</span></div><div class="stat"><b>${ok}/${mcq}</b><span>quiz correct</span></div><div class="stat"><b>${learned}/${cards}</b><span>topic cards learned</span></div>`;
  };
  stats();Course.onChange(stats);
  Course.updateScores();Course.updateReadiness();
  Course.linkTerms(document.getElementById('topics'));
  if(!/:/.test(location.hash))PBI.touch(L.name);
}else{
  app.innerHTML='<section class="intro"><h1>Page not found</h1><p><a href="learn.html">See all levels and tracks</a>.</p></section>';
}
PBI.initThemeToggles(next=>{state.theme=next;Course.save()});
Course.scrollToHash();
Course.goHash();
})();
