/* Pixel-painted scenery for Maille City, drawn once at its native resolution. */
export const WORLD_W = 1460;
export const WORLD_H = 1090;
export const roads = {
  xs: [56, 280, 504, 728, 952, 1176, 1400],
  ys: [55, 218, 381, 544, 707, 870, 1033],
  halfWidth: 28
};
export const SPAWN = { x: 716, y: 534 };
export const objects = [];

const lots = [];
const buildings = [];
const trees = [];
const lamps = [];
const signals = [];
const glows = [];
const extras = [];
const mapColors = ['#8d568b','#6e749d','#639a9f','#b17d82','#9787a5','#a46d83'];
let backdrop;
let mapLayer;

function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const palettes = {
  arcade: { roof:'#604463', wall:'#8a436b', edge:'#b47c95', light:'#ff9ed3', shade:'#4b3453', trim:'#b74196', neon:'#ff53bf', glow:'#ff9cde', window:'#9860d8', text:'ARCADE' },
  wool: {roof:'#365f6d',wall:'#386a73',edge:'#72a3a4',light:'#a1dbc9',shade:'#2a465a',trim:'#269a98',neon:'#45f6d2',glow:'#8bffe1',window:'#6ad5c0',text:'LA PELOTE'},
  grocery:{roof:'#746277',wall:'#a96b70',edge:'#bc9494',light:'#ffd295',shade:'#633e57',trim:'#d1655d',neon:'#ffae53',glow:'#ffd492',window:'#f5b05d',text:'ÉPICERIE'},
  cafe:{roof:'#805565',wall:'#aa6672',edge:'#cb8a8a',light:'#ffd4a4',shade:'#683d56',trim:'#d85f6d',neon:'#ffbd6d',glow:'#ffe19b',window:'#f2bb76',text:'CAFÉ'},
  apartments:{roof:'#6a6786',wall:'#786888',edge:'#b19db5',light:'#d7adcb',shade:'#4c4768',trim:'#79779b',neon:'#fec781',glow:'#f7b48a',window:'#e2a37b',text:''},
  textile:{roof:'#646e83',wall:'#706683',edge:'#9695a5',light:'#c4a6bf',shade:'#504a65',trim:'#7f5b91',neon:'#ddb8fc',glow:'#e8abff',window:'#a087b6',text:'FILATURE'},
  police:{roof:'#586d84',wall:'#52697f',edge:'#8e9cb2',light:'#b0d5ea',shade:'#394a64',trim:'#487689',neon:'#7be1fa',glow:'#75dfff',window:'#84aecb',text:'POLICE'},
  clinic:{roof:'#677b86',wall:'#718591',edge:'#a4babe',light:'#c5ddd2',shade:'#485267',trim:'#5b8b82',neon:'#9bf9c3',glow:'#9af4ca',window:'#a2d7c4',text:'SECOURS'},
  fire:{roof:'#82677a',wall:'#a1606a',edge:'#b79a9f',light:'#e4ada0',shade:'#674755',trim:'#a94c61',neon:'#ff9b8d',glow:'#ff9e83',window:'#dfac87',text:'CASERNE'},
  garage:{roof:'#677484',wall:'#666b84',edge:'#919ca8',light:'#b2b8c5',shade:'#46445e',trim:'#526f88',neon:'#a4c3ff',glow:'#9cc3ff',window:'#8798b7',text:'GARAGE'},
  records:{roof:'#735f86',wall:'#766482',edge:'#a78caa',light:'#e3afd2',shade:'#514460',trim:'#945d9b',neon:'#efb4f0',glow:'#ffb8e8',window:'#b487b0',text:'STUDIO'}
};

const layout = [
  ['textile','apartments','park','clinic','apartments','garage'],
  ['garage','wool','apartments','records','park','fire'],
  ['apartments','cafe','arcade','wool','apartments','records'],
  ['park','police','cafe','apartments','garage','clinic'],
  ['textile','apartments','park','records','fire','grocery'],
  ['garage','textile','grocery','apartments','park','police']
];

function addBuilding(x,y,w,h,kind,seed,featured = false) {
  buildings.push({x,y,w,h,kind,seed,featured});
}

for (let j=0;j<roads.ys.length-1;j++) {
  for (let i=0;i<roads.xs.length-1;i++) {
    const seed=3983+i*653+j*9767, rng=random(seed);
    const x=roads.xs[i]+28, y=roads.ys[j]+28;
    const w=roads.xs[i+1]-28-x, h=roads.ys[j+1]-28-y;
    const kind=layout[j][i];
    const lot={x,y,w,h,kind,seed,i,j};
    lots.push(lot);
    if(kind==='park') {
      [[14,25],[26,16],[w-23,19],[w-14,h-26],[23,h-19]].forEach(([dx,dy],n)=>trees.push({x:x+dx,y:y+dy,seed:seed+n}));
    } else {
      const featured=i>=2&&i<=3&&j>=2&&j<=3;
      if(featured && j===2) {
        addBuilding(x+12,y+12,w-25,h-29,kind,seed,true);
      } else if((i*3+j)%3===0 || featured) {
        let leftw=kind==='cafe'?94:69;
        addBuilding(x+11,y+12,leftw,h-28,kind,seed,featured);
        if(featured&&kind==='cafe') extras.push({kind:'terrace',x:x+leftw+18,y:y+16,w:w-leftw-26,h:h-30,seed});
        else addBuilding(x+leftw+21,y+15,w-leftw-32,h-33,kind==='apartments'?'grocery':'apartments',seed+827);
        if(featured&&kind==='apartments')extras.push({kind:'fruit',x:x+leftw+26,y:y+h-19,w:53,h:9,seed});
      } else {
        addBuilding(x+12,y+12,w-28,h-31,kind,seed);
      }
      if((i+j)%2===1 || featured) trees.push({x:x+w-8,y:y+h-14,seed});
      if(i%2===0 && j!==2) trees.push({x:x+8,y:y+22,seed:seed+76});
    }
    lamps.push({x:x+6,y:y+h-6,side:-1});
    if((i+j)%3===0) lamps.push({x:x+w-8,y:y+9,side:1});
    const placements=[
      {x:x+22,y:y+h-6,type:'bin',r:4},
      {x:x+w-22,y:y+h-5,type:'hydrant',r:3},
      {x:x+w-5,y:y+30,type:'crate',r:5}
    ];
    if((i+j)%2===0) placements.push({x:x+44,y:y+h-5,type:'bench',r:6});
    if((i+j)%3===1) placements.push({x:x+5,y:y+34,type:'mailbox',r:4});
    placements.forEach((p,k)=>objects.push({...p,id:'p-'+i+'-'+j+'-'+k}));
    if(kind==='park') objects.push({x:x+0.72*w|0,y:y+0.53*h|0,r:5,type:'bench',id:'p-'+i+'-'+j+'-5'});
  }
}

