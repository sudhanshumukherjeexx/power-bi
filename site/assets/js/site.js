/* Shared behaviour for every page: storage, spaced repetition, readiness, search,
   glossary pop-ups, progress export/import, install prompt and offline support.
   Pages load their data files (content.js, cards.js, glossary.js…) before this file. */
(function(){
'use strict';
/* storage keys keep the product's original name on purpose: renaming them would lose every learner's progress */
const KEYS={main:'pbi-holy-grail-v1',cards:'pbi-holy-grail-cards-v1'};
const KEY_BACKUP='pbi-holy-grail-backup-v1';
/* store.js (loaded first) adds PBI.store: schema, migration, safe links, mastery, readiness, import validation */
const PBI=window.PBI=Object.assign(window.PBI||{},{KEYS});
const ST=PBI.store;
/* pages in a sub-folder (experience/) set <body data-root="../"> so links resolve from the site root */
PBI.ROOT=(document.body&&document.body.dataset.root)||'';
const pad2=n=>String(n).padStart(2,'0');

/* ---------- small helpers ---------- */
PBI.esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
PBI.hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(36)};
PBI.slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
PBI.today=()=>{const d=new Date();return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())};
PBI.addDays=(iso,n)=>{const [y,m,d]=iso.split('-').map(Number);const t=new Date(y,m-1,d+n);return t.getFullYear()+'-'+pad2(t.getMonth()+1)+'-'+pad2(t.getDate())};
PBI.load=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){return {}}};
PBI.save=(key,val)=>{try{localStorage.setItem(key,JSON.stringify(val))}catch(e){}};
/* read-modify-write, so two open tabs don't overwrite each other's fields */
PBI.update=(key,fn)=>{const st=PBI.load(key);const r=fn(st);PBI.save(key,r||st);return r||st};

/* ---------- progress schema (rules in store.js): v1 course ticks, quiz, solutions, theme → v2 goal, diagnostic,
   Experience Mode, recent activity → v3 first quiz answers. Fields are only ever added, never renamed. ---------- */
PBI.SCHEMA=ST.SCHEMA;
PBI.migrate=ST.migrate;
(function(){const raw=PBI.load(KEYS.main);if(raw.schemaVersion!==PBI.SCHEMA)PBI.save(KEYS.main,PBI.migrate(raw))})();
/* remember where the learner was, for "Continue" on the home page */
PBI.touch=(title,href)=>{
  const base=document.body.dataset.root||'';
  const here=PBI.safeHref(href||(location.pathname.split('/').slice(base?-2:-1).join('/')+location.hash));
  if(!here)return;
  PBI.update(KEYS.main,st=>{PBI.migrate(st);st.last={href:here,title:String(title||document.title).slice(0,200),at:new Date().toISOString()};st.seen[here.split('#')[0]]=PBI.today();return st});
};
PBI.toast=msg=>{let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(PBI.toast._t);PBI.toast._t=setTimeout(()=>t.classList.remove('show'),1800)};
PBI.cardId={concept:q=>'c'+PBI.hash(q),topic:q=>'t'+PBI.hash(q)};
/* zero-result searches are the clearest signal of what's missing. Analytics never sees them; instead the learner can
   choose to suggest the topic in a prefilled GitHub issue (they see and edit it before anything is sent). */
PBI.REPO='https://github.com/sudhanshumukherjeexx/power-bi';
PBI.gapLink=(q,where)=>{const t='Content gap: '+String(q).slice(0,80);const b='I searched '+where+' for:\n\n> '+String(q).slice(0,200)+'\n\nand found nothing useful.\n\nWhat I was trying to do:\n\n';
  return `<a class="gaplink" href="${PBI.REPO}/issues/new?labels=content-gap&title=${encodeURIComponent(t)}&body=${encodeURIComponent(b)}" rel="noopener" target="_blank">Suggest “${PBI.esc(String(q).slice(0,60))}” for the site</a>`};

