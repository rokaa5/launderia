import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MenuDirective, SceneDirective, SelectionDirective, SuccessDirective } from './site-motion';
import type { AnimationCallbackEvent } from '@angular/core';
import type {PaymentMethod} from './laundry';
import {afterNextRender,Component,ElementRef,HostListener,inject,Injector,viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonApp,IonButton,IonDatetime,IonPopover} from '@ionic/angular/standalone';
import {DemoAccounts,type DemoUser} from './demo';
import {LaundryStore,localDate,stages,type Service,type LaundryOrder} from './laundry';
import {buildBarGeometry,buildCurveGeometry,CurveGeometry,NormalizedBar,SeriesPoint} from './chart-geometry';
@Component({selector:'app-root',standalone:true,imports:[MenuDirective,SceneDirective,SelectionDirective,SuccessDirective,CommonModule,FormsModule,IonApp,IonButton,IonDatetime,IonPopover],templateUrl:'./app.component.html'})
export class AppComponent {
private injector=inject(Injector);private pendingSection:string|null=null;
calendarOpen = false;
menuOpen=false;
successMessage='';
private successTimer?:ReturnType<typeof setTimeout>;
paymentMethod:PaymentMethod='Cash';
successOrder:LaundryOrder|null=null;
page='home';user:DemoUser|null=null;email='';password='';name='';confirm='';error='';showPassword=false;accounts=new DemoAccounts();
store=new LaundryStore();storageWarning='';notice='';today=localDate();stages=stages;
adminTab='overview';customerTab='orders';period='all';
readonly periodOptions=[{id:'day',label:'Day'},{id:'week',label:'Week'},{id:'month',label:'Month'},{id:'quarter',label:'Quarter'},{id:'year',label:'Year'},{id:'all',label:'All'}];
adminOrdersPage = 1;
readonly adminOrdersPerPage = 8;
statusDropdownOpen = false;
readonly filterOptions: string[] = ['All orders', ...stages, 'Cancelled'];
private _filter = 'All orders';
get filter(): string { return this._filter; }
set filter(value: string) {
  if (this._filter !== value) {
    this._filter = value;
    this.adminOrdersPage = 1;
  }
}
toggleStatusDropdown() {
  this.statusDropdownOpen = !this.statusDropdownOpen;
}
selectFilter(opt: string) {
  this.filter = opt;
  this.statusDropdownOpen = false;
}
private _query = '';
get query(): string { return this._query; }
set query(value: string) {
  if (this._query !== value) {
    this._query = value;
    this.adminOrdersPage = 1;
  }
}
customerFilter = 'Active';
serviceEditor=false;draft:Omit<Service,'id'>&{id?:string}=this.emptyService();serviceError='';
pendingBooking=false;bookingItems=[{serviceId:'wash-fold',quantity:1}];dropoff=localDate();notes='';bookingReview=false;bookingError='';
selectedOrder:LaundryOrder|null=null;cancelId='';profileName='';profileError='';profileSaved=false;
lastFocusedElement: HTMLElement | null = null;
constructor(){
  this.user=this.restoreSession();
  this.profileName=this.user?.name ?? '';
  try{
    this.store=new LaundryStore(localStorage.getItem('launderia-demo-v1'));
    localStorage.setItem('launderia-demo-v1',this.store.serialize());
  }catch{
    this.storageWarning='Browser storage is unavailable. Changes will last for this visit only.';
  }
  if (typeof window !== 'undefined') {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener?.('change', () => this.syncSmoother());
  }
  this.syncRoute();
}
get services(){return this.store.services.filter(s=>s.active);}
get allServices(){return this.store.services;}
get orders(){return this.store.orders;}
get analysis(){return this.store.analysis(this.period);}
get periodRangeLabel():string {
  const a=this.analysis;
  if(this.period==='all')return a.daily.length?`${this.shortDate(a.from,a.from.slice(0,4)!==a.to.slice(0,4))} – ${this.shortDate(a.to,a.from.slice(0,4)!==a.to.slice(0,4))}`:'All dates';
  if(this.period==='day')return `${this.shortDate(a.to)} · Today`;
  const crossYear=a.from.slice(0,4)!==a.to.slice(0,4);
  return `${this.shortDate(a.from,crossYear)} – ${this.shortDate(a.to,crossYear)}`;
}
get revenueCurve(): CurveGeometry {
  const series: SeriesPoint[] = this.analysis.buckets.map(b => ({
    label: b.label,
    value: b.amount,
    title: `${b.label}: ₱${b.amount.toLocaleString()}`
  }));
  return buildCurveGeometry(series, '₱');
}
get volumeBars(): { bars: NormalizedBar[]; max: number; yTicks: string[] } {
  const series: SeriesPoint[] = this.analysis.buckets.map(b => ({
    label: b.label,
    value: b.count,
    title: `${b.label}: ${b.count} orders`
  }));
  return buildBarGeometry(series, '', '');
}
get activeQueueCount() {
  return this.analysis.active;
}
get stageCounts() {
  return this.analysis.stageTotals;
}
private shortDate(iso:string,withYear=false):string {
  const parts=iso.split('-').map(Number);
  if(parts.length!==3||parts.some(Number.isNaN))return iso;
  return new Date(parts[0],parts[1]-1,parts[2]).toLocaleDateString('en-US',withYear?{month:'short',day:'numeric',year:'2-digit'}:{month:'short',day:'numeric'});
}
userInitials(name?:string|null):string {
  const clean=(name||'Admin').trim().split(/\s+/).filter(Boolean);
  return clean.slice(0,2).map(p=>p[0]).join('').toUpperCase()||'AD';
}
selectionFor(id:string){return this.bookingItems.find(i=>i.serviceId===id);}
toggleBookingService(id:string){const index=this.bookingItems.findIndex(i=>i.serviceId===id);if(index<0)this.bookingItems.push({serviceId:id,quantity:1});else this.bookingItems.splice(index,1);this.bookingReview=false;this.bookingError='';}
get selectedLines(){return this.bookingItems.map(i=>({...i,service:this.services.find(s=>s.id===i.serviceId)})).filter(i=>!!i.service);}
get selectedService(){return this.selectedLines[0]?.service;}
orderSummary(o:LaundryOrder){return o.items.length>1?o.items.length+' services':o.quantity+' '+o.unit.replace('/ ','');}
get estimate(){return Math.round(this.selectedLines.reduce((sum,i)=>sum+Math.round((i.service?.price||0)*Number(i.quantity)*100)/100,0)*100)/100;}
get myOrders(){return this.orders.filter(o=>o.email===this.user?.email);}
get readyForCustomer(){return this.myOrders.filter(o=>o.status==='Ready for pickup').length;}
get activeOrders(){return this.myOrders.filter(o=>!['Completed','Cancelled'].includes(o.status));}
get customerOrders(){return this.myOrders.filter(o=>this.customerFilter==='All'||(this.customerFilter==='Active'?!['Completed','Cancelled'].includes(o.status):['Completed','Cancelled'].includes(o.status)));}
private readonly ordersPerPage=5;
private requestedOrderPage=1;
get orderPageCount(){return Math.max(1,Math.ceil(this.customerOrders.length/this.ordersPerPage));}
get orderPage(){return Math.min(this.requestedOrderPage,this.orderPageCount);}
get visibleCustomerOrders(){
  const start=(this.orderPage-1)*this.ordersPerPage;
  return this.customerOrders.slice(start,start+this.ordersPerPage);
}
setCustomerFilter(filter:string){
  this.customerFilter=filter;
  this.requestedOrderPage=1;
}
moveOrderPage(direction:number){
  this.requestedOrderPage=Math.max(1,Math.min(this.orderPage+direction,this.orderPageCount));
  this.scrollTo('customer-orders');
}
get awaitingProcessing(){return this.orders.filter(order=>order.status==='Received').length;}
get readyForPickup(){return this.orders.filter(order=>order.status==='Ready for pickup').length;}
get filteredOrders(){
  const q=this.query.trim().toLowerCase();
  const tokens=q?q.split(/\s+/).filter(Boolean):[];
  return this.orders.filter(o=>{
    if(this.filter!=='All orders'&&o.status!==this.filter)return false;
    if(!tokens.length)return true;
    const haystack=`${o.id} ${o.name} ${o.email} ${o.service}`.toLowerCase();
    return tokens.every(t=>haystack.includes(t));
  });
}
get adminOrderPageCount(): number {
  return Math.max(1, Math.ceil(this.filteredOrders.length / this.adminOrdersPerPage));
}
get paginatedAdminOrders(): LaundryOrder[] {
  const page = Math.max(1, Math.min(this.adminOrdersPage, this.adminOrderPageCount));
  const start = (page - 1) * this.adminOrdersPerPage;
  return this.filteredOrders.slice(start, start + this.adminOrdersPerPage);
}
get adminOrdersStart(): number {
  if (this.filteredOrders.length === 0) return 0;
  const page = Math.max(1, Math.min(this.adminOrdersPage, this.adminOrderPageCount));
  return (page - 1) * this.adminOrdersPerPage + 1;
}
get adminOrdersEnd(): number {
  const page = Math.max(1, Math.min(this.adminOrdersPage, this.adminOrderPageCount));
  return Math.min(page * this.adminOrdersPerPage, this.filteredOrders.length);
}
moveAdminOrderPage(delta: number): void {
  this.adminOrdersPage = Math.max(1, Math.min(this.adminOrdersPage + delta, this.adminOrderPageCount));
}
get filteredServices(){
  const q=this.query.trim().toLowerCase();
  const tokens=q?q.split(/\s+/).filter(Boolean):[];
  return this.allServices.filter(s=>{
    if(!tokens.length)return true;
    const haystack=`${s.name} ${s.desc}`.toLowerCase();
    return tokens.every(t=>haystack.includes(t));
  });
}
get adminMode(){return this.user?.role==='admin';}
@HostListener('window:storage',['$event'])syncStoredData(event:StorageEvent){if(event.key!=='launderia-demo-v1'||event.newValue===null)return;this.store=new LaundryStore(event.newValue);if(this.selectedOrder)this.selectedOrder=this.orders.find(o=>o.id===this.selectedOrder?.id)||null;}
@HostListener('window:hashchange')syncRoute(){
  this.menuOpen=false;
  this.showPassword=false;
  this.dismissOrderConfirmation();
  this.selectedOrder=null;
  this.serviceEditor=false;
  this.cancelId='';
  this.password='';
  this.confirm='';
  const route=location.hash.slice(1)||'home';
  this.page=['home','services','login','signup','customer','admin'].includes(route)?route:'home';
  if (this.adminMode) {
    this.page = 'admin';
  } else if (this.user?.role === 'customer' && ['home', 'login', 'signup', 'admin'].includes(this.page)) {
    this.page = 'customer';
  } else if (!this.user && ['customer', 'admin'].includes(this.page)) {
    this.page = 'login';
  }
  if (this.page !== route) history.replaceState(history.state, '', '#' + this.page);
  this.error='';
  const section=this.pendingSection;
  this.pendingSection=null;
  afterNextRender(() => {
    this.syncSmoother();
    if(section)this.scrollTo(section,!this.sweeping);
    else if(this.smoother)this.smoother.scrollTop(0);
    else window.scrollTo({top:0,behavior:'instant'});
    ScrollTrigger.refresh();
  },{injector:this.injector});
}
@HostListener('document:keydown',['$event'])trapDialog(event:KeyboardEvent){
  if(event.key!=='Tab'||this.cancelId||(!this.serviceEditor&&!this.selectedOrder&&!this.successOrder))return;
  const dialog=document.querySelector<HTMLElement>('.modal-backdrop:not([inert]) .dialog');
  if(!dialog)return;
  const items=Array.from(dialog.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])'))
    .filter(el=>!el.hasAttribute('disabled')&&el.offsetParent!==null);
  if(!items.length){event.preventDefault();return;}
  const first=items[0],last=items[items.length-1];
  if(!dialog.contains(document.activeElement)){event.preventDefault();first.focus();}
  else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}
