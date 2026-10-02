/* Seeded generators for the course datasets (data/*.csv). Moved verbatim from the original content.js;
   names and descriptions live in content/datasets/datasets.json. Changing anything here changes the CSVs,
   and the dataset and curriculum tests will tell you which expected results moved. */
'use strict';
/* ---------- deterministic PRNG so every reader gets identical data ---------- */
function rng(seed){let s=seed>>>0;return function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
const rint=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const pad=(n,w=3)=>String(n).padStart(w,'0');
function d(y,m,dd){return `${y}-${pad(m,2)}-${pad(dd,2)}`}

/* ---------- Datasets ---------- */
const DS={};

DS.DimDate={cols:['DateKey','Date','Year','Quarter','MonthNumber','MonthName','WeekOfYear','DayOfWeek','DayName','IsWeekend','FiscalYear','FiscalQuarter'],rows:(()=>{const rows=[];const names=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];const mn=['January','February','March'];let dt=new Date(Date.UTC(2026,0,1));for(let i=0;i<90;i++){const y=dt.getUTCFullYear(),m=dt.getUTCMonth()+1,dd=dt.getUTCDate(),dow=dt.getUTCDay();const jan1=new Date(Date.UTC(y,0,1));const wk=Math.ceil(((dt-jan1)/86400000+jan1.getUTCDay()+1)/7);const fy=m>=7?y+1:y;const fq=Math.ceil(((m+5)%12+1)/3);rows.push([`${y}${pad(m,2)}${pad(dd,2)}`,d(y,m,dd),y,'Q1',m,mn[m-1],wk,dow+1,names[dow],dow==0||dow==6?'TRUE':'FALSE','FY'+fy,'FQ'+fq]);dt=new Date(dt.getTime()+86400000)}return rows})()};

DS.DimProduct={cols:['ProductKey','ProductName','Category','SubCategory','Brand','UnitCost','ListPrice','Discontinued','LaunchDate'],rows:[
[1,'Ridgeline 2P Tent','Camping','Tents','Summit',95,199.99,'FALSE','2023-03-01'],
[2,'Alpine Down Sleeping Bag','Camping','Sleep','Summit',82,179.99,'FALSE','2022-09-15'],
[3,'Trail Chef Stove','Camping','Cooking','Ember',18.5,49.99,'FALSE','2021-05-10'],
[4,'Ember Titanium Pot Set','Camping','Cooking','Ember',22,59.99,'FALSE','2023-11-20'],
[5,'Basecamp Camp Chair','Camping','Furniture','Northwind',14,39.99,'TRUE','2019-04-01'],
[6,'Glacier Headlamp 400','Camping','Lighting','Lumen',9,29.99,'FALSE','2024-02-14'],
[7,'Summit 65L Backpack','Hiking','Packs','Summit',70,169.99,'FALSE','2022-01-05'],
[8,'Daytrip 22L Pack','Hiking','Packs','Northwind',19,54.99,'FALSE','2023-06-01'],
[9,'Carbon Trekking Poles','Hiking','Poles','Summit',31,89.99,'FALSE','2021-08-19'],
[10,'Ridge Runner Boots','Hiking','Footwear','Terra',58,149.99,'FALSE','2022-03-10'],
[11,'Trailflex Sandals','Hiking','Footwear','Terra',21,64.99,'TRUE','2018-05-22'],
[12,'Merino Hiking Sock','Hiking','Apparel','Terra',5.5,19.99,'FALSE','2020-10-01'],
[13,'Stormshell Rain Jacket','Apparel','Outerwear','Northwind',48,129.99,'FALSE','2023-09-01'],
[14,'Puffpack Insulated Vest','Apparel','Outerwear','Northwind',36,99.99,'FALSE','2024-08-15'],
[15,'Quickdry Trail Shirt','Apparel','Tops','Terra',12,39.99,'FALSE','2022-04-04'],
[16,'Convertible Hike Pant','Apparel','Bottoms','Terra',24,74.99,'FALSE','2021-03-15'],
[17,'Sunrise Cap','Apparel','Accessories','Northwind',4,17.99,'FALSE','2020-06-30'],
[18,'Fleece Beanie','Apparel','Accessories','Northwind',3.5,14.99,'FALSE','2020-06-30'],
[19,'Riverstone Kayak 10','Water','Kayaks','Current',310,699.99,'FALSE','2023-04-20'],
[20,'Drift Paddle Board','Water','Boards','Current',260,599.99,'FALSE','2024-05-01'],
[21,'Dry Bag 20L','Water','Accessories','Current',6,24.99,'FALSE','2021-07-07'],
[22,'Type III Life Vest','Water','Safety','Current',28,79.99,'FALSE','2022-02-28'],
[23,'Hydro Filter Bottle','Water','Hydration','Ember',11,34.99,'FALSE','2024-01-10'],
[24,'Neoprene Water Shoe','Water','Footwear','Current',13,44.99,'TRUE','2019-03-03']]};