/* ---------- spaced repetition (Leitner boxes, day intervals) ---------- */
const SRS=PBI.SRS={
  INTERVALS:[0,1,3,7,14,30],
  rec:(st,id)=>st.srs&&st.srs[id],
  isNew:(st,id)=>!SRS.rec(st,id),
  isDue:(st,id)=>{const r=SRS.rec(st,id);return !r||r.d<=PBI.today()},
  grade(st,id,ok){
    st.srs=st.srs||{};const r=st.srs[id]||{b:0,n:0};
    const b=ok?Math.min(r.b+1,SRS.INTERVALS.length-1):0;
    st.srs[id]={b,d:PBI.addDays(PBI.today(),ok?SRS.INTERVALS[b]:0),n:(r.n||0)+1,l:PBI.today()};
    return st.srs[id];
  },
  label(st,id){
    const r=SRS.rec(st,id);if(!r)return {cls:'new',txt:'New'};
    if(r.b===0)return {cls:'again',txt:'Review again'};
    if(r.b>=ST.MASTERED_BOX)return {cls:'known',txt:'Mastered'};
    const days=Math.round((new Date(r.d)-new Date(PBI.today()))/86400000);
    return {cls:'learning',txt:days<=0?'Due today':days===1?'Due tomorrow':'Due in '+days+' days'};
  }
};
/* card state, migrating the first version's known/again marks */
PBI.loadCards=()=>{
  const st=PBI.load(KEYS.cards);
  if(!st.srs&&(st.known||st.again)){
    st.srs={};const t=PBI.today();
    Object.keys(st.known||{}).forEach(id=>st.srs[id]={b:1,d:PBI.addDays(t,1),n:1,l:t});
    Object.keys(st.again||{}).forEach(id=>st.srs[id]={b:0,d:t,n:1,l:t});
    delete st.known;delete st.again;PBI.save(KEYS.cards,st);
  }
  st.srs=st.srs||{};return st;
};

/* ---------- readiness per topic (full course content; progress.js does the same from the compact outline).
   Formula and evidence types are in store.js: assignments 50% (self-assessed), first multiple-choice
   answers 25% (verified), flashcard mastery 25% (recall). ---------- */
PBI.readiness=(T,main,cards)=>{
  const done=T.asg.filter((_,i)=>main.done&&main.done[T.id+'-'+i]).length;
  const mcq=T.ass.map((q,i)=>({q,id:T.id+'-q'+i})).filter(x=>x.q.type==='mcq');
  const ok=mcq.filter(x=>ST.mcqOk(main,x.id,x.q.a)).length;
  const ids=T.int.map(q=>PBI.cardId.topic(q.q));
  const recall=ids.reduce((a,id)=>a+PBI.mastery(cards.srs&&cards.srs[id]),0);
  return PBI.readinessFrom({asg:T.asg.length,done,mcq:mcq.length,ok,cards:ids.length,recall});
};

/* ---------- theme switch: any element with [data-theme-toggle] (top-right on every page) ---------- */
PBI.themeToggleHtml='<button class="themetoggle" type="button" role="switch" data-theme-toggle aria-checked="false" aria-label="Dark theme"><span class="tt-track"><svg class="tt-ic tt-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="tt-ic tt-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><span class="tt-knob"><svg class="k-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="k-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></span></span></button>';
PBI.initThemeToggles=onChange=>{
  const root=document.documentElement,mq=matchMedia('(prefers-color-scheme: dark)');
  const saved=PBI.load(KEYS.main).theme;if(saved)root.setAttribute('data-theme',saved);
  document.querySelectorAll('[data-theme-toggle-slot]').forEach(s=>{if(!s.querySelector('[data-theme-toggle]'))s.innerHTML=PBI.themeToggleHtml});
  const isDark=()=>{const c=root.getAttribute('data-theme');return c?c==='dark':mq.matches};
  const sync=()=>document.querySelectorAll('[data-theme-toggle]').forEach(b=>{const d=isDark();b.setAttribute('aria-checked',d);b.title=d?'Switch to light theme':'Switch to dark theme'});
  document.addEventListener('click',e=>{
    if(!e.target.closest('[data-theme-toggle]'))return;
    const next=isDark()?'light':'dark';root.setAttribute('data-theme',next);
    const st=PBI.load(KEYS.main);st.theme=next;PBI.save(KEYS.main,st);
    if(onChange)onChange(next);sync();
  });
  mq.addEventListener('change',sync);sync();
};
PBI.initTheme=()=>PBI.initThemeToggles();

/* ---------- progress export / import ----------
   Import never trusts the file: store.js rebuilds both stores from a whitelist, the learner compares the file
   with this browser before anything is replaced, and the current progress is kept as a backup first. */
