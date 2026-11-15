export interface DemoUser {name:string; email:string; role:'admin'|'customer'}
export function authenticate(email:string,password:string):DemoUser|null {
const value=email.trim().toLowerCase();
if(value==='admin'&&password==='admin')return {name:'Branch admin',email:'admin@launderia.demo',role:'admin'};
if(value==='user'&&password==='user')return {name:'Alex Santos',email:'customer@launderia.demo',role:'customer'};
return null;
}
export function validateSignup(name:string,email:string,password:string,confirm:string):string {
if(name.trim().length<2)return 'Please enter your full name.';
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email.trim()))return 'Please enter a valid email address.';
if(password.length<8)return 'Use at least 8 characters for your password.';
if(password!==confirm)return 'Your passwords do not match.';
return '';
}

// shortcut: demo credentials live only in memory; replace with server authentication before real use.
export class DemoAccounts {
private names=new Map<string,string>();
private accounts=new Map<string,{user:DemoUser,password:string}>();
register(name:string,email:string,password:string,confirm:string):string {
const normalized=email.trim().toLowerCase();
const error=validateSignup(name,normalized,password,confirm);
if(error)return error;
if(this.accounts.has(normalized))return 'An account with this email already exists. Please log in.';
this.accounts.set(normalized,{user:{name:name.trim(),email:normalized,role:'customer'},password});return '';
}
updateName(email:string,name:string){this.names.set(email.trim().toLowerCase(),name);const account=this.accounts.get(email);if(account)account.user.name=name;}
login(email:string,password:string):DemoUser|null {
const demo=authenticate(email,password);if(demo)return {...demo,name:this.names.get(demo.email)||demo.name};
const account=this.accounts.get(email.trim().toLowerCase());return account?.password===password?account.user:null;
}
}


