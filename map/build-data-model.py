from pathlib import Path
import sqlite3,re,json,hashlib,argparse
parser=argparse.ArgumentParser(description='Extraire le modèle SQL de Market Plus V150 sans aucune donnée.')
parser.add_argument('source',type=Path,help='Checkout du projet Market Plus V150')
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parent/'data-model.json')
args=parser.parse_args()
root=args.source.resolve()
out=args.output.resolve().parent
db=sqlite3.connect(':memory:');ddl=[];table_sources={};runtime_names=set()
def apply(source,path,runtime=False):
    statement=''
    source=re.sub(r'--[^\n]*','',source)
    for c in source:
        statement+=c
        if c==';' and sqlite3.complete_statement(statement):
            sql=statement.strip();statement=''
            if not re.match(r'^(?:CREATE\s+(?:(?:UNIQUE\s+)?INDEX|TABLE)|ALTER\s+TABLE|DROP\s+(?:INDEX|TABLE))\b',sql,re.I):continue
            db.executescript(sql);ddl.append(sql)
            match=re.match(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"\[]?(\w+)',sql,re.I)
            if match:
                name=match[1];table_sources.setdefault(name,[]).append(path)
                if runtime:runtime_names.add(name)
            alteration=re.match(r'ALTER\s+TABLE\s+[`"\[]?(\w+)',sql,re.I)
            if alteration:table_sources.setdefault(alteration[1],[]).append(path)
for p in sorted((root/'drizzle').glob('*.sql')):apply(p.read_text(),str(p.relative_to(root)))
for name in ['lib/access-server.ts','lib/directory-store.ts','lib/jira-analytics-server.ts']:
    source=(root/name).read_text()
    for match in re.finditer(r'\.exec\(([\'\"])(.*?)\1\)',source,re.S):
        if 'CREATE TABLE' in match[2]:apply(match[2],name,True)
metadata={
'market_definitions':('Marchés','references','Définitions des marchés, étiquettes Planner et seuils Jira.'),
'dmbp_users':('Personnes','references','Annuaire des personnes et identifiants utilisés par les modules.'),
'dmbp_user_markets':('Personnes ↔ marchés','references','Table de liaison entre les personnes et leurs marchés.'),
'jira_market_assignments':('Affectations Jira','references','Rattachement de noms Jira à un marché, sans clé étrangère SQL déclarée.'),
'weekly_points':('Points marché','points','Versions publiées des points marché. Les blocs et réglages sont sérialisés dans payload.'),
'analyst_weekly_points':('Points analyste','points','Points d’activité d’un analyste et de sa période. Leur contenu est conservé en JSON.'),
'point_drafts':('Brouillons','points','Brouillons séparés des points publiés. Le propriétaire dépend du scope : marché ou analyste.'),
'jira_tickets':('Tickets Jira','registry','Registre central des tickets, mis à jour lors des imports.'),
'jira_ticket_participants':('Participants aux tickets','registry','Participants liés à un ticket du registre central.'),
'jira_import_batches':('Lots d’import Jira','imports','Métadonnées et état d’un import Jira.'),
'jira_import_tickets':('Tickets d’un import','imports','Tickets temporaires d’un lot avant publication dans le registre.'),
'jira_import_participants':('Participants d’un import','imports','Participants temporaires associés à un lot d’import.'),
'jira_weekly_snapshots':('Instantanés Jira','snapshots','Instantané Jira global par année et semaine.'),
'jira_market_weekly_snapshots':('Instantanés par marché','snapshots','Instantané Jira d’un marché pour une semaine.'),
'jira_analyst_weekly_snapshots':('Instantanés par analyste','snapshots','Instantané Jira d’un analyste pour une semaine.'),
'planner_tasks':('Tâches Planner','planner','Tâches et informations de simulation importées de Planner, avec leur document JSON.'),
'app_access_roles':('Rôles d’accès','system','Rôles d’accès identifiés par SGID. Table créée à la demande.'),
'app_activity':('Journal d’activité','system','Événements d’utilisation et d’administration. Table créée à la demande.'),
'app_access_policy':('Règles d’accès','system','Document JSON des autorisations. Table créée à la demande.'),
'app_job_roles':('Métiers de l’annuaire','references','Définitions des métiers complémentaires, stockées en JSON.'),
'app_directory_profiles':('Profils et périodes','references','Périodes d’affectation d’une personne, stockées en JSON et reliées par le code.'),
'app_jira_analytics_cache':('Cache des indicateurs Jira','system','Rapports précalculés découpés en parties. Clé primaire composée de cache_key et part.')}
groups=[{'id':'references','label':'Annuaire & marchés','color':'#73c6ff'},{'id':'points','label':'Points & brouillons','color':'#74e6c1'},{'id':'registry','label':'Registre Jira','color':'#bca3ff'},{'id':'imports','label':'Imports Jira','color':'#ffbd7b'},{'id':'snapshots','label':'Instantanés','color':'#e29bc0'},{'id':'planner','label':'Planner','color':'#a6dc9d'},{'id':'system','label':'Administration & cache','color':'#bac5d7'}]
tables=[];relations=[]
names=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
for name in names:
    info=db.execute(f'PRAGMA table_info("{name}")').fetchall();idx=[]
    for item in db.execute(f'PRAGMA index_list("{name}")'):
        if item[3]=='pk':continue
        columns=[v[2] for v in db.execute(f'PRAGMA index_info("{item[1]}")')]
        idx.append({'name':item[1],'unique':bool(item[2]),'columns':columns})
    columns=[{'name':v[1],'type':v[2].upper(),'notNull':bool(v[3]),'default':v[4],'primary':v[5]>0,'primaryOrder':v[5],
        'json':v[1] in ['payload','planner_tags','labels'] or (name=='app_access_policy' and v[1]=='value'),
        'unique':any(x['unique'] and x['columns']==[v[1]] for x in idx)} for v in info]
    for rel in db.execute(f'PRAGMA foreign_key_list("{name}")'):
        field=next(c for c in columns if c['name']==rel[3]);unique=field['unique'] or (field['primary'] and len([c for c in columns if c['primary']])==1)
        relations.append({'id':name+'.'+rel[3]+'>'+rel[2]+'.'+rel[4], 'kind':'foreign-key','source':name,'sourceFields':[rel[3]],'target':rel[2],'targetFields':[rel[4]],'onDelete':rel[6], 'onUpdate':rel[5],'parentCardinality':'1' if field['notNull'] else '0..1','childCardinality':'0..1' if unique else '0..N','sourceFiles':['db/schema.ts',*table_sources[name]]})
    label,group,description=metadata[name]
    sources=table_sources[name] if name in runtime_names else ['db/schema.ts',*table_sources[name]]
    tables.append({'id':name,'label':label,'group':group,'description':description,'definition':'runtime' if name in runtime_names else 'drizzle','sources':list(dict.fromkeys(sources)),'columns':columns,'indexes':idx})
def logical(source,field,target,targetfield,description,evidence,condition=None):
    item={'id':'logical:'+source+'.'+field+'>'+target+'.'+targetfield,'kind':'application','source':source,'sourceFields':[field],'target':target,'targetFields':[targetfield],'description':description,'sourceFiles':evidence}
    if condition:item['condition']=condition
    relations.append(item)
logical('weekly_points','market_id','market_definitions','id','Marché propriétaire résolu et vérifié par le code ; aucune FK SQL déclarée.',['db/point-store.ts','app/api/point-drafts/route.ts'])
logical('analyst_weekly_points','analyst_id','dmbp_users','id','Analyste propriétaire vérifié par ownerExists ; aucune FK SQL déclarée.',['db/point-store.ts','app/api/point-drafts/route.ts'])
logical('point_drafts','owner_id','market_definitions','id','Propriétaire du brouillon lorsque scope vaut market.',['db/point-store.ts','lib/point-persistence.ts'],"scope = 'market'")
logical('point_drafts','owner_id','dmbp_users','id','Propriétaire du brouillon lorsque scope vaut analyst.',['db/point-store.ts','lib/point-persistence.ts'],"scope = 'analyst'")
logical('point_drafts','base_point_id','weekly_points','id','Référence facultative à la version publiée du point marché.',['db/point-store.ts','lib/point-persistence.ts'],"scope = 'market'")
logical('point_drafts','base_point_id','analyst_weekly_points','id','Référence facultative à la version publiée du point analyste.',['db/point-store.ts','lib/point-persistence.ts'],"scope = 'analyst'")
logical('app_directory_profiles','person_id','dmbp_users','id','Profil rapproché par person_id === user.id dans directoryUsersAt ; aucune FK SQL.',['lib/directory-store.ts'])
point_json={'type':'PointData','source':'features/market-pulse/point-model.ts','fields':['pointName','themeColor','customColor','meetingDate','priority','dossiers[]','operations[]','promotions[]','tariffs[]','jira[]','preferences','marketComparison','mail','jiraMode','plannerMode'], 'note':'Ces blocs sont des propriétés du document JSON payload, pas des tables SQL indépendantes.'}
sourcefiles=sorted(set([*sum((t['sources'] for t in tables),[]),'db/index.ts','features/market-pulse/point-model.ts','db/point-store.ts','lib/point-persistence.ts']))
result={'schema':1,'title':'Modèle logique des données de Market Plus','sourceVersion':150,'sourceCommit':'8a686f762ba40701ec4631ec98d6f82bfa3aa8f4','engine':'Cloudflare D1 / SQLite','orm':'Drizzle ORM','scope':'Définitions du code et des migrations, sans lecture de la base de production.','groups':groups,'tables':tables,'relations':relations,'documents':[point_json], 'otherStorage':[{'label':'Documents dans les champs TEXT','description':'Les points, les tâches Planner, les profils et certains rapports conservent des documents JSON dans des colonnes TEXT.','sources':['db/point-store.ts','features/market-pulse/point-model.ts','lib/directory-store.ts']},{'label':'Fichiers R2','description':'PP2, pièces jointes du point et bugs/idées utilisent aussi des fichiers et documents dans le stockage R2.','sources':['app/api/pp2/route.ts','app/api/feedback/route.ts','lib/point-assets.ts']},{'label':'Version PC','description':'La version locale conserve un espace JSON avec ses points, brouillons et sources. Elle ne crée pas une seconde base SQL dans cette vue.','sources':['offline/workspace-store.ts','offline/workspace-data.ts']}], 'sourceHashes':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in sourcefiles}}
assert len(tables)==22 and len(runtime_names)==6
assert sum(r['kind']=='foreign-key' for r in relations)==7
byid={t['id']:t for t in tables}
for r in relations:
    for side in ['source','target']:
        assert r[side] in byid
        assert set(r[side+'Fields'])<=set(c['name'] for c in byid[r[side]]['columns'])
args.output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')

print(json.dumps({'tables':len(tables),'runtime':len(runtime_names),'columns':sum(len(t['columns']) for t in tables),'foreignKeys':7,'applicationReferences':7,'indexes':sum(len(t['indexes']) for t in tables)},ensure_ascii=False))