DS.DimCustomer={cols:['CustomerKey','CustomerName','Segment','City','State','RegionKey','JoinDate','LoyaltyTier','Email'],rows:(()=>{const r=rng(11);const first=['Ava','Liam','Noah','Emma','Mia','Ethan','Olivia','Lucas','Zoe','Mason','Isla','Leo','Nora','Aiden','Ruby','Owen','Chloe','Eli','Hana','Jack','Maya','Finn','Lena','Kai','Sara','Theo','Ivy','Max','Nia','Cole'];const last=['Patel','Nguyen','Garcia','Okafor','Schmidt','Rossi','Kim','Silva','Brown','Haddad','Larsen','Meyer','Ortiz','Singh','Tanaka','Walsh','Novak','Reyes','Dube','Fischer','Costa','Ali','Moore','Byrne','Chen','Adler','Lund','Rana','Hughes','Bakr'];const cities=[['Seattle','WA',1],['Portland','OR',1],['Denver','CO',1],['Boise','ID',1],['Austin','TX',2],['Atlanta','GA',2],['Miami','FL',2],['Nashville','TN',2],['Boston','MA',3],['New York','NY',3],['Philadelphia','PA',3],['Burlington','VT',3],['Chicago','IL',4],['Minneapolis','MN',4],['Detroit','MI',4],['Milwaukee','WI',4]];const seg=['Consumer','Consumer','Consumer','Small Business','Outfitter'];const tier=['Bronze','Bronze','Silver','Silver','Gold','Platinum'];const rows=[];for(let i=0;i<30;i++){const c=cities[i%16];const y=rint(r,2022,2026),m=y==2026?rint(r,1,3):rint(r,1,12);const nm=first[i]+' '+last[i];rows.push([100+i,nm,pick(r,seg),c[0],c[1],c[2],d(y,m,rint(r,1,28)),pick(r,tier),(first[i]+'.'+last[i]).toLowerCase()+'@example.com'])}return rows})()};

DS.DimRegion={cols:['RegionKey','RegionName','Country','RegionManager','ManagerEmail','TargetMultiplier'],rows:[[1,'West','USA','Dana Whitfield','dana.whitfield@northwind.example',1.10],[2,'South','USA','Marcus Bell','marcus.bell@northwind.example',1.00],[3,'East','USA','Priya Raman','priya.raman@northwind.example',1.05],[4,'Central','USA','Tomas Ekberg','tomas.ekberg@northwind.example',0.95]]};

