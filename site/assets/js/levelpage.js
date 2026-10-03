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
const PAGES=kind==='level'?levels.map(L=>({id:L.id,name:L.name,cls:L.cls})):tracks.map(T=>({id:T.id,name:T.name,cls:T.cls}));
const i=PAGES.findIndex(p=>p.id===page);
const seg=`<nav class="seg${kind==='track'?' scroll':''}" aria-label="${kind==='level'?'Levels':'Tracks'}">${PAGES.map(p=>`<a href="${p.id}.html"${p.id===page?' aria-current="page"':''}><span class="dot" style="background:var(--${p.cls})"></span>${esc(p.name)}</a>`).join('')}</nav>`;
const prev=PAGES[i-1],next=PAGES[i+1];
const pager=`<div class="pager">${prev?`<a href="${prev.id}.html"><span>← Previous</span>${esc(prev.name)}</a>`:`<a href="learn.html"><span>← Back</span>All levels and tracks</a>`}${next?`<a class="next" href="${next.id}.html"><span>Next →</span>${esc(next.name)}</a>`:`<a class="next" href="experience.html"><span>Next →</span>Practise real work</a>`}</div>`;
const crumbs=`<nav class="crumbs" aria-label="Breadcrumb"><a href="learn.html">Learn</a><span aria-hidden="true">/</span>${kind==='track'?'<a href="learn.html#tracks">Tracks</a><span aria-hidden="true">/</span>':''}<span aria-current="page">${esc(mod?mod.name:'Resources')}</span></nav>`;

