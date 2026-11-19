/* Dimensions in mm. An illustrative MT410 2.0 build with a custom pickup shell.
 * Coordinates are local to each selectable assembly. Positive Z points forward.
 */
export function buildMechanics(G) {
  const {group, box, ball, cyl, mesh} = G;
  const tau = Math.PI * 2;
  const add = (a, b) => a.map((n, i) => n + b[i]);
  const sub = (a, b) => a.map((n, i) => n - b[i]);
  const scale = (p, f) => p.map(n => n * f);
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const unit = p => scale(p, 1 / (Math.hypot(...p) || 1));
  const lerp = (a, b, t) => add(a, scale(sub(b, a), t));
  const face = (part, points, surface) => {
    const indices = [];
    for (let i = 1; i < points.length - 1; ++i) indices.push(0, i, i + 1);
    mesh(part, points.flat(), indices, surface);
  };
  // A closed prism with a polygonal cross section in the horizontal plane.
  function plate(part, contour, bottom, height, topMaterial, sideMaterial = topMaterial) {
    const lower = contour.map(([x, z]) => [x, bottom, z]);
    const upper = contour.map(([x, z]) => [x, bottom + height, z]);
    face(part, [...upper].reverse(), topMaterial);
    face(part, lower, topMaterial);
    for (let i = 0; i < contour.length; i++) {
      const j = (i + 1) % contour.length;
      face(part, [lower[j], lower[i], upper[i], upper[j]], sideMaterial);
    }
  }
  function strut(part, a, b, width, depth, material) {
    const along = unit(sub(b, a));
    const crossAxis = unit(cross(along, Math.abs(along[1]) > .94 ? [0,0,1] : [0,1,0]));
    const high = scale(unit(cross(crossAxis, along)), depth / 2);
    const side = scale(crossAxis, width / 2);
    const quad = center => [
      add(add(center,side),high), add(sub(center,side),high),
      sub(sub(center,side),high), sub(add(center,side),high)
    ];
    const e = quad(a), f = quad(b);
    face(part, [...e].reverse(), material);
    face(part, f, material);
    for (let i=0;i<4;i++) face(part,[e[i],f[i],f[(i+1)%4],e[(i+1)%4]],material);
  }
  function screw(part, position, radius = 2.8) {
    const [x,y,z] = position;
    cyl(part,[x,y,z],[x,y+1.4,z],radius,'steel',12);
    cyl(part,[x,y+1.41,z],[x,y+1.5,z],radius*.45,'black',6);
  }
  function ringX(part, profile, material, count = 44) {
    const vertices=[], indices=[];
    for (const [x,r] of profile) {
      for (let i=0;i<count;i++) {
        const a=i*tau/count;
        vertices.push(x,r*Math.cos(a),r*Math.sin(a));
      }
    }
    for (let j=0;j<profile.length-1;j++) {
      for (let i=0;i<count;i++) {
        const a=j*count+i,b=j*count+(i+1)%count;
        const c=b+count,d=a+count;
        indices.push(a,b,d,b,c,d);
      }
    }
    mesh(part,vertices,indices,material);
  }

  const frame = group('plate','Platine de châssis','chassis',[0,28,0],[0,-58,0],
    'La platine en aluminium porte les deux trains roulants, la transmission et l’électronique. Son contour est représenté à titre illustratif.');
  const deck=[[-37,-145],[35,-145],[48,-127],[60,-94],[63,-68],[63,73],
    [53,112],[35,143],[-34,143],[-53,115],[-63,72],[-63,-75],[-56,-115]];
  plate(frame,deck,-2,4,'dark','edge');
  for (const sign of [-1,1]) {
    const rail=[ [sign*55,-116],[sign*59,-112],[sign*65,-72],
      [sign*65,70],[sign*57,106],[sign*52,111],[sign*59,70],[sign*59,-70] ];
    plate(frame,rail,1,8,'black');
    for (const z of [-105,-73,-48,46,76,105]) screw(frame,[sign*(Math.abs(z)>90?42:53),2,z]);
    for (const z of [-134,131]) {
      strut(frame,[sign*25,3,z],[sign*31,20,z*.58],5,5,'dark');
      cyl(frame,[sign*20,3,z],[sign*20,8,z],3.5,'black',14);
    }
  }
  const spur = group('center-diff','Différentiel central et couronne','transmission',[0,53,1],[0,96,12],
    'La couronne reçoit le couple du pignon moteur. Les deux sorties entraînent les arbres longitudinaux.');
  cyl(spur,[0,0,-21],[0,0,18],10.3,'dark',24);
  for(const z of [-22,17]){
    cyl(spur,[0,0,z],[0,0,z+3],13,'steel',28);
    cyl(spur,[0,0,z+2],[0,0,z+6],7,'edge',20);
  }
  cyl(spur,[0,0,-16.1],[0,0,-11.1],25.5,'dark',64);
  for(let i=0;i<48;i++) {
    const a=i*tau/48;
    box(spur,[Math.cos(a)*25.9,Math.sin(a)*25.9,-13.6],[2.6,2,5],'steel',[0,0,a]);
  }
  for(const x of [-18,18]) {
    box(spur,[x,-10,-16],[6,27,8],'black');
    box(spur,[x,-18,-16],[11,7,17],'black');
    screw(spur,[x,3.5,-16],2.2);
  }
  for(const end of [-1,1]){
    cyl(spur,[0,0,end*19],[0,0,end*28],6.5,'steel',16);
    cyl(spur,[0,0,end*24],[0,0,end*31],5.1,'dark',16);
  }

  function middleShaft(front) {
    const d = front ? 1 : -1, length = front ? 98 : 98;
    const part=group(front?'prop-front':'prop-rear',front?'Arbre central avant':'Arbre central arrière',
      'transmission',[0,53,80*d],[0,55,33*d],
      'L’arbre relie la sortie du différentiel central au couple conique du train roulant.');
    const z=length/2-5;
    cyl(part,[0,0,-z],[0,0,z],3.7,'alloy',16);
    for(const e of [-1,1]){
      cyl(part,[0,0,e*(z-6)],[0,0,e*(z-1)],4.8,'steel',14);
      ball(part,[0,0,e*z],[4.3,4.3,4.3],'steel');
      cyl(part,[-5,0,e*z],[5,0,e*z],1.35,'chrome',8);
    }
  }
  middleShaft(true); middleShaft(false);

  function bulkhead(d) {
    const name=d>0?'avant':'arrière';
    const part=group(d>0?'gearbox-front':'gearbox-rear','Cellule et différentiel '+name,
      'transmission',[0,55,d*143],[0,42,d*63],
      'Le carter referme le couple conique et le différentiel. Ses sorties alimentent les cardans des roues.');
    ball(part,[0,1,0],[29,23,23],'dark');
    box(part,[0,-12,0],[56,17,34],'black');
    for(const s of [-1,1]){
      cyl(part,[s*16,1,0],[s*27,1,0],16,'black',24);
      cyl(part,[s*26,1,0],[s*29,1,0],11,'edge',20);
      cyl(part,[s*29,1,0],[s*36,1,0],7.5,'steel',18);
      cyl(part,[s*34,1,0],[s*43,1,0],6,'dark',16);
      for(const z of [-12,0,12]) {
        box(part,[s*15,9,z],[4.5,16,2.5],'black');
      }
      screw(part,[s*20,13,-10],2.4);
      screw(part,[s*20,13,10],2.4);
    }
    cyl(part,[0,0,-d*12],[0,-2,-d*32],8.5,'black',16);
  }
  function tower(d){
    const name=d>0?'avant':'arrière';
    const part=group(d>0?'tower-front':'tower-rear','Tour d’amortisseurs '+name,
      'suspension',[0,53,143*d],[0,80,d*78],
      'Cette tour relie les têtes d’amortisseurs à la cellule et fournit plusieurs positions d’ancrage.');
    const faceZ=-d*6;
    strut(part,[-31,8,faceZ],[31,8,faceZ],7,12,'dark');
    for(const s of [-1,1]){
      strut(part,[s*19,10,faceZ],[s*43,59,faceZ],10,6.5,'alloy');
      strut(part,[s*32,56,faceZ],[s*53,57,faceZ],11,6.5,'dark');
      strut(part,[s*7,28,faceZ],[s*38,52,faceZ],5.5,4,'dark');
      for(const x of [39,46,52]) {
        cyl(part,[s*x,57,faceZ],[s*x,57,faceZ-d*3],2.5,'black',12);
      }
    }
    strut(part,[-17,30,faceZ],[17,30,faceZ],6,7,'dark');
    for(const x of [-26,26]) cyl(part,[x,12,faceZ],[x,12,faceZ-d*4],3.6,'chrome',12);
  }
  for(const d of [-1,1]) {bulkhead(d);tower(d);}

  // Each shaft and spring remains attached to its own assembly when exploded.
  function springMesh(part, start, end, turns=7.5) {
    const axis=unit(sub(end,start)), side=unit(cross(axis,[0,0,1])), front=unit(cross(axis,side));
    const radius=7.5, wire=1.35, segments=90, facets=6;
    const vertices=[], indices=[];
    for(let i=0;i<=segments;i++){
      const t=i/segments,a=t*tau*turns;
      const radial=add(scale(side,Math.cos(a)),scale(front,Math.sin(a)));
      const center=add(lerp(start,end,t),scale(radial,radius));
      for(let j=0;j<facets;j++){
        const b=j*tau/facets;
        vertices.push(...add(center,add(scale(radial,wire*Math.cos(b)),scale(axis,wire*Math.sin(b)))));
      }
      if(i>0)for(let j=0;j<facets;j++){
        const a0=(i-1)*facets+j,b0=(i-1)*facets+(j+1)%facets;
        indices.push(a0,b0,a0+facets,b0,b0+facets,a0+facets);
      }
    }
    mesh(part,vertices,indices,'spring');
  }
  function shock(s,d,corner,label) {
    const part=group('shock-'+corner,'Amortisseur '+label,'suspension',[s*76,75,d*143],
      [s*83,100,d*61],'Le piston se déplace dans un corps rempli d’huile. La bague filetée règle la précontrainte du ressort.');
    const low=[s*24,-29,d*7], high=[-s*30,36,-d*6];
    const point=t=>lerp(low,high,t);
    cyl(part,point(.07),point(.61),2.35,'chrome',14);
    cyl(part,point(.46),point(.89),6.4,'oil',20);
    for(let i=0;i<6;i++)cyl(part,point(.57+i*.044),point(.582+i*.044),6.8,'edge',16);
    cyl(part,point(.79),point(.86),8.3,'dark',20);
    cyl(part,point(.10),point(.15),8.6,'black',20);
    cyl(part,point(.86),point(.95),7,'alloy',18);
    springMesh(part,point(.17),point(.79));
    for(const pos of [low,high]){
      ball(part,pos,[5.5,5.5,4.4],'black');
      cyl(part,add(pos,[0,0,-4.8]),add(pos,[0,0,4.8]),2.8,'steel',14);
    }
  }
  function suspension(s,d,corner,label){
    const part=group('arms-'+corner,'Triangle et biellette '+label,'suspension',
      [s*67,42,d*143],[s*69,-34,d*38],
      'Le triangle inférieur pivote sur ses axes. La biellette supérieure guide le porte-fusée et permet de régler le carrossage.');
    const innerA=[-s*35,-2,-d*24],innerB=[-s*35,-2,d*22];
    const outerA=[s*46,3,-d*4],outerB=[s*46,3,d*7];
    strut(part,innerA,outerA,13,8,'black');
    strut(part,innerB,outerB,13,8,'black');
    strut(part,outerA,outerB,9,10,'black');
    strut(part,lerp(innerA,outerA,.4),lerp(innerB,outerB,.58),6,6,'dark');
    cyl(part,innerA,innerB,6,'dark',16);
    cyl(part,add(innerA,[0,0,-d*4]),add(innerB,[0,0,d*4]),2.8,'steel',12);
    cyl(part,[s*44,4,-d*10],[s*44,4,d*12],4,'steel',12);
    const upperA=[-s*34,28,-d*2],upperB=[s*44,30,d];
    cyl(part,upperA,upperB,2.4,'steel',12);
    cyl(part,lerp(upperA,upperB,.38),lerp(upperA,upperB,.62),3.4,'edge',6);
    for(const pos of [upperA,upperB])ball(part,pos,[5,4,4.5],'dark');
    if(d>0){
      const tieIn=[-s*33,12,-d*20],tieOut=[s*46,14,-d*14];
      cyl(part,tieIn,tieOut,2.2,'steel',12);
      cyl(part,lerp(tieIn,tieOut,.34),lerp(tieIn,tieOut,.56),3.2,'edge',6);
      for(const pos of [tieIn,tieOut])ball(part,pos,[4,3.5,4],'dark');
    }
    const knuckle=group('hub-'+corner,'Porte-fusée '+label,'suspension',
      [s*117,60,d*143],[s*103,12,d*36],
      'Le porte-fusée reçoit les roulements de roue et s’articule entre le triangle et la biellette.');
    ball(knuckle,[0,1,0],[8.5,16,10],'dark');
    strut(knuckle,[0,-14,0],[-s*5,13,0],12,7,'black');
    cyl(knuckle,[-s*5,4,0],[s*10,4,0],8.5,'steel',18);
    cyl(knuckle,[s*6,4,0],[s*12,4,0],10,'alloy',6);
    const axle=group('cv-'+corner,'Cardan '+label,'transmission',[s*77,59,d*143],
      [s*67,36,d*31],
      'Le cardan transmet le couple à la roue pendant le débattement de la suspension.');
    const a=[-s*40,-3,0],b=[s*43,5,0];
    cyl(axle,a,b,2.65,'steel',14);
    for(const pos of [a,b]){
      ball(axle,pos,[5.2,5.2,5.2],'dark');
      cyl(axle,add(pos,[0,0,-5.5]),add(pos,[0,0,5.5]),1.5,'chrome',8);
    }
  }

  function treadBlocks(part) {
    // Four staggered rows of chevron lugs with a smaller cap for bevel highlights.
    const vertices=[],indices=[];
    for(let row=0;row<4;row++){
      const xc=(row-1.5)*11.8, outer=row===0||row===3;
      const half=outer?5.6:5.3, lean=row<2?1:-1;
      for(let i=0;i<27;i++){
        const a=tau*(i+(row%2)*.45)/27, base=vertices.length/3;
        for(const upper of [false,true]){
          const span=(upper?.034:.043), hx=half*(upper?.81:1), r=(outer?59.4:60.0)+(upper?3.9:.05);
          for(const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
            const theta=a+v*span+lean*u*.033;
            vertices.push(xc+u*hx,r*Math.cos(theta),r*Math.sin(theta));
          }
        }
        const faces=[4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7];
        for(const j of faces)indices.push(base+j);
      }
    }
    mesh(part,vertices,indices,'tread');
  }
  function wheel(s,d,corner,label){
    const p=group('wheel-'+corner,'Roue '+label,'roues',[s*150,64,d*143],[s*130,13,d*39],
      'Le pneu à crampons entoure une jante ajourée. L’écrou central serre la roue sur son hexagone.');
    ringX(p,[[-25,40],[-26,45],[-24.5,51],[-21,56],[-16,59],[-10,60],
      [10,60],[16,59],[21,56],[24.5,51],[26,45],[25,40]],'rubber',60);
    for(const side of [-1,1]){
      ringX(p,[[side*25,39],[side*25.4,41.5],[side*25.4,42.2],[side*25,42.8]],'tread');
      ringX(p,[[side*25.3,44],[side*25.8,44.8],[side*25.5,45.5]],'tread');
    }
    treadBlocks(p);
    ringX(p,[[-24.5,40.5],[-24.5,35],[18,35],[24,36],[24.5,40.5]],'dark',48);
    const sf=s*23, inner=s*7;
    ringX(p,[[sf,39],[sf+s*2,39.5],[sf+s*2,37.3],[sf,36.4]],'edge',48);
    for(let i=0;i<8;i++){
      const a=i*tau/8;
      const spoke=(r,theta,x)=>[x,r*Math.cos(theta),r*Math.sin(theta)];
      const corners=[spoke(10,a-.30,inner),spoke(34.8,a+.08,sf),spoke(36.1,a+.29,sf),
        spoke(18.5,a+.16,s*14),spoke(10,a+.28,inner)];
      const back=corners.map(pos=>[pos[0]-s*3,pos[1],pos[2]]);
      face(p,corners,'alloy');
      for(let j=0;j<corners.length;j++)face(p,[corners[j],back[j],back[(j+1)%corners.length],corners[(j+1)%corners.length]],'dark');
      cyl(p,spoke(37.8,a,sf+s*1.6),spoke(37.8,a,sf+s*2.3),1.15,'steel',8);
    }
    cyl(p,[inner-s*3,0,0],[inner+s*4,0,0],12,'dark',24);
    cyl(p,[inner+s*4,0,0],[inner+s*10,0,0],7.5,'edge',6);
    cyl(p,[inner+s*10,0,0],[inner+s*11,0,0],3,'dark',12);
  }
  for(const d of [1,-1])for(const s of [-1,1]){
    const corner=(d>0?'f':'r')+(s<0?'l':'r');
    const label=(d>0?'avant ':'arrière ')+(s<0?'gauche':'droite');
    suspension(s,d,corner,label);shock(s,d,corner,label);wheel(s,d,corner,label);
  }

  function bumper(d) {
    const name=d>0?'avant':'arrière';
    const part=group(d>0?'bumper-front':'bumper-rear','Pare-chocs '+name,'chassis',
      [0,44,d*173],[0,-25,d*77],'Les renforts relient le pare-chocs au châssis. Le sabot inférieur protège la cellule lors des réceptions.');
    for(const s of [-1,1]){
      strut(part,[s*21,-10,-d*27],[s*65,7,d*27],10,8,'black');
      strut(part,[s*65,7,d*27],[s*80,15,d*21],9,9,'black');
      strut(part,[s*43,-8,-d*8],[s*38,7,d*27],8,7,'dark');
      screw(part,[s*22,-6,-d*23],2.5);
      cyl(part,[s*16,-11,-d*26],[s*25,6,d*19],3.5,'black',12);
    }
    box(part,[0,7,d*26],[135,10,11],'black');
    box(part,[0,-7,d*4],[51,5,29],'dark',[d*.2,0,0]);
    if(d<0){
      for(const s of [-1,1])strut(part,[s*26,3,-7],[s*11,8,-43],6.5,6,'black');
      cyl(part,[-14,7,-42],[14,7,-42],3,'steel',10);
      cyl(part,[-8,7,-42],[8,7,-42],9.5,'rubber',20);
    }
  }
  bumper(1);bumper(-1);
  const posts=group('body-posts','Supports de carrosserie','chassis',[0,79,0],[0,51,-16],
    'Quatre plots portent la coque. Les clips la maintiennent en place pour rouler et permettent de l’enlever à l’atelier.');
  for(const d of [-1,1]){
    const z=d*129;
    for(const s of [-1,1]){
      cyl(posts,[s*47,4,z],[s*47,52,z],3.1,'dark',12);
      cyl(posts,[s*47,45,z],[s*47,48,z],6.4,'black',16);
      for(let i=0;i<3;i++)cyl(posts,[s*44.5,31+i*4,z],[s*49.5,31+i*4,z],.9,'black',8);
    }
  }

  // Pickup shell with flared fenders, an independent bed, a molded cabin,
  // recessed glass, grille, lamps and a lower contrasting paint band.
  const shell=group('shell','Carrosserie pick-up','carrosserie',[0,82,-2],[0,175,-118],
    'Coque personnalisée en polycarbonate inspirée d’un pick-up de monster truck. La forme et la livrée sont une proposition pour ce montage.');
  const sign = Math.sign, clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  function strip(rows,mat) {
    const vertices=rows.flat(2), indices=[], columns=rows[0].length;
    for(let i=0;i<rows.length-1;i++)for(let j=0;j<columns-1;j++){
      const a=i*columns+j,b=a+1,c=b+columns,d=a+columns;
      indices.push(a,d,b,b,d,c);
    }
    mesh(shell,vertices,indices,mat);
  }
  const arch=z=>{
    const dz=Math.min(Math.abs(z-143),Math.abs(z+143));
    return dz>=69 ? -3 : Math.max(-3,-20+Math.sqrt(69*69-dz*dz));
  };
  const width=z=>{
    const dz=Math.min(Math.abs(z-143),Math.abs(z+143));
    const bulge=dz>=78?0:Math.cos(dz*Math.PI/156)**2;
    return 88+12*bulge-8*(clamp((Math.abs(z)-166)/29,0,1)**2);
  };
  const waist=z=>43.5+2.5*Math.exp(-(((z-38)/88)**2));
  const top=z=>Math.max(waist(z),arch(z)+6.5);
  function xyz(x,y,z) {
    const round=clamp((Math.abs(z)-164)/31,0,1)**2;
    return [x,y,z-sign(z)*round*(Math.abs(x)/91)**2*7.4];
  }
  function panel(points,mat){face(shell,points.map(p=>xyz(...p)),mat);}
  function sideSkin(s,y,z,offset=.28) {
    const t=clamp((y-arch(z))/(top(z)-arch(z)),0,1);
    return xyz(s*(width(z)-1.1+1.3*Math.sin(Math.PI*t)-1.8*t**3+offset),y,z);
  }
  // Continuous normal fields across the rolled fender and its shallow lip.
  const stations=Array.from({length:97},(_,i)=>mix(-194,195,i/96));
  for(const s of [-1,1]){
    const edges=stations.map(z=>{
      const w=width(z), y=arch(z),h=top(z);
      return [
        xyz(s*(w-4.8),y+.6,z),xyz(s*(w-2.5),y,z),
        xyz(s*(w-.8),y+1.3,z),sideSkin(s,y+3.2,z,.26),
        sideSkin(s,mix(y,h,.42),z,0),sideSkin(s,mix(y,h,.79),z,0),
        xyz(s*(w-3.6),h-.7,z),xyz(s*(w-5.8),h+.7,z),
        xyz(s*(w-10),h+1.15,z),xyz(s*(w-13),h+1.1,z)
      ];
    });
    strip(edges.map(row=>row.slice(0,3)),'black');
    strip(edges.map(row=>row.slice(2)),'paint');
    const sideLine=(coords,mat)=>face(shell,coords.map(([z,y])=>sideSkin(s,y,z,.75)),mat);
    sideLine([[-75,4],[-47,12],[6,13],[47,22],[64,22],[8,8],[-48,8]],'dark');
    sideLine([[-67,7],[-45,13],[-24,13],[-45,14.3]],'white');
    sideLine([[5,10],[47,21.8],[60,22],[40,18.5]],'white');
    const rockerPoints=Array.from({length:23},(_,i)=>{
      const z=mix(-76,76,i/22), y=arch(z);
      return [sideSkin(s,y,z,.5),sideSkin(s,y+3.2,z,.5)];
    });
    strip(rockerPoints,'black');
    for(const z of [-52,44]){
      const path = [[z+2,39],[z+1.8,28],[z,15],[z-1,7]];
      for(let j=0;j<path.length-1;j++){
        const [za,ya]=path[j],[zb,yb]=path[j+1];
        sideLine([[za,ya],[zb,yb],[zb+.8,yb],[za+.8,ya]],'dark');
      }
    }
    sideLine([[-51,7],[-48,6],[42,6],[43,7],[43,8],[-48,7]],'dark');
    // Door belt and handle follow the side skin, not the cab glass.
    const h=sideSkin(s,38,-39,2);
    box(shell,h,[2.4,3.3,11],'black');
    const belt=Array.from({length:25},(_,i)=>{
      const z=mix(-76,62,i/24);
      return [sideSkin(s,35,z,.65),sideSkin(s,35.9,z,.65)];
    });
    strip(belt,'dark');
    // The paired door race numbers use hard-edged printable shapes.
    const digitSegments={
      a:[[0,13],[5,13],[6,12],[5,11],[.6,11],[-.3,12]],
      b:[[5,11.8],[6,12.2],[6.2,7.2],[5.25,6.3],[4.65,7.1]],
      g:[[.4,7.5],[5,7.5],[5.7,6.6],[4.6,5.6],[.4,5.6],[-.3,6.4]],
      e:[[.1,6],[1.35,5.4],[1.2,1.4],[.3,.9],[-.3,1.4]],
      d:[[.1,1.9],[4.8,1.9],[5.5,1],[4.75,0],[.5,0],[-.4,.9]],
      f:[[0,12],[1.25,11.3],[1.2,7.6],[.2,6.8],[-.4,7.7]],
      c:[[5.1,6.1],[6,6.8],[6.1,1.1],[5.3,.25],[4.7,1.15]]
    };
    const transform=(z,y)=>[-24+s*z,18+y];
    const printDigit=(segments,x)=>{
      for(const k of segments)sideLine(digitSegments[k].map(([u,v])=>transform(x+u+v*.11,v)),'white');
    };
    printDigit('abged',0); printDigit('fgbc',8);
    for(const z of [24,29,34])sideLine([[z,10],[z+2.3,10],[z+8.8,17],[z+6.5,17]],'black');
  }
  // Sculpted bed rails, an inset liner and longitudinal ribs.
  const bedZ=Array.from({length:40},(_,i)=>mix(-194,-67,i/39));
  for(const s of [-1,1]){
    strip(bedZ.map(z=>[xyz(s*(width(z)-13),top(z)+1.1,z),xyz(s*69,44.8,z),xyz(s*64,44.5,z)]),'paint');
    strip(bedZ.map(z=>[xyz(s*64,44.5,z),xyz(s*62,43.2,z),xyz(s*60,27,z)]),'dark');
  }
  panel([[-60,27,-194],[60,27,-194],[60,27,-67],[-60,27,-67]],'dark');
  for(let x=-53;x<60;x+=11)box(shell,[x,27.6,-127],[5,1.8,107],'black');
  panel([[-64,44,-193],[64,44,-193],[60,27,-184],[-60,27,-184]],'paint');
  panel([[-60,27,-67],[60,27,-67],[72,44,-69],[-72,44,-69]],'dark');

  // Window frames and panes share a rounded opening. Only the painted rim
  // occupies its surrounding surface, so no coplanar paint sits under the glass.
  function roundedUV(x0,y0,x1,y1,rx,ry) {
    const result=[];
    const corners=[[x0+rx,y0+ry,Math.PI],[x1-rx,y0+ry,Math.PI*1.5],
      [x1-rx,y1-ry,0],[x0+rx,y1-ry,Math.PI*.5]];
    for(const [u,v,start] of corners){
      for(let j=0;j<=4;j++){const a=start+j*Math.PI/8;result.push([u+rx*Math.cos(a),v+ry*Math.sin(a)]);}
    }
    return result;
  }
  function glassPanel(surface,outward,marginU=.045,marginV=.085) {
    const outer=roundedUV(0,0,1,1,.002,.002);
    const opening=roundedUV(marginU,marginV,1-marginU,1-marginV,.052,.094);
    const glass=roundedUV(marginU+.014,marginV+.028,1-marginU-.014,1-marginV-.028,.044,.082);
    const ring=(coords,depth)=>coords.map(([u,v])=>add(surface(u,v),scale(outward,depth)));
    const roundOuter=ring(outer,0), paintInner=ring(opening,0), gasketInner=ring(glass,-.55);
    for(let i=0;i<outer.length;i++){
      const j=(i+1)%outer.length;
      face(shell,[roundOuter[i],roundOuter[j],paintInner[j],paintInner[i]],'paint');
      face(shell,[paintInner[i],paintInner[j],gasketInner[j],gasketInner[i]],'black');
    }
    // Shallow crown in the pane catches the studio's reflection.
    const center=add(surface(.5,.5),scale(outward,-.1));
    const positions=[center,...gasketInner], indices=[];
    for(let i=0;i<gasketInner.length;i++)indices.push(0,1+i,1+(i+1)%gasketInner.length);
    mesh(shell,positions.flat(),indices,'glass');
  }
  const cabFront=(u,v)=>{
    const half=mix(78,66,v), x=(2*u-1)*half;
    return [x,mix(44,83,v)+.8*(1-(2*u-1)**2),mix(65,27,v)+2.4*(1-(2*u-1)**2)];
  };
  const cabRear=(u,v)=>[(2*u-1)*mix(78,66,v),mix(44,83,v),mix(-70,-52,v)-1.1*(1-(2*u-1)**2)];
  glassPanel(cabFront,[0,.70,.71],.042,.085);
  glassPanel(cabRear,[0,.42,-.91],.095,.13);
  for(const s of [-1,1]){
    const side=(u,v)=>[s*(mix(78,66,v)+1.6*Math.sin(v*Math.PI)),
      mix(44,83,v),mix(mix(-70,-52,v),mix(65,27,v),u)];
    // Separate quarter-light and front side pane, divided by a full B-pillar.
    glassPanel((u,v)=>side(.385*u,v),[s,.15,0],.065,.10);
    glassPanel((u,v)=>side(.385+.615*u,v),[s,.15,0],.046,.10);
    const zSide=Array.from({length:35},(_,i)=>mix(-70,65,i/34));
    strip(zSide.map(z=>[xyz(s*(width(z)-13),top(z)+1.1,z),xyz(s*78,44,z)]),'paint');
    const p=side(.385,.18),q=side(.385,.85);
    strut(shell,add(p,[s*.45,0,0]),add(q,[s*.45,0,0]),1.3,1.3,'dark');
    // Compact black race mirror with rear-facing insert.
    strut(shell,[s*76,52,43],[s*87,52.5,45],3,3,'black');
    ball(shell,[s*89,54,44],[5.7,4,6.2],'dark');
    box(shell,[s*89,54,39.15],[8,4.2,.75],'glass');
  }
  const roofRows=[];
  for(let iz=0;iz<=18;iz++){
    const v=iz/18,z=mix(-52,27,v),longCamber=Math.sin(v*Math.PI);
    const row=[];
    for(let ix=0;ix<=20;ix++){
      const u=ix/20, k=2*u-1;
      row.push([k*66,83+.85*(1-k*k)+3.3*(1-k**4)*longCamber,
        z+mix(-1.1,2.4,v)*(1-k*k)]);
    }
    roofRows.push(row);
  }
  strip(roofRows,'paint');
  for(const s of [-1,1]){
    const drip=[];
    for(let i=0;i<=16;i++){
      const v=i/16,z=mix(-49,24,v),y=83.9+.8*Math.sin(v*Math.PI);
      drip.push([[s*62.2,y,z],[s*61.5,y+.2,z]]);
    }
    strip(drip,'dark');
  }
  // Two actual wiper arms and blades stand off the recessed windscreen.
  for(const u of [.36,.74]){
    const a=add(cabFront(u,.10),[0,.4,1]),b=add(cabFront(u-.14,.28),[0,.4,1.05]);
    const blade0=add(cabFront(u-.245,.26),[0,.45,1.1]),blade1=add(cabFront(u+.01,.29),[0,.45,1.1]);
    cyl(shell,a,b,.85,'dark',8);cyl(shell,blade0,blade1,1.1,'black',8);
  }

  function hoodHeight(x,z){
    const w=Math.abs(x), progression=clamp((z-64)/131,0,1);
    const crest=53.5+4*Math.sin(progression*Math.PI)-7.2*progression**1.8;
    const rolled=top(z)+1.1, side=(width(z)-13);
    if(w>=side)return rolled;
    const angle=.72*progression+.25;
    const ridgeAt=mix(36,46,Math.sin(angle));
    const rib=2.2*Math.exp(-(((w-ridgeAt)/4.4)**2));
    const recess=-2.0*Math.exp(-(((w-ridgeAt-6)/4.1)**2));
    const hump=2.8*(1-w*w/(side*side));
    const edgeBlend=clamp((w-55)/(side-55),0,1);
    const smooth=edgeBlend*edgeBlend*(3-2*edgeBlend);
    return mix(crest+hump+rib+recess,rolled,smooth);
  }
  const hoodZ=Array.from({length:57},(_,i)=>mix(65,195,i/56));
  const hoodSurface=hoodZ.map(z=>Array.from({length:65},(_,i)=>{
    const x=(width(z)-13)*(2*i/64-1);
    return xyz(x,hoodHeight(x,z),z);
  }));
  strip(hoodSurface,'paint');
  // The cowl rolls upward to the hood instead of leaving an open seam.
  strip(Array.from({length:33},(_,i)=>{
    const u=i/32,x=(2*u-1)*(width(65)-13);
    return [cabFront(u,0),xyz(x,hoodHeight(x,65),65)];
  }),'black');
  function hoodDecal(points,material,lift=.3){
    face(shell,points.map(([x,z])=>xyz(x,hoodHeight(x,z)+lift,z)),material);
  }
  for(const s of [-1,1]){
    // Tapered twin graphite strips with a thin secondary race line.
    const stripeZ=Array.from({length:34},(_,i)=>mix(73,182,i/33));
    const path=(z,edge)=>s*(mix(32.8,37,(z-73)/109)+edge*(1-(z-73)/145));
    for(const [offset,size,mat] of [[0,4.6,'dark'],[6.2,1.35,'white']]){
      strip(stripeZ.map(z=>[offset,offset+size].map(k=>{
        const x=path(z,k);return xyz(x,hoodHeight(x,z)+.28,z);
      })),mat);
    }
    // Hood shutline beside the arch and two fasteners with clips.
    strip(hoodZ.map(z=>[0,.63].map(k=>{
      const x=s*(width(z)-17+k);return xyz(x,hoodHeight(x,z)+.23,z);
    })),'black');
    const hx=s*54,hz=161,hy=hoodHeight(hx,hz);
    cyl(shell,[hx,hy+.2,hz],[hx,hy+1.4,hz],2,'steel',12);
    cyl(shell,[hx-3,hy+1.6,hz+1],[hx+2.8,hy+1.6,hz-1],.55,'chrome',8);
    // Five sunken vents at the back of the hood, each with a narrow raised lip.
    for(let i=0;i<5;i++){
      const z=75+i*4.6;
      hoodDecal([[s*11,z],[s*26,z+1.5],[s*26,z+3.8],[s*11,z+2.2]],'black',.42);
      hoodDecal([[s*11,z+2.2],[s*26,z+3.8],[s*25.8,z+4.4],[s*11,z+2.8]],'edge',.47);
    }
  }

  // Bumper, grille, inset headlamp pods and scoop form one wrapped front end.
  function nosePoint(x,y,depth=0){
    return xyz(x,y,195+depth-.11*Math.max(0,42-y));
  }
  function frontFace(coords,mat,depth=0){face(shell,coords.map(([x,y])=>nosePoint(x,y,depth)),mat);}
  const noseTop=[];
  for(let i=0;i<=48;i++){
    const x=mix(-width(195),width(195),i/48);
    noseTop.push([xyz(x,hoodHeight(x,195),195),nosePoint(x,42.5)]);
  }
  strip(noseTop,'paint');
  const noseRows=Array.from({length:43},(_,i)=>{
    const x=mix(-width(195),width(195),i/42);
    return [nosePoint(x,42.6),nosePoint(x,36),nosePoint(x*.98,23),nosePoint(x*.94,16)];
  });
  strip(noseRows,'paint');
  // Satin-black grille surround, deep black grille, upper brow, and lower air dam.
  frontFace([[-55,40.5],[-48,42.2],[48,42.2],[55,40.5],[46,23.2],[38,20],[-38,20],[-46,23.2]],'dark',1.2);
  frontFace([[-50,39.3],[-45,40.3],[45,40.3],[50,39.3],[42,25],[36,22.6],[-36,22.6],[-42,25]],'black',1.6);
  for(let i=0;i<3;i++){
    const y=26.2+i*4.3,half=39+i*2.3;
    frontFace([[-half,y],[half,y],[half+1,y+1.1],[-half-1,y+1.1]],'edge',2.1);
  }
  for(let i=-4;i<=4;i++){
    const x=i*8;
    frontFace([[x-.46,25],[x+.46,25],[x+.46,39],[x-.46,39]],'dark',2.0);
  }
  frontFace([[-10,35.6],[8.2,35.6],[11,33],[6.5,30.7],[-8.5,30.7],[-11,33]],'dark',2.4);
  frontFace([[-5,34],[3.5,34],[6,33],[4,32],[.5,32],[1.6,31.4],[-.5,31.4],[-2,32.7],[2.1,32.7],[2.8,33.1],[-4,33.1]],'edge',2.6);
  for(const s of [-1,1]){
    const sf=(points,mat,depth)=>frontFace(points.map(([x,y])=>[s*x,y]),mat,depth);
    sf([[49,41.4],[81,41.4],[79,28.4],[54,29.5]],'black',1.3);
    sf([[53,39.6],[78.7,39.6],[77.8,30.5],[55,31.3]],'glass',1.6);
    // Narrow LED daytime strip surrounding the two reflector lenses.
    sf([[51.7,40],[79,40],[78.8,38.8],[52.5,38.8]],'light',2.1);
    sf([[52.5,38.8],[54.7,38.8],[56.4,32],[54.8,32]],'light',2.1);
    for(const x of [61.5,70.5]){
      const pos=nosePoint(s*x,35,1.8);
      cyl(shell,pos,add(pos,[0,0,.9]),3.5,'edge',18);
      cyl(shell,add(pos,[0,0,.91]),add(pos,[0,0,1.2]),2.45,'light',18);
    }
    sf([[77.6,38.6],[79.3,38.6],[78.2,31.2],[76.4,31.2]],'amber',2.25);
    sf([[53,25.8],[76,26.9],[73,19.7],[58,18.8]],'dark',1.05);
    sf([[58,24],[73,24.7],[70.8,21],[59.8,21.1]],'black',1.35);
  }
  frontFace([[-79,17.8],[-52,19.3],[-37,17.4],[37,17.4],[52,19.3],[79,17.8],
    [72,12],[40,12.5],[-40,12.5],[-72,12]],'black',.9);
  frontFace([[-35,16],[35,16],[30,12],[-30,12]],'alloy',1.1);

  const tail=-194.2;
  panel([[-width(-194),42.7,tail],[width(-194),42.7,tail],[width(-194)-3,13,tail],[-width(-194)+3,13,tail]],'paint');
  panel([[-60,37,tail-.6],[60,37,tail-.6],[54,21,tail-.6],[-54,21,tail-.6]],'dark');
  panel([[-51,34,tail-.8],[51,34,tail-.8],[47,25,tail-.8],[-47,25,tail-.8]],'paint');
  for(const s of [-1,1]){
    const l=(pts,mat,d)=>panel(pts.map(([x,y])=>[s*x,y,tail-d]),mat);
    l([[67,40],[80,40],[78,19],[67,19]],'black',.9);
    l([[69,38.8],[78.5,38.8],[77.5,27],[69,27]],'red',1.1);
    l([[69,25.5],[77.5,25.5],[77,22],[69,22]],'white',1.2);
  }
}
