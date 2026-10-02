/* experience.html: scenarios by professional stage, the team, and the incident severity guide. */
(function(){
'use strict';
const P=PBI.P,esc=PBI.esc;
const main=P.main();
const host=document.getElementById('hub');
const KIND={ticket:'Ticket',incident:'Incident',change:'Change',review:'Review',decision:'Decision',uat:'UAT'};
let filter=(location.hash.match(/filter=(\w+)/)||[])[1]||'all';
const FILTERS=[['all','Everything'],['sprint','Sprints'],['incident','Incidents'],['decision','Decisions'],['drill','Drills']];
const match=s=>filter==='all'||(filter==='sprint'&&s.type==='sprint')||(filter==='drill'&&s.type==='drill')||(filter==='incident'&&s.kind==='incident')||(filter==='decision'&&(s.kind==='decision'||s.decision));
const kindOf=s=>s.kind||'ticket';

function card(s){
  const st=P.scenarioStatus(main,s.id),rec=main.xp[s.id],sc=rec&&rec.done?P.scenarioScore(s,rec):null;
  return `<a class="xcard" href="experience/${s.slug}.html"><span class="xtop"><span class="tk-kind k-${kindOf(s)}">${KIND[kindOf(s)]||'Ticket'}</span>${s.severity?`<span class="sev sev${s.severity.slice(-1)}">${s.severity}</span>`:''}<span class="tk-id">${esc(s.ticket)}</span>${s.type==='drill'?'<span class="chip">Drill</span>':''}</span><h3>${esc(s.title)}</h3><p>${esc(s.summary)}</p><span class="foot2"><span>~${Math.round(s.minutes/60*10)/10} h</span><span class="st">${st==='done'?`<span class="chip ok">Done${sc?' · '+sc.pct+'%':''}</span>`:st==='active'?'<span class="chip">In progress</span>':''}</span></span></a>`;
}
function render(){
  const idx=SCENARIO_INDEX;
  const t=P.xpTotals(main);
  let h=`<div class="tiles"><div class="tile"><span class="k">Finished</span><b>${t.done}/${t.n}</b>${P.bar(t.pct,'Scenarios finished')}</div><div class="tile"><span class="k">In progress</span><b>${t.active}</b></div><a class="tile" href="progress.html#decisions"><span class="k">Decision log</span><b>${idx.filter(s=>main.xp[s.id]&&main.xp[s.id].dec).length}</b><span class="s">architecture decisions recorded</span></a><a class="tile" href="progress.html#portfolio"><span class="k">Portfolio</span><b>${P.portfolio(main).length}</b><span class="s">deliverables written</span></a></div>`;
  h+=`<div class="filters" role="group" aria-label="Show">${FILTERS.map(([k,l])=>`<button type="button" data-f="${k}" aria-pressed="${k===filter}">${l}</button>`).join('')}</div>`;
  for(const st of STAGES){
    const list=idx.filter(s=>s.stage===st.id&&match(s));
    if(!list.length)continue;
    h+=`<section id="stage-${st.id}" aria-labelledby="sh-${st.id}"><div class="stagehead"><span class="n">Stage ${st.n}</span><h2 id="sh-${st.id}">${esc(st.name)}</h2><p><b>${esc(st.question)}</b> ${esc(st.challenge)}</p></div><div class="cards">${list.map(card).join('')}</div></section>`;
  }
  h+=`<section id="incidents" aria-labelledby="inc-h"><div class="section-h"><h2 id="inc-h">Incident severity guide</h2><a href="templates.html#tpl-incident-report">Incident report template →</a></div>
  <div class="tblscroll"><table class="tbl"><thead><tr><th scope="col">Level</th><th scope="col">Meaning at Northwind</th><th scope="col">First update</th><th scope="col">Example</th></tr></thead><tbody>
  <tr><td><span class="sev sev1">SEV1</span></td><td>Wrong or missing numbers for executives, finance close or regulators; or a confirmed data exposure.</td><td>15 minutes</td><td>The CFO's board pack refresh failed an hour before the meeting.</td></tr>
  <tr><td><span class="sev sev2">SEV2</span></td><td>A key report is wrong or unavailable for a whole department, or security is weakened without confirmed exposure.</td><td>1 hour</td><td>A regional manager can see another region's payroll.</td></tr>
  <tr><td><span class="sev sev3">SEV3</span></td><td>Degraded: slow, partly stale, or a workaround exists.</td><td>Same day</td><td>The executive dashboard takes 18 seconds on Monday mornings.</td></tr>
  <tr><td><span class="sev sev4">SEV4</span></td><td>Cosmetic or single-user issue.</td><td>Next sprint</td><td>A tooltip shows the wrong format.</td></tr>
  </tbody></table></div><p class="small muted">For every incident: mitigate first, then find the root cause, then fix it permanently, then prevent it. Update stakeholders on a fixed schedule, even when nothing has changed.</p></section>`;
  h+=`<section id="personas" aria-labelledby="team-h"><div class="section-h"><h2 id="team-h">The people you'll work with</h2></div><div class="team">${PERSONAS.map(p=>`<div><b>${esc(p.name)}</b><span>${esc(p.role)}</span><p>${esc(p.cares)}</p></div>`).join('')}</div></section>`;
  host.innerHTML=h;
}
host.addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;filter=b.dataset.f;history.replaceState(null,'',filter==='all'?location.pathname:'#filter='+filter);render()});
render();
PBI.initThemeToggles();
PBI.touch('Practice: Experience Mode');
if(location.hash.startsWith('#stage-')||location.hash==='#incidents'||location.hash==='#personas'){const el=document.getElementById(location.hash.slice(1));if(el)requestAnimationFrame(()=>el.scrollIntoView())}
})();