for (const x of roads.xs) for (const y of roads.ys) {
  signals.push({x:x-31, y:y-31}, {x:x+32, y:y+32});
}

export function solidAt(x,y) {
  if (x<6||y<6||x>WORLD_W-6||y>WORLD_H-6) return true;
  return buildings.some(b=>x>=b.x-1&&x<=b.x+b.w+2&&y>=b.y-1&&y<=b.y+b.h+1) ||
    trees.some(t=>Math.abs(x-t.x)<3&&Math.abs(y-t.y)<3);
}

function box(c,x,y,w,h,color) {
  c.fillStyle=color; c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}
function poly(c,pts,color) {
  c.fillStyle=color; c.beginPath(); c.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) c.lineTo(pts[i][0],pts[i][1]);
  c.closePath(); c.fill();
}
function line(c,x1,y1,x2,y2,color,thick=1) {
  x1=Math.round(x1);x2=Math.round(x2);y1=Math.round(y1);y2=Math.round(y2);
  const dx=Math.abs(x2-x1),sx=x1<x2?1:-1,dy=-Math.abs(y2-y1),sy=y1<y2?1:-1;
  let e=dx+dy;
  for(;;) {
    box(c,x1,y1,thick,thick,color);
    if(x1===x2&&y1===y2)break;
    const twice=e*2;
    if(twice>=dy){e+=dy;x1+=sx;}
    if(twice<=dx){e+=dx;y1+=sy;}
  }
}
function halo(c,x,y,r,color,alpha=0.19) {
  c.save();
  c.globalAlpha=alpha;
  const g=c.createRadialGradient(x,y,1,x,y,r);
  g.addColorStop(0,color);g.addColorStop(1,color+'00');
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
}
function circle(c,cx,cy,r,color) {
  for(let yy=-r;yy<=r;yy++) {
    const hw=Math.round(Math.sqrt(r*r-yy*yy));
    box(c,cx-hw,cy+yy,hw*2+1,1,color);
  }
}

const glyphs={
 'A':'01110100011000111111100011000110001','B':'11110100011000111110100011000111110',
 'C':'01111100001000010000100001000001111','D':'11110100011000110001100011000111110',
 'E':'11111100001000011110100001000011111','F':'11111100001000011110100001000010000',
 'G':'01111100001000010111100011000101111','H':'10001100011000111111100011000110001',
 'I':'11111001000010000100001000010011111','J':'00111000100001000010000101001001100',
 'K':'10001100101010011000101001001010001','L':'10000100001000010000100001000011111',
 'M':'10001110111010110101100011000110001','N':'10001110011010110101100111000110001',
 'O':'01110100011000110001100011000101110','P':'11110100011000111110100001000010000',
 'Q':'01110100011000110001101011001001101','R':'11110100011000111110101001001010001',
 'S':'01111100001000001110000010000111110','T':'11111001000010000100001000010000100',
 'U':'10001100011000110001100011000101110','V':'10001100011000110001010100101000100',
 'W':'10001100011000110101101011101110001','X':'10001100010101000100010101000110001',
 'Y':'10001100010101000100001000010000100','Z':'11111000010001000100010001000011111',
 '0':'01110100011001110101110011000101110','1':'00100011000010000100001000010001110',
 '2':'01110100010000100010001000100011111','4':'00010001100101010010111110001000010',
 '+':'00000001000010011111001000010000000'
};
function letters(c,str,x,y,s,color) {
  const normalized=str.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for(let i=0;i<normalized.length;i++) {
    const bits=glyphs[normalized[i]];if(!bits)continue;
    for(let n=0;n<bits.length;n++) if(bits[n]==='1') box(c,x+(i*6+n%5)*s,y+Math.floor(n/5)*s,s,s,color);
  }
}

