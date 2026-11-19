import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,normalizeParams,simulate} from './model.js';

const near=(a,b,label='')=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} ≠ ${b}`);
const funded={...DEFAULTS,initialCapital:100000,stopAtAge:false};

test('monthly accounting and cash identities, including withdrawals and closure',()=>{
  for(const params of [DEFAULTS,{...DEFAULTS,reinvestRate:0,distributionProvision:30,horizon:40},{...funded,paymentDelay:90,loanAmount:10000,horizon:8}]){
    const r=simulate(params);let opening=r.summary.initialCash;
    for(const m of r.months){
      near(m.cash-opening,m.cashFlow,'bank movement');
      const bridge=m.netProfit+m.depreciation-m.deltaWorkingCapital-m.principal-m.capexGrowth-m.capexReplacement-m.ownerGrossDraw+m.closureAssetFlow-m.liquidation;
      near(bridge,m.cashFlow,'profit to cash');
      if(m.active){
        const costs=['materials','energy','packaging','fees','returns','marketing','fixedCosts','rent','maintenance','payroll','depreciation','interest','taxes'].reduce((s,k)=>s+m[k],0);
        near(m.revenue-costs,m.netProfit,'profit');
        assert.ok(m.orders<=m.capacityMachine+1e-8&&m.orders<=m.capacityHuman+1e-8);
        assert.ok(m.ownerHours<=r.params.ownerHours+1e-8);
        assert.ok(m.customers<=m.marketClients+1e-8);
        assert.ok(m.marketShare<=r.params.maxMarketShare/100+1e-8);
      }
      opening=m.cash;
    }
  }
});

test('annual totals and constant-euro flows reconcile with months',()=>{
  const r=simulate({...funded,horizon:4,reinvestRate:30,inflation:6});
  for(const y of r.years){const months=r.months.slice((y.yearIndex-1)*12,y.yearIndex*12);
    for(const key of ['revenue','netProfit','materials','cashFlow','ownerGrossDraw','distributionTax']){
      near(y[key],months.reduce((s,m)=>s+m[key],0),key);
      near(y[key+'Real'],months.reduce((s,m)=>s+m[key]/m.deflator,0),key+' real');
    }
    near(y.margin,y.netProfit/y.revenue);near(y.cash,months.at(-1).cash);
  }
});

test('90-day payment terms create only receivables already invoiced',()=>{
  const r=simulate({...funded,horizon:1,paymentDelay:90});
  r.months.forEach((m,i)=>near(m.receivables,r.months.slice(Math.max(0,i-2),i+1).reduce((s,v)=>s+v.revenue,0),'invoice cohorts'));
});

test('terminal value includes full receivables and recoverable inventory',()=>{
  const r=simulate({...funded,horizon:2,paymentDelay:90,reinvestRate:100});const m=r.months.at(-1);
  near(r.summary.npv,-r.params.initialCapital+(m.cash+m.assets+m.inventory*.5+m.receivables-m.debt)/(1+r.params.discountRate/100)**2,'NPV');
});

test('unpaid debt is recognized at closure and is not erased by a longer horizon',()=>{
  const p={...DEFAULTS,initialCapital:0,loanAmount:100000,loanRate:20,loanMonths:240,startAge:20,stopAge:21,initialCustomers:0,population:0,marketingBase:0,marketingMax:0,organicNew:0};
  const short=simulate({...p,horizon:2}),long=simulate({...p,horizon:40});
  assert.equal(long.months[12].active,false);assert.ok(long.months[12].closureShortfall>0);
  assert.ok(long.months.at(-1).debt>0);near(short.summary.npv,long.summary.npv);assert.ok(long.summary.npv<0);
  near(short.summary.createdValueReal,long.summary.createdValueReal);assert.equal(long.summary.payback,null);
});

test('long-range base case stops at chosen age, renews machines and remains finite',()=>{
  const r=simulate({...DEFAULTS,horizon:60});
  const duration = DEFAULTS.stopAge - DEFAULTS.startAge;
  assert.equal(r.summary.operatingYears,duration);assert.ok(r.months.slice(duration * 12).every(m=>m.revenue===0));
  assert.ok(r.months.at(-1).marketClients>0);assert.ok(r.events.some(e=>e.type==='remplacement'));
  assert.ok(r.summary.createdValueReal>0&&r.summary.createdValueReal<1000000);
  assert.ok(r.summary.maxMachines<=DEFAULTS.maxMachines);assert.equal(r.summary.maxEmployees,0);
});

test('VAT and zero demand behave without artificial revenue or capital',()=>{
  const a=simulate({...funded,horizon:1,vatMode:'always'}).months[0];
  near(a.revenue,a.grossSales/1.2);
  const b=simulate({...funded,horizon:1,vatMode:'never'}).months[0];
  near(a.materials/b.materials,1-.75*(.2/1.2));
  const z=simulate({...DEFAULTS,population:0,initialCustomers:0,organicNew:0,marketingBase:0,marketingMax:0,horizon:4});
  assert.equal(z.summary.totalRevenue,0);assert.equal(z.summary.maxEmployees,0);assert.ok(z.summary.totalProfit<0);
  assert.equal(z.summary.closeReason,'tresorerie');
});

test('hiring adds useful capacity without purchasing an unnecessary printer',()=>{
  const p={...funded,horizon:1,allowHiring:true,initialMachines:3,initialCustomers:0,organicNew:80,repeatOrders:0,annualRetention:100,population:10000000,addressableRate:100,maxMarketShare:100,marketingBase:0,marketingMax:0,products:[{...DEFAULTS.products[0],mix:100,price:700,printHours:5.2,workMinutes:35}]};
  const r=simulate(p),hire=r.events.find(e=>e.type==='embauche');
  assert.ok(hire,'funded useful hire');const row=r.months[hire.month-1];assert.equal(row.machines,3);
  assert.ok(r.months[hire.month].orders>r.months[hire.month-1].orders);
});

test('invalid imports are normalized into finite bounded assumptions',()=>{
  assert.equal(normalizeParams(null).horizon,40);
  const p=normalizeParams({horizon:Infinity,initialCapital:-1,products:[null],unexpected:'ignored'});
  assert.equal(p.horizon,40);assert.equal(p.initialCapital,0);assert.equal(p.unexpected,undefined);
  assert.ok(Number.isFinite(simulate({...p,horizon:1}).summary.npv));
});
