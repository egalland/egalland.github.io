import {architecture,                                            } from './model.js';
export const familyGuide                                                                  ={
 interface:{icon:'▣',title:'Les écrans',hint:'Ce que tu vois',role:'Les pages, menus et commandes qui permettent de naviguer dans le site.'},
 business:{icon:'◈',title:'Les outils métier',hint:'Ce que tu utilises',role:'Les blocs du point marché : dossiers, Jira, simulations, fournisseurs et exports.'},
 logic:{icon:'ƒ',title:'Les traitements',hint:'Ce que le site calcule',role:'Les règles qui filtrent, calculent les indicateurs et préparent les données à afficher.'},
 api:{icon:'⇄',title:'Les échanges',hint:'Ce qui fait le lien',role:'Les points de passage entre les écrans et les données partagées sur le serveur.'},
 storage:{icon:'▤',title:'La mémoire du site',hint:'Ce qui est conservé',role:'Les points enregistrés, fichiers et réglages, pour les retrouver plus tard.'},
 offline:{icon:'⌂',title:'La version PC',hint:'Le site en local',role:'Les éléments nécessaires pour utiliser Market Plus et ses données en version locale.'},
 build:{icon:'⚙',title:'La fabrication',hint:'Avant la mise en ligne',role:'Les scripts qui assemblent, vérifient et préparent la version du site.'},
 external:{icon:'✦',title:'Les briques partagées',hint:'Les outils de base',role:'Les bibliothèques utilisées par le site, comme React pour les écrans et Three.js pour la carte 3D.'}
};
const names                               ={
 "components/interactive-chart.tsx":["Les graphiques interactifs","Dessine les graphiques et permet de lire leurs valeurs au survol."],
 "components/point-metric-cards.tsx":["Les cartes d’indicateurs","Présente les chiffres clés sous forme de cartes lisibles."],
 "lib/interactive-chart.ts":["La préparation des graphiques","Prépare les séries et les options utilisées pour dessiner les graphiques."],
 "lib/jira-graph-settings.ts":["Les réglages des graphiques Jira","Définit les marchés, catégories et indicateurs à présenter."],
 "lib/app-transport.ts":["Le transport des données","Oriente les demandes de données vers le serveur ou la version locale."],
 "lib/directory-profiles.ts":["Les profils de l’annuaire","Interprète les métiers et les profils des personnes du site."],
 "lib/dmbp-directory.ts":["L’annuaire des personnes","Fournit les informations des personnes utilisées dans les modules."],
 "features/market-pulse/point-model.ts":["La structure d’un point","Organise les informations qui composent un point marché."],
 "lib/site-architecture.ts":["La carte des dépendances","Sélectionne les composants et les liens à afficher dans la carte."],
 "lib/architecture-guide.ts":["Le guide de découverte","Ajoute les noms lisibles et les explications métier de cette carte."],
 "lib/scene-render-loop.ts":["Le rythme du rendu 3D","Déclenche un dessin uniquement quand la carte en a besoin."],
 "features/market-pulse/admin-panel.tsx":["Les réglages d’administration","Regroupe les réglages et les rubriques réservées aux administrateurs."],
 'features/market-pulse/point-preview.tsx':['La présentation du point','Assemble les blocs visibles du point marché : c’est la présentation que tu consultes et modifies.'],
 'features/market-pulse/jira-graph-block.tsx':['Les graphiques Jira','Transforme la sélection de tickets en graphiques pour comparer les marchés et les catégories.'],
 'features/market-pulse/architecture-panel.tsx':['L’explorateur du site','Organise cette carte, les filtres et les explications des composants.'],
 'features/market-pulse/architecture-scene.ts':['Le moteur de la carte 3D','Dessine les points et les liens, et gère la rotation, le zoom et la sélection.'],
 'lib/access-server.ts':['Le contrôle des accès','Applique les droits du profil et relie les rôles et les logs à leur stockage.'],
 'lib/access-control.ts':['Les règles d’autorisation','Décide quelles actions sont accessibles selon le rôle de la personne.'],
 'features/market-pulse/audit-panel.tsx':['Le journal de l’application','Affiche les actions enregistrées et permet de les rechercher avec des filtres.']
};
export function friendlyNode(node                 ){const family=familyGuide[node.group];return node.id.startsWith('group:')?{title:family?.title??node.label,description:family?.role??node.description}: {title:names[node.path]?.[0]??node.label,description:names[node.path]?.[1]??node.description};}
export const discoveryPaths=[
 {icon:'▣',title:'Afficher un point',text:'Comment les blocs deviennent une présentation.',path:'features/market-pulse/point-preview.tsx'},
 {icon:'▥',title:'Comprendre Jira',text:'D’où viennent les graphiques du point ?',path:'features/market-pulse/jira-graph-block.tsx'},
 {icon:'◇',title:'Gérer les accès',text:'Comment les droits sont contrôlés.',path:'lib/access-server.ts'},
 {icon:'◎',title:'Explorer la carte',text:'Comment cette vue 3D fonctionne.',path:'features/market-pulse/architecture-panel.tsx'}
];
export function relatedGraph(graph                  ,id            )                  {
 if(!id||id.startsWith('group:'))return graph;
 const connected=new Set([id]);for(const edge of architecture.edges)if(edge.source===id||edge.target===id){connected.add(edge.source);connected.add(edge.target);}
 return {nodes:architecture.nodes.filter(n=>connected.has(n.id)),edges:architecture.edges.filter(e=>connected.has(e.source)&&connected.has(e.target))};
}
export const connectionWords                      ={request:'Échange des données avec',lazy:'Charge uniquement au besoin',storage:'Lit ou enregistre dans',import:'Utilise les fonctions de',group:'Travaille avec'};