/* ---------- external resource catalog (assets/js/external.js) ---------- */
const TIER={official:'Official',specialist:'Specialist',community:'Community','third-party':'Third party',book:'Book'};
function extItem(x){
  const rel=[...x.l.map(l=>`<a href="${l[1]}">${esc(l[2])}</a>`),...x.s.map(s=>`<a href="${s[1]}">${esc(s[2])}</a>`)];
  return `<li data-x="${esc((x.t+' '+x.d+' '+x.sn).toLowerCase())}" data-src="${x.src}" data-stage="${x.stage}"><a href="${esc(x.u)}" rel="noopener" target="_blank" class="ext">${esc(x.t)}</a><span class="xm"><span class="tier ${x.src}">${TIER[x.src]}</span>${x.cost==='paid'?'<span class="tier paid">Paid</span>':''}<span class="chip">${esc(x.sn)}</span></span><span class="d">${esc(x.d)}</span>${rel.length?`<span class="rel">Use it with: ${rel.join(' · ')}</span>`:''}</li>`;
}
function extSection(){
  if(typeof EXTERNAL==='undefined')return '';
  const d=new Date(EXTERNAL.verified+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  const stages=[...new Map(EXTERNAL.items.map(x=>[x.stage,x.sn])).entries()];
  return `<section class="sect" id="external"><h2>External resources</h2>
    <p class="muted" style="max-width:70ch">${esc(EXTERNAL.intro)} <span class="verified">Checked ${d}</span></p>
    <div class="xfilters"><label><span class="vh">Search external resources</span><input type="search" id="xq" placeholder="Search: DAX, folding, RLS, Direct Lake, Git…" autocomplete="off"></label>
      <label><span>Source</span><select id="xsrc"><option value="">Any</option>${Object.entries(TIER).filter(([k])=>EXTERNAL.items.some(x=>x.src===k)).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
      <label><span>Stage</span><select id="xstage"><option value="">Any</option>${stages.map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
      <span class="small muted" id="xcount" aria-live="polite"></span></div>
    <div class="xcats">${EXTERNAL.cats.map(([id,name])=>{const its=EXTERNAL.items.filter(x=>x.c===id);return `<details class="xcat" data-cat="${id}"><summary>${esc(name)} <span class="n">${its.length}</span></summary><ul>${its.map(extItem).join('')}</ul></details>`}).join('')}</div>
    <p class="small muted">Something outdated or missing? <a href="https://github.com/sudhanshumukherjeexx/power-bi/issues">Open an issue</a>. More curated guides: the <a href="toolkit.html">BI Developer Toolkit</a>.</p>
  </section>`;
}
function initExternal(){
  const q=document.getElementById('xq');if(!q)return;
  const src=document.getElementById('xsrc'),st=document.getElementById('xstage'),count=document.getElementById('xcount');
  const run=()=>{
    const words=q.value.toLowerCase().split(/s+/).filter(Boolean),active=words.length||src.value||st.value;let n=0;
    document.querySelectorAll('.xcat').forEach(cat=>{let k=0;cat.querySelectorAll('li').forEach(li=>{const ok=words.every(w=>li.dataset.x.includes(w)||cat.querySelector('summary').textContent.toLowerCase().includes(w))&&(!src.value||li.dataset.src===src.value)&&(!st.value||li.dataset.stage===st.value);li.hidden=!ok;if(ok)k++});cat.hidden=!k;cat.querySelector('.n').textContent=k;if(active)cat.open=k>0;n+=k});
    count.textContent=active?`${n} of ${EXTERNAL.items.length} shown`:`${EXTERNAL.items.length} resources`;
  };
  q.addEventListener('input',run);src.addEventListener('change',run);st.addEventListener('change',run);run();
}
if(page==='resources'){
  const trackFiles=typeof TRACK_DATA!=='undefined'?Object.entries(TRACK_DATA):[];
  const tpls=typeof TEMPLATES!=='undefined'?TEMPLATES:[];
  const tools=[
    ['flashcards.html','cards|Interview flashcards','Plain-English cards with spaced repetition.'],
    ['flashcards.html#mock','clock|Mock interview','Timed questions, answered out loud.'],
    ['glossary.html','book|Glossary',`${GLOSSARY.length} terms explained without jargon.`],
    ['cheatsheet.html','printer|Cheat sheets','Printable, one per level.'],
    ['templates.html','folder|Professional templates','Requirements, ADR, incident report, postmortem and more.'],
    ['diagnostic.html','flask|Diagnostic','Find your starting point in a few minutes.'],
    ['learn.html#paths','compass|Pick your path','Analyst, Developer, Engineer or Lead.'],
    ['learn.html#certs','cap|Certification map','PL-300 and DP-600, current outline.'],
    ['progress.html','activity|Your progress','Stage, competencies, portfolio evidence and decision log.']];
  const jumps=[['tools','Study tools'],['glossary','Glossary'],...(tpls.length?[['templates','Templates']]:[]),['cheatsheets','Cheat sheets'],...(typeof EXTERNAL!=='undefined'?[['external','External resources']]:[]),['starter','Starter project'],['datasets','Datasets'],...(trackFiles.length?[['trackdata','Track files']]:[]),['enterprise','Enterprise pack']];
  const gcats=[...new Set(GLOSSARY.map(g=>g.c))];
  const gloss=gcats.map(c=>{const ts=GLOSSARY.filter(g=>g.c===c).sort((a,b)=>a.t.localeCompare(b.t));return `<details><summary>${esc(c)} <span class="n">${ts.length}</span></summary><div class="rterms">${ts.map(g=>`<a href="glossary.html#${PBI.slug(g.t)}" title="${esc(g.d.length>140?g.d.slice(0,140)+'…':g.d)}">${esc(g.t)}</a>`).join('')}</div></details>`}).join('');
  app.innerHTML=`<nav class="crumbs" aria-label="Breadcrumb"><a href="toolkit.html">Toolkit</a><span aria-hidden="true">/</span><span aria-current="page">Library</span></nav><section class="intro"><h1>Library</h1><p>Everything you look things up in: the glossary, professional templates, printable cheat sheets, a curated catalog of external resources, a ready-made Power BI project and the practice datasets. The troubleshooting guides, field manuals and playbooks are in the rest of the <a href="toolkit.html">Toolkit</a>.</p></section>
  <div class="ctl-lbl">On this page</div>
  <nav class="jump wrapjump" aria-label="Sections on this page">${jumps.map(([id,n])=>`<a href="#${id}">${n}</a>`).join('')}</nav>
  <section class="sect" id="tools"><h2>Study tools</h2><div class="tools">${tools.map(([h,t,d])=>{const [ic,lbl]=t.split('|');return `<a href="${h}"><b><svg class="ic" aria-hidden="true" focusable="false"><use href="assets/icons/icons.svg#${ic}"/></svg> ${esc(lbl)}</b><span>${esc(d)}</span></a>`}).join('')}</div></section>
  <section class="sect" id="glossary"><h2>Glossary</h2>
    <p class="muted" style="max-width:70ch">${GLOSSARY.length} Power BI and data terms in plain English, grouped by subject. Open a group and pick a term, or <a href="glossary.html">open the full glossary</a> to search every definition.</p>
    <div class="rgloss">${gloss}</div>
  </section>
  ${tpls.length?`<section class="sect" id="templates"><h2>Professional templates</h2>
    <p class="muted" style="max-width:70ch">The documents BI teams write at work. Read one on the <a href="templates.html">templates page</a> or download the Markdown and fill it in.</p>
    <div class="tools">${tpls.map(t=>`<a href="templates.html#tpl-${esc(t.id)}"><b>${esc(t.title)}</b><span>${esc(t.summary)}</span></a>`).join('')}</div>
  </section>`:''}
  <section class="sect" id="cheatsheets"><h2>Cheat sheets</h2>
    <p class="muted" style="max-width:70ch">One printable page per level with the patterns you reach for most. Print or save as PDF from the cheat sheet page.</p>
    <div class="tools">${levels.map(L=>`<a href="cheatsheet.html#${L.id}"><b><span class="dot" style="background:var(--${L.cls})"></span>${esc(L.name)}</b><span>${L.topics.length} topics on one printable page.</span></a>`).join('')}<a href="cheatsheet.html"><b>All levels</b><span>Every sheet, ready to print.</span></a></div>
  </section>
  ${extSection()}
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
  <section class="sect" id="enterprise"><h2>Enterprise scale pack</h2><p class="muted" style="max-width:70ch">Small data teaches the logic; big data teaches the design. Generate 100 thousand to 50 million realistic sales rows on your own machine (skewed customers, late arrivals, duplicates, several currencies, slowly changing customers) with Node.js: <code>node tools/generate-enterprise-data.js --rows 1000000</code>. See <a href="https://github.com/sudhanshumukherjeexx/power-bi/blob/main/docs/enterprise-data.md">the guide</a> for what each size teaches.</p></section>`;
  document.getElementById('dataUrl').textContent=new URL('data/',location.href).href;
  document.addEventListener('click',e=>{if(e.target.closest('#copyDataUrl'))Course.copyText(document.getElementById('dataUrl').textContent,'Data address copied')});
  initExternal();
  PBI.touch('Library');
}else if(mod){
  const L=mod;
  const tag=kind==='level'?L.years:(L.tag||'Track');
  app.innerHTML=`${crumbs}<section class="intro"><h1><span class="hl">${esc(L.name)}</span> <span class="tag ${esc(L.cls)}">${esc(tag)}</span></h1><p>${esc(L.intro)}</p>${L.setup?`<div class="setup"><b>Before you start</b> ${esc(L.setup)}</div>`:''}</section>${seg}
  <div class="stats" id="stats"></div>
  <div class="ctl-lbl">Topics</div>
  <nav class="jump" aria-label="Topics on this page">${L.topics.map(T=>`<a href="#${T.id}">${esc(T.name.split(':')[0])}<span class="p" data-jp="${T.id}"></span></a>`).join('')}</nav>
  <div id="topics">${L.topics.map(Course.topicHtml).join('')}</div>${pager}`;
  const stats=()=>{
    let done=0,asg=0,ok=0,mcq=0,recall=0,cards=0,pct=0;
    L.topics.forEach(T=>{const r=PBI.readiness(T,state,Course.cardState);done+=r.done;asg+=r.asg;ok+=r.ok;mcq+=r.mcq;recall+=r.recall;cards+=r.cards;pct+=r.pct;const j=document.querySelector(`[data-jp="${T.id}"]`);if(j)j.textContent=r.pct+'%'});
    document.getElementById('stats').innerHTML=`<div class="stat ok"><b>${Math.round(pct/L.topics.length)}%</b><span>${kind} readiness</span></div><div class="stat"><b>${done}/${asg}</b><span>assignments ticked · self-assessed</span></div><div class="stat"><b>${ok}/${mcq}</b><span>quiz right first time · verified</span></div><div class="stat"><b>${cards?Math.round(100*recall/cards):0}%</b><span>flashcard recall</span></div>`;
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