PBI.exportProgress=()=>{
  const payload={app:ST.APP,version:ST.EXPORT_VERSION,schemaVersion:PBI.SCHEMA,exported:new Date().toISOString(),data:{}};
  Object.values(KEYS).forEach(k=>payload.data[k]=PBI.load(k));
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='power-bi-progress-'+PBI.today()+'.json';
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
  PBI.toast('Progress file saved');
};
/* curriculum ids on this page, so entries for lessons or scenarios that don't exist are dropped */
PBI.knownIds=()=>{
  const k={};
  if(typeof MODULES!=='undefined'){k.topics=new Set(MODULES.flatMap(m=>m.topics.map(t=>t.id)));
    if(typeof CONCEPT_IDS!=='undefined')k.cards=new Set([...Object.values(CONCEPT_IDS).flat(),...MODULES.flatMap(m=>m.topics.flatMap(t=>t.cards))])}
  if(typeof SCENARIO_INDEX!=='undefined'){k.scenarios={};SCENARIO_INDEX.forEach(s=>k.scenarios[s.id]={rubric:new Set(s.rubric.map(r=>r.id)),del:new Set(s.deliverables.map(d=>d.id)),hints:s.hints})}
  return k;
};
/* one backup slot: the progress as it was before the last import, reset or restore */
PBI.backup=reason=>{try{localStorage.setItem(KEY_BACKUP,JSON.stringify({at:new Date().toISOString(),reason,main:PBI.load(KEYS.main),cards:PBI.load(KEYS.cards)}))}catch(e){}};
PBI.backupInfo=()=>{try{const b=JSON.parse(localStorage.getItem(KEY_BACKUP)||'null');if(!b||typeof b!=='object')return null;
  const r=ST.sanitizeProgress({app:ST.APP,version:ST.EXPORT_VERSION,data:{[KEYS.main]:b.main||{},[KEYS.cards]:b.cards||{}}},KEYS,PBI.knownIds());
  return {at:typeof b.at==='string'?b.at:'',reason:['import','reset','restore'].includes(b.reason)?b.reason:'import',main:r.main,cards:r.cards,sum:ST.summary(r.main,r.cards)}}catch(e){return null}};
PBI.restoreBackup=()=>{const b=PBI.backupInfo();if(!b)return false;PBI.backup('restore');PBI.save(KEYS.main,b.main);PBI.save(KEYS.cards,b.cards);return true};
const fmtDate=iso=>{if(!iso)return 'unknown date';const d=new Date(iso);return isNaN(d)?'unknown date':d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})+(iso.length>10?', '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}):'')};
PBI.fmtDate=fmtDate;
function compareDialog(res){
  const cur=ST.summary(PBI.load(KEYS.main),PBI.load(KEYS.cards)),imp=ST.summary(res.main,res.cards);
  const rows=[['Assignments ticked','assignments'],['Quiz questions answered','quiz'],['Scenarios started','scenarios'],['Scenarios finished','scenariosDone'],['Scenarios with notes','notes'],['Flashcards reviewed','cards']];
  const dlg=document.createElement('dialog');dlg.className='dlg';dlg.setAttribute('aria-labelledby','impH');
  dlg.innerHTML=`<form method="dialog"><h2 id="impH">Replace this browser's progress?</h2>
<p class="small muted">The file was exported ${PBI.esc(fmtDate(res.exported))}. Importing replaces everything below; it does not merge.</p>
<div class="tblscroll"><table class="tbl"><thead><tr><th scope="col"></th><th scope="col" class="num">Import file</th><th scope="col" class="num">This browser now</th></tr></thead><tbody>${rows.map(([l,k])=>`<tr><th scope="row">${l}</th><td class="num">${imp[k]}</td><td class="num">${cur[k]}</td></tr>`).join('')}</tbody></table></div>
${res.dropped.length?`<p class="small">${res.dropped.length} unknown or invalid entr${res.dropped.length===1?'y':'ies'} in the file will be ignored.</p>`:''}
<p class="small">This browser's current progress is kept as a backup. You can put it back from <b>Progress → Restore previous progress</b>.</p>
<div class="row"><button class="btn primary" value="replace">Replace</button><button class="btn" value="cancel" autofocus>Cancel</button></div></form>`;
  document.body.appendChild(dlg);
  dlg.addEventListener('close',()=>{
    if(dlg.returnValue==='replace'){PBI.backup('import');PBI.save(KEYS.main,res.main);PBI.save(KEYS.cards,res.cards);PBI.toast('Progress imported');setTimeout(()=>location.reload(),600)}
    dlg.remove();
  });
  dlg.showModal();
}
PBI.importProgress=()=>{
  const inp=document.createElement('input');inp.type='file';inp.accept='application/json,.json';
  inp.addEventListener('change',()=>{
    const f=inp.files&&inp.files[0];if(!f)return;
    if(f.size>5e6){PBI.toast('That file is too large to be a progress file');return}
    const rd=new FileReader();
    rd.onload=()=>{
      let res;
      try{res=ST.sanitizeProgress(JSON.parse(rd.result),KEYS,PBI.knownIds())}
      catch(e){PBI.toast(e instanceof ST.ImportError?'Not imported: '+e.message:'Not imported: the file is not valid JSON');return}
      compareDialog(res);
    };
    rd.readAsText(f);
  });
  inp.click();
};