@HostListener('document:click',['$event'])closeDropdown(event:MouseEvent){if(this.statusDropdownOpen){const target=event.target as HTMLElement|null;if(!target?.closest('.custom-dropdown')){this.statusDropdownOpen=false;}}}
@HostListener('document:keydown.escape')closeOverlay(){
  this.statusDropdownOpen=false;
  this.menuOpen=false;
  if(this.cancelId)return;
  const trigger=this.lastFocusedElement;
  this.dismissOrderConfirmation();
  this.serviceEditor=false;
  this.selectedOrder=null;
  this.cancelId='';
  if(trigger){trigger.focus();this.lastFocusedElement=null;}
}
private sweep = viewChild<ElementRef<HTMLElement>>('sweep');
private smoother?: ScrollSmoother;
private sweeping = false;
private pressedButton?: HTMLElement;
private dialogMotion = new WeakMap<Element, gsap.core.Timeline>();

private prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

private syncSmoother(){
  if(this.adminMode||this.prefersReducedMotion()){
    this.smoother?.kill();
    this.smoother=undefined;
  } else if(!this.smoother && document.getElementById('smooth-content')){
    this.smoother=ScrollSmoother.create({
      wrapper:'#smooth-wrapper',content:'#smooth-content',smooth:.9,smoothTouch:.2,
    });
  }
}

