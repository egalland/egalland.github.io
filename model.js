export const MODEL_VERSION = '1.1.0';

export const DEFAULTS = {
  horizon: 40, referenceYear: 2026, startAge: 30, stopAge: 65, stopAtAge: true,
  initialCapital: 1200, initialMachines: 1, initialSetup: 150, initialInventory: 100,
  machinePrice: 450, installationCost: 150, machineLife: 36, machineHours: 200,
  machineAvailability: 90, maxMachines: 20, homeMachines: 3, maintenanceRate: 4,
  expandAt: 80, reserveCash: 500, reinvestRate: 100,
  population: 30000, addressableRate: 5, maxMarketShare: 25, marketGrowth: 0.3,
  initialCustomers: 10, repeatOrders: 2.5, annualRetention: 80, organicNew: 2,
  cac: 15, cacRealGrowth: 1, marketingBase: 100, marketingMax: 300,
  ownerHours: 50, adminHours: 10, ownerHourValue: 15,
  allowHiring: false, maxEmployees: 5, employeeHours: 152, employeeEfficiency: 80,
  employerMonthlyCost: 2800, wageGrowth: 2.5,
  filamentPrice: 25, printerPower: 150, electricityPrice: 0.25,
  failureRate: 8, returnsRate: 2, sellingFees: 10, overhead: 65, extraMachineOverhead: 15,
  rentBase: 450, rentPerMachine: 25, inventoryMonths: 0.6, paymentDelay: 3,
  inflation: 2, realPricePressure: 0.25, productivityGrowth: 1, maxProductivity: 2,
  taxMode: 'turnover', turnoverProvision: 25, profitProvision: 25, distributionProvision: 0,
  vatMode: 'auto', vatRate: 20, vatThreshold: 85000, vatHardThreshold: 93500,
  vatEligibleCosts: 75, discountRate: 6, resaleRate: 20,
  loanAmount: 0, loanRate: 6, loanMonths: 36,
  shockYear: 0, shockDuration: 12, shockDemandLoss: 30,
  products: [
    {id:'catalogue', name:'Catalogue utile', mix:60, price:30, grams:100, printHours:4, workMinutes:20, packaging:1.2, pieces:1},
    {id:'mesure', name:'Pièce sur mesure', mix:30, price:55, grams:120, printHours:6, workMinutes:60, packaging:1.8, pieces:1},
    {id:'serie', name:'Petite série B2B', mix:10, price:120, grams:300, printHours:10, workMinutes:45, packaging:3, pieces:5},
  ],
};