/* ---------- glossary: tap-to-define terms ---------- */
let matchers=null;
function buildMatchers(){
  if(matchers||typeof GLOSSARY==='undefined')return matchers||[];
  const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  matchers=[];
  GLOSSARY.forEach(g=>{
    if(g.nolink)return;
    [g.t,...(g.k||[])].forEach(name=>{
      const caps=name===name.toUpperCase();
      matchers.push({slug:PBI.slug(g.t),len:name.length,re:new RegExp('(^|[^A-Za-z0-9_])('+esc(name)+')(?![A-Za-z0-9_])',caps?'':'i')});
    });
  });
  matchers.sort((a,b)=>b.len-a.len);
  return matchers;
}
const SKIP='code,pre,button,a,summary,label,h1,h2,h3,h4,input,textarea,.term,.opts,.nolink';
/* scopeSel: each scope links a term at most once. blockSel: where to look inside a scope. */
PBI.linkTerms=(root,scopeSel,blockSel)=>{
  const ms=buildMatchers();if(!ms.length||!root)return;
  const scopes=scopeSel?root.querySelectorAll(scopeSel):[root];
  scopes.forEach(scope=>{
    const used=new Set();
    scope.querySelectorAll(blockSel).forEach(block=>{
      const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&n.parentElement.closest(SKIP)?NodeFilter.FILTER_REJECT:(/\S/.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT)});
      const queue=[];while(walker.nextNode())queue.push(walker.currentNode);
      while(queue.length){
        const node=queue.shift();const txt=node.nodeValue;
        for(const m of ms){
          if(used.has(m.slug))continue;
          const hit=m.re.exec(txt);if(!hit)continue;
          const start=hit.index+hit[1].length,word=hit[2];
          const after=node.splitText(start);const rest=after.splitText(word.length);
          const b=document.createElement('button');b.type='button';b.className='term';b.dataset.g=m.slug;b.textContent=word;
          after.replaceWith(b);used.add(m.slug);queue.unshift(rest);queue.unshift(node);
          break;
        }
      }
    });
  });
};
function glossaryEntry(slug){return (typeof GLOSSARY!=='undefined')&&GLOSSARY.find(g=>PBI.slug(g.t)===slug)}
function initPopover(){
  const pop=document.createElement('div');pop.className='gpop';pop.hidden=true;pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Glossary definition');
  pop.innerHTML='<button class="gpop-x" type="button" aria-label="Close">×</button><div class="gpop-c"></div><div class="gpop-t"></div><div class="gpop-d"></div><div class="gpop-s"></div><a class="gpop-link" href="#">Open in glossary →</a>';
  document.body.appendChild(pop);
  let owner=null;
  const close=()=>{pop.hidden=true;if(owner)owner.setAttribute('aria-expanded','false');owner=null};
  const open=(btn,g)=>{
    owner=btn;btn.setAttribute('aria-expanded','true');
    pop.querySelector('.gpop-c').textContent=g.c;
    pop.querySelector('.gpop-t').textContent=g.t;
    pop.querySelector('.gpop-d').textContent=g.d;
    const see=(g.s||[]).filter(Boolean);
    pop.querySelector('.gpop-s').innerHTML=see.length?'See also: '+see.map(s=>`<a href="${PBI.ROOT}glossary.html#${PBI.slug(s)}">${PBI.esc(s)}</a>`).join(', '):'';
    pop.querySelector('.gpop-link').href=PBI.ROOT+'glossary.html#'+PBI.slug(g.t);
    pop.hidden=false;
    if(innerWidth<=600){pop.classList.add('sheet');pop.style.left=pop.style.top='';}
    else{
      pop.classList.remove('sheet');
      const r=btn.getBoundingClientRect(),w=Math.min(360,innerWidth-24);
      pop.style.width=w+'px';
      let left=Math.max(12,Math.min(r.left,innerWidth-w-12));
      let top=r.bottom+8;const h=pop.offsetHeight;
      if(top+h>innerHeight-12&&r.top-h-8>12)top=r.top-h-8;
      pop.style.left=left+'px';pop.style.top=top+'px';
    }
    pop.querySelector('.gpop-x').focus({preventScroll:true});
  };
  document.addEventListener('click',e=>{
    const t=e.target.closest('.term');
    if(t){e.preventDefault();e.stopPropagation();const g=glossaryEntry(t.dataset.g);if(!g)return;if(owner===t){close();return}open(t,g);return}
    if(!pop.hidden&&!e.target.closest('.gpop'))close();
    if(e.target.closest('.gpop-x')){const o=owner;close();if(o)o.focus()}
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden){const o=owner;close();if(o)o.focus()}});
  /* iOS fires resize when the address bar collapses, so only react to real width changes */
  let lastW=innerWidth;addEventListener('resize',()=>{if(innerWidth!==lastW){lastW=innerWidth;close()}});
  document.addEventListener('scroll',()=>{if(!pop.hidden&&!pop.classList.contains('sheet'))close()},{passive:true});
}

