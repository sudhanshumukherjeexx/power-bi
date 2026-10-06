/* Skill Mode hub: levels, tracks, career paths and the versioned certification map. */
(function(){
'use strict';
const P=PBI.P,esc=PBI.esc;
const main=P.main(),cards=P.cards();
const dateTxt=iso=>{const [y,m,d]=iso.split('-').map(Number);return d+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]+' '+y};

const card=m=>{const r=P.moduleReadiness(m,main,cards);const n=m.topics.reduce((a,t)=>a+t.g.length,0);
  return `<a class="mcard" href="${m.id}.html" style="--c:var(--t-${esc(m.cls)})"><h3>${esc(m.name)}</h3><p>${esc(m.tagline||'')}</p><span class="meta"><span>${m.topics.length} topics · ${n} assignments</span></span><span class="meta">${P.bar(r.pct,m.name+' readiness')}<span>${r.pct}%</span></span></a>`};
document.getElementById('levelCards').innerHTML=MODULES.filter(m=>m.kind==='level').map(card).join('');
const tracks=MODULES.filter(m=>m.kind==='track');
document.getElementById('trackCards').innerHTML=tracks.length?tracks.map(card).join(''):'<div class="empty">Tracks are being added.</div>';

/* career paths */
const topicName=id=>{const t=P.topic(id);return t?t.name.split(':')[0]:id};
const topicHref=id=>{const t=P.topic(id);return t?`${t.module}.html#${id}`:'#'};
document.getElementById('roles').innerHTML=`<div class="cards">${ROLES.map(r=>{
  const rd=r.core.map(id=>{const t=P.topic(id);return t?P.readiness(t,main,cards).pct:0});const pct=rd.length?Math.round(rd.reduce((a,b)=>a+b,0)/rd.length):0;
  return `<div class="mcard" style="--c:var(--grail-gold)"><h3>${esc(r.name)}</h3><p><span class="chip">${esc(r.tag)}</span></p><p>${esc(r.desc)}</p><details><summary>${r.core.length} core topics</summary><ul style="margin:6px 0 0;padding-left:18px;font-size:.88rem">${r.core.map(id=>`<li><a href="${topicHref(id)}">${esc(topicName(id))}</a></li>`).join('')}</ul></details><span class="meta">${P.bar(pct,r.name+' readiness')}<span>${pct}%</span></span></div>`}).join('')}</div>`;

/* certification map */
let sel=(location.hash.match(/cert=(\w+)/)||[])[1]||CERTS[0].id;
function renderCert(){
  document.getElementById('certTabs').innerHTML=CERTS.map(c=>`<a href="#certs" role="tab" data-cert="${c.id}" aria-selected="${c.id===sel}"${c.id===sel?' aria-current="page"':''}>${esc(c.code)}</a>`).join('');
  const c=CERTS.find(x=>x.id===sel);const R=P.cert(c,main,cards);
  const v=c.current;
  document.getElementById('certBody').innerHTML=`<div class="topic" style="padding:16px 18px">
    <h3 style="margin:0 0 4px">${esc(c.code)} · ${esc(c.name)}</h3>
    <p class="muted" style="margin:0 0 8px">${esc(c.blurb)}</p>
    <p class="small" style="margin:0 0 6px"><span class="chip ok">Outline in force: ${esc(v.label)}</span> <span class="chip">Checked ${dateTxt(c.verified.date)}</span> ${c.next?`<span class="chip warn">Changes on ${dateTxt(c.next.effective)}</span>`:''}</p>
    ${c.next?`<p class="small muted">Booking after ${dateTxt(c.next.effective)}? ${esc(c.next.changes)}</p>`:`<p class="small muted">${esc(v.changes)}</p>`}
    <p class="small muted">${esc(c.note||'')} <a href="${esc(c.url)}" rel="noopener" target="_blank">Official study guide</a></p>
    <p class="small" style="margin:10px 0 0"><b>Curriculum coverage ${R.coverage}%</b> <span class="ev-tag ev-self">self-assessed</span> · <b>Practice ${R.practice}%</b> <span class="ev-tag ev-verified">verified + recall</span></p><p class="small muted" style="margin:2px 0 0">Weighted by Microsoft's published domain weights (midpoint of each range). Coverage is the share of mapped assignments you ticked; practice is your first-answer accuracy and flashcard mastery on those topics. Neither predicts an exam result.</p>
    ${(c.next||v).areas.map((a,i)=>{const r=R.areas[i]||{coverage:0,practice:0};return `<div style="border-top:1px solid var(--border);padding:12px 0">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap"><b>${esc(a.n)}</b><span class="small muted">${esc(a.w)} of the exam · coverage ${r.coverage}% · practice ${r.practice}%</span></div>
      <div style="margin:6px 0">${P.bar(r.coverage,a.n+' coverage')}</div>
      <div class="small">Practise in: ${a.topics.map(id=>`<a href="${topicHref(id)}">${esc(topicName(id))}</a>`).join(', ')}</div>
      ${a.skills?`<details style="margin-top:6px"><summary>${a.skills.length} skill groups, ${a.skills.reduce((x,s)=>x+s.items.length,0)} objectives</summary>${a.skills.map(s=>`<div style="margin:8px 0 0"><b style="font-size:.9rem">${esc(s.n)}</b> <span class="small muted">→ ${s.topics.map(id=>`<a href="${topicHref(id)}">${esc(topicName(id))}</a>`).join(', ')}</span><ul style="margin:4px 0 0;padding-left:18px;font-size:.86rem;color:var(--text-secondary)">${s.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</details>`:''}
    </div>`}).join('')}
    ${c.next?`<p class="small muted" style="margin:6px 0 0">Shown: the outline that takes effect on ${dateTxt(c.next.effective)}, because most people booking now will sit it after that date. Your readiness is measured against the topics that map to it.</p>`:''}
  </div>`;
}
document.getElementById('certTabs').addEventListener('click',e=>{const t=e.target.closest('[data-cert]');if(!t)return;e.preventDefault();sel=t.dataset.cert;renderCert()});
renderCert();
PBI.initThemeToggles();
PBI.touch('Learn: Skill Mode');
if(location.hash){const el=document.getElementById(location.hash.slice(1).split('=')[0].replace(/cert$/,'certs'));if(el)requestAnimationFrame(()=>el.scrollIntoView())}
})();
