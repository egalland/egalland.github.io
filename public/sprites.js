import {drawToyWeapon} from './weapon-artwork.js';

/* Pixel sprites for Maille City. All artwork is drawn on a small integer grid. */
const INK = '#21182f';
const SHADOW = '#342240';
const LIGHT = '#fff0d4';
const stamps = new Map();

function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function pixels(ctx, rows, px, py, palette) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length;) {
      const symbol = row[x];
      let end = x + 1;
      while (row[end] === symbol) end++;
      if (palette[symbol]) box(ctx, px + x, py + y, end - x, 1, palette[symbol]);
      x = end;
    }
  }
}
function tint(value, toward, amt) {
  if (!/^#[0-9a-f]{6}$/i.test(value)) return value;
  const from = parseInt(value.slice(1), 16);
  const to = parseInt(toward.slice(1), 16);
  return '#' + [16, 8, 0].map(shift => Math.round(((from >> shift) & 255) * (1 - amt)
    + ((to >> shift) & 255) * amt).toString(16).padStart(2, '0')).join('');
}
function indexOfVariant(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.abs(v | 0);
  let hash = 0;
  for (const c of String(v ?? 0)) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return hash >>> 0;
}
function stamp(ctx, key, w, h, x, y, dw, dh, paint) {
  let canvas = stamps.get(key);
  if (!canvas) {
    canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h)
      : typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!canvas) {
      ctx.save(); ctx.translate(x, y); ctx.scale(dw / w, dh / h); paint(ctx); ctx.restore();
      return;
    }
    canvas.width = w;
    canvas.height = h;
    paint(canvas.getContext('2d'));
    if (stamps.size >= 700) stamps.delete(stamps.keys().next().value);
    stamps.set(key, canvas);
  }
  ctx.drawImage(canvas, x, y, dw, dh);
}

