export const RAW_GOODS = ['ferrite', 'cuivre'] as const;
export const REFINED_GOODS = ['acier','lingot','engrenage','cable','circuit','module','science'] as const;
export type RawGood = (typeof RAW_GOODS)[number];
export type RefinedGood = (typeof REFINED_GOODS)[number];
export type Good = RawGood | RefinedGood;
export type Payment = Good | 'credits';

export const GOODS = {
  ferrite: { name: 'Minerai de fer', color: '#b7c4ce', value: 1 },
  cuivre:  { name: 'Minerai de cuivre', color: '#ea9c6d', value: 4 },
  titane:  { name: 'Titane', color: '#b7a2ef', value: 15 },
  prisme:  { name: 'Prisme', color: '#8de1db', value: 150 },
  acier:   { name: 'Plaque de fer', color: '#c8d5dc', value: 7 },
  lingot:  { name: 'Plaque de cuivre', color: '#fab089', value: 18 },
  engrenage:{name:'Engrenage',color:'#a9bbc9',value:12},
  cable:{name:'Câble de cuivre',color:'#f2b376',value:5},
  circuit:{name:'Circuit électronique',color:'#8dc599',value:28},
  science:{name:'Dossier de recherche',color:'#b8d8d9',value:50},
  module:  { name: 'Moteur électrique', color: '#c4b3fa', value: 95 },
} as const;
export const ALL_GOODS: Good[] = [...RAW_GOODS, ...REFINED_GOODS];
export const RECIPES: Record<RefinedGood, {
  name: string; inputs: Partial<Record<Good, number>>; output: number; seconds: number; machine:'furnace'|'press'|'wiremill'|'assembler'|'lab';
}> = {
  acier:{name:'Fonte du fer',inputs:{ferrite:2},output:1,seconds:8,machine:'furnace'},
  lingot:{name:'Fonte du cuivre',inputs:{cuivre:2},output:1,seconds:8,machine:'furnace'},
  engrenage:{name:'Usinage des engrenages',inputs:{acier:2},output:1,seconds:6,machine:'press'},
  cable:{name:'Tréfilage du cuivre',inputs:{lingot:1},output:3,seconds:5,machine:'wiremill'},
  circuit:{name:'Assemblage électronique',inputs:{acier:1,cable:3},output:1,seconds:12,machine:'assembler'},
  module:{name:'Assemblage des moteurs',inputs:{engrenage:2,cable:3,acier:2},output:1,seconds:20,machine:'assembler'},
  science:{name:'Analyse industrielle',inputs:{engrenage:1,circuit:1},output:1,seconds:15,machine:'lab'},
};

export type WorkshopJob = { recipe: RefinedGood; batches: number; delivered: number; start: number };
export type PlayerEconomy = {
  refined: Record<RefinedGood, number>;
  job: WorkshopJob | null;
  lastDelivery: { recipe: RefinedGood; quantity: number; at: number } | null;
};
export type EconomyPlayer = {
  id: string; name: string; coins: number; inventory: Record<RawGood, number>; economy?: PlayerEconomy;
};
export type TradeOffer = {
  id: string; owner: string; ownerName: string;
  give: Good; quantity: number; want: Payment; price: number; created: number; recipient: string | null;
};
export type EconomyWorld = { players: EconomyPlayer[]; offers?: TradeOffer[] };

export type EconomyAction =
  | { type: 'workshopStart'; recipe: RefinedGood; batches: number }
  | { type: 'offerPost'; give: Good; quantity: number; want: Payment; price: number; recipient?: string }
  | { type: 'offerCancel' | 'offerTake'; id: string }
  | { type: 'goodsSell'; good: Good; quantity: number };
export const emptyRefined=():Record<RefinedGood,number>=>Object.fromEntries(REFINED_GOODS.map(g=>[g,0])) as Record<RefinedGood,number>;
const newEconomy = (): PlayerEconomy => ({
  refined: emptyRefined(), job: null, lastDelivery: null,
});
export function ensureEconomy(p:EconomyPlayer){
  const e=p.economy??=newEconomy();
  for(const g of REFINED_GOODS)e.refined[g]??=0;
  return e;
}
const state=ensureEconomy;
const isGood = (value: unknown): value is Good => typeof value === 'string' && ALL_GOODS.includes(value as Good);
const isRefined = (good: Good): good is RefinedGood => Object.hasOwn(RECIPES, good);
const quantityValid = (n: unknown, max = 1_000_000): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n) && n > 0 && n <= max;
export function balance(p: EconomyPlayer, good: Payment) {
  if (good === 'credits') return p.coins;
  return isRefined(good) ? p.economy?.refined[good] ?? 0 : p.inventory[good];
}
function change(p: EconomyPlayer, good: Payment, quantity: number) {
  if (good === 'credits') p.coins += quantity;
  else if (isRefined(good)) state(p).refined[good] += quantity;
  else p.inventory[good] += quantity;
}
const itemName = (g: Payment) => g === 'credits' ? 'crédits' : GOODS[g].name;
function requireStock(p: EconomyPlayer, good: Payment, quantity: number) {
  if (balance(p, good) < quantity) throw Error('Quantité insuffisante : ' + itemName(good) + '.');
}

