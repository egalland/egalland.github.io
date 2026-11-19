export type Field = { key:string; label:string; type?:string; options?:[string,string][]; required?:boolean; default?:string; min?:number };
export type Form = { action:string; label:string; fields:Field[]; defaults?:string };
export type Listing = { key:string; label:string; columns:[string,string][]; remove?:string };
export type Section = { name:string; forms:Form[]; lists:Listing[] };
const field = (key:string,label:string,type='text', required=false):Field => ({key,label,type,required});
const num = (key:string,label:string, required=false) => ({...field(key,label,'number',required),min:0});
const date = (key:string,label='Date') => field(key,label,'date',true);
const ref = (key:string,label:string,table:string,required=true) => field(key,label,'ref:'+table,required);
const choice = (key:string,label:string,options:[string,string][]):Field => ({key,label,options});
const option = (key:string,label:string):Field => field(key,label,'checkbox');
const note=field('note','Note');
const name=field('name','Nom','text',true);
const columns = (...cells:[string,string][]) => cells;
const form=(action:string,label:string,fields:Field[],defaults?:string):Form=>({action,label,fields,defaults});

export const sections:Section[]=[
 {name:'Journal',forms:[
  form('save-log','Saisie du jour',[date('logDate'),num('weightKg','Poids (kg)'),num('bodyFatPct','Masse grasse (%)'),num('waistCm','Taille (cm)'),num('energy','Énergie ressentie (1–5)'),num('sleepHours','Sommeil (h)'),num('steps','Pas'),num('waterMl','Eau (ml)'),num('calories','Énergie (kcal)'),num('proteinG','Protéines (g)'),num('carbsG','Glucides (g)'),num('fatG','Lipides (g)'),num('trainingMinutes','Entraînement (min)'),field('notes','Notes')]),
  form('add-task','Nouvelle habitude',[field('title','Intitulé','text',true),field('domain','Catégorie'),field('defaultTime','Heure','time'),choice('recurrence','Répétition',[['daily','Tous les jours'],['weekdays','En semaine'],['weekends','Le week-end']])]),
  form('set-task-status','Pointer une habitude',[ref('taskId','Habitude','tasks'),date('taskDate'),choice('status','Statut',[['done','Effectuée'],['skipped','Ignorée'],['postponed','Reportée']]),note])],
  lists:[{key:'logs',label:'Journal quotidien',columns:columns(['logDate','Date'],['weightKg','Poids (kg)'],['sleepHours','Sommeil (h)'],['steps','Pas'],['calories','kcal'])},{key:'tasks',label:'Habitudes',columns:columns(['title','Intitulé'],['recurrence','Répétition']),remove:'delete-task'},{key:'taskStates',label:'Pointages',columns:columns(['taskDate','Date'],['taskId','Habitude'],['status','Statut'])}]},
 {name:'Mensurations',forms:[
  form('add-measurement','Relever des mesures',[date('measuredAt'),num('weightKg','Poids (kg)'),num('bodyFatPct','Masse grasse (%)'),...Object.entries({chestCm:'Poitrine',waistCm:'Taille',abdomenCm:'Abdomen',hipsCm:'Hanches',neckCm:'Cou',shouldersCm:'Épaules',bicepsLeftCm:'Biceps gauche',bicepsRightCm:'Biceps droit',forearmLeftCm:'Avant-bras gauche',forearmRightCm:'Avant-bras droit',thighLeftCm:'Cuisse gauche',thighRightCm:'Cuisse droite',calfLeftCm:'Mollet gauche',calfRightCm:'Mollet droit'}).map(([k,l])=>num(k,l+' (cm)')),note]),
  form('save-morphology','Repères morphologiques',[num('wristCm','Poignet (cm)'),num('ankleCm','Cheville (cm)'),choice('proportionModel','Modèle',[['classic','Classique'],['adaptive','Adaptatif'],['custom','Personnel']]),num('proportionTolerancePct','Tolérance (%)'),...Object.entries({chestCm:'Poitrine',waistCm:'Taille',hipsCm:'Hanches',bicepsCm:'Biceps',forearmCm:'Avant-bras',thighCm:'Cuisse',calfCm:'Mollet',neckCm:'Cou',shouldersCm:'Épaules'}).map(([k,l])=>num('target_'+k,'Cible '+l.toLowerCase()+' (cm)'))],'profile')],
  lists:[{key:'measurements',label:'Relevés',columns:columns(['measuredAt','Date'],['weightKg','Poids (kg)'],['waistCm','Taille (cm)'],['chestCm','Poitrine (cm)'],['hipsCm','Hanches (cm)'],['note','Note'])}]},
 {name:'Activités',forms:[form('add-activity','Consigner une activité',[date('activityDate'),field('activityType','Activité','text',true),field('category','Catégorie','text',true),num('durationMinutes','Durée (min)',true),num('distanceKm','Distance (km)'),num('steps','Pas'),num('calories','Énergie (kcal)'),note])],
  lists:[{key:'activities',label:'Activités consignées',columns:columns(['activityDate','Date'],['activityType','Activité'],['durationMinutes','Minutes'],['distanceKm','Distance (km)']),remove:'delete-activity'}]},
 {name:'Musculation',forms:[
  form('add-program','Créer un programme',[name,field('description','Description')]),
  form('set-active-program','Choisir le programme actif',[ref('id','Programme','programs')]),
  form('add-program-day','Ajouter une journée',[ref('programId','Programme','programs'),name,num('cardioMinutes','Cardio (min)'),note]),
  form('add-program-exercise','Programmer un exercice',[ref('dayId','Journée','programDays'),ref('catalogKey','Exercice','catalog'),num('targetSets','Séries'),num('targetRepsMin','Répétitions min.'),num('targetRepsMax','Répétitions max.'),num('restSeconds','Repos (s)')]),
  form('start-strength-session','Commencer une séance',[field('sessionName','Nom de la séance','text',true),ref('programDayId','Journée de programme','programDays',false)]),
  form('save-strength-set','Enregistrer une série',[ref('sessionId','Séance ouverte','openSessions'),ref('exerciseName','Exercice','exerciseNames'),num('setIndex','N° de série',true),num('reps','Répétitions',true),num('weightKg','Charge (kg)',true)]),
  form('finish-strength-session','Terminer une séance',[ref('sessionId','Séance ouverte','openSessions'),num('durationSeconds','Durée (secondes)'),note])],
  lists:[{key:'programs',label:'Programmes',columns:columns(['name','Programme'],['active','Actif'])},{key:'programDays',label:'Journées',columns:columns(['name','Journée'],['cardioMinutes','Cardio (min)']),remove:'delete-program-day'},{key:'programExercises',label:'Exercices programmés',columns:columns(['name','Exercice'],['targetSets','Séries'],['targetRepsMin','Rép. min.'],['targetRepsMax','Rép. max.']),remove:'delete-program-exercise'},{key:'strengthSessions',label:'Séances',columns:columns(['sessionName','Séance'],['startedAt','Début'],['totalVolumeKg','Volume (kg)'],['totalSets','Séries']),remove:'delete-strength-session'},{key:'strengthSets',label:'Séries',columns:columns(['exerciseName','Exercice'],['setIndex','Série'],['reps','Répétitions'],['weightKg','Charge (kg)'])}]},
 {name:'Nutrition',forms:[form('add-food','Ajouter un aliment',[name,field('category','Catégorie'),num('pricePerKg','Prix/kg (€)'),num('kcalPer100g','kcal/100 g'),num('proteinPer100g','Protéines (g/100 g)'),num('carbsPer100g','Glucides (g/100 g)'),num('fatPer100g','Lipides (g/100 g)'),field('source','Source'),option('favorite','Favori')]),
  form('add-supplement','Ajouter un complément',[name,field('dose','Unité de prise'),field('timing','Moment'),num('costCents','Prix (centimes)'),num('servingsPerPack','Portions par boîte'),num('stockServings','Portions en stock'),option('active','Actif'),note])],
  lists:[{key:'foods',label:'Aliments',columns:columns(['name','Aliment'],['kcalPer100g','kcal/100 g'],['pricePerKg','Prix/kg (€)']),remove:'delete-food'},{key:'supplements',label:'Compléments',columns:columns(['name','Nom'],['stockServings','Stock'],['dose','Unité'],['costCents','Prix (ct)']),remove:'delete-supplement'}]},
 {name:'Potager',forms:[
  form('add-produce','Ajouter une variété',[name,field('variety','Variété'),field('category','Catégorie'),num('defaultPricePerKg','Prix de référence/kg (€)'),date('effectiveAt','Date du prix'),field('priceSource','Source du prix')]),
  form('update-produce-price','Modifier le prix de référence',[ref('id','Variété','produce'),date('effectiveAt'),num('pricePerKg','Prix/kg (€)',true),field('source','Source du prix')]),
  form('add-harvest-batch','Consigner une récolte',[date('harvestDate'),ref('produceId','Variété','produce'),num('weightKg','Poids (kg)',true),num('unitCount','Unités'),field('destination','Destination'),note])],
  lists:[{key:'produce',label:'Variétés',columns:columns(['name','Produit'],['variety','Variété'],['defaultPricePerKg','Prix/kg (€)'])},{key:'harvests',label:'Récoltes',columns:columns(['harvestDate','Date'],['produceId','Variété'],['weightKg','Poids (kg)'],['destination','Destination']),remove:'delete-harvest'},{key:'producePrices',label:'Historique des prix',columns:columns(['effectiveAt','Date'],['produceId','Variété'],['pricePerKg','Prix/kg (€)'])}]},
 {name:'Profil',forms:[form('save-profile','Profil fictif et objectifs',[num('heightCm','Taille (cm)'),num('baselineWeightKg','Poids de référence (kg)'),num('baselineBodyFatPct','Masse grasse de référence (%)'),num('targetPhaseOneKg','Objectif intermédiaire (kg)'),num('targetWeightKg','Objectif de poids (kg)'),num('targetBodyFatPct','Objectif de masse grasse (%)'),num('dailyCalories','Objectif quotidien (kcal)'),num('dailySteps','Objectif de pas'),num('dailyProteinG','Objectif de protéines (g)'),num('weeklyWorkouts','Séances par semaine'),num('weeklyLossRateKg','Variation théorique hebdomadaire (kg)'),field('personalGoalDate','Échéance fictive','date')],'profile'),
  form('save-settings','Préférences locales',[num('weeklyBudgetCents','Budget hebdomadaire (centimes)'),option('compactMode','Affichage compact')],'settings')],lists:[]}
];
