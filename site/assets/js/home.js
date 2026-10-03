/* Home page. New learners get a calm entrance; returning learners get continuation first:
   one Continue card, one line of what's due and what to focus on, and the discovery sections folded away. */
(function(){
'use strict';
const P=PBI.P,esc=PBI.esc;
const main=P.main(),cards=P.cards();
const started=Object.values(main.done).some(Boolean)||Object.keys(main.quiz).length||Object.keys(main.xp).length||Object.keys(cards.srs).length||main.diag||main.goal;

/* what the Continue card says about the place you left: a scenario, a level or track, or any other page */
function describe(href,title){
  const page=href.split('#')[0];
  const s=SCENARIO_INDEX.find(x=>'experience/'+x.slug+'.html'===page);
  if(s){
    const rec=main.xp[s.id]||{},st=STAGES.find(x=>x.id===s.stage)||{};
    const dels=s.deliverables.length,done=s.deliverables.filter(d=>rec.del&&rec.del[d.id]).length;
    return {id:s.ticket,title:s.title,meta:`${esc(st.name||'')} · ${rec.done?'finished':`${done} of ${dels} deliverables written`}${rec.hints?` · ${rec.hints} hint${rec.hints>1?'s':''}`:''}`,pct:dels?Math.round(100*done/dels):0,kind:'Scenario'};
  }
  const m=MODULES.find(x=>x.id+'.html'===page);
  if(m){const r=P.moduleReadiness(m,main,cards);return {id:null,title:m.name,meta:`${r.done} of ${r.asg} assignments · ${r.pct}% ready`,pct:r.pct,kind:m.kind==='track'?'Track':'Level'}}
  return {id:null,title,meta:'',pct:null,kind:'Page'};
}

if(started){
  document.body.classList.add('returning');
  const next=P.nextStep(main,cards);
  const last=main.last&&PBI.safeHref(main.last.href)?main.last:null;   /* stored links are re-checked on read */
  const target=last?{href:last.href,title:last.title}:next&&PBI.safeHref(next.href)?{href:next.href,title:next.t}:{href:'beginner.html',title:'Beginner level'};
  const d=describe(target.href,target.title);

  document.getElementById('kicker').textContent='Welcome back';
  document.getElementById('h1').textContent='Pick up where you left off.';
  document.getElementById('lead').hidden=true;
  document.getElementById('cta').hidden=true;
  document.getElementById('cont').innerHTML=`<div class="resume"><div class="rlbl">${last?'Continue':'Your next step'}</div>
<a class="rcard" href="${esc(target.href)}"><span class="rtop">${d.id?`<span class="mono rid">${esc(d.id)}</span>`:''}<span class="rkind">${esc(d.kind)}</span></span><b>${esc(d.title)}</b>${d.meta?`<span class="rmeta">${d.meta}</span>`:''}${d.pct!==null?P.bar(d.pct,d.title):''}<span class="btn primary">Continue</span></a>
${next&&last&&next.href!==last.href?`<p class="small muted">Next on your route: <a href="${esc(next.href)}">${esc(next.t)}</a></p>`:''}</div>`;

  /* one line instead of a dashboard */
  const due=P.due(cards),stage=P.currentStage(main,cards),comp=P.competency(main,cards);
  const focus=comp.filter(c=>(stage.skills||[]).includes(c.id)).sort((a,b)=>a.pct-b.pct)[0];
  const port=P.portfolio(main).length;
  document.getElementById('dash').innerHTML=`<p class="homeline">
<a href="flashcards.html"><b>${due.due}</b> card${due.due===1?'':'s'} due</a>
<a href="progress.html#stages">Stage <b>${esc(stage.name)}</b></a>
${focus?`<a href="progress.html#competency">Focus <b>${esc(focus.name)}</b></a>`:''}
<a href="progress.html#portfolio">Portfolio evidence <b>${port}</b></a></p>`;
  document.getElementById('dash').hidden=false;

  /* discovery stays one click away */
  const ex=document.createElement('details');ex.className='explore';
  ex.innerHTML='<summary>Explore other paths</summary>';
  const dash=document.getElementById('dash');dash.after(ex);
  ['ways','goal'].forEach(id=>{const el=document.getElementById(id);if(el)ex.appendChild(el)});
  const honest=document.querySelector('.honest');if(honest)ex.appendChild(honest);
}
if(!started&&main.diag&&main.diag.rec&&PBI.safeHref(main.diag.rec.href)){
  const r=main.diag.rec;
  document.getElementById('lead').insertAdjacentHTML('afterend',`<p class="small muted">Your diagnostic suggested starting at <a href="${esc(r.href)}">${esc(r.label)}</a>.</p>`);
}

/* goal → route */
const goalsEl=document.getElementById('goals'),routeEl=document.getElementById('route');
function renderGoals(){
  const cur=P.main().goal;
  goalsEl.innerHTML=GOALS.map(g=>`<button type="button" data-goal="${g.id}" aria-pressed="${g.id===cur}">${esc(g.label)}</button>`).join('');
  const g=GOALS.find(x=>x.id===cur);
  if(!g){routeEl.innerHTML='';return}
  const m=P.main(),c=P.cards();let marked=false;
  routeEl.innerHTML=`<p style="margin:12px 0 0"><b>${esc(g.label)}.</b> <span class="muted">${esc(g.desc)}</span></p><ol class="route">${g.route.map(s=>{
    const done=P.stepDone(s.href,m,c);const isNext=!done&&!marked;if(isNext)marked=true;
    return `<li class="${done?'done':''}${isNext?' next':''}"><a href="${esc(s.href)}"><span><b>${esc(s.t)}</b><span>${esc(s.why)}</span></span><span class="st">${done?'done':isNext?'next':''}</span></a></li>`}).join('')}</ol>`;
}
goalsEl.addEventListener('click',e=>{
  const b=e.target.closest('[data-goal]');if(!b)return;
  const g=GOALS.find(x=>x.id===b.dataset.goal);
  PBI.update(PBI.KEYS.main,st=>{PBI.migrate(st);st.goal=st.goal===g.id?null:g.id;if(st.goal&&g.role)st.path=g.role;return st});
  renderGoals();
  if(P.main().goal)routeEl.querySelector('.route a')&&routeEl.querySelector('.route').scrollIntoView({block:'nearest'});
});
renderGoals();
PBI.initThemeToggles();
})();