const COATS = ['#bd5797','#438b83','#b96e42','#6777b4','#bd5362','#818e4e','#9c65b7','#448d9f'];
const ANIMALS = ['fox', 'rabbit', 'bear', 'cat', 'raccoon', 'rabbit', 'cat', 'bear'];
const FURS = {
  fox:     ['#ee8d41','#b34e39','#ffd189','#fcdfac','#d89985','#ffe1ac'],
  rabbit:  ['#ded3ce','#aa94a6','#fff2e3','#f3ddd7','#d6aec1','#e89da6'],
  bear:    ['#aa795b','#7d5359','#d4a279','#edc99f','#c39183','#d18b86'],
  cat:     ['#c1a2b9','#88738c','#ecd0d3','#e8d2cf','#c7a3b0','#e4a0ad'],
  raccoon: ['#97a2af','#66687e','#d6d7d8','#e1d9d6','#a6a3b0','#c694a2']
};
const FRONT = [
  '  xx          xx  ',
  '  xhx        xhx  ',
  '  xhhx      xhhx  ',
  '  xhphxxxxxxhphx  ',
  '  xovhhoooohhvox  ',
  ' xsooooohhooossox ',
  ' xhohooooooohooox ',
  'xhoooohsooshoooosx',
  'xooookxhoohkxooosx',
  'xsommkxmoomkxmmosx',
  ' xmmmmmmkkmmmmmmx ',
  '  xmbmmmkkmmmmbx  ',
  '   xxmmmmsmmmxx   ',
  '     xxmbbbxx     ',
  '       xxxx       '
];
const BACK = [
  '  xx          xx  ',
  '  xhx        xhx  ',
  '  xhhx      xhhx  ',
  '  xohhxxxxxxhhox  ',
  '  xsshhohoohhssx  ',
  ' xshoohooohoooosx ',
  ' xhoohooohoohoosx ',
  'xhhooohooohooooosx',
  'xoohooohoooohoossx',
  'xsooohooohoohoossx',
  ' xssooohooohoossx ',
  '  xssoooohooossx  ',
  '   xxssssoossxx   ',
  '     xxssssxx     ',
  '       xxxx       '
];
const BASE_HEAD = [
  '     xxxxxxxx     ',
  '   xxhhoooohhxx   ',
  '  xohhooooohoosx  ',
  ' xhohooohhoohoosx ',
  ' xhoohoooohoooosx ',
  'xhoohooooooohooosx',
  'xooookxhoohkxooosx',
  'xsommkxmoomkxmmosx',
  ' xmmmmmmkkmmmmmmx ',
  '  xmbmmmkkmmmmbx  ',
  '   xxmmmmsmmmxx   ',
  '     xxmbbbxx     ',
  '       xxxx       '
];
const RABBIT_EARS = [
  '   xx      xx    ',
  '  xhhx    xhhx   ',
  '  xhpx    xphx   ',
  '  xhpx    xphx   ',
  '  xopx    xpox   ',
  '   xoxxxxxxsx    '
];
const ROUND_EARS = [
  '  xxxx      xxxx  ',
  ' xhoohx    xhoohx ',
  ' xhppohxxxxhoppox ',
  '  xsooooooooosx   '
];
function face(ctx, animal, x, y, back = false, look = 0) {
  const [base, shade, hi, muzzle, muzzleShade, pink] = FURS[animal] || FURS.fox;
  const p = {x:INK,o:base,s:shade,h:hi,m:muzzle,b:muzzleShade,p:pink,v:shade,k:'#382735'};
  if (animal === 'rabbit' || animal === 'bear' || animal === 'raccoon') {
    pixels(ctx, animal === 'rabbit' ? RABBIT_EARS : ROUND_EARS, x, y + (animal === 'rabbit' ? -2 : 0), p);
    pixels(ctx, back ? BACK.slice(2) : BASE_HEAD, x, y+3, p);
  } else {
    pixels(ctx, back ? BACK : FRONT, x, y, p);
  }
  if (back) return;
  const yy = y + (animal === 'rabbit' || animal === 'bear' || animal === 'raccoon' ? 1 : 0);
  if (animal === 'raccoon') {
    box(ctx,x+3,yy+7,4,3,'#505064'); box(ctx,x+11,yy+7,4,3,'#505064');
    box(ctx,x+5,yy+8,2,2,INK); box(ctx,x+11,yy+8,2,2,INK);
  }
  // A single luminous eye stitch stays visible at street scale.
  box(ctx,x+5+look,yy+8,1,1,'#fff1d5'); box(ctx,x+11+look,yy+8,1,1,'#fff1d5');
  box(ctx,x+8+look,yy+10,2,1,'#2a2031');
  if (animal === 'fox' || animal === 'cat') {
    box(ctx,x+1,yy+8,2,1,hi); box(ctx,x+15,yy+8,2,1,shade);
  }
}
function outfit(type, color, variant) {
  switch (type) {
    case 'police': return ['#40618a','#86b3cb','#e0c275'];
    case 'firefighter': return ['#785743','#edb753','#dde1aa'];
    case 'medic': return ['#c4dcda','#fbf1dc','#ef666c'];
    case 'swat': return ['#464b69','#838ba0','#9cbbb9'];
    case 'fox': case 'player': return ['#287e85','#66bcc0','#efcc76'];
    default: {
      const coat = color || COATS[variant % COATS.length];
      return [coat,tint(coat,'#f1d1df',.38),tint(coat,'#fff3df',.7)];
    }
  }
}
function wearHat(ctx,x,y,type,back) {
  if (type === 'police') {
    pixels(ctx,['   xxxxxxxx   ',' xxllllhhllxx ','xllllhhllllllx','xsssllddlllssx',' xbbbbbbbbbbx ','   xxxxxxxx   '],x,y+2,{
      x:INK,l:'#415778',s:'#2d375a',h:'#5c7495',d:'#ebd186',b:back?'#35445f':'#272c48'});
  } else if (type === 'firefighter') {
    pixels(ctx,['    xxxxxx    ','   xrraarrx   ','  xrhhaaarrx  ',' xrhrhhaaarrx ','xrrrrbbrrrrrrx',' xhhaaaaaahhx '],x,y+2,{
      x:INK,r:'#dd7956',a:'#f5b263',h:'#ffd594',b:'#f6d896'});
  } else if (type === 'swat') {
    pixels(ctx,['    xxxxxx    ','  xxllhhllxx  ',' xllhhllllllx ',' xlhllllssslx ','xsssggggggsssx',' xssgggcggssx ','  xxxggggxxx  '],x,y+2,{
      x:INK,l:'#525971',h:'#737a90',s:'#36394d',g:back?'#4c536c':'#375261',c:back?'#5c6174':'#93ccca'});
  } else if (type === 'medic') {
    box(ctx,x+1,y+4,12,3,'#d9e6dc'); box(ctx,x+2,y+4,10,1,'#f8f5df');
    box(ctx,x+6,y+4,2,3,'#e05c68'); box(ctx,x+5,y+5,4,1,'#e05c68');
  }
}
function paintPerson(ctx, type, animal, color, variant, back, look, stride) {
  const [coat, hi, trim] = outfit(type,color,variant);
  const shade = tint(coat,'#271b39',.45);
  const hip = stride === 0 ? 0 : 1;
  const y = stride === 0 ? 5 : 4;
  const left = stride < 0 ? 1 : 0, right = stride > 0 ? 1 : 0;
  // Feet and woven sneaker soles are independent to avoid sideways bobbing.
  box(ctx,9,25+left,6,5,INK); box(ctx,17,25+right,6,5,INK);
  box(ctx,10,26+left,4,2,'#4b425f'); box(ctx,18,26+right,4,2,'#4b425f');
  box(ctx,8,29+left,6,1,'#99bac4'); box(ctx,18,29+right,6,1,'#99bac4');
  if (animal === 'fox' || animal === 'raccoon' || animal === 'cat') {
    ctx.save();
    if (look < 0) {ctx.translate(32,0);ctx.scale(-1,1);}
    pixels(ctx,['   xx','  xmxx',' xmhox','xhoosx','xsssx ',' xxx  '],3,20+hip,{
      x:INK,m:FURS[animal][3],h:FURS[animal][2],o:FURS[animal][0],s:FURS[animal][1]});
    ctx.restore();
  }
  pixels(ctx,[
    '    xxxxxxxxxx    ','  xxddddhhddddxx  ',' xhhdhddddddhdssx ',
    ' xhsdddoodoodsdsx ',' xhdddoodoodddssx ','xshddoodooodddsssx',
    'xshddooodoooddsssx',' xmxxdoodooddxxmx ','  xx xsssssxx xx  ',
  ],7,18-hip,{x:INK,d:coat,s:shade,h:hi,o:tint(coat,hi,.38),m:FURS[animal][3]});
  if (!back) {
    box(ctx,14,21-hip,1,3,trim); box(ctx,18,21-hip,1,2,trim);
    box(ctx,14,25-hip,4,1,shade);
  } else {
    pixels(ctx,['xhhhhx',' xhhx ','  xx  '],13,21-hip,{x:shade,h:hi});
  }
  if (type === 'fox' || type === 'player') {
    pixels(ctx,['hh          hh',' hh        hh ','  hhh    hhh  ','     hddh     ','      hh      '],9,20-hip,
      {h:'#efc57a',d:color || '#58d6cf'});
    if (!back) {
      box(ctx,15,22-hip,3,3,'#ecc578');box(ctx,16,23-hip,1,1,'#55e5de');
      box(ctx,14,27-hip,5,1,'#d19a62');
    }
  }
  if (type === 'medic') {
    box(ctx,20,22-hip,1,3,trim);box(ctx,19,23-hip,3,1,trim);
  } else if (type === 'police'){
    box(ctx,20,22-hip,2,2,trim);box(ctx,10,26-hip,13,1,'#252637');
  } else if (type === 'firefighter') {
    box(ctx,10,25-hip,13,2,trim);box(ctx,7,24-hip,3,1,trim);
  } else if (type === 'swat') {
    box(ctx,11,22-hip,10,5,'#343a4e');box(ctx,12,23-hip,2,3,'#515b6b');
    box(ctx,16,23-hip,2,3,'#515b6b');
  }
  face(ctx,animal,7+look,y,back,look);
  wearHat(ctx,9+look,y,type,back);
}

