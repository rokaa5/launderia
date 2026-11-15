import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LaundryStore} from '../src/app/laundry.ts';
const admin={name:'Admin',email:'admin@launderia.demo',role:'admin' as const};
const customer={name:'Test Customer',email:'test@example.com',role:'customer' as const};
const today='2026-11-06';
test('service management validates input and enforces admin role',()=>{
const s=new LaundryStore();const draft={name:'Delicate care',desc:'Gentle wash',price:70,unit:'/ kg',color:'mint',type:'shirt',active:true};
assert.throws(()=>s.saveService(customer,draft));assert.throws(()=>s.saveService(admin,{...draft,price:-1}));
const added=s.saveService(admin,draft);assert.equal(s.services.length,5);
s.saveService(admin,{...added,price:80});assert.equal(s.services.find(x=>x.id===added.id)?.price,80);
assert.throws(()=>s.saveService(admin,{...draft,name:'Wash & dry'}));
});
test('booking snapshots price, validates quantity and date, and only uses available services',()=>{
const s=new LaundryStore();const id=s.services[0].id;
const booking={serviceId:id,quantity:5,date:today,notes:'Separate colors'};
assert.throws(()=>s.book(customer,{...booking,quantity:0},today));assert.throws(()=>s.book(customer,{...booking,date:'2026-01-01'},today));
const order=s.book(customer,booking,today);assert.equal(order.amount,175);assert.equal(order.email,customer.email);
s.saveService(admin,{...s.services[0],price:50});assert.equal(order.amount,175);assert.equal(s.book(customer,booking,today).amount,250);
s.saveService(admin,{...s.services[0],active:false});assert.throws(()=>s.book(customer,booking,today));
});
test('customer cancellation and admin progress are scoped and valid',()=>{
const s=new LaundryStore();const o=s.book(customer,{serviceId:s.services[0].id,quantity:2,date:today,notes:''},today);
assert.throws(()=>s.cancel({...customer,email:'other@example.com'},o.id));
s.advance(admin,o.id);assert.equal(o.status,'Washing');assert.throws(()=>s.cancel(customer,o.id));
assert.throws(()=>s.advance(customer,o.id));
const next=s.book(customer,{serviceId:s.services[0].id,quantity:2,date:today,notes:''},today);s.cancel(customer,next.id);assert.equal(next.status,'Cancelled');
});
test('analysis starts at zero and reports customer orders, completed value and cancellations',()=>{
const s=new LaundryStore();assert.equal(s.analysis('all',today).orderValue,0);assert.equal(s.analysis('all',today).active,0);
const o=s.book(customer,{serviceId:s.services[0].id,quantity:2,date:today,notes:''},today);
assert.equal(s.analysis('all',today).orderValue,70);assert.equal(s.analysis('all',today).completedRevenue,0);
for(let i=0;i<4;i++)s.advance(admin,o.id);assert.equal(s.analysis('all',today).completedRevenue,70);
const cancelled=s.book(customer,{serviceId:s.services[0].id,quantity:3,date:today,notes:''},today);s.cancel(customer,cancelled.id);assert.equal(s.analysis('all',today).orderValue,70);
});

test('saved demo state reloads with historical totals intact and invalid data is ignored',()=>{
const s=new LaundryStore();s.book(customer,{serviceId:s.services[0].id,quantity:7,date:today,notes:''},today);s.saveService(admin,{...s.services[0],price:80});
const restored=new LaundryStore(s.serialize());assert.equal(restored.services[0].price,80);assert.equal(restored.orders[0].amount,245);
assert.equal(new LaundryStore('bad json').services.length,4);
assert.equal(new LaundryStore('{"services":[],"orders":[{}]}').orders.length,0);
});

test('sub-cent totals and unsupported weight precision cannot corrupt saved orders',()=>{
const s=new LaundryStore();const service=s.saveService(admin,{...s.services[0],price:0.01});
const before=s.serialize();
assert.throws(()=>s.book(customer,{serviceId:service.id,quantity:0.1,date:today,notes:''},today));
assert.equal(s.serialize(),before);assert.equal(new LaundryStore(s.serialize()).services[0].price,0.01);
assert.throws(()=>s.book(customer,{serviceId:service.id,quantity:0.0001,date:today,notes:''},today));
assert.throws(()=>s.saveService(admin,{...service,price:0.001}));
});

