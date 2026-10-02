/* Entry diagnostic: recommends a starting point (never locks content). */
(function(){
'use strict';
const P=PBI.P,esc=PBI.esc,D=DIAGNOSTIC;
const LV={beginner:0,intermediate:1,advanced:2};
const Q=D.questions.map((q,i)=>Object.assign({i},q));
const form=document.getElementById('diag'),out=document.getElementById('result');
document.getElementById('intro').textContent=D.intro;
let saved=P.main().diag;

function render(showAnswers,ans){
  form.innerHTML=Q.map(q=>`<div class="dq"><fieldset><legend><span class="area">${esc(q.area)} · ${esc(q.level)}</span>${q.i+1}. ${esc(q.q)}</legend>${[...q.o,'Not sure'].map((o,j)=>{const v=j<q.o.length?j:-1;const chosen=ans&&ans[q.i]===v;const cls=showAnswers?(v===q.a?'ok':chosen?'bad':''):'';return `<label class="${cls}"><input type="radio" name="q${q.i}" value="${v}"${chosen?' checked':''}${showAnswers?' disabled':''}> <span>${esc(o)}</span></label>`}).join('')}${showAnswers?`<div class="why">${esc(q.why)}</div>`:''}</fieldset></div>`).join('')+
  `<div class="sticky-actions">${showAnswers?'<button class="btn" type="button" id="retake">Retake</button>':'<button class="btn primary" type="submit">See my starting point</button><span class="muted" id="cnt"></span>'}</div>`;
  if(!showAnswers)count();
}
function count(){const n=Q.filter(q=>form.querySelector(`input[name="q${q.i}"]:checked`)).length;const c=document.getElementById('cnt');if(c)c.textContent=`${n} of ${Q.length} answered`}

function recommend(ans){
  const order=[...Q].sort((a,b)=>LV[a.level]-LV[b.level]||a.i-b.i);
  const miss=order.find(q=>ans[q.i]!==q.a);
  const byArea={};D.areas.forEach(a=>byArea[a]={ok:0,n:0});
  Q.forEach(q=>{byArea[q.area].n++;if(ans[q.i]===q.a)byArea[q.area].ok++});
  if(!miss)return {label:'Experience Mode, stage 3: Senior BI Developer',href:'experience.html#stage-senior',level:'experience',byArea,why:'You answered every question correctly. Skill Mode will mostly be revision; the scenarios will stretch you.'};
  const t=P.topic(miss.topic);const m=t&&P.module(t.module);
  return {label:`${m?m.name:miss.level} · ${t?t.name.split(':')[0]:miss.area}`,href:`${t?t.module:miss.level}.html#${miss.topic}`,level:miss.level,topic:miss.topic,byArea,why:miss.level==='beginner'?'Start at the beginning of Beginner, or at this topic if the earlier ones feel easy.':`You know the ${miss.level==='intermediate'?'Beginner':'Intermediate'} material. Start here, and skim anything before it.`};
}
function showResult(rec,ans,at){
  const ok=Q.filter(q=>ans[q.i]===q.a).length;
  out.innerHTML=`<div class="result" role="status" tabindex="-1" id="res"><div class="kicker">${ok} of ${Q.length} correct${at?' · '+esc(at.slice(0,10)):''}</div><h2>Recommended starting point: <a href="${esc(rec.href)}">${esc(rec.label)}</a></h2><p class="muted">${esc(rec.why)} This is a suggestion. Everything stays open.</p>
  <div class="tblscroll"><table class="tbl" style="margin-top:8px"><thead><tr><th scope="col">Area</th><th scope="col">Correct</th></tr></thead><tbody>${D.areas.map(a=>`<tr><td>${esc(a)}</td><td class="num">${rec.byArea[a].ok}/${rec.byArea[a].n}</td></tr>`).join('')}</tbody></table></div>
  <div class="cta" style="margin-top:12px"><a class="btn primary" href="${esc(rec.href)}">Go there</a><a class="btn" href="experience.html">See Experience Mode</a><a class="btn" href="index.html#goal">Choose a goal</a></div></div>`;
}

form.addEventListener('change',count);
form.addEventListener('submit',e=>{
  e.preventDefault();
  const ans={};Q.forEach(q=>{const c=form.querySelector(`input[name="q${q.i}"]:checked`);ans[q.i]=c?+c.value:-1});
  const un=Q.filter(q=>!form.querySelector(`input[name="q${q.i}"]:checked`)).length;
  if(un&&!confirm(`${un} question(s) unanswered. Treat them as "Not sure"?`))return;
  const rec=recommend(ans);const at=new Date().toISOString();
  PBI.update(PBI.KEYS.main,st=>{PBI.migrate(st);st.diag={ans,at,rec:{label:rec.label,href:rec.href,level:rec.level,topic:rec.topic||null},score:Q.filter(q=>ans[q.i]===q.a).length};st.seen['diagnostic.html']=PBI.today();return st});
  showResult(rec,ans,at);render(true,ans);
  const r=document.getElementById('res');r.focus();r.scrollIntoView({block:'start'});
});
form.addEventListener('click',e=>{if(e.target.closest('#retake')){out.innerHTML='';render(false);scrollTo(0,0)}});

if(saved&&saved.ans){showResult(recommend(saved.ans),saved.ans,saved.at);render(true,saved.ans)}else render(false);
PBI.initThemeToggles();
})();