export const PARAM_GROUPS = [
  {id:'cadre', title:'Horizon, capital et disponibilité', fields:[
    ['horizon','Horizon','ans',1,60,1], ['referenceYear','Année de référence','',2026,2100,1],
    ['startAge','Âge au démarrage','ans',18,90,1], ['stopAge','Âge d’arrêt choisi','ans',20,100,1],
    ['initialCapital','Apport initial','€',0,1000000,100], ['initialMachines','Machines au départ','',0,100,1],
    ['initialSetup','Installation et outils initiaux','€',0,100000,10], ['initialInventory','Stock initial','€',0,100000,10],
    ['ownerHours','Temps personnel disponible','h/mois',0,250,1], ['adminHours','Gestion et prospection','h/mois',0,200,1],
    ['ownerHourValue','Valeur de ton temps','€/h',0,200,1], ['reserveCash','Trésorerie de sécurité','€',0,500000,100],
    ['reinvestRate','Part des flux positifs conservée','%',0,100,5],
  ]},
  {id:'marche', title:'Marché accessible et acquisition', fields:[
    ['population','Population de la zone','personnes',0,10000000,1000], ['addressableRate','Part susceptible d’acheter','%',0,100,0.5],
    ['maxMarketShare','Part de clientèle atteignable','%',0,100,1], ['marketGrowth','Évolution annuelle de la zone','%/an',-5,5,0.1],
    ['initialCustomers','Clients actifs au départ','',0,100000,1], ['repeatOrders','Réachats annuels par client actif','/an',0,24,0.1],
    ['annualRetention','Clients encore actifs un an après','%',0,100,1], ['organicNew','Nouveaux clients organiques','/mois',0,1000,0.5],
    ['cac','Coût d’acquisition initial','€/client',1,1000,1], ['cacRealGrowth','Hausse du CAC hors inflation','%/an',-5,15,0.5],
    ['marketingBase','Budget marketing de départ','€/mois',0,100000,10], ['marketingMax','Budget marketing maximal','€/mois',0,100000,10],
  ]},
  {id:'machines', title:'Parc, capacité et renouvellement', fields:[
    ['machinePrice','Prix d’une machine','€ TTC',100,100000,50], ['installationCost','Installation par machine ajoutée','€',0,10000,10],
    ['machineLife','Remplacement planifié après','mois',12,120,6], ['machineHours','Temps machine prévu','h/mois',1,744,10],
    ['machineAvailability','Disponibilité technique','%',10,100,1], ['maxMachines','Capacité maximale des locaux','machines',1,200,1],
    ['homeMachines','Machines possibles sans atelier loué','',1,30,1], ['maintenanceRate','Maintenance annuelle du prix machine','%',0,30,0.5],
    ['expandAt','Utilisation déclenchant un achat','%',30,100,5], ['failureRate','Impressions à refaire','%',0,50,1],
    ['productivityGrowth','Gain de productivité annuel','%',0,5,0.1], ['maxProductivity','Plafond de productivité','×',1,4,0.1],
  ]},
  {id:'couts', title:'Matières, vente et structure', fields:[
    ['filamentPrice','Filament','€/kg',5,200,1], ['printerPower','Puissance moyenne en impression','W',20,1500,10],
    ['electricityPrice','Électricité','€/kWh',0.05,2,0.01], ['returnsRate','Retours / remboursements','% du CA',0,25,0.5],
    ['sellingFees','Vente et paiement : taux moyen','% du CA TTC',0,30,0.5], ['overhead','Assurance, outils et gestion','€/mois',0,10000,5],
    ['extraMachineOverhead','Frais par machine au-delà de la première','€/mois',0,1000,5],
    ['rentBase','Atelier : loyer et charges de base','€/mois',0,100000,50], ['rentPerMachine','Atelier : supplément par machine','€/mois',0,1000,5],
    ['inventoryMonths','Stock de sécurité','mois de matière',0,6,0.1], ['paymentDelay','Délai moyen de règlement client','jours',0,90,1],
  ]},
  {id:'equipe', title:'Salariés et coût du travail', fields:[
    ['maxEmployees','Effectif salarié maximal','ETP',0,100,1], ['employerMonthlyCost','Coût complet employeur par ETP','€/mois',1500,15000,100],
    ['employeeHours','Heures payées par ETP','h/mois',80,200,1], ['employeeEfficiency','Part du temps utile à la production','%',30,100,5],
    ['wageGrowth','Évolution annuelle du coût employeur','%/an',0,8,0.1],
  ]},
  {id:'finances', title:'Inflation, provisions et financement', fields:[
    ['inflation','Inflation générale','%/an',-1,8,0.1], ['realPricePressure','Pression concurrentielle sur le prix réel','%/an',0,5,0.1],
    ['turnoverProvision','Cotisations et impôt : provision sur CA HT','%',0,60,0.5], ['profitProvision','Provision sur résultat positif','%',0,60,0.5],
    ['distributionProvision','Provision sur les retraits courants','%',0,60,0.5],
    ['vatRate','Taux de TVA modélisé','%',0,30,0.5], ['vatThreshold','Seuil annuel de base : convention TVA','€ HT',0,1000000,1000],
    ['vatHardThreshold','Seuil majoré : convention TVA','€ HT',0,1000000,1000], ['vatEligibleCosts','Part des achats d’exploitation récupérable','%',0,100,5],
    ['discountRate','Taux d’actualisation','%/an',0,20,0.5], ['resaleRate','Valeur de revente du matériel','% du coût',0,80,5],
    ['loanAmount','Emprunt initial optionnel','€',0,1000000,1000], ['loanRate','Taux annuel de l’emprunt','%',0,20,0.1],
    ['loanMonths','Durée du prêt','mois',12,240,12],
  ]},
  {id:'stress', title:'Choc de demande optionnel', fields:[
    ['shockYear','Année du choc · 0 = aucun','année du plan',0,60,1], ['shockDuration','Durée du choc','mois',1,60,1],
    ['shockDemandLoss','Baisse temporaire des commandes','%',0,100,5],
  ]},
];

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=(n,fallback=0)=>Number.isFinite(Number(n))?Number(n):fallback;
const copy=value=>JSON.parse(JSON.stringify(value));
export function normalizeParams(input={}) {
  input=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const p=copy(DEFAULTS);for(const key of Object.keys(DEFAULTS))if(Object.prototype.hasOwnProperty.call(input,key))p[key]=input[key];
  p.allowHiring=p.allowHiring===true;p.stopAtAge=p.stopAtAge!==false;
  for(const group of PARAM_GROUPS)for(const [key,, ,min,max] of group.fields)p[key]=clamp(finite(p[key],DEFAULTS[key]),min,max);
  for(const key of ['horizon','referenceYear','initialMachines','machineLife','maxMachines','homeMachines','maxEmployees','loanMonths'])p[key]=Math.round(p[key]);
  p.initialMachines=Math.min(p.initialMachines,p.maxMachines);
  p.marketingMax=Math.max(p.marketingBase,p.marketingMax);
  p.vatHardThreshold=Math.max(p.vatThreshold,p.vatHardThreshold);
  p.stopAge=Math.max(p.startAge,p.stopAge);
  p.taxMode=['turnover','profit'].includes(p.taxMode)?p.taxMode:'turnover';
  p.vatMode=['auto','always','never'].includes(p.vatMode)?p.vatMode:'auto';
  p.products=(Array.isArray(input.products)&&input.products.length?input.products:DEFAULTS.products).slice(0,8).map((item,index)=>{const product=item&&typeof item==='object'?item:{};return ({
    id:String(product.id??'produit-'+index).slice(0,50), name:String(product.name??'Produit '+(index+1)).slice(0,70),
    mix:clamp(finite(product.mix),0,100),price:clamp(finite(product.price),0,10000),grams:clamp(finite(product.grams),0,100000),
    printHours:clamp(finite(product.printHours),.1,500),workMinutes:clamp(finite(product.workMinutes),1,10000),
    packaging:clamp(finite(product.packaging),0,1000),pieces:clamp(finite(product.pieces,1),1,1000),
  });});
  if(!p.products.some(d=>d.mix>0))p.products[0].mix=100;
  return p;
}

