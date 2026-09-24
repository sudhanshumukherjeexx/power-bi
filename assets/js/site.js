/* Shared behaviour for every page: storage, spaced repetition, readiness, search,
   glossary pop-ups, progress export/import, install prompt and offline support.
   Pages load their data files (content.js, cards.js, glossary.js…) before this file. */
(function(){
'use strict';
const KEYS={main:'pbi-holy-grail-v1',cards:'pbi-holy-grail-cards-v1'};
const PBI=window.PBI={KEYS};
const pad2=n=>String(n).padStart(2,'0');

/* ---------- small helpers ---------- */
PBI.esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
PBI.hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(36)};
PBI.slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
PBI.today=()=>{const d=new Date();return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())};
PBI.addDays=(iso,n)=>{const [y,m,d]=iso.split('-').map(Number);const t=new Date(y,m-1,d+n);return t.getFullYear()+'-'+pad2(t.getMonth()+1)+'-'+pad2(t.getDate())};
PBI.load=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){return {}}};
PBI.save=(key,val)=>{try{localStorage.setItem(key,JSON.stringify(val))}catch(e){}};
PBI.toast=msg=>{let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(PBI.toast._t);PBI.toast._t=setTimeout(()=>t.classList.remove('show'),1800)};
PBI.cardId={concept:q=>'c'+PBI.hash(q),topic:q=>'t'+PBI.hash(q)};

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
    if(r.b>=3)return {cls:'known',txt:'Mastered'};
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