/* ---------- search across everything ----------
   The index (assets/js/search-index.js, generated) is loaded on first use so pages stay light.
   Entries are [type, title, sub, text, href, facet]; facet is a level, track or stage id. */
let index=null,loading=null;
function loadIndex(){
  if(index)return Promise.resolve(index);
  if(loading)return loading;
  loading=new Promise((res,rej)=>{
    if(typeof SEARCH_INDEX!=='undefined')return res();
    const s=document.createElement('script');s.src=PBI.ROOT+'assets/js/search-index.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);
  }).then(()=>{index=SEARCH_INDEX.map(([type,title,sub,text,href,facet])=>({type,title,sub,text,href:PBI.ROOT+href,facet:facet||'',lt:title.toLowerCase(),lx:(title+' '+sub+' '+text).toLowerCase()}));return index});
  return loading;
}
const TYPES=[['All','All'],['Topic','Topics'],['Assignment','Assignments'],['Scenario','Scenarios'],['Interview','Interview'],['Flashcard','Flashcards'],['Glossary','Glossary'],['Toolkit','Toolkit'],['Template','Templates'],['Certification','Certification'],['Dataset','Datasets']];
const GROUP={Page:'Topic',Assessment:'Interview',Drill:'Scenario',Track:'Topic',Level:'Topic'};
function runSearch(q,type,facet){
  const toks=q.toLowerCase().split(/\s+/).filter(Boolean);if(!toks.length&&!facet)return [];
  const res=[];
  for(const it of index||[]){
    if(type!=='All'&&it.type!==type&&GROUP[it.type]!==type)continue;
    if(facet&&it.facet!==facet&&!it.facet.split(' ').includes(facet))continue;
    let s=0,okAll=true;
    for(const t of toks){if(!it.lx.includes(t)){okAll=false;break}s+=it.lt.includes(t)?10:1}
    if(!okAll)continue;
    if(toks.length&&it.lt===toks.join(' '))s+=60;
    if(toks.length&&it.lt.startsWith(toks[0]))s+=15;
    if(['Topic','Page','Glossary','Scenario','Level','Track','Toolkit'].includes(it.type))s+=4;
    res.push([s,it]);
  }
  return res.sort((a,b)=>b[0]-a[0]).slice(0,60).map(r=>r[1]);
}
function hl(text,toks){let h=PBI.esc(text);toks.forEach(t=>{if(t.length<2)return;h=h.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>')});return h}
function snippet(it,toks){
  const lt=it.text.toLowerCase();let i=-1;for(const t of toks){i=lt.indexOf(t);if(i>=0)break}
  if(i<0)return it.text.slice(0,120)+(it.text.length>120?'…':'');
  const s=Math.max(0,i-50);return (s?'…':'')+it.text.slice(s,s+140)+(s+140<it.text.length?'…':'');
}
function initSearch(){
  const box=document.createElement('div');box.className='srch';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Search');
  box.innerHTML=`<div class="srch-box"><div class="srch-head"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="search" id="srchInput" placeholder="Search lessons, scenarios, cards, glossary…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" aria-label="Search" aria-controls="srchRes"><button class="btn sm" type="button" id="srchClose">Close</button></div><div class="srch-filters"><div class="srch-types" role="group" aria-label="Type of result">${TYPES.map(([t,l])=>`<button type="button" data-st="${t}" aria-pressed="${t==='All'}">${l}</button>`).join('')}</div><label class="srch-facet"><span class="vh">Where</span><select id="srchFacet" aria-label="Limit to a level, track or stage"><option value="">Anywhere</option></select></label></div><div class="srch-res" id="srchRes" aria-live="polite"></div><div class="srch-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div>`;
  document.body.appendChild(box);
  const inp=box.querySelector('#srchInput'),out=box.querySelector('#srchRes'),fsel=box.querySelector('#srchFacet');let type='All',sel=0,items=[],last=null;
  const fillFacets=()=>{if(fsel.options.length>1||typeof SEARCH_FACETS==='undefined')return;fsel.insertAdjacentHTML('beforeend',SEARCH_FACETS.map(g=>`<optgroup label="${PBI.esc(g.g)}">${g.items.map(([v,l])=>`<option value="${v}">${PBI.esc(l)}</option>`).join('')}</optgroup>`).join(''))};
  const render=()=>{
    const q=inp.value.trim(),facet=fsel.value;
    if(!index){out.innerHTML='<div class="srch-empty">Loading the search index…</div>';loadIndex().then(()=>{fillFacets();render()}).catch(()=>{out.innerHTML='<div class="srch-empty">Search needs the site files. Reload the page while online once.</div>'});return}
    items=(q||facet)?runSearch(q,type,facet):[];sel=0;
    const toks=q.toLowerCase().split(/\s+/).filter(Boolean);
    if(!q&&!facet){out.innerHTML='<div class="srch-empty">Try <b>CALCULATE</b>, <b>refresh failed</b>, <b>RLS</b>, <b>SCD type 2</b>, <b>window function</b> or <b>postmortem</b>.</div>';return}
    if(!items.length){out.innerHTML=`<div class="srch-empty">Nothing matches “${PBI.esc(q)}”${facet?' there':''}. Try fewer words${facet?' or search Anywhere':''}.<br>${PBI.gapLink(q,'the whole site')}</div>`;return}
    out.innerHTML=items.map((it,i)=>`<a class="srch-item${i===0?' sel':''}" href="${it.href}" data-i="${i}"><span class="srch-type t-${it.type}">${it.type}</span><span class="srch-main"><span class="srch-title">${hl(it.title,toks)}</span><span class="srch-sub">${PBI.esc(it.sub)}</span><span class="srch-snip">${hl(snippet(it,toks),toks)}</span></span></a>`).join('');
  };
  const move=d=>{const els=out.querySelectorAll('.srch-item');if(!els.length)return;els[sel].classList.remove('sel');sel=(sel+d+els.length)%els.length;els[sel].classList.add('sel');els[sel].scrollIntoView({block:'nearest'})};
  PBI.openSearch=(q)=>{last=document.activeElement;box.hidden=false;document.body.classList.add('srch-open');if(q!==undefined)inp.value=q;render();setTimeout(()=>{inp.focus();inp.select()},30)};
  const close=()=>{box.hidden=true;document.body.classList.remove('srch-open');if(last&&last.focus)last.focus()};
  let t;inp.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(render,80)});
  fsel.addEventListener('change',()=>{render();inp.focus()});
  inp.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){e.preventDefault();move(1)}
    else if(e.key==='ArrowUp'){e.preventDefault();move(-1)}
    else if(e.key==='Enter'){const el=out.querySelectorAll('.srch-item')[sel];if(el){e.preventDefault();el.click()}}
  });
  box.addEventListener('click',e=>{
    const tb=e.target.closest('[data-st]');if(tb){type=tb.dataset.st;box.querySelectorAll('[data-st]').forEach(b=>b.setAttribute('aria-pressed',b===tb));render();inp.focus();return}
    if(e.target.closest('#srchClose')||e.target===box){close();return}
    if(e.target.closest('.srch-item'))close();
  });
  /* keep keyboard focus inside the dialog while it is open */
  box.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const f=[...box.querySelectorAll('input,select,button,a[href]')].filter(x=>x.offsetParent!==null);
    if(!f.length)return;const first=f[0],lastEl=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();lastEl.focus()}
    else if(!e.shiftKey&&document.activeElement===lastEl){e.preventDefault();first.focus()}
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!box.hidden){close();return}
    const tag=(e.target.tagName||'').toLowerCase();const typing=['input','textarea','select'].includes(tag)||e.target.isContentEditable;
    if(((e.key==='k'||e.key==='K')&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!typing)){e.preventDefault();box.hidden?PBI.openSearch():close()}
  });
  document.addEventListener('click',e=>{const o=e.target.closest('[data-open-search]');if(o){e.preventDefault();PBI.openSearch()}});
}