export function drawActor(ctx, actor, time = 0) {
  const type = actor.type || 'fox';
  const n = indexOfVariant(actor.variant ?? actor.id ?? 0);
  const animal = type === 'fox' || type === 'player' ? 'fox' 
    : type === 'police' ? 'raccoon' : type === 'firefighter' ? 'bear'
    : type === 'medic' ? 'rabbit' : type === 'swat' ? 'raccoon' : ANIMALS[n % ANIMALS.length];
  const angle = Number.isFinite(actor.angle) ? actor.angle : 1.57;
  const back = Math.sin(angle) < -.72;
  const look = Math.abs(Math.cos(angle)) > .44 ? Math.sign(Math.cos(angle)) : 0;
  const wave = Math.sin(Number.isFinite(actor.walk) ? actor.walk : time * 12);
  const stride = actor.moving ? (Math.abs(wave) < .28 ? 0 : Math.sign(wave)) : 0;
  const color = typeof actor.color === 'string' ? actor.color : '';
  const dim = 23;
  const key = ['p',type,animal,color,n % 8,back,look,stride].join('|');
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle='rgba(15,12,32,.51)';ctx.beginPath();
  ctx.ellipse(actor.x,actor.y+7,7.3,2.5,0,0,Math.PI*2);ctx.fill();
  stamp(ctx,key,32,32,actor.x-dim/2,actor.y-dim/2-1,dim,dim,
    c => paintPerson(c,type,animal,color,n,back,look,stride));
  ctx.restore();
}

