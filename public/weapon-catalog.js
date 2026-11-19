// Gameplay units are metres and seconds in the toy city.
const defineWeapon=(id,name,hint,settings,tints)=>{
  const [mag,interval,range,damage,reload,effect,frequency]=settings;
  const [accent,thread,cloth,trim]=tints;
  return Object.freeze({id,name,hint,mag,interval,range,damage,reload,effect,frequency,
    palette:Object.freeze({accent,thread,cloth,trim}),
    starter:id==='fist'||id==='pistol',noise:['pistol','smg','shotgun','confetti'].includes(id)});
};
const entries=[
  defineWeapon('fist','Poings','Corps à corps',[Infinity,.42,2.25,12,0,'fist',146],['#f7c08d','#be856c','#523f4c','#ffeac3']),
  defineWeapon('pistol','Pistolet','Un tir précis',[12,.28,62,17,1,'shot',136],['#edc3a9','#b08689','#514454','#fff1db']),
  defineWeapon('smg','Mitraillette','Tir automatique rapide',[28,.14,44,10,1.4,'shot',154],['#76e2cc','#338d84','#24444c','#bff5d6']),
  defineWeapon('shotgun','Fusil à pompe','Trois tirs en éventail',[5,.72,22,16,1.55,'shot',96],['#ffd084','#c68f55','#58444e','#fff0c2']),
  defineWeapon('yarn','Pelote','Un fil ondulant',[6,.52,40,13,1.15,'yarn',420],['#ffa4cd','#be6a98','#4e3656','#ffdbec']),
  defineWeapon('ribbonbow','Arc à rubans','Une flèche à longue portée',[4,.83,78,28,1.1,'ribbon',566],['#bbffa2','#68a570','#214941','#ebffcc']),
  defineWeapon('pompom','Lance-pompons','Un pompon éclate à l’impact',[3,.87,32,21,1.64,'pompom',238],['#ffb988','#db824f','#573c49','#fff1bb']),
  defineWeapon('confetti','Tromblon confettis','Une gerbe de sept confettis',[3,.94,16,13,1.5,'confetti',293],['#ff92bd','#cc6492','#60344f','#ffe3a5']),
  defineWeapon('boomerang','Navette boomerang','Rebondit sur une cible voisine',[2,1.03,36,19,1.32,'boomerang',324],['#8bdfeb','#4e9da6','#234858','#d9fff5']),
  defineWeapon('bubbles','Souffle-bulles','Trois bulles à chaque souffle',[16,.31,25,8,1.04,'bubbles',673],['#98caff','#648bbf','#324663','#d7faff']),
  defineWeapon('spool','Toupie-bobine','Roule de cible en cible',[4,.82,28,16,1.45,'spool',185],['#bbadff','#8279b2','#3c3a62','#eee5ff']),
  defineWeapon('star','Fronde étoilée','Trois étoiles à moyenne portée',[7,.53,49,13,1.17,'star',760],['#ffe77e','#bd9953','#54475b','#fffaad']),
  defineWeapon('chime','Cloche à grelots','Une onde sonore en demi-cercle',[4,.84,10,15,1.22,'chime',829],['#e7ca9e','#b08b58','#4f414d','#fff0c6'])
];
export const weaponCatalog=Object.freeze(Object.fromEntries(entries.map(w=>[w.id,w])));
export const weaponList=Object.freeze(entries);
export const starterWeapons=Object.freeze(entries.filter(w=>w.starter).map(w=>w.id));
export const findableWeaponIds=Object.freeze(entries.filter(w=>!w.starter).map(w=>w.id));
