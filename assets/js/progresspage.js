/* progress.html: stage ladder, competency matrix, modules, scenarios, portfolio, decisions, certifications. */
(function(){
'use strict';
const P=PBI.P,esc=PBI.esc;
const main=P.main(),cards=P.cards();
const stages=P.stages(main,cards),cur=P.currentStage(main,cards);
const comp=P.competency(main,cards);
const due=P.due(cards);
const xpHref=s=>`experience/${s.slug}.html`;
const tpl=id=>(TEMPLATE_INDEX.find(t=>t.id===id)||{title:id}).title;

const stagesHtml=`<section id="stages"><div class="section-h"><h2>Professional stage</h2><a href="experience.html">Experience Mode →</a></div>
<p class="muted" style="max-width:70ch">Stages are about responsibility, not years. Each combines the Skill Mode topics for that stage with its Experience Mode scenarios.</p>
<ol class="stagelist">${stages.map(s=>`<li class="${s.id===cur.id?'cur':''}"><span class="n" aria-hidden="true">${s.n}</span><span><b>${esc(s.name)}${s.id===cur.id?' <span class="chip">you are here</span>':''}</b><span>${esc(s.question)} · ${esc(s.challenge)}</span></span><span class="pc"><span>${s.pct}% · ${s.scenariosDone}/${s.scenarios} scenarios</span>${P.bar(s.pct,s.name)}</span></li>`).join('')}</ol></section>`;

const compHtml=`<section id="competency"><div class="section-h"><h2>Competency matrix</h2></div>
<p class="muted" style="max-width:70ch">Each bar is the share of the available evidence for that skill that you have earned. Less-guided assignments and finished scenarios count for more than quiz answers and flashcards.</p>
<div class="matrix">${comp.map(c=>`<div class="row"><span class="nm" title="${esc(c.desc)}">${esc(c.name)}</span>${P.bar(c.pct,c.name)}<span class="pct">${c.pct}%</span><span class="ev">${c.ev.asg[0]}/${c.ev.asg[1]} assignments · ${c.ev.mcq[0]}/${c.ev.mcq[1]} quiz · ${c.ev.cards[0]}/${c.ev.cards[1]} cards · ${c.ev.xp[0]}/${c.ev.xp[1]} scenarios</span></div>`).join('')}</div></section>`;

const modsHtml=`<section id="skill"><div class="section-h"><h2>Skill Mode</h2><a href="learn.html">All levels and tracks →</a></div>
<div class="tblscroll"><table class="tbl"><thead><tr><th scope="col">Level or track</th><th scope="col">Assignments</th><th scope="col">Readiness</th></tr></thead><tbody>${MODULES.map(m=>{const r=P.moduleReadiness(m,main,cards);return `<tr><td><a href="${m.id}.html">${esc(m.name)}</a> <span class="small muted">${m.kind}</span></td><td class="num">${r.done}/${r.asg}</td><td style="min-width:140px">${P.bar(r.pct,m.name)} <span class="small">${r.pct}%</span></td></tr>`}).join('')}</tbody></table></div></section>`;

const xpRows=SCENARIO_INDEX.map(s=>{const rec=main.xp[s.id];const st=P.scenarioStatus(main,s.id);const sc=P.scenarioScore(s,rec);
  return `<tr><td><a href="${xpHref(s)}">${esc(s.title)}</a><div class="small muted">${esc(s.ticket||'')} · stage ${(STAGES.find(x=>x.id===s.stage)||{}).n||''}</div></td><td>${st==='done'?'<span class="chip ok">Done</span>':st==='active'?'<span class="chip">In progress</span>':'<span class="small muted">Not started</span>'}</td><td class="num">${sc?sc.pct+'%':'–'}</td><td class="num">${rec?rec.hints||0:0}</td><td>${rec&&rec.sol?(rec.solEarly?'early':'after'):'–'}</td></tr>`}).join('');
const xpHtml=`<section id="experience"><div class="section-h"><h2>Experience Mode</h2><a href="experience.html">All scenarios →</a></div>
${SCENARIO_INDEX.length?`<div class="tblscroll"><table class="tbl"><thead><tr><th scope="col">Scenario</th><th scope="col">Status</th><th scope="col">Score</th><th scope="col">Hints</th><th scope="col">Solution</th></tr></thead><tbody>${xpRows}</tbody></table></div><p class="small muted">Score = your rubric self-assessment, minus 5% per hint (at most 20%), ×0.7 if you opened the solution before finishing.</p>`:'<div class="empty">No scenarios yet.</div>'}</section>`;

const port=P.portfolio(main);
const byArt={};port.forEach(p=>{const k=p.del.artifact||'other';(byArt[k]=byArt[k]||[]).push(p)});
const portHtml=`<section id="portfolio"><div class="section-h"><h2>Portfolio</h2><a href="templates.html">Templates →</a></div>
${port.length?`<div class="tblscroll"><table class="tbl"><thead><tr><th scope="col">Artifact</th><th scope="col">From</th></tr></thead><tbody>${Object.entries(byArt).map(([k,list])=>list.map((p,i)=>`<tr><td>${i?'':`<b>✓ ${esc(k==='other'?'Other deliverables':tpl(k))}</b>`}<div class="small">${esc(p.del.t)}</div></td><td><a href="${xpHref(p.scenario)}">${esc(p.scenario.title)}</a></td></tr>`).join('')).join('')}</tbody></table></div>`:'<div class="empty">Deliverables you mark as done in Experience Mode scenarios appear here, grouped by type: requirements, KPI dictionary, incident report, ADR, pull request…</div>'}
<details style="margin-top:12px"><summary>Turning this into a GitHub portfolio</summary><ol style="font-size:.92rem;color:var(--ink-2)"><li>Create one public repository per finished scenario, named after the business problem ("revenue-reconciliation"), not the course.</li><li>Commit your own documents (requirements, validation, ADR, postmortem) and your PBIP folder. Leave out the scenario's model answer: employers want your reasoning, and publishing the answer spoils it for other learners.</li><li>Write a README with Problem, Impact, Evidence, Options, Recommendation, Risk and Ask. That is the senior conversation, in writing.</li><li>Add screenshots of your report and of your validation table (before/after numbers).</li><li>Say clearly that the company and data are fictional and generated, and link to this project.</li></ol></details></section>`;

const decs=SCENARIO_INDEX.filter(s=>s.decision&&main.xp[s.id]&&main.xp[s.id].dec);
const decHtml=`<section id="decisions"><div class="section-h"><h2>Decision log</h2></div>
${decs.length?`<ol class="route">${decs.map(s=>{const d=main.xp[s.id].dec;return `<li class="done"><a href="${xpHref(s)}#ev-decision"><span><b>${esc(d.adr||'ADR')} · ${esc(d.title||s.title)}</b><span>${esc(d.option||'')}${d.why?': '+esc(d.why.slice(0,160)):''}</span></span><span class="st">${esc((d.at||'').slice(0,10))}</span></a></li>`}).join('')}</ol>`:'<div class="empty">Architecture scenarios ask you to choose an option and record why. Your decisions appear here, and later scenarios refer back to them.</div>'}</section>`;

const certHtml=`<section id="certs"><div class="section-h"><h2>Certification readiness</h2><a href="learn.html#certs">Certification map →</a></div><div class="cards">${CERTS.map(c=>{const R=P.cert(c,main,cards);return `<a class="mcard" href="learn.html#certs" style="--c:var(--yellow)"><h3>${esc(c.code)}</h3><p>${esc(R.label)}${R.next?' · changes '+esc(R.next.effective):''}</p>${R.areas.map(a=>`<span class="meta"><span style="min-width:0;flex:1;white-space:normal">${esc(a.n)}</span><span>${a.pct}%</span></span>`).join('')}<span class="meta">${P.bar(R.pct,c.code)}<span>${R.pct}%</span></span></a>`}).join('')}</div></section>`;

const cardHtml=`<section id="cards"><div class="section-h"><h2>Flashcards</h2><a href="flashcards.html">Study now →</a></div><div class="tiles"><div class="tile"><span class="k">Due today</span><b>${due.due}</b></div><div class="tile"><span class="k">Never seen</span><b>${due.fresh}</b></div><div class="tile"><span class="k">Total cards</span><b>${due.total}</b></div><div class="tile"><span class="k">Diagnostic</span><b style="font-size:1rem">${main.diag&&main.diag.rec?esc(main.diag.rec.label):'Not taken'}</b><a class="s" href="diagnostic.html">${main.diag?'Retake':'Take it'}</a></div></div></section>`;

document.getElementById('pp').innerHTML=stagesHtml+compHtml+xpHtml+portHtml+decHtml+modsHtml+certHtml+cardHtml;
document.getElementById('resetAll').addEventListener('click',()=>{
  if(!confirm('Delete all progress in this browser: ticks, quiz answers, scenarios, flashcard history? Export first if you might want it back.'))return;
  Object.values(PBI.KEYS).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});PBI.toast('Progress reset');setTimeout(()=>location.reload(),500);
});
PBI.initThemeToggles();
if(location.hash){const el=document.getElementById(location.hash.slice(1));if(el)requestAnimationFrame(()=>el.scrollIntoView())}
})();