export function drawAvatar(ctx, x, y, size, variant = 'fox') {
  const animal = FURS[variant] ? variant : typeof variant === 'number' ? ANIMALS[variant % ANIMALS.length] : 'fox';
  ctx.save(); ctx.imageSmoothingEnabled = false;
  stamp(ctx,'portrait|'+animal,40,40,x,y,size,size,c => {
    // A tailored cape trimmed in two colours of gold thread.
    pixels(c,[
      '        xxxxxxxxxxxxxxxx        ','      xxhhhtttsmmttthhhxx       ',
      '    xxhttthggggggggghttthxx     ','  xxhttttgggqaaaaaaqgggttthxx   ',
      ' xhtthttggqqathhhhatqqggtthttx  ','xhtthttggqtathhllhhtatqggtthttx ',
      'xhttttggqtthhltttlhhttqtggtthhx ','xttthggqthhltthhlttlhhtqggttttx ',
      'xhtgggqtthlttlhhltttthhtqgggttx ','xgggqqthllhtthllhtthllhtthqqgggx',
      'xgqqthllttlhhtttthhlttllhthtqqgx','xghlttlhhllhhttlhhhttthhlhhtthgx',
      'xghtlttlhhttlhhhttthhhttlhhlthx ','xxxxgggggggggggggggggggggggxxxx '
    ],4,27,{x:INK,t:'#297e83',m:'#20616d',s:'#194d60',h:'#54aba5',l:'#346d78',
      a:'#118e99',g:'#e2b267',q:'#f3d68d'});
    c.save();c.translate(2,0);c.scale(2,2);face(c,animal,0,0);c.restore();
    if (animal === 'fox') {
      // Bright cheek tufts echo Kikalmo's stitched fox costume.
      pixels(c,['mm   ',' hmm ','  humm','   hhm'],1,17,{m:'#f2ce99',h:'#ffe7b4',u:'#e2ae87'});
      c.save();c.translate(40,0);c.scale(-1,1);
      pixels(c,['mm   ',' hmm ','  humm','   hhm'],1,17,{m:'#f2ce99',h:'#ffe7b4',u:'#e2ae87'});
      c.restore();
      // Small crossed threads in the buttons and copper fur.
      box(c,13,18,1,1,'#8b6659');box(c,25,18,1,1,'#8b6659');
      box(c,17,11,2,1,'#ffd797');box(c,18,12,1,1,'#ffd797');
      box(c,21,9,2,1,'#e0753e');box(c,20,10,1,1,'#e0753e');
    }
    pixels(c,['  gg  ',' gqqg ','gqaadg','gqahdg',' gddg ','  gg  '],17,31,
      {g:'#a8754b',q:'#ffe4a0',a:'#41c8c2',d:'#0d8997',h:'#a2efdc'});
  });ctx.restore();
}

