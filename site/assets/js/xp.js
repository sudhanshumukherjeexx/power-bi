/* Experience Mode scenario page. Renders SCENARIOS[id] (assets/js/experience.js) and keeps the learner's
   work in localStorage (main key → xp[id]). The model answer is fetched only on request. */
(function(){
'use strict';
const P=PBI.P,esc=PBI.esc,R=PBI.ROOT;
const id=document.body.dataset.scenario;
const S=SCENARIOS[id];
const app=document.getElementById('app');
if(!S){app.innerHTML='<p>Scenario not found. <a href="'+R+'experience.html">All scenarios</a></p>';return}
const meta=SCENARIO_INDEX.find(x=>x.id===id);
const stage=STAGES.find(s=>s.id===S.stage);
const persona=k=>PERSONAS.find(p=>p.id===k)||{name:k==='you'?'You':k,role:''};
const initials=n=>n.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
const KIND={ticket:'Ticket',incident:'Incident',change:'Change request',review:'Review',decision:'Decision',uat:'UAT'};
const now=()=>new Date().toISOString();

/* ---------- state ---------- */
const rec=()=>P.main().xp[id]||null;
const saveRec=fn=>PBI.update(PBI.KEYS.main,st=>{PBI.migrate(st);const r=st.xp[id]||(st.xp[id]={st:'active',started:now(),hints:0,sol:false,del:{},rub:{},notes:''});fn(r,st);r.updated=now();st.last={href:'experience/'+S.slug+'.html',title:S.ticket.id+' · '+S.title,at:now()};return st});

/* ---------- small renderers ---------- */
const para=b=>(Array.isArray(b)?b:[b]).map(p=>/^- /.test(p)?`<ul>${p.split('\n').map(l=>`<li>${fmt(l.replace(/^- /,''))}</li>`).join('')}</ul>`:`<p>${fmt(p)}</p>`).join('');
/* light formatting: **bold**, `code` */
function fmt(t){return esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>')}
const tbl=(cols,rows,cap)=>`<div class="tblscroll"><table class="tbl">${cap?`<caption>${esc(cap)}</caption>`:''}<thead><tr>${cols.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td${/^[−\-+$€]?[\d,.]+%?$|^[−\-+]?\$[\d,.]+$/.test(String(c))?' class="num"':''}>${fmt(String(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const code=(lang,body)=>`<div class="codewrap"><span class="lang">${esc(lang||'text')}</span><button class="cp" type="button" data-copycode>Copy</button><pre><code>${esc(Array.isArray(body)?body.join('\n'):body)}</code></pre></div>`;
const sevCls=s=>s?'sev sev'+s.slice(-1):'';

/* ---------- header ---------- */
function header(){
  const r=rec(),status=!r?'new':r.done?'done':'active';
  const sc=r&&r.done?P.scenarioScore(meta,r):null;
  const rep=persona(S.ticket.reporter);
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="${R}experience.html">Practice</a><span aria-hidden="true">/</span><a href="${R}experience.html#stage-${S.stage}">Stage ${stage.n}: ${esc(stage.name)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(S.ticket.id)}</span></nav>
  <header class="ticket">
    <div class="tk-top"><span class="tk-kind k-${S.ticket.kind}">${KIND[S.ticket.kind]||'Ticket'}</span>${S.ticket.severity?`<span class="${sevCls(S.ticket.severity)}">${S.ticket.severity}</span>`:''}<span class="tk-id">${esc(S.ticket.id)}</span>${S.type==='drill'?'<span class="chip">Drill</span>':''}<span class="tk-status st-${status}">${status==='done'?`Done${sc?' · '+sc.pct+'%':''}`:status==='active'?'In progress':'Not started'}</span></div>
    <h1>${esc(S.title)}</h1>
    <p class="tk-sum">${esc(S.summary)}</p>
    <dl class="tk-meta"><div><dt>Reported by</dt><dd>${esc(rep.name)}${rep.role?`, ${esc(rep.role)}`:''}</dd></div><div><dt>Opened</dt><dd>${esc(S.ticket.opened)}</dd></div>${S.ticket.due?`<div><dt>Needed by</dt><dd>${esc(S.ticket.due)}</dd></div>`:''}${S.ticket.priority?`<div><dt>Priority</dt><dd>${esc(S.ticket.priority)}</dd></div>`:''}<div><dt>Time box</dt><dd>${Math.round(S.minutes/60*10)/10} h</dd></div></dl>
    <div class="tk-skills">${S.skills.map(k=>{const s=SKILLS.find(x=>x.id===k);return `<span class="chip">${esc(s?s.name:k)}</span>`}).join('')}</div>
    ${status==='new'?`<div class="cta" style="margin-top:12px"><button class="btn primary" type="button" id="startBtn">Take the ticket</button><span class="small muted">Read the brief first. Nothing is graded until you finish.</span></div>`:''}
  </header>
  ${S.story?`<div class="story"><b>Previously at Northwind</b>${para(S.story)}</div>`:''}
  ${earlierHtml()}
  <div class="impact"><b>Why the business cares</b> ${fmt(S.impact)}</div>`;
}
function earlierHtml(){
  if(!S.earlier)return '';
  const m=P.main();
  return S.earlier.map(e=>{const r=m.xp[e.scenario];const d=r&&r.dec;const sc=SCENARIOS[e.scenario];
    return `<div class="story earlier"><b>Your earlier decision${sc?` (${esc(sc.ticket.id)})`:''}</b><p>${fmt(e.intro)}</p>${d?`<p><span class="chip ok">${esc(d.adr||'')} ${esc(d.option||'')}</span> ${esc(d.why?'“'+d.why.slice(0,220)+(d.why.length>220?'…':'')+'”':'')}</p><p>${fmt(e.consequences[d.id]||'')}</p>`:`<p>${fmt(e.none||'You have not recorded that decision yet. The consequences below assume the most common choice.')}</p>${e.consequences.default?`<p>${fmt(e.consequences.default)}</p>`:''}`}</div>`}).join('');
}

/* ---------- tabs ---------- */
const TABS=[['brief','Brief'],['evidence','Evidence'],['work','Your work'],['hints','Hints'],['review','Finish and review']];
function tabs(){
  const r=rec();
  const lbl={evidence:` <span class="n">${S.evidence.length}</span>`,hints:` <span class="n">${r?r.hints||0:0}/${S.hints.length}</span>`};
  return `<div class="xptabs" role="tablist" aria-label="Scenario sections">${TABS.map(([k,l],i)=>`<button role="tab" id="tab-${k}" aria-controls="pane-${k}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-tab="${k}">${l}${lbl[k]||''}</button>`).join('')}</div>
  ${TABS.map(([k],i)=>`<section class="xppane" role="tabpanel" id="pane-${k}" aria-labelledby="tab-${k}"${i?' hidden':''} tabindex="0"></section>`).join('')}`;
}
function show(k,focus){
  document.querySelectorAll('.xptabs [role=tab]').forEach(b=>{const on=b.dataset.tab===k;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;if(on&&focus)b.focus()});
  document.querySelectorAll('.xppane').forEach(p=>p.hidden=p.id!=='pane-'+k);
  renderPane(k);
}

/* ---------- panes ---------- */
function brief(){
  return `<div class="inbox">${S.messages.map(m=>{const p=persona(m.from);return `<article class="msg via-${m.via}"><header><span class="av" aria-hidden="true">${esc(initials(p.name))}</span><span class="who"><b>${esc(p.name)}</b><span>${esc(p.role)}</span></span><span class="when"><span class="via">${esc(m.via)}</span> ${esc(m.at)}</span></header>${m.subject?`<h3>${esc(m.subject)}</h3>`:''}<div class="body">${para(m.body)}</div></article>`}).join('')}</div>
  <h2 class="xph">What you are expected to do</h2><ul class="tasks">${S.tasks.map(t=>`<li>${fmt(t)}</li>`).join('')}</ul>
  <p class="small muted">The brief is deliberately incomplete, like real tickets. Part of the work is noticing what is missing and asking for it (write the questions in Your work).</p>`;
}
function evidence(){
  return `<p class="muted small">Everything you get is listed here. Some of it is irrelevant, some of it is wrong. Files download straight to your computer; CSVs can be previewed.</p>`+S.evidence.map(e=>{
    let inner='';
    if(e.kind==='file')inner=`<div class="ev-acts"><a class="btn sm" href="${R}${esc(e.file)}" download>Download</a>${/\.csv$/.test(e.file)?`<button class="btn sm" type="button" data-preview="${esc(e.file)}" aria-expanded="false">Preview</button>`:/\.(txt|tmdl|dax|json|sql|md|log|m|ps1|py|yml)$/.test(e.file)?`<button class="btn sm" type="button" data-preview="${esc(e.file)}" aria-expanded="false">Open</button>`:''}</div><div class="ev-prev" hidden></div>`;
    else if(e.kind==='table')inner=tbl(e.cols,e.rows);
    else if(e.kind==='code'||e.kind==='diff'||e.kind==='log')inner=code(e.lang||e.kind,e.body);
    else inner=`<div class="doc">${para(e.body)}</div>`;
    return `<article class="ev" id="ev-${esc(e.id)}"><header><span class="ev-kind">${esc(e.kind==='file'?(e.file.split('.').pop()||'file').toUpperCase():e.kind)}</span><h3>${esc(e.title)}</h3></header>${e.desc?`<p class="small muted">${fmt(e.desc)}</p>`:''}${inner}</article>`}).join('');
}
function work(){
  const r=rec()||{del:{},notes:''};
  const tplLink=a=>a&&TEMPLATE_INDEX.find(t=>t.id===a)?` <a class="small" href="${R}templates.html#tpl-${a}">template</a>`:'';
  let h=`<h2 class="xph">Deliverables</h2><p class="small muted">Tick each one when you have actually written it. Ticked deliverables appear under portfolio evidence on your progress page.</p><ul class="dels">${S.deliverables.map(d=>`<li><label><input type="checkbox" data-del="${esc(d.id)}"${r.del&&r.del[d.id]?' checked':''}> <span>${fmt(d.t)}</span></label>${tplLink(d.artifact)}</li>`).join('')}</ul>`;
  if(S.decision)h+=decisionHtml();
  if(S.interactive)h+=`<div id="interactive">${interactiveHtml()}</div>`;
  if(['senior','engineer','architect'].includes(S.stage))h+=`<details class="senior"><summary>The senior conversation: a structure for your write-up</summary><ol><li><b>Problem</b>: one sentence, in business terms.</li><li><b>Impact</b>: who is affected, how much, since when.</li><li><b>Evidence</b>: what you measured or found, with numbers.</li><li><b>Options</b>: two or three, each with cost and risk.</li><li><b>Recommendation</b>: one option, and why.</li><li><b>Risk</b>: what could go wrong and how you'd notice.</li><li><b>Ask</b>: the decision or help you need, from whom, by when.</li></ol></details>`;
  h+=`<h2 class="xph"><label for="notes">Working notes</label></h2><p class="small muted">Saved in this browser as you type. Use it for questions to ask, assumptions, findings and numbers.</p><textarea id="notes" rows="10" spellcheck="true" placeholder="Questions to ask…&#10;Assumptions…&#10;What I found…">${esc(r.notes||'')}</textarea>`;
  return h;
}
function decisionHtml(){
  const d=S.decision,r=rec(),cur=r&&r.dec;
  return `<section class="decision" id="ev-decision" aria-labelledby="dec-h"><h2 class="xph" id="dec-h">${esc(d.adr)}: ${esc(d.title)}</h2><p>${fmt(d.question)}</p>
  <fieldset><legend class="vh">Options</legend>${d.options.map(o=>`<label class="opt"><input type="radio" name="dec" value="${esc(o.id)}"${cur&&cur.id===o.id?' checked':''}> <span><b>${esc(o.t)}</b>${o.d?`<span>${fmt(o.d)}</span>`:''}</span></label>`).join('')}</fieldset>
  <label for="decWhy" class="small" style="display:block;margin-top:10px;font-weight:600">Why this option, and what would make you revisit it?</label><textarea id="decWhy" rows="4">${esc(cur&&cur.why||'')}</textarea>
  <div class="cta" style="margin-top:8px"><button class="btn primary sm" type="button" id="decSave">Record decision</button>${cur?`<span class="small muted">Recorded ${esc((cur.at||'').slice(0,10))}. It appears in your decision log, and later scenarios refer back to it.</span>`:''}</div></section>`;
}
function interactiveHtml(){
  const I=S.interactive,r=rec()||{},picks=r.picks||{};
  if(I.type==='questions')return `<h2 class="xph">Which questions would you ask?</h2><p class="small muted">${fmt(I.intro||'For each request, tick the questions you would ask before building anything. Then check.')}</p>${I.prompts.map((p,pi)=>{const per=persona(p.from);return `<div class="qpick" data-p="${pi}"><p class="req"><b>${esc(per.name)}</b>: “${fmt(p.request)}”</p>${p.options.map((o,oi)=>{const k=pi+'-'+oi,on=picks[k];const checked=r.checked&&r.checked[pi];return `<label class="${checked?(o.good?'ok':on?'bad':''):''}"><input type="checkbox" data-pick="${k}"${on?' checked':''}> <span>${fmt(o.q)}${checked?`<span class="why">${o.good?'Worth asking. ':'Not now. '}${fmt(o.why)}</span>`:''}</span></label>`}).join('')}<button class="btn sm" type="button" data-checkp="${pi}">Check</button>${r.checked&&r.checked[pi]?`<span class="small muted"> ${p.options.filter((o,oi)=>o.good===!!picks[pi+'-'+oi]).length} of ${p.options.length} choices match an experienced BI developer's.</span>`:''}</div>`}).join('')}`;
  if(I.type==='assessment'){
    const ans=r.ans||{};
    const res=assessmentResult(ans);
    return `<h2 class="xph">${esc(I.title||'Assessment')}</h2><p class="small muted">${fmt(I.intro||'')}</p>${I.dims.map((d,di)=>`<fieldset class="dq"><legend><span class="area">${esc(d.n)}</span>${fmt(d.q)}</legend>${d.levels.map((l,li)=>`<label><input type="radio" name="dim${di}" value="${li}" data-dim="${di}"${ans[di]===li?' checked':''}> <span><b>${li+1}</b> · ${fmt(l)}</span></label>`).join('')}</fieldset>`).join('')}${res?`<div class="result"><h3 style="margin-top:0">Maturity: ${res.avg.toFixed(1)} / 5 (${esc(res.label)})</h3>${tbl(['Dimension','Level','Next step'],res.rows)}</div>`:''}`;
  }
  return '';
}
function assessmentResult(ans){
  const I=S.interactive;if(!I.dims.every((_,i)=>ans[i]!==undefined))return null;
  const rows=I.dims.map((d,i)=>[d.n,String(ans[i]+1),d.next[Math.min(ans[i],d.next.length-1)]]);
  const avg=I.dims.reduce((a,_,i)=>a+ans[i]+1,0)/I.dims.length;
  return {avg,rows,label:I.labels[Math.min(I.labels.length-1,Math.max(0,Math.round(avg)-1))]};
}
function hints(){
  const r=rec(),n=r?r.hints||0:0;
  return `<p class="muted small">Hints narrow where to look; they never give the answer. Using one doesn't lower your outcome. It's recorded separately as independence (10 points per hint, at most 40), because at work asking early is often the right call.</p><ol class="hints">${S.hints.map((h,i)=>i<n?`<li class="shown"><b>Hint ${i+1}</b> ${fmt(h)}</li>`:'').join('')}</ol>${n<S.hints.length?`<button class="btn" type="button" id="hintBtn">Show hint ${n+1} of ${S.hints.length}</button>`:'<p class="small muted">No more hints. Try the evidence again, then the model answer in the Finish tab.</p>'}${contextHtml()}`;
}
/* "Need more context?": external reading linked to this scenario in the catalog (Resources). Reading costs nothing. */
function contextHtml(){
  if(typeof EXTERNAL==='undefined')return '';
  const list=EXTERNAL.items.filter(x=>x.s.some(s=>s[0]===S.id));
  if(!list.length)return '';
  const cat=Object.fromEntries(EXTERNAL.cats);
  const tier=s=>s==='third-party'?'Third party':s[0].toUpperCase()+s.slice(1);
  return `<section class="xpctx"><h3>Need more context?</h3><p class="small muted">Background reading for this ticket. Reading doesn't affect your score.</p><ul>${list.map(x=>`<li><span class="k">${esc(cat[x.c])}</span><a href="${esc(x.u)}" rel="noopener" target="_blank" class="ext">${esc(x.t)}</a> <span class="tier ${esc(x.src)}">${tier(x.src)}</span><span class="d">${esc(x.d)}</span></li>`).join('')}</ul></section>`;
}
/* outcome and independence are separate: asking for help is recorded, never held against the outcome */
function scoreText(sc){
  if(!sc)return 'Rate each criterion to see your result.';
  return `<span class="sx"><span class="k">Outcome</span><b>${sc.quality}%</b><span class="ev-tag self">self-assessed</span></span><span class="sx"><span class="k">Independence</span><b>${sc.independence}%</b></span><span class="sx small muted">${sc.hints} hint${sc.hints===1?'':'s'} used · model answer ${sc.solEarly?'opened before finishing':'not opened early'}${sc.complete?'':` · ${sc.scored} of ${sc.criteria} criteria rated`}</span>`;
}
function review(){
  const r=rec()||{rub:{}};
  const sc=r.rub?P.scenarioScore(meta,r):null;
  const lv=['Not done','Attempted','Partly','Solid','Exemplary'];
  return `<h2 class="xph">Rate your work against the rubric</h2><p class="small muted">This is a self-assessment: nothing here inspects your files. Compare your work with "what good looks like" the way a BI lead reviewing it would. Honest ratings are what make your progress page mean something.</p>
  <div class="rubric">${S.rubric.map(c=>`<fieldset class="rb"><legend><b>${esc(c.n)}</b> <span class="w">${c.w}%</span></legend><p class="good">${fmt(c.good)}</p><div class="lv">${lv.map((l,i)=>`<label><input type="radio" name="rb-${esc(c.id)}" value="${i}" data-rub="${esc(c.id)}"${r.rub&&r.rub[c.id]===i?' checked':''}><span>${i} · ${l}</span></label>`).join('')}</div></fieldset>`).join('')}</div>
  <div class="scorebox" aria-live="polite">${scoreText(sc)}</div>
  <div class="cta">${r.done?`<span class="chip ok">Completed ${esc((r.doneAt||'').slice(0,10))}</span><button class="btn sm" type="button" id="reopen">Reopen</button>`:`<button class="btn primary" type="button" id="finishBtn">Mark scenario complete</button>`}${!r.sol?`<button class="btn" type="button" id="solBtn">${r.done?'Show the model answer':'Show the model answer now'}</button>`:''}</div>
  <div id="solution">${r.sol?'<div class="empty">Loading the model answer…</div>':''}</div>
  ${r.done?debrief():''}`;
}
function debrief(){
  const nx=S.next&&SCENARIOS[S.next];
  return `<section class="debrief"><h2 class="xph">Retrospective</h2><p class="small muted">Write the answers in your notes. This is the part that turns a task into experience.</p><ul>${S.retro.map(q=>`<li>${fmt(q)}</li>`).join('')}</ul>${nx?`<a class="continue" href="${esc(nx.slug)}.html"><span><span class="lbl">Next at Northwind</span><b>${esc(nx.ticket.id)} · ${esc(nx.title)}</b><span class="small muted">${esc(nx.summary)}</span></span><span class="go" aria-hidden="true">→</span></a>`:`<a class="continue" href="${R}experience.html"><span><span class="lbl">Next</span><b>Back to all scenarios</b></span><span class="go" aria-hidden="true">→</span></a>`}</section>`;
}

/* ---------- model answer (lazy) ---------- */
function loadSolution(){
  const host=document.getElementById('solution');if(!host)return;
  const render=()=>{const s=window.XP_SOLUTIONS&&XP_SOLUTIONS[id];if(!s){host.innerHTML='<div class="empty">The model answer could not be loaded. Reload the page while online once.</div>';return}host.innerHTML=solutionHtml(s);linkTerms(host)};
  if(window.XP_SOLUTIONS&&XP_SOLUTIONS[id])return render();
  const sc=document.createElement('script');sc.src=R+'assets/js/xp/'+id+'.js';sc.onload=render;sc.onerror=render;document.head.appendChild(sc);
}
function solutionHtml(s){
  const r=rec();const d=r&&r.dec;
  let h=`<section class="solution" aria-labelledby="sol-h"><h2 class="xph" id="sol-h">Model answer</h2><p class="lead2">${fmt(s.summary)}</p>`;
  if(s.options&&d)h+=`<div class="story"><b>About your choice: ${esc(d.option)}</b><p>${fmt(s.options[d.id]||'')}</p></div>`;
  if(s.root_cause)h+=`<h3>Root cause</h3><ul>${s.root_cause.map(x=>`<li>${fmt(x)}</li>`).join('')}</ul>`;
  h+=`<h3>How an experienced developer works it</h3><ol>${s.steps.map(x=>`<li>${fmt(x)}</li>`).join('')}</ol>`;
  for(const t of [s.numbers,...(s.tables||[])].filter(Boolean))h+=`<h3>${esc(t.title)}</h3>${tbl(t.cols,t.rows)}${t.note?`<p class="small muted">${fmt(t.note)}</p>`:''}`;
  if(s.artifacts)h+=s.artifacts.map(a=>`<h3>${esc(a.title)}</h3>${a.lang==='md'?`<div class="doc md">${para(a.body)}</div>`:code(a.lang,a.body)}`).join('');
  if(s.communication)h+=`<h3>The same finding, two audiences</h3><div class="two"><div><b>For the executive</b>${para(s.communication.executive)}</div><div><b>For the engineer</b>${para(s.communication.engineer)}</div></div>`;
  if(s.pitfalls)h+=`<h3>Common mistakes</h3><ul>${s.pitfalls.map(x=>`<li>${fmt(x)}</li>`).join('')}</ul>`;
  h+=`<h3>Review: what each level would do</h3><dl class="levels"><dt>A junior might</dt><dd>${fmt(s.review.junior)}</dd><dt>A competent BI developer</dt><dd>${fmt(s.review.competent)}</dd><dt>A senior should notice</dt><dd>${fmt(s.review.senior)}</dd><dt>An architect would consider</dt><dd>${fmt(s.review.architect)}</dd></dl></section>`;
  return h;
}
function linkTerms(el){if(typeof GLOSSARY!=='undefined')PBI.linkTerms(el,null,'p, li, dd')}

/* ---------- render ---------- */
function renderPane(k){
  const el=document.getElementById('pane-'+k);if(!el)return;
  el.innerHTML={brief,evidence,work,hints,review}[k]();
  if(k==='review'&&rec()&&rec().sol)loadSolution();
  if(k==='brief'||k==='evidence')linkTerms(el);
}
function render(){
  app.innerHTML=header()+tabs();
  const want=(location.hash.match(/tab=(\w+)/)||[])[1]||(location.hash.startsWith('#ev-')?'evidence':'brief');
  show(TABS.some(t=>t[0]===want)?want:'brief');
  if(location.hash.startsWith('#ev-')){const el=document.getElementById(location.hash.slice(1));if(el)requestAnimationFrame(()=>el.scrollIntoView())}
}
const refreshHeader=()=>{const keep=document.querySelector('.xptabs [aria-selected=true]');const k=keep?keep.dataset.tab:'brief';render();show(k)};

/* ---------- events ---------- */
app.addEventListener('click',async e=>{
  const t=e.target.closest('[data-tab]');if(t){show(t.dataset.tab);history.replaceState(null,'','#tab='+t.dataset.tab);return}
  if(e.target.closest('#startBtn')){saveRec(()=>{});PBI.toast('Ticket assigned to you');refreshHeader();show('evidence');return}
  if(e.target.closest('#hintBtn')){saveRec(r=>{r.hints=Math.min(S.hints.length,(r.hints||0)+1)});document.querySelector('[data-tab=hints]').innerHTML=`Hints <span class="n">${rec().hints}/${S.hints.length}</span>`;renderPane('hints');return}
  const pv=e.target.closest('[data-preview]');if(pv){preview(pv);return}
  const cc=e.target.closest('[data-copycode]');if(cc){copy(cc.closest('.codewrap').querySelector('code').textContent);return}
  if(e.target.closest('#solBtn')){
    const r=rec();
    if(!(r&&r.done)&&!confirm('Open the model answer before finishing? You will learn more from finishing first. Opening it now is recorded under independence (30 points). Your outcome rating is unaffected.'))return;
    saveRec(x=>{x.sol=true;if(!x.done)x.solEarly=true});renderPane('review');return}
  if(e.target.closest('#finishBtn')){
    const r=rec();
    if(!r||S.rubric.some(c=>!r.rub||r.rub[c.id]===undefined)){PBI.toast('Score every rubric criterion first');return}
    saveRec(x=>{x.done=true;x.doneAt=now();x.sol=true});PBI.toast('Scenario complete');refreshHeader();show('review');document.getElementById('solution').scrollIntoView({block:'start'});return}
  if(e.target.closest('#reopen')){saveRec(x=>{x.done=false});refreshHeader();show('review');return}
  if(e.target.closest('#decSave')){
    const o=document.querySelector('input[name=dec]:checked');if(!o){PBI.toast('Choose an option first');return}
    const opt=S.decision.options.find(x=>x.id===o.value);const why=document.getElementById('decWhy').value.trim();
    if(why.length<20){PBI.toast('Write at least a sentence on why');return}
    saveRec(x=>{x.dec={id:opt.id,option:opt.t,why,at:now(),adr:S.decision.adr,title:S.decision.title}});PBI.toast(S.decision.adr+' recorded');renderPane('work');return}
  const ck=e.target.closest('[data-checkp]');if(ck){saveRec(x=>{x.checked=x.checked||{};x.checked[ck.dataset.checkp]=true});renderPane('work');return}
});
app.addEventListener('change',e=>{
  const d=e.target.closest('[data-del]');if(d){saveRec(x=>{x.del=x.del||{};x.del[d.dataset.del]=d.checked});return}
  const rb=e.target.closest('[data-rub]');if(rb){saveRec(x=>{x.rub=x.rub||{};x.rub[rb.dataset.rub]=+rb.value});const sc=P.scenarioScore(meta,rec());const box=document.querySelector('.scorebox');if(box)box.innerHTML=scoreText(sc);return}
  const pk=e.target.closest('[data-pick]');if(pk){saveRec(x=>{x.picks=x.picks||{};x.picks[pk.dataset.pick]=pk.checked});return}
  const dm=e.target.closest('[data-dim]');if(dm){saveRec(x=>{x.ans=x.ans||{};x.ans[dm.dataset.dim]=+dm.value});document.getElementById('interactive').innerHTML=interactiveHtml();return}
});
let nt;app.addEventListener('input',e=>{if(e.target.id==='notes'){clearTimeout(nt);const v=e.target.value;nt=setTimeout(()=>saveRec(x=>{x.notes=v}),400)}});
/* arrow keys move between tabs */
app.addEventListener('keydown',e=>{
  const t=e.target.closest('.xptabs [role=tab]');if(!t||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();const all=[...document.querySelectorAll('.xptabs [role=tab]')];let i=all.indexOf(t);
  i=e.key==='Home'?0:e.key==='End'?all.length-1:(i+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;show(all[i].dataset.tab,true);
});

async function copy(txt){try{await navigator.clipboard.writeText(txt);PBI.toast('Copied')}catch(err){PBI.toast('Copy failed: select the text instead')}}
async function preview(btn){
  const box=btn.closest('.ev').querySelector('.ev-prev');
  if(!box.hidden){box.hidden=true;btn.setAttribute('aria-expanded','false');return}
  box.hidden=false;btn.setAttribute('aria-expanded','true');box.innerHTML='<p class="small muted">Loading…</p>';
  try{
    const res=await fetch(R+btn.dataset.preview);if(!res.ok)throw new Error(res.status);
    const text=await res.text();
    if(/\.csv$/.test(btn.dataset.preview)){
      const lines=text.trim().split(/\r?\n/);const split=l=>{const o=[];let c='',q=false;for(let i=0;i<l.length;i++){const h=l[i];if(q){if(h==='"'){if(l[i+1]==='"'){c+='"';i++}else q=false}else c+=h}else if(h==='"')q=true;else if(h===','){o.push(c);c=''}else c+=h}o.push(c);return o};
      box.innerHTML=`<p class="small muted">${(lines.length-1).toLocaleString()} rows · ${split(lines[0]).length} columns · first ${Math.min(20,lines.length-1)} shown</p>`+tbl(split(lines[0]),lines.slice(1,21).map(split));
    }else box.innerHTML=code(btn.dataset.preview.split('.').pop(),text.length>40000?text.slice(0,40000)+'\n…':text);
  }catch(err){box.innerHTML='<p class="small">Preview needs the site to be served over http(s). Use Download instead.</p>'}
}

render();
PBI.initThemeToggles();
})();
