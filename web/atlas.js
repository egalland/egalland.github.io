(() => {
  const directory = document.querySelector('#directory');
  const search = document.querySelector('#atlasQuery');
  const roomNames = ['Atelier GitHub', 'Studio Sites', 'Réacteur', 'Salle des archives'];
  const roomIds = [0, 1, 3];
  const dateFormat = new Intl.DateTimeFormat('fr-FR', {dateStyle:'medium', timeZone:'Europe/Paris'});
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  const opened = read('orbite-folder-opens');
  const cache = read('orbite-push-dates');
  let inventory, folders = [], room = 'all', signature = '', fetching = false;
  const latest = (...values) => Math.max(0, ...values.map(v => Date.parse(v) || 0));
  function classify() {
    if (!inventory) return;
    const cutoff = new Date();
    const month = cutoff.getUTCMonth();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear()-1);
    if (cutoff.getUTCMonth() !== month) cutoff.setUTCDate(0);
    function folder(row, repo) {
      const key = (repo?'repo/':'site/') + row.id;
      const last = latest(opened[key], repo ? row.activityAt : row.date,
        repo && cache.dates?.[row.id], repo && window.orbitInitialDates?.[row.id]);
      const deck = last && last < cutoff.getTime() ? 3 : repo ? 0 : 1;
      return {...row, repo, key, last, deck};
    }
    folders = [...inventory.repos.map(r=>folder(r,true)), ...inventory.sites.map(s=>folder(s,false))]
      .sort((a,b)=>a.name.localeCompare(b.name,'fr') || a.key.localeCompare(b.key));
    const groups = roomNames.map((_,i)=>folders.filter(f=>f.deck===i));
    const next = JSON.stringify(folders.map(f=>[f.key,f.name,f.deck,f.last,f.url]));
    if (next !== signature) {
      window.station?.stock(groups);
      signature = next;
    }
    window.drawProjectMap?.(folders);
    document.querySelector('#projectTotal').textContent = folders.length;
    for(const i of roomIds) {
      const button=document.querySelector('[data-focus="'+i+'"]');
      button.textContent=roomNames[i]+' · '+groups[i].length;
    }
    render();
  }
  function show(item) {
    const body=document.querySelector('#dialogbody');
    const title=document.createElement('h2'), meta=document.createElement('p'), activity=document.createElement('p');
    title.textContent=item.name;
    meta.textContent=roomNames[item.deck]+' · '+(item.repo?'GitHub / '+item.owner:'Site ChatGPT');
    activity.textContent=item.last?'Dernière activité connue le '+dateFormat.format(item.last):'Date d’activité inconnue';
    body.replaceChildren(title,meta,activity);
    if (/^https:\/\//i.test(item.url || '')) {
      const link=document.createElement('a');
      link.className='btn folder-open';link.textContent='Ouvrir le projet';link.href=item.url;link.target='_blank';link.rel='noopener';
      link.onclick=()=>{opened[item.key]=new Date().toISOString();save('orbite-folder-opens',opened);classify();document.querySelector('#dialog').close()};
      body.append(link);
    }
    document.querySelector('#dialog').showModal();
  }
  function render() {
    directory.replaceChildren();
    const query=normalize(search.value.trim());
    const visible=folders.filter(f=>(room==='all'||f.deck===Number(room))&&normalize(f.name+' '+(f.owner||'')).includes(query));
    document.querySelector('#atlasCount').textContent=visible.length+' / '+folders.length+' dossiers';
    document.querySelectorAll('[data-room]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.room===room));
    for(const i of roomIds) {
      if(room!=='all' && Number(room)!==i) continue;
      const list=visible.filter(f=>f.deck===i);
      const h=document.createElement('h3');h.textContent=roomNames[i]+' · '+list.length;directory.append(h);
      if(!list.length){const p=document.createElement('p');p.textContent=query?'Aucun dossier correspondant.':'Aucun dossier dans cette salle.';directory.append(p);continue}
      const grid=document.createElement('div');grid.className='projectgrid hold-grid room-'+i;
      for (const f of list) {
        const b=document.createElement('button'),name=document.createElement('b'),info=document.createElement('small');
        name.textContent=f.name;info.textContent=(f.repo?'GitHub':'Site')+' · '+(f.last?dateFormat.format(f.last):'Date inconnue');
        b.append(name,info);b.onclick=()=>show(f);grid.append(b);
      }
      directory.append(grid);
    }
  }
  function setRoom(value) {room=value;render()}
  document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>{
    const value=b.dataset.room;window.station?.selectDeck(value==='all'?-1:Number(value));setRoom(value);
  });
  window.addEventListener('deck-focus',e=>setRoom(roomIds.includes(e.detail)?String(e.detail):'all'));
  window.addEventListener('folder-pick',e=>show(e.detail));
  window.addEventListener('browse-archives',()=>document.querySelector('#projects').scrollIntoView());
  search.oninput=()=>{render();window.drawProjectMap?.(folders)};
  async function refreshPublicDates() {
    if(fetching || Date.now()-(cache.at||0)<3600000)return;
    fetching=true;
    try {
      const ids=new Set(inventory.repos.filter(r=>r.visibility==='public' && r.owner?.toLowerCase()==='egalland').map(r=>r.id));
      if(!ids.size)return;
      const dates={...cache.dates};
      for(let page=1;;page++){
        const response=await fetch('https://api.github.com/users/egalland/repos?per_page=100&page='+page);
        if(!response.ok)throw Error();
        const rows=await response.json();
        for(const row of rows)if(ids.has(String(row.id)) && Date.parse(row.pushed_at))dates[row.id]=row.pushed_at;
        if(rows.length<100)break;
      }
      cache.at=Date.now();cache.dates=dates;save('orbite-push-dates',cache);classify();
    } catch {} finally {fetching=false}
  }
  window.updateAtlas=data=>{inventory=data;classify();refreshPublicDates()};
})();