/* ---------- install prompt and offline support ---------- */
let deferred=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;document.querySelectorAll('[data-install]').forEach(b=>b.hidden=false)});
PBI.install=()=>{
  if(deferred){deferred.prompt();deferred.userChoice.finally(()=>{deferred=null});return}
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  PBI.toast(ios?'In Safari tap Share, then "Add to Home Screen"':'Use your browser menu: "Install app" or "Add to Home screen"');
};
document.addEventListener('click',e=>{if(e.target.closest('[data-install]')){e.preventDefault();PBI.install()}
  if(e.target.closest('[data-export]')){e.preventDefault();PBI.exportProgress()}
  if(e.target.closest('[data-import]')){e.preventDefault();PBI.importProgress()}});
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  addEventListener('load',()=>navigator.serviceWorker.register(PBI.ROOT+'sw.js').catch(()=>{}));
}
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
document.addEventListener('DOMContentLoaded',()=>{if(!standalone)document.querySelectorAll('[data-install]').forEach(b=>b.hidden=false)});

/* ---------- More menu (narrow screens): a native <details>, closed by Escape, an outside click or a choice ---------- */
function initMore(){
  const closeAll=except=>document.querySelectorAll('details.navmore[open]').forEach(d=>{if(d!==except)d.open=false});
  document.addEventListener('click',e=>{const d=e.target.closest('details.navmore');closeAll(d);if(d&&e.target.closest('.navmenu a,.navmenu button'))d.open=false});
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const d=document.querySelector('details.navmore[open]');if(d){d.open=false;d.querySelector('summary').focus()}});
}

