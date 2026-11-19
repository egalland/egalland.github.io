import {range,tripTo,type Place,type Trip} from './frontier-geography';
import type {Deposit} from './frontier';
import type {Miner,World} from './world';

export const OUTPOST_RADIUS=180;
const MAX_OUTPOSTS=5;
type Outpost={id:string;owner:string;name:string;point:Place;depositId:string;foundedAt:number};
type Expedition={id:string;owner:string;depositId:string;trip:Trip};
export type ColonizationState={outposts:Outpost[];expeditions:Expedition[]};
const ownedSites=(w:World,p:Miner)=>w.colonization?.outposts.filter(s=>s.owner===p.id)??[];
export function colonizationView(w:World){
  const guilds=(w.frontier?.guilds??[]).map(g=>({id:g.id,name:g.name,leader:g.leader,founder:g.founder??g.leader,foundedAt:g.foundedAt??w.created,members:[...g.members]}));
  const memberships:Record<string,string>={};
  for(const g of guilds)for(const member of g.members)memberships[member]=g.id;
  return {outposts:w.colonization?.outposts??[],expeditions:w.colonization?.expeditions??[],guilds,memberships};
}
export function outpostCost(count:number){
  return {credits:38+count*42,ferrite:7+count*4,cuivre:2+count*2};
}
function candidate(w:World,p:Miner,node:Deposit,sites:Outpost[],now:number){
  if(!p.expedition||p.expedition.hull<=0||node.guards>0||node.remaining<=0)return null;
  if(w.players.some(q=>q.expedition&&range(q.expedition.home,node.point)<210))return null;
  if(w.colonization?.outposts.some(s=>range(s.point,node.point)<OUTPOST_RADIUS*2))return null;
  if(w.colonization?.expeditions.some(e=>range(e.trip.to,node.point)<OUTPOST_RADIUS*2))return null;
  const origins=[p.expedition.home,...sites.map(s=>s.point)];
  const origin=origins.reduce((a,b)=>range(a,node.point)<=range(b,node.point)?a:b);
  const distance=range(origin,node.point);
  if(distance>1000)return null;
  const trip=tripTo(origin,node.point,now,9);
  if(node.respawn>0&&node.respawn<=trip.due+5000)return null;
  return {node,trip,distance};
}
// A charter exposes availability for an already surveyed deposit, without disclosing
// the identity or position of nearby camps or other expeditions to its applicant.
export function charterAvailable(w:World,p:Miner,node:Deposit,now:number){
  return !!p.expedition?.deposits.includes(node.id)&&!!candidate(w,p,node,ownedSites(w,p),now);
}
export function orderOutpost(w:World,p:Miner,depositId:unknown,now:number){
  const c=p.expedition;
  if(!c||typeof depositId!=='string'||!c.deposits.includes(depositId))throw Error('Reconnaissez d’abord ce filon.');
  const sites=ownedSites(w,p);
  if(sites.length>=MAX_OUTPOSTS)throw Error('Cinq avant-postes sont déjà desservis par cette base.');
  if(w.colonization?.expeditions.some(e=>e.owner===p.id))throw Error('Le convoi de fondation est déjà en route.');
  const node=w.frontier?.deposits[depositId],plan=node&&candidate(w,p,node,sites,now);
  if(!plan)throw Error('Filon épuisé, défendu, occupé ou trop loin du réseau.');
  const price=outpostCost(sites.length);
  if(p.coins<price.credits||p.inventory.ferrite<price.ferrite||p.inventory.cuivre<price.cuivre)throw Error('Le convoi manque de crédits ou de matériaux.');
  p.coins-=price.credits;p.inventory.ferrite-=price.ferrite;p.inventory.cuivre-=price.cuivre;
  const state=w.colonization??={outposts:[],expeditions:[]};
  state.expeditions.push({id:'poste/'+p.id+'/'+depositId,owner:p.id,depositId,trip:plan.trip});
  return 'Convoi de fondation parti · '+price.credits+' crédits, '+price.ferrite+' fer, '+price.cuivre+' cuivre.';
}
export function settleOutposts(w:World,now:number,onFoundation:(p:Miner,site:Outpost)=>void){
  const state=w.colonization;
  if(!state?.expeditions.length)return;
  state.expeditions=state.expeditions.filter(e=>{
    if(e.trip.due>now)return true;
    const p=w.players.find(q=>q.id===e.owner);
    if(!p?.expedition)return false;
    const suffix=ownedSites(w,p).length+1;
    const site={id:e.id,owner:p.id,name:'Relais '+p.name.replace(/^\[IA\]\s*/,'')+' '+suffix,point:e.trip.to,depositId:e.depositId,foundedAt:now};
    state.outposts.push(site);onFoundation(p,site);return false;
  });
}

