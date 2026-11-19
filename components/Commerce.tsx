'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowDownUp, ArrowRight, Coins, Flame, Gem, Hammer, Package, Store } from 'lucide-react';
import {
  ALL_GOODS, GOODS, RAW_GOODS, RECIPES, REFINED_GOODS,
  type EconomyAction, type EconomyView, type Good, type Payment, type RefinedGood,
} from '@/lib/economy';
import styles from './Commerce.module.css';

type Props = {
  mode: 'market' | 'workshop';
  economy: EconomyView;
  send: (action: EconomyAction | { type: 'autosell' } | { type: 'upgrade'; kind: 'refinery' }) => unknown;
  refinery?: { owned: boolean; autoSell: boolean; canBuy: boolean };
  busy: boolean;
  now: number;
};
type Personal = NonNullable<EconomyView['personal']>;
const number = new Intl.NumberFormat('fr-FR');
function duration(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  return s >= 60 ? Math.floor(s / 60) + ' min ' + (s % 60 ? s % 60 + ' s' : '') : s + ' s';
}
function Item({ good }: { good: Payment }) {
  return good === 'credits' ? <Coins size={17} className={styles.credits} aria-hidden/> :
    <i aria-hidden className={styles.item} data-shape={RAW_GOODS.includes(good as typeof RAW_GOODS[number]) ? 'rock' : good}
      style={{ '--mineral': GOODS[good].color } as CSSProperties}/>;
}
function Stock({ personal }: { personal: Personal }) {
  return <details className={styles.details}>
    <summary><Package size={16}/> Stock disponible <b>{number.format(personal.coins)} CR</b></summary>
    <div className={styles.stock}>{ALL_GOODS.map(good => <div key={good}>
      <Item good={good}/><span>{GOODS[good].name}</span><strong>{number.format(personal.stock[good])}</strong>
    </div>)}</div>
  </details>;
}
function Workshop({ personal, busy, now, send, refinery }: Omit<Props, 'economy'|'mode'> & { personal: Personal }) {
  const [selected, setSelected] = useState<RefinedGood>('acier');
  const [batches, setBatches] = useState('1');
  const job = personal.job;
  const value = RECIPES[selected];
  const amount = Number(batches);
  const valid = Number.isSafeInteger(amount) && amount >= 1 && amount <= 99;
  const inputs = Object.entries(value.inputs) as [Good, number][];
  const enough = valid && inputs.every(([key, n]) => personal.stock[key] >= amount * n);
  const totalSecs = job ? RECIPES[job.recipe].seconds * job.batches : 0;
  const elapsed = job ? Math.max(0, (now - job.start) / 1000) : 0;
  function start(e: FormEvent) {
    e.preventDefault();
    if (enough && !job && !busy) send({ type: 'workshopStart', recipe: selected, batches: amount });
  }
  return <>
    <div className={styles.workshopArt}>
      <strong><Flame size={16}/>{job ? RECIPES[job.recipe].name : 'Four disponible'}</strong>
      {job && <div className={styles.jobTime}>{job.delivered}/{job.batches} lots · {duration(totalSecs - elapsed)}</div>}
      {job && <progress aria-label="Avancement de la commande" value={Math.min(totalSecs, elapsed)} max={totalSecs}/>}
    </div>
    {!job && personal.lastDelivery &&
      <div className={styles.delivery}><Package size={15}/><span>En stock · {personal.lastDelivery.quantity} × {GOODS[personal.lastDelivery.recipe].name}</span></div>}
    <form className={styles.form} onSubmit={start}>
      <label className={styles.legend} htmlFor="strate-recipe">Transformation</label>
      <select id="strate-recipe" value={selected} onChange={e => setSelected(e.target.value as RefinedGood)}>
        {REFINED_GOODS.map(key => <option key={key} value={key}>{RECIPES[key].name}</option>)}
      </select>
      <div className={styles.recipe}>
        <div>{inputs.map(([good, n]) => <span key={good}>
          <Item good={good}/><small>{GOODS[good].name}</small><b>×{n * (valid ? amount : 1)}</b>
        </span>)}</div>
        <ArrowRight size={16} aria-hidden/>
        <span><Item good={selected}/><small>{GOODS[selected].name}</small><b>×{value.output * (valid ? amount : 1)}</b></span>
      </div>
      <div className={styles.line}><label htmlFor="strate-batches">Lots</label>
        <input id="strate-batches" type="number" min={1} max={99} step={1} required value={batches} onChange={e => setBatches(e.target.value)}/>
        <small>{duration(value.seconds * (valid ? amount : 1))}</small>
      </div>
      {!enough && valid && <small className={styles.dim}>Il manque {inputs.filter(([key, n]) => personal.stock[key] < amount*n)
        .map(([key,n]) => (n*amount - personal.stock[key])+' × '+GOODS[key].name).join(', ')}.</small>}
      <button className={styles.primary} disabled={busy || !!job || !enough}><Hammer size={16}/>{job ? 'Atelier occupé' : 'Lancer la production'}</button>
      <small className={styles.dim}>Les lots sont livrés au stock pendant ton absence.</small>
    </form>
    {refinery && <section className={styles.offer}>
      <header><strong>Raffinerie</strong><small>{refinery.owned ? (refinery.autoSell ? 'En service' : 'En pause') : 'À installer'}</small></header>
      <small className={styles.dim}>À la livraison, la raffinerie vend automatiquement la ferrite, le cuivre et le titane disponibles au dépôt.</small>
      {refinery.owned ? <button className={styles.secondary} type="button" aria-pressed={refinery.autoSell} disabled={busy}
        onClick={() => send({ type: 'autosell' })}>{refinery.autoSell ? 'Suspendre la vente automatique' : 'Activer la vente automatique'}</button> :
        <button className={styles.secondary} type="button" disabled={busy || !refinery.canBuy}
          onClick={() => send({ type: 'upgrade', kind: 'refinery' })}>Installer et activer · 900 CR</button>}
    </section>}
    <Stock personal={personal}/>
  </>;
}
function Market({ economy, personal, busy, send }: Pick<Props,'economy'|'busy'|'send'> & { personal: Personal }) {
  const [tab, setTab] = useState<'all'|'sale'|'barter'|'mine'>('all');
  const [give, setGive] = useState<Good>('cuivre');
  const [want, setWant] = useState<Payment>('credits');
  const [quantity, setQuantity] = useState('5');
  const [price, setPrice] = useState('20');
  const [recipient, setRecipient] = useState('');
  const [quickItem, setQuickItem] = useState<Good>('ferrite');
  const [quickQty, setQuickQty] = useState('10');
  const count = Number(quantity), asked = Number(price), quick = Number(quickQty);
  const valid = (n: number) => Number.isSafeInteger(n) && n > 0 && n <= 1_000_000;
  const validPost = valid(count) && valid(asked) && give !== want && personal.stock[give] >= count;
  const offers = economy.offers.filter(o => tab === 'all' || (tab === 'sale' ? o.want === 'credits' : tab === 'barter' ? o.want !== 'credits' : o.owner === personal.id));
  function post(e: FormEvent) {
    e.preventDefault();
    if (!busy && validPost) send({type:'offerPost', give, quantity:count, want, price:asked, recipient});
  }
  function changeGive(item: Good) {
    setGive(item);
    if (want === item) setWant('credits');
  }
  return <>
    <Stock personal={personal}/>
    <details className={styles.details}>
      <summary><ArrowDownUp size={16}/> Proposer un échange</summary>
      <form className={styles.form} onSubmit={post}>
        <div className={styles.tradeLeg}><label>Je propose
          <select value={give} onChange={e => changeGive(e.target.value as Good)}>{ALL_GOODS.map(g => <option key={g} value={g}>{GOODS[g].name} ({personal.stock[g]})</option>)}</select></label>
          <label>Quantité<input type="number" min={1} max={Math.max(1,personal.stock[give])} required value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
        </div>
        <div className={styles.tradeLeg}><label>Je demande
          <select value={want} onChange={e=>setWant(e.target.value as Payment)}><option value="credits">Crédits</option>
          {ALL_GOODS.filter(g=>g!==give).map(g => <option key={g} value={g}>{GOODS[g].name}</option>)}</select></label>
          <label>Total du lot<input type="number" min={1} max={1_000_000} required value={price} onChange={e=>setPrice(e.target.value)}/></label>
        </div>
        <label>Destinataire<select value={recipient} onChange={e=>setRecipient(e.target.value)}>
          <option value="">Marché public</option>{economy.partners.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select></label>
        <small className={styles.dim}>{personal.stock[give] < count ? 'Stock insuffisant.' : 'Le lot sera réservé jusqu’à acceptation ou retrait.'}</small>
        <button className={styles.primary} disabled={busy||!validPost}><ArrowDownUp size={15}/>{want==='credits'?'Publier la vente':'Proposer le troc'}</button>
      </form>
    </details>
    <div className={styles.tabs} aria-label="Filtrer les offres">
      {([['all','Tout'],['sale','Ventes'],['barter','Trocs'],['mine','Mes offres']] as const).map(([id,label]) =>
        <button key={id} type="button" aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}
    </div>
    <div className={styles.list}>{offers.length===0 ? <p className={styles.empty}><Store size={21}/>Aucune offre {tab==='mine'?'à ton nom':'pour le moment'}.</p> :
      offers.map(offer=>{
        const own = offer.owner===personal.id;
        const enough = (offer.want==='credits'?personal.coins:personal.stock[offer.want]) >= offer.price;
        const partner = economy.partners.find(p=>p.id===offer.recipient);
        return <article className={styles.offer} key={offer.id}>
          <header><strong>{own?'Ton offre':offer.ownerName}</strong><small>{offer.recipient?('Privé · '+(offer.recipient===personal.id?'pour toi':partner?.name||'destinataire')):(offer.want==='credits'?'Vente':'Troc')}</small></header>
          <div className={styles.exchange}><span><Item good={offer.give}/>{number.format(offer.quantity)} × {GOODS[offer.give].name}</span><ArrowRight size={14}/>
            <span><Item good={offer.want}/>{number.format(offer.price)} {offer.want==='credits'?'CR':'× '+GOODS[offer.want].name}</span></div>
          <button className={styles.secondary} disabled={busy||(!own&&!enough)} onClick={()=>send({type:own?'offerCancel':'offerTake',id:offer.id})}>
            {own?'Retirer le lot':!enough?'Solde insuffisant':offer.want==='credits'?'Acheter le lot':'Accepter le troc'}</button>
        </article>;
      })}
    </div>
    <details className={styles.details}><summary><Store size={16}/> Vente directe au comptoir</summary>
      <form className={styles.form} onSubmit={e=>{e.preventDefault();if(!busy&&valid(quick)&&quick<=personal.stock[quickItem])send({type:'goodsSell',good:quickItem,quantity:quick})}}>
        <div className={styles.tradeLeg}><label>Marchandise<select value={quickItem} onChange={e=>setQuickItem(e.target.value as Good)}>
          {ALL_GOODS.map(g=><option key={g} value={g}>{GOODS[g].name} ({personal.stock[g]})</option>)}</select></label>
          <label>Quantité<input type="number" required min={1} max={Math.max(1,personal.stock[quickItem])} value={quickQty} onChange={e=>setQuickQty(e.target.value)}/></label></div>
        <small className={styles.dim}>Cours fixe · {GOODS[quickItem].value} CR / unité</small>
        <button className={styles.secondary} disabled={busy||!valid(quick)||quick>personal.stock[quickItem]}>Vendre pour {number.format(valid(quick)?quick*GOODS[quickItem].value:0)} CR</button>
      </form>
    </details>
  </>;
}

export function Commerce({ mode, economy, send, busy, now, refinery }: Props) {
  const personal = economy.personal;
  return <div className={styles.panel}>{!personal ? <p className={styles.empty}><Gem size={22}/>Rejoins une faction pour accéder à ton stock.</p> : mode==='workshop' ?
    <Workshop personal={personal} now={now} busy={busy} send={send} refinery={refinery}/> :
    <Market personal={personal} economy={economy} busy={busy} send={send}/>}</div>;
}
export default Commerce;
