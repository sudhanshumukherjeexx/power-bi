/* Progress model shared by the home page, the progress page, Experience Mode and the Learn hub.
   Needs meta.js (MODULES, STAGES, SKILLS, SCENARIO_INDEX, CONCEPT_IDS) and site.js.
   Competency is computed from evidence only: assignments ticked, quiz answers, flashcard retention and
   Experience Mode rubric scores (reduced by hints and early solution reveals). Page visits never count. */
(function(){
'use strict';
const P=PBI.P={};
const W={A:1,B:1.5,C:2,D:2.5};           /* an assignment with less guidance is stronger evidence */
const MCQ_W=0.3,CARD_W=0.15,XP_W=5;

P.main=()=>PBI.migrate(PBI.load(PBI.KEYS.main));
P.cards=()=>PBI.loadCards();
P.topics=()=>MODULES.flatMap(m=>m.topics.map(t=>Object.assign({module:m.id,moduleName:m.name,moduleKind:m.kind},t)));
P.topic=id=>P.topics().find(t=>t.id===id);
P.module=id=>MODULES.find(m=>m.id===id);

/* topic readiness from the compact outline: same weights as PBI.readiness (50/25/25) */
P.readiness=(t,main,cards)=>{
  const done=t.g.filter((_,i)=>main.done[t.id+'-'+i]).length;
  const mcqIdx=t.mcq.map((a,i)=>a===null?null:i).filter(i=>i!==null);
  const ok=mcqIdx.filter(i=>main.quiz[t.id+'-q'+i]!==undefined&&String(main.quiz[t.id+'-q'+i])===String(t.mcq[i])).length;
  const learned=t.cards.filter(id=>{const r=cards.srs[id];return r&&r.b>=1}).length;
  const parts=[[0.5,t.g.length?done/t.g.length:null],[0.25,mcqIdx.length?ok/mcqIdx.length:null],[0.25,t.cards.length?learned/t.cards.length:null]].filter(p=>p[1]!==null);
  const w=parts.reduce((a,p)=>a+p[0],0)||1;
  return {pct:Math.round(100*parts.reduce((a,p)=>a+p[0]*p[1],0)/w),done,asg:t.g.length,ok,mcq:mcqIdx.length,learned,cards:t.cards.length};
};
P.moduleReadiness=(m,main,cards)=>{const r=m.topics.map(t=>P.readiness(t,main,cards));return {pct:r.length?Math.round(r.reduce((a,x)=>a+x.pct,0)/r.length):0,done:r.reduce((a,x)=>a+x.done,0),asg:r.reduce((a,x)=>a+x.asg,0)}};

/* Experience Mode scenario score: self-assessed rubric (0–4 per criterion, weighted), reduced by hints
   (5% each, at most 20%) and by revealing the solution before finishing (×0.7). */
P.xp=(main,id)=>main.xp[id]||null;
P.scenarioScore=(s,rec)=>{
  if(!rec||!s.rubric.length)return null;
  const total=s.rubric.reduce((a,r)=>a+r.w,0)||1;
  const scored=s.rubric.filter(r=>rec.rub&&rec.rub[r.id]!==undefined);
  if(!scored.length)return null;
  const raw=s.rubric.reduce((a,r)=>a+r.w*((rec.rub&&rec.rub[r.id])||0)/4,0)/total;
  const hintFactor=1-Math.min(0.2,0.05*(rec.hints||0));
  const solFactor=rec.solEarly?0.7:1;
  return {raw:Math.round(raw*100),pct:Math.round(raw*hintFactor*solFactor*100),hints:rec.hints||0,solEarly:!!rec.solEarly,complete:scored.length===s.rubric.length};
};
P.scenarioStatus=(main,id)=>{const r=main.xp[id];return !r?'new':r.done?'done':'active'};

/* competency per skill */
P.competency=(main,cards)=>{
  main=main||P.main();cards=cards||P.cards();
  const acc={};SKILLS.forEach(s=>acc[s.id]={id:s.id,name:s.name,desc:s.desc,earned:0,possible:0,ev:{asg:[0,0],mcq:[0,0],cards:[0,0],xp:[0,0]}});
  const add=(sk,e,p,kind,hit)=>{const a=acc[sk];if(!a)return;a.earned+=e;a.possible+=p;a.ev[kind][1]++;if(hit)a.ev[kind][0]++};
  for(const t of P.topics()){
    t.g.forEach((g,i)=>{const sk=t.as[i]||t.skills;const w=W[g]||1;const d=!!main.done[t.id+'-'+i];sk.forEach(s=>add(s,d?w:0,w,'asg',d))});
    t.mcq.forEach((a,i)=>{if(a===null)return;const v=main.quiz[t.id+'-q'+i];const ok=v!==undefined&&String(v)===String(a);t.skills.forEach(s=>add(s,ok?MCQ_W:0,MCQ_W,'mcq',ok))});
    t.cards.forEach(id=>{const r=cards.srs[id];const e=!r?0:r.b>=3?CARD_W:r.b>=1?CARD_W/2:0;t.skills.forEach(s=>add(s,e,CARD_W,'cards',r&&r.b>=1))});
  }
  SKILLS.forEach(s=>(s.cards||[]).forEach(cat=>(CONCEPT_IDS[cat]||[]).forEach(id=>{const r=cards.srs[id];const e=!r?0:r.b>=3?CARD_W:r.b>=1?CARD_W/2:0;add(s.id,e,CARD_W,'cards',r&&r.b>=1)})));
  for(const s of SCENARIO_INDEX){
    const rec=main.xp[s.id];const sc=rec&&rec.done?P.scenarioScore(s,rec):null;
    s.skills.forEach(k=>add(k,sc?XP_W*sc.pct/100:0,XP_W,'xp',!!sc));
  }
  return SKILLS.map(s=>{const a=acc[s.id];a.pct=a.possible?Math.round(100*a.earned/a.possible):0;return a});
};

/* professional stages */
P.stages=(main,cards)=>{
  main=main||P.main();cards=cards||P.cards();
  const topics=P.topics();
  return STAGES.map(st=>{
    const ts=topics.filter(t=>t.stage===st.id);
    const xs=SCENARIO_INDEX.filter(s=>s.stage===st.id);
    const tr=ts.map(t=>P.readiness(t,main,cards).pct);
    const tp=tr.length?tr.reduce((a,b)=>a+b,0)/tr.length:null;
    const xd=xs.filter(s=>main.xp[s.id]&&main.xp[s.id].done).length;
    const xp=xs.length?100*xd/xs.length:null;
    const parts=[tp,xp].filter(x=>x!==null);
    return Object.assign({},st,{pct:parts.length?Math.round(parts.reduce((a,b)=>a+b,0)/parts.length):0,topics:ts.length,scenarios:xs.length,scenariosDone:xd,skillPct:Math.round(tp||0)});
  });
};
P.currentStage=(main,cards)=>{const s=P.stages(main,cards);return s.find(x=>x.pct<60)||s[s.length-1]};

/* certification readiness for the outline in force today */
P.cert=(c,main,cards)=>{
  main=main||P.main();cards=cards||P.cards();
  const topics=Object.fromEntries(P.topics().map(t=>[t.id,t]));
  const areas=c.areas.map(a=>{const r=a.topics.map(id=>topics[id]?P.readiness(topics[id],main,cards).pct:0);return {n:a.n,w:a.w,pct:r.length?Math.round(r.reduce((x,y)=>x+y,0)/r.length):0}});
  return {code:c.code,label:c.current.label,next:c.next,areas,pct:areas.length?Math.round(areas.reduce((x,a)=>x+a.pct,0)/areas.length):0};
};

/* flashcards due today (reviewed cards whose date has come) and never-seen cards */
P.due=cards=>{
  cards=cards||P.cards();const t=PBI.today();
  const all=[...Object.values(CONCEPT_IDS).flat(),...P.topics().flatMap(x=>x.cards)];
  const due=all.filter(id=>cards.srs[id]&&cards.srs[id].d<=t).length;
  const fresh=all.filter(id=>!cards.srs[id]).length;
  return {due,fresh,total:all.length};
};

/* portfolio: deliverables the learner marked done, grouped by artifact type */
P.portfolio=main=>{
  main=main||P.main();const items=[];
  for(const s of SCENARIO_INDEX){const rec=main.xp[s.id];if(!rec||!rec.del)continue;
    s.deliverables.forEach(d=>{if(rec.del[d.id])items.push({scenario:s,del:d})})}
  return items;
};

/* skill-mode totals */
P.skillTotals=(main,cards,kind)=>{
  main=main||P.main();cards=cards||P.cards();
  const ms=MODULES.filter(m=>!kind||m.kind===kind);
  let done=0,asg=0;ms.forEach(m=>m.topics.forEach(t=>{asg+=t.g.length;done+=t.g.filter((_,i)=>main.done[t.id+'-'+i]).length}));
  return {done,asg,pct:asg?Math.round(100*done/asg):0};
};
P.xpTotals=main=>{main=main||P.main();const n=SCENARIO_INDEX.length;const done=SCENARIO_INDEX.filter(s=>main.xp[s.id]&&main.xp[s.id].done).length;const active=SCENARIO_INDEX.filter(s=>main.xp[s.id]&&!main.xp[s.id].done).length;return {n,done,active,pct:n?Math.round(100*done/n):0}};

/* is a route step done? */
P.stepDone=(href,main,cards)=>{
  main=main||P.main();cards=cards||P.cards();
  const page=href.split('#')[0];
  const m=MODULES.find(x=>x.id+'.html'===page);
  if(m)return P.moduleReadiness(m,main,cards).pct>=80;
  const s=SCENARIO_INDEX.find(x=>'experience/'+x.slug+'.html'===page);
  if(s)return P.scenarioStatus(main,s.id)==='done';
  if(page==='diagnostic.html')return !!(main.diag&&main.diag.at);
  if(page==='flashcards.html')return Object.keys(cards.srs).length>=20;
  if(page==='experience.html')return P.xpTotals(main).done>=3;
  return !!main.seen[page];
};
P.goal=main=>{main=main||P.main();return main.goal?GOALS.find(g=>g.id===main.goal)||null:null};
P.nextStep=(main,cards)=>{const g=P.goal(main);if(!g)return null;return g.route.find(r=>!P.stepDone(r.href,main,cards))||null};

/* text bar for places where a graphic is not wanted (also read by screen readers) */
P.bar=(pct,label)=>`<span class="pbar" role="img" aria-label="${PBI.esc(label||'')} ${pct}%"><i style="width:${Math.max(0,Math.min(100,pct))}%"></i></span>`;
})();
