export const CATEGORIES=[
 ['general','Général','Le grand mélange','✳','#63764e'],
 ['cinema','Cinéma','Salle obscure','◉','#867293'],
 ['people','Personnalités','Qui est-ce ?','☺','#ab725b'],
 ['world','Voyage & lieux','Autour du monde','◎','#578181'],
 ['animals','Animaux','Drôles de bêtes','♧','#9c813e'],
 ['videogames','Jeux vidéo','À vos manettes','🎮','#7c68a0'],
 ['series','Séries & dessins animés','Encore un épisode','📺','#ae6f52'],
 ['food','Cuisine & gourmandises','À table !','🍕','#a87d34'],
 ['music','Musique','Sur la bonne piste','♫','#986680'],
 ['characters','Personnages cultes','Têtes d’affiche','☆','#587a98'],
 ['expressions','Expressions françaises','Façon de parler','“ ”','#947d4a'],
 ['objects','Objets du quotidien','Sous votre nez','✂','#648472'],
 ['myths','Mythes & légendes','Il était une légende','🐉','#876b8b'],
 ['science','Sciences & nature','La tête dans les étoiles','⚛','#547d82']
].map(([id,label,name,icon,color])=>({id,label,name,icon,color}));
export const FORMATS={rebus:['Rébus','🧩'],qcm:['QCM · 4 choix','▦'],write:['Réponse écrite','✎'],emoji:['Énigme en emojis','☺'],audio:['Blind test','♫'],intruder:['Trouver l’intrus','⊗'],order:['Remettre dans l’ordre','↕'],match:['Relier les paires','⇄'],estimate:['Estimation','≈'],tf:['Vrai ou faux','◐'],clue:['Qui suis-je ?','?'],image:['Image mystère','◌']};
export const ROOMS=[
 {id:'general',category:'general',format:'mixed',title:'Le grand mélange',label:'Général',description:'Tous les thèmes, tous les formats.',icon:'✳',color:'#63764e'},
 {id:'general-qcm',category:'general',format:'qcm',title:'Quatre choix. À toi de jouer.',label:'Général · QCM',description:'Culture générale, uniquement en QCM.',icon:'▦',color:'#867293'},
 {id:'general-rebus',category:'general',format:'rebus',title:'Ça se lit à voix haute.',label:'Général · Rébus',description:'Des images et des sons à assembler.',icon:'🧩',color:'#ad7b46'},
 ...CATEGORIES.filter(c=>c.id!=='general').map(c=>({id:c.id,category:c.id,format:'mixed',title:c.name,label:c.label,icon:c.icon,color:c.color}))
];

