// Planned envelopes in mm. Each primitive is local to its selected assembly.
export function buildElectronics(G) {
  const group = (id, name, pos, spread, detail, family = 'electronique') =>
    G.group(id, name, family, pos, spread, detail);
  const box = (p, x, y, z, w, h, d, mat, rot) =>
    G.box(p, [x, y, z], [w, h, d], mat, rot);
  const rod = (p, start, end, radius, mat, sides = 12) =>
    G.cyl(p, start, end, radius, mat, sides);
  const washer = (p, x, y, z, r, h, mat = 'steel', sides = 14) =>
    rod(p, [x, y, z], [x, y+h, z], r, mat, sides);
  function bolt(p, x, y, z, radius = 2) {
    washer(p, x, y, z, radius, 1.1, 'steel', 12);
    washer(p, x, y+1.1, z, radius*.45, .16, 'black', 6);
  }
  // A jacketed cable follows a smooth cubic between its strain reliefs.
  function cable(p, a, b, c, d, radius, mat, steps = 11) {
    let prev = a;
    for (let i=1; i<=steps; i++) {
      const u=i/steps, v=1-u;
      const next = a.map((n,j) => v*v*v*n + 3*v*v*u*b[j] + 3*v*u*u*c[j] + u*u*u*d[j]);
      rod(p, prev, next, radius, mat, 8);
      prev=next;
    }
  }
  // Enclosure with chamfered corner posts, built as an octagon viewed from above.
  function shell(p, x, y, z, w, h, d, chamfer, mat) {
    const a=w/2,b=d/2,c=chamfer;
    const outline=[[-a+c,-b],[a-c,-b],[a,-b+c],[a,b-c],[a-c,b],[-a+c,b],[-a,b-c],[-a,-b+c]];
    const verts=[], indices=[];
    for(const level of [-h/2,h/2]) for(const [px,pz] of outline) verts.push(x+px,y+level,z+pz);
    for(let i=0;i<8;i++) {
      const n=(i+1)%8; indices.push(i,n,n+8,i,n+8,i+8);
      if(i>0 && i<7) indices.push(0,i+1,i,8,8+i,8+i+1);
    }
    G.mesh(p,verts,indices,mat);
  }

  const motor=group('moteur','Moteur brushless 3660',[-32,51,25],[-113,55,38],
    'Hobbywing QuicRun 3660SL G2, 3 150 KV. Le moteur entraîne la transmission par un pignon monté sur son arbre.');
  rod(motor,[0,0,-29],[0,0,29],17.0,'black',40);
  // Machined cooling grooves in the 36 mm motor can.
  for(let z=-23;z<=23;z+=3.3) {
    rod(motor,[0,0,z],[0,0,z+1.9],18,'dark',40);
  }
  for(const z of [-27,26]) rod(motor,[0,0,z],[0,0,z+1.1],17.9,'edge',40);
  for(const z of [-30,28.5]) rod(motor,[0,0,z],[0,0,z+1.4],17.4,'dark',32);
  rod(motor,[0,0,-31.8],[0,0,-30],8.4,'steel',20);
  rod(motor,[0,0,-44.5],[0,0,-31],2.5,'chrome');
  // Pinion representation. Tooth count is illustrative until gearing is chosen.
  rod(motor,[0,0,-41],[0,0,-34],6.1,'steel',24);
  for(let j=0;j<14;j++) {
    const a=2*Math.PI*j/14;
    box(motor,6.1*Math.cos(a),6.1*Math.sin(a),-37.5,2.4,2,6.5,'edge',[0,0,a]);
  }
  for(let j=0;j<3;j++) {
    const a=2*Math.PI*j/3+.3;
    const x=12*Math.cos(a),y=12*Math.sin(a);
    rod(motor,[x,y,-30],[x,y,-30.8],1.6,'steel',8);
    rod(motor,[x*.85,y*.85,29.8],[x*.85,y*.85,30.6],1.2,'steel',8);
  }
  // Raised connector insulators on the endbell.
  for(let j=0;j<3;j++) {
    const x=-7+j*7;
    rod(motor,[x,10,25.7],[x,15,29],2.4,'black');
    rod(motor,[x,15,29],[x,15.8,30],1.55,'amber');
  }
  box(motor,0,17.6,8,13,.45,15,'black');
  box(motor,-3.3,18.1,8,1,.45,11,'red');

  const esc=group('variateur','Variateur QuicRun 120 A',[-33,43,-65],[-100,87,-45],
    'Le WP 10BL120 G2 module la puissance envoyée au moteur. Le ventilateur extrait la chaleur du dissipateur.');
  shell(esc,0,-4,0,39,11,49,3.2,'black');
  shell(esc,0,2,0,36,3.2,44,2.8,'dark');
  for(let x=-15;x<=15;x+=3) box(esc,x,7,.5,1.45,8,37,'alloy');
  shell(esc,0,13,0,34,3.2,34,2,'black');
  const fanY=16;
  // Negative space between blades is visible through the protective grill.
  for(let j=0;j<7;j++) {
    const a=j*2*Math.PI/7, b=a+.38;
    const vx=(r,t)=>[r*Math.cos(t),fanY,r*Math.sin(t)];
    const v=[...vx(4.5,a),...vx(14.1,b),...vx(13.8,b+.42),...vx(6.2,a+.45)];
    G.mesh(esc,v,[0,1,2,0,2,3],'dark');
  }
  washer(esc,0,fanY-.4,0,4.7,1.7,'dark');
  washer(esc,0,fanY+1.3,0,2.1,.35,'red');
  for(let j=0;j<4;j++){
    const a=Math.PI/4+j*Math.PI/2;
    rod(esc,[3.4*Math.cos(a),fanY+2,3.4*Math.sin(a)],
      [16.5*Math.cos(a),fanY+2,16.5*Math.sin(a)],.8,'black');
    bolt(esc,14*Math.cos(a)/.7071,fanY-.55,14*Math.sin(a)/.7071,1.35);
  }
  for (const x of [-12,-6]) {
    washer(esc,x,2,-21.6,3.2,10,'dark');
    washer(esc,x,12,-21.6,2.95,.35,'steel');
    box(esc,x,12.5,-21.6,.42,.15,3.7,'dark');
  }
  // Three phase outputs and removable bullet terminals: represented on the ESC
  // side of the harness so the drive motor separates cleanly in exploded view.
  for (let j=0;j<3;j++){
    let x=-8+j*7;
    const tip=[-6+j*5,17,63+j*1.5];
    cable(esc,[x,1,24.5],[x,24,34],[tip[0],26,52],tip,1.5,'black',12);
    rod(esc,tip,[tip[0],16,tip[2]+5.5],2.1,['blue','amber','red'][j]);
  }
  cable(esc,[15,-1,-21],[45,7,-39],[61,5,-36],[72,9,-22],1.8,'red');
  cable(esc,[9,-1,-22],[40,3,-42],[56,3,-36],[69,8,-22],1.8,'black');
  shell(esc,70,8,-20,9,7,9,1.2,'amber');

  const battery=group('batterie','Accu LiPo 3S',[33,50,-6],[102,63,2],
    'Pack 3S à coque rigide. L’enveloppe et la sortie des fils sont indicatives, à contrôler sur la batterie 5 000 mAh choisie.');
  shell(battery,0,0,0,45,34,131,3.6,'dark');
  shell(battery,0,15.8,0,44,3.8,129.8,3,'black');
  shell(battery,0,-15.6,0,45.7,4.8,131.2,4,'black');
  // Printed hardcase label and the two textile retaining straps.
  box(battery,0,17.9,-1,36,.35,78,'dark');
  for(let j=0;j<3;j++) box(battery,0,18.2,-21+j*3,24,.2,1.6,j===0?'red':'edge');
  for(let j=0;j<3;j++) box(battery,15,18.1,12+j*7,2,.15,4.6,'white');
  for(const z of [-38,37]) {
    box(battery,0,19,z,46.8,2.3,12,'tread');
    for(const x of [-22.8,22.8]) box(battery,x,1,z,2,35.8,12,'tread');
    for(let dx=-19;dx<=19;dx+=4) box(battery,dx,20.25,z,.7,.2,10,'dark');
    box(battery,15.5,20.6,z,10,1.4,14,'steel');
    box(battery,15.5,21.35,z,7,.2,9.6,'black');
  }
  for(let j=0;j<2;j++) {
    let x=-12+j*9;
    washer(battery,x,17.9,-54,3.8,1.6,'black');
    cable(battery,[x,19.5,-54],[x,27,-62],[-8+j*7,24,-77],[-11+j*5,15,-78],1.7,j?'black':'red');
  }
  shell(battery,-8.2,15,-79,10,6.8,8,1.15,'amber');

  const servo=group('servo','Servo de direction',[-28,47,90],[-82,69,110],
    'Un servo à engrenages métalliques actionne la tringlerie. L’enveloppe correspond à un servo standard, le modèle exact reste à choisir.');
  shell(servo,0,0,0,20.2,32,39.2,1.8,'dark');
  for(let y=-8;y<=5;y+=3.2) {box(servo,-10.5,y,0,1.25,1.1,35,'black');box(servo,10.5,y,0,1.25,1.1,35,'black');}
  shell(servo,0,15,0,20.8,4,40,1.8,'black');
  for(let z of [-21.7,21.7]) {
    box(servo,0,7,z,21.8,3,5,'black');
    for(const x of [-7.6,7.6]) bolt(servo,x,8.5,z,1.65);
  }
  washer(servo,0,16.3,7.5,7.4,2.4,'dark',20);
  washer(servo,0,18.7,7.5,4,2.6,'chrome',16);
  box(servo,8.5,22.5,7.5,22,3,6.5,'alloy');bolt(servo,0,24.05,7.5,2);
  rod(servo,[18,23.6,7.5],[18,27.2,7.5],2.25,'chrome');
  rod(servo,[18,27,7.5],[41,24,15],1.3,'steel');
  G.ball(servo,[41,24,15],[2.45,2.45,2.45],'dark');

  const receiver=group('recepteur','Récepteur radio',[-32,42,-108],[-63,65,-126],
    'Le récepteur fournit les ordres de la radiocommande. Une voie auxiliaire permettra de reprendre la main sur le mode Web.');
  shell(receiver,0,0,0,26,13,31,2.5,'black');shell(receiver,0,6,0,24,2.2,28,2,'dark');
  box(receiver,0,7.35,1,18,.4,15,'dark');box(receiver,-5.7,7.64,1,1.6,.18,10,'red');
  for(let row=0;row<2;row++)for(let col=0;col<3;col++)box(receiver,-5+col*2.54,3+row*2.54,16.9,1,1,3.1,'amber');
  cable(receiver,[11,0,-11],[21,1,-29],[22,33,-9],[20,47,0],.65,'black',15);

  const tray=group('support-pi','Platine électronique imprimée',[-4,82,-23],[5,108,-69],
    'Proposition de platine en PETG pour surélever le Raspberry Pi. Les points d’ancrage doivent être relevés sur le châssis assemblé.','impression');
  shell(tray,0,0,0,65,3.6,95,5,'dark');
  // Walled open deck and standoffs. The board sits above the upper battery strap.
  for(const x of [-31,31]) box(tray,x,2.6,0,2.8,5.5,83,'dark');
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const x=sx*24.5,z=sz*29;
    washer(tray,x,1.8,z,3.4,5,'dark');
    washer(tray,x,6.8,z,1.5,.15,'black',12);
    // Offset feet leave the transmission and battery bay clear underneath.
    rod(tray,[sx*29,-1.5,sz*39],[sx*46,-49,sz*42],2.8,'dark',8);
    box(tray,sx*46,-48.5,sz*42,10,3.3,11.5,'dark');bolt(tray,sx*46,-46.85,sz*42,1.8);
  }

  const pi=group('raspberry','Raspberry Pi 4',[-4,90,-23],[-18,155,-43],
    'Ordinateur embarqué pour la caméra et le réseau. Une alimentation 5 V régulée dédiée est prévue. Les connecteurs sont représentés pour faciliter leur identification.');
  shell(pi,0,0,0,56,1.6,85,2.8,'green');
  for(const x of [-24.5,24.5])for(const z of [-29,29]) {washer(pi,x,.81,z,2.9,.18,'amber');bolt(pi,x,.99,z,1.75);}
  // Ethernet and dual USB2/3 connectors face the rear of the mounting deck.
  for(const [x,w,depth,insert] of [[-17.5,15.5,20.8,'black'],[.4,13.4,15.9,'blue'],[17.8,13.4,15.9,'black']]){
    box(pi,x,7.3,-43+depth/2,w,13,depth,'alloy');
    const end=-43.1;
    box(pi,x,7.3,end,w-2,10.5,.55,'black');
    if(insert==='blue'||x>0)for(const y of [4.8,9.7]){
      box(pi,x,y,end-.35,w-3.1,1.7,.65,insert);
      for(let n=-3;n<=3;n+=2)box(pi,x+n,y+.95,end-.65,.55,.3,.4,'amber');
    }else{
      box(pi,x,9.4,end-.4,8.2,2.6,.4,'dark');
      box(pi,x-4.9,12.2,end-.4,1.4,.9,.4,'green'); box(pi,x+4.9,12.2,end-.4,1.4,.9,.4,'amber');
    }
  }
  // 40-pin header running along the board edge.
  box(pi,22.5,2.4,8.5,5,3.2,51,'black');
  for(let j=0;j<20;j++)for(let row=0;row<2;row++){
    box(pi,21.2+2.54*row,4.9,-15.5+j*2.54,.65,3.4,.65,'amber');
  }
  box(pi,-3,1.8,3,14.4,2.0,14.4,'dark');box(pi,-3,3.0,3,12.7,.8,12.7,'alloy');
  box(pi,9.8,1.7,17,7.8,1.9,12,'black');
  box(pi,-12,1.62,-12,8.6,1.7,8.6,'black');
  // Radio shield, CSI latch, micro HDMI sockets and USB-C power.
  box(pi,9.6,1.85,34,14,2.1,10.4,'steel');
  box(pi,-10.1,2.4,22,17.2,3.1,3.4,'white');box(pi,-10.1,4.0,22.8,16.3,.5,1.5,'dark');
  for(const z of [5.6,18.5,34]) {
    const w=z===34?8.7:7.4;
    box(pi,-26.3,2.85,z,6.5,4.1,w,'alloy');box(pi,-29.65,2.8,z,.3,2,w-2,'black');
  }
  for(const [x,z] of [[-18,11],[9,-9],[13,-7],[-14,-19],[5,16],[1,21],[13,23],[-17,31]]){
    box(pi,x,1.38,z,2.55,1.1,1.3,'amber');
    box(pi,x-1.07,1.42,z,.5,1.19,1.38,'steel');box(pi,x+1.07,1.42,z,.5,1.19,1.38,'steel');
  }

  const mcu=group('controleur','Contrôleur de pilotage',[47,84,33],[86,113,34],
    'Ce microcontrôleur dédié reçoit les commandes du site et supervise la sélection radio/Web. Carte et implantation proposées pour la version RC.');
  shell(mcu,0,0,0,20,1.7,40,1.6,'green');
  box(mcu,0,1.7,0,7.2,1.8,7.2,'black');box(mcu,0,2.9,-16.9,8.5,4.1,6,'alloy');
  box(mcu,0,2.7,-20,6.5,2.2,.35,'black');box(mcu,0,1.6,7.8,3.5,1.5,3.1,'steel');
  for(const x of [-8,8])for(let i=0;i<12;i++)washer(mcu,x,.9,-13.75+i*2.5,.65,.28,'amber',8);
  box(mcu,0,2.7,15.2,14,4.2,4,'black');for(let i=0;i<5;i++)box(mcu,-5.1+i*2.54,4.95,15.2,.7,.35,.7,'amber');

  const regulator=group('alimentation','Alimentation 5 V régulée',[47,84,-13],[97,92,-41],
    'Convertisseur dédié au Raspberry Pi. Son calibre et sa plage d’entrée devront convenir à la batterie 3S et à la consommation mesurée.');
  shell(regulator,0,0,0,24,1.8,29,1.5,'green');
  box(regulator,-4,4.3,0,10,7,11,'dark');box(regulator,-4,7.9,0,8.6,.35,9.8,'steel');
  box(regulator,5,2.1,3.2,5.3,2.4,7,'black');
  for(const z of [-9.6,9.6]) {washer(regulator,5,1,z,2.8,4.7,'dark');washer(regulator,5,5.7,z,2.7,.35,'steel');}
  for(const x of [-8.2,8.2])for(const z of [-11,11])washer(regulator,x,1,z,1.25,.2,'amber',12);

  const bracket=group('support-camera','Support caméra amorti',[0,169,-11],[15,100,119],
    'Support proposé en PETG avec patins souples en TPU. La hauteur de la caméra et son passage dans la carrosserie seront ajustés sur le véhicule réel.','impression');
  shell(bracket,0,0,0,35,3.5,30,3,'dark');
  for(const x of [-12,12])for(const z of [-9,9]){
    washer(bracket,x,-4,z,4,2.4,'rubber');bolt(bracket,x,1.8,z,1.7);
  }
  for(const x of [-12,12]){
    box(bracket,x,15.6,-3.2,3.6,29,5.5,'dark');
    rod(bracket,[x,1.6,10],[x,26,-3.2],2.1,'dark',8);
  }
  box(bracket,0,27.8,-3.2,27,3.8,6.2,'dark');
  for(const x of [-10,10])washer(bracket,x,29.6,-3.2,2.5,2.3,'rubber');

  const camera=group('camera','Caméra embarquée',[0,197,-8],[15,169,131],
    'Caméra orientée vers l’avant pour la conduite depuis le site. Volume indicatif du module et de son optique, installation fixe sur patins amortissants.');
  box(camera,0,0,0,25,24,1.5,'green');
  box(camera,0,-1,2.35,13,13,3.2,'black');
  rod(camera,[0,-1,3.5],[0,-1,8],5.55,'dark',24);
  rod(camera,[0,-1,8],[0,-1,10.5],5.8,'black',28);
  rod(camera,[0,-1,10.5],[0,-1,10.87],4.85,'chrome',24);
  rod(camera,[0,-1,10.87],[0,-1,11.31],4.1,'glass',24);
  G.ball(camera,[-1.1,.3,11.22],[1.05,.55,.2],'light');
  box(camera,0,-9.3,-1.5,16,3.6,3,'white');
  for(const x of [-10.5,10.5])for(const y of [-9.7,9.7]){
    rod(camera,[x,y,.76],[x,y,1.04],1.4,'amber',10);
    rod(camera,[x,y,1.04],[x,y,1.15],.85,'dark',8);
  }
  // Flat CSI ribbon leaving the optical board. Separate leaves survive exploded views.
  const ribbon=group('nappe','Nappe de caméra',[0,91,0],[9,134,66],
    'La nappe CSI relie le module optique au Raspberry Pi. Le trajet représenté doit conserver du jeu et dégager la direction.');
  const path=[[-14,1,1],[-14,5,7],[-11,12,10],[-5,23,8],[0,37,0],[0,53,-9],[0,70,-15],[0,85,-18],[0,92,-16],[0,96,-10]];
  const rz=[],idx=[];
  for(let i=0;i<path.length;i++){
    const [x,y,z]=path[i];rz.push(x-5,y,z,x+5,y,z);
    if(i>0){const a=2*i-2;idx.push(a,a+1,a+3,a,a+3,a+2);}
  }
  G.mesh(ribbon,rz,idx,'white');
}
