(() => {
 'use strict';
 const $=id=>document.getElementById(id),api=window.inktoberTransport.github;
 const workflow='inktober-pages.yml',path='.github/workflows/'+workflow;
 let selected=null,busy=false,epoch=0,timer=null;
 function repositoryName(raw){
  const text=raw.trim();let name=text;
  if(/^https?:\/\//i.test(text)){
   const url=new URL(text);if(url.username||url.password||url.search||url.hash)throw new Error('Utilisez le nom du dépôt ou son lien GitHub.');
   if(url.hostname==='github.com'){const match=url.pathname.match(/^\/egalland\/([a-z0-9_.-]+)\/?$/i);if(!match)throw new Error('Choisissez un dépôt du compte egalland.');name=match[1].replace(/\.git$/,'');}
   else if(url.origin==='https://egalland.github.io'){name=url.pathname.replace(/^\//,'').replace(/\/$/,'');}
   else throw new Error('Cette adresse n’est pas un dépôt GitHub du compte egalland.');
  }
  if(!/^[a-z0-9_-][a-z0-9_.-]*$/i.test(name)||['egalland.github.io','inktober-2026','.','..'].includes(name.toLowerCase()))throw new Error('Indiquez le nom d’un dépôt d’app, par exemple cactocalypse.');
  return name;
 }
 function message(text){$('repository-status').textContent=text;}
 function reset(){epoch++;if(timer)clearTimeout(timer);timer=null;selected=null;$('publish-repository').hidden=true;$('repository-preview').hidden=true;$('repository-workflow').hidden=true;message('');}
 $('day-url').addEventListener('input',reset);
 document.getElementById('prompt-dialog').addEventListener('close',reset);
 addEventListener('github-calendar-auth',()=>{if(!window.inktoberTransport.connected)reset();});
 function controls(on){busy=on;$('check-repository').disabled=on;$('publish-repository').disabled=on;}
 $('check-repository').addEventListener('click',async()=>{
  if(busy)return;reset();const current=epoch;controls(true);message('Vérification du dépôt…');
  try{
   const name=repositoryName($('day-url').value),base='/repos/egalland/'+name;
   const repo=await api(base);if(repo.owner.id!==31864638||repo.archived)throw new Error('Ce dépôt ne peut pas être publié ici.');
   const ref=repo.default_branch,head=await api(base+'/commits/'+encodeURIComponent(ref));
   const tree=await api(base+'/git/trees/'+head.commit.tree.sha+'?recursive=1');
   if(tree.truncated)throw new Error('Dépôt trop volumineux pour cette vérification.');
   const files=new Set(tree.tree.filter(e=>e.type==='blob').map(e=>e.path));let build=false;
   if(files.has('package.json')){const pkg=await api(base+'/contents/package.json?ref='+head.sha);const value=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(pkg.content.replace(/\s/g,'')),c=>c.charCodeAt(0))));build=!!value.scripts?.build;}
   if(!build&&!['index.html','dist/index.html','build/index.html','out/index.html'].some(p=>files.has(p)))throw new Error('Le dépôt doit contenir index.html ou un package.json avec une commande build.');
   if(current!==epoch)return;selected={name,base,branch:ref,head:head.sha};$('publish-repository').hidden=false;
   message(`Dépôt ${name} vérifié · ${build?'Construction npm prévue':'Fichiers statiques détectés'}. Publiez, testez, puis enregistrez la case.`);
  }catch(error){if(current===epoch)message(error.message);}
  finally{controls(false);}
 });
 async function poll(selection,current,minId,expectedSha){
  if(current!==epoch||!window.inktoberTransport.connected)return;
  try{
   const data=await api(selection.base+'/actions/workflows/'+workflow+'/runs?per_page=10');
   if(current!==epoch)return;
   const run=data.workflow_runs.find(r=>r.id>minId&&r.head_branch===selection.branch&&(!expectedSha||r.head_sha===expectedSha));
   if(run){const link=$('repository-workflow');link.href=run.html_url;link.hidden=false;
    if(run.status==='completed'){
     if(run.conclusion!=='success'){message('La construction ou la publication a échoué. Consultez le détail GitHub et corrigez le dépôt avant de réessayer.');return;}
     const pages=await api(selection.base+'/pages');if(current!==epoch)return;
     const link=$('repository-preview');link.href=pages.html_url||`https://egalland.github.io/${selection.name}/`;link.hidden=false;
     message('App publiée. Testez-la avec le lien ci-dessous, puis enregistrez la case si elle fonctionne.');return;
    }
    message('GitHub construit et publie l’app…');
   }
   if(Date.now()-selection.started>900000){message('La construction prend plus de temps. Suivez-la sur GitHub, puis vérifiez à nouveau le dépôt.');return;}
   timer=setTimeout(()=>poll(selection,current,minId,expectedSha),5000);
  }catch(error){if(current!==epoch)return;if(error.status===404&&Date.now()-selection.started<60000){timer=setTimeout(()=>poll(selection,current,minId,expectedSha),3000);return;}message(error.message+' Utilisez « Suivre la construction » pour vérifier la publication.');}
 }
 $('publish-repository').addEventListener('click',async()=>{
  if(busy||!selected)return;const selection={...selected},current=epoch;controls(true);message('Préparation de la publication GitHub…');
  try{
   if(!window.inktoberTransport.connected)throw new Error('Connectez GitHub avec un jeton autorisé sur ce dépôt d’app.');
   const response=await fetch('/inktober-2026/app-pages.yml',{cache:'no-store'});if(!response.ok)throw new Error('Modèle de construction introuvable.');
   const content=(await response.text()).replace('__DEFAULT_BRANCH__',JSON.stringify(selection.branch));
   let existing=null;try{existing=await api(selection.base+'/contents/'+path+'?ref='+encodeURIComponent(selection.branch));}catch(error){if(error.status!==404)throw error;}
   if(existing){const value=new TextDecoder().decode(Uint8Array.from(atob(existing.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));if(value!==content)throw new Error('Ce dépôt possède déjà un workflow Inktober différent. Adaptez-le sur GitHub pour conserver sa configuration.');}
   let pages=null;try{pages=await api(selection.base+'/pages');}catch(error){if(error.status!==404)throw error;}
   if(pages){if(pages.build_type!=='workflow')await api(selection.base+'/pages',{method:'PUT',body:{build_type:'workflow'}});}
   else await api(selection.base+'/pages',{method:'POST',body:{build_type:'workflow'}});
   let expectedSha=null,minId=0;
   if(existing){const runs=await api(selection.base+'/actions/workflows/'+workflow+'/runs?per_page=1');minId=runs.workflow_runs[0]?.id||0;await api(selection.base+'/actions/workflows/'+workflow+'/dispatches',{method:'POST',body:{ref:selection.branch}});}
   else{
    let binary='';for(const b of new TextEncoder().encode(content))binary+=String.fromCharCode(b);
    const result=await api(selection.base+'/contents/'+path,{method:'PUT',body:{message:'Add Inktober static app build and Pages publication',content:btoa(binary),branch:selection.branch}});expectedSha=result.commit.sha;
   }
   if(current!==epoch)return;selection.started=Date.now();const link=$('repository-workflow');link.href=`https://github.com/egalland/${selection.name}/actions/workflows/${workflow}`;link.hidden=false;message('Publication lancée sur GitHub. Le lien de test apparaîtra après réussite.');void poll(selection,current,minId,expectedSha);
  }catch(error){if(current===epoch)message(error.message);}
  finally{controls(false);}
 });
})();