// Stock goes into the workshop at order time. A completed batch credits exactly once,
// whether the next request comes after one minute or after a day without visitors.
export function settleWorkshops(w: EconomyWorld, now: number) {
  for (const p of w.players) {
    const job = p.economy?.job;
    if (!job) continue;
    const recipe = RECIPES[job.recipe];
    const complete = Math.min(job.batches, Math.floor((now - job.start) / (recipe.seconds * 1000)));
    if (complete <= job.delivered) continue;
    change(p, job.recipe, recipe.output * (complete - job.delivered));
    job.delivered = complete;
    if (complete === job.batches) {
      const personal = state(p);
      personal.lastDelivery = {
        recipe: job.recipe, quantity: recipe.output * job.batches,
        at: job.start + job.batches * recipe.seconds * 1000,
      };
      personal.job = null;
    }
  }
}

export function actEconomy(w: EconomyWorld, p: EconomyPlayer, a: Record<string, unknown>, now: number) {
  if (a.type === 'workshopStart') {
    if (!isGood(a.recipe) || !isRefined(a.recipe) || !quantityValid(a.batches, 99)) {
      throw Error('Choisissez une recette et un nombre de lots entre 1 et 99.');
    }
    const personal = state(p);
    if (personal.job) throw Error('L’atelier termine déjà une commande.');
    const recipe = RECIPES[a.recipe];
    const requirements = Object.entries(recipe.inputs) as [Good, number][];
    for (const [good, n] of requirements) requireStock(p, good, n * a.batches);
    for (const [good, n] of requirements) change(p, good, -n * a.batches);
    personal.job = { recipe: a.recipe, batches: a.batches, delivered: 0, start: now };
    return { message: 'Production lancée · ' + recipe.name + '.' };
  }
  if (a.type === 'goodsSell') {
    if (!isGood(a.good) || !quantityValid(a.quantity)) throw Error('Lot de vente invalide.');
    requireStock(p, a.good, a.quantity);
    const proceeds = GOODS[a.good].value * a.quantity;
    change(p, a.good, -a.quantity);
    change(p, 'credits', proceeds);
    return { message: 'Lot vendu au comptoir pour ' + proceeds + ' crédits.' };
  }
  if (a.type === 'offerPost') {
    if (!isGood(a.give) || (a.want !== 'credits' && !isGood(a.want)) || a.give === a.want ||
        !quantityValid(a.quantity) || !quantityValid(a.price)) throw Error('Offre invalide.');
    const recipient = a.recipient || null;
    if (recipient !== null && (typeof recipient !== 'string' || recipient === p.id ||
        !w.players.some(other => other.id === recipient))) throw Error('Destinataire inconnu.');
    const offers = w.offers ??= [];
    if (offers.filter(offer => offer.owner === p.id).length >= 8) throw Error('Vous avez déjà huit offres ouvertes.');
    requireStock(p, a.give, a.quantity);
    const offer: TradeOffer = {
      id: crypto.randomUUID(), owner: p.id, ownerName: p.name, recipient,
      give: a.give, quantity: a.quantity, want: a.want, price: a.price, created: now,
    };
    change(p, offer.give, -offer.quantity);
    offers.unshift(offer);
    return { message: 'Offre déposée. Le lot est réservé jusqu’à la vente ou au retrait.' };
  }
  if (a.type === 'offerCancel' || a.type === 'offerTake') {
    const offers = w.offers ?? [];
    const index = offers.findIndex(offer => offer.id === a.id);
    if (index === -1) throw Error('Cette offre n’est plus disponible.');
    const offer = offers[index];
    if (a.type === 'offerCancel') {
      if (offer.owner !== p.id) throw Error('Seul le vendeur peut retirer cette offre.');
      change(p, offer.give, offer.quantity);
      offers.splice(index, 1);
      return { message: 'Offre retirée. Le lot a rejoint votre stock.' };
    }
    if (offer.owner === p.id || (offer.recipient && offer.recipient !== p.id)) {
      throw Error('Cette offre ne vous est pas destinée.');
    }
    const seller = w.players.find(other => other.id === offer.owner);
    if (!seller) throw Error('Vendeur indisponible.');
    requireStock(p, offer.want, offer.price);
    change(p, offer.want, -offer.price);
    change(seller, offer.want, offer.price);
    change(p, offer.give, offer.quantity);
    offers.splice(index, 1);
    return { message: offer.want === 'credits' ? 'Achat effectué. Lot livré.' : 'Troc effectué. Lot livré.' };
  }
  return null;
}

export function economyView(w: EconomyWorld, p?: EconomyPlayer | null) {
  const offers = (w.offers ?? []).filter(o => !o.recipient || o.owner === p?.id || o.recipient === p?.id);
  const stock = Object.fromEntries(ALL_GOODS.map(good => [good, p ? balance(p, good) : 0])) as Record<Good, number>;
  return {
    offers, partners: w.players.filter(other => other.id !== p?.id).map(({ id, name }) => ({ id, name })),
    personal: p ? {
      id: p.id, stock, coins: p.coins, job: p.economy?.job ?? null,
      lastDelivery: p.economy?.lastDelivery ?? null,
    } : null,
  };
}
export type EconomyView = ReturnType<typeof economyView>;
