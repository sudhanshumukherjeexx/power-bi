/* templates.html: renders the Markdown templates (a small, safe subset: headings, paragraphs, lists,
   checklists, tables, fenced code, bold and inline code). */
(function(){
'use strict';
const esc=PBI.esc;
const inline=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>');
function md(src){
  const L=src.split('\n');let h='',i=0;
  const para=[];const flush=()=>{if(para.length){h+=`<p>${inline(para.join(' '))}</p>`;para.length=0}};
  while(i<L.length){
    const l=L[i];
    if(/^```/.test(l)){flush();const lang=l.slice(3).trim();const buf=[];i++;while(i<L.length&&!/^```/.test(L[i]))buf.push(L[i++]);i++;h+=`<div class="codewrap"><span class="lang">${esc(lang||'text')}</span><button class="cp" type="button" data-copycode>Copy</button><pre><code>${esc(buf.join('\n'))}</code></pre></div>`;continue}
    const hd=l.match(/^(#{1,3})\s+(.*)/);if(hd){flush();const n=hd[1].length+1;if(n>2)h+=`<h${n}>${inline(hd[2])}</h${n}>`;i++;continue}
    if(/^\|/.test(l)){flush();const rows=[];while(i<L.length&&/^\|/.test(L[i]))rows.push(L[i++]);const cells=r=>r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());const head=cells(rows[0]);const body=rows.slice(2).map(cells);h+=`<div class="tblscroll"><table class="tbl prose"><thead><tr>${head.map(c=>`<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;continue}
    if(/^\s*([-*]|\d+\.)\s/.test(l)){flush();const ordered=/^\s*\d+\./.test(l);const items=[];while(i<L.length&&/^\s*([-*]|\d+\.)\s/.test(L[i]))items.push(L[i++].replace(/^\s*([-*]|\d+\.)\s/,''));h+=`<${ordered?'ol':'ul'} class="${items.every(x=>/^\[[ x]\]/.test(x))?'check':''}">${items.map(x=>{const c=x.match(/^\[([ x])\]\s*(.*)/);return c?`<li><span class="box" aria-hidden="true">${c[1]==='x'?'☑':'☐'}</span> ${inline(c[2])}</li>`:`<li>${inline(x)}</li>`}).join('')}</${ordered?'ol':'ul'}>`;continue}
    if(!l.trim()){flush();i++;continue}
    para.push(l);i++;
  }
  flush();return h;
}
const host=document.getElementById('tpl');
const used=t=>t.used.map(id=>SCENARIO_INDEX.find(s=>s.id===id)).filter(Boolean);
host.innerHTML=`<nav class="jump" aria-label="Templates">${TEMPLATES.map(t=>`<a href="#tpl-${t.id}">${esc(t.title)}</a>`).join('')}</nav>`+
  TEMPLATES.map(t=>`<details class="tpl" id="tpl-${t.id}"><summary><span><b>${esc(t.title)}</b><span class="small muted">${esc(t.summary)}</span></span></summary><div class="tplbody">${md(t.md)}<p class="small muted">Used in: ${used(t).map(s=>`<a href="experience/${s.slug}.html">${esc(s.ticket)} ${esc(s.title)}</a>`).join(' · ')||'any project'}. <a href="templates/${t.id}.md" download>Download .md</a></p></div></details>`).join('');
const open=()=>{const id=location.hash.slice(1);const el=id&&document.getElementById(id);if(el&&el.tagName==='DETAILS'){el.open=true;requestAnimationFrame(()=>el.scrollIntoView())}};
addEventListener('hashchange',open);open();
host.addEventListener('click',async e=>{const b=e.target.closest('[data-copycode]');if(!b)return;try{await navigator.clipboard.writeText(b.closest('.codewrap').querySelector('code').textContent);PBI.toast('Template copied')}catch(err){PBI.toast('Copy failed: select the text instead')}});
PBI.initThemeToggles();
})();
