/* Toolkit guide and door pages (toolkit/*.html): copy buttons on code, the print button, checklist ticks
   remembered in this browser, and "continue where you left off". The page itself is complete without this script. */
(function(){
'use strict';
const KEY='pbi-toolkit-checks-v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}};
/* long contents lists start collapsed on phones */
const toc=document.querySelector('.tktoc');
if(toc&&innerWidth<560&&toc.querySelectorAll('a').length>5)toc.open=false;
const boxes=[...document.querySelectorAll('input[data-ck]')];
if(boxes.length){
  const saved=read();
  boxes.forEach(b=>{if(b.dataset.ck in saved)b.checked=saved[b.dataset.ck]});
  document.addEventListener('change',e=>{const b=e.target.closest('input[data-ck]');if(!b)return;const s=read();s[b.dataset.ck]=b.checked;write(s)});
}
document.addEventListener('click',async e=>{
  const c=e.target.closest('[data-copycode]');
  if(c){try{await navigator.clipboard.writeText(c.closest('.codewrap').querySelector('code').textContent);PBI.toast('Copied')}catch(err){PBI.toast('Copy failed: select the text instead')}return}
  if(e.target.closest('[data-print]'))window.print();
});
const h1=document.querySelector('main h1');
if(h1&&document.body.dataset.guide)PBI.touch('Toolkit: '+h1.textContent,location.pathname.split('/').slice(-2).join('/'));
PBI.initThemeToggles();
})();
