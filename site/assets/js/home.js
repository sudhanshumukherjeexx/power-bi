/* Home page: a calm entrance for new learners, a short dashboard for returning ones. */
(function(){
'use strict';
const P=PBI.P,esc=PBI.esc;
const main=P.main(),cards=P.cards();
const started=Object.values(main.done).some(Boolean)||Object.keys(main.quiz).length||Object.keys(main.xp).length||Object.keys(cards.srs).length||main.diag||main.goal;

/* returning learner: continue where they left off */
if(started){
  const next=P.nextStep(main,cards);
  /* stored links are re-checked on read: only internal pages, never javascript: or another site */
  const last=main.last&&PBI.safeHref(main.last.href)?main.last:null;
  const cta=document.getElementById('cta');
  const target=last?{href:last.href,title:last.title,lbl:'Continue where you left off'}:next&&PBI.safeHref(next.href)?{href:next.href,title:next.t,lbl:'Your next step'}:{href:'beginner.html',title:'Beginner level',lbl:'Start here'};
  cta.innerHTML=`<a class="btn primary" href="${esc(target.href)}">Continue</a><a class="btn" href="progress.html">Your progress</a>`;
  document.getElementById('kicker').textContent='Welcome back';
  document.getElementById('cont').innerHTML=`<a class="continue" href="${esc(target.href)}"><span><span class="lbl">${esc(target.lbl)}</span><b>${esc(target.title)}</b>${next&&last?`<span class="small muted">Next on your route: ${esc(next.t)}</span>`:''}</span><span class="go" aria-hidden="true">→</span></a>`;

  const skill=P.skillTotals(main,cards),xp=P.xpTotals(main),due=P.due(cards),stage=P.currentStage(main,cards);
  document.getElementById('tiles').innerHTML=
    `<a class="tile" href="learn.html"><span class="k">Skill Mode</span><b>${skill.done}/${skill.asg}</b><span class="s">assignments done</span>${P.bar(skill.pct,'Skill Mode')}</a>`+
    `<a class="tile" href="experience.html"><span class="k">Experience Mode</span><b>${xp.done}/${xp.n}</b><span class="s">${xp.active?xp.active+' in progress':'scenarios finished'}</span>${P.bar(xp.pct,'Experience Mode')}</a>`+
    `<a class="tile" href="flashcards.html"><span class="k">Flashcards</span><b>${due.due}</b><span class="s">due today · ${due.fresh} new</span></a>`+
    `<a class="tile" href="progress.html#stages"><span class="k">Stage ${stage.n} of 5</span><b style="font-size:1.05rem">${esc(stage.name)}</b><span class="s">${esc(stage.question)}</span>${P.bar(stage.pct,stage.name)}</a>`;
  document.getElementById('dash').hidden=false;
}
if(main.diag&&main.diag.rec&&PBI.safeHref(main.diag.rec.href)){
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