/* ---------- readiness per topic: assignments 50%, multiple choice 25%, flashcards 25% ---------- */
PBI.readiness=(T,main,cards)=>{
  const done=T.asg.filter((_,i)=>main.done&&main.done[T.id+'-'+i]).length;
  const mcq=T.ass.map((q,i)=>({q,id:T.id+'-q'+i})).filter(x=>x.q.type==='mcq');
  const ok=mcq.filter(x=>main.quiz&&main.quiz[x.id]!==undefined&&String(main.quiz[x.id])===String(x.q.a)).length;
  const ids=T.int.map(q=>PBI.cardId.topic(q.q));
  const learned=ids.filter(id=>{const r=cards.srs&&cards.srs[id];return r&&r.b>=1}).length;
  const parts=[[0.5,T.asg.length?done/T.asg.length:null],[0.25,mcq.length?ok/mcq.length:null],[0.25,ids.length?learned/ids.length:null]].filter(p=>p[1]!==null);
  const w=parts.reduce((a,p)=>a+p[0],0)||1;
  return {pct:Math.round(100*parts.reduce((a,p)=>a+p[0]*p[1],0)/w),done,asg:T.asg.length,ok,mcq:mcq.length,learned,cards:ids.length};
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

/* ---------- progress export / import ---------- */
PBI.exportProgress=()=>{
  const payload={app:'power-bi-holy-grail',version:1,exported:new Date().toISOString(),data:{}};
  Object.values(KEYS).forEach(k=>payload.data[k]=PBI.load(k));
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='power-bi-progress-'+PBI.today()+'.json';
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
  PBI.toast('Progress file saved');
};
PBI.importProgress=()=>{
  const inp=document.createElement('input');inp.type='file';inp.accept='application/json,.json';
  inp.addEventListener('change',()=>{
    const f=inp.files&&inp.files[0];if(!f)return;
    const rd=new FileReader();
    rd.onload=()=>{
      try{
        const p=JSON.parse(rd.result);
        if(p.app!=='power-bi-holy-grail'||!p.data)throw new Error('not a progress file');
        if(!confirm('Replace the progress in this browser with the file from '+(p.exported||'').slice(0,10)+'?'))return;
        Object.values(KEYS).forEach(k=>{if(p.data[k])PBI.save(k,p.data[k])});
        PBI.toast('Progress imported');setTimeout(()=>location.reload(),600);
      }catch(e){PBI.toast('That file is not a Power BI Holy Grail progress file')}
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
    pop.querySelector('.gpop-s').innerHTML=see.length?'See also: '+see.map(s=>`<a href="glossary.html#${PBI.slug(s)}">${PBI.esc(s)}</a>`).join(', '):'';
    pop.querySelector('.gpop-link').href='glossary.html#'+PBI.slug(g.t);
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

/* ---------- search across everything ---------- */
let index=null;
function buildIndex(){
  if(index)return index;index=[];
  const add=(type,title,sub,text,href)=>index.push({type,title,sub,href,lt:title.toLowerCase(),lx:(title+' '+text).toLowerCase(),text});
  [['Page','Course: all levels and topics','index.html','index.html#roadmap'],['Page','Beginner page','Year 0 – 1 topics on one page','beginner.html'],['Page','Intermediate page','Year 1 – 3 topics on one page','intermediate.html'],['Page','Advanced page','Year 3 – 5 topics on one page','advanced.html'],['Page','Resources page','Study tools, starter project, datasets','resources.html'],['Page','Interview flashcards','Spaced repetition, 188 cards','flashcards.html'],['Page','Mock interview','Timed questions, out loud','flashcards.html#mock'],['Page','Glossary','Plain-English definitions','glossary.html'],['Page','Cheat sheets','Printable, one per level','cheatsheet.html'],['Page','Pick your path','Analyst, Developer, Engineer, Lead','index.html#paths'],['Page','Certification map','PL-300 and DP-600','index.html#certs'],['Page','Starter Power BI project','Model with every CSV loaded and related','index.html#starter']].forEach(p=>add(p[0],p[1],p[2],p[2],p[3]));
  if(typeof LEVELS!=='undefined')LEVELS.forEach(L=>L.topics.forEach(T=>{
    add('Topic',T.name,L.name,T.ds.join(' '),'index.html#'+T.id);
    T.asg.forEach((a,i)=>add('Assignment',a.t,T.name,a.steps.join(' ')+' '+a.exp,`index.html#${T.id}:asg:${i}`));
    T.int.forEach((q,i)=>add('Interview',q.q,T.name,q.a,`index.html#${T.id}:int:${i}`));
    T.ass.forEach((q,i)=>add('Assessment',q.q,T.name,(q.o||[]).join(' ')+' '+(q.why||q.hint||''),`index.html#${T.id}:ass:${i}`));
  }));
  if(typeof DS!=='undefined')Object.entries(DS).forEach(([k,v])=>add('Dataset',v.name,v.rows.length+' rows · '+v.cols.length+' cols',v.desc+' '+v.cols.join(' '),'index.html#ds-'+k));
  if(typeof CONCEPTS!=='undefined')CONCEPTS.forEach(c=>add('Flashcard',c.q,c.c,c.a+' '+(c.x||''),'flashcards.html#card='+PBI.cardId.concept(c.q)));
  if(typeof GLOSSARY!=='undefined')GLOSSARY.forEach(g=>add('Glossary',g.t,g.c,(g.k||[]).join(' ')+' '+g.d,'glossary.html#'+PBI.slug(g.t)));
  return index;
}
const TYPES=['All','Assignment','Interview','Flashcard','Glossary','Dataset','Topic'];
function runSearch(q,type){
  const toks=q.toLowerCase().split(/\s+/).filter(Boolean);if(!toks.length)return [];
  const res=[];
  for(const it of buildIndex()){
    if(type!=='All'&&it.type!==type&&!(type==='Topic'&&it.type==='Page'))continue;
    let s=0,okAll=true;
    for(const t of toks){if(!it.lx.includes(t)){okAll=false;break}s+=it.lt.includes(t)?10:1}
    if(!okAll)continue;
    if(it.lt===toks.join(' '))s+=60;
    if(it.lt.startsWith(toks[0]))s+=15;
    if(it.type==='Topic'||it.type==='Page'||it.type==='Glossary')s+=4;
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
  box.innerHTML=`<div class="srch-box"><div class="srch-head"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="search" id="srchInput" placeholder="Search lessons, questions, cards, glossary…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" aria-label="Search"><button class="btn sm" type="button" id="srchClose">Close</button></div><div class="srch-types" role="group" aria-label="Filter results">${TYPES.map(t=>`<button type="button" data-st="${t}" aria-pressed="${t==='All'}">${t==='All'?'All':t+'s'}</button>`).join('')}</div><div class="srch-res" id="srchRes"></div><div class="srch-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div>`;
  document.body.appendChild(box);
  const inp=box.querySelector('#srchInput'),out=box.querySelector('#srchRes');let type='All',sel=0,items=[],last=null;
  const render=()=>{
    const q=inp.value.trim();items=q?runSearch(q,type):[];sel=0;
    const toks=q.toLowerCase().split(/\s+/).filter(Boolean);
    if(!q){out.innerHTML='<div class="srch-empty">Try <b>CALCULATE</b>, <b>unpivot</b>, <b>RLS</b>, <b>date table</b> or <b>FactSales</b>.</div>';return}
    if(!items.length){out.innerHTML=`<div class="srch-empty">Nothing matches “${PBI.esc(q)}”. Try fewer words.</div>`;return}
    out.innerHTML=items.map((it,i)=>`<a class="srch-item${i===0?' sel':''}" href="${it.href}" data-i="${i}"><span class="srch-type t-${it.type}">${it.type}</span><span class="srch-main"><span class="srch-title">${hl(it.title,toks)}</span><span class="srch-sub">${PBI.esc(it.sub)}</span><span class="srch-snip">${hl(snippet(it,toks),toks)}</span></span></a>`).join('');
  };
  const move=d=>{const els=out.querySelectorAll('.srch-item');if(!els.length)return;els[sel].classList.remove('sel');sel=(sel+d+els.length)%els.length;els[sel].classList.add('sel');els[sel].scrollIntoView({block:'nearest'})};
  PBI.openSearch=(q)=>{last=document.activeElement;box.hidden=false;document.body.classList.add('srch-open');if(q!==undefined)inp.value=q;render();setTimeout(()=>{inp.focus();inp.select()},30)};
  const close=()=>{box.hidden=true;document.body.classList.remove('srch-open');if(last&&last.focus)last.focus()};
  let t;inp.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(render,80)});
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
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
document.addEventListener('DOMContentLoaded',()=>{if(!standalone)document.querySelectorAll('[data-install]').forEach(b=>b.hidden=false)});

initSearch();
initPopover();
})();
