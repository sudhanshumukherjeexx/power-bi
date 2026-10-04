/* Progress storage rules shared by every page and by the Node tests: schema version and migration, safe
   internal links, flashcard mastery, topic readiness, and validation of imported progress files.
   No DOM access, so tests/progress-import.test.js and tests/scoring.test.js run this file directly.
   Load before site.js. */
(function(root){
'use strict';
const S={};
S.APP='power-bi-holy-grail';   /* the export file id predates the Fellowship name; kept so every exported file still imports */
S.SCHEMA=3;            /* v1 course fields → v2 goal, diagnostic, scenarios → v3 first quiz answers */
S.EXPORT_VERSION=3;
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);

/* ---------- internal links ----------
   Only a page of this site, optionally in experience/ or toolkit/, with an optional fragment. Everything else
   (javascript:, data:, http:, //host, ../, backslashes) is rejected. HTML escaping is not URL sanitising. */
const ROUTE=/^(?:(?:experience|toolkit)\/)?[a-z0-9][a-z0-9-]{0,80}\.html(?:#[A-Za-z0-9:=_.%&-]{0,160})?$/;
S.safeHref=(v,fallback=null)=>typeof v==='string'&&ROUTE.test(v)?v:fallback;

/* ---------- flashcard mastery: one definition everywhere ----------
   Leitner box 0 (or never seen) = 0, 1 = 25%, 2 = 50%, 3 = 75%, 4 or 5 = 100%. Box 4 takes four correct
   recalls in a row spread over at least 11 days, so "mastered" means remembered, not seen once. */
S.MASTERED_BOX=4;
S.mastery=r=>!r||!(r.b>0)?0:Math.min(1,r.b/S.MASTERED_BOX);

/* ---------- topic readiness: one formula for the level pages and the hubs ----------
   50% assignments (self-assessed), 25% first multiple-choice answers (verified), 25% flashcard mastery (recall).
   Parts with nothing to measure are left out and the rest re-weighted. */
S.readinessFrom=({asg=0,done=0,mcq=0,ok=0,cards=0,recall=0})=>{
  const parts=[['self',0.5,asg?done/asg:null],['verified',0.25,mcq?ok/mcq:null],['recall',0.25,cards?recall/cards:null]].filter(p=>p[2]!==null);
  const w=parts.reduce((a,p)=>a+p[1],0)||1;
  const pc=x=>x===null?null:Math.round(100*x);
  return {pct:Math.round(100*parts.reduce((a,p)=>a+p[1]*p[2],0)/w),done,asg,ok,mcq,cards,recall,
    ev:{self:pc(asg?done/asg:null),verified:pc(mcq?ok/mcq:null),recall:pc(cards?recall/cards:null)}};
};
/* the first answer is the evidence; changing it after the explanation is shown is study, not proof */
S.firstAnswer=(main,id)=>{const f=main.quizFirst;if(f&&f[id]!==undefined)return f[id];return undefined};
S.mcqOk=(main,id,correct)=>{const v=S.firstAnswer(main,id);return v!==undefined&&String(v)===String(correct)};

/* ---------- migration ---------- */
S.migrate=st=>{
  st=isObj(st)?st:{};
  const v=st.schemaVersion||1;
  if(v<2){st.goal=st.goal||null;st.diag=st.diag||null;st.xp=st.xp||{};st.seen=st.seen||{};st.last=st.last||null}
  ['done','quiz','quizFirst','sol','navOpen','xp','seen'].forEach(k=>{if(!isObj(st[k]))st[k]={}});
  /* v3: progress saved before first answers were recorded uses the current answer as the first (best available) */
  if(v<3)Object.keys(st.quiz).forEach(k=>{if(!BAD.has(k)&&st.quizFirst[k]===undefined)st.quizFirst[k]=st.quiz[k]});
  if(st.last&&(!isObj(st.last)||!S.safeHref(st.last.href)))st.last=null;
  st.schemaVersion=S.SCHEMA;
  return st;
};

/* ---------- imported progress files ----------
   An imported file is untrusted. Nothing in it is stored as is: both stores are rebuilt from a whitelist of
   fields, each with a type, pattern, range or length. Unknown fields and invalid entries are dropped and
   counted. A file whose overall structure is wrong is rejected and nothing is written.
   known (optional) = ids of the curriculum on this page: {topics:Set, scenarios:{id:{rubric:Set,del:Set,hints}}, cards:Set} */
const BAD=new Set(['__proto__','prototype','constructor']);
const ISO=/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const ID=/^[a-z0-9][a-z0-9-]{0,60}$/;
const PAGE=/^(?:(?:experience|toolkit)\/)?[a-z0-9][a-z0-9-]{0,80}\.html$/;
const LIMITS={notes:50000,why:5000,title:200,label:120,option:300,entries:5000};
class ImportError extends Error{}
S.ImportError=ImportError;

function sanitizeMain(src,known,drop){
  const out={};
  const str=(v,max)=>typeof v==='string'&&v.length<=max?v:undefined;
  const int=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi?v:undefined;
  const iso=v=>typeof v==='string'&&ISO.test(v)?v:undefined;
  /* a map whose keys match a pattern and whose values pass a check; a wrong container type rejects the file */
  const map=(name,keyRe,val,keyOk)=>{
    const m=src[name];if(m===undefined||m===null){out[name]={};return}
    if(!isObj(m))throw new ImportError(`"${name}" is not an object`);
    const r={};let n=0;
    for(const k of Object.keys(m)){
      if(BAD.has(k)||!keyRe.test(k)||(keyOk&&!keyOk(k))||++n>LIMITS.entries){drop(name+'.'+k);continue}
      const v=val(m[k],k);if(v===undefined){drop(name+'.'+k);continue}
      r[k]=v;
    }
    out[name]=r;
  };
  const bool=v=>typeof v==='boolean'?v:undefined;
  const topicOk=k=>!known||!known.topics||known.topics.has(k.replace(/-q?\d+$/,''));
  const ASG=/^[a-z][a-z0-9-]{0,60}-\d{1,3}$/,Q=/^[a-z][a-z0-9-]{0,60}-q\d{1,3}$/;

  map('done',ASG,bool,topicOk);
  map('sol',ASG,bool,topicOk);
  map('quiz',Q,v=>int(v,0,9),topicOk);
  map('quizFirst',Q,v=>int(v,0,9),topicOk);
  map('navOpen',ID,bool);
  map('seen',PAGE,v=>typeof v==='string'&&DAY.test(v)?v:undefined);

  out.theme=src.theme==='light'||src.theme==='dark'?src.theme:null;
  out.path=typeof src.path==='string'&&ID.test(src.path)?src.path:null;
  out.goal=typeof src.goal==='string'&&ID.test(src.goal)?src.goal:null;

  out.diag=null;
  if(isObj(src.diag)){
    const d=src.diag,ans={};
    if(isObj(d.ans))for(const k of Object.keys(d.ans)){const v=int(d.ans[k],0,9);if(/^\d{1,3}$/.test(k)&&v!==undefined)ans[k]=v;else drop('diag.ans.'+k)}
    const rec=isObj(d.rec)&&S.safeHref(d.rec.href)&&str(d.rec.label,LIMITS.label)?{label:d.rec.label,href:d.rec.href,
      level:typeof d.rec.level==='string'&&ID.test(d.rec.level)?d.rec.level:null,topic:typeof d.rec.topic==='string'&&ID.test(d.rec.topic)?d.rec.topic:null}:null;
    if(d.rec&&!rec)drop('diag.rec');
    if(iso(d.at))out.diag={ans,at:d.at,rec,score:int(d.score,0,999)||0};else drop('diag');
  }else if(src.diag!==undefined&&src.diag!==null)drop('diag');

  out.last=null;
  if(isObj(src.last)){
    const h=S.safeHref(src.last.href);
    if(h&&str(src.last.title,LIMITS.title)!==undefined&&iso(src.last.at))out.last={href:h,title:src.last.title,at:src.last.at};else drop('last');
  }else if(src.last!==undefined&&src.last!==null)drop('last');

  /* Experience Mode records */
  const xp=src.xp;out.xp={};
  if(xp!==undefined&&xp!==null){
    if(!isObj(xp))throw new ImportError('"xp" is not an object');
    for(const id of Object.keys(xp)){
      const sc=known&&known.scenarios?known.scenarios[id]:null;
      if(BAD.has(id)||!/^[a-z]\d{2}$/.test(id)||(known&&known.scenarios&&!sc)||!isObj(xp[id])){drop('xp.'+id);continue}
      const r=xp[id],o={};
      o.st=r.st==='done'||r.done===true?'done':'active';
      ['started','updated','doneAt'].forEach(k=>{if(iso(r[k]))o[k]=r[k];else if(r[k]!==undefined)drop(`xp.${id}.${k}`)});
      o.done=r.done===true;
      o.hints=int(r.hints,0,sc?sc.hints:20)||0;
      o.sol=r.sol===true;o.solEarly=r.solEarly===true;
      o.del={};if(isObj(r.del))for(const k of Object.keys(r.del)){if(!BAD.has(k)&&ID.test(k)&&(!sc||sc.del.has(k))&&typeof r.del[k]==='boolean')o.del[k]=r.del[k];else drop(`xp.${id}.del.${k}`)}
      o.rub={};if(isObj(r.rub))for(const k of Object.keys(r.rub)){const v=int(r.rub[k],0,4);if(!BAD.has(k)&&ID.test(k)&&(!sc||sc.rubric.has(k))&&v!==undefined)o.rub[k]=v;else drop(`xp.${id}.rub.${k}`)}
      o.notes=str(r.notes,LIMITS.notes);if(o.notes===undefined){if(r.notes!==undefined)drop(`xp.${id}.notes`);o.notes=''}
      if(isObj(r.dec)){const d=r.dec;
        if(typeof d.id==='string'&&ID.test(d.id)&&str(d.option,LIMITS.option)!==undefined&&str(d.why||'',LIMITS.why)!==undefined)
          o.dec={id:d.id,option:d.option,why:d.why||'',at:iso(d.at)||'',adr:typeof d.adr==='string'&&/^[A-Z]{2,5}-\d{1,4}$/.test(d.adr)?d.adr:'',title:str(d.title||'',LIMITS.title)||''};
        else drop(`xp.${id}.dec`)}
      const extra=Object.keys(r).filter(k=>!['st','started','updated','doneAt','done','hints','sol','solEarly','del','rub','notes','dec'].includes(k));
      extra.forEach(k=>drop(`xp.${id}.${k}`));
      out.xp[id]=o;
    }
  }
  const knownTop=['done','sol','quiz','quizFirst','navOpen','seen','theme','path','goal','diag','last','xp','schemaVersion'];
  Object.keys(src).filter(k=>!knownTop.includes(k)).forEach(k=>drop(k));
  out.schemaVersion=S.SCHEMA;
  return out;
}

function sanitizeCards(src,known,drop){
  const out={srs:{}};
  if(src.srs!==undefined&&src.srs!==null){
    if(!isObj(src.srs))throw new ImportError('"srs" is not an object');
    let n=0;
    for(const id of Object.keys(src.srs)){
      const r=src.srs[id];
      if(BAD.has(id)||!/^[ct][0-9a-z]{1,14}$/.test(id)||(known&&known.cards&&!known.cards.has(id))||!isObj(r)||++n>LIMITS.entries*4){drop('srs.'+id);continue}
      const b=r.b,d=r.d;
      if(!Number.isInteger(b)||b<0||b>5||typeof d!=='string'||!DAY.test(d)){drop('srs.'+id);continue}
      const o={b,d,n:Number.isInteger(r.n)&&r.n>=0&&r.n<=1e6?r.n:1};
      if(typeof r.l==='string'&&DAY.test(r.l))o.l=r.l;
      out.srs[id]=o;
    }
  }
  /* legacy v1 marks (known/again) are converted by PBI.loadCards; keep only well-formed ones */
  ['known','again'].forEach(k=>{if(isObj(src[k])){const m={};Object.keys(src[k]).forEach(id=>{if(/^[ct][0-9a-z]{1,14}$/.test(id)&&src[k][id]===true)m[id]=true;else drop(k+'.'+id)});out[k]=m}});
  const en=(k,vals)=>{if(src[k]===undefined)return;if(vals.includes(src[k]))out[k]=src[k];else drop(k)};
  en('deck',['concepts','topics','all']);
  en('lvl',['all','Beginner','Intermediate','Advanced','Tracks']);
  en('mode',['all','due']);
  en('mockN',[5,10,15]);
  en('mockT',[60,90,120]);
  if(src.list!==undefined){if(typeof src.list==='boolean')out.list=src.list;else drop('list')}
  if(src.cat!==undefined){if(typeof src.cat==='string'&&src.cat.length<=80&&/^[\w &/+().,'-]+$/.test(src.cat))out.cat=src.cat;else drop('cat')}
  Object.keys(src).filter(k=>!['srs','known','again','deck','lvl','mode','mockN','mockT','list','cat'].includes(k)).forEach(k=>drop(k));
  return out;
}

/* returns {main, cards, dropped:[paths], version, exported} or throws ImportError with a reason a learner can read */
S.sanitizeProgress=(payload,keys,known)=>{
  if(!isObj(payload))throw new ImportError('the file is not a JSON object');
  if(payload.app!==S.APP)throw new ImportError('the file is not a Power BI Fellowship progress file');
  const version=payload.version===undefined?1:payload.version;
  if(!Number.isInteger(version)||version<1)throw new ImportError('the file has no valid version');
  if(version>S.EXPORT_VERSION)throw new ImportError('the file comes from a newer version of the site');
  if(!isObj(payload.data))throw new ImportError('the file has no progress data');
  const main=payload.data[keys.main],cards=payload.data[keys.cards];
  if(main!==undefined&&!isObj(main))throw new ImportError('the progress section is not an object');
  if(cards!==undefined&&!isObj(cards))throw new ImportError('the flashcard section is not an object');
  if(main===undefined&&cards===undefined)throw new ImportError('the file has no progress data');
  /* structure first: a container of the wrong type means the file is not what it claims, so reject it */
  if(main)['done','sol','quiz','quizFirst','navOpen','seen','xp'].forEach(k=>{if(main[k]!==undefined&&main[k]!==null&&!isObj(main[k]))throw new ImportError(`"${k}" is not an object`)});
  if(cards&&cards.srs!==undefined&&cards.srs!==null&&!isObj(cards.srs))throw new ImportError('"srs" is not an object');
  const dropped=[];const drop=p=>dropped.push(p);
  if(main&&isObj(main.last)&&!S.safeHref(main.last.href))drop('last.href');
  const m=S.migrate(sanitizeMain(main?S.migrate(Object.assign({},main)):{},known,drop));
  const c=sanitizeCards(cards||{},known,drop);
  Object.keys(payload.data).filter(k=>k!==keys.main&&k!==keys.cards).forEach(k=>drop('data.'+k));
  const exported=typeof payload.exported==='string'&&ISO.test(payload.exported)?payload.exported:null;
  return {main:m,cards:c,dropped,version,exported};
};

/* counts for the import comparison: what each side holds */
S.summary=(main,cards)=>{
  main=isObj(main)?main:{};cards=isObj(cards)?cards:{};
  const vals=o=>isObj(o)?Object.values(o):[];
  const xp=vals(main.xp);
  return {assignments:vals(main.done).filter(v=>v===true).length,quiz:Object.keys(isObj(main.quizFirst)?main.quizFirst:isObj(main.quiz)?main.quiz:{}).length,
    scenarios:xp.length,scenariosDone:xp.filter(r=>isObj(r)&&r.done).length,cards:Object.keys(isObj(cards.srs)?cards.srs:{}).length,
    notes:xp.filter(r=>isObj(r)&&typeof r.notes==='string'&&r.notes.trim()).length};
};

root.PBI=Object.assign(root.PBI||{},{store:S,safeHref:S.safeHref,mastery:S.mastery,readinessFrom:S.readinessFrom});
if(typeof module!=='undefined'&&module.exports)module.exports=S;
})(typeof window!=='undefined'?window:globalThis);