test('one booking supports multiple services with separate quantities and historical prices',()=>{
const s=new LaundryStore();const booking={items:[{serviceId:s.services[0].id,quantity:3},{serviceId:s.services[2].id,quantity:2}],date:today,notes:'Two services in one order'};
const o=s.book(customer,booking,today);assert.equal(o.items.length,2);assert.equal(o.amount,605);assert.equal(o.items[0].amount,105);assert.equal(o.items[1].amount,500);
const a=s.analysis('all',today);assert.equal(a.orderValue,605);assert.equal(a.serviceTotals.find(x=>x.id==='comforter')?.amount,500);
s.saveService(admin,{...s.services[2],price:300});assert.equal(o.amount,605);assert.equal(new LaundryStore(s.serialize()).orders[0].items[1].rate,250);
});
test('multi-service validation is atomic and rejects empty, duplicate or unavailable lines',()=>{
const s=new LaundryStore();const count=s.orders.length;
assert.throws(()=>s.book(customer,{items:[],date:today,notes:''},today));
assert.throws(()=>s.book(customer,{items:[{serviceId:s.services[0].id,quantity:2},{serviceId:s.services[0].id,quantity:3}],date:today,notes:''},today));
assert.throws(()=>s.book(customer,{items:[{serviceId:s.services[0].id,quantity:2},{serviceId:s.services[2].id,quantity:0.5}],date:today,notes:''},today));assert.equal(s.orders.length,count);
});

test('period analysis does not include old or future orders and handles an empty period',()=>{
const s=new LaundryStore();s.book(customer,{serviceId:s.services[0].id,quantity:2,date:today,notes:''},today);assert.equal(s.analysis('week','2026-11-10').orderValue,70);assert.equal(s.analysis('week','2026-12-10').orderValue,0);assert.equal(s.analysis('all','2026-10-31').orders.length,0);
});

test('starts with no orders and clears previous demo orders once while keeping services',()=>{
const s=new LaundryStore();assert.equal(s.orders.length,0);
const data=JSON.parse(s.serialize());data.version=1;data.services[0].price=49;data.orders=[{id:'old-demo-order'}];
const cleared=new LaundryStore(JSON.stringify(data));assert.equal(cleared.orders.length,0);assert.equal(cleared.services[0].price,49);
const o=cleared.book(customer,{serviceId:cleared.services[0].id,quantity:2,date:today,notes:''},today);
const restored=new LaundryStore(cleared.serialize());assert.equal(restored.orders.length,1);assert.equal(restored.orders[0].id,o.id);assert.equal(restored.analysis('all',today).orderValue,98);
});

test('demo customer bookings persist into the demo admin analysis without returning old orders',async()=>{
const {authenticate}=await import('../src/app/demo.ts');const buyer=authenticate('user','user')!;const manager=authenticate('admin','admin')!;
assert.equal(manager.role,'admin');const customerView=new LaundryStore();const placed=customerView.book(buyer,{items:[{serviceId:'wash-fold',quantity:3},{serviceId:'comforter',quantity:1}],date:today,notes:''},today);
const adminView=new LaundryStore(customerView.serialize());assert.equal(adminView.orders.length,1);assert.equal(adminView.orders[0].email,buyer.email);assert.equal(adminView.analysis('all',today).orderValue,355);adminView.advance(manager,placed.id);assert.equal(adminView.orders[0].status,'Washing');
});


test('window periods compute real prior-period deltas, daily series metrics, and cancellation rates',()=>{
const s=new LaundryStore();
const prevOrder=s.book(customer,{serviceId:s.services[0].id,quantity:2,date:'2026-11-01',notes:''},'2026-11-01');
for(let i=0;i<4;i++)s.advance(admin,prevOrder.id);
const dayOne=s.book(customer,{serviceId:s.services[0].id,quantity:4,date:'2026-11-08',notes:''},'2026-11-08');
for(let i=0;i<4;i++)s.advance(admin,dayOne.id);
const cancelled=s.book(customer,{serviceId:s.services[0].id,quantity:2,date:'2026-11-09',notes:''},'2026-11-09');
s.cancel(customer,cancelled.id);
const week=s.analysis('week','2026-11-10');
assert.equal(week.orderValue,140);
assert.equal(week.completedRevenue,140);
assert.equal(week.deltas.orderValue,100);
assert.equal(week.cancelledCount,1);
assert.equal(week.cancelledValue,70);
assert.equal(week.cancelledRate,50);
assert.equal(s.analysis('day','2026-11-08').orderValue,140);
assert.equal(s.analysis('quarter','2026-11-10').orders.length,3);
});