function streetLayer(c) {
  const rng=random(30067);
  box(c,0,0,WORLD_W,WORLD_H,'#2b2b40');
  // Mottled asphalt, patchwork seams and scattered reflective threads.
  for(let k=0;k<38400;k++) {
    const x=rng()*WORLD_W|0,y=rng()*WORLD_H|0;
    const col=['#2e2f44','#27283d','#323347','#28283c','#353448'][k%5];
    box(c,x,y,1+(rng()*3|0),1,col);
  }
  for(const x of roads.xs) {
    for(let y=0;y<WORLD_H;y+=19) {
      if(roads.ys.some(j=>Math.abs(y-j)<48))continue;
      box(c,x-2,y,1,9,'#a39385');box(c,x+1,y,1,9,'#8b807c');
      if(Math.floor(y/19)%4===1) {
        box(c,x+15,y+1,3,1,'#414354');box(c,x+11,y+2,4,1,'#414354');
      }
    }
  }
  for(const y of roads.ys) {
    for(let x=0;x<WORLD_W;x+=20) {
      if(roads.xs.some(j=>Math.abs(x-j)<48))continue;
      box(c,x,y-2,10,1,'#afa08c');box(c,x,y+1,10,1,'#938680');
    }
  }
  for (let a=0;a<roads.xs.length;a++) for (let b=0;b<roads.ys.length;b++) {
    const x=roads.xs[a],y=roads.ys[b];
    for (let k=-22;k<24;k+=7) {
      box(c,x+k,y-41,4,10,'#9893a3');box(c,x+k,y+31,4,10,'#999aa5');
      box(c,x-41,y+k,10,4,'#a5a1ac');box(c,x+31,y+k,10,4,'#a4a1ac');
      box(c,x+k,y-41,4,1,'#b0a9b3');box(c,x+31,y+k+3,10,1,'#8c8798');
    }
    box(c,x-26,y-46,23,1,'#888492');box(c,x+3,y+45,23,1,'#8c8895');
    box(c,x-46,y+3,1,23,'#8c8895');box(c,x+45,y-26,1,23,'#8c8895');
    roadCover(c,x+18,y-8);
    if((a+b)%3===0) {
      const rx=x-58,ry=y+17;
      line(c,rx,ry,rx+8,ry-2,'#272939');line(c,rx+8,ry-2,rx+12,ry,'#272939');
      line(c,rx+10,ry-1,rx+11,ry-5,'#272939');box(c,rx+2,ry+1,4,1,'#404052');
    }
  }
}
function roadCover(c,x,y) {
  box(c,x-3,y-2,7,5,'#262839');box(c,x-2,y-3,5,7,'#282a3d');
  box(c,x-2,y-2,5,1,'#494858');box(c,x-3,y-1,1,3,'#484757');
  box(c,x-1,y-1,1,3,'#383a4c');box(c,x+1,y-1,1,3,'#383a4c');
}
function pavement(c,b) {
  const {x,y,w,h,seed}=b, rng=random(seed);
  box(c,x-1,y-1,w+2,h+3,'#232638');
  box(c,x+3,y-1,w-6,h+2,'#a09ab0');box(c,x-1,y+3,w+2,h-6,'#8c889f');
  box(c,x+1,y+1,w-2,h-2,'#757587');box(c,x+3,y+3,w-6,h-6,'#747289');
  for(let yy=3;yy<h-3;yy+=7) {
    box(c,x+2,y+yy,w-4,1,'#626377');
    box(c,x+2,y+yy+1,w-4,1,'#7a788e');
    for(let xx=3+(yy%2)*6;xx<w-4;xx+=12) box(c,x+xx,y+yy+1,1,6,'#626579');
  }
  for(let n=0;n<w*h/32;n++) {
    const xx=x+3+(rng()*(w-6)|0),yy=y+3+(rng()*(h-6)|0);
    box(c,xx,yy,2,1,n%3===0?'#89849a':'#6e6d82');
  }
  for(let yy=6;yy<h-4;yy+=9){box(c,x,y+yy,2,1,'#666779');box(c,x+w-2,y+yy,2,1,'#666779');}
  for(let xx=5;xx<w-4;xx+=11){box(c,x+xx,y,1,2,'#707080');box(c,x+xx,y+h-2,1,2,'#605e73');}
  // Narrow iron drains at the kerb.
  box(c,x-3,y+15,2,8,'#252838');box(c,x+w-18,y+h,8,2,'#262737');
  for(let k=0;k<4;k++)box(c,x+w-18+k*2,y+h,1,1,'#515163');
}
function waterTank(c,x,y) {
  box(c,x-7,y+4,18,3,'#414252');box(c,x-6,y+1,2,6,'#333847');box(c,x+5,y+1,2,6,'#333847');
  line(c,x-6,y+2,x+5,y+5,'#4a444f');line(c,x+5,y+2,x-5,y+5,'#4a444f');
  box(c,x-8,y-9,17,12,'#574650');box(c,x-7,y-10,15,1,'#ad8183');
  for(let m=0;m<6;m++)box(c,x-7+m*2,y-9,1,10,m%2?'#886169':'#9f7274');
  box(c,x-8,y-7,16,1,'#494757');box(c,x-8,y-2,16,1,'#494757');
  poly(c,[[x-10,y-10],[x-4,y-15],[x+2,y-16],[x+10,y-10]],'#4a485b');
  line(c,x-8,y-11,x-1,y-15,'#9b828e');box(c,x-10,y-10,20,1,'#b697a0');
}
function vent(c,x,y,w=14,h=8) {
  box(c,x+3,y+3,w,h,'#454455');box(c,x,y,w,h+1,'#3a3b4a');
  box(c,x,y,w,h-2,'#9b9ba7');box(c,x+1,y+1,w-2,h-4,'#777986');
  box(c,x,y,w,1,'#b5acb5');box(c,x+1,y+h-2,w-1,1,'#696674');
  for(let yy=2;yy<h-3;yy+=2)box(c,x+2,y+yy,w-4,1,'#464a5c');
}
function fan(c,x,y) {
  box(c,x+3,y+3,12,11,'#484955');box(c,x,y,12,11,'#95949c');
  box(c,x+1,y+1,10,9,'#777987');circle(c,x+5,y+5,4,'#4a4d5a');
  for(let j=0;j<4;j++){box(c,x+3+j,y+3+j,2,1,'#a7a3ac');box(c,x+7-j,y+3+j,2,1,'#a7a3ac');}
  box(c,x+5,y+4,2,2,'#4c505e');box(c,x+1,y+1,1,1,'#d4c0c4');
}
function yarnBall(c,x,y,s=1,pink=true) {
  const colors=pink?['#813e76','#c2559c','#e978b3','#ffb0d6','#ffdae5']:['#397d83','#54b2aa','#87d1b4','#b9e7b7','#e2f2c9'];
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);
  // Two knitting needles pass behind the wrapped wool.
  line(c,-12,5,10,-19,'#514e62',2);line(c,-11,4,11,-19,'#e7b98b');
  box(c,10,-20,3,3,'#ffdcc3');line(c,-7,9,-16,-15,'#504e65',2);
  line(c,-8,8,-16,-15,'#e6b588');box(c,-17,-17,3,3,'#ffe4bc');
  box(c,-7,10,16,2,colors[0]);circle(c,1,-1,12,colors[0]);circle(c,0,-2,11,colors[1]);
  for(let i=0;i<4;i++){
    const a=-8+i*4;line(c,a,5,a+8,-5,colors[2],2);line(c,a,6,a+8,-4,colors[0]);
  }
  for(let i=0;i<4;i++){
    line(c,-10+i*2,-4-i*2,-2+i*2,-1-i*2,colors[3]);line(c,-10+i*2,-3-i*2,-2+i*2,0-i*2,colors[0]);
  }
  line(c,2,8,9,1,colors[3]);line(c,6,7,12,6,colors[1],2);line(c,12,6,16,9,colors[2],2);
  box(c,-5,-10,3,1,colors[4]);c.restore();
}
function roofSurface(c,b,p,rh) {
  const rng=random(b.seed+321),{x,y,w}=b;
  box(c,x+2,y+2,w-3,rh-1,p.roof);
  const innerX=x+5,innerY=y+5,innerW=w-10,innerH=rh-10;
  c.save();c.beginPath();c.rect(innerX,innerY,innerW,innerH);c.clip();
  c.globalAlpha=0.27;
  // Bundles of roofing felt with alternating stitch direction.
  for(let yy=innerY+3,n=0;yy<innerY+innerH+5;yy+=12,n++) {
    box(c,innerX,yy,innerW,1,p.shade);
    box(c,innerX,yy+1,innerW,1,p.edge);
    for(let xx=innerX+6+(n%3)*13;xx<innerX+innerW;xx+=36)box(c,xx,yy-10,1,10,p.shade);
  }
  c.globalAlpha=0.42;
  for(let n=0;n<innerW*innerH/33;n++) {
    const xx=innerX+(rng()*innerW|0),yy=innerY+(rng()*innerH|0);
    box(c,xx,yy,1+(rng()*3|0),1,n%3?p.shade:p.edge);
    if(n%11===0)box(c,xx+1,yy+1,1,1,p.shade);
  }
  c.restore();
  box(c,x,y,w,3,'#323344');box(c,x+1,y+1,w-2,2,p.edge);
  box(c,x+1,y+3,w-3,2,p.shade);box(c,x,y+1,3,rh-1,p.edge);
  box(c,x+2,y+3,2,rh-4,p.shade);box(c,x+w-4,y+2,3,rh-2,p.shade);
  for(let px=x+12;px<x+w-5;px+=14)box(c,px,y+1,1,2,p.roof);
  for(let py=y+8;py<y+rh-3;py+=12)box(c,x,py,2,1,p.roof);
  box(c,x,y+rh-3,w,3,p.edge);box(c,x+1,y+rh-4,w-2,1,p.shade);
}
function windowUnit(c,x,y,w,h,p,rng) {
  box(c,x,y,w,h,'#373346');box(c,x+1,y+1,w-2,h-3,rng()>.20?p.window:'#555471');
  box(c,x+1,y+1,w-2,1,p.light);box(c,x+3,y+2,1,h-6,p.light);
  box(c,x+Math.floor(w/2),y+1,1,h-2,'#555066');box(c,x+1,y+Math.ceil(h*0.5),w-2,1,'#696276');
  box(c,x-1,y+h-1,w+2,2,p.shade);box(c,x-1,y+h-1,w+1,1,p.edge);
}
function streetSign(c,cx,y,text,p,large=false) {
  if(!text)return;
  const s=large?2:1,txt=(text.length*6-1)*s;
  const w=txt+10,h=s*7+8,x=Math.round(cx-w/2);
  box(c,x+2,y+3,w,h,'#383244');box(c,x,y,w,h,p.shade);box(c,x+1,y+1,w-2,h-2,'#322d43');
  box(c,x+2,y+1,w-4,1,p.trim);box(c,x+2,y+h-3,w-4,1,p.neon);
  box(c,x+1,y+2,1,h-4,p.edge);box(c,x+w-2,y+2,1,h-5,p.trim);
  c.save();c.shadowColor=p.neon;c.shadowBlur=4;
  letters(c,text,x+5,y+3,s,p.glow);c.restore();
  box(c,x+2,y+2,1,1,p.light);box(c,x+w-3,y+2,1,1,p.light);
  glows.push({x:cx,y:y+h-2,r:large?34:20,color:p.neon});
}
function rollerDoor(c,x,y,w,h,p) {
  box(c,x-1,y-2,w+2,h+3,'#38384d');box(c,x,y,w,h,'#697080');
  for(let k=1;k<h;k+=3){box(c,x,y+k,w,1,'#4c5165');box(c,x,y+k+1,w,1,'#848390');}
  box(c,x,y+h-2,w,2,p.shade);box(c,x+Math.floor(w/2)-2,y+h-4,5,1,'#35384a');
}
function stripedAwning(c,x,y,w,p) {
  box(c,x+2,y+4,w,4,'#423548');
  box(c,x,y,w,5,p.trim);
  for(let j=0;j<w;j+=9) {
    box(c,x+j,y,Math.min(5,w-j),4,p.light);
    box(c,x+j,y+4,Math.min(5,w-j),2,p.edge);
    if(j+5<w)box(c,x+j+5,y+4,Math.min(4,w-j-5),2,p.shade);
  }
  box(c,x,y,w,1,p.light);
}
function building(c,b) {
  const {x,y,w,h,kind,featured}=b,p=palettes[kind];
  const rng=random(b.seed+110), shop=!!p.text;
  const fh=featured?30:Math.min(29,23+Math.floor(rng()*7));
  const rh=h-fh, front=y+rh, south=y+h;
  // Cast shadow laid into the pavement, avoiding solid black rectangles.
  poly(c,[[x+3,y+8],[x+w,y+5],[x+w+8,y+14],[x+w+8,south+5],[x+8,south+5]],'#4c465e');
  box(c,x-1,y,w+2,h+1,'#343445');
  box(c,x,front,w,fh,p.wall);
  box(c,x,front,3,fh,p.shade);box(c,x+w-3,front,3,fh,p.shade);
  for(let yy=front+1,k=0;yy<south-2;yy+=4,k++) {
    box(c,x+3,yy,w-6,1,p.shade);
    c.save();c.globalAlpha=0.55;
    for(let xx=x+4+k%2*3;xx<x+w-5;xx+=8){box(c,xx,yy+1,1,3,p.shade);if((xx+yy)%3===0)box(c,xx+1,yy+1,3,1,p.edge);}
    c.restore();
  }
  box(c,x,south-3,w,3,p.shade);
  if(shop) {
    let ww=featured?16:13;
    let n=Math.floor((w-12)/(ww+5));
    for(let k=0;k<n;k++)windowUnit(c,x+7+k*(ww+5),south-15,ww,12,p,rng);
    const doorX=x+w-22;
    box(c,doorX-1,south-17,14,17,p.shade);box(c,doorX,south-16,11,16,'#343c52');
    box(c,doorX+2,south-14,7,9,p.window);box(c,doorX+2,south-14,3,1,p.light);
    box(c,doorX+8,south-6,1,2,p.light);box(c,doorX-2,south-1,16,2,p.edge);
    if(kind==='garage'||kind==='fire') rollerDoor(c,x+6,south-17,Math.min(31,w/3|0),16,p);
    if(kind==='cafe'||kind==='grocery')stripedAwning(c,x+3,south-18,w-29,p);
    else{
      box(c,x+2,south-17,w-4,2,p.shade);box(c,x+3,south-17,w-6,1,p.trim);
    }
  }else{
    for(let xx=x+8;xx<x+w-17;xx+=16)windowUnit(c,xx,front+4,10,12,p,rng);
    box(c,x+w-16,south-18,10,18,'#454659');box(c,x+w-15,south-17,8,6,'#afa0a7');
    box(c,x+w-14,south-10,5,7,'#625a72');box(c,x+w-9,south-7,1,2,'#d5ac88');
  }
  roofSurface(c,b,p,rh);
  const rx=x+8,ry=y+7, rw=w-16;
  if(kind==='wool'&&featured) {
    vent(c,rx+2,ry+3,21,10);fan(c,rx+27,ry+4);
    line(c,rx+8,ry+18,rx+58,ry+18,p.shade,2);line(c,rx+58,ry+18,rx+62,ry+23,p.shade,2);
    box(c,x+w-61,y+rh-13,43,6,p.shade);
    yarnBall(c,x+w-45,y+rh-20,1.3,false);
    streetSign(c,x+Math.floor(w*0.46),front-4,p.text,p,true);
    box(c,x+w-9,y+rh-5,5,28,'#413e53');box(c,x+w-8,y+rh-4,3,24,p.trim);
    for(let k=0;k<5;k++)box(c,x+w-7,y+rh-2+4*k,1,2,p.glow);
  } else if(kind==='arcade'&&featured) {
    const mid=x+w*0.50|0;
    // Bulb-studded marquee mounted on the front parapet.
    box(c,x+5,front-4,w-10,7,p.trim);box(c,x+5,front-4,w-10,1,p.light);
    for(let kk=7;kk<w-6;kk+=5)box(c,x+kk,front-2,1,1,'#f4ceab');
    fan(c,rx+3,ry+2);fan(c,rx+19,ry+2);vent(c,rx+1,ry+20,19,8);
    joystick(c,mid-3,y+rh-23);
    box(c,x+w-46,y+11,28,11,'#474256');box(c,x+w-48,y+8,28,11,'#7e6a85');
    for(let i=0;i<5;i++)box(c,x+w-46+i*5,y+10,2,6,'#554b65');
    line(c,x+w-20,ry+15,x+w-15,ry+20,'#3c394b',2);line(c,x+w-15,ry+20,x+w-15,ry+27,'#3c394b',2);
    streetSign(c,mid,front-8,p.text,p,true);
    box(c,x+4,front+2,2,18,'#f68cdb');box(c,x+w-7,front+2,2,18,'#e580d4');
    box(c,x+3,south-1,w-7,1,'#bf6aa5');
    for(const aw of [x+7,x+w-37]){
      box(c,aw+1,south-13,28,3,'#58354e');
      for(let tt=0;tt<27;tt+=4){box(c,aw+tt,south-16,4,3,tt%8?'#b74898':'#e76aae');box(c,aw+tt,south-12,3,1,'#ec82c1');}
      box(c,aw,south-17,27,1,'#f7a1d3');
    }
    shopBands(c,b,p);
  }else {
    if(w>65){
      vent(c,rx+4,ry+3,18,9);
      if(w>100) {fan(c,rx+28,ry+3);fan(c,rx+43,ry+3);}
      if(kind==='apartments'||kind==='records') waterTank(c,x+w-24,y+20);
      else if(kind==='textile'||kind==='garage'){
        for(let q=0;q<3;q++){
          const xx=x+w-48+q*11;box(c,xx,y+7,8,13,'#464e66');box(c,xx+1,y+8,6,10,'#718699');
          line(c,xx+1,y+14,xx+6,y+9,'#a8a8b5');box(c,xx+1,y+17,6,1,p.shade);
        }
      } else if(kind==='clinic'){
        box(c,x+w-30,y+11,22,16,'#617a7f');box(c,x+w-22,y+13,5,12,'#a7cdbb');box(c,x+w-26,y+17,13,4,'#a7cdbb');
      } else {fan(c,x+w-26,y+9);}
      line(c,rx+6,ry+16,rx+6,ry+21,p.shade,2);line(c,rx+6,ry+21,rx+36,ry+21,p.shade,2);
    } else fan(c,rx+4,ry+3);
    if(shop)streetSign(c,x+w/2,front-3,p.text,p,false);
    if(kind==='cafe'&&featured)cafeCup(c,x+w*0.60|0,y+rh-18);
    if(kind==='apartments'){
      const ax=x+w-13,ay=y+rh-5;
      line(c,ax,ay,ax-3,ay-15,'#434355');line(c,ax-3,ay-12,ax+4,ay-18,'#a29aaa');
      line(c,ax-6,ay-15,ax-1,ay-10,'#c0aaba');line(c,ax,ay-18,ax+5,ay-13,'#c0aaba');
      if(w>110)stripedAwning(c,x+6,south-10,28,p);
    }
  }
  if(b.featured && shop) {
    halo(c,x+w/2,south+2,w*0.33,p.neon,0.15);
    const reflect=random(b.seed+410);
    for(let n=0;n<24;n++) {
      const xx=x+12+reflect()*(w-24), yy=south+3+reflect()*13;
      c.save();c.globalAlpha=0.13+reflect()*0.2;box(c,xx,yy,2+reflect()*5,1,p.neon);c.restore();
    }
  }
}
function cafeTerrace(c,e) {
  const {x,y,w,h}=e;
  box(c,x-1,y-1,w+1,h+1,'#4b4357');
  box(c,x,y,w,h,'#ad827e');
  for(let yy=0,n=0;yy<h;yy+=4,n++)for(let xx=(n%2)*4;xx<w;xx+=8)
    box(c,x+xx,y+yy,Math.min(4,w-xx),Math.min(4,h-yy),'#c29f8c');
  for(let yy=3;yy<h-3;yy+=5) {
    box(c,x+w-1,y+yy,2,3,'#4c485a');box(c,x+w-1,y+yy-1,2,1,'#c49680');
  }
  box(c,x+w-1,y+1,1,h-2,'#64546a');box(c,x,y+1,w,1,'#58475c');box(c,x,y,w,1,'#b98f91');
  const patioTable=(tx,ty,col)=>{
    // Chairs, table legs, stitched octagonal parasol and offset shadow.
    for(const dx of [-11,10]){box(c,tx+dx,ty+1,4,7,'#654b55');box(c,tx+dx,ty,4,4,'#d5a378');box(c,tx+dx,ty-2,4,1,'#e4bc91');}
    circle(c,tx+2,ty+3,6,'#7d625e');circle(c,tx,ty+1,6,'#e1af84');
    box(c,tx,ty-4,2,7,'#674b53');box(c,tx,ty-4,1,6,'#f3c8a0');
    const cy=ty-6;
    poly(c,[[tx-9,cy-3],[tx-4,cy-7],[tx+4,cy-7],[tx+10,cy-3],[tx+11,cy+2],[tx+6,cy+6],[tx-4,cy+6],[tx-10,cy+2]],'#6c4e59');
    const pts=[[tx-11,cy-3],[tx-5,cy-8],[tx+4,cy-8],[tx+10,cy-4],[tx+11,cy+1],[tx+5,cy+5],[tx-5,cy+5],[tx-11,cy+1]];
    pts.forEach((pt,k)=>poly(c,[[tx,cy-2],pt,pts[(k+1)%8]],k%2?'#ffca9e':col));
    box(c,tx-1,cy-3,3,2,'#ffe6af');box(c,tx-8,cy+2,2,1,'#ffdfa7');
  };
  patioTable(x+17,y+21,'#d95c72');patioTable(x+w-16,y+h-19,'#bf5f77');
  // Raised wooden planter, boxwood and flowers.
  for(const xx of [x+3,x+w-13]){
    box(c,xx,y+h-5,10,4,'#71565a');box(c,xx,y+h-7,10,3,'#577b66');
    box(c,xx+1,y+h-8,7,2,'#7a9974');box(c,xx+3,y+h-8,2,1,'#eeac8e');
  }
  const light=(xx,yy,co)=>{box(c,xx,yy,2,2,co);halo(c,xx,yy,6,co,0.22);};
  line(c,x-2,y+4,x+w/2,y+8,'#494454');line(c,x+w/2,y+8,x+w-1,y+4,'#494454');
  for(let k=3;k<w-1;k+=7)light(x+k,y+5+Math.round(Math.sin(k/w*Math.PI)*4),k%2?'#ffd28d':'#fba492');
}
function marketStand(c,e) {
  const {x,y,w}=e;
  for(let k=0;k<3;k++){
    const xx=x+k*12,yy=y+1;
    box(c,xx+1,yy+2,12,6,'#594a51');box(c,xx,yy,11,6,'#9d745d');
    box(c,xx+1,yy+1,9,4,'#564b51');
    const tones=[['#db686d','#ff9c7a'],['#df9e51','#ffd57b'],['#75a373','#b5cb7e']][k];
    for(let v=0;v<2;v++)for(let u=0;u<3;u++){
      box(c,xx+1+3*u+(v%2),yy+1+2*v,2,2,tones[0]);box(c,xx+1+3*u+(v%2),yy+1+2*v,1,1,tones[1]);
    }
    box(c,xx,yy+6,11,1,'#c39b77');
  }
  box(c,x+w-11,y+1,2,7,'#735c60');box(c,x+w-11,y,7,6,'#c19a7b');box(c,x+w-10,y+1,5,3,'#515a62');
  box(c,x+w-9,y+2,3,1,'#d2c2a2');
}
function joystick(c,x,y) {
  // Enormous arcade stick bolted to the roof, with a lit red ball top.
  box(c,x-14,y+4,34,4,'#41334c');
  poly(c,[[x-18,y-2],[x-10,y-8],[x+11,y-8],[x+17,y-4],[x+17,y+2],[x+10,y+6],[x-13,y+6],[x-18,y+3]],'#352d4f');
  poly(c,[[x-18,y-3],[x-10,y-9],[x+11,y-9],[x+17,y-5],[x+10,y],[x-12,y]],'#a68aca');
  poly(c,[[x-12,y],[x+10,y],[x+10,y+4],[x-12,y+4]],'#705189');
  line(c,x-16,y,x-12,y+3,'#dd92cb');box(c,x-11,y+3,21,1,'#ec85c9');
  box(c,x-11,y,5,1,'#e8afcc');circle(c,x-5,y-5,4,'#46344e');
  line(c,x-6,y-6,x-8,y-15,'#392f49',4);line(c,x-5,y-6,x-7,y-15,'#dab0bd',2);
  circle(c,x-8,y-18,6,'#a63368');circle(c,x-9,y-19,5,'#ef5d8b');
  box(c,x-12,y-22,3,2,'#ffb6aa');box(c,x-9,y-23,2,1,'#ffe0ca');
  box(c,x+4,y-6,4,2,'#8c2d64');box(c,x+4,y-7,4,1,'#ff7dab');
  box(c,x+10,y-5,3,2,'#6b3e83');box(c,x+10,y-6,3,1,'#eaa1f3');
  halo(c,x-8,y-19,13,'#ff659a',0.23);
}
function cafeCup(c,x,y) {
  box(c,x-10,y+5,24,2,'#513a51');box(c,x-10,y+3,21,2,'#d28582');box(c,x-7,y+5,14,1,'#f4ab94');
  box(c,x-8,y-6,14,8,'#b57275');box(c,x-7,y-7,13,7,'#f1bf96');
  box(c,x-6,y+1,11,2,'#e0a48c');box(c,x-8,y-7,15,2,'#ffdbad');box(c,x-6,y-7,11,1,'#885756');
  box(c,x+6,y-6,5,2,'#f5bf9c');box(c,x+10,y-5,2,4,'#d98f83');box(c,x+6,y-2,5,2,'#e2a58c');
  line(c,x-5,y-9,x-3,y-11,'#dc9a96');line(c,x-3,y-11,x-5,y-14,'#f4b49e');line(c,x+2,y-9,x+4,y-12,'#edac9a');
}
function shopBands(c,b,p) {
  const bottom=b.y+b.h;
  for(let n=0;n<2;n++){
    const xx=b.x+9+n*(b.w-19);box(c,xx,bottom-30,2,26,p.trim);box(c,xx,bottom-25,1,12,p.light);
  }
}
function litPavement(c,b,p) {
  const south=b.y+b.h, cx=b.x+b.w*0.48, width=b.w*0.37,depth=29;
  c.save();
  const rg=c.createRadialGradient(cx,south,1,cx,south,width);
  rg.addColorStop(0,p.neon+'65');rg.addColorStop(1,p.neon+'00');
  c.fillStyle=rg;c.fillRect(b.x,south,b.w,depth);
  const rng=random(b.seed+777);
  for(let i=0;i<38;i++){
    const yy=south+1+(rng()*depth|0),off=(rng()-0.5)*width*1.8;
    const strength=(1-Math.abs(off)/width)*(1-(yy-south)/depth);
    c.globalAlpha=Math.max(0,strength*.43);
    box(c,cx+off,yy,2+rng()*9,1,p.neon);
  }c.restore();
}
function park(c,b) {
  const {x,y,w,h,seed}=b,rng=random(seed+91);
  box(c,x+7,y+6,w-14,h-13,'#54566c');box(c,x+8,y+7,w-16,h-15,'#486065');
  box(c,x+10,y+9,w-20,h-19,'#4e706a');
  for(let n=0;n<1600;n++) {
    const xx=x+11+(rng()*(w-22)|0), yy=y+10+(rng()*(h-20)|0);
    box(c,xx,yy,1+(rng()*2|0),1,['#526e68','#45615f','#5c7c6d','#6b8673'][n%4]);
    if(n%8===0){box(c,xx+1,yy-1,1,1,'#739078');}
  }
  const cx=x+Math.round(w/2),cy=y+Math.round(h/2);
  box(c,x+6,cy-5,w-12,12,'#718078');box(c,cx-6,y+6,13,h-12,'#718078');
  box(c,x+6,cy-4,w-12,9,'#ac998a');box(c,cx-5,y+6,10,h-12,'#ac998a');
  for(let xx=x+8;xx<x+w-7;xx+=6)box(c,xx,cy-4,1,9,'#93887f');
  for(let yy=y+8;yy<y+h-7;yy+=6)box(c,cx-5,yy,10,1,'#93887f');
  circle(c,cx,cy+3,15,'#535c66');circle(c,cx,cy,16,'#bcc1af');circle(c,cx,cy,13,'#566e80');
  circle(c,cx,cy-1,11,'#5799a0');circle(c,cx-1,cy-2,8,'#69b5aa');
  box(c,cx-6,cy-1,4,1,'#9cd8c3');box(c,cx+3,cy+3,4,1,'#8cd7c6');
  box(c,cx-4,cy-3,9,3,'#667887');box(c,cx-2,cy-9,5,6,'#959ea4');
  box(c,cx-5,cy-10,11,3,'#afc2bb');box(c,cx-2,cy-13,5,3,'#91dfcb');
  for(let k=0;k<3;k++) {
    const xx=x+22+k*8,yy=y+h-30;
    box(c,xx,yy,4,2,'#374f59');box(c,xx+1,yy-2,2,2,k%2?'#d49fb0':'#deb781');
    box(c,x+w-xx+x, y+24,3,2,'#bba0c4');
  }
  // Iron railings with breaks at the path entrances.
  for(let xx=x+10;xx<x+w-8;xx+=5) {
    if(Math.abs(xx-cx)<9)continue;
    for(const yy of [y+8,y+h-8]){
      box(c,xx,yy-2,1,5,'#3a4655');box(c,xx,yy-3,1,1,'#89949a');
      box(c,xx,yy-1,Math.min(5,x+w-8-xx),1,'#566777');
    }
  }
}

