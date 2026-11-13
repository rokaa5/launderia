import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authenticate, validateSignup } from '../src/app/demo.ts';
test('demo admin and customer have distinct roles',()=>{assert.equal(authenticate('admin','admin')?.role,'admin');assert.equal(authenticate('user','user')?.role,'customer');assert.equal(authenticate('admin','wrong'),null);});
test('registration validates names, email, password and confirmation',()=>{assert.ok(validateSignup('','bad','abc','x'));assert.match(validateSignup('Ana','ana@example.com','Password1','Password1'), /gmail/);assert.ok(validateSignup('Ana','ana@gmail.com','Password1','wrong'));assert.equal(validateSignup('Ana','ana@gmail.com','Password1','Password1'),'');});


test('multiple signups remain available and duplicate emails cannot replace passwords',async()=>{
const { DemoAccounts }=await import('../src/app/demo.ts'); const accounts=new DemoAccounts();
assert.equal(accounts.register('Alice','alice@gmail.com','Password1','Password1'),'');
assert.equal(accounts.register('Bob','bob@gmail.com','Password2','Password2'),'');
assert.equal(accounts.login('ALICE@gmail.com','Password1')?.name,'Alice');
assert.ok(accounts.register('Other Alice','alice@gmail.com','Replaced1','Replaced1'));
assert.equal(accounts.login('alice@gmail.com','Replaced1'),null);
assert.equal(accounts.login('alice@gmail.com','Password1')?.name,'Alice');
});

test('profile names stay updated when signing back in during the same visit',async()=>{
const {DemoAccounts}=await import('../src/app/demo.ts');const accounts=new DemoAccounts();accounts.updateName('customer@launderia.demo','Alex Demo');assert.equal(accounts.login('user','user')?.name,'Alex Demo');
});
