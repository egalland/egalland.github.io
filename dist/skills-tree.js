export const SKILLS=[
 {id:'batching',branch:'production',name:'Calepinage',cost:1,requires:[],description:'Grouper plusieurs pièces compatibles sur un plateau. Le temps d’extrusion reste compté.'},
 {id:'cad',branch:'production',name:'Conception méthodique',cost:2,requires:['batching'],description:'−8 % de travail de conception et de préparation sur les nouvelles tâches.'},
 {id:'large-format',branch:'production',name:'Grand format',cost:2,requires:['cad'],description:'Débloque les grandes machines et les demandes professionnelles volumineuses.'},
 {id:'calibration',branch:'atelier',name:'Calibration fine',cost:1,requires:[],description:'Réduit le risque de raté de 0,5 point, sans changer la vitesse physique.'},
 {id:'maintenance',branch:'atelier',name:'Entretien méthodique',cost:2,requires:['calibration'],description:'−15 % de temps d’intervention sur les nouvelles opérations de maintenance.'},
 {id:'packaging',branch:'atelier',name:'Emballages ajustés',cost:1,requires:['calibration'],description:'−10 % de consommables d’emballage. Le volume et le poids des colis restent déterminants.'},
 {id:'merchandising',branch:'commerce',name:'Vitrine soignée',cost:1,requires:[],description:'5 produits en vedette au lieu de 3 ; visibilité mieux répartie dans ton catalogue.'},
 {id:'ads',branch:'commerce',name:'Campagnes ciblées',cost:2,requires:['merchandising'],description:'−10 % de coût par clic simulé. Les achats restent aléatoires.'},
 {id:'customer-care',branch:'commerce',name:'Relation client',cost:1,requires:['merchandising'],description:'Un léger bonus de satisfaction pour les livraisons à l’heure.'}
];
export function normalizeSkills(input){const unlocked=[];for(const n of SKILLS)if(input?.unlocked?.includes(n.id)&&n.requires.every(id=>unlocked.includes(id)))unlocked.push(n.id);return {unlocked};}
export const hasSkill=(s,id)=>s.skills?.unlocked?.includes(id)===true;
export function skillPoints(s){const total=1+Math.floor((s.mastery?.xp||0)/100),spent=SKILLS.filter(n=>hasSkill(s,n.id)).reduce((n,v)=>n+v.cost,0);return {total,spent,available:Math.max(0,total-spent)};}
export function learnSkill(s,id){const node=SKILLS.find(n=>n.id===id);if(!node||hasSkill(s,id))return {ok:false,message:'Cette compétence est déjà acquise ou indisponible.'};if(!node.requires.every(n=>hasSkill(s,n)))return {ok:false,message:'Débloque d’abord la compétence précédente.'};if(skillPoints(s).available<node.cost)return {ok:false,message:'Il manque des points. Imprimer, prototyper et s’entraîner apporte de l’expérience.'};s.skills.unlocked.push(id);return {ok:true};}
