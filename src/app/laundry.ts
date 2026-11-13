import type {DemoUser} from './demo';
export interface Service {id:string;name:string;desc:string;price:number;unit:string;color:string;type:string;active:boolean}
export type LaundryStatus='Received'|'Washing'|'Drying'|'Ready for pickup'|'Completed'|'Cancelled';
export interface OrderItem {serviceId:string;service:string;quantity:number;unit:string;rate:number;amount:number}
export type PaymentMethod='Cash'|'E-wallet';
export interface LaundryOrder {items:OrderItem[];id:string;email:string;name:string;serviceId:string;service:string;quantity:number;unit:string;rate:number;amount:number;status:LaundryStatus;date:string;created:string;notes:string;paymentMethod?:PaymentMethod}
export interface Booking {serviceId?:string;quantity?:number;items?:{serviceId:string;quantity:number}[];date:string;notes:string;paymentMethod?:PaymentMethod}
export const stages:LaundryStatus[]=['Received','Washing','Drying','Ready for pickup','Completed'];
const seedServices:Service[]=[
{id:'wash-fold',name:'Wash, dry & fold',desc:'The everyday reset. Clean, soft, neatly folded.',price:35,unit:'/ kg',color:'yellow',type:'shirt',active:true},
{id:'wash-dry',name:'Wash & dry',desc:'Fresh from the dryer. Fold it your way.',price:30,unit:'/ kg',color:'blue',type:'socks',active:true},
{id:'comforter',name:'Comforter care',desc:'A little extra love for your big, cozy things.',price:250,unit:'/ piece',color:'pink',type:'blanket',active:true},
{id:'iron',name:'Iron & press',desc:'Crisp collars. Smooth finishes. Ready to go.',price:25,unit:'/ piece',color:'mint',type:'shirt',active:true}];
export function localDate():string {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function validService(s:Service){return s&&typeof s.id==='string'&&typeof s.name==='string'&&typeof s.desc==='string'&&s.name.trim().length>=2&&s.name.length<=70&&s.desc.length<=240&&Number.isFinite(s.price)&&s.price>=0.01&&s.price<=100000&&Math.abs(s.price*100-Math.round(s.price*100))<0.000001&&['/ kg','/ piece','/ load'].includes(s.unit)&&['yellow','blue','pink','mint'].includes(s.color)&&['shirt','socks','blanket'].includes(s.type)&&typeof s.active==='boolean';}
function validOrder(o:LaundryOrder){return o&&(o.paymentMethod===undefined||o.paymentMethod==='Cash'||o.paymentMethod==='E-wallet')&&['id','email','name','serviceId','service','unit','date','created','notes'].every(k=>typeof o[k as keyof LaundryOrder]==='string')&&[...stages,'Cancelled'].includes(o.status)&&Number.isFinite(o.amount)&&o.amount>0&&Number.isFinite(o.quantity)&&o.quantity>0&&Number.isFinite(o.rate)&&o.rate>0&&Array.isArray(o.items)&&o.items.length>0&&o.items.every(i=>i&&typeof i.serviceId==='string'&&typeof i.service==='string'&&typeof i.unit==='string'&&Number.isFinite(i.quantity)&&i.quantity>0&&Number.isFinite(i.rate)&&i.rate>0&&Number.isFinite(i.amount)&&i.amount>0)&&Math.abs(o.items.reduce((sum,i)=>sum+i.amount,0)-o.amount)<0.001;}
export interface DailyAnalysisPoint {date:string;amount:number;completed:number;average:number;count:number;cancelled:number;cancelledRate:number}
export interface AnalysisBucket {key:string;label:string;amount:number;completed:number;average:number;count:number;cancelled:number;cancelledRate:number}
export interface StageTotal {stage:LaundryStatus;count:number;amount:number}
export interface PeriodDeltas {completedRevenue:number|null;orderValue:number|null;active:number|null;average:number|null;cancelledRate:number|null}
function fmtIsoDate(d:Date):string {return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function shiftIsoDate(dateStr:string,deltaDays:number):string {const d=new Date(`${dateStr}T00:00:00`);d.setDate(d.getDate()+deltaDays);return fmtIsoDate(d);}
function shiftMonthStart(dateStr:string,deltaMonths:number):string {const [y,m]=dateStr.split('-').map(Number);return fmtIsoDate(new Date(y,m-1+deltaMonths,1));}
function shortMonthLabel(ym:string,withYear=false):string {const [y,m]=ym.split('-').map(Number);const d=new Date(y,m-1,1);return d.toLocaleDateString('en-US',withYear?{month:'short',year:'2-digit'}:{month:'short'});}
function shortDayLabel(iso:string):string {const [y,m,day]=iso.split('-').map(Number);return new Date(y,m-1,day).toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function summarizeOrders(orders:LaundryOrder[]) {
  const valid=orders.filter(o=>o.status!=='Cancelled');const cancelledOrders=orders.filter(o=>o.status==='Cancelled');
  const amount=Math.round(valid.reduce((sum,o)=>sum+o.amount,0)*100)/100;
  const completed=Math.round(valid.filter(o=>o.status==='Completed').reduce((sum,o)=>sum+o.amount,0)*100)/100;
  const count=valid.length;const cancelled=cancelledOrders.length;const total=count+cancelled;
  return {amount,completed,average:count?Math.round((amount/count)*100)/100:0,count,cancelled,cancelledRate:total?Math.round((cancelled/total)*1000)/10:0};
}
function periodBounds(period:string,today:string):{from:string|null;to:string;prevFrom:string|null;prevTo:string|null} {
  if(period==='day')return {from:today,to:today,prevFrom:shiftIsoDate(today,-1),prevTo:shiftIsoDate(today,-1)};
  if(period==='week'){const from=shiftIsoDate(today,-6);const prevTo=shiftIsoDate(from,-1);return {from,to:today,prevFrom:shiftIsoDate(prevTo,-6),prevTo};}
  if(period==='month'){const from=shiftIsoDate(today,-29);const prevTo=shiftIsoDate(from,-1);return {from,to:today,prevFrom:shiftIsoDate(prevTo,-29),prevTo};}
  if(period==='quarter'){const from=shiftMonthStart(today,-2);const prevTo=shiftIsoDate(from,-1);return {from,to:today,prevFrom:shiftMonthStart(today,-5),prevTo};}
  if(period==='year'){const from=shiftMonthStart(today,-11);const prevTo=shiftIsoDate(from,-1);return {from,to:today,prevFrom:shiftMonthStart(today,-23),prevTo};}
  return {from:null,to:today,prevFrom:null,prevTo:null};
}
function pctDelta(current:number,previous:number):number|null {return previous>0?Math.round(((current-previous)/previous)*1000)/10:null;}
export class LaundryStore {
services:Service[]=structuredClone(seedServices);orders:LaundryOrder[]=[];
constructor(saved?:string|null){if(!saved)return;try{const data=JSON.parse(saved);if(data.version===1){data.orders=[];data.version=2;}if(Array.isArray(data.orders))data.orders=data.orders.map((o:LaundryOrder)=>({...o,items:o.items||[{serviceId:o.serviceId,service:o.service,quantity:o.quantity,unit:o.unit,rate:o.rate,amount:o.amount}]}));if(data.version===2&&Array.isArray(data.services)&&data.services.length>0&&data.services.every(validService)&&Array.isArray(data.orders)&&data.orders.every(validOrder)&&new Set(data.services.map((s:Service)=>s.id)).size===data.services.length&&new Set(data.orders.map((o:LaundryOrder)=>o.id)).size===data.orders.length){this.services=data.services;this.orders=data.orders;}}catch{/* Invalid browser data falls back to the default services. */}}
serialize(){return JSON.stringify({version:2,services:this.services,orders:this.orders});}
private requireAdmin(actor:DemoUser){if(actor.role!=='admin')throw new Error('Only the branch admin can make this change.');}
saveService(actor:DemoUser,draft:Omit<Service,'id'>&{id?:string}):Service {
this.requireAdmin(actor);const id=draft.id||`service-${crypto.randomUUID()}`;const s={...draft,id,name:draft.name.trim(),desc:draft.desc.trim()};
if(!validService(s))throw new Error('Enter a service name, a valid rate above ₱0, and a description of up to 240 characters.');
if(this.services.some(x=>x.id!==id&&x.name.toLowerCase()===s.name.toLowerCase()))throw new Error('A service with this name already exists.');
const index=this.services.findIndex(x=>x.id===id);if(draft.id&&index<0)throw new Error('This service no longer exists.');
if(index<0)this.services.push(s);else this.services[index]=s;return s;
}
book(actor:DemoUser,b:Booking,today=localDate()):LaundryOrder {
if(actor.role!=='customer')throw new Error('Sign in as a customer to place a laundry order.');
if(b.paymentMethod!==undefined&&b.paymentMethod!=='Cash'&&b.paymentMethod!=='E-wallet')throw new Error('Choose Cash or E-wallet.');
const requested=b.items??(b.serviceId?[{serviceId:b.serviceId,quantity:b.quantity as number}]:[]);
if(!requested.length)throw new Error('Choose at least one available service.');
if(new Set(requested.map(i=>i.serviceId)).size!==requested.length)throw new Error('Each service can only appear once. Update its quantity instead.');
if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||!Number.isFinite(Date.parse(b.date))||new Date(b.date).toISOString().slice(0,10)!==b.date||b.date<today)throw new Error('Choose a valid drop-off date today or later.');
if(b.notes.length>300)throw new Error('Keep laundry notes to 300 characters.');
const items:OrderItem[]=requested.map(line=>{
const service=this.services.find(s=>s.id===line.serviceId&&s.active);if(!service)throw new Error('Choose an available service.');
const q=line.quantity;
if(!Number.isFinite(q)||q<=0||q>1000||(service.unit!=='/ kg'&&!Number.isInteger(q)))throw new Error('Enter a quantity above 0, up to 1,000. Pieces and loads must be whole numbers.');
if(service.unit==='/ kg'&&(q<0.1||Math.abs(q*10-Math.round(q*10))>0.000001))throw new Error('Enter weight in 0.1 kg increments, starting at 0.1 kg.');
const amount=Math.round(service.price*q*100)/100;if(amount<0.01)throw new Error('This quantity produces a total below ₱0.01. Increase the quantity or ask the admin to adjust the rate.');
return {serviceId:service.id,service:service.name,quantity:q,unit:service.unit,rate:service.price,amount};});
const first=items[0];
const order:LaundryOrder={...first,items,id:`LD-${Math.max(1000,...this.orders.map(o=>Number(o.id.slice(3))||0))+1}`,email:actor.email,name:actor.name,service:items.map(i=>i.service).join(' + '),amount:Math.round(items.reduce((sum,i)=>sum+i.amount,0)*100)/100,status:'Received',date:b.date,created:today,notes:b.notes.trim(),paymentMethod:b.paymentMethod};
this.orders.unshift(order);return order;
}
cancel(actor:DemoUser,id:string){const o=this.orders.find(x=>x.id===id&&x.email===actor.email);if(actor.role!=='customer'||!o)throw new Error('This order is not available.');if(o.status!=='Received')throw new Error('Only orders that have not started processing can be cancelled.');o.status='Cancelled';}
advance(actor:DemoUser,id:string){this.requireAdmin(actor);const o=this.orders.find(x=>x.id===id);if(!o||o.status==='Cancelled'||o.status==='Completed')throw new Error('This order cannot be advanced.');o.status=stages[stages.indexOf(o.status)+1];}
private summarizeWindow(from:string|null,to:string) {
const all=this.orders.filter(o=>(!from||o.created>=from)&&o.created<=to);const valid=all.filter(o=>o.status!=='Cancelled');const cancelledOrders=all.filter(o=>o.status==='Cancelled');
const dailyMap=new Map<string,{amount:number;completed:number;count:number;cancelled:number}>();
const ensureDay=(date:string)=>dailyMap.get(date)??dailyMap.set(date,{amount:0,completed:0,count:0,cancelled:0}).get(date)!;
for(const o of valid){const b=ensureDay(o.created);b.amount=Math.round((b.amount+o.amount)*100)/100;b.count+=1;if(o.status==='Completed')b.completed=Math.round((b.completed+o.amount)*100)/100;}
for(const o of cancelledOrders){ensureDay(o.created).cancelled+=1;}
const daily:DailyAnalysisPoint[]=Array.from(dailyMap,([date,b])=>({date,amount:b.amount,completed:b.completed,average:b.count?Math.round((b.amount/b.count)*100)/100:0,count:b.count,cancelled:b.cancelled,cancelledRate:(b.count+b.cancelled)?Math.round((b.cancelled/(b.count+b.cancelled))*1000)/10:0})).sort((a,b)=>a.date.localeCompare(b.date));
const lines=valid.flatMap(o=>o.items);
const serviceTotals=Array.from(new Set(lines.map(i=>i.serviceId))).map(id=>{const items=lines.filter(i=>i.serviceId===id);return {id,name:this.services.find(s=>s.id===id)?.name||items[0].service,amount:Math.round(items.reduce((sum,i)=>sum+i.amount,0)*100)/100,count:valid.filter(o=>o.items.some(i=>i.serviceId===id)).length};}).sort((a,b)=>b.amount-a.amount);
const orderValue=Math.round(valid.reduce((sum,o)=>sum+o.amount,0)*100)/100;
const completedOrders=valid.filter(o=>o.status==='Completed');
const completedRevenue=Math.round(completedOrders.reduce((sum,o)=>sum+o.amount,0)*100)/100;
const cancelledValue=Math.round(cancelledOrders.reduce((sum,o)=>sum+o.amount,0)*100)/100;
const stageTotals:StageTotal[]=stages.map(stage=>{const matched=valid.filter(o=>o.status===stage);return {stage,count:matched.length,amount:Math.round(matched.reduce((sum,o)=>sum+o.amount,0)*100)/100};});
const active=valid.filter(o=>o.status!=='Completed').length;
const ready=valid.filter(o=>o.status==='Ready for pickup').length;
const average=valid.length?orderValue/valid.length:0;
const cancelledRate=all.length?Math.round((cancelledOrders.length/all.length)*1000)/10:0;
const completionRate=valid.length?Math.round((completedOrders.length/valid.length)*1000)/10:0;
return {orders:all,orderValue,completedRevenue,completedCount:completedOrders.length,active,ready,customers:new Set(valid.map(o=>o.email)).size,average,cancelledCount:cancelledOrders.length,cancelledValue,cancelledRate,completionRate,serviceTotals,stageTotals,daily};
}
private buildBuckets(period:string,from:string,to:string,orders:LaundryOrder[],daily:DailyAnalysisPoint[]):AnalysisBucket[] {
  if(period==='day'){
    const dropDates=Array.from(new Set(orders.map(o=>o.date))).sort();
    return dropDates.map(d=>({key:d,label:shortDayLabel(d),...summarizeOrders(orders.filter(o=>o.date===d))}));
  }
  if(period==='week'){
    return Array.from({length:7},(_,i)=>{const d=shiftIsoDate(from,i);return {key:d,label:shortDayLabel(d),...summarizeOrders(orders.filter(o=>o.created===d))};});
  }
  if(period==='month'){
    return Array.from({length:5},(_,i)=>{const start=shiftIsoDate(from,i*6);const end=shiftIsoDate(start,5);return {key:start,label:shortDayLabel(start),...summarizeOrders(orders.filter(o=>o.created>=start&&o.created<=end))};});
  }
  if(period==='quarter'||period==='year'){
    const months=period==='quarter'?3:12;
    return Array.from({length:months},(_,i)=>{const ym=shiftMonthStart(from,i).slice(0,7);return {key:ym,label:shortMonthLabel(ym),...summarizeOrders(orders.filter(o=>o.created.startsWith(ym)))};});
  }
  const first=daily[0]?.date;
  if(!first)return [];
  const startMonth=first.slice(0,7),endMonth=to.slice(0,7);
  if(startMonth!==endMonth){
    const list:AnalysisBucket[]=[];
    let ymDate=shiftMonthStart(first,0);
    for(let guard=0;guard<60&&ymDate.slice(0,7)<=endMonth;guard++){
      const ym=ymDate.slice(0,7);
      list.push({key:ym,label:shortMonthLabel(ym,true),...summarizeOrders(orders.filter(o=>o.created.startsWith(ym)))});
      ymDate=shiftMonthStart(ymDate,1);
    }
    return list;
  }
  return daily.map(d=>({key:d.date,label:shortDayLabel(d.date),amount:d.amount,completed:d.completed,average:d.average,count:d.count,cancelled:d.cancelled,cancelledRate:d.cancelledRate}));
}
analysis(period:string,today=localDate()) {
const bounds=periodBounds(period,today);const current=this.summarizeWindow(bounds.from,bounds.to);
const prev=bounds.prevFrom&&bounds.prevTo?this.summarizeWindow(bounds.prevFrom,bounds.prevTo):null;
const deltas:PeriodDeltas=prev?{completedRevenue:pctDelta(current.completedRevenue,prev.completedRevenue),orderValue:pctDelta(current.orderValue,prev.orderValue),active:pctDelta(current.active,prev.active),average:pctDelta(current.average,prev.average),cancelledRate:prev.orders.length?Math.round((current.cancelledRate-prev.cancelledRate)*10)/10:null}:{completedRevenue:null,orderValue:null,active:null,average:null,cancelledRate:null};
const effectiveFrom=bounds.from||(current.daily[0]?.date??today);
const buckets=this.buildBuckets(period,effectiveFrom,bounds.to,current.orders,current.daily);
return {...current,from:effectiveFrom,to:bounds.to,deltas,buckets};
}
}
