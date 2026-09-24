/* Role-based learning paths and certification maps. Topic ids refer to LEVELS in content.js,
   card categories refer to CONCEPTS in cards.js. */
const ROLES=[
{id:'analyst',name:'Data Analyst',tag:'Most common first job',
 desc:'You turn business questions into clean reports. Hiring managers test Power Query, a sound star schema, everyday DAX and clear visuals.',
 core:['b-pq','b-model','b-dax','b-viz','b-service','i-pq','i-model','i-dax','i-viz','i-rls'],
 cards:['Power BI basics','Power Query & data prep','Data modeling','DAX concepts','Visuals & report design','Scenarios & behavioural']},
{id:'bidev',name:'BI Developer',tag:'Year 2 – 4',
 desc:'You own semantic models other people build on. Expect deep DAX, performance tuning, security and deployment questions.',
 core:['b-model','b-dax','b-service','i-pq','i-model','i-dax','i-viz','i-rls','i-service','a-perf','a-dax','a-composite','a-deploy'],
 cards:['Data modeling','DAX concepts','Performance','Security & governance','Service, sharing & refresh','Scenarios & behavioural']},
{id:'engineer',name:'Analytics Engineer (Fabric)',tag:'DP-600 track',
 desc:'You build the pipeline from raw data to certified model on Fabric: dataflows, lakehouses, Direct Lake, Git and CI/CD.',
 core:['b-pq','b-model','b-service','i-pq','i-model','i-service','i-rls','a-perf','a-composite','a-deploy','a-fabric','a-gov'],
 cards:['Power Query & data prep','Data modeling','Fabric & enterprise','Performance','Security & governance']},
{id:'lead',name:'BI Lead / Architect',tag:'Year 4 – 5',
 desc:'You set standards, choose architectures and explain trade-offs to executives. Breadth matters more than any single feature.',
 core:['b-model','i-model','i-rls','i-service','a-perf','a-composite','a-deploy','a-fabric','a-gov'],
 cards:['Security & governance','Fabric & enterprise','Performance','Service, sharing & refresh','Scenarios & behavioural']}
];

const CERTS=[
{id:'pl300',code:'PL-300',name:'Microsoft Power BI Data Analyst Associate',
 blurb:'The standard Power BI certification. Proves you can prepare, model, visualise and secure data in Power BI.',
 areas:[
  {n:'Prepare the data',w:'25–30%',topics:['b-pq','i-pq'],cards:['Power Query & data prep']},
  {n:'Model the data',w:'25–30%',topics:['b-model','b-dax','i-model','i-dax','a-perf'],cards:['Data modeling','DAX concepts','Performance']},
  {n:'Visualize and analyze the data',w:'25–30%',topics:['b-viz','i-viz'],cards:['Visuals & report design']},
  {n:'Manage and secure Power BI',w:'15–20%',topics:['b-service','i-service','i-rls'],cards:['Service, sharing & refresh','Security & governance']}]},
{id:'dp600',code:'DP-600',name:'Microsoft Fabric Analytics Engineer Associate',
 blurb:'The next step for Fabric work: lakehouses, warehouses, dataflows, enterprise semantic models and lifecycle management.',
 areas:[
  {n:'Maintain a data analytics solution',w:'25–30%',topics:['i-rls','a-deploy','a-gov'],cards:['Security & governance','Fabric & enterprise']},
  {n:'Prepare data',w:'45–50%',topics:['i-pq','i-model','a-fabric'],cards:['Power Query & data prep','Fabric & enterprise']},
  {n:'Implement and manage semantic models',w:'25–30%',topics:['a-perf','a-dax','a-composite','i-dax'],cards:['DAX concepts','Performance','Data modeling']}]}
];