nav(page:string){
  this.error='';
  this.notice='';
  const sweep=this.sweep()?.nativeElement;
  const betweenPublicPages=(this.page==='home'&&page==='services')||(this.page==='services'&&page==='home');
  if(this.sweeping&&betweenPublicPages)return;
  if(!this.user&&sweep&&betweenPublicPages&&!this.prefersReducedMotion()){
    this.sweeping=true;
    const direction=page==='services'?1:-1;
    const hash=location.hash;
    gsap.fromTo(sweep,{xPercent:direction*115,autoAlpha:1},{
      xPercent:0,duration:.43,ease:'power3.inOut',onComplete:()=>{
        if(location.hash===hash){
          history.pushState(history.state,'','#'+page);
          this.syncRoute();
        }
        afterNextRender(()=>gsap.to(sweep,{
          xPercent:-direction*115,duration:.62,ease:'power4.inOut',onComplete:()=>{
            gsap.set(sweep,{clearProps:'transform,opacity,visibility'});
            this.sweeping=false;
          },
        }),{injector:this.injector});
      },
    });
    return;
  }
  location.hash=page;
  if(this.page===page){
    if(this.smoother)this.smoother.scrollTo(0,true);
    else window.scrollTo({top:0,behavior:'instant'});
  }
}

enterDialog({target,animationComplete}:AnimationCallbackEvent){
  const panel=target.querySelector<HTMLElement>('.dialog');
  if(!panel){animationComplete();return;}
  if(this.prefersReducedMotion()){
    gsap.set(target,{opacity:1});
    gsap.set(panel,{opacity:1,xPercent:0,yPercent:0,y:0,scale:1});
    animationComplete();
    return;
  }
  const sheet=target.classList.contains('order-sheet-backdrop');
  const offset=sheet ? (matchMedia('(max-width:650px)').matches?{yPercent:100}:{xPercent:100}) : {y:18,scale:.97};
  const motion=gsap.timeline({paused:true,onComplete:()=>animationComplete()})
    .fromTo(target,{opacity:0},{opacity:1,duration:.28,ease:'power2.out',easeReverse:true},0)
    .fromTo(panel,offset,{xPercent:0,yPercent:0,y:0,scale:1,duration:.46,ease:'expo.out',easeReverse:'power3.in'},0);
  if(sheet){
    motion.fromTo(panel.querySelectorAll('.dialog-heading, .order-status, .cancelled-note'),{y:16,opacity:0},
      {y:0,opacity:1,duration:.28,ease:'power3.out',easeReverse:true},.24)
      .fromTo(panel.querySelectorAll('.order-timeline li'),{x:-12,opacity:0},
        {x:0,opacity:1,duration:.24,stagger:.055,ease:'power2.out',easeReverse:true},.38)
      .fromTo(panel.querySelectorAll('.order-dialog-details > *'),{y:14,opacity:0},
        {y:0,opacity:1,duration:.26,stagger:.055,ease:'power2.out',easeReverse:true},.52);
  }
  this.dialogMotion.set(target,motion);
  motion.play();
}