export function productEconomics(input) {
  const p=normalizeParams(input),sum=p.products.reduce((a,d)=>a+d.mix,0);
  const weighted={price:0,grams:0,printHours:0,workHours:0,packaging:0,pieces:0};
  for(const d of p.products){const w=d.mix/sum;weighted.price+=d.price*w;weighted.grams+=d.grams*w;weighted.printHours+=d.printHours*w;weighted.workHours+=d.workMinutes/60*w;weighted.packaging+=d.packaging*w;weighted.pieces+=d.pieces*w;}
  const yieldFactor=1/(1-p.failureRate/100);
  const materials=weighted.grams/1000*p.filamentPrice*yieldFactor;
  const energy=weighted.printHours*p.printerPower/1000*p.electricityPrice*yieldFactor;
  const direct=materials+energy+weighted.packaging;
  return {...weighted,yieldFactor,materials,energy,direct,contribution:weighted.price*(1-p.sellingFees/100-p.returnsRate/100)-direct};
}

const sum=(rows,key)=>rows.reduce((a,r)=>a+(r[key]||0),0);
const LAST_FIELDS=['cash','debt','machines','employees','customers','marketClients','marketShare','assets','workingCapital','createdValue','createdValueReal','cashReal','receivedCumulative','receivedRealCumulative','active','vat'];
const TOTAL_FIELDS=['revenue','revenueReal','grossSales','costs','costsReal','directCosts','materials','energy','packaging','fees','returns','marketing','fixedCosts','rent','maintenance','payroll','taxes','depreciation','interest','netProfit','netProfitReal','ebitda','economicProfit','ownerHours','orders','lostOrders','demand','newCustomers','capexGrowth','capexReplacement','ownerDraw','ownerDrawReal','liquidation','liquidationReal','principal','deltaWorkingCapital','cashFlow'];
const REAL_FLOWS=['grossSales','directCosts','materials','energy','packaging','fees','returns','marketing','fixedCosts','rent','maintenance','payroll','taxes','depreciation','interest','ebitda','economicProfit','capexGrowth','capexReplacement','principal','deltaWorkingCapital','cashFlow','closureShortfall','closureAssetFlow','distributionTax','ownerGrossDraw'];

