/* toolkit.html: "What are you trying to do?" search over TOOLKIT (assets/js/toolkit.js) with Skill, Stage, Tool,
   Problem and Certification filters. Results are grouped by role (start here, playbook, learn, tool, practise,
   checklist, reference, career), and the top result of each group forms the suggested path. State lives in the
   URL hash (#q=…&s=…) so a search can be shared. */
(function(){
'use strict';
const esc=PBI.esc;
const form=document.getElementById('tkform'),q=document.getElementById('tkq'),res=document.getElementById('tkresults'),doors=document.getElementById('tkdoors');
const sels=[...document.querySelectorAll('.tkf select')];
const ROLE=Object.fromEntries(TOOLKIT.roles);
const ORDER=TOOLKIT.roles.map(r=>r[0]);
const STOP=new Set('a an and are can do does for from how i in is it my of on or the to what when where which why with you your me this that'.split(' '));
/* keywords (kw) help matching but are never shown */
const items=TOOLKIT.items.map(([role,title,sub,text,href,tags,kw])=>({role,title,sub,text,href,tags:' '+tags+' ',lt:title.toLowerCase(),ls:sub.toLowerCase(),lx:(text+' '+(kw||'')).toLowerCase(),lt0:text.toLowerCase(),all:(title+' '+sub+' '+text+' '+(kw||'')).toLowerCase()}));
/* words people type → words the guides use */
const SYN={slow:['performance'],slowly:['performance'],speed:['performance'],fast:['performance'],faster:['performance'],lag:['performance'],wrong:['reconcile','incorrect','debug'],incorrect:['wrong'],broken:['troubleshoot','fail'],broke:['fail','rollback'],error:['fail'],fails:['fail'],failed:['fail'],secure:['security','rls'],security:['rls'],permission:['access'],permissions:['access'],deploy:['deployment'],ship:['deployment'],release:['deployment'],git:['pbip'],job:['career','interview'],exam:['certification'],cert:['certification'],memory:['size','cardinality'],big:['size','memory'],api:['rest'],automate:['automation','api'],cost:['capacity'],licence:['capacity','licensing'],license:['capacity','licensing']};

function terms(s){return s.toLowerCase().replace(/[^a-z0-9%+#.\- ]/g,' ').split(/\s+/).filter(w=>w&&!STOP.has(w))}
/* whole words (with simple plurals and past tense), weighted by rarity: "slow" matters more than "report" */
const rx={},wre=t=>rx[t]||(rx[t]=new RegExp('(^|[^a-z0-9])'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(s|es|ed)?(?![a-z0-9])'));
const IDFMAX=Math.log(1+items.length);
const dfs={},dfn=t=>t in dfs?dfs[t]:(dfs[t]=items.filter(it=>wre(t).test(it.all)).length);
const idf=t=>Math.log(1+items.length/(1+dfn(t)));
function score(it,ts,phrase){
  let s=0,missing=0;
  if(phrase&&ts.length>1&&it.lt.includes(phrase))s+=10;
  for(const t of ts){
    let best=0;
    for(const [w,f] of [[t,1],...(SYN[t]||[]).map((y,i)=>[y,i?.6:.95])]){
      const re=wre(w),k=idf(w)*f;
      let v=0;
      if(re.test(it.lt))v+=6*k;
      if(re.test(it.ls))v+=1.5*k;
      if(re.test(it.lx)){const n=Math.min(5,(it.lx.match(new RegExp(re.source,"g"))||[]).length);v+=1.5*k*(1+Math.log(n||1))}
      best=Math.max(best,v);
    }
    /* a missing rare word costs a lot, a missing common word ("report", "data") very little */
    if(!best)missing+=2.5*idf(t)/IDFMAX;
    s+=best;
  }
  if(missing)s*=missing>=ts.length*.99?0:Math.pow(.3,missing);
  if(it.role==='start'||it.role==='playbook')s*=1.1;
  return s;
}
function state(){return{q:q.value.trim(),f:Object.fromEntries(sels.filter(s=>s.value).map(s=>[s.dataset.f,s.value]))}}
function tagOf(f,v){return ({skill:'k:',stage:'s:',tool:'t:',problem:'p:',certification:'c:'})[f]+v}
function run(push){
  const st=state();
  const active=st.q||Object.keys(st.f).length;
  if(push!==false){const h=new URLSearchParams();if(st.q)h.set('q',st.q);sels.forEach(s=>{if(s.value)h.set(s.dataset.f,s.value)});const hs=h.toString();history.replaceState(null,'',hs?'#'+hs:location.pathname)}
  if(!active){res.hidden=true;doors.hidden=false;return}
  const need=sels.filter(s=>s.value).map(s=>' '+tagOf(s.dataset.f,s.value)+' ');
  /* words that appear in more than 15% of the index ("report", "data", "model") only count when they are all you typed */
  const raw=terms(st.q),ts=raw.length>1&&raw.some(t=>dfn(t)<=.15*items.length)?raw.filter(t=>dfn(t)<=.15*items.length):raw,phrase=st.q.toLowerCase();
  let list=items.filter(it=>need.every(n=>it.tags.includes(n)));
  const unknown=ts.filter(t=>!(SYN[t]||[]).length&&!items.some(it=>wre(t).test(it.all)));
  if(unknown.length){doors.hidden=true;res.hidden=false;res.innerHTML=`<div class="tkempty"><h2>Nothing in the Toolkit mentions “${esc(unknown.join('”, “'))}”</h2><p>Check the spelling, or try a product or feature name (DAX, RLS, gateway, Direct Lake). <a href="toolkit/whats-broken.html">What's broken?</a> covers the most common problems.</p></div><p><button class="btn sm" type="button" id="tkback">← Back to the Toolkit</button></p>`;return}
  if(ts.length){const sc=list.map(it=>({it,s:score(it,ts,phrase)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s);const top=sc.length?sc[0].s:0;list=sc.filter(x=>x.s>=Math.max(.8,top*.05)).map(x=>x.it)}
  else list.sort((a,b)=>ORDER.indexOf(a.role)-ORDER.indexOf(b.role));
  doors.hidden=true;res.hidden=false;
  if(!list.length){res.innerHTML=`<div class="tkempty"><h2>Nothing matched${st.q?` “${esc(st.q)}”`:''}</h2><p>Try fewer words, a product name (DAX, RLS, gateway) or remove a filter. <a href="toolkit/whats-broken.html">What's broken?</a> covers the most common problems.</p></div>`;return}
  const groups={};for(const it of list)(groups[it.role]=groups[it.role]||[]).push(it);
  const present=ORDER.filter(r=>groups[r]);
  const ext=h=>/^https?:/.test(h);
  const link=it=>`<a href="${esc(it.href)}"${ext(it.href)?' rel="noopener" target="_blank" class="ext"':''}>${esc(it.title)}</a>`;
  const snip=it=>{if(!ts.length)return esc(it.text.slice(0,140))+(it.text.length>140?'…':'');const pos=ts.map(t=>it.lt0.indexOf(t)).filter(x=>x>=0),i=pos.length?Math.min(...pos):0;const from=Math.max(0,i-60);return(from?'…':'')+esc(it.text.slice(from,from+160))+(it.text.length>from+160?'…':'')};
  res.innerHTML=`<div class="tkpath"><h2>${st.q?`Your path for “${esc(st.q)}”`:'Matching resources'}</h2><ol>${present.slice(0,7).map(r=>`<li><span class="role">${esc(ROLE[r])}</span> ${link(groups[r][0])} <span class="small muted">${esc(groups[r][0].sub)}</span></li>`).join('')}</ol></div>`+
    present.map(r=>{const g=groups[r];return `<section class="tkgrp"><h3>${esc(ROLE[r])} <span class="n">${g.length}</span></h3><ul>${g.slice(0,6).map(it=>`<li>${link(it)}<span class="sub">${esc(it.sub)}</span><span class="snip">${snip(it)}</span></li>`).join('')}</ul>${g.length>6?`<details><summary>${g.length-6} more</summary><ul>${g.slice(6,40).map(it=>`<li>${link(it)}<span class="sub">${esc(it.sub)}</span></li>`).join('')}</ul></details>`:''}</section>`}).join('')+
    `<p><button class="btn sm" type="button" id="tkback">← Back to the Toolkit</button></p>`;
}
form.addEventListener('submit',e=>{e.preventDefault();run();res.hidden||res.scrollIntoView({block:'start',behavior:'smooth'})});
let timer;q.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(run,180)});
sels.forEach(s=>s.addEventListener('change',()=>run()));
document.getElementById('tkclear').addEventListener('click',()=>{q.value='';sels.forEach(s=>s.value='');run()});
res.addEventListener('click',e=>{if(e.target.closest('#tkback')){q.value='';sels.forEach(s=>s.value='');run();q.focus()}});
/* restore from the URL */
const h=new URLSearchParams(location.hash.slice(1));
if(h.get('q'))q.value=h.get('q');
sels.forEach(s=>{const v=h.get(s.dataset.f);if(v&&[...s.options].some(o=>o.value===v))s.value=v});
if([...h.keys()].length){if(sels.some(s=>s.value))document.querySelector('.tkfilters').open=true;run(false)}
PBI.touch('BI Developer Toolkit');
PBI.initThemeToggles();
})();