leaveDialog({target,animationComplete}:AnimationCallbackEvent){
  if(this.prefersReducedMotion()){
    target.setAttribute('inert','');
    animationComplete();
    return;
  }
  const motion=this.dialogMotion.get(target);
  if(!motion||motion.progress()===0){motion?.kill();animationComplete();return;}
  target.setAttribute('inert','');
  motion.eventCallback('onComplete',null);
  motion.eventCallback('onReverseComplete',()=>animationComplete()).timeScale(1.6).reverse();
}

pressButton(event:PointerEvent){
  if(this.prefersReducedMotion()||event.button!==0||!(event.target instanceof Element))return;
  const button=event.target.closest<HTMLElement>('button, ion-button');
  if(!button||button.matches('[disabled]'))return;
  this.releaseButton();
  this.pressedButton=button;
  gsap.to(button,{scale:.97,duration:.12,ease:'power2.out',overwrite:'auto'});
}

@HostListener('window:pointerup')
@HostListener('window:pointercancel')
releaseButton(){
  const button=this.pressedButton;
  if(!button)return;
  this.pressedButton=undefined;
  gsap.to(button,{scale:1,duration:.2,ease:'power2.out',overwrite:'auto',clearProps:'transform'});
}

openDashboard(){
  if (this.adminMode) {
    this.setAdminTab('overview');
    this.nav('admin');
  } else {
    this.setCustomerTab('orders');
    this.nav('customer');
  }
}
goSection(id:string){if(this.page!=='services'){this.pendingSection=id;this.nav('services');}else this.scrollTo(id);}
scrollTo(id:string,smooth=true){
  const section = document.getElementById(id);
  section?.querySelector<HTMLElement>('[tabindex="-1"]')?.focus({preventScroll:true});
  if(section&&this.smoother)this.smoother.scrollTo(section,smooth,'top 92px');
  else section?.scrollIntoView({behavior:'instant'});
}
// Browser-local session for the demo. Real accounts require server-side authentication.
private restoreSession(): DemoUser | null {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('launderia-demo-session') ?? 'null');
    if (!saved || typeof saved !== 'object' || !('name' in saved) || !('email' in saved) ||
        typeof saved.name !== 'string' || typeof saved.email !== 'string' || !saved.name || !saved.email) {
      return null;
    }
    return { name: saved.name, email: saved.email, role: saved.email === 'admin@launderia.demo' ? 'admin' : 'customer' };
  } catch {
    return null;
  }
}
private saveSession() {
  try {
    if (this.user) {
      const { name, email } = this.user;
      localStorage.setItem('launderia-demo-session', JSON.stringify({ name, email }));
    } else {
      localStorage.removeItem('launderia-demo-session');
    }
  } catch {
    this.storageWarning = 'Browser storage is unavailable. Changes will last for this visit only.';
  }
}
login(){this.error='';const result=this.accounts.login(this.email,this.password);if(!result){this.error='Login or password is incorrect.';return;}if(!this.pendingBooking)this.resetBooking();this.user=result;this.saveSession();this.profileName=result.name;this.password='';this.adminTab='overview';this.customerTab=this.pendingBooking&&result.role==='customer'?'book':'orders';this.pendingBooking=false;this.nav(result.role==='admin'?'admin':'customer');}
signup(){this.error=this.accounts.register(this.name,this.email,this.password,this.confirm);if(this.error)return;if(!this.pendingBooking)this.resetBooking();this.user={name:this.name.trim(),email:this.email.trim().toLowerCase(),role:'customer'};this.saveSession();this.profileName=this.user.name;this.password='';this.confirm='';this.customerTab=this.pendingBooking?'book':'orders';this.pendingBooking=false;this.nav('customer');this.showSuccess('Account created');}
resetBooking(){this.paymentMethod='Cash';this.bookingItems=this.services.length?[{serviceId:this.services[0].id,quantity:1}]:[];this.dropoff=localDate();this.notes='';this.bookingReview=false;this.bookingError='';}
logout(){this.statusDropdownOpen=false;this.successOrder=null;this.resetBooking();this.profileName='';this.setCustomerFilter('Active');this.user=null;this.saveSession();this.email='';this.password='';this.selectedOrder=null;this.serviceEditor=false;this.query='';this.filter='All orders';this.adminOrdersPage=1;this.pendingBooking=false;this.menuOpen=false;this.nav('home');this.showSuccess('Signed out');}
persist(){try{localStorage.setItem('launderia-demo-v1',this.store.serialize());}catch{this.storageWarning='Changes are available for this visit, but could not be saved to this browser.';}}
setAdminTab(tab:string){this.statusDropdownOpen=false;this.adminTab=tab;this.query='';this.notice='';this.adminOrdersPage=1;}
quickFilterOrders(status='All orders'){this.statusDropdownOpen=false;this.filter=status;this.adminOrdersPage=1;this.setAdminTab('orders');}
setCustomerTab(tab:string){this.customerTab=tab;this.notice='';this.bookingError='';this.profileError='';this.profileSaved=false;}
startBooking(id?:string, guestPage: 'login' | 'signup' = 'signup'){this.paymentMethod='Cash';this.bookingItems=(id||this.services[0]?.id)?[{serviceId:id||this.services[0].id,quantity:1}]:[];this.notes='';this.dropoff=this.today;this.bookingReview=false;this.bookingError='';this.customerTab='book';if(!this.user){this.pendingBooking=true;this.nav(guestPage);return;}this.nav('customer');}
stepQuantity(selection: { quantity: number }, service: Service, direction: number) {
  const scale = service.unit === '/ kg' ? 10 : 1;
  const next = Math.round((Number(selection.quantity) || 0) * scale) + direction;
  selection.quantity = Math.min(1000, Math.max(1, next) / scale);
}