// Authored demo bank. Each fact has a shared family so its written and QCM
// presentations never repeat within the same ten-question match.
const FACTS={
 cinema:[
 ['Qui a réalisé « Les Dents de la mer » ?','Steven Spielberg','James Cameron','George Lucas','Ridley Scott'],
 ['Quel film met en scène le paquebot et le couple Jack et Rose ?','Titanic','Avatar','Pearl Harbor','Le Grand Bleu'],
 ['Quel réalisateur a signé « 2001 : L’Odyssée de l’espace » ?','Stanley Kubrick','Martin Scorsese','David Lynch','Francis Ford Coppola'],
 ['Quel acteur incarne Jack Sparrow au cinéma ?','Johnny Depp','Orlando Bloom','Brad Pitt','Jude Law'],
 ['Dans quel film un ogre vert rencontre-t-il un âne très bavard ?','Shrek','Monstres et Cie','Ratatouille','L’Âge de glace'],
 ['Quelle récompense porte le nom d’une branche dorée au Festival de Cannes ?','La Palme d’or','Le Lion d’or','L’Ours d’or','Le César'],
 ['Quelle famille est au centre de la saga « Le Parrain » ?','Corleone','Soprano','Shelby','Montana'],
 ['Quel studio a créé « Le Voyage de Chihiro » ?','Studio Ghibli','Pixar','DreamWorks','Illumination'],
 ['Qui a réalisé « Inception » ?','Christopher Nolan','Denis Villeneuve','David Fincher','Wes Anderson'],
 ['Quel film d’animation suit les jouets Woody et Buzz ?','Toy Story','Cars','Vice-versa','Là-haut']
 ],
 people:[
 ['Qui a peint « La Joconde » ?','Léonard de Vinci','Claude Monet','Vincent van Gogh','Pablo Picasso'],
 ['Quelle scientifique a reçu deux prix Nobel dans deux disciplines scientifiques différentes ?','Marie Curie','Rosalind Franklin','Ada Lovelace','Jane Goodall'],
 ['Qui a écrit « Les Misérables » ?','Victor Hugo','Émile Zola','Molière','Jules Verne'],
 ['Quel astronaute a été le premier à marcher sur la Lune ?','Neil Armstrong','Buzz Aldrin','Youri Gagarine','Michael Collins'],
 ['Quel artiste néerlandais a peint « La Nuit étoilée » ?','Vincent van Gogh','Rembrandt','Johannes Vermeer','Piet Mondrian'],
 ['Quel physicien est associé à la formule E = mc² ?','Albert Einstein','Isaac Newton','Galilée','Niels Bohr'],
 ['Qui a écrit les aventures d’Arsène Lupin ?','Maurice Leblanc','Arthur Conan Doyle','Agatha Christie','Gaston Leroux'],
 ['Quelle couturière est surnommée « Coco » ?','Gabrielle Chanel','Jeanne Lanvin','Madeleine Vionnet','Elsa Schiaparelli'],
 ['Quel compositeur a écrit « La Flûte enchantée » ?','Wolfgang Amadeus Mozart','Ludwig van Beethoven','Frédéric Chopin','Antonio Vivaldi'],
 ['Qui est l’auteur du « Petit Prince » ?','Antoine de Saint-Exupéry','Marcel Pagnol','Albert Camus','Jacques Prévert']
 ],
 world:[
 ['Quelle est la capitale du Japon ?','Tokyo','Kyoto','Osaka','Séoul'],
 ['Dans quel pays se trouve la ville de Marrakech ?','Maroc','Tunisie','Algérie','Égypte'],
 ['Quel océan borde la côte ouest des États-Unis ?','Pacifique','Atlantique','Indien','Arctique'],
 ['Dans quel pays peut-on visiter le Machu Picchu ?','Pérou','Chili','Mexique','Bolivie'],
 ['Quelle ville est surnommée « la Sérénissime » ?','Venise','Rome','Florence','Naples'],
 ['Quel fleuve traverse Paris ?','La Seine','La Loire','Le Rhône','La Garonne'],
 ['Dans quel pays se trouve le mont Fuji ?','Japon','Chine','Corée du Sud','Népal'],
 ['Quel pays a pour capitale Canberra ?','Australie','Nouvelle-Zélande','Canada','Afrique du Sud'],
 ['Quel monument se trouve sur le Champ-de-Mars à Paris ?','La tour Eiffel','L’Arc de triomphe','Le Panthéon','Le Sacré-Cœur'],
 ['Sur quel continent se trouve le désert du Sahara ?','Afrique','Asie','Amérique du Sud','Océanie']
 ],
 animals:[
 ['Quel animal terrestre est le plus grand en hauteur ?','La girafe','L’éléphant','L’autruche','Le chameau'],
 ['Quel mammifère pond des œufs et possède un bec ?','L’ornithorynque','Le castor','La loutre','Le dauphin'],
 ['Comment appelle-t-on le petit du cheval ?','Le poulain','Le veau','Le faon','Le chevreau'],
 ['Combien de bras une pieuvre possède-t-elle ?','Huit','Six','Dix','Douze'],
 ['Quel insecte élève-t-on dans des ruches pour récolter son miel ?','L’abeille','La guêpe','Le frelon','Le bourdon'],
 ['Quel oiseau est connu pour pouvoir voler sur place et à reculons ?','Le colibri','Le corbeau','La cigogne','L’hirondelle'],
 ['Quel animal est le symbole du WWF ?','Le panda géant','Le tigre','L’ours polaire','Le koala'],
 ['Comment s’appelle la transformation d’une chenille en papillon ?','La métamorphose','La migration','L’hibernation','La pollinisation'],
 ['Quel mammifère marin est le plus grand animal connu ?','La baleine bleue','L’orque','Le cachalot','Le requin-baleine'],
 ['Quel animal rongeur construit des barrages ?','Le castor','Le ragondin','La marmotte','L’écureuil']
 ],
 videogames:[
 ['Quel plombier de Nintendo porte une casquette rouge ?','Mario','Luigi','Wario','Toad'],
 ['Dans quelle série incarne-t-on généralement Link ?','The Legend of Zelda','Final Fantasy','Dragon Quest','Kingdom Hearts'],
 ['Quel jeu consiste notamment à miner et à assembler des cubes ?','Minecraft','Terraria','Roblox','Stardew Valley'],
 ['Quel Pokémon jaune est associé à l’électricité ?','Pikachu','Salamèche','Carapuce','Rondoudou'],
 ['Quel studio a créé « Dofus » ?','Ankama','Ubisoft','Blizzard','Bethesda'],
 ['Quel hérisson bleu est la mascotte de Sega ?','Sonic','Kirby','Crash Bandicoot','Spyro'],
 ['Quelle console de Nintendo se transporte et se branche à un téléviseur dès son modèle original de 2017 ?','Nintendo Switch','Nintendo Wii','Nintendo GameCube','Nintendo 64'],
 ['Dans « Portal », quel outil permet de créer deux passages reliés ?','Le générateur de portails','Le pistolet à gravité','Le grappin','Le jetpack'],
 ['Quel jeu de ferme se déroule notamment à Pelican Town ?','Stardew Valley','Animal Crossing','Harvestella','My Time at Portia'],
 ['Quel jeu met en scène le chasseur de monstres Geralt de Riv ?','The Witcher','Dark Souls','Skyrim','Fable']
 ],
 series:[
 ['Dans quelle série trouve-t-on la ville de Springfield et Homer ?','Les Simpson','South Park','Futurama','Les Griffin'],
 ['Quelle série suit le professeur de chimie Walter White ?','Breaking Bad','Dexter','Prison Break','Lost'],
 ['Dans quelle série les maisons Stark et Lannister s’affrontent-elles ?','Game of Thrones','Vikings','The Last Kingdom','The Witcher'],
 ['Quel dessin animé met en scène un écolier nommé Sacha et son Pikachu ?','Pokémon','Digimon','Yu-Gi-Oh!','Dragon Ball'],
 ['Quel est le prénom de l’éponge qui vit dans un ananas sous la mer ?','Bob','Patrick','Carlo','Gary'],
 ['Quelle série suit six amis qui se retrouvent au Central Perk ?','Friends','How I Met Your Mother','Seinfeld','New Girl'],
 ['Quelle série fantastique se déroule notamment dans la ville de Hawkins ?','Stranger Things','Dark','Buffy','Supernatural'],
 ['Dans quel anime trouve-t-on le pirate Monkey D. Luffy ?','One Piece','Naruto','Bleach','Fairy Tail'],
 ['Quel personnage de « Dragon Ball » est un Saiyan élevé sur Terre ?','Son Goku','Krillin','Piccolo','Yamcha'],
 ['Dans quelle série un ancien détenu nommé Dwight Manfredi s’installe-t-il en Oklahoma ?','Tulsa King','The Sopranos','Boardwalk Empire','Peaky Blinders']
 ],
 food:[
 ['Quel pays est associé aux sushis ?','Japon','Thaïlande','Chine','Vietnam'],
 ['Quel ingrédient est indispensable à un guacamole classique ?','L’avocat','La courgette','Le concombre','Le petit pois'],
 ['Quel fromage entre traditionnellement dans une salade grecque ?','La feta','Le parmesan','Le roquefort','Le cheddar'],
 ['Quelle pâte utilise-t-on habituellement pour les profiteroles ?','La pâte à choux','La pâte feuilletée','La pâte brisée','La pâte sablée'],
 ['Quelle épice donne sa couleur jaune à de nombreux currys ?','Le curcuma','Le paprika','Le cumin','La cannelle'],
 ['Quelle spécialité italienne alterne café, biscuits et mascarpone ?','Le tiramisu','La panna cotta','Le panettone','Le cannolo'],
 ['Quel fruit est traditionnellement utilisé dans une tarte Tatin ?','La pomme','La poire','La prune','L’abricot'],
 ['Quel féculent est à la base d’un risotto ?','Le riz','La semoule','Le boulgour','L’orge'],
 ['Quelle légumineuse est à la base du houmous classique ?','Le pois chiche','La lentille','Le haricot rouge','La fève'],
 ['Quel ustensile utilise-t-on pour égoutter des pâtes ?','Une passoire','Une louche','Un fouet','Une maryse']
 ],
 music:[
 ['Quel groupe a enregistré « Bohemian Rhapsody » ?','Queen','The Beatles','Pink Floyd','ABBA'],
 ['Quel instrument possède généralement 88 touches ?','Le piano','L’accordéon','Le clavecin','L’orgue de Barbarie'],
 ['Quel chanteur est surnommé « The King » dans le rock ?','Elvis Presley','David Bowie','Freddie Mercury','Prince'],
 ['Combien de cordes possède habituellement un violon ?','Quatre','Cinq','Six','Huit'],
 ['Quel duo français a réalisé l’album « Discovery » ?','Daft Punk','Air','Justice','Cassius'],
 ['Quel compositeur a écrit « Les Quatre Saisons » ?','Antonio Vivaldi','Jean-Sébastien Bach','Franz Schubert','Georges Bizet'],
 ['Quel groupe britannique a sorti « Abbey Road » ?','The Beatles','The Rolling Stones','The Kinks','The Who'],
 ['Quel instrument se joue avec des baguettes et des cymbales ?','La batterie','Le violoncelle','La harpe','La trompette'],
 ['Quel chanteur français a popularisé « La Bohème » ?','Charles Aznavour','Jacques Brel','Serge Gainsbourg','Claude François'],
 ['Quel terme signifie jouer doucement en musique ?','Piano','Forte','Presto','Allegro']
 ],
 characters:[
 ['Quel détective habite au 221B Baker Street ?','Sherlock Holmes','Hercule Poirot','Arsène Lupin','Philip Marlowe'],
 ['Quel héros porte un bouclier rond aux couleurs américaines ?','Captain America','Superman','Iron Man','Batman'],
 ['Quel personnage de Tolkien doit détruire l’Anneau unique ?','Frodon','Aragorn','Gimli','Legolas'],
 ['Quel héros de bande dessinée gaulois est l’ami d’Obélix ?','Astérix','Lucky Luke','Tintin','Spirou'],
 ['Quel pirate est l’ennemi de Peter Pan ?','Le capitaine Crochet','Barbe Noire','Long John Silver','Jack Sparrow'],
 ['Quel sorcier est surnommé « celui dont on ne doit pas prononcer le nom » ?','Voldemort','Saroumane','Gargamel','Jafar'],
 ['Quel héros de DC protège Gotham City ?','Batman','Flash','Aquaman','Green Lantern'],
 ['Quel personnage de Nintendo avale ses ennemis pour copier leurs pouvoirs ?','Kirby','Yoshi','Donkey Kong','Bowser'],
 ['Quel pantin de bois voit son nez s’allonger lorsqu’il ment ?','Pinocchio','Gepetto','Aladdin','Peter Pan'],
 ['Quel explorateur de cinéma manie un fouet et porte un fedora ?','Indiana Jones','Nathan Drake','Rick O’Connell','Allan Quatermain']
 ],
 expressions:[
 ['Complète : « Quand les poules auront des… »','Dents','Ailes','Plumes','Pattes'],
 ['Complète : « Mettre la charrue avant les… »','Bœufs','Chevaux','Moutons','Ânes'],
 ['Que signifie « donner sa langue au chat » ?','Renoncer à deviner','Parler trop vite','Mentir à quelqu’un','Changer de sujet'],
 ['Complète : « Il ne faut pas vendre la peau de l’ours avant de l’avoir… »','Tué','Vu','Suivi','Nourri'],
 ['Complète : « Avoir un chat dans la… »','Gorge','Poche','Main','Tête'],
 ['Que signifie « poser un lapin » ?','Ne pas venir à un rendez-vous','Faire un cadeau','Raconter une blague','Partir très vite'],
 ['Complète : « Chercher midi à… »','Quatorze heures','Dix heures','Minuit','Seize heures'],
 ['Complète : « Tomber dans les… »','Pommes','Poires','Prunes','Cerises'],
 ['Complète : « Après la pluie, le beau… »','Temps','Jour','Ciel','Soleil'],
 ['Quel objet casse-t-on en voulant « briser la glace » au figuré ?','Aucun objet : on détend l’atmosphère','Un miroir','Une fenêtre','Un glaçon']
 ],
 objects:[
 ['Quel instrument sert à mesurer la température ?','Un thermomètre','Un baromètre','Un hygromètre','Un anémomètre'],
 ['Quel objet permet de se repérer grâce au nord magnétique ?','Une boussole','Un sextant','Une règle','Un sablier'],
 ['Quel outil sert à serrer ou desserrer une vis ?','Un tournevis','Un marteau','Un rabot','Une lime'],
 ['Quel instrument mesure la pression atmosphérique ?','Un baromètre','Un thermomètre','Un chronomètre','Un voltmètre'],
 ['Quel objet protège de la pluie lorsqu’on marche dehors ?','Un parapluie','Un parasol','Un éventail','Une moustiquaire'],
 ['Quel outil textile assemble du tissu avec du fil ?','Une aiguille','Une navette de badminton','Une spatule','Un compas'],
 ['Quel objet est composé de deux lames articulées pour couper ?','Des ciseaux','Une pince','Une agrafeuse','Un sécateur à enclume'],
 ['Quel objet utilise-t-on pour ouvrir une bouteille à bouchon de liège ?','Un tire-bouchon','Un décapsuleur','Un ouvre-boîte','Un économe'],
 ['Quel instrument sert à tracer des cercles ?','Un compas','Un rapporteur','Une équerre','Un pied à coulisse'],
 ['Quel objet décompte le temps avec du sable ?','Un sablier','Une clepsydre','Un cadran solaire','Un métronome']
 ],
 myths:[
 ['Quel dieu grec est associé à la foudre ?','Zeus','Poséidon','Hadès','Hermès'],
 ['Quel héros grec a accompli douze travaux ?','Héraclès','Persée','Thésée','Achille'],
 ['Quel dieu nordique manie le marteau Mjöllnir ?','Thor','Odin','Loki','Týr'],
 ['Quelle créature renaît de ses cendres ?','Le phénix','Le griffon','Le dragon','Le basilic'],
 ['Quelle créature possède un corps de cheval et une corne unique ?','La licorne','Le centaure','Pégase','L’hippogriffe'],
 ['Quel héros est aidé par le fil d’Ariane dans le labyrinthe ?','Thésée','Ulysse','Héraclès','Jason'],
 ['Quel dieu égyptien à tête de chacal est associé aux rites funéraires ?','Anubis','Horus','Rê','Thot'],
 ['Quel cheval ailé appartient à la mythologie grecque ?','Pégase','Sleipnir','Bucéphale','Bayard'],
 ['Quel enchanteur est associé à la légende du roi Arthur ?','Merlin','Gandalf','Dumbledore','Prospero'],
 ['Quelle créature grecque a des serpents en guise de cheveux ?','Méduse','La Chimère','Le Sphinx','L’Hydre']
 ],
 science:[
 ['Quelle est la plus grande planète du Système solaire ?','Jupiter','Saturne','Neptune','La Terre'],
 ['Quel est le symbole chimique de l’or ?','Au','Ag','Fe','Cu'],
 ['Quelle planète est surnommée la planète rouge ?','Mars','Vénus','Mercure','Uranus'],
 ['Quel gaz les plantes absorbent-elles pour réaliser la photosynthèse ?','Le dioxyde de carbone','L’oxygène','L’hélium','Le méthane'],
 ['Combien de côtés possède un hexagone ?','Six','Cinq','Sept','Huit'],
 ['Quelle force attire les objets vers le centre de la Terre ?','La gravitation','Le magnétisme','La friction','La poussée d’Archimède'],
 ['Quel organe pompe le sang dans le corps humain ?','Le cœur','Le foie','Le poumon','Le rein'],
 ['Quel est le nom de notre galaxie ?','La Voie lactée','Andromède','Le Grand Nuage de Magellan','La galaxie du Sombrero'],
 ['Quelle particule porte une charge électrique négative ?','L’électron','Le proton','Le neutron','Le photon'],
 ['Quel instrument permet d’observer les astres lointains ?','Un télescope','Un microscope','Un périscope','Un stéthoscope']
 ]
};