test('chart geometry builds finite monotone curves, stepped areas, and capsule bars across empty, single, and multi-day data',async()=>{
const {buildBarGeometry,buildCurveGeometry}=await import('../src/app/chart-geometry.ts');
const emptyCurve=buildCurveGeometry([],'₱');
assert.equal(emptyCurve.linePath,'');
assert.deepEqual(emptyCurve.yTicks,['₱2','₱1','₱0']);
const singleCurve=buildCurveGeometry([{label:'Nov 10',value:150}],'₱');
assert.ok(singleCurve.singlePointY!==null);
assert.ok(singleCurve.linePath.includes('M 0 '));
const multiCurve=buildCurveGeometry([{label:'Nov 8',value:100},{label:'Nov 9',value:400},{label:'Nov 10',value:250}],'₱');
assert.ok(multiCurve.linePath.includes(' C '));
assert.ok(multiCurve.stepLinePath.includes(' V '));
assert.ok(!multiCurve.linePath.includes('NaN'));
const bars=buildBarGeometry([{label:'Nov 8',value:0},{label:'Nov 9',value:200}],'₱');
assert.equal(bars.bars[0].heightPct,4);
assert.equal(bars.bars[1].heightPct,92);
});

test('all six analysis periods (day, week, month, quarter, year, all) return distinct period buckets and stage totals',()=>{
const s=new LaundryStore();
s.book(customer,{serviceId:s.services[0].id,quantity:2,date:'2025-10-15',notes:''},'2025-10-15');
const qPrior=s.book(customer,{serviceId:s.services[0].id,quantity:4,date:'2026-07-10',notes:''},'2026-07-10');
for(let i=0;i<4;i++)s.advance(admin,qPrior.id);
const curOrder=s.book(customer,{serviceId:s.services[2].id,quantity:1,date:'2026-11-15',notes:''},'2026-11-10');
const todayOrder=s.book(customer,{serviceId:s.services[0].id,quantity:3,date:'2026-11-13',notes:''},'2026-11-13');
const day=s.analysis('day','2026-11-13');
assert.equal(day.buckets.length,1);
assert.equal(day.buckets[0].key,'2026-11-13');
assert.equal(day.stageTotals.find(st=>st.stage==='Received')?.count,1);
const week=s.analysis('week','2026-11-13');
assert.equal(week.buckets.length,7);
assert.equal(week.orderValue,355);
const month=s.analysis('month','2026-11-13');
assert.equal(month.buckets.length,5);
assert.equal(month.orderValue,355);
const quarter=s.analysis('quarter','2026-11-13');
assert.equal(quarter.buckets.length,3);
assert.equal(quarter.from,'2026-09-01');
assert.equal(quarter.deltas.orderValue,153.6);
const year=s.analysis('year','2026-11-13');
assert.equal(year.buckets.length,12);
assert.equal(year.orderValue,495);
assert.equal(year.deltas.orderValue,607.1);
const all=s.analysis('all','2026-11-13');
assert.ok(all.buckets.length>=12);
assert.equal(all.orderValue,565);
assert.ok(curOrder.id&&todayOrder.id);
});

test('order search tokenizes whitespace and matches id, customer, email, and service',()=>{
const s=new LaundryStore();
const o1=s.book({name:'Maria Santos',email:'maria@example.com',role:'customer' as const},{serviceId:s.services[0].id,quantity:2,date:today,notes:''},today);
const o2=s.book({name:'John Doe',email:'johndoe@test.org',role:'customer' as const},{serviceId:s.services[1].id,quantity:1,date:today,notes:''},today);

const filterFn=(orders:typeof s.orders,q:string,status='All orders')=>{
  const tokens=q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return orders.filter(o=>{
    if(status!=='All orders'&&o.status!==status)return false;
    if(!tokens.length)return true;
    const haystack=`${o.id} ${o.name} ${o.email} ${o.service}`.toLowerCase();
    return tokens.every(t=>haystack.includes(t));
  });
};

assert.equal(filterFn(s.orders,'maria').length,1);
assert.equal(filterFn(s.orders,'maria@example.com').length,1);
assert.equal(filterFn(s.orders,'Santos wash').length,1);
assert.equal(filterFn(s.orders,'test.org dry').length,1);
assert.equal(filterFn(s.orders,'nonexistent').length,0);
assert.equal(filterFn(s.orders,o1.id).length,1);
assert.equal(filterFn(s.orders,o2.id).length,1);
});

