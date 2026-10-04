/* progress.html: a competency review. Evidence summary, professional stages, competency matrix, Experience Mode,
   portfolio evidence, decisions, Skill Mode, certifications, flashcards. Every percentage names its evidence type
   and has a "How this is calculated" panel listing its inputs. Formulas live in progress.js. */
(function(){
'use strict';
const P=PBI.P,esc=PBI.esc;
const main=P.main(),cards=P.cards();
const stages=P.stages(main,cards),cur=P.currentStage(main,cards);
const comp=P.competency(main,cards);
const ev=P.evidence(main,cards);
const due=P.due(cards);
const G=P.GATES;
const xpHref=s=>`experience/${s.slug}.html`;
const tpl=id=>(TEMPLATE_INDEX.find(t=>t.id===id)||{title:id}).title;
const tag=t=>`<span class="ev-tag ${t}">${{verified:'verified',self:'self-assessed',recall:'recall'}[t]}</span>`;
const how=(rows,note)=>`<details class="how"><summary>How this is calculated</summary><dl>${rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>${note?`<p class="small muted">${note}</p>`:''}</details>`;
const level=p=>p>=75?'Strong':p>=40?'Developing':p>0?'Needs practice':'Not started';
const pctOrDash=v=>v===null||v===undefined?'–':v+'%';

/* ---------- evidence summary ---------- */
const evHtml=`<section id="evidence"><div class="section-h"><h2>Evidence</h2></div>
<div class="evgrid">
  <div class="evcol">${tag('verified')}<b>${ev.verified.ok}<span class="of">/${ev.verified.mcq}</span></b><span>multiple-choice questions right first time</span>${P.bar(ev.verified.pct,'Verified')}<span class="small muted">${ev.verified.answered} answered. Only your first answer counts.</span></div>
  <div class="evcol">${tag('self')}<b>${ev.self.done}<span class="of">/${ev.self.asg}</span></b><span>assignments ticked</span>${P.bar(ev.self.pct,'Self-assessed')}<span class="small muted">${ev.self.finished}/${ev.self.scenarios} scenarios finished${ev.self.quality!==null?` · average outcome ${ev.self.quality}%`:''} · ${ev.self.delsDone} deliverables ticked</span></div>
  <div class="evcol">${tag('recall')}<b>${ev.recall.pct}%</b><span>flashcard mastery</span>${P.bar(ev.recall.pct,'Recall')}<span class="small muted">${ev.recall.mastered} of ${ev.recall.cards} cards mastered (box 4+), ${ev.recall.reviewed} reviewed</span></div>
</div>
${how([['Verified','Your first answer to each multiple-choice question compared with the answer key. Changing an answer afterwards helps you learn but doesn\'t change this.'],['Self-assessed','Assignments you ticked, scenario deliverables you ticked, and your own rubric ratings. Nothing inspects your work, so these are as accurate as you are honest.'],['Recall','Flashcard boxes: unseen or box 0 = 0%, box 1 = 25%, 2 = 50%, 3 = 75%, 4 or 5 = 100%. Reaching box 4 takes four correct recalls in a row over at least 11 days.']])}</section>`;

/* ---------- professional stages ---------- */
const gate=(ok,txt)=>`<span class="gate ${ok?'ok':''}">${ok?'✓':'○'} ${txt}</span>`;
const stagesHtml=`<section id="stages"><div class="section-h"><h2>Professional stage</h2><a href="experience.html">Experience Mode →</a></div>
<p class="muted" style="max-width:70ch">Stages are about responsibility, not years. A stage is cleared when its Skill Mode readiness reaches ${G.skill}%, you have finished ${G.completion}% of its scenarios, and their average outcome is ${G.quality}% or more. Finishing a scenario without good work doesn't move you on.</p>
<ol class="stagelist">${stages.map(s=>`<li class="${s.id===cur.id?'cur':''}${s.cleared?' cleared':''}"><span class="n" aria-hidden="true">${s.n}</span><span><b>${esc(s.name)}${s.id===cur.id?' <span class="chip">you are here</span>':s.cleared?' <span class="chip ok">cleared</span>':''}</b><span>${esc(s.question)} · ${esc(s.challenge)}</span>
<span class="gates">${gate(s.gates.skill,`skill ${s.skillPct}%`)}${s.scenarios?gate(s.gates.completion,`${s.scenariosDone}/${s.scenarios} scenarios`)+gate(s.gates.quality,`outcome ${s.quality===null?'–':s.quality+'%'}`):''}</span>
${how([['Skill readiness',`${s.skillPct}% · mean readiness of the ${s.topics} Skill Mode topics for this stage`],['Experience',`${s.expPct}% · average outcome of finished scenarios (${s.quality===null?'none yet':s.quality+'%'}) × share finished (${s.scenariosDone}/${s.scenarios})`],['Stage',`${s.pct}% · mean of skill readiness and experience`]],'Outcome ratings are self-assessed against each scenario\'s rubric.')}</span>
<span class="pc"><span>${s.pct}%</span>${P.bar(s.pct,s.name)}</span></li>`).join('')}</ol></section>`;

/* ---------- competency matrix ---------- */
const mini=(v,t)=>`<span class="mini ${t}" title="${{verified:'Verified',self:'Self-assessed',recall:'Recall'}[t]}: ${v===null?'no evidence of this kind':v+'%'}"><span class="vh">${{verified:'Verified',self:'Self-assessed',recall:'Recall'}[t]} ${v===null?'none':v+'%'}</span><i style="width:${v||0}%"></i></span>`;
const compHtml=`<section id="competency"><div class="section-h"><h2>Competency matrix</h2></div>
<p class="muted" style="max-width:70ch">Each skill's share of the evidence available for it, with the three kinds shown separately. Less-guided assignments and finished scenarios count for more than single quiz answers or cards.</p>
<div class="evkey small">${tag('verified')} ${tag('self')} ${tag('recall')}</div>
<div class="matrix">${comp.map(c=>`<div class="row"><span class="nm" title="${esc(c.desc)}">${esc(c.name)}<span class="lvl">${level(c.pct)}</span></span>${P.bar(c.pct,c.name)}<span class="pct">${c.pct}%</span><span class="minis">${mini(c.types.verified,'verified')}${mini(c.types.self,'self')}${mini(c.types.recall,'recall')}</span><span class="ev">${c.ev.mcq[0]}/${c.ev.mcq[1]} quiz right first time · ${c.ev.asg[0]}/${c.ev.asg[1]} assignments · ${c.ev.xp[0]}/${c.ev.xp[1]} scenarios · ${c.ev.cards[0]}/${c.ev.cards[1]} cards mastered${c.earned?` · ${c.selfShare}% of this skill's score is self-assessed`:''}</span></div>`).join('')}</div>
${how([['Assignments','Ticked = full weight. Weight grows as guidance drops: A 1, B 1.5, C 2, D 2.5. Self-assessed.'],['Quiz','0.3 per question answered correctly first time. Verified.'],['Flashcards','0.15 per card × mastery (0–100%). Recall.'],['Scenarios','5 per finished scenario × your outcome rating. Self-assessed. Hints and early reveals don\'t reduce it; they show as independence.']])}</section>`;

/* ---------- Experience Mode ---------- */
const xpRows=SCENARIO_INDEX.map(s=>{const rec=main.xp[s.id];const st=P.scenarioStatus(main,s.id);const sc=P.scenarioScore(s,rec);
  return `<tr><td><a href="${xpHref(s)}">${esc(s.title)}</a><div class="small muted"><span class="mono">${esc(s.ticket||'')}</span> · stage ${(STAGES.find(x=>x.id===s.stage)||{}).n||''}</div></td><td>${st==='done'?'<span class="chip ok">Done</span>':st==='active'?'<span class="chip">In progress</span>':'<span class="small muted">Not started</span>'}</td><td class="num">${sc?sc.quality+'%':'–'}</td><td class="num">${sc?sc.independence+'%':'–'}</td><td class="num">${rec?rec.hints||0:0}</td><td>${rec&&rec.sol?(rec.solEarly?'early':'after'):'–'}</td></tr>`}).join('');
const xpHtml=`<section id="experience"><div class="section-h"><h2>Experience Mode</h2><a href="experience.html">All scenarios →</a></div>
${SCENARIO_INDEX.length?`<div class="tblscroll"><table class="tbl"><thead><tr><th scope="col">Scenario</th><th scope="col">Status</th><th scope="col">Outcome <span class="ev-tag self">self</span></th><th scope="col">Independence</th><th scope="col">Hints</th><th scope="col">Model answer</th></tr></thead><tbody>${xpRows}</tbody></table></div>
${how([['Outcome','Your rubric ratings (0–4 per criterion), weighted by each criterion\'s share. Self-assessed. This is what counts toward competency and stages.'],['Independence','100 − 10 per hint (at most 40) − 30 if you opened the model answer before finishing. Shown on its own; it never reduces the outcome.']])}`:'<div class="empty">No scenarios yet.</div>'}</section>`;

/* ---------- portfolio evidence ---------- */
const port=P.portfolio(main);
const byArt={};port.forEach(p=>{const k=p.del.artifact||'other';(byArt[k]=byArt[k]||[]).push(p)});
const portHtml=`<section id="portfolio"><div class="section-h"><h2>Portfolio evidence</h2><a href="templates.html">Templates →</a></div>
<p class="small muted" style="max-width:70ch">Deliverables you ticked as written, grouped by type. ${tag('self')} This is a checklist of what you say you produced; the files themselves live wherever you wrote them.</p>
${port.length?`<div class="tblscroll"><table class="tbl"><thead><tr><th scope="col">Artifact</th><th scope="col">From</th></tr></thead><tbody>${Object.entries(byArt).map(([k,list])=>list.map((p,i)=>`<tr><td>${i?'':`<b>${esc(k==='other'?'Other deliverables':tpl(k))}</b>`}<div class="small">${esc(p.del.t)}</div></td><td><a href="${xpHref(p.scenario)}">${esc(p.scenario.title)}</a></td></tr>`).join('')).join('')}</tbody></table></div>`:'<div class="empty">Deliverables you tick in Experience Mode scenarios appear here, grouped by type: requirements, KPI dictionary, incident report, ADR, pull request…</div>'}
<details style="margin-top:12px"><summary>Turning this into a real portfolio</summary><ol style="font-size:.92rem;color:var(--text-secondary)"><li>Create one public repository per finished scenario, named after the business problem ("revenue-reconciliation"), not the course.</li><li>Commit your own documents (requirements, validation, ADR, postmortem) and your PBIP folder. Leave out the scenario's model answer: employers want your reasoning, and publishing the answer spoils it for other learners.</li><li>Write a README with Problem, Impact, Evidence, Options, Recommendation, Risk and Ask. That is the senior conversation, in writing.</li><li>Add screenshots of your report and of your validation table (before/after numbers).</li><li>Say clearly that the company and data are fictional and generated, and link to this project.</li></ol></details></section>`;

/* ---------- decision log ---------- */
const decs=SCENARIO_INDEX.filter(s=>s.decision&&main.xp[s.id]&&main.xp[s.id].dec);
const decHtml=`<section id="decisions"><div class="section-h"><h2>Decision log</h2></div>
${decs.length?`<ol class="route">${decs.map(s=>{const d=main.xp[s.id].dec;return `<li class="done"><a href="${xpHref(s)}#ev-decision"><span><b><span class="mono">${esc(d.adr||'ADR')}</span> · ${esc(d.title||s.title)}</b><span>${esc(d.option||'')}${d.why?': '+esc(d.why.slice(0,160)):''}</span></span><span class="st">${esc((d.at||'').slice(0,10))}</span></a></li>`}).join('')}</ol>`:'<div class="empty">Architecture scenarios ask you to choose an option and record why. Your decisions appear here, and later scenarios refer back to them.</div>'}</section>`;

/* ---------- Skill Mode ---------- */
const modsHtml=`<section id="skill"><div class="section-h"><h2>Skill Mode</h2><a href="learn.html">All levels and tracks →</a></div>
<div class="tblscroll"><table class="tbl"><thead><tr><th scope="col">Level or track</th><th scope="col">Assignments</th><th scope="col">Readiness</th></tr></thead><tbody>${MODULES.map(m=>{const r=P.moduleReadiness(m,main,cards);return `<tr><td><a href="${m.id}.html">${esc(m.name)}</a> <span class="small muted">${m.kind}</span></td><td class="num">${r.done}/${r.asg}</td><td style="min-width:140px">${P.bar(r.pct,m.name)} <span class="small">${r.pct}%</span></td></tr>`}).join('')}</tbody></table></div>
${how([['Topic readiness','50% assignments ticked (self-assessed) + 25% multiple choice right first time (verified) + 25% topic flashcard mastery (recall). Parts a topic doesn\'t have are left out and the rest re-weighted.'],['Level readiness','Mean of its topics.']])}</section>`;

/* ---------- certifications ---------- */
const certHtml=`<section id="certs"><div class="section-h"><h2>Certification preparation</h2><a href="learn.html#certs">Certification map →</a></div>
<p class="small muted" style="max-width:70ch">Two separate measures, weighted by Microsoft's published domain weights. Neither predicts an exam result: the exam tests things this site doesn't, and the reverse.</p>
<div class="certrows">${CERTS.map(c=>{const R=P.cert(c,main,cards);return `<div class="certrow"><h3><a href="learn.html#certs">${esc(c.code)}</a> <span class="small muted">${esc(R.label)}${R.next?' · changes '+esc(R.next.effective):''}</span></h3>
<div class="cm"><span>Curriculum coverage ${tag('self')}</span>${P.bar(R.coverage,c.code+' coverage')}<b>${R.coverage}%</b></div>
<div class="cm"><span>Practice ${tag('verified')} ${tag('recall')}</span>${P.bar(R.practice,c.code+' practice')}<b>${R.practice}%</b></div>
${how(R.areas.map(a=>[esc(a.n),`${esc(a.w)} of the exam${a.wn?` (weight ${Math.round(a.wn*1000)/10}%)`:''} · coverage ${a.coverage}% (${a.done}/${a.asg} assignments) · practice ${a.practice}% (${a.ok}/${a.mcq} right first time, ${a.cards?Math.round(100*a.recall/a.cards):0}% card mastery)`]),R.weighted?'Each domain\'s weight is the midpoint of Microsoft\'s range, normalised so the domains add up to 100%.':'Domain weights could not be read, so domains count equally.')}</div>`}).join('')}</div></section>`;

/* ---------- flashcards ---------- */
const cardHtml=`<section id="cards"><div class="section-h"><h2>Flashcards</h2><a href="flashcards.html">Study now →</a></div><p class="small">${due.due} due today · ${due.fresh} never seen · ${due.total} in total · diagnostic: ${main.diag&&main.diag.rec?`suggested <a href="${esc(PBI.safeHref(main.diag.rec.href,'learn.html'))}">${esc(main.diag.rec.label)}</a> (<a href="diagnostic.html">retake</a>)`:'<a href="diagnostic.html">not taken</a>'}</p></section>`;

document.getElementById('pp').innerHTML=evHtml+stagesHtml+compHtml+xpHtml+portHtml+decHtml+modsHtml+certHtml+cardHtml;

/* ---------- backup and reset ---------- */
function renderBackup(){
  const el=document.getElementById('backup');if(!el)return;
  const b=PBI.backupInfo();
  if(!b){el.innerHTML='';return}
  const why={import:'before your last import',reset:'before you reset everything',restore:'before your last restore'}[b.reason];
  el.innerHTML=`<p class="small backupnote">A backup from ${esc(PBI.fmtDate(b.at))}, saved ${why}, holds ${b.sum.assignments} assignments, ${b.sum.scenarios} scenarios and ${b.sum.cards} flashcards. <button class="btn sm" type="button" id="restoreBk">Restore previous progress</button></p>`;
}
renderBackup();
/* analytics opt-out (only when page-view counting is configured; see PRIVACY.md) */
(function(){
  if(!document.querySelector('meta[name="pbi-analytics"]'))return;
  let off=false;try{off=localStorage.getItem('pbi-analytics-off')==='1'}catch(e){}
  const gpc=navigator.globalPrivacyControl===true||navigator.doNotTrack==='1';
  document.getElementById('pp').insertAdjacentHTML('beforeend',`<section id="privacy"><div class="section-h"><h2>Privacy</h2><a href="${PBI.REPO}/blob/main/PRIVACY.md" rel="noopener" target="_blank">What is collected →</a></div>
<p class="small muted" style="max-width:70ch">The site counts anonymous page views (which page, roughly where, which browser type) to see what gets used. No cookies, no account, and nothing about your progress, answers, notes or searches is ever sent. ${gpc?'Your browser asks sites not to track it, so nothing is counted.':''}</p>
<label class="small"><input type="checkbox" id="anaOpt"${off||gpc?'':' checked'}${gpc?' disabled':''}> Count my page views anonymously</label></section>`);
  document.getElementById('anaOpt').addEventListener('change',e=>{try{e.target.checked?localStorage.removeItem('pbi-analytics-off'):localStorage.setItem('pbi-analytics-off','1')}catch(_){}PBI.toast(e.target.checked?'Anonymous page-view counting on':'Page views are no longer counted from this browser')});
})();
document.addEventListener('click',e=>{
  if(!e.target.closest('#restoreBk'))return;
  if(!confirm('Put back the backed-up progress? What is in this browser now becomes the backup, so you can switch back.'))return;
  if(PBI.restoreBackup()){PBI.toast('Previous progress restored');setTimeout(()=>location.reload(),500)}
});
document.getElementById('resetAll').addEventListener('click',()=>{
  if(!confirm('Delete all progress in this browser: ticks, quiz answers, scenarios, flashcard history? A backup is kept, so you can restore it from this page.'))return;
  PBI.backup('reset');
  Object.values(PBI.KEYS).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});PBI.toast('Progress reset');setTimeout(()=>location.reload(),500);
});
PBI.initThemeToggles();
if(location.hash){const el=document.getElementById(location.hash.slice(1));if(el)requestAnimationFrame(()=>el.scrollIntoView())}
})();