chooseDropoff(value: string | string[] | null | undefined, popover: IonPopover) {
  if (typeof value !== 'string') return;
  this.dropoff = value.slice(0, 10);
  void popover.dismiss();
}
reorder(order: LaundryOrder) {
  this.startBooking();
  this.bookingItems = order.items
    .filter(item => this.services.some(service => service.id === item.serviceId))
    .map(({ serviceId, quantity }) => ({ serviceId, quantity }));
  if (this.bookingItems.length < order.items.length) this.bookingError = 'Some past services are no longer available.';
}
reviewBooking(){this.bookingError='';try{const check=new LaundryStore(this.store.serialize());check.book(this.user!,{items:this.bookingItems.map(i=>({...i,quantity:Number(i.quantity)})),date:this.dropoff,notes:this.notes,paymentMethod:this.paymentMethod});this.bookingReview=true;}catch(e){this.bookingError=(e as Error).message;}}
placeOrder(){if(!this.user||this.successOrder||!this.bookingReview)return;try{const o=this.store.book(this.user,{items:this.bookingItems.map(i=>({...i,quantity:Number(i.quantity)})),date:this.dropoff,notes:this.notes,paymentMethod:this.paymentMethod});this.persist();this.successOrder=o;setTimeout(()=>document.getElementById('success-view-order')?.focus(),0);}catch(e){this.bookingError=(e as Error).message;this.bookingReview=false;}}
private showSuccess(message:string){
  clearTimeout(this.successTimer);
  this.successMessage=message;
  this.successTimer=setTimeout(()=>this.successMessage='',4500);
}
openOrder(order:LaundryOrder,trigger?:EventTarget|null){
  this.lastFocusedElement=(trigger instanceof HTMLElement?trigger:null)||(document.activeElement instanceof HTMLElement?document.activeElement:null);
  this.selectedOrder=order;
  setTimeout(()=>{
    const closeBtn=document.querySelector<HTMLElement>('.order-dialog .close-dialog');
    closeBtn?.focus();
  },0);
}
closeOrder(){
  this.selectedOrder=null;
  this.cancelId='';
  if(this.lastFocusedElement){
    this.lastFocusedElement.focus();
    this.lastFocusedElement=null;
  }
}
closeServiceEditor(){
  this.serviceEditor=false;
  if(this.lastFocusedElement){
    this.lastFocusedElement.focus();
    this.lastFocusedElement=null;
  }
}
dismissOrderConfirmation(){
  if(!this.successOrder)return;
  this.successOrder=null;
  this.resetBooking();
  if(this.lastFocusedElement){
    this.lastFocusedElement.focus();
    this.lastFocusedElement=null;
  }
}
backToMyLaundry(){
  const order=this.successOrder;
  if(!order)return;
  this.dismissOrderConfirmation();
  this.setCustomerTab('orders');
  this.setCustomerFilter('Active');
  this.notice=`Order ${order.id} placed.`;
}
viewSuccessfulOrder(){this.selectedOrder=this.successOrder;this.dismissOrderConfirmation();setTimeout(()=>document.querySelector<HTMLButtonElement>('.order-dialog .close-dialog')?.focus(),0);}
cancelOrder(){if(!this.user)return;try{this.store.cancel(this.user,this.cancelId);this.persist();this.notice='';this.showSuccess('Order cancelled');this.cancelId='';}catch(e){this.notice=(e as Error).message;}}
advanceOrder(o:LaundryOrder){if(!this.user)return;try{this.store.advance(this.user,o.id);this.persist();this.notice=`${o.id} updated to ${o.status}.`;}catch(e){this.notice=(e as Error).message;}}
nextStage(o:LaundryOrder){return stages[stages.indexOf(o.status)+1]||'';}
emptyService(){return {name:'',desc:'',price:35,unit:'/ kg',color:'yellow',type:'shirt',active:true};}
editService(service?:Service,trigger?:EventTarget|null){if(!this.adminMode)return;this.lastFocusedElement=(trigger instanceof HTMLElement?trigger:null)||(document.activeElement instanceof HTMLElement?document.activeElement:null);this.draft=service?{...service}:this.emptyService();this.serviceError='';this.serviceEditor=true;setTimeout(()=>document.getElementById('service-name')?.focus(),0);}
saveService(){if(!this.user)return;try{const created=!this.draft.id;const s=this.store.saveService(this.user,this.draft);this.persist();this.closeServiceEditor();this.notice=`${s.name} ${created?'added':'updated'}. Customer menu is up to date.`;}catch(e){this.serviceError=(e as Error).message;}}
toggleService(s:Service){if(!this.user)return;try{this.store.saveService(this.user,{...s,active:!s.active});this.persist();this.notice=`${s.name} ${s.active?'paused':'made available'}. Existing orders are unchanged.`;}catch(e){this.notice=(e as Error).message;}}
saveProfile(){this.profileSaved=false;const name=this.profileName.trim();if(name.length<2||name.length>70){this.profileError='Use a name between 2 and 70 characters.';return;}if(this.user){this.user={...this.user,name};this.saveSession();this.accounts.updateName(this.user.email,name);this.profileError='';this.profileSaved=true;}}
statusCount(status:string){return this.analysis.orders.filter(o=>o.status===status).length;}
}