const LACQUER = ['#c96387','#efba59','#5cabaf','#937db7','#b9b2a5','#db7e5a','#7286bb','#719e7e'];
function carBody(ctx, type, paint, long, taxi) {
  const length = long ? 47 : 41;
  const height = long ? 25 : 23;
  const body = paint, mid = tint(body,'#2f2639',.19), dark = tint(body,'#2a243b',.49);
  const lit = tint(body,'#ffe8cd',.39), thread = tint(body,'#ffe8cd',.19);
  const top = 3, bottom = height-4;
  const front = length-4;
  for (const axle of [8, length-11]) {
    box(ctx,axle,1,6,height-2,'#141626');
    box(ctx,axle+1,1,4,1,'#4d455d');box(ctx,axle+1,height-2,4,1,'#4d455d');
  }
  // Cloth-covered bodywork, with a deep hem on the passenger side.
  box(ctx,2,top+2,length-4,bottom-top-3,INK);
  box(ctx,4,top,length-8,bottom-top+1,INK);
  box(ctx,6,top-1,length-12,bottom-top+3,INK);
  box(ctx,4,top+2,length-8,bottom-top-3,body);
  box(ctx,6,top,length-12,bottom-top,body);
  box(ctx,7,top,length-14,1,lit);box(ctx,4,top+3,1,7,thread);
  box(ctx,4,bottom-3,length-8,2,mid);box(ctx,6,bottom-1,length-12,2,dark);
  box(ctx,front,top+3,2,height-13,mid);
  box(ctx,front+1,top+5,1,height-17,lit);
  box(ctx,1,top+5,2,height-16,'#677185');box(ctx,front+1,top+7,1,3,'#e4dfce');
  // Headlight clusters, rear lights and bumpers.
  for (const cy of [top+1,bottom-4]) {
    box(ctx,front-1,cy,2,3,'#efd58e');box(ctx,front,cy,2,2,'#fff0b6');
    box(ctx,3,cy,2,3,'#db5568');box(ctx,3,cy+1,1,1,'#ffc097');
  }
  box(ctx,3,9,1,height-19,'#45374e');box(ctx,3,11,1,2,'#bac0c2');
  if (long) {
    if (type === 'firetruck') {
      // Stacked hose and a silver woven ladder over the equipment bed.
      box(ctx,6,5,22,15,'#673e53');box(ctx,7,6,20,13,'#b66158');
      box(ctx,7,6,20,1,'#e5a17b');box(ctx,7,17,19,2,'#854d50');
      box(ctx,9,7,16,3,'#884b4e');box(ctx,10,8,12,1,'#e5a174');
      box(ctx,7,11,21,7,'#4e5261');
      box(ctx,7,10,21,2,'#d3ccc3');box(ctx,7,16,21,2,'#a3b0b5');
      for(let j=9;j<27;j+=4) {box(ctx,j,12,2,4,'#9baeb3');box(ctx,j,12,1,3,'#d9d9c9');}
      box(ctx,8,20,19,1,'#e9d393');
    } else {
      box(ctx,5,5,23,height-10,dark);
      box(ctx,6,5,21,height-12,body);
      box(ctx,7,5,19,1,lit);
      for(let j=8;j<25;j+=4) {box(ctx,j,7,2,1,thread);box(ctx,j+1,8,1,1,thread);}
      if(type==='ambulance'){
        box(ctx,13,9,4,8,'#39959e');box(ctx,11,11,8,4,'#39959e');
        box(ctx,7,19,20,2,'#68b8b9');box(ctx,7,20,20,1,'#628aa3');
      } else {
        box(ctx,9,10,13,7,'#3f4657');box(ctx,10,10,12,1,'#818392');
        for(let j=11;j<22;j+=3)box(ctx,j,12,1,4,'#646a78');
        box(ctx,7,19,19,1,'#8e96a4');
      }
    }
    // Tall cab and its wraparound windscreen.
    box(ctx,29,4,9,height-8,dark);box(ctx,30,5,6,height-10,body);
    windscreen(ctx,35,5,height-10,true);
    box(ctx,40,7,3,1,lit);box(ctx,41,9,2,1,thread);box(ctx,40,height-8,3,1,dark);
  } else {
    box(ctx,9,4,20,height-8,dark);
    box(ctx,10,4,17,1,lit);box(ctx,10,bottom-2,18,2,dark);
    windscreen(ctx,8,6,height-12,false);
    box(ctx,13,6,12,height-12,body);box(ctx,14,6,9,1,lit);
    box(ctx,14,height-8,10,1,mid);
    // Woven double stitch on the roof and bonnet.
    for(let j=15;j<24;j+=4){box(ctx,j,8,1,1,thread);box(ctx,j+1,9,1,1,thread);}
    windscreen(ctx,25,5,height-10,true);
    box(ctx,31,6,5,1,lit);box(ctx,34,7,2,1,thread);
    box(ctx,31,height-8,6,1,dark);box(ctx,32,height-10,3,1,mid);
    if (type === 'police') {
      box(ctx,14,6,11,height-12,'#68869a');box(ctx,14,6,10,1,'#adb8ba');
      box(ctx,17,9,4,4,'#e9cc81');box(ctx,18,13,2,1,'#f6db95');
      for(let j=9;j<28;j+=4){box(ctx,j,top,2,1,'#e9e5ce');box(ctx,j+2,bottom-1,2,1,'#e9e5ce');}
    } else if (taxi) {
      box(ctx,16,9,8,5,INK);box(ctx,17,9,6,3,'#f3dc9a');
      box(ctx,18,10,1,1,'#5d4850');box(ctx,21,10,1,1,'#5d4850');
      for(let j=10;j<27;j+=4) {
        box(ctx,j,bottom-2,2,1,'#5d4850');box(ctx,j+2,bottom-1,2,1,'#5d4850');
      }
    }
  }
  const mirror = long ? 34 : 25;
  box(ctx,mirror,top-2,3,3,INK);box(ctx,mirror+1,top-2,2,1,lit);
  box(ctx,mirror,bottom,3,3,INK);box(ctx,mirror+1,bottom+1,2,1,mid);
}
function windscreen(ctx,x,y,h,front) {
  box(ctx,x,y+1,5,h-2,'#283044');box(ctx,x+1,y,3,h,'#354153');
  box(ctx,x+1,y+2,3,h-4,front?'#739fa9':'#526e8a');
  box(ctx,x+1,y+2,1,h-5,front?'#a6d3cf':'#7893a5');
  box(ctx,x+2,y+3,2,2,front?'#cee5d7':'#95adba');
  box(ctx,x+3,y+5,1,1,front?'#a5cbc8':'#7f9aa7');
  box(ctx,x+2,y+h-4,2,2,'#4b6676');
}
function cone(ctx, nose, y, on) {
  const reach = on ? 18 : 13;
  ctx.fillStyle = on ? 'rgba(255,221,152,.115)' : 'rgba(255,221,152,.075)';
  ctx.beginPath();ctx.moveTo(nose,y-1);ctx.lineTo(nose+reach,y-4);
  ctx.lineTo(nose+reach+1,y+4);ctx.lineTo(nose,y+1);ctx.fill();
}
export function drawVehicle(ctx, vehicle, time = 0) {
  const type = vehicle.type || 'car';
  const long = ['firetruck','ambulance','swat'].includes(type);
  const n = indexOfVariant(vehicle.variant ?? vehicle.id ?? 0);
  const paint = type === 'police' ? '#536981' : type === 'firetruck' ? '#cf6458'
    : type === 'ambulance' ? '#e1e1c9' : type === 'swat' ? '#505868' : vehicle.color || LACQUER[n % LACQUER.length];
  const taxi = type === 'car' && n % 8 === 1;
  const w = long ? 47 : 41, h = long ? 25 : 23;
  const emergency = ['police','firetruck','ambulance','swat'].includes(type);
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(vehicle.x,vehicle.y);
  ctx.rotate(vehicle.angle || 0);ctx.scale(.88,.88);
  ctx.fillStyle = 'rgba(13,12,29,.48)';ctx.beginPath();ctx.ellipse(1,1,w*.48,h*.46,0,0,Math.PI*2);ctx.fill();
  cone(ctx,w/2-2,-h/2+5,emergency);cone(ctx,w/2-2,h/2-6,emergency);
  stamp(ctx,['v',type,paint,taxi].join('|'),w,h,-w/2,-h/2,w,h,c => carBody(c,type,paint,long,taxi));
  if (emergency) {
    const sx = long ? 8 : 1;
    const active = Math.sin(time*8+n) > 0;
    box(ctx,sx-1,-5,4,10,'#283044');
    box(ctx,sx,-4,2,3,active?'#b8f6ff':'#5f94d1');
    box(ctx,sx,1,2,3,active?'#ab546a':'#ffc1a6');
    box(ctx,sx,-1,2,2,'#b0b8c1');
    const ly=active?-3:2;
    ctx.fillStyle=active?'rgba(97,197,245,.13)':'rgba(239,106,135,.12)';
    ctx.beginPath();ctx.arc(sx+1,ly,6,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

// Every inventory slot uses the same appliqué as its marker in the city.
export function drawItemIcon(ctx, kind, x, y, size) {
  if(!drawToyWeapon(ctx,kind,x,y,size))drawToyWeapon(ctx,'fist',x,y,size);
}