export function simulate(input,variant='central') {
  const p=normalizeParams(input),unit=productEconomics(p);
  const factor=variant==='prudent'?{demand:.72,cac:1.25,retention:.95,price:.95}:variant==='soutenu'?{demand:1.25,cac:.85,retention:1.025,price:1.025}:{demand:1,cac:1,retention:1,price:1};
  let machines=Array.from({length:p.initialMachines},()=>({age:0,life:p.machineLife,cost:p.machinePrice}));
  let cash=p.initialCapital+p.loanAmount-p.initialMachines*p.machinePrice-p.initialSetup-p.initialInventory;
  let inventory=p.initialInventory,receivables=0,invoices=[],debt=p.loanAmount,employees=0,customers=Math.min(p.initialCustomers,p.population*p.addressableRate/100*p.maxMarketShare/100);
  let lastPositiveCash=0,utilStreak=0,hireStreak=0,lastGrowth=-12,lastHire=-12,received=0,receivedReal=0,closed=false,closeReason=null;
  let vat=p.vatMode==='always',yearTurnover=0,previousYearTurnover=0,bankruptcySettled=false,unfundedReal=0;
  const events=[],months=[];
  const loanMonthlyRate=p.loanRate/100/12;
  const loanPayment=p.loanAmount>0?(loanMonthlyRate>0?p.loanAmount*loanMonthlyRate/(1-(1+loanMonthlyRate)**(-p.loanMonths)):p.loanAmount/p.loanMonths):0;
  const initialCash=cash;
  const addEvent=(month,type,label,amount=0)=>events.push({month,year:Math.ceil(month/12),date:p.referenceYear+Math.ceil(month/12),type,label,amount});
  if(cash<0){closed=true;closeReason='capital';addEvent(1,'alerte','Capital insuffisant pour l’installation initiale',-cash);}
  for(let m=1;m<=p.horizon*12;m++){
    const elapsed=(m-1)/12,deflator=(1+p.inflation/100)**elapsed,priceFactor=deflator*(1-p.realPricePressure/100)**elapsed;
    const annualDate=p.referenceYear+Math.ceil(m/12),age=p.startAge+elapsed;
    const openingCash=cash;
    let liquidation=0,capexReplacement=0,capexGrowth=0,closureShortfall=0;
    if(closed&&closeReason==='tresorerie'&&!bankruptcySettled){
      const assetsToRecover=cash+inventory*.5+receivables+machines.reduce((a,d)=>a+d.cost*p.resaleRate/100,0);
      liquidation=Math.max(0,assetsToRecover-debt);debt=Math.max(0,debt-Math.max(0,assetsToRecover));cash=Math.min(0,assetsToRecover);
      closureShortfall=debt-Math.min(0,cash);inventory=0;receivables=0;invoices=[];machines=[];employees=0;bankruptcySettled=true;
      received+=liquidation;receivedReal+=liquidation/deflator;unfundedReal+=closureShortfall/deflator;
      if(closureShortfall>0)addEvent(m,'dette','Solde non financé exigible à la fermeture',-closureShortfall);
    }
    if(p.stopAtAge&&!closed&&age>=p.stopAge){
      const liquidationAssets=cash+inventory*.5+receivables+machines.reduce((a,d)=>a+d.cost*p.resaleRate/100,0);
      liquidation=Math.max(0,liquidationAssets-debt);
      debt=Math.max(0,debt-Math.max(0,liquidationAssets));cash=Math.min(0,liquidationAssets);inventory=0;receivables=0;machines=[];employees=0;closed=true;closeReason='arret';received+=liquidation;receivedReal+=liquidation/deflator;
      invoices=[];closureShortfall=debt-Math.min(0,cash);unfundedReal+=closureShortfall/deflator;
      addEvent(m,'arret','Arrêt choisi et récupération des fonds disponibles',liquidation);
      if(closureShortfall>0)addEvent(m,'dette','Solde non financé exigible à l’arrêt',-closureShortfall);
    }
    if(closed){
      const row={month:m,yearIndex:Math.ceil(m/12),year:annualDate,date:annualDate+'-'+String((m-1)%12+1).padStart(2,'0')+'-01',age,deflator,active:false,vat,closeReason,cash,debt,machines:0,employees:0,customers:0,marketClients:p.population*(1+p.marketGrowth/100)**elapsed*p.addressableRate/100*p.maxMarketShare/100,marketShare:0,assets:0,inventory:0,receivables:0,workingCapital:0,receivedCumulative:received,receivedRealCumulative:receivedReal,createdValue:cash-debt+received-p.initialCapital,createdValueReal:receivedReal-unfundedReal-p.initialCapital+(closeReason==='capital'?cash/deflator:0),cashReal:cash/deflator,liquidation,liquidationReal:liquidation/deflator,closureShortfall,closureAssetFlow:cash-openingCash+liquidation,cashFlow:cash-openingCash};
      for(const key of TOTAL_FIELDS)if(!(key in row))row[key]=0;
      for(const key of REAL_FLOWS){if(!(key in row))row[key]=0;row[key+'Real']=row[key]/deflator;}
      months.push(row);continue;
    }
    if((m-1)%12===0&&m>1){previousYearTurnover=yearTurnover;yearTurnover=0;if(p.vatMode==='auto'&&previousYearTurnover>p.vatThreshold&&!vat){vat=true;addEvent(m,'tva','TVA activée : seuil annuel de base dépassé');}}
    const population=p.population*(1+p.marketGrowth/100)**elapsed;
    const marketClients=population*p.addressableRate/100*p.maxMarketShare/100;
    const retention=clamp(p.annualRetention/100*factor.retention,0,1)**(1/12);
    customers=Math.min(customers*retention,marketClients);
    const penetration=marketClients>0?customers/marketClients:1;
    const cac=p.cac*deflator*(1+p.cacRealGrowth/100)**elapsed*factor.cac/(1-Math.min(.9,penetration*.65));
    const marketingTarget=p.marketingBase*deflator+Math.min(Math.max(0,(p.marketingMax-p.marketingBase)*deflator),lastPositiveCash*p.reinvestRate/100*.2);
    const marketing=cash<p.reserveCash*deflator*.6?Math.min(marketingTarget,Math.max(0,cash*.15)):marketingTarget;
    const organic=p.organicNew*factor.demand;
    const acquisitionPool=(organic+marketing/Math.max(1,cac))*Math.max(0,1-penetration)**1.2;
    const newCustomers=Math.min(Math.max(0,marketClients-customers),acquisitionPool);
    let demand=(customers*p.repeatOrders/12+newCustomers)*factor.demand;
    if(p.shockYear>0&&m>=(p.shockYear-1)*12+1&&m<(p.shockYear-1)*12+1+p.shockDuration)demand*=1-p.shockDemandLoss/100;
    const productivity=Math.min(p.maxProductivity,(1+p.productivityGrowth/100)**elapsed);
    const printPerOrder=unit.printHours*unit.yieldFactor/productivity;
    const humanPerOrder=unit.workHours*(1+p.failureRate/200)/Math.sqrt(productivity);
    const ownerAvailable=Math.max(0,p.ownerHours-p.adminHours);
    const employeeAvailable=employees*p.employeeHours*p.employeeEfficiency/100;
    let capacityMachine=machines.length*p.machineHours*p.machineAvailability/100/Math.max(.1,printPerOrder);
    let capacityHuman=(ownerAvailable+employeeAvailable)/Math.max(.01,humanPerOrder);
    const orders=Math.max(0,Math.min(demand,capacityMachine,capacityHuman));
    const lostOrders=Math.max(0,demand-orders);
    const retainedNew=demand>0?newCustomers*orders/demand:0;
    customers=Math.min(marketClients,customers+retainedNew);
    let grossSales=orders*unit.price*priceFactor*factor.price;
    if(p.vatMode==='auto'&&!vat&&yearTurnover+grossSales>p.vatHardThreshold){vat=true;addEvent(m,'tva','TVA activée : seuil majoré atteint dans la convention mensuelle');}
    const vatFactor=vat?1+p.vatRate/100:1;
    const costVatFactor=vat?1-p.vatEligibleCosts/100*(p.vatRate/100/(1+p.vatRate/100)):1;
    const revenue=grossSales/vatFactor;
    yearTurnover+=revenue;
    const materials=orders*unit.materials*deflator*costVatFactor;
    const energy=orders*unit.energy*deflator*costVatFactor;
    const packaging=orders*unit.packaging*deflator*costVatFactor;
    const directCosts=materials+energy+packaging;
    const fees=grossSales*p.sellingFees/100*costVatFactor;
    const returns=revenue*p.returnsRate/100;
    const maintenance=machines.length*p.machinePrice*deflator*p.maintenanceRate/100/12*costVatFactor;
    const fixedCosts=(p.overhead+Math.max(0,machines.length-1)*p.extraMachineOverhead)*deflator*costVatFactor;
    const rent=(machines.length>p.homeMachines||employees>0)?(p.rentBase+Math.max(0,machines.length-p.homeMachines)*p.rentPerMachine)*deflator*costVatFactor:0;
    const payroll=employees*p.employerMonthlyCost*(1+p.wageGrowth/100)**elapsed;
    const depreciation=machines.reduce((a,d)=>a+d.cost/d.life,0);
    const interest=debt>0?debt*loanMonthlyRate:0;
    const principal=debt>0&&m<=p.loanMonths?Math.min(debt,Math.max(0,loanPayment-interest)):0;debt=Math.max(0,debt-principal);
    const ebitda=revenue-directCosts-fees-returns-marketing-fixedCosts-rent-maintenance-payroll;
    const taxable=ebitda-depreciation-interest;
    const taxes=p.taxMode==='turnover'?revenue*p.turnoverProvision/100:Math.max(0,taxable)*p.profitProvision/100;
    const netProfit=taxable-taxes;
    const oldWC=inventory+receivables;
    inventory=Math.max(0,(materials+packaging)*p.inventoryMonths);
    invoices.push({month:m,revenue});
    invoices=invoices.filter(invoice=>p.paymentDelay/30-(m-invoice.month)>0);
    receivables=invoices.reduce((a,invoice)=>a+invoice.revenue*clamp(p.paymentDelay/30-(m-invoice.month),0,1),0);
    const deltaWorkingCapital=inventory+receivables-oldWC;
    const operatingCash=netProfit+depreciation-deltaWorkingCapital-principal;
    cash+=operatingCash;
    const previousMachines=machines.length;
    machines=machines.filter(machine=>{
      machine.age+=1;
      if(machine.age<machine.life)return true;
      const cost=(p.machinePrice+p.installationCost)*deflator/(vat?vatFactor:1);
      if(cash-cost>=Math.min(p.reserveCash*deflator,Math.max(0,operatingCash))){cash-=cost;capexReplacement+=cost;machine.age=0;machine.cost=cost;machine.life=p.machineLife;addEvent(m,'remplacement','Remplacement d’une machine en fin de cycle',cost);return true;}
      addEvent(m,'capacite','Machine retirée faute de trésorerie de remplacement');return false;
    });
    const utilization=capacityMachine>0?orders/capacityMachine:0;
    utilStreak=utilization>=p.expandAt/100?utilStreak+1:0;
    const budget=Math.max(0,cash-p.reserveCash*deflator)*p.reinvestRate/100;
    const newMachineCost=(p.machinePrice+p.installationCost)*deflator/(vat?vatFactor:1);
    if(utilStreak>=3&&m-lastGrowth>=3&&machines.length<p.maxMachines&&capacityHuman>orders*1.1&&budget>=newMachineCost){
      cash-=newMachineCost;capexGrowth=newMachineCost;machines.push({age:0,life:p.machineLife,cost:newMachineCost});lastGrowth=m;utilStreak=0;addEvent(m,'investissement','Ajout d’une machine après saturation et financement',newMachineCost);
    }
    const laborDemand=demand*humanPerOrder;
    hireStreak=laborDemand>(ownerAvailable+employeeAvailable)*.9?hireStreak+1:0;
    const monthlyWage=p.employerMonthlyCost*(1+p.wageGrowth/100)**elapsed;
    const prospectiveMachineCapacity=machines.length*p.machineHours*p.machineAvailability/100/Math.max(.1,printPerOrder);
    const unitContribution=orders>0?(revenue-directCosts-fees-returns-(p.taxMode==='turnover'?taxes:0))/orders:unit.contribution*priceFactor;
    const oneMachineCapacity=p.machineHours*p.machineAvailability/100/Math.max(.1,printPerOrder);
    if(p.allowHiring&&employees<p.maxEmployees&&hireStreak>=3&&m-lastHire>=6){
      const etpCapacity=p.employeeHours*p.employeeEfficiency/100/humanPerOrder;
      const baseSales=Math.min(demand,prospectiveMachineCapacity,capacityHuman);
      const rentFor=(count,staff)=>(count>p.homeMachines||staff>0)?(p.rentBase+Math.max(0,count-p.homeMachines)*p.rentPerMachine)*deflator*costVatFactor:0;
      const currentRent=rentFor(machines.length,employees);
      let best=null;
      const maxExtra=Math.min(p.maxMachines-machines.length,Math.max(0,Math.ceil((capacityHuman+etpCapacity-prospectiveMachineCapacity)/oneMachineCapacity)));
      for(let extra=0;extra<=maxExtra;extra++){
        const futureMachineCapacity=prospectiveMachineCapacity+extra*oneMachineCapacity;
        const withoutEmployee=Math.min(demand,futureMachineCapacity,capacityHuman);
        const withEmployee=Math.min(demand,futureMachineCapacity,capacityHuman+etpCapacity);
        const newRent=rentFor(machines.length+extra,employees+1),employeeRent=newRent-rentFor(machines.length+extra,employees);
        const employeeValue=(withEmployee-withoutEmployee)*unitContribution;
        const running=monthlyWage+(newRent-currentRent)+extra*(newMachineCost/p.machineLife+(p.extraMachineOverhead+p.machinePrice*p.maintenanceRate/100/12)*deflator);
        const gain=(withEmployee-baseSales)*unitContribution-running,capital=extra*newMachineCost;
        const funded=capital<=Math.max(0,cash-p.reserveCash*deflator)*p.reinvestRate/100&&cash-capital>p.reserveCash*deflator+(monthlyWage+Math.max(0,newRent-currentRent))*3;
        if(employeeValue>(monthlyWage+Math.max(0,employeeRent))*1.15&&gain>running*.15&&funded&&(!best||gain>best.gain+.01))best={extra,gain,capital};
      }
      if(best){
        for(let i=0;i<best.extra;i++)machines.push({age:0,life:p.machineLife,cost:newMachineCost});
        cash-=best.capital;capexGrowth+=best.capital;employees+=1;lastHire=m;hireStreak=0;
        if(best.extra){lastGrowth=m;utilStreak=0;addEvent(m,'investissement','Ajout coordonné de '+best.extra+' machine(s) avec un ETP',best.capital);}
        addEvent(m,'embauche','Embauche ajoutant des ventes réellement servables et couvrant son coût');
      }
    }
    const freeFlow=Math.max(0,operatingCash-capexReplacement);
    const grossDraw=Math.min(Math.max(0,cash-p.reserveCash*deflator),freeFlow*(1-p.reinvestRate/100));
    const ownerDraw=grossDraw*(1-p.distributionProvision/100);
    cash-=grossDraw;received+=ownerDraw;receivedReal+=ownerDraw/deflator;
    const ownerUsed=Math.min(p.ownerHours,p.adminHours)+Math.min(ownerAvailable,orders*humanPerOrder);
    const economicProfit=netProfit-ownerUsed*p.ownerHourValue*deflator;
    const assets=machines.reduce((a,d)=>a+d.cost*p.resaleRate/100,0);
    const costs=revenue-netProfit;
    const cashFlow=operatingCash-capexGrowth-capexReplacement-grossDraw;
    const row={month:m,yearIndex:Math.ceil(m/12),year:annualDate,date:annualDate+'-'+String((m-1)%12+1).padStart(2,'0')+'-01',age,deflator,active:true,vat,cash,debt,machines:machines.length,employees,customers,marketClients,marketShare:marketClients>0?customers/marketClients:0,assets,inventory,receivables,workingCapital:inventory+receivables,receivedCumulative:received,receivedRealCumulative:receivedReal,
      createdValue:cash+assets+inventory*.5+receivables-debt+received-p.initialCapital,createdValueReal:(cash+assets+inventory*.5+receivables-debt)/deflator+receivedReal-p.initialCapital,cashReal:cash/deflator,
      revenue,revenueReal:revenue/deflator,grossSales,costs,costsReal:costs/deflator,directCosts,materials,energy,packaging,fees,returns,marketing,fixedCosts,rent,maintenance,payroll,taxes,depreciation,interest,netProfit,netProfitReal:netProfit/deflator,ebitda,economicProfit,ownerHours:ownerUsed,orders,lostOrders,demand,newCustomers:retainedNew,capexGrowth,capexReplacement,ownerDraw,ownerDrawReal:ownerDraw/deflator,liquidation,liquidationReal:0,principal,deltaWorkingCapital,cashFlow,
      utilization:previousMachines>0?utilization:0,laborUtilization:ownerAvailable+employeeAvailable>0?orders*humanPerOrder/(ownerAvailable+employeeAvailable):0,capacityMachine,capacityHuman,cac,contributionPerOrder:unitContribution,productivity,loanPayment:interest+principal,closureShortfall,closureAssetFlow:0,ownerGrossDraw:grossDraw,distributionTax:grossDraw-ownerDraw,
    };
    for(const key of REAL_FLOWS)row[key+'Real']=row[key]/deflator;
    row.marketShare=population*p.addressableRate/100>0?customers/(population*p.addressableRate/100):0;
    months.push(row);lastPositiveCash=Math.max(0,operatingCash-capexReplacement);
    if(cash<-.01){closed=true;closeReason='tresorerie';addEvent(m,'alerte','Activité arrêtée : trésorerie négative sans nouveau financement',cash);cash=Math.min(0,cash);}
  }
  const years=[];
  for(let index=1;index<=p.horizon;index++){
    const rows=months.slice((index-1)*12,index*12),last=rows.at(-1),annual={yearIndex:index,year:p.referenceYear+index,date:(p.referenceYear+index)+'-01-01',age:p.startAge+index};
    for(const key of TOTAL_FIELDS)annual[key]=sum(rows,key);
    for(const key of REAL_FLOWS){annual[key]=sum(rows,key);annual[key+'Real']=sum(rows,key+'Real');}
    for(const key of LAST_FIELDS)annual[key]=last[key];
    annual.margin=annual.revenue>0?annual.netProfit/annual.revenue:0;
    annual.utilization=rows.reduce((a,d)=>a+(d.utilization||0),0)/12;
    annual.laborUtilization=rows.reduce((a,d)=>a+(d.laborUtilization||0),0)/12;
    annual.profitPerHour=annual.ownerHours>0?annual.netProfit/annual.ownerHours:null;
    annual.breakEvenOrders=rows.filter(d=>d.active).length?rows.reduce((a,d)=>a+(d.contributionPerOrder>0?(d.marketing+d.fixedCosts+d.rent+d.payroll+d.maintenance+d.depreciation+d.interest)/d.contributionPerOrder:0),0):0;
    annual.capex=annual.capexGrowth+annual.capexReplacement;annual.ownerIncome=annual.ownerDraw;
    annual.capexReal=annual.capexGrowthReal+annual.capexReplacementReal;annual.inventory=last.inventory;annual.receivables=last.receivables;
    annual.deflator=(1+p.inflation/100)**(index-.5);
    years.push(annual);
  }
  const terminal=months.at(-1),liquidatable=terminal.closeReason?0:terminal.cash+terminal.assets+terminal.inventory*.5+terminal.receivables-terminal.debt;
  let npv=-p.initialCapital;
  for(const row of months)npv+=(row.ownerDraw+row.liquidation-(row.closureShortfall||0))/(1+p.discountRate/100)**(row.month/12);
  npv+=liquidatable/(1+p.discountRate/100)**p.horizon;
  let recovered=-p.initialCapital,payback=null;
  if(p.initialCapital>0)for(const row of months){recovered+=row.ownerDraw+row.liquidation-(row.closureShortfall||0);if(recovered>=0){payback=row.month/12;break;}}
  const summary={npv,payback,initialCash,terminalCash:terminal.cash,totalRevenue:sum(months,'revenue'),totalRevenueReal:sum(months,'revenueReal'),totalProfit:sum(months,'netProfit'),totalProfitReal:sum(months,'netProfitReal'),totalOrders:sum(months,'orders'),totalLostOrders:sum(months,'lostOrders'),totalHours:sum(months,'ownerHours'),totalCapex:sum(months,'capexGrowth')+sum(months,'capexReplacement')+p.initialMachines*p.machinePrice+p.initialSetup,totalReceived:received,totalReceivedReal:receivedReal,createdValue:terminal.createdValue,createdValueReal:terminal.createdValueReal,closeReason,operatingYears:months.filter(r=>r.active).length/12,maxMachines:Math.max(...months.map(r=>r.machines)),maxEmployees:Math.max(...months.map(r=>r.employees)),minimumCash:Math.min(initialCash,...months.map(r=>r.cash))};
  return {params:p,variant,unit,months,years,events,summary};
}

