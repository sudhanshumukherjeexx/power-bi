/* Shared course rendering: topics (assignments, interview questions, assessment, worked solutions),
   readiness, datasets, deep links and their interactions. Used by index.html and the level pages
   (beginner/intermediate/advanced/resources.html). Needs content.js, solutions.js and site.js first. */
const Course=(function(){
'use strict';
const KEY=PBI.KEYS.main;
const state=Object.assign({done:{},quiz:{},theme:null,path:null,sol:{},navOpen:{}},PBI.load(KEY));
state.done=state.done||{};state.quiz=state.quiz||{};state.sol=state.sol||{};state.navOpen=state.navOpen||{};
const save=()=>PBI.save(KEY,state);
const cardState=PBI.loadCards();
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const hooks=[];
const changed=()=>hooks.forEach(f=>f());

async function copyText(txt,msg){try{await navigator.clipboard.writeText(txt);PBI.toast(msg||'Copied to clipboard')}catch(e){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');PBI.toast(msg||'Copied to clipboard')}catch(_){PBI.toast('Copy failed; select the text manually')}ta.remove()}}

/* worked solutions: shown straight away once the assignment is ticked, otherwise behind a "try it first" gate */
function solBody(s){
  let h='<div class="solbody">';
  if(s.s)h+=`<h5>Approach</h5><ul>${s.s.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  if(s.code)h+=s.code.map(([lang,title,src])=>`<h5>${esc(title)}</h5><div class="codewrap"><span class="lang">${esc(lang)}</span><button class="cp" type="button" data-copycode>Copy</button><pre><code>${esc(src)}</code></pre></div>`).join('');
  if(s.tbl)h+=`<div class="stbl"><table><thead><tr>${s.tbl[0].map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${s.tbl.slice(1).map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if(s.check)h+=`<div class="check"><b>Check your result</b>${esc(s.check)}</div>`;
  if(s.note)h+=`<div class="note"><b>Watch out</b>${esc(s.note)}</div>`;
  return h+'</div>';
}
function solHtml(id,open){
  const s=typeof SOLUTIONS!=='undefined'&&SOLUTIONS[id];if(!s)return '';
  const unlocked=state.done[id]||state.sol[id];
  return `<details class="sol" data-sol="${id}"${open?' open':''}><summary>Worked solution <span class="lock">${unlocked?'':'· try it yourself first'}</span></summary>${unlocked?solBody(s):`<div class="gate">You'll learn more from ten minutes of being stuck than from reading the answer. Tick the assignment when you're done, or open the solution now.<br><button class="btn sm" type="button" data-reveal="${id}">I've tried it, show the solution</button></div>`}</details>`;
}
function refreshSol(id){const el=document.querySelector(`.sol[data-sol="${id}"]`);if(el){el.outerHTML=solHtml(id,el.open);linkTerms(document.querySelector(`.sol[data-sol="${id}"]`))}}

function readyHtml(T){const r=PBI.readiness(T,state,cardState);return `<span class="ready ${r.pct?'':'r0'}" title="Readiness: ${r.done}/${r.asg} assignments, ${r.ok}/${r.mcq} multiple choice correct, ${r.learned}/${r.cards} topic flashcards learned"><span class="rbar"><i style="width:${r.pct}%"></i></span>${r.pct}% ready</span>`}
function updateReadiness(){
  LEVELS.forEach(L=>L.topics.forEach(T=>{
    const el=document.querySelector(`[data-ready="${T.id}"]`);if(el)el.innerHTML=readyHtml(T);
    const n=document.querySelector(`.side nav a[href="#${T.id}"] .rp`);if(n)n.textContent=PBI.readiness(T,state,cardState).pct+'%';
  }));
}

function topicHtml(T){
  return `<article class="topic" id="${T.id}"><header><h3>${esc(T.name)}</h3><div class="hright"><span class="pathslot"></span><span data-ready="${T.id}"></span></div><div class="ds">Datasets: ${T.ds.map(x=>`<code data-ds="${x}">${x}</code>`).join(' ')}</div></header>
      <div class="tabs" role="tablist">
        <button role="tab" aria-selected="true" data-pane="asg">Assignments<span class="n">${T.asg.length}</span></button>
        <button role="tab" aria-selected="false" data-pane="int">Interview questions<span class="n">${T.int.length}</span></button>
        <button role="tab" aria-selected="false" data-pane="ass">Assessment<span class="n">${T.ass.length}</span></button>
      </div>
      <div class="pane" data-pane="asg">${T.asg.map((a,i)=>{const id=T.id+'-'+i;return`<div class="asg"><div class="top"><input type="checkbox" id="${id}" data-asg="${id}" ${state.done[id]?'checked':''}><div style="flex:1;min-width:0"><h4><label for="${id}">${esc(a.t)}</label></h4><div class="meta">${esc(a.time)} · uses ${esc(a.ds)}</div><ol>${a.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="expect"><b>Expected result:</b> ${esc(a.exp)}</div>${solHtml(id)}</div></div></div>`}).join('')}</div>
      <div class="pane" data-pane="int" hidden>${T.int.map(q=>`<details class="qa"><summary>${esc(q.q)}</summary><div class="a">${esc(q.a)}</div></details>`).join('')}<p class="small muted" style="margin-top:12px">Answer each one aloud before opening it. If your answer needs more than 90 seconds, you don't know it yet. <a href="flashcards.html#deck=topics&cat=${encodeURIComponent(T.name)}">Practise these as flashcards →</a></p></div>
      <div class="pane" data-pane="ass" hidden>${T.ass.map((q,i)=>{const id=T.id+'-q'+i;if(q.type==='task')return`<div class="quiz"><div class="q">${esc(q.q)}</div><div class="task"><div class="lbl">practical task</div>${esc(q.hint)}</div></div>`;const chosen=state.quiz[id];return`<div class="quiz ${chosen!==undefined?'answered':''}" data-q="${id}" data-a="${q.a}"><div class="q">${esc(q.q)}</div><div class="opts">${q.o.map((o,j)=>`<label class="${chosen!==undefined?(j==q.a?'ok':(j==chosen?'bad':'')):''}"><input type="radio" name="${id}" value="${j}" ${chosen==j?'checked':''}> <span>${esc(o)}</span></label>`).join('')}</div><div class="why">${esc(q.why)}</div></div>`}).join('')}<div class="score" data-score="${T.id}"></div></div>
      </article>`;
}
function datasetsGridHtml(){return Object.entries(DS).map(([k,v])=>`<a href="#ds-${k}">${esc(v.name)}<span>${v.rows.length} rows · ${v.cols.length} cols</span></a>`).join('')}
function datasetsListHtml(){return Object.entries(DS).map(([k,v])=>`<div class="dataset" id="ds-${k}"><header><h3>${esc(v.name)}</h3><div class="acts"><button class="btn sm primary" data-copy="${k}">Copy CSV</button><button class="btn sm" data-copyheader="${k}">Copy header only</button><a class="btn sm" href="data/${k}.csv" download="${k}.csv">Download .csv</a></div><div class="desc">${esc(v.desc)}</div></header><div class="tblwrap"><table><thead><tr>${v.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${v.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`).join('')}

function linkTerms(root){if(root)PBI.linkTerms(root,root.classList&&root.classList.contains('sol')?null:'.topic','.asg ol li, .expect, .qa .a, .quiz .q, .quiz .why, .task, .sol li, .sol .check, .sol .note')}
function updateScores(){document.querySelectorAll('[data-score]').forEach(el=>{const tid=el.dataset.score;const qs=[...document.querySelectorAll(`.quiz[data-q^="${tid}-q"]`)];const ans=qs.filter(q=>state.quiz[q.dataset.q]!==undefined);const ok=ans.filter(q=>String(state.quiz[q.dataset.q])===q.dataset.a).length;el.textContent=qs.length?`Multiple choice: ${ok} correct of ${ans.length} answered (${qs.length} total). Practical tasks are self-graded against the hint.`:''})}

/* deep links: #topic:asg|int|ass:index (used by search) */
function goHash(){
  const m=decodeURIComponent(location.hash.slice(1)).match(/^([a-z]-[a-z0-9-]+):(asg|int|ass)(?::(\d+))?$/);if(!m)return false;
  const art=document.getElementById(m[1]);if(!art)return false;
  const tab=art.querySelector(`.tabs button[data-pane="${m[2]}"]`);if(tab)tab.click();
  let target=art;
  if(m[3]!==undefined){const pane=art.querySelector(`.pane[data-pane="${m[2]}"]`);const items=pane.querySelectorAll(m[2]==='asg'?'.asg':m[2]==='int'?'.qa':'.quiz');target=items[+m[3]]||art;if(target.tagName==='DETAILS')target.open=true}
  requestAnimationFrame(()=>{target.scrollIntoView({block:'start'});target.classList.remove('flash');void target.offsetWidth;target.classList.add('flash')});
  return true;
}
/* plain #section links: pages are built by script, so scroll once rendering is done */
function scrollToHash(){if(location.hash&&!/:/.test(location.hash)){const el=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(el)requestAnimationFrame(()=>el.scrollIntoView())}}
addEventListener('hashchange',goHash);

document.addEventListener('click',e=>{
  const tab=e.target.closest('.topic .tabs button');if(tab){const art=tab.closest('.topic');art.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',b===tab));art.querySelectorAll('.pane').forEach(p=>p.hidden=p.dataset.pane!==tab.dataset.pane);return}
  const ds=e.target.closest('code[data-ds]');if(ds){if(document.getElementById('ds-'+ds.dataset.ds))location.hash='ds-'+ds.dataset.ds;else location.href='resources.html#ds-'+ds.dataset.ds;return}
  const cp=e.target.closest('[data-copy]');if(cp){copyText(toCSV(DS[cp.dataset.copy]));return}
  const ch=e.target.closest('[data-copyheader]');if(ch){copyText(DS[ch.dataset.copyheader].cols.join(','));return}
  const cc=e.target.closest('[data-copycode]');if(cc){copyText(cc.closest('.codewrap').querySelector('code').textContent,'Code copied');return}
  const rv=e.target.closest('[data-reveal]');if(rv){state.sol[rv.dataset.reveal]=true;save();refreshSol(rv.dataset.reveal);const el=document.querySelector(`.sol[data-sol="${rv.dataset.reveal}"]`);if(el)el.open=true;return}
});
document.addEventListener('change',e=>{
  if(e.target.matches('[data-asg]')){state.done[e.target.dataset.asg]=e.target.checked;save();updateReadiness();refreshSol(e.target.dataset.asg);changed();return}
  if(e.target.matches('.quiz input[type=radio]')){const q=e.target.closest('.quiz');const id=q.dataset.q;state.quiz[id]=+e.target.value;save();q.classList.add('answered');[...q.querySelectorAll('label')].forEach((l,j)=>{l.classList.toggle('ok',j==q.dataset.a);l.classList.toggle('bad',j==+e.target.value&&j!=q.dataset.a)});updateScores();updateReadiness();changed()}
});

return {state,save,cardState,esc,copyText,topicHtml,solHtml,readyHtml,updateReadiness,datasetsGridHtml,datasetsListHtml,linkTerms,updateScores,goHash,scrollToHash,onChange:fn=>hooks.push(fn)};
})();
