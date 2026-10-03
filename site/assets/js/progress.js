/* Progress model shared by the home page, the progress page, Experience Mode and the Learn hub.
   Needs meta.js (MODULES, STAGES, SKILLS, SCENARIO_INDEX, CONCEPT_IDS), store.js and site.js.
   Every number comes from evidence, and every number says which kind:
     verified       first answer to a multiple-choice question, checked against the key
     self-assessed  assignment ticks, scenario deliverables and rubric ratings: the learner's own judgement
     recall         flashcard mastery from spaced repetition (PBI.mastery, one definition everywhere)
   Page visits never count. Hints and early reveals measure independence, not skill.
   The formulas are documented in docs/progress-scoring-audit.md; tests/scoring.test.js pins them. */
(function(){
'use strict';
const P=PBI.P={};
const ST=PBI.store;
const W={A:1,B:1.5,C:2,D:2.5};           /* an assignment with less guidance is stronger evidence */
const MCQ_W=0.3,CARD_W=0.15,XP_W=5;
/* a stage is cleared when all three hold (percentages) */
P.GATES={skill:70,completion:70,quality:65};

P.main=()=>PBI.migrate(PBI.load(PBI.KEYS.main));
P.cards=()=>PBI.loadCards();
P.topics=()=>MODULES.flatMap(m=>m.topics.map(t=>Object.assign({module:m.id,moduleName:m.name,moduleKind:m.kind},t)));
P.topic=id=>P.topics().find(t=>t.id===id);
P.module=id=>MODULES.find(m=>m.id===id);
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;

/* topic readiness from the compact outline; same formula as PBI.readiness (store.js readinessFrom) */
P.readiness=(t,main,cards)=>{
  const done=t.g.filter((_,i)=>main.done[t.id+'-'+i]).length;
  const mcqIdx=t.mcq.map((a,i)=>a===null?null:i).filter(i=>i!==null);
  const ok=mcqIdx.filter(i=>ST.mcqOk(main,t.id+'-q'+i,t.mcq[i])).length;
  const recall=t.cards.reduce((a,id)=>a+PBI.mastery(cards.srs[id]),0);
  return PBI.readinessFrom({asg:t.g.length,done,mcq:mcqIdx.length,ok,cards:t.cards.length,recall});
};
P.moduleReadiness=(m,main,cards)=>{const r=m.topics.map(t=>P.readiness(t,main,cards));return {pct:r.length?Math.round(avg(r.map(x=>x.pct))):0,done:r.reduce((a,x)=>a+x.done,0),asg:r.reduce((a,x)=>a+x.asg,0)}};

/* Experience Mode. Quality = the learner's weighted rubric rating (0–4 per criterion): the outcome, and the
   only scenario number that feeds competency and stages. Independence = 100 − 10 per hint (at most 40)
   − 30 if the model answer was opened before finishing. Shown side by side, never multiplied together. */
P.xp=(main,id)=>main.xp[id]||null;
P.independence=rec=>Math.max(0,100-10*Math.min(4,(rec&&rec.hints)||0)-(rec&&rec.solEarly?30:0));
P.scenarioScore=(s,rec)=>{
  if(!rec||!s.rubric.length)return null;
  const total=s.rubric.reduce((a,r)=>a+r.w,0)||1;
  const scored=s.rubric.filter(r=>rec.rub&&rec.rub[r.id]!==undefined);
  if(!scored.length)return null;
  const q=Math.round(100*s.rubric.reduce((a,r)=>a+r.w*((rec.rub&&rec.rub[r.id])||0)/4,0)/total);
  return {quality:q,independence:P.independence(rec),hints:rec.hints||0,solEarly:!!rec.solEarly,complete:scored.length===s.rubric.length,scored:scored.length,criteria:s.rubric.length};
};
P.scenarioStatus=(main,id)=>{const r=main.xp[id];return !r?'new':r.done?'done':'active'};

/* competency per skill: earned ÷ possible overall, and separately per evidence type */
P.competency=(main,cards)=>{
  main=main||P.main();cards=cards||P.cards();
  const acc={};SKILLS.forEach(s=>acc[s.id]={id:s.id,name:s.name,desc:s.desc,earned:0,possible:0,
    ev:{asg:[0,0],mcq:[0,0],cards:[0,0],xp:[0,0]},type:{verified:[0,0],self:[0,0],recall:[0,0]}});
  const add=(sk,e,p,kind,type,hit)=>{const a=acc[sk];if(!a)return;a.earned+=e;a.possible+=p;a.type[type][0]+=e;a.type[type][1]+=p;a.ev[kind][1]++;if(hit)a.ev[kind][0]++};
  const card=(sk,id)=>{const m=PBI.mastery(cards.srs[id]);add(sk,CARD_W*m,CARD_W,'cards','recall',m>=1)};
  for(const t of P.topics()){
    t.g.forEach((g,i)=>{const sk=t.as[i]||t.skills;const w=W[g]||1;const d=!!main.done[t.id+'-'+i];sk.forEach(s=>add(s,d?w:0,w,'asg','self',d))});
    t.mcq.forEach((a,i)=>{if(a===null)return;const ok=ST.mcqOk(main,t.id+'-q'+i,a);t.skills.forEach(s=>add(s,ok?MCQ_W:0,MCQ_W,'mcq','verified',ok))});
    t.cards.forEach(id=>t.skills.forEach(s=>card(s,id)));
  }
  SKILLS.forEach(s=>(s.cards||[]).forEach(cat=>(CONCEPT_IDS[cat]||[]).forEach(id=>card(s.id,id))));
  for(const s of SCENARIO_INDEX){
    const rec=main.xp[s.id];const sc=rec&&rec.done?P.scenarioScore(s,rec):null;
    s.skills.forEach(k=>add(k,sc?XP_W*sc.quality/100:0,XP_W,'xp','self',!!sc));
  }
  const pc=([e,p])=>p?Math.round(100*e/p):null;
  return SKILLS.map(s=>{const a=acc[s.id];a.pct=a.possible?Math.round(100*a.earned/a.possible):0;
    a.types={verified:pc(a.type.verified),self:pc(a.type.self),recall:pc(a.type.recall)};
    /* share of the earned evidence that rests on the learner's own judgement */
    a.selfShare=a.earned?Math.round(100*a.type.self[0]/a.earned):0;return a});
};

/* professional stages. Skill S = mean topic readiness. Experience E = mean quality of finished scenarios ×
   share finished, so finishing without good work earns nothing. Stage % = mean(S, E).
   A stage is cleared when S, completion and quality all reach P.GATES; the current stage is the first not cleared. */
P.stages=(main,cards)=>{
  main=main||P.main();cards=cards||P.cards();
  const topics=P.topics(),G=P.GATES;
  return STAGES.map(st=>{
    const ts=topics.filter(t=>t.stage===st.id);
    const xs=SCENARIO_INDEX.filter(s=>s.stage===st.id);
    const S=avg(ts.map(t=>P.readiness(t,main,cards).pct));
    const fin=xs.filter(s=>main.xp[s.id]&&main.xp[s.id].done);
    const qs=fin.map(s=>{const sc=P.scenarioScore(s,main.xp[s.id]);return sc?sc.quality:0});
    const completion=xs.length?100*fin.length/xs.length:null;
    const quality=qs.length?avg(qs):null;
    const E=xs.length?(quality||0)*fin.length/xs.length:null;
    const parts=[S,E].filter(x=>x!==null);
    const gates={skill:S===null||S>=G.skill,completion:completion===null||completion>=G.completion,quality:xs.length===0||(quality!==null&&quality>=G.quality)};
    return Object.assign({},st,{pct:parts.length?Math.round(avg(parts)):0,topics:ts.length,scenarios:xs.length,scenariosDone:fin.length,
      skillPct:Math.round(S||0),expPct:Math.round(E||0),completion:Math.round(completion||0),quality:quality===null?null:Math.round(quality),
      gates,cleared:gates.skill&&gates.completion&&gates.quality});
  });
};
P.currentStage=(main,cards)=>{const s=P.stages(main,cards);return s.find(x=>!x.cleared)||s[s.length-1]};

/* certification: Microsoft's domain weights (range midpoints, normalised at build time as wn).
   Coverage = weighted share of mapped assignments ticked (self-assessed). Practice = weighted mean of first-answer
   accuracy (verified) and flashcard mastery (recall) on mapped topics. Neither predicts an exam result. */
P.cert=(c,main,cards)=>{
  main=main||P.main();cards=cards||P.cards();
  const topics=Object.fromEntries(P.topics().map(t=>[t.id,t]));
  const areas=c.areas.map(a=>{
    const rs=a.topics.filter(id=>topics[id]).map(id=>P.readiness(topics[id],main,cards));
    const asg=rs.reduce((x,r)=>x+r.asg,0),done=rs.reduce((x,r)=>x+r.done,0);
    const mcq=rs.reduce((x,r)=>x+r.mcq,0),ok=rs.reduce((x,r)=>x+r.ok,0);
    const nc=rs.reduce((x,r)=>x+r.cards,0),rc=rs.reduce((x,r)=>x+r.recall,0);
    const prac=[mcq?ok/mcq:null,nc?rc/nc:null].filter(x=>x!==null);
    return {n:a.n,w:a.w,wn:a.wn||null,topics:rs.length,coverage:asg?Math.round(100*done/asg):0,practice:prac.length?Math.round(100*avg(prac)):0,asg,done,mcq,ok,cards:nc,recall:Math.round(rc*10)/10};
  });
  const weighted=areas.length>0&&areas.every(a=>a.wn);
  const wsum=areas.reduce((x,a)=>x+(weighted?a.wn:1),0)||1;
  const wavg=k=>Math.round(areas.reduce((x,a)=>x+(weighted?a.wn:1)*a[k],0)/wsum);
  return {code:c.code,label:c.current.label,next:c.next,areas,weighted,coverage:wavg('coverage'),practice:wavg('practice')};
};

/* evidence totals across everything, for the summary at the top of the progress page */
P.evidence=(main,cards)=>{
  main=main||P.main();cards=cards||P.cards();
  let mcq=0,ok=0,answered=0,asg=0,done=0;
  for(const t of P.topics()){asg+=t.g.length;done+=t.g.filter((_,i)=>main.done[t.id+'-'+i]).length;
    t.mcq.forEach((a,i)=>{if(a===null)return;mcq++;const id=t.id+'-q'+i;if(ST.firstAnswer(main,id)!==undefined)answered++;if(ST.mcqOk(main,id,a))ok++})}
  const ids=[...new Set([...Object.values(CONCEPT_IDS).flat(),...P.topics().flatMap(t=>t.cards)])];
  const m=ids.map(id=>PBI.mastery(cards.srs[id]));
  const fin=SCENARIO_INDEX.filter(s=>main.xp[s.id]&&main.xp[s.id].done);
  const rated=fin.map(s=>P.scenarioScore(s,main.xp[s.id])).filter(Boolean);
  const dels=SCENARIO_INDEX.reduce((x,s)=>x+s.deliverables.length,0);
  const delsDone=SCENARIO_INDEX.reduce((x,s)=>{const r=main.xp[s.id];return x+(r&&r.del?s.deliverables.filter(d=>r.del[d.id]).length:0)},0);
  return {verified:{mcq,answered,ok,pct:mcq?Math.round(100*ok/mcq):0},
    self:{asg,done,pct:asg?Math.round(100*done/asg):0,scenarios:SCENARIO_INDEX.length,finished:fin.length,
      quality:rated.length?Math.round(avg(rated.map(r=>r.quality))):null,independence:rated.length?Math.round(avg(rated.map(r=>r.independence))):null,dels,delsDone},
    recall:{cards:ids.length,reviewed:ids.filter(id=>cards.srs[id]).length,mastered:m.filter(x=>x>=1).length,pct:ids.length?Math.round(100*avg(m)):0}};
};

/* flashcards due today (reviewed cards whose date has come) and never-seen cards */
P.due=cards=>{
  cards=cards||P.cards();const t=PBI.today();
  const all=[...Object.values(CONCEPT_IDS).flat(),...P.topics().flatMap(x=>x.cards)];
  const due=all.filter(id=>cards.srs[id]&&cards.srs[id].d<=t).length;
  const fresh=all.filter(id=>!cards.srs[id]).length;
  return {due,fresh,total:all.length};
};

/* portfolio evidence: deliverables the learner says they wrote (self-declared; nothing is inspected) */
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