export const COLONISTS=[
 {name:'Alba',doctrine:'Union des ateliers',social:'founder',guild:'Les Tisserands',ore:'ferrite'},
 {name:'Bram',doctrine:'Commerce de proximité',social:'trade',guild:'',ore:'cuivre'},
 {name:'Cendre',doctrine:'Libre prospection',social:'solo',guild:'',ore:'cuivre'},
 {name:'Dune',doctrine:'Défense mutuelle',social:'guard',guild:'',ore:'ferrite'},
 {name:'Écluse',doctrine:'Comptoirs associés',social:'founder',guild:'La Traverse',ore:'cuivre'},
 {name:'Fanal',doctrine:'Réseau caravanier',social:'trade',guild:'',ore:'ferrite'},
 {name:'Grès',doctrine:'Frontière indépendante',social:'solo',guild:'',ore:'ferrite'},
 {name:'Hermine',doctrine:'Garde des marches',social:'guard',guild:'',ore:'cuivre'},
] as const;
type Doctrine=typeof COLONISTS[number];
type Order={action:Record<string,unknown>;reason:string};
export function guildDecision(w:World,p:Miner,d:Doctrine,now:number):Order|null{
  const c=p.expedition,groups=w.frontier?.guilds;
  if(!c||!groups)return null;
  // The guild directory publishes each colonist's trading contact; discoveries,
  // units and inventories of other members are not recruitment information.
  const homeMarket=c.towns[0];
  const localPartner=(id:string)=>w.players.find(q=>q.id===id&&q.id!==p.id&&q.ai&&q.expedition?.towns[0]===homeMarket);
  const group=groups.find(g=>g.id===c.guild);
  if(group){
    if(group.leader!==p.id&&now-(group.foundedAt??p.joined)>300000){
      if(!group.members.some(id=>localPartner(id)))
        return {action:{type:'guildLeave'},reason:'Le comptoir déclaré ne compte plus de partenaire de cette guilde.'};
      const outsideClient=d.social==='trade'&&w.frontier?.cooperation?.contracts.some(k=>
        k.provider===p.id&&k.status==='done'&&!group.members.includes(k.client));
      if(outsideClient)return {action:{type:'guildLeave'},reason:'Un client extérieur rémunère déjà la flotte ; la colonie choisit le fret indépendant.'};
    }
    if(group.leader!==p.id||group.members.length>=4)return null;
    const neighbor=w.players.find(q=>localPartner(q.id)&&!q.expedition!.guild&&!group.invites.includes(q.id)&&!group.declined?.includes(q.id));
    if(neighbor)return {action:{type:'guildInvite',player:neighbor.id},reason:'Proposer une alliance à une colonie du même bassin commercial.'};
    return null;
  }
  if(d.social==='founder'&&!groups.some(g=>g.name===d.guild))
    return {action:{type:'guildCreate',name:d.guild},reason:'Fédérer les ateliers et les routes de son bassin.'};
  const invitations=groups.filter(g=>g.invites.includes(p.id));
  if(!invitations.length)return null;
  const affinity=(g:typeof groups[number])=>g.members.reduce((score,id)=>{
    const q=localPartner(id);
    if(!q)return score;
    return score+1+(q.faction===p.faction?1:0)+(d.social==='guard'&&q.faction===p.faction?1:0);
  },0);
  const best=invitations.sort((a,b)=>affinity(b)-affinity(a))[0];
  if(d.social==='solo'||!affinity(best))return {action:{type:'guildDecline',id:best.id},reason:d.social==='solo'?'L’éclaireur conserve son autonomie de prospection.':'Aucun partenaire de cette guilde sur une route reconnue.'};
  return {action:{type:'guildAccept',id:best.id},reason:d.social==='guard'?'Mutualiser la défense avec des voisins connus.':'Partager un réseau de comptoirs déjà reconnus.'};
}
export function expansionDecision(w:World,p:Miner,d:Doctrine,now:number):Order|null{
  const c=p.expedition;
  if(!c||!w.frontier||c.hull<=0||w.colonization?.expeditions.some(e=>e.owner===p.id))return null;
  const sites=ownedSites(w,p),price=outpostCost(sites.length);
  if(sites.length>=MAX_OUTPOSTS||now-(sites.at(-1)?.foundedAt??p.joined)<(sites.length?12*60000:90000))return null;
  if(p.coins<240+price.credits||p.inventory.ferrite<40+price.ferrite||p.inventory.cuivre<15+price.cuivre)return null;
  if(sites.length&&(!c.factory?.unlocked.length||p.coins<700+price.credits))return null;
  const plans=c.deposits.flatMap(id=>{
    const n=w.frontier!.deposits[id],plan=n&&candidate(w,p,n,sites,now);
    return plan?[plan]:[];
  });
  const weight=(a:typeof plans[number])=>(d.social==='solo'?-a.distance:a.distance)-(a.node.ore===d.ore?250:0);
  const target=plans.sort((a,b)=>weight(a)-weight(b))[0];
  if(!target)return null;
  return {action:{type:'colony',op:'found',deposit:target.node.id},reason:'Établir un relais sur un filon reconnu de '+(target.node.ore==='ferrite'?'fer':'cuivre')+' à '+Math.round(target.distance)+' unités du réseau.'};
}