function tree(c,t) {
  const {x,y,seed}=t,rng=random(seed+747);
  box(c,x-5,y-3,12,8,'#656777');box(c,x-6,y-3,12,7,'#999099');
  box(c,x-5,y-2,10,5,'#535861');
  for(let k=0;k<4;k++)box(c,x-4+k*2,y-2,1,5,'#66656a');
  box(c,x-2,y-7,5,9,'#574955');box(c,x-1,y-7,2,8,'#a28876');
  const r=9+Math.floor(rng()*3), cy=y-10;
  // Layered tuft silhouette and v-shaped stitch highlights.
  circle(c,x+3,cy+2,r,'#3d4d5b');circle(c,x,cy,r,'#36555a');
  const clumps=[[-4,-3,6],[3,-4,7],[-5,2,5],[3,2,6],[7,0,4]];
  for(const [dx,dy,rr] of clumps){
    circle(c,x+dx,cy+dy,rr,'#4e7269');circle(c,x+dx-1,cy+dy-1,rr-1,'#5c8572');
    line(c,x+dx-3,cy+dy-2,x+dx-1,cy+dy-4,'#80a17f');
  }
  for(let k=0;k<28;k++){
    const dx=Math.floor((rng()*2-1)*r),dy=Math.floor((rng()*2-1)*r);
    if(dx*dx+dy*dy>r*r*0.80)continue;
    const col=['#426560','#75a083','#97ad85','#4d7468'][k%4];
    box(c,x+dx,cy+dy,1,1,col);box(c,x+dx+1,cy+dy+1,2,1,col);
  }
}
function streetLamp(c,l) {
  const {x,y,side}=l,head=x+side*4;
  box(c,x-2,y-1,5,3,'#454452');box(c,x-1,y-13,2,13,'#414a5a');
  box(c,x-1,y-12,1,10,'#9d98a0');box(c,Math.min(x,head),y-15,5,2,'#444b5c');
  box(c,head-2,y-16,5,1,'#48445a');box(c,head-2,y-15,5,3,'#c8a98b');
  box(c,head-1,y-15,3,2,'#ffdfa2');halo(c,head,y-14,14,'#ffd09b',0.26);
  halo(c,head+side*2,y+1,20,'#ffc484',0.15);
}
function trafficSignal(c,s) {
  const {x,y}=s;
  box(c,x-1,y-1,4,2,'#4d4d60');box(c,x,y-9,2,9,'#475566');box(c,x,y-8,1,7,'#a297a3');
  box(c,x-2,y-14,5,8,'#302e41');box(c,x-1,y-14,3,1,'#8b7b89');
  box(c,x-1,y-12,2,1,'#9e5866');box(c,x-1,y-10,2,1,'#88745d');box(c,x-1,y-8,2,1,'#4d9f92');
}
function prop(c,p) {
  const x=p.x,y=p.y;
  switch(p.type){
    case 'bin':
      box(c,x-3,y-1,9,3,'#515363');box(c,x-3,y-6,7,7,'#344957');box(c,x-2,y-5,5,5,'#57736d');
      box(c,x-4,y-7,9,3,'#354653');box(c,x-3,y-7,7,1,'#88a495');box(c,x-1,y-5,1,4,'#779085');
      box(c,x-3,y+1,2,1,'#353943');box(c,x+2,y+1,2,1,'#353943');break;
    case 'hydrant':
      box(c,x-2,y,7,2,'#585363');box(c,x-3,y-1,6,2,'#703e49');box(c,x-2,y-6,4,6,'#bf6269');
      box(c,x-4,y-4,8,2,'#9c535e');box(c,x-4,y-4,2,1,'#e59786');box(c,x+2,y-4,2,2,'#d57d76');
      box(c,x-3,y-7,6,2,'#e69883');box(c,x-1,y-8,3,1,'#ffe3ac');box(c,x-1,y-4,1,5,'#efac8b');break;
    case 'crate':
      box(c,x-4,y-2,11,6,'#595261');box(c,x-5,y-6,10,9,'#65515a');box(c,x-4,y-5,8,7,'#a17b68');
      box(c,x-4,y-6,8,2,'#bb9979');box(c,x-4,y+1,8,1,'#c29d7f');box(c,x-4,y-4,1,6,'#c6a482');
      line(c,x-3,y+1,x+3,y-4,'#735c58');line(c,x-2,y+1,x+3,y-3,'#be9476');break;
    case 'bench':
      box(c,x-6,y,15,3,'#555364');box(c,x-5,y-2,2,5,'#42444e');box(c,x+4,y-2,2,5,'#42444e');
      box(c,x-6,y-5,13,2,'#b3947c');box(c,x-6,y-3,13,1,'#6f5a61');box(c,x-6,y-1,13,1,'#d0a386');
      box(c,x-6,y,13,1,'#926e68');break;
    case 'mailbox':
      box(c,x-3,y,8,2,'#535361');box(c,x-2,y-3,2,5,'#4d5261');box(c,x+2,y-3,2,5,'#4d5261');
      box(c,x-4,y-9,8,8,'#42627d');box(c,x-3,y-10,6,1,'#90afb5');box(c,x-3,y-8,1,6,'#7699ac');
      box(c,x-2,y-8,4,1,'#323949');box(c,x-1,y-5,3,2,'#c0bbc0');break;
  }
}
function debris(c,o) {
  const color={crate:'#b99476',hydrant:'#cc8a7e',bin:'#718e86',bench:'#b4937a',mailbox:'#8096a7'}[o.type]||'#9c8796';
  const x=o.x,y=o.y;
  box(c,x-5,y,3,1,'#525160');box(c,x+1,y+2,3,1,'#555466');
  box(c,x-4,y-1,2,1,color);box(c,x+3,y,2,1,color);box(c,x,y+2,1,1,color);
}
function createCanvas(w,h) {
  const cv=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');
  cv.width=w;cv.height=h;return cv;
}
function bake() {
  backdrop=createCanvas(WORLD_W,WORLD_H);
  const c=backdrop.getContext('2d');c.imageSmoothingEnabled=false;
  streetLayer(c);
  for(const l of lots){pavement(c,l);if(l.kind==='park')park(c,l);}
  for(const b of buildings)building(c,b);
  for(const e of extras){if(e.kind==='terrace')cafeTerrace(c,e);else marketStand(c,e);}
  for(const b of buildings)if((b.featured||b.kind==='grocery')&&palettes[b.kind].text)litPavement(c,b,palettes[b.kind]);
  for(const l of lamps)streetLamp(c,l);
  for(const t of trees)tree(c,t);
  for(const s of signals)trafficSignal(c,s);
  for(const g of glows)halo(c,g.x,g.y,g.r,g.color,0.14);
}
export function drawWorld(ctx,camera,worldState={},time=0) {
  if(!backdrop)bake();
  const {x,y,w,h}=camera;
  ctx.imageSmoothingEnabled=false;
  const left=Math.max(0,Math.floor(x)-1),top=Math.max(0,Math.floor(y)-1);
  const right=Math.min(WORLD_W,Math.ceil(x+w)+1),bottom=Math.min(WORLD_H,Math.ceil(y+h)+1);
  if(right>left&&bottom>top)ctx.drawImage(backdrop,left,top,right-left,bottom-top,left,top,right-left,bottom-top);
  const d=worldState.destroyed;
  for(const o of objects){
    if(o.x<left-8||o.x>right+8||o.y<top-3||o.y>bottom+12)continue;
    if(d?.has(o.id))debris(ctx,o);else prop(ctx,o);
  }
  const phase=Math.floor(time/6);
  for(const s of signals){
    if(s.x<left-5||s.x>right+5||s.y<top||s.y>bottom+15)continue;
    const stop=(phase+(s.x%2))%2===0;
    box(ctx,s.x-1,s.y-(stop?12:8),2,1,stop?'#ff8c95':'#8ae7bd');
  }
}
function bakeMap() {
  mapLayer=createCanvas(WORLD_W,WORLD_H);
  const c=mapLayer.getContext('2d');
  box(c,0,0,WORLD_W,WORLD_H,'#49425a');
  for(const x of roads.xs)box(c,x-23,0,46,WORLD_H,'#474258');
  for(const y of roads.ys)box(c,0,y-23,WORLD_W,46,'#474258');
  for(const l of lots) {
    box(c,l.x-3,l.y-3,l.w+6,l.h+6,'#82758c');
    box(c,l.x,l.y,l.w,l.h,l.kind==='park'?'#496c65':'#5d566f');
    if(l.kind==='park'){
      box(c,l.x+7,l.y+8,l.w-14,l.h-16,'#638175');
      box(c,l.x+l.w/2-3,l.y+8,6,l.h-16,'#829c86');
      box(c,l.x+7,l.y+l.h/2-3,l.w-14,6,'#829c86');
    }
  }
  for(const b of buildings) {
    const p=palettes[b.kind],col=b.featured?p.roof:mapColors[b.seed%mapColors.length];
    box(c,b.x,b.y,b.w,b.h,'#484458');box(c,b.x+1,b.y+1,b.w-5,b.h-6,col);
    box(c,b.x+2,b.y+1,b.w-5,2,p.edge);
  }
  for(const x of roads.xs)for(let y=0;y<WORLD_H;y+=27){
    if(roads.ys.every(j=>Math.abs(y-j)>41))box(c,x-1,y,2,10,'#7f7688');
  }
  for(const y of roads.ys)for(let x=0;x<WORLD_W;x+=27){
    if(roads.xs.every(j=>Math.abs(x-j)>41))box(c,x,y-1,10,2,'#7f7688');
  }
}
export function drawMap(ctx,x,y,w,h,worldState={}) {
  if(!mapLayer)bakeMap();
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(mapLayer,x,y,w,h);ctx.restore();
}