export const BANK=[];
for(const [category,facts] of Object.entries(FACTS)) facts.forEach(([prompt,answer,...wrong],i)=>{
 const base={id:`${category}-${i}`,family:`${category}-${i}`,category,prompt,answer,explain:`Réponse : ${answer}.`,aliases:[],hint:`La réponse commence par « ${answer.replace(/^(le |la |les |un |une |des |l[’'])/i,'').slice(0,1).toUpperCase()} ».`};
 const short=answer.replace(/^(le |la |les |un |une |des |l[’'])/i,''); if(short!==answer) base.aliases.push(short);
 if(category==='people') { const parts=answer.split(' '); if(parts.length>1) base.aliases.push(parts.at(-1)); }
 if(category==='music'&&i===5) base.aliases.push('Vivaldi');
 if(category==='cinema') { if(i===0)base.aliases.push('Spielberg');if(i===2)base.aliases.push('Kubrick');if(i===8)base.aliases.push('Nolan'); }
 if(category==='animals'&&i===3)base.aliases.push('8');
 if(category==='music'&&i===3)base.aliases.push('4');
 if(category==='science'&&i===4)base.aliases.push('6');
 BANK.push({...base,id:base.id+'-qcm',type:'qcm',options:[answer,...wrong]});
 BANK.push({...base,id:base.id+'-write',type:'write'});
});

const rebus=[
 ['chapeau','objects',[['🐈','chat'],['🫙','pot']],'Chat + pot → chapeau.'],
 ['chameau','animals',[['🐈','chat'],['MOT','mot']],'Chat + mot → chameau.'],
 ['pinceau','objects',[['🥖','pain'],['🪣','seau']],'Pain + seau → pinceau.'],
 ['citron','food',[['🪚','scie'],['🪵','tronc']],'Scie + tronc → citron.'],
 ['sirène','myths',[['🪚','scie'],['👑','reine']],'Scie + reine → sirène.'],
 ['radeau','objects',[['🐀','rat'],['DOS','dos']],'Rat + dos → radeau.'],
 ['rideau','objects',[['🍚','riz'],['DOS','dos']],'Riz + dos → rideau.'],
 ['ciseau','objects',[['🪚','scie'],['ZOO','zoo']],'Scie + zoo → ciseau.', ['ciseaux']],
 ['cadeau','objects',[['K','la lettre K'],['DOS','dos']],'K + dos → cadeau.'],
 ['cacao','food',[['K','la lettre K'],['K','la lettre K'],['💧','eau']],'K + K + eau → cacao.'],
 ['café','food',[['K','la lettre K'],['🧚','fée']],'K + fée → café.'],
 ['poteau','objects',[['🫙','pot'],['💧','eau']],'Pot + eau → poteau.'],
 ['bougie','objects',[['BOUT','bout'],['J','la lettre J']],'Bout + J → bougie.'],
 ['bouquet','objects',[['🐐','bouc'],['HAIE','haie']],'Bouc + haie → bouquet.'],
 ['drapeau','objects',[['DRAP','drap'],['🫙','pot']],'Drap + pot → drapeau.'],
 ['carreau','objects',[['CAR','car'],['💧','eau']],'Car + eau → carreau.'],
 ['vermicelle','food',[['🪱','ver'],['MIE','mie'],['🧂','sel']],'Ver + mie + sel → vermicelle.', ['vermicelles']],
 ['cinéma','cinema',[['🪚','scie'],['NÉ','né'],['MA','ma']],'Scie + né + ma → cinéma.'],
 ['bateau','objects',[['BAS','bas'],['TÔT','tôt']],'Bas + tôt → bateau.'],
 ['châtain','objects',[['🐈','chat'],['THYM','thym']],'Chat + thym → châtain.']
];
rebus.forEach(([answer,category,tiles,explain,aliases=[]],i)=>BANK.push({id:'rebus-'+i,type:'rebus',category,prompt:'Quel mot se cache dans ce rébus ?',answer,tiles,explain,aliases,hint:tiles.map(t=>t[1]).join(' + ')}));

const extras=[
 {id:'emoji-titanic',category:'cinema',type:'emoji',prompt:'Quel film se cache ici ?',visual:'🚢  🧊  💔',answer:'Titanic',hint:'Un paquebot, un iceberg, une histoire d’amour.',explain:'Le paquebot, l’iceberg et l’histoire d’amour évoquent Titanic.'},
 {id:'emoji-lion',category:'cinema',type:'emoji',prompt:'Quel film d’animation se cache ici ?',visual:'🦁  👑  🌅',answer:'Le Roi Lion',aliases:['Roi Lion','The Lion King'],hint:'Un jeune lion doit trouver sa place.',explain:'Simba est le héros du Roi Lion.'},
 {id:'emoji-potter',category:'characters',type:'emoji',prompt:'Quel personnage se cache ici ?',visual:'⚡  👓  🪄  🦉',answer:'Harry Potter',aliases:['Harry'],hint:'Un élève de Poudlard.',explain:'La cicatrice, les lunettes, la baguette et la chouette renvoient à Harry Potter.'},
 {id:'emoji-mario',category:'videogames',type:'emoji',prompt:'Quel personnage de jeu vidéo se cache ici ?',visual:'🍄  👨🏻‍🔧  ⭐',answer:'Mario',aliases:['Super Mario'],hint:'Un plombier à casquette rouge.',explain:'Champignons et étoiles sont des bonus emblématiques de Mario.'},
 {id:'emoji-stranger',category:'series',type:'emoji',prompt:'Quelle série se cache ici ?',visual:'🚲  🔦  🧇  🙃',answer:'Stranger Things',hint:'Hawkins, Eleven et le Monde à l’envers.',explain:'Les vélos, les gaufres d’Eleven et le Monde à l’envers évoquent Stranger Things.'},
 {id:'emoji-expression',category:'expressions',type:'emoji',prompt:'Retrouve cette expression française.',visual:'🐈  ➡️  👄',answer:'Avoir un chat dans la gorge',aliases:['Un chat dans la gorge','Chat dans la gorge'],hint:'On l’emploie lorsque la voix est enrouée.',explain:'Avoir un chat dans la gorge signifie avoir la voix gênée ou enrouée.'},
 {id:'tf-dolphin',category:'animals',type:'tf',prompt:'Le dauphin est un poisson.',answer:'Faux',options:['Vrai','Faux'],explain:'Le dauphin est un mammifère : il respire de l’air avec des poumons.'},
 {id:'tf-venus',category:'science',type:'tf',prompt:'Vénus est plus proche du Soleil que la Terre.',answer:'Vrai',options:['Vrai','Faux'],explain:'L’ordre est Mercure, Vénus, puis la Terre.'},
 {id:'tf-sushi',category:'food',type:'tf',prompt:'Tous les sushis contiennent du poisson cru.',answer:'Faux',options:['Vrai','Faux'],explain:'Il existe notamment des sushis végétariens ou avec des ingrédients cuits.'},
 {id:'tf-mozart',category:'music',type:'tf',prompt:'Mozart a composé « La Flûte enchantée ».',answer:'Vrai',options:['Vrai','Faux'],explain:'La Flûte enchantée est un opéra de Mozart créé en 1791.'},
 {id:'tf-earth',category:'world',type:'tf',prompt:'L’équateur traverse le Brésil.',answer:'Vrai',options:['Vrai','Faux'],explain:'Le nord du Brésil est traversé par l’équateur.'},
 {id:'intruder-planet',category:'science',type:'intruder',prompt:'Quel nom ne désigne pas une planète du Système solaire ?',answer:'Sirius',options:['Vénus','Mars','Neptune','Sirius'],explain:'Sirius est une étoile. Les trois autres sont des planètes.'},
 {id:'intruder-console',category:'videogames',type:'intruder',prompt:'Quel personnage n’est pas issu d’un jeu Nintendo ?',answer:'Sonic',options:['Mario','Link','Kirby','Sonic'],explain:'Sonic a été créé pour Sega.'},
 {id:'intruder-cinema',category:'cinema',type:'intruder',prompt:'Quel titre n’est pas un film réalisé par Stanley Kubrick ?',answer:'Taxi Driver',options:['Shining','Barry Lyndon','Full Metal Jacket','Taxi Driver'],explain:'Taxi Driver a été réalisé par Martin Scorsese.'},
 {id:'intruder-fruit',category:'food',type:'intruder',prompt:'Lequel de ces aliments n’est pas un agrume ?',answer:'La poire',options:['Le citron','L’orange','Le pamplemousse','La poire'],explain:'La poire appartient aux fruits à pépins, pas aux agrumes.'},
 {id:'intruder-god',category:'myths',type:'intruder',prompt:'Quel dieu appartient à la mythologie nordique ?',answer:'Odin',options:['Zeus','Hermès','Poséidon','Odin'],explain:'Odin est un dieu nordique ; les trois autres sont des dieux grecs.'},
 {id:'order-films',category:'cinema',type:'order',prompt:'Classe ces films du plus ancien au plus récent.',items:['Les Dents de la mer','Jurassic Park','Titanic','Avatar'],answer:'Les Dents de la mer → Jurassic Park → Titanic → Avatar',explain:'Les Dents de la mer (1975), Jurassic Park (1993), Titanic (1997), Avatar (2009).'},
 {id:'order-planets',category:'science',type:'order',prompt:'Classe ces planètes de la plus proche à la plus éloignée du Soleil.',items:['Mercure','Vénus','La Terre','Mars'],answer:'Mercure → Vénus → La Terre → Mars',explain:'Ce sont les quatre planètes telluriques, dans l’ordre depuis le Soleil.'},
 {id:'order-consoles',category:'videogames',type:'order',prompt:'Classe ces consoles Nintendo de la plus ancienne à la plus récente.',items:['Nintendo 64','GameCube','Wii','Switch'],answer:'Nintendo 64 → GameCube → Wii → Switch',explain:'Premières sorties : Nintendo 64 (1996), GameCube (2001), Wii (2006), Switch (2017).'},
 {id:'order-food',category:'food',type:'order',prompt:'Remets dans l’ordre la préparation d’un œuf dur.',items:['Plonger l’œuf dans l’eau bouillante','Laisser cuire','Refroidir dans l’eau froide','Écaler'],answer:'Plonger → cuire → refroidir → écaler',explain:'On refroidit l’œuf avant de retirer sa coquille.'},
 {id:'order-people',category:'people',type:'order',prompt:'Classe ces personnes de la naissance la plus ancienne à la plus récente.',items:['Léonard de Vinci','Isaac Newton','Marie Curie','Neil Armstrong'],answer:'Léonard de Vinci → Isaac Newton → Marie Curie → Neil Armstrong',explain:'Naissances : de Vinci en 1452, Newton en 1642, Curie en 1867 et Armstrong en 1930.'},
 {id:'match-world',category:'world',type:'match',prompt:'Relie chaque pays à sa capitale.',pairs:[['Italie','Rome'],['Portugal','Lisbonne'],['Grèce','Athènes']],answer:'Italie · Rome / Portugal · Lisbonne / Grèce · Athènes',explain:'Rome est la capitale de l’Italie ; Lisbonne, du Portugal ; Athènes, de la Grèce.'},
 {id:'match-music',category:'music',type:'match',prompt:'Relie chaque œuvre à son compositeur.',pairs:[['Les Quatre Saisons','Vivaldi'],['La Flûte enchantée','Mozart'],['La Symphonie n° 9','Beethoven']],answer:'Les Quatre Saisons · Vivaldi / La Flûte enchantée · Mozart / La Symphonie n° 9 · Beethoven',explain:'Trois œuvres du répertoire classique et leurs compositeurs.'},
 {id:'match-characters',category:'characters',type:'match',prompt:'Relie chaque personnage à son univers.',pairs:[['Gandalf','Le Seigneur des anneaux'],['Hermione','Harry Potter'],['Dark Vador','Star Wars']],answer:'Gandalf · Le Seigneur des anneaux / Hermione · Harry Potter / Dark Vador · Star Wars',explain:'Gandalf est un magicien de Tolkien, Hermione une sorcière de Poudlard et Dark Vador un seigneur Sith.'},
 {id:'match-myths',category:'myths',type:'match',prompt:'Relie chaque dieu grec à son domaine.',pairs:[['Zeus','La foudre'],['Poséidon','La mer'],['Hadès','Les Enfers']],answer:'Zeus · foudre / Poséidon · mer / Hadès · Enfers',explain:'Ces trois frères se partagent le ciel, la mer et le monde souterrain.'},
 {id:'match-series',category:'series',type:'match',prompt:'Relie chaque personnage à sa série.',pairs:[['Walter White','Breaking Bad'],['Homer','Les Simpson'],['Eleven','Stranger Things']],answer:'Walter White · Breaking Bad / Homer · Les Simpson / Eleven · Stranger Things',explain:'Trois personnages emblématiques de leurs séries respectives.'},
 {id:'estimate-bones',category:'science',type:'estimate',prompt:'Combien d’os compte habituellement le squelette humain adulte ?',number:206,tolerance:5,unit:'os',answer:'206 os',explain:'On compte habituellement 206 os chez l’adulte. Pour cette estimation, les réponses de 201 à 211 étaient acceptées.'},
 {id:'estimate-piano',category:'music',type:'estimate',prompt:'Combien de touches possède un piano standard ?',number:88,tolerance:2,unit:'touches',answer:'88 touches',explain:'Un piano standard possède 88 touches : 52 blanches et 36 noires. Tolérance de la démo : ±2.'},
 {id:'estimate-earth',category:'world',type:'estimate',prompt:'Quelle est approximativement la circonférence de la Terre à l’équateur ?',number:40075,tolerance:1500,unit:'km',answer:'Environ 40 075 km',explain:'La circonférence équatoriale de la Terre est d’environ 40 075 km. Tolérance : ±1 500 km.'},
 {id:'estimate-spider',category:'animals',type:'estimate',prompt:'Combien de pattes possède une araignée ?',number:8,tolerance:0,unit:'pattes',answer:'8 pattes',explain:'Les araignées sont des arachnides et possèdent huit pattes.'},
 {id:'clue-fox',category:'animals',type:'clue',prompt:'Qui suis-je ?',clues:['Je suis un mammifère de la famille des canidés.','Mon pelage est souvent roux et ma queue est touffue.','Dans les fables, je suis souvent présenté comme rusé.'],answer:'Le renard',aliases:['renard'],explain:'Le renard est un canidé connu pour sa queue touffue et son image de ruse.'},
 {id:'clue-marie',category:'people',type:'clue',prompt:'Qui suis-je ?',clues:['Je suis une scientifique née en Pologne.','J’ai travaillé sur la radioactivité.','J’ai reçu le prix Nobel de physique en 1903, puis celui de chimie en 1911.'],answer:'Marie Curie',aliases:['Curie','Marie Sklodowska Curie'],explain:'Marie Curie a reçu le Nobel de physique en 1903 et celui de chimie en 1911.'},
 {id:'clue-compass',category:'objects',type:'clue',prompt:'Quel objet suis-je ?',clues:['Je peux tenir dans la main d’un randonneur.','Je suis utile pour s’orienter.','Mon aiguille indique le nord magnétique.'],answer:'Une boussole',aliases:['boussole'],explain:'La boussole utilise le champ magnétique terrestre pour s’orienter.'},
 {id:'clue-myth',category:'myths',type:'clue',prompt:'Quelle créature suis-je ?',clues:['J’appartiens à la mythologie grecque.','Je vis au cœur d’un labyrinthe.','J’ai un corps humain et une tête de taureau.'],answer:'Le Minotaure',aliases:['Minotaure'],explain:'Thésée affronte le Minotaure dans le labyrinthe de Crète.'},
 {id:'image-yarn',category:'objects',type:'image',prompt:'Quel objet se cache dans ce gros plan ?',src:'assets/yarn.webp',answer:'Une pelote de laine',aliases:['pelote','pelote de laine','laine'],hint:'On l’utilise pour tricoter.',explain:'C’est une pelote de laine, tirée des véritables illustrations de Kikalmo.'},
 {id:'image-star',category:'objects',type:'image',prompt:'Quelle forme se cache dans cette image ?',src:'assets/star.webp',answer:'Une étoile',aliases:['etoile','étoile à cinq branches'],hint:'Elle a cinq branches.',explain:'C’est une étoile en feutre, issue de l’univers visuel de Kikalmo.'},
 {id:'emoji-queen',category:'music',type:'emoji',prompt:'Quel groupe de musique se cache ici ?',visual:'👸  🎸  🎤',answer:'Queen',hint:'Le groupe de Freddie Mercury.',explain:'Queen signifie « reine » en anglais.'}
];
BANK.push(...extras);

// Original synthesized performances of traditional and classical melodies.
// No commercial recording or external audio API is needed in this prototype.
const tunes=[
 ['jacques','Frère Jacques',['Frere Jacques'],[['C4',1],['D4',1],['E4',1],['C4',1],['C4',1],['D4',1],['E4',1],['C4',1],['E4',1],['F4',1],['G4',2],['E4',1],['F4',1],['G4',2]],115,'Une comptine qui invite quelqu’un à se réveiller.'],
 ['clair','Au clair de la lune',[],[['C4',1],['C4',1],['C4',1],['D4',1],['E4',2],['D4',2],['C4',1],['E4',1],['D4',1],['D4',1],['C4',4]],115,'Une comptine nocturne qui évoque Pierrot.'],
 ['maman','Ah ! vous dirai-je, maman',['Ah vous dirai je maman','Twinkle Twinkle Little Star','La mélodie de l’alphabet'],[['C4',1],['C4',1],['G4',1],['G4',1],['A4',1],['A4',1],['G4',2],['F4',1],['F4',1],['E4',1],['E4',1],['D4',1],['D4',1],['C4',2]],120,'Une même mélodie célèbre existe aussi en anglais.'],
 ['joy','L’Ode à la joie',['Ode à la joie','Hymne à la joie','Beethoven','Symphonie 9','Neuvième symphonie'],[['E4',1],['E4',1],['F4',1],['G4',1],['G4',1],['F4',1],['E4',1],['D4',1],['C4',1],['C4',1],['D4',1],['E4',1],['E4',1.5],['D4',.5],['D4',2]],120,'Cette mélodie de Beethoven est aussi l’hymne européen.'],
 ['jingle','Jingle Bells',['Vive le vent'],[['E4',1],['E4',1],['E4',2],['E4',1],['E4',1],['E4',2],['E4',1],['G4',1],['C4',1.5],['D4',.5],['E4',4]],130,'Une mélodie souvent entendue pendant les fêtes de Noël.'],
 ['birthday','Joyeux anniversaire',['Happy Birthday','Happy Birthday to You'],[['G3',.75],['G3',.25],['A3',1],['G3',1],['C4',1],['B3',2],['G3',.75],['G3',.25],['A3',1],['G3',1],['D4',1],['C4',2]],112,'On la chante souvent devant un gâteau.'],

];
export const TUNES=Object.fromEntries(tunes.map(([id,title,aliases,notes,bpm,hint])=>[id,{title,notes,bpm}]));
tunes.forEach(([tune,answer,aliases,notes,bpm,hint])=>BANK.push({id:'audio-'+tune,category:'music',type:'audio',prompt:'Reconnais cette mélodie.',answer,aliases,tune,hint,explain:`Il s’agissait de « ${answer} ». La mélodie a été rejouée pour la démo.`}));

for(const q of BANK) { q.family??=q.id; q.aliases??=[]; }