DS.DimEmployee={cols:['EmployeeKey','EmployeeName','Title','ManagerKey','RegionKey','HireDate','Salary','Email'],rows:[
[1,'Grace Hollis','CEO','',3,'2015-01-12',260000,'grace.hollis@northwind.example'],
[2,'Dana Whitfield','VP Sales West',1,1,'2016-03-01',165000,'dana.whitfield@northwind.example'],
[3,'Marcus Bell','VP Sales South',1,2,'2017-06-19',160000,'marcus.bell@northwind.example'],
[4,'Priya Raman','VP Sales East',1,3,'2016-09-05',168000,'priya.raman@northwind.example'],
[5,'Tomas Ekberg','VP Sales Central',1,4,'2018-02-26',158000,'tomas.ekberg@northwind.example'],
[6,'Rosa Delgado','Account Manager',2,1,'2019-04-15',82000,'rosa.delgado@northwind.example'],
[7,'Ken Osei','Account Manager',2,1,'2020-08-03',79000,'ken.osei@northwind.example'],
[8,'Lily Chang','Sales Rep',6,1,'2022-01-10',56000,'lily.chang@northwind.example'],
[9,'Jonah Pike','Sales Rep',6,1,'2023-05-22',52000,'jonah.pike@northwind.example'],
[10,'Amara Diallo','Account Manager',3,2,'2019-11-11',81000,'amara.diallo@northwind.example'],
[11,'Sam Rourke','Sales Rep',10,2,'2021-07-07',55000,'sam.rourke@northwind.example'],
[12,'Bea Lindqvist','Account Manager',4,3,'2018-10-01',85000,'bea.lindqvist@northwind.example'],
[13,'Omar Haddad','Sales Rep',12,3,'2022-03-14',54000,'omar.haddad@northwind.example'],
[14,'Tessa Moreau','Sales Rep',12,3,'2024-01-08',51000,'tessa.moreau@northwind.example'],
[15,'Victor Ilunga','Account Manager',5,4,'2020-02-17',80000,'victor.ilunga@northwind.example'],
[16,'Hannah Weiss','Sales Rep',15,4,'2021-09-27',53000,'hannah.weiss@northwind.example'],
[17,'Raj Menon','Sales Rep',15,4,'2023-11-06',52500,'raj.menon@northwind.example'],
[18,'Nina Kowalski','Finance Analyst',1,3,'2019-06-03',74000,'nina.kowalski@northwind.example']]};

DS.FactSales={cols:['SalesKey','OrderID','OrderDate','ShipDate','CustomerKey','ProductKey','EmployeeKey','RegionKey','Quantity','UnitPrice','Discount','Channel'],rows:(()=>{const r=rng(2026);const rows=[];let order=5000;const reps=[8,9,11,13,14,16,17,6,7,10,12,15];const ch=['Online','Online','Store','Store','Wholesale'];const prod=DS.DimProduct.rows;const cust=DS.DimCustomer.rows;let k=1;while(rows.length<100){order++;const m=rint(r,1,3),dd=rint(r,1,m==2?28:31);const od=new Date(Date.UTC(2026,m-1,dd));const c=pick(r,cust);const lines=rint(r,1,3);for(let l=0;l<lines&&rows.length<100;l++){const p=pick(r,prod);const emp=pick(r,reps);const empRow=DS.DimEmployee.rows.find(e=>e[0]==emp);const ship=new Date(od.getTime()+rint(r,1,6)*86400000);const isRet=r()<0.06;const q=isRet?-rint(r,1,2):rint(r,1,6);const disc=pick(r,[0,0,0,0.05,0.1,0.15,0.2]);rows.push([k++,'SO-'+order,d(2026,m,dd),d(ship.getUTCFullYear(),ship.getUTCMonth()+1,ship.getUTCDate()),c[0],p[0],emp,empRow[4],q,p[6],disc,pick(r,ch)])}}return rows})()};

DS.FactBudget={cols:['BudgetKey','YearMonth','RegionKey','Category','BudgetAmount','BudgetUnits'],rows:(()=>{const r=rng(48);const rows=[];let k=1;const cats=['Camping','Hiking','Apparel','Water'];for(const ym of ['2026-01','2026-02','2026-03'])for(let reg=1;reg<=4;reg++)for(const c of cats){const base={Camping:2400,Hiking:2100,Apparel:1500,Water:3200}[c];rows.push([k++,ym,reg,c,Math.round(base*(0.8+r()*0.5)/10)*10,rint(r,10,40)])}return rows})()};

DS.FactInventory={cols:['SnapshotDate','ProductKey','WarehouseCode','QuantityOnHand','ReorderPoint'],rows:(()=>{const r=rng(80);const rows=[];const prods=[1,2,7,10,13,19,20,23];const wh={1:'WH-WEST',2:'WH-WEST',7:'WH-EAST',10:'WH-EAST',13:'WH-CENTRAL',19:'WH-SOUTH',20:'WH-SOUTH',23:'WH-CENTRAL'};let start=new Date(Date.UTC(2026,0,4));for(let w=0;w<10;w++){for(const p of prods){const lvl=p==19||p==20?rint(r,2,25):rint(r,0,180);rows.push([d(start.getUTCFullYear(),start.getUTCMonth()+1,start.getUTCDate()),p,wh[p],lvl,p==19||p==20?5:30])}start=new Date(start.getTime()+7*86400000)}return rows})()};

