export const ROOM_TYPES={living:{name:'Séjour',color:'#dce3cf',accent:'#7d8f61',lux:200,w:4.8,l:4,icon:'sofa'},kitchen:{name:'Cuisine',color:'#ebdcc1',accent:'#a68752',lux:300,w:3,l:3,icon:'kitchen'},bed:{name:'Chambre',color:'#d9e3e6',accent:'#78959e',lux:150,w:3.2,l:4,icon:'bed'},bath:{name:'Salle d’eau',color:'#d3e3da',accent:'#63947d',lux:200,w:2,l:3,icon:'bath'},office:{name:'Bureau',color:'#e3dce9',accent:'#9983a9',lux:500,w:3,l:3,icon:'desk'},hall:{name:'Entrée',color:'#e8e4dc',accent:'#a69c88',lux:100,w:1.2,l:3,icon:'door'},other:{name:'Pièce libre',color:'#e4dfd5',accent:'#a99b83',lux:200,w:3,l:3,icon:'room'}};
export const OBJECTS={sofa:{name:'Canapé',w:2.3,l:.95,price:750,color:'#b7c4a1',icon:'sofa'},table:{name:'Table à manger',w:1.6,l:.9,price:380,color:'#c5a57e',icon:'table'},coffee:{name:'Table basse',w:1,l:.6,price:160,color:'#c9b08a',icon:'table'},bed:{name:'Lit double',w:1.6,l:2,price:650,color:'#e7e9e6',icon:'bed'},wardrobe:{name:'Armoire',w:1.8,l:.6,price:450,color:'#b8aa94',icon:'cabinet'},kitchen:{name:'Meubles de cuisine',w:3,l:.6,price:2600,color:'#aeb5a1',icon:'kitchen'},island:{name:'Îlot central',w:1.5,l:.85,price:700,color:'#d0baa1',icon:'kitchen'},fridge:{name:'Réfrigérateur',w:.65,l:.65,price:550,color:'#c3cecd',icon:'cabinet'},shower:{name:'Douche',w:.9,l:.9,price:450,color:'#bed8d7',icon:'bath'},wc:{name:'WC',w:.4,l:.7,price:230,color:'#f2f0e8',icon:'bath'},sink:{name:'Vasque',w:.8,l:.5,price:250,color:'#d7c5ae',icon:'bath'},desk:{name:'Bureau',w:1.4,l:.7,price:280,color:'#c7af8c',icon:'desk'},plant:{name:'Plante',w:.5,l:.5,price:45,color:'#819b62',icon:'plant'},shelf:{name:'Rayonnage',w:2,l:.6,price:180,color:'#9ca7a4',icon:'shelf',shop:true},workbench:{name:'Établi',w:2,l:.8,price:350,color:'#c8a77b',icon:'desk',shop:true},printer:{name:'Imprimante 3D',w:.65,l:.65,price:700,color:'#738b87',icon:'printer',shop:true},car:{name:'Véhicule',w:1.85,l:4.4,price:0,color:'#c3cbd1',icon:'car',shop:true}};
OBJECTS.stairs={name:'Escalier droit',w:.9,l:3.4,price:1800,color:'#b6a385',icon:'stairs',shop:true};

Object.assign(OBJECTS, {
  ceiling:{name:'Panneau de plafond',group:'ceiling',w:4,l:3,h:.12,price:0,color:'#eee8d8',icon:'layers'},
  beam:{name:'Poutre bois',group:'ceiling',w:.22,l:6,h:.32,price:0,color:'#b48b60',icon:'ruler',shop:true},
  steelBeam:{name:'Poutre acier',group:'ceiling',w:.22,l:6,h:.30,price:0,color:'#58675f',icon:'ruler',shop:true},
  spot:{name:'Spot encastré',group:'ceiling',w:.14,l:.14,h:.05,price:0,color:'#f1ce83',icon:'lightbulb'},
  pendant:{name:'Suspension',group:'ceiling',w:.42,l:.42,h:.65,price:0,color:'#bc9666',icon:'lightbulb'},
  hatch:{name:'Trappe de visite',group:'ceiling',w:.60,l:.60,h:.05,price:0,color:'#9ea995',icon:'grid'},
  vent:{name:'Bouche de ventilation',group:'ceiling',w:.25,l:.25,h:.06,price:0,color:'#8b9b97',icon:'grid'},
  pool:{name:'Piscine',group:'pool',w:3,l:8,h:1.45,price:0,color:'#58a8b5',icon:'bath',shop:true},
  poolLadder:{name:'Échelle de piscine',group:'pool',w:.52,l:.63,price:0,color:'#80999b',icon:'stairs',shop:true},
  poolShower:{name:'Douche de piscine',group:'pool',w:.8,l:.8,price:0,color:'#819995',icon:'bath',shop:true},
  poolFilter:{name:'Bloc filtration',group:'pool',w:1.15,l:.7,price:0,color:'#768e81',icon:'cabinet',shop:true},
  poolCover:{name:'Enrouleur de couverture',group:'pool',w:2.8,l:.45,price:0,color:'#789ba0',icon:'layers',shop:true},
  lounger:{name:'Transat',group:'pool',w:.66,l:1.95,price:0,color:'#cba977',icon:'sofa',shop:true}
});
