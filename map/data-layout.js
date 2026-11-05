export const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function selectModel(model,{domain='all',query='',logical=false}={}){
 const q=normalize(query).trim();
 const tables=model.tables.filter(table=>(domain==='all'||table.group===domain)&&(!q||normalize([table.id,table.label,table.description,...table.columns.map(column=>column.name)].join(' ')).includes(q)));
 const ids=new Set(tables.map(table=>table.id));
 const relations=model.relations.filter(rel=>(logical||rel.kind==='foreign-key')&&ids.has(rel.source)&&ids.has(rel.target));
 return {tables,relations};
}
export function visibleColumns(table,full,relations){
 if(full)return table.columns;
 const needed=new Set(table.columns.filter(column=>column.primary||column.unique).map(column=>column.name));
 for(const index of table.indexes)if(index.unique)index.columns.forEach(name=>needed.add(name));
 for(const rel of relations){if(rel.source===table.id)rel.sourceFields.forEach(name=>needed.add(name));if(rel.target===table.id)rel.targetFields.forEach(name=>needed.add(name));}
 for(const name of ['name','task_name','status','scope','owner_id','year','week','payload','value'])if(table.columns.some(column=>column.name===name))needed.add(name);
 if(needed.size<3)for(const column of table.columns.slice(0,3))needed.add(column.name);
 return table.columns.filter(column=>needed.has(column.name));
}
const lanes=[['market_definitions','dmbp_users','app_job_roles','app_access_roles','app_access_policy'],['dmbp_user_markets','jira_market_weekly_snapshots','jira_analyst_weekly_snapshots','app_directory_profiles','jira_market_assignments'],['jira_import_batches','jira_tickets','weekly_points','analyst_weekly_points','planner_tasks','jira_weekly_snapshots'],['jira_import_tickets','jira_import_participants','jira_ticket_participants','point_drafts','app_activity','app_jira_analytics_cache']];
export function layoutModel(tables,relations,full=false){
 const width=300,rowHeight=25,header=77,footer=35,columnGap=130,margin=55,items=new Map();
 const columns=tables.length>10?4:Math.min(3,Math.max(1,Math.ceil(Math.sqrt(tables.length))));
 const heights=Array(columns).fill(65),ordered=lanes.flat().map(id=>tables.find(table=>table.id===id)).filter(Boolean);
 for(const table of ordered){
  const lane=tables.length>10?lanes.findIndex(list=>list.includes(table.id)):heights.indexOf(Math.min(...heights));
  const fields=visibleColumns(table,full,relations),height=header+fields.length*rowHeight+footer;
  items.set(table.id,{table,fields,x:margin+lane*(width+columnGap),y:heights[lane],width,height,header,rowHeight});
  heights[lane]+=height+70;
 }
 return {items,width:margin*2+columns*width+(columns-1)*columnGap+95,height:Math.max(300,...heights)+20};
}
export function relationPath(rel,layout,index=0){
 const child=layout.items.get(rel.source),parent=layout.items.get(rel.target);if(!child||!parent)return null;
 const childIndex=child.fields.findIndex(column=>column.name===rel.sourceFields[0]),parentIndex=parent.fields.findIndex(column=>column.name===rel.targetFields[0]);
 const sy=child.y+child.header+Math.max(0,childIndex)*child.rowHeight+child.rowHeight/2,ty=parent.y+parent.header+Math.max(0,parentIndex)*parent.rowHeight+parent.rowHeight/2;
 let sx,tx,c1,c2;
 if(child.x===parent.x){sx=child.x+child.width;tx=parent.x+parent.width;c1=c2=sx+40+(index%6)*9;}
 else{const direction=parent.x>child.x?1:-1;sx=direction>0?child.x+child.width:child.x;tx=direction>0?parent.x:parent.x+parent.width;const offset=Math.max(40,Math.min(190,Math.abs(tx-sx)*.5));c1=sx+direction*offset;c2=tx-direction*offset;}
 return {path:`M ${sx} ${sy} C ${c1} ${sy}, ${c2} ${ty}, ${tx} ${ty}`,source:{x:sx,y:sy},target:{x:tx,y:ty},sourceLabelX:sx+(c1>sx?9:-34),targetLabelX:tx+(c2>tx?9:-18)};
}