DS.RawOrdersExport={cols:['Order Ref','Order Dt','customer name ','PRODUCT','Qty','Unit Price','Region ','Notes','LegacyFlag'],rows:[
['REPORT GENERATED 2026-04-02 09:12','','','','','','','',''],
['SO-5001','01/03/2026','ava patel ','Ridgeline 2P Tent','2','$199.99','west','',''],
['SO-5001','01/03/2026','ava patel ','Ridgeline 2P Tent','2','$199.99','west','',''],
['SO-5002','2026-01-05','Liam Nguyen','TRAIL CHEF STOVE','1','49.99 USD','West','rush',''],
['SO-5003','Jan 7 2026','Noah Garcia','Summit 65L Backpack','N/A','$169.99','SOUTH','',''],
['SO-5004','2026/01/08','emma okafor','Carbon Trekking Poles','3','$89.99','south ','gift wrap',''],
['SO-5005','09-01-2026','Mia Schmidt ','Ridge Runner Boots','1','$149.99','East','',''],
['SO-5006','2026-01-12','Ethan Rossi','Merino Hiking Sock','12','$19.99','east','bulk',''],
['SO-5007','1/14/2026','OLIVIA KIM','Stormshell Rain Jacket','1','$129.99','Central','',''],
['SO-5008','2026-01-15','Lucas Silva','Puffpack Insulated Vest','2','$99.99','central','',''],
['SO-5009','16 Jan 2026','Zoe Brown','Riverstone Kayak 10','1','$699.99','West','freight',''],
['SO-5010','2026-01-19','Mason Haddad','Dry Bag 20L','-1','$24.99','West','RETURN',''],
['SO-5011','2026-01-20','Isla Larsen','Hydro Filter Bottle','4','$34.99','South','',''],
['SO-5012','2026-01-22','leo meyer','Glacier Headlamp 400','2','$29.99','east','',''],
['SO-5013','2026-01-23','Nora Ortiz','Type III Life Vest','2','$79.99','Central','',''],
['SO-5014','01/26/2026','Aiden Singh','Ember Titanium Pot Set','1','$59.99','WEST','',''],
['SO-5015','2026-01-27','Ruby Tanaka','Convertible Hike Pant','','$74.99','South','qty missing',''],
['SO-5016','2026-01-29','Owen Walsh','Quickdry Trail Shirt','3','$39.99','East','',''],
['SO-5017','2026-02-02','Chloe Novak','Sunrise Cap','5','$17.99','Central','',''],
['SO-5018','2026-02-03','Eli Reyes','Fleece Beanie','5','$14.99','central','',''],
['SO-5019','2026-02-05','hana dube','Drift Paddle Board','1','$599.99','west','',''],
['SO-5020','2026-02-06','Jack Fischer','Alpine Down Sleeping Bag','2','$179.99','South','',''],
['SO-5021','06/02/2026','Maya Costa','Daytrip 22L Pack','1','$54.99','East','',''],
['SO-5022','2026-02-10','Finn Ali','Trailflex Sandals','2','$64.99','Central','discontinued',''],
['SO-5023','2026-02-11','Lena Moore','Neoprene Water Shoe','1','$44.99','West','',''],
['SO-5024','2026-02-12','Kai Byrne','Basecamp Camp Chair','2','$39.99','South','',''],
['SO-5025','2026-02-13','Sara Chen','Ridgeline 2P Tent','1','$199.99','East','',''],
['SO-5026','2026-02-16','Theo Adler','Trail Chef Stove','N/A','N/A','Central','data error',''],
['SO-5027','2026-02-17','Ivy Lund','Stormshell Rain Jacket','1','$129.99','West','',''],
['TOTAL','','','','58','','','','']]};