/* ---------- scrollable code and tables: keyboard users must be able to scroll them ----------
   Only containers that actually overflow become focusable regions, so short blocks add no tab stops. */
function initScrollRegions(){
  const SEL='pre,.tblwrap,.tblscroll';
  const label=el=>{const cap=el.querySelector('caption');if(cap)return cap.textContent.trim();const h=el.closest('section,article,.box,.dataset,.ev');const t=h&&h.querySelector('h2,h3,h4');return (el.matches('pre')?'Code':'Table')+(t?': '+t.textContent.trim():'')};
  const fix=()=>document.querySelectorAll(SEL).forEach(el=>{
    const over=el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1;
    if(over&&!el.hasAttribute('tabindex')){el.tabIndex=0;el.setAttribute('role','region');el.setAttribute('aria-label',label(el).slice(0,120));el.dataset.sr='1'}
    else if(!over&&el.dataset.sr){el.removeAttribute('tabindex');el.removeAttribute('role');el.removeAttribute('aria-label');delete el.dataset.sr}
  });
  let t;const soon=()=>{clearTimeout(t);t=setTimeout(fix,120)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',soon);else soon();
  addEventListener('load',soon);addEventListener('resize',soon);
  new MutationObserver(soon).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('toggle',soon,true);
}

initSearch();
initPopover();
initMore();
initScrollRegions();
})();