export function compareScenarios(params){return {prudent:simulate(params,'prudent'),central:simulate(params,'central'),soutenu:simulate(params,'soutenu')};}

export function sensitivity(params) {
  const baseline=simulate(params).summary.npv;
  const drivers=[['population','Population de la zone'],['maxMarketShare','Clientèle atteignable'],['cac','Coût d’acquisition'],['sellingFees','Frais de vente'],['overhead','Frais fixes'],['ownerHours','Temps disponible'],['filamentPrice','Prix du filament'],['machineLife','Durée de vie des machines']];
  return drivers.map(([key,label])=>{
    const low=simulate({...params,[key]:params[key]*.8}).summary.npv-baseline;
    const high=simulate({...params,[key]:params[key]*1.2}).summary.npv-baseline;
    return {driver:label,baisse20:low,hausse20:high,amplitude:Math.max(Math.abs(low),Math.abs(high))};
  }).sort((a,b)=>b.amplitude-a.amplitude);
}

export function downloadText(filename,content,type='text/plain') {
  const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function toCSV(rows) {
  if(!rows.length)return '';
  const keys=Object.keys(rows[0]);const escape=v=>'"'+String(v??'').replaceAll('"','""')+'"';
  return '\uFEFF'+[keys.map(escape).join(';'),...rows.map(row=>keys.map(key=>escape(typeof row[key]==='number'?row[key].toFixed(2).replace('.',','):row[key])).join(';'))].join('\r\n');
}