DS.SurveyWide={cols:['StoreCode','StoreName','RegionKey','Jan-2026','Feb-2026','Mar-2026','Target-2026'],rows:[['ST01','Seattle Flagship',1,4.6,4.5,4.7,4.5],['ST02','Portland Pearl',1,4.2,4.4,4.3,4.5],['ST03','Denver Union',1,3.9,4.1,4.4,4.5],['ST04','Austin Domain',2,4.4,4.3,4.5,4.5],['ST05','Atlanta Ponce',2,4.0,4.0,4.2,4.5],['ST06','Miami Wynwood',2,4.7,4.8,4.6,4.5],['ST07','Boston Seaport',3,4.3,4.5,4.6,4.5],['ST08','NYC SoHo',3,4.1,4.0,4.3,4.5],['ST09','Philly Center',3,3.8,3.9,4.1,4.5],['ST10','Chicago Loop',4,4.5,4.4,4.6,4.5],['ST11','Minneapolis Mall',4,4.2,4.3,4.2,4.5],['ST12','Detroit Corktown',4,3.7,4.0,4.2,4.5]]};

DS.UserRegionMapping={cols:['UserEmail','RegionKey','AccessLevel'],rows:[['dana.whitfield@northwind.example',1,'Manager'],['marcus.bell@northwind.example',2,'Manager'],['priya.raman@northwind.example',3,'Manager'],['tomas.ekberg@northwind.example',4,'Manager'],['nina.kowalski@northwind.example',1,'Analyst'],['nina.kowalski@northwind.example',3,'Analyst'],['grace.hollis@northwind.example',0,'All'],['rosa.delgado@northwind.example',1,'Rep'],['amara.diallo@northwind.example',2,'Rep'],['bea.lindqvist@northwind.example',3,'Rep'],['victor.ilunga@northwind.example',4,'Rep'],['ken.osei@northwind.example',1,'Rep']]};

DS.ExchangeRates={cols:['RateDate','Currency','RateToUSD'],rows:(()=>{const r=rng(39);const rows=[];let dt=new Date(Date.UTC(2026,0,5));const base={EUR:1.08,GBP:1.27,CAD:0.74};for(let w=0;w<13;w++){for(const c of ['EUR','GBP','CAD']){base[c]=+(base[c]*(1+(r()-0.5)*0.02)).toFixed(4);rows.push([d(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate()),c,base[c]])}dt=new Date(dt.getTime()+7*86400000)}return rows})()};

DS.CustomerTargets={cols:['Segment','LoyaltyTier','Quarter','TargetRevenue'],rows:(()=>{const rows=[];const s=['Consumer','Small Business','Outfitter'],t=['Bronze','Silver','Gold','Platinum'];const r=rng(20);let i=0;for(const seg of s)for(const tier of t){if(i>=20)break;rows.push([seg,tier,'2026-Q1',Math.round((1500+r()*4000)/50)*50]);i++}for(const seg of s.slice(0,2))for(const tier of t.slice(0,4)){if(i>=20)break;rows.push([seg,tier,'2026-Q2',Math.round((1600+r()*4200)/50)*50]);i++}return rows})()};

DS.WebEvents={cols:['EventKey','SessionID','CustomerKey','EventTime','EventType','Page','DeviceType'],rows:(()=>{const r=rng(777);const rows=[];let k=1,sess=900;const flow=['PageView','ProductView','AddToCart','Checkout','Purchase'];const dev=['Mobile','Mobile','Desktop','Tablet'];while(rows.length<100){sess++;const cust=100+rint(r,0,29);const m=rint(r,1,3),dd=rint(r,1,28),h=rint(r,7,22);let min=rint(r,0,59);const depth=rint(r,1,5);const dv=pick(r,dev);for(let i=0;i<depth&&rows.length<100;i++){min+=rint(r,1,9);const hh=h+Math.floor(min/60),mm=min%60;rows.push([k++,'S'+sess,cust,`2026-${pad(m,2)}-${pad(dd,2)} ${pad(hh,2)}:${pad(mm,2)}:00`,flow[i],flow[i]=='PageView'?'/home':flow[i]=='ProductView'?'/product/'+rint(r,1,24):'/'+flow[i].toLowerCase(),dv])}}return rows})()};

module.exports = DS;
