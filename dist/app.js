var _n={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Pn={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},wu=0,Ic=1,Au=2;var Lc=1,Aa=2,Gn=3,ei=0,Wt=1,xn=2,si=0,ki=1,Dc=2,Uc=3,Nc=4,Ru=5,yi=100,Cu=101,Pu=102,Iu=103,Lu=104,Du=200,Uu=201,Nu=202,Fu=203,Ko=204,jo=205,Ou=206,Bu=207,zu=208,ku=209,Hu=210,Vu=211,Gu=212,Wu=213,Xu=214,Ra=0,Ca=1,Pa=2,Hi=3,Ia=4,La=5,Da=6,Ua=7,Fc=0,qu=1,Yu=2,ri=0,$u=1,Zu=2,Ju=3,Na=4,Ku=5,ju=6,Qu=7;var Oc=300,Ki=301,ji=302,Fa=303,Oa=304,ro=306,vi=1e3,xi=1001,Qo=1002,Zt=1003,ed=1004;var oo=1005;var An=1006,Ba=1007;var Ri=1008;var In=1009,Bc=1010,zc=1011,Ws=1012,za=1013,Ci=1014,Ln=1015,Xs=1016,ka=1017,Ha=1018,qs=1020,kc=35902,Hc=35899,Vc=1021,Gc=1022,yn=1023,As=1026,Ys=1027,Va=1028,Ga=1029,Wc=1030,Wa=1031;var Xa=1033,ao=33776,lo=33777,co=33778,ho=33779,qa=35840,Ya=35841,$a=35842,Za=35843,Ja=36196,Ka=37492,ja=37496,Qa=37808,el=37809,tl=37810,nl=37811,il=37812,sl=37813,rl=37814,ol=37815,al=37816,ll=37817,cl=37818,hl=37819,ul=37820,dl=37821,fl=36492,pl=36494,ml=36495,gl=36283,_l=36284,xl=36285,yl=36286;var Ar=2300,ea=2301,Zo=2302,yc=2400,vc=2401,Mc=2402;var td=3200,nd=3201;var Xc=0,id=1,oi="",vt="srgb",Vi="srgb-linear",Rr="linear",at="srgb";var zi=7680;var Sc=519,sd=512,rd=513,od=514,qc=515,ad=516,ld=517,cd=518,hd=519,bc=35044;var Yc="300 es",wn=2e3,Cr=2001;var On=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Ut=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Zh=1234567,br=Math.PI/180,Rs=180/Math.PI;function Qi(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ut[i&255]+Ut[i>>8&255]+Ut[i>>16&255]+Ut[i>>24&255]+"-"+Ut[e&255]+Ut[e>>8&255]+"-"+Ut[e>>16&15|64]+Ut[e>>24&255]+"-"+Ut[t&63|128]+Ut[t>>8&255]+"-"+Ut[t>>16&255]+Ut[t>>24&255]+Ut[n&255]+Ut[n>>8&255]+Ut[n>>16&255]+Ut[n>>24&255]).toLowerCase()}function Ye(i,e,t){return Math.max(e,Math.min(t,i))}function $c(i,e){return(i%e+e)%e}function Ef(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function Tf(i,e,t){return i!==e?(t-i)/(e-i):0}function Er(i,e,t){return(1-t)*i+t*e}function wf(i,e,t,n){return Er(i,e,1-Math.exp(-t*n))}function Af(i,e=1){return e-Math.abs($c(i,e*2)-e)}function Rf(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function Cf(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function Pf(i,e){return i+Math.floor(Math.random()*(e-i+1))}function If(i,e){return i+Math.random()*(e-i)}function Lf(i){return i*(.5-Math.random())}function Df(i){i!==void 0&&(Zh=i);let e=Zh+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Uf(i){return i*br}function Nf(i){return i*Rs}function Ff(i){return(i&i-1)===0&&i!==0}function Of(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Bf(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function zf(i,e,t,n,s){let r=Math.cos,o=Math.sin,a=r(t/2),l=o(t/2),c=r((e+n)/2),h=o((e+n)/2),u=r((e-n)/2),f=o((e-n)/2),d=r((n-e)/2),g=o((n-e)/2);switch(s){case"XYX":i.set(a*h,l*u,l*f,a*c);break;case"YZY":i.set(l*f,a*h,l*u,a*c);break;case"ZXZ":i.set(l*u,l*f,a*h,a*c);break;case"XZX":i.set(a*h,l*g,l*d,a*c);break;case"YXY":i.set(l*d,a*h,l*g,a*c);break;case"ZYZ":i.set(l*g,l*d,a*h,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Ts(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Vt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Wn={DEG2RAD:br,RAD2DEG:Rs,generateUUID:Qi,clamp:Ye,euclideanModulo:$c,mapLinear:Ef,inverseLerp:Tf,lerp:Er,damp:wf,pingpong:Af,smoothstep:Rf,smootherstep:Cf,randInt:Pf,randFloat:If,randFloatSpread:Lf,seededRandom:Df,degToRad:Uf,radToDeg:Nf,isPowerOfTwo:Ff,ceilPowerOfTwo:Of,floorPowerOfTwo:Bf,setQuaternionFromProperEuler:zf,normalize:Vt,denormalize:Ts},ee=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ye(this.x,e.x,t.x),this.y=Ye(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ye(this.x,e,t),this.y=Ye(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ye(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ye(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*s+e.x,this.y=r*s+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ft=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,o,a){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],f=r[o+0],d=r[o+1],g=r[o+2],_=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u;return}if(a===1){e[t+0]=f,e[t+1]=d,e[t+2]=g,e[t+3]=_;return}if(u!==_||l!==f||c!==d||h!==g){let m=1-a,p=l*f+c*d+h*g+u*_,M=p>=0?1:-1,v=1-p*p;if(v>Number.EPSILON){let A=Math.sqrt(v),T=Math.atan2(A,p*M);m=Math.sin(m*T)/A,a=Math.sin(a*T)/A}let x=a*M;if(l=l*m+f*x,c=c*m+d*x,h=h*m+g*x,u=u*m+_*x,m===1-a){let A=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=A,c*=A,h*=A,u*=A}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,o){let a=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[o],f=r[o+1],d=r[o+2],g=r[o+3];return e[t]=a*g+h*u+l*d-c*f,e[t+1]=l*g+h*f+c*u-a*d,e[t+2]=c*g+h*d+a*f-l*u,e[t+3]=h*g-a*u-l*f-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(s/2),u=a(r/2),f=l(n/2),d=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=f*h*u+c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u-f*d*g;break;case"YXZ":this._x=f*h*u+c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u+f*d*g;break;case"ZXY":this._x=f*h*u-c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u-f*d*g;break;case"ZYX":this._x=f*h*u-c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u+f*d*g;break;case"YZX":this._x=f*h*u+c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u-f*d*g;break;case"XZY":this._x=f*h*u-c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u+f*d*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],h=t[6],u=t[10],f=n+a+u;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(o-s)*d}else if(n>a&&n>u){let d=2*Math.sqrt(1+n-a-u);this._w=(h-l)/d,this._x=.25*d,this._y=(s+o)/d,this._z=(r+c)/d}else if(a>u){let d=2*Math.sqrt(1+a-n-u);this._w=(r-c)/d,this._x=(s+o)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+u-n-a);this._w=(o-s)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ye(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-n*c,this._z=r*h+o*c+n*l-s*a,this._w=o*h-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+n*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let d=1-t;return this._w=d*o+t*this._w,this._x=d*n+t*this._x,this._y=d*s+t*this._y,this._z=d*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-t)*h)/c,f=Math.sin(t*h)/c;return this._w=o*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},R=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Jh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Jh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*n),h=2*(a*t-r*s),u=2*(r*n-o*t);return this.x=t+l*c+o*u-a*h,this.y=n+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ye(this.x,e.x,t.x),this.y=Ye(this.y,e.y,t.y),this.z=Ye(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ye(this.x,e,t),this.y=Ye(this.y,e,t),this.z=Ye(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ye(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ql.copy(this).projectOnVector(e),this.sub(ql)}reflect(e){return this.sub(ql.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ye(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ql=new R,Jh=new Ft,Xe=class i{constructor(e,t,n,s,r,o,a,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,l,c)}set(e,t,n,s,r,o,a,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],u=n[7],f=n[2],d=n[5],g=n[8],_=s[0],m=s[3],p=s[6],M=s[1],v=s[4],x=s[7],A=s[2],T=s[5],C=s[8];return r[0]=o*_+a*M+l*A,r[3]=o*m+a*v+l*T,r[6]=o*p+a*x+l*C,r[1]=c*_+h*M+u*A,r[4]=c*m+h*v+u*T,r[7]=c*p+h*x+u*C,r[2]=f*_+d*M+g*A,r[5]=f*m+d*v+g*T,r[8]=f*p+d*x+g*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*o*h-t*a*c-n*r*h+n*a*l+s*r*c-s*o*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=h*o-a*c,f=a*l-h*r,d=c*r-o*l,g=t*u+n*f+s*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/g;return e[0]=u*_,e[1]=(s*c-h*n)*_,e[2]=(a*n-s*o)*_,e[3]=f*_,e[4]=(h*t-s*l)*_,e[5]=(s*r-a*t)*_,e[6]=d*_,e[7]=(n*l-c*t)*_,e[8]=(o*t-n*r)*_,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Yl.makeScale(e,t)),this}rotate(e){return this.premultiply(Yl.makeRotation(-e)),this}translate(e,t){return this.premultiply(Yl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Yl=new Xe;function Zc(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Cs(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function ud(){let i=Cs("canvas");return i.style.display="block",i}var Kh={};function Ps(i){i in Kh||(Kh[i]=!0,console.warn(i))}function dd(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var jh=new Xe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Qh=new Xe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function kf(){let i={enabled:!0,workingColorSpace:Vi,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===at&&(s.r=Qn(s.r),s.g=Qn(s.g),s.b=Qn(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===at&&(s.r=ws(s.r),s.g=ws(s.g),s.b=ws(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===oi?Rr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Ps("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Ps("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Vi]:{primaries:e,whitePoint:n,transfer:Rr,toXYZ:jh,fromXYZ:Qh,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:vt},outputColorSpaceConfig:{drawingBufferColorSpace:vt}},[vt]:{primaries:e,whitePoint:n,transfer:at,toXYZ:jh,fromXYZ:Qh,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:vt}}}),i}var nt=kf();function Qn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ws(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var us,ta=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{us===void 0&&(us=Cs("canvas")),us.width=e.width,us.height=e.height;let s=us.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=us}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Cs("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Qn(r[o]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Qn(t[n]/255)*255):t[n]=Qn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Hf=0,Is=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Hf++}),this.uuid=Qi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push($l(s[o].image)):r.push($l(s[o]))}else r=$l(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function $l(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ta.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Vf=0,Zl=new R,Ot=class i extends On{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=xi,s=xi,r=An,o=Ri,a=yn,l=In,c=i.DEFAULT_ANISOTROPY,h=oi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Vf++}),this.uuid=Qi(),this.name="",this.source=new Is(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new ee(0,0),this.repeat=new ee(1,1),this.center=new ee(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Xe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(Zl).x}get height(){return this.source.getSize(Zl).y}get depth(){return this.source.getSize(Zl).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Oc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case vi:e.x=e.x-Math.floor(e.x);break;case xi:e.x=e.x<0?0:1;break;case Qo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case vi:e.y=e.y-Math.floor(e.y);break;case xi:e.y=e.y<0?0:1;break;case Qo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Ot.DEFAULT_IMAGE=null;Ot.DEFAULT_MAPPING=Oc;Ot.DEFAULT_ANISOTROPY=1;var ot=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],h=l[4],u=l[8],f=l[1],d=l[5],g=l[9],_=l[2],m=l[6],p=l[10];if(Math.abs(h-f)<.01&&Math.abs(u-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let v=(c+1)/2,x=(d+1)/2,A=(p+1)/2,T=(h+f)/4,C=(u+_)/4,P=(g+m)/4;return v>x&&v>A?v<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(v),s=T/n,r=C/n):x>A?x<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),n=T/s,r=P/s):A<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(A),n=C/r,s=P/r),this.set(n,s,r,t),this}let M=Math.sqrt((m-g)*(m-g)+(u-_)*(u-_)+(f-h)*(f-h));return Math.abs(M)<.001&&(M=1),this.x=(m-g)/M,this.y=(u-_)/M,this.z=(f-h)/M,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ye(this.x,e.x,t.x),this.y=Ye(this.y,e.y,t.y),this.z=Ye(this.z,e.z,t.z),this.w=Ye(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ye(this.x,e,t),this.y=Ye(this.y,e,t),this.z=Ye(this.z,e,t),this.w=Ye(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ye(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},na=class extends On{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:An,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new ot(0,0,e,t),this.scissorTest=!1,this.viewport=new ot(0,0,e,t);let s={width:e,height:t,depth:n.depth},r=new Ot(s);this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){let t={minFilter:An,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isArrayTexture=this.textures[s].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Is(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Bn=class extends na{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Pr=class extends Ot{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Zt,this.minFilter=Zt,this.wrapR=xi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var ia=class extends Ot{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Zt,this.minFilter=Zt,this.wrapR=xi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var an=class{constructor(e=new R(1/0,1/0,1/0),t=new R(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(bn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(bn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=bn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,bn):bn.fromBufferAttribute(r,o),bn.applyMatrix4(e.matrixWorld),this.expandByPoint(bn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),To.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),To.copy(n.boundingBox)),To.applyMatrix4(e.matrixWorld),this.union(To)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,bn),bn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(pr),wo.subVectors(this.max,pr),ds.subVectors(e.a,pr),fs.subVectors(e.b,pr),ps.subVectors(e.c,pr),ui.subVectors(fs,ds),di.subVectors(ps,fs),Ni.subVectors(ds,ps);let t=[0,-ui.z,ui.y,0,-di.z,di.y,0,-Ni.z,Ni.y,ui.z,0,-ui.x,di.z,0,-di.x,Ni.z,0,-Ni.x,-ui.y,ui.x,0,-di.y,di.x,0,-Ni.y,Ni.x,0];return!Jl(t,ds,fs,ps,wo)||(t=[1,0,0,0,1,0,0,0,1],!Jl(t,ds,fs,ps,wo))?!1:(Ao.crossVectors(ui,di),t=[Ao.x,Ao.y,Ao.z],Jl(t,ds,fs,ps,wo))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,bn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(bn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:($n[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),$n[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),$n[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),$n[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),$n[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),$n[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),$n[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),$n[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints($n),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},$n=[new R,new R,new R,new R,new R,new R,new R,new R],bn=new R,To=new an,ds=new R,fs=new R,ps=new R,ui=new R,di=new R,Ni=new R,pr=new R,wo=new R,Ao=new R,Fi=new R;function Jl(i,e,t,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){Fi.fromArray(i,r);let a=s.x*Math.abs(Fi.x)+s.y*Math.abs(Fi.y)+s.z*Math.abs(Fi.z),l=e.dot(Fi),c=t.dot(Fi),h=n.dot(Fi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var Gf=new an,mr=new R,Kl=new R,ti=class{constructor(e=new R,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Gf.setFromPoints(e).getCenter(n);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;mr.subVectors(e,this.center);let t=mr.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(mr,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Kl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(mr.copy(e.center).add(Kl)),this.expandByPoint(mr.copy(e.center).sub(Kl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Zn=new R,jl=new R,Ro=new R,fi=new R,Ql=new R,Co=new R,ec=new R,Mi=class{constructor(e=new R,t=new R(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Zn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Zn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Zn.copy(this.origin).addScaledVector(this.direction,t),Zn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){jl.copy(e).add(t).multiplyScalar(.5),Ro.copy(t).sub(e).normalize(),fi.copy(this.origin).sub(jl);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Ro),a=fi.dot(this.direction),l=-fi.dot(Ro),c=fi.lengthSq(),h=Math.abs(1-o*o),u,f,d,g;if(h>0)if(u=o*l-a,f=o*a-l,g=r*h,u>=0)if(f>=-g)if(f<=g){let _=1/h;u*=_,f*=_,d=u*(u+o*f+2*a)+f*(o*u+f+2*l)+c}else f=r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;else f=-r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;else f<=-g?(u=Math.max(0,-(-o*r+a)),f=u>0?-r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c):f<=g?(u=0,f=Math.min(Math.max(-r,-l),r),d=f*(f+2*l)+c):(u=Math.max(0,-(o*r+a)),f=u>0?r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c);else f=o>0?-r:r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(jl).addScaledVector(Ro,f),d}intersectSphere(e,t){Zn.subVectors(e.center,this.origin);let n=Zn.dot(this.direction),s=Zn.dot(Zn)-n*n,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(n=(e.min.x-f.x)*c,s=(e.max.x-f.x)*c):(n=(e.max.x-f.x)*c,s=(e.min.x-f.x)*c),h>=0?(r=(e.min.y-f.y)*h,o=(e.max.y-f.y)*h):(r=(e.max.y-f.y)*h,o=(e.min.y-f.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(e.min.z-f.z)*u,l=(e.max.z-f.z)*u):(a=(e.max.z-f.z)*u,l=(e.min.z-f.z)*u),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,Zn)!==null}intersectTriangle(e,t,n,s,r){Ql.subVectors(t,e),Co.subVectors(n,e),ec.crossVectors(Ql,Co);let o=this.direction.dot(ec),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;fi.subVectors(this.origin,e);let l=a*this.direction.dot(Co.crossVectors(fi,Co));if(l<0)return null;let c=a*this.direction.dot(Ql.cross(fi));if(c<0||l+c>o)return null;let h=-a*fi.dot(ec);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},st=class i{constructor(e,t,n,s,r,o,a,l,c,h,u,f,d,g,_,m){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,l,c,h,u,f,d,g,_,m)}set(e,t,n,s,r,o,a,l,c,h,u,f,d,g,_,m){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=f,p[3]=d,p[7]=g,p[11]=_,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/ms.setFromMatrixColumn(e,0).length(),r=1/ms.setFromMatrixColumn(e,1).length(),o=1/ms.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let f=o*h,d=o*u,g=a*h,_=a*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=d+g*c,t[5]=f-_*c,t[9]=-a*l,t[2]=_-f*c,t[6]=g+d*c,t[10]=o*l}else if(e.order==="YXZ"){let f=l*h,d=l*u,g=c*h,_=c*u;t[0]=f+_*a,t[4]=g*a-d,t[8]=o*c,t[1]=o*u,t[5]=o*h,t[9]=-a,t[2]=d*a-g,t[6]=_+f*a,t[10]=o*l}else if(e.order==="ZXY"){let f=l*h,d=l*u,g=c*h,_=c*u;t[0]=f-_*a,t[4]=-o*u,t[8]=g+d*a,t[1]=d+g*a,t[5]=o*h,t[9]=_-f*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let f=o*h,d=o*u,g=a*h,_=a*u;t[0]=l*h,t[4]=g*c-d,t[8]=f*c+_,t[1]=l*u,t[5]=_*c+f,t[9]=d*c-g,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let f=o*l,d=o*c,g=a*l,_=a*c;t[0]=l*h,t[4]=_-f*u,t[8]=g*u+d,t[1]=u,t[5]=o*h,t[9]=-a*h,t[2]=-c*h,t[6]=d*u+g,t[10]=f-_*u}else if(e.order==="XZY"){let f=o*l,d=o*c,g=a*l,_=a*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=f*u+_,t[5]=o*h,t[9]=d*u-g,t[2]=g*u-d,t[6]=a*h,t[10]=_*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Wf,e,Xf)}lookAt(e,t,n){let s=this.elements;return rn.subVectors(e,t),rn.lengthSq()===0&&(rn.z=1),rn.normalize(),pi.crossVectors(n,rn),pi.lengthSq()===0&&(Math.abs(n.z)===1?rn.x+=1e-4:rn.z+=1e-4,rn.normalize(),pi.crossVectors(n,rn)),pi.normalize(),Po.crossVectors(rn,pi),s[0]=pi.x,s[4]=Po.x,s[8]=rn.x,s[1]=pi.y,s[5]=Po.y,s[9]=rn.y,s[2]=pi.z,s[6]=Po.z,s[10]=rn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],u=n[5],f=n[9],d=n[13],g=n[2],_=n[6],m=n[10],p=n[14],M=n[3],v=n[7],x=n[11],A=n[15],T=s[0],C=s[4],P=s[8],b=s[12],S=s[1],L=s[5],O=s[9],k=s[13],G=s[2],X=s[6],W=s[10],se=s[14],U=s[3],te=s[7],oe=s[11],ge=s[15];return r[0]=o*T+a*S+l*G+c*U,r[4]=o*C+a*L+l*X+c*te,r[8]=o*P+a*O+l*W+c*oe,r[12]=o*b+a*k+l*se+c*ge,r[1]=h*T+u*S+f*G+d*U,r[5]=h*C+u*L+f*X+d*te,r[9]=h*P+u*O+f*W+d*oe,r[13]=h*b+u*k+f*se+d*ge,r[2]=g*T+_*S+m*G+p*U,r[6]=g*C+_*L+m*X+p*te,r[10]=g*P+_*O+m*W+p*oe,r[14]=g*b+_*k+m*se+p*ge,r[3]=M*T+v*S+x*G+A*U,r[7]=M*C+v*L+x*X+A*te,r[11]=M*P+v*O+x*W+A*oe,r[15]=M*b+v*k+x*se+A*ge,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],h=e[2],u=e[6],f=e[10],d=e[14],g=e[3],_=e[7],m=e[11],p=e[15];return g*(+r*l*u-s*c*u-r*a*f+n*c*f+s*a*d-n*l*d)+_*(+t*l*d-t*c*f+r*o*f-s*o*d+s*c*h-r*l*h)+m*(+t*c*u-t*a*d-r*o*u+n*o*d+r*a*h-n*c*h)+p*(-s*a*h-t*l*u+t*a*f+s*o*u-n*o*f+n*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=e[9],f=e[10],d=e[11],g=e[12],_=e[13],m=e[14],p=e[15],M=u*m*c-_*f*c+_*l*d-a*m*d-u*l*p+a*f*p,v=g*f*c-h*m*c-g*l*d+o*m*d+h*l*p-o*f*p,x=h*_*c-g*u*c+g*a*d-o*_*d-h*a*p+o*u*p,A=g*u*l-h*_*l-g*a*f+o*_*f+h*a*m-o*u*m,T=t*M+n*v+s*x+r*A;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/T;return e[0]=M*C,e[1]=(_*f*r-u*m*r-_*s*d+n*m*d+u*s*p-n*f*p)*C,e[2]=(a*m*r-_*l*r+_*s*c-n*m*c-a*s*p+n*l*p)*C,e[3]=(u*l*r-a*f*r-u*s*c+n*f*c+a*s*d-n*l*d)*C,e[4]=v*C,e[5]=(h*m*r-g*f*r+g*s*d-t*m*d-h*s*p+t*f*p)*C,e[6]=(g*l*r-o*m*r-g*s*c+t*m*c+o*s*p-t*l*p)*C,e[7]=(o*f*r-h*l*r+h*s*c-t*f*c-o*s*d+t*l*d)*C,e[8]=x*C,e[9]=(g*u*r-h*_*r-g*n*d+t*_*d+h*n*p-t*u*p)*C,e[10]=(o*_*r-g*a*r+g*n*c-t*_*c-o*n*p+t*a*p)*C,e[11]=(h*a*r-o*u*r-h*n*c+t*u*c+o*n*d-t*a*d)*C,e[12]=A*C,e[13]=(h*_*s-g*u*s+g*n*f-t*_*f-h*n*m+t*u*m)*C,e[14]=(g*a*s-o*_*s-g*n*l+t*_*l+o*n*m-t*a*m)*C,e[15]=(o*u*s-h*a*s+h*n*l-t*u*l-o*n*f+t*a*f)*C,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,o=e.x,a=e.y,l=e.z,c=r*o,h=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+n,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,o){return this.set(1,n,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,h=o+o,u=a+a,f=r*c,d=r*h,g=r*u,_=o*h,m=o*u,p=a*u,M=l*c,v=l*h,x=l*u,A=n.x,T=n.y,C=n.z;return s[0]=(1-(_+p))*A,s[1]=(d+x)*A,s[2]=(g-v)*A,s[3]=0,s[4]=(d-x)*T,s[5]=(1-(f+p))*T,s[6]=(m+M)*T,s[7]=0,s[8]=(g+v)*C,s[9]=(m-M)*C,s[10]=(1-(f+_))*C,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=ms.set(s[0],s[1],s[2]).length(),o=ms.set(s[4],s[5],s[6]).length(),a=ms.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],En.copy(this);let c=1/r,h=1/o,u=1/a;return En.elements[0]*=c,En.elements[1]*=c,En.elements[2]*=c,En.elements[4]*=h,En.elements[5]*=h,En.elements[6]*=h,En.elements[8]*=u,En.elements[9]*=u,En.elements[10]*=u,t.setFromRotationMatrix(En),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,s,r,o,a=wn,l=!1){let c=this.elements,h=2*r/(t-e),u=2*r/(n-s),f=(t+e)/(t-e),d=(n+s)/(n-s),g,_;if(l)g=r/(o-r),_=o*r/(o-r);else if(a===wn)g=-(o+r)/(o-r),_=-2*o*r/(o-r);else if(a===Cr)g=-o/(o-r),_=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=u,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,o,a=wn,l=!1){let c=this.elements,h=2/(t-e),u=2/(n-s),f=-(t+e)/(t-e),d=-(n+s)/(n-s),g,_;if(l)g=1/(o-r),_=o/(o-r);else if(a===wn)g=-2/(o-r),_=-(o+r)/(o-r);else if(a===Cr)g=-1/(o-r),_=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=u,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},ms=new R,En=new st,Wf=new R(0,0,0),Xf=new R(1,1,1),pi=new R,Po=new R,rn=new R,eu=new st,tu=new Ft,Rn=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],f=s[6],d=s[10];switch(t){case"XYZ":this._y=Math.asin(Ye(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ye(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ye(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ye(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Ye(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-Ye(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return eu.makeRotationFromQuaternion(e),this.setFromRotationMatrix(eu,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return tu.setFromEuler(this),this.setFromQuaternion(tu,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Rn.DEFAULT_ORDER="XYZ";var Ls=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},qf=0,nu=new R,gs=new Ft,Jn=new st,Io=new R,gr=new R,Yf=new R,$f=new Ft,iu=new R(1,0,0),su=new R(0,1,0),ru=new R(0,0,1),ou={type:"added"},Zf={type:"removed"},_s={type:"childadded",child:null},tc={type:"childremoved",child:null},Lt=class i extends On{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:qf++}),this.uuid=Qi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new R,t=new Rn,n=new Ft,s=new R(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new st},normalMatrix:{value:new Xe}}),this.matrix=new st,this.matrixWorld=new st,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ls,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return gs.setFromAxisAngle(e,t),this.quaternion.multiply(gs),this}rotateOnWorldAxis(e,t){return gs.setFromAxisAngle(e,t),this.quaternion.premultiply(gs),this}rotateX(e){return this.rotateOnAxis(iu,e)}rotateY(e){return this.rotateOnAxis(su,e)}rotateZ(e){return this.rotateOnAxis(ru,e)}translateOnAxis(e,t){return nu.copy(e).applyQuaternion(this.quaternion),this.position.add(nu.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(iu,e)}translateY(e){return this.translateOnAxis(su,e)}translateZ(e){return this.translateOnAxis(ru,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Jn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Io.copy(e):Io.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),gr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Jn.lookAt(gr,Io,this.up):Jn.lookAt(Io,gr,this.up),this.quaternion.setFromRotationMatrix(Jn),s&&(Jn.extractRotation(s.matrixWorld),gs.setFromRotationMatrix(Jn),this.quaternion.premultiply(gs.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(ou),_s.child=e,this.dispatchEvent(_s),_s.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Zf),tc.child=e,this.dispatchEvent(tc),tc.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Jn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Jn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Jn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(ou),_s.child=e,this.dispatchEvent(_s),_s.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(gr,e,Yf),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(gr,$f,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),h=o(e.images),u=o(e.shapes),f=o(e.skeletons),d=o(e.animations),g=o(e.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};Lt.DEFAULT_UP=new R(0,1,0);Lt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Lt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Tn=new R,Kn=new R,nc=new R,jn=new R,xs=new R,ys=new R,au=new R,ic=new R,sc=new R,rc=new R,oc=new ot,ac=new ot,lc=new ot,_i=class i{constructor(e=new R,t=new R,n=new R){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Tn.subVectors(e,t),s.cross(Tn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Tn.subVectors(s,t),Kn.subVectors(n,t),nc.subVectors(e,t);let o=Tn.dot(Tn),a=Tn.dot(Kn),l=Tn.dot(nc),c=Kn.dot(Kn),h=Kn.dot(nc),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let f=1/u,d=(c*l-a*h)*f,g=(o*h-a*l)*f;return r.set(1-d-g,g,d)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,jn)===null?!1:jn.x>=0&&jn.y>=0&&jn.x+jn.y<=1}static getInterpolation(e,t,n,s,r,o,a,l){return this.getBarycoord(e,t,n,s,jn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,jn.x),l.addScaledVector(o,jn.y),l.addScaledVector(a,jn.z),l)}static getInterpolatedAttribute(e,t,n,s,r,o){return oc.setScalar(0),ac.setScalar(0),lc.setScalar(0),oc.fromBufferAttribute(e,t),ac.fromBufferAttribute(e,n),lc.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(oc,r.x),o.addScaledVector(ac,r.y),o.addScaledVector(lc,r.z),o}static isFrontFacing(e,t,n,s){return Tn.subVectors(n,t),Kn.subVectors(e,t),Tn.cross(Kn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Tn.subVectors(this.c,this.b),Kn.subVectors(this.a,this.b),Tn.cross(Kn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,o,a;xs.subVectors(s,n),ys.subVectors(r,n),ic.subVectors(e,n);let l=xs.dot(ic),c=ys.dot(ic);if(l<=0&&c<=0)return t.copy(n);sc.subVectors(e,s);let h=xs.dot(sc),u=ys.dot(sc);if(h>=0&&u<=h)return t.copy(s);let f=l*u-h*c;if(f<=0&&l>=0&&h<=0)return o=l/(l-h),t.copy(n).addScaledVector(xs,o);rc.subVectors(e,r);let d=xs.dot(rc),g=ys.dot(rc);if(g>=0&&d<=g)return t.copy(r);let _=d*c-l*g;if(_<=0&&c>=0&&g<=0)return a=c/(c-g),t.copy(n).addScaledVector(ys,a);let m=h*g-d*u;if(m<=0&&u-h>=0&&d-g>=0)return au.subVectors(r,s),a=(u-h)/(u-h+(d-g)),t.copy(s).addScaledVector(au,a);let p=1/(m+_+f);return o=_*p,a=f*p,t.copy(n).addScaledVector(xs,o).addScaledVector(ys,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},fd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},mi={h:0,s:0,l:0},Lo={h:0,s:0,l:0};function cc(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var $e=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=vt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,nt.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=nt.workingColorSpace){return this.r=e,this.g=t,this.b=n,nt.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=nt.workingColorSpace){if(e=$c(e,1),t=Ye(t,0,1),n=Ye(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=cc(o,r,e+1/3),this.g=cc(o,r,e),this.b=cc(o,r,e-1/3)}return nt.colorSpaceToWorking(this,s),this}setStyle(e,t=vt){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=vt){let n=fd[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Qn(e.r),this.g=Qn(e.g),this.b=Qn(e.b),this}copyLinearToSRGB(e){return this.r=ws(e.r),this.g=ws(e.g),this.b=ws(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=vt){return nt.workingToColorSpace(Nt.copy(this),e),Math.round(Ye(Nt.r*255,0,255))*65536+Math.round(Ye(Nt.g*255,0,255))*256+Math.round(Ye(Nt.b*255,0,255))}getHexString(e=vt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=nt.workingColorSpace){nt.workingToColorSpace(Nt.copy(this),t);let n=Nt.r,s=Nt.g,r=Nt.b,o=Math.max(n,s,r),a=Math.min(n,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=nt.workingColorSpace){return nt.workingToColorSpace(Nt.copy(this),t),e.r=Nt.r,e.g=Nt.g,e.b=Nt.b,e}getStyle(e=vt){nt.workingToColorSpace(Nt.copy(this),e);let t=Nt.r,n=Nt.g,s=Nt.b;return e!==vt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(mi),this.setHSL(mi.h+e,mi.s+t,mi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(mi),e.getHSL(Lo);let n=Er(mi.h,Lo.h,t),s=Er(mi.s,Lo.s,t),r=Er(mi.l,Lo.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Nt=new $e;$e.NAMES=fd;var Jf=0,zn=class extends On{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Jf++}),this.uuid=Qi(),this.name="",this.type="Material",this.blending=ki,this.side=ei,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ko,this.blendDst=jo,this.blendEquation=yi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new $e(0,0,0),this.blendAlpha=0,this.depthFunc=Hi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Sc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=zi,this.stencilZFail=zi,this.stencilZPass=zi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ki&&(n.blending=this.blending),this.side!==ei&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Ko&&(n.blendSrc=this.blendSrc),this.blendDst!==jo&&(n.blendDst=this.blendDst),this.blendEquation!==yi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Hi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Sc&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==zi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==zi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==zi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Si=class extends zn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new $e(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Rn,this.combine=Fc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var St=new R,Do=new ee,Kf=0,$t=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Kf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=bc,this.updateRanges=[],this.gpuType=Ln,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Do.fromBufferAttribute(this,t),Do.applyMatrix3(e),this.setXY(t,Do.x,Do.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyMatrix3(e),this.setXYZ(t,St.x,St.y,St.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyMatrix4(e),this.setXYZ(t,St.x,St.y,St.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyNormalMatrix(e),this.setXYZ(t,St.x,St.y,St.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.transformDirection(e),this.setXYZ(t,St.x,St.y,St.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Ts(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Vt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ts(t,this.array)),t}setX(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ts(t,this.array)),t}setY(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ts(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ts(t,this.array)),t}setW(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array),s=Vt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array),s=Vt(s,this.array),r=Vt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==bc&&(e.usage=this.usage),e}};var Ir=class extends $t{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Lr=class extends $t{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var Qe=class extends $t{constructor(e,t,n){super(new Float32Array(e),t,n)}},jf=0,mn=new st,hc=new Lt,vs=new R,on=new an,_r=new an,Pt=new R,yt=class i extends On{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:jf++}),this.uuid=Qi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Zc(e)?Lr:Ir)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Xe().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return mn.makeRotationFromQuaternion(e),this.applyMatrix4(mn),this}rotateX(e){return mn.makeRotationX(e),this.applyMatrix4(mn),this}rotateY(e){return mn.makeRotationY(e),this.applyMatrix4(mn),this}rotateZ(e){return mn.makeRotationZ(e),this.applyMatrix4(mn),this}translate(e,t,n){return mn.makeTranslation(e,t,n),this.applyMatrix4(mn),this}scale(e,t,n){return mn.makeScale(e,t,n),this.applyMatrix4(mn),this}lookAt(e){return hc.lookAt(e),hc.updateMatrix(),this.applyMatrix4(hc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(vs).negate(),this.translate(vs.x,vs.y,vs.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Qe(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new an);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new R(-1/0,-1/0,-1/0),new R(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];on.setFromBufferAttribute(r),this.morphTargetsRelative?(Pt.addVectors(this.boundingBox.min,on.min),this.boundingBox.expandByPoint(Pt),Pt.addVectors(this.boundingBox.max,on.max),this.boundingBox.expandByPoint(Pt)):(this.boundingBox.expandByPoint(on.min),this.boundingBox.expandByPoint(on.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ti);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new R,1/0);return}if(e){let n=this.boundingSphere.center;if(on.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];_r.setFromBufferAttribute(a),this.morphTargetsRelative?(Pt.addVectors(on.min,_r.min),on.expandByPoint(Pt),Pt.addVectors(on.max,_r.max),on.expandByPoint(Pt)):(on.expandByPoint(_r.min),on.expandByPoint(_r.max))}on.getCenter(n);let s=0;for(let r=0,o=e.count;r<o;r++)Pt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Pt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Pt.fromBufferAttribute(a,c),l&&(vs.fromBufferAttribute(e,c),Pt.add(vs)),s=Math.max(s,n.distanceToSquared(Pt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new $t(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let P=0;P<n.count;P++)a[P]=new R,l[P]=new R;let c=new R,h=new R,u=new R,f=new ee,d=new ee,g=new ee,_=new R,m=new R;function p(P,b,S){c.fromBufferAttribute(n,P),h.fromBufferAttribute(n,b),u.fromBufferAttribute(n,S),f.fromBufferAttribute(r,P),d.fromBufferAttribute(r,b),g.fromBufferAttribute(r,S),h.sub(c),u.sub(c),d.sub(f),g.sub(f);let L=1/(d.x*g.y-g.x*d.y);isFinite(L)&&(_.copy(h).multiplyScalar(g.y).addScaledVector(u,-d.y).multiplyScalar(L),m.copy(u).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(L),a[P].add(_),a[b].add(_),a[S].add(_),l[P].add(m),l[b].add(m),l[S].add(m))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let P=0,b=M.length;P<b;++P){let S=M[P],L=S.start,O=S.count;for(let k=L,G=L+O;k<G;k+=3)p(e.getX(k+0),e.getX(k+1),e.getX(k+2))}let v=new R,x=new R,A=new R,T=new R;function C(P){A.fromBufferAttribute(s,P),T.copy(A);let b=a[P];v.copy(b),v.sub(A.multiplyScalar(A.dot(b))).normalize(),x.crossVectors(T,b);let L=x.dot(l[P])<0?-1:1;o.setXYZW(P,v.x,v.y,v.z,L)}for(let P=0,b=M.length;P<b;++P){let S=M[P],L=S.start,O=S.count;for(let k=L,G=L+O;k<G;k+=3)C(e.getX(k+0)),C(e.getX(k+1)),C(e.getX(k+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new $t(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);let s=new R,r=new R,o=new R,a=new R,l=new R,c=new R,h=new R,u=new R;if(e)for(let f=0,d=e.count;f<d;f+=3){let g=e.getX(f+0),_=e.getX(f+1),m=e.getX(f+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,_),o.fromBufferAttribute(t,m),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,m),a.add(h),l.add(h),c.add(h),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let f=0,d=t.count;f<d;f+=3)s.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Pt.fromBufferAttribute(e,t),Pt.normalize(),e.setXYZ(t,Pt.x,Pt.y,Pt.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,u=a.normalized,f=new c.constructor(l.length*h),d=0,g=0;for(let _=0,m=l.length;_<m;_++){a.isInterleavedBufferAttribute?d=l[_]*a.data.stride+a.offset:d=l[_]*h;for(let p=0;p<h;p++)f[g++]=c[d++]}return new $t(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=e(l,n);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let f=c[h],d=e(f,n);l.push(d)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u];h.push(d.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},lu=new st,Oi=new Mi,Uo=new ti,cu=new R,No=new R,Fo=new R,Oo=new R,uc=new R,Bo=new R,hu=new R,zo=new R,Mt=class extends Lt{constructor(e=new yt,t=new Si){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){Bo.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(uc.fromBufferAttribute(u,e),o?Bo.addScaledVector(uc,h):Bo.addScaledVector(uc.sub(t),h))}t.add(Bo)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Uo.copy(n.boundingSphere),Uo.applyMatrix4(r),Oi.copy(e.ray).recast(e.near),!(Uo.containsPoint(Oi.origin)===!1&&(Oi.intersectSphere(Uo,cu)===null||Oi.origin.distanceToSquared(cu)>(e.far-e.near)**2))&&(lu.copy(r).invert(),Oi.copy(e.ray).applyMatrix4(lu),!(n.boundingBox!==null&&Oi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Oi)))}_computeIntersections(e,t,n){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,d=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,_=f.length;g<_;g++){let m=f[g],p=o[m.materialIndex],M=Math.max(m.start,d.start),v=Math.min(a.count,Math.min(m.start+m.count,d.start+d.count));for(let x=M,A=v;x<A;x+=3){let T=a.getX(x),C=a.getX(x+1),P=a.getX(x+2);s=ko(this,p,e,n,c,h,u,T,C,P),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,d.start),_=Math.min(a.count,d.start+d.count);for(let m=g,p=_;m<p;m+=3){let M=a.getX(m),v=a.getX(m+1),x=a.getX(m+2);s=ko(this,o,e,n,c,h,u,M,v,x),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,_=f.length;g<_;g++){let m=f[g],p=o[m.materialIndex],M=Math.max(m.start,d.start),v=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let x=M,A=v;x<A;x+=3){let T=x,C=x+1,P=x+2;s=ko(this,p,e,n,c,h,u,T,C,P),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,d.start),_=Math.min(l.count,d.start+d.count);for(let m=g,p=_;m<p;m+=3){let M=m,v=m+1,x=m+2;s=ko(this,o,e,n,c,h,u,M,v,x),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function Qf(i,e,t,n,s,r,o,a){let l;if(e.side===Wt?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,e.side===ei,a),l===null)return null;zo.copy(a),zo.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(zo);return c<t.near||c>t.far?null:{distance:c,point:zo.clone(),object:i}}function ko(i,e,t,n,s,r,o,a,l,c){i.getVertexPosition(a,No),i.getVertexPosition(l,Fo),i.getVertexPosition(c,Oo);let h=Qf(i,e,t,n,No,Fo,Oo,hu);if(h){let u=new R;_i.getBarycoord(hu,No,Fo,Oo,u),s&&(h.uv=_i.getInterpolatedAttribute(s,a,l,c,u,new ee)),r&&(h.uv1=_i.getInterpolatedAttribute(r,a,l,c,u,new ee)),o&&(h.normal=_i.getInterpolatedAttribute(o,a,l,c,u,new R),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let f={a,b:l,c,normal:new R,materialIndex:0};_i.getNormal(No,Fo,Oo,f.normal),h.face=f,h.barycoord=u}return h}var kn=class i extends yt{constructor(e=1,t=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],f=0,d=0;g("z","y","x",-1,-1,n,t,e,o,r,0),g("z","y","x",1,-1,n,t,-e,o,r,1),g("x","z","y",1,1,e,n,t,s,o,2),g("x","z","y",1,-1,e,n,-t,s,o,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Qe(c,3)),this.setAttribute("normal",new Qe(h,3)),this.setAttribute("uv",new Qe(u,2));function g(_,m,p,M,v,x,A,T,C,P,b){let S=x/C,L=A/P,O=x/2,k=A/2,G=T/2,X=C+1,W=P+1,se=0,U=0,te=new R;for(let oe=0;oe<W;oe++){let ge=oe*L-k;for(let De=0;De<X;De++){let ke=De*S-O;te[_]=ke*M,te[m]=ge*v,te[p]=G,c.push(te.x,te.y,te.z),te[_]=0,te[m]=0,te[p]=T>0?1:-1,h.push(te.x,te.y,te.z),u.push(De/C),u.push(1-oe/P),se+=1}}for(let oe=0;oe<P;oe++)for(let ge=0;ge<C;ge++){let De=f+ge+X*oe,ke=f+ge+X*(oe+1),Ve=f+(ge+1)+X*(oe+1),Ke=f+(ge+1)+X*oe;l.push(De,ke,Ke),l.push(ke,Ve,Ke),U+=6}a.addGroup(d,U,b),d+=U,f+=se}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function es(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function Bt(i){let e={};for(let t=0;t<i.length;t++){let n=es(i[t]);for(let s in n)e[s]=n[s]}return e}function ep(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Jc(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:nt.workingColorSpace}var pd={clone:es,merge:Bt},tp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,np=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Cn=class extends zn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=tp,this.fragmentShader=np,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=es(e.uniforms),this.uniformsGroups=ep(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Dr=class extends Lt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new st,this.projectionMatrix=new st,this.projectionMatrixInverse=new st,this.coordinateSystem=wn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},gi=new R,uu=new ee,du=new ee,Gt=class extends Dr{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Rs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(br*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Rs*2*Math.atan(Math.tan(br*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){gi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(gi.x,gi.y).multiplyScalar(-e/gi.z),gi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(gi.x,gi.y).multiplyScalar(-e/gi.z)}getViewSize(e,t){return this.getViewBounds(e,uu,du),t.subVectors(du,uu)}setViewOffset(e,t,n,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(br*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Ms=-90,Ss=1,sa=class extends Lt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Gt(Ms,Ss,e,t);s.layers=this.layers,this.add(s);let r=new Gt(Ms,Ss,e,t);r.layers=this.layers,this.add(r);let o=new Gt(Ms,Ss,e,t);o.layers=this.layers,this.add(o);let a=new Gt(Ms,Ss,e,t);a.layers=this.layers,this.add(a);let l=new Gt(Ms,Ss,e,t);l.layers=this.layers,this.add(l);let c=new Gt(Ms,Ss,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===wn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Cr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,o),e.setRenderTarget(n,2,s),e.render(t,a),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,c),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,s),e.render(t,h),e.setRenderTarget(u,f,d),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Ur=class extends Ot{constructor(e=[],t=Ki,n,s,r,o,a,l,c,h){super(e,t,n,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ra=class extends Bn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Ur(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new kn(5,5,5),r=new Cn({name:"CubemapFromEquirect",uniforms:es(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Wt,blending:si});r.uniforms.tEquirect.value=t;let o=new Mt(s,r),a=t.minFilter;return t.minFilter===Ri&&(t.minFilter=An),new sa(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,s);e.setRenderTarget(r)}},It=class extends Lt{constructor(){super(),this.isGroup=!0,this.type="Group"}},ip={type:"move"},Ds=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new It,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new It,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new R,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new R),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new It,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new R,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new R),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let _ of e.hand.values()){let m=t.getJointPose(_,n),p=this._getHandJoint(c,_);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,g=.005;c.inputState.pinching&&f>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(ip)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new It;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}};var Gi=class extends Lt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Rn,this.environmentIntensity=1,this.environmentRotation=new Rn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var oa=class extends Ot{constructor(e=null,t=1,n=1,s,r,o,a,l,c=Zt,h=Zt,u,f){super(null,o,a,l,c,h,s,r,u,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Nr=class extends $t{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},bs=new st,fu=new st,Ho=[],pu=new an,sp=new st,xr=new Mt,yr=new ti,Us=class extends Mt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Nr(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,sp)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new an),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,bs),pu.copy(e.boundingBox).applyMatrix4(bs),this.boundingBox.union(pu)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new ti),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,bs),yr.copy(e.boundingSphere).applyMatrix4(bs),this.boundingSphere.union(yr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(xr.geometry=this.geometry,xr.material=this.material,xr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),yr.copy(this.boundingSphere),yr.applyMatrix4(n),e.ray.intersectsSphere(yr)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,bs),fu.multiplyMatrices(n,bs),xr.matrixWorld=fu,xr.raycast(e,Ho);for(let o=0,a=Ho.length;o<a;o++){let l=Ho[o];l.instanceId=r,l.object=this,t.push(l)}Ho.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Nr(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new oa(new Float32Array(s*this.count),s,this.count,Va,Ln));let r=this.morphTexture.source.data.data,o=0;for(let c=0;c<n.length;c++)o+=n[c];let a=this.geometry.morphTargetsRelative?1:1-o,l=s*e;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},dc=new R,rp=new R,op=new Xe,gn=class{constructor(e=new R(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=dc.subVectors(n,t).cross(rp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(dc),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||op.getNormalMatrix(e),s=this.coplanarPoint(dc).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Bi=new ti,ap=new ee(.5,.5),Vo=new R,Ns=class{constructor(e=new gn,t=new gn,n=new gn,s=new gn,r=new gn,o=new gn){this.planes=[e,t,n,s,r,o]}set(e,t,n,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=wn,n=!1){let s=this.planes,r=e.elements,o=r[0],a=r[1],l=r[2],c=r[3],h=r[4],u=r[5],f=r[6],d=r[7],g=r[8],_=r[9],m=r[10],p=r[11],M=r[12],v=r[13],x=r[14],A=r[15];if(s[0].setComponents(c-o,d-h,p-g,A-M).normalize(),s[1].setComponents(c+o,d+h,p+g,A+M).normalize(),s[2].setComponents(c+a,d+u,p+_,A+v).normalize(),s[3].setComponents(c-a,d-u,p-_,A-v).normalize(),n)s[4].setComponents(l,f,m,x).normalize(),s[5].setComponents(c-l,d-f,p-m,A-x).normalize();else if(s[4].setComponents(c-l,d-f,p-m,A-x).normalize(),t===wn)s[5].setComponents(c+l,d+f,p+m,A+x).normalize();else if(t===Cr)s[5].setComponents(l,f,m,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Bi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Bi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Bi)}intersectsSprite(e){Bi.center.set(0,0,0);let t=ap.distanceTo(e.center);return Bi.radius=.7071067811865476+t,Bi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Bi)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Vo.x=s.normal.x>0?e.max.x:e.min.x,Vo.y=s.normal.y>0?e.max.y:e.min.y,Vo.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Vo)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ni=class extends zn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new $e(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},aa=new R,la=new R,mu=new st,vr=new Mi,Go=new ti,fc=new R,gu=new R,Wi=class extends Lt{constructor(e=new yt,t=new ni){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)aa.fromBufferAttribute(t,s-1),la.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=aa.distanceTo(la);e.setAttribute("lineDistance",new Qe(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Go.copy(n.boundingSphere),Go.applyMatrix4(s),Go.radius+=r,e.ray.intersectsSphere(Go)===!1)return;mu.copy(s).invert(),vr.copy(e.ray).applyMatrix4(mu);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=n.index,f=n.attributes.position;if(h!==null){let d=Math.max(0,o.start),g=Math.min(h.count,o.start+o.count);for(let _=d,m=g-1;_<m;_+=c){let p=h.getX(_),M=h.getX(_+1),v=Wo(this,e,vr,l,p,M,_);v&&t.push(v)}if(this.isLineLoop){let _=h.getX(g-1),m=h.getX(d),p=Wo(this,e,vr,l,_,m,g-1);p&&t.push(p)}}else{let d=Math.max(0,o.start),g=Math.min(f.count,o.start+o.count);for(let _=d,m=g-1;_<m;_+=c){let p=Wo(this,e,vr,l,_,_+1,_);p&&t.push(p)}if(this.isLineLoop){let _=Wo(this,e,vr,l,g-1,d,g-1);_&&t.push(_)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Wo(i,e,t,n,s,r,o){let a=i.geometry.attributes.position;if(aa.fromBufferAttribute(a,s),la.fromBufferAttribute(a,r),t.distanceSqToSegment(aa,la,fc,gu)>n)return;fc.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(fc);if(!(c<e.near||c>e.far))return{distance:c,point:gu.clone().applyMatrix4(i.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:i}}var Fr=class extends Ot{constructor(e,t,n,s,r,o,a,l,c){super(e,t,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Or=class extends Ot{constructor(e,t,n=Ci,s,r,o,a=Zt,l=Zt,c,h=As,u=1){if(h!==As&&h!==Ys)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:u};super(f,s,r,o,a,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Is(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Br=class extends Ot{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var ii=class i extends yt{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],c=new R,h=new ee;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let u=0,f=3;u<=t;u++,f+=3){let d=n+u/t*s;c.x=e*Math.cos(d),c.y=e*Math.sin(d),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[f]/e+1)/2,h.y=(o[f+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new Qe(o,3)),this.setAttribute("normal",new Qe(a,3)),this.setAttribute("uv",new Qe(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Fs=class i extends yt{constructor(e=1,t=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],f=[],d=[],g=0,_=[],m=n/2,p=0;M(),o===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new Qe(u,3)),this.setAttribute("normal",new Qe(f,3)),this.setAttribute("uv",new Qe(d,2));function M(){let x=new R,A=new R,T=0,C=(t-e)/n;for(let P=0;P<=r;P++){let b=[],S=P/r,L=S*(t-e)+e;for(let O=0;O<=s;O++){let k=O/s,G=k*l+a,X=Math.sin(G),W=Math.cos(G);A.x=L*X,A.y=-S*n+m,A.z=L*W,u.push(A.x,A.y,A.z),x.set(X,C,W).normalize(),f.push(x.x,x.y,x.z),d.push(k,1-S),b.push(g++)}_.push(b)}for(let P=0;P<s;P++)for(let b=0;b<r;b++){let S=_[b][P],L=_[b+1][P],O=_[b+1][P+1],k=_[b][P+1];(e>0||b!==0)&&(h.push(S,L,k),T+=3),(t>0||b!==r-1)&&(h.push(L,O,k),T+=3)}c.addGroup(p,T,0),p+=T}function v(x){let A=g,T=new ee,C=new R,P=0,b=x===!0?e:t,S=x===!0?1:-1;for(let O=1;O<=s;O++)u.push(0,m*S,0),f.push(0,S,0),d.push(.5,.5),g++;let L=g;for(let O=0;O<=s;O++){let G=O/s*l+a,X=Math.cos(G),W=Math.sin(G);C.x=b*W,C.y=m*S,C.z=b*X,u.push(C.x,C.y,C.z),f.push(0,S,0),T.x=X*.5+.5,T.y=W*.5*S+.5,d.push(T.x,T.y),g++}for(let O=0;O<s;O++){let k=A+O,G=L+O;x===!0?h.push(G,G+1,k):h.push(G+1,G,k),P+=3}c.addGroup(p,P,x===!0?1:2),p+=P}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},zr=class i extends Fs{constructor(e=1,t=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},kr=class i extends yt{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],o=[];a(s),c(n),h(),this.setAttribute("position",new Qe(r,3)),this.setAttribute("normal",new Qe(r.slice(),3)),this.setAttribute("uv",new Qe(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(M){let v=new R,x=new R,A=new R;for(let T=0;T<t.length;T+=3)d(t[T+0],v),d(t[T+1],x),d(t[T+2],A),l(v,x,A,M)}function l(M,v,x,A){let T=A+1,C=[];for(let P=0;P<=T;P++){C[P]=[];let b=M.clone().lerp(x,P/T),S=v.clone().lerp(x,P/T),L=T-P;for(let O=0;O<=L;O++)O===0&&P===T?C[P][O]=b:C[P][O]=b.clone().lerp(S,O/L)}for(let P=0;P<T;P++)for(let b=0;b<2*(T-P)-1;b++){let S=Math.floor(b/2);b%2===0?(f(C[P][S+1]),f(C[P+1][S]),f(C[P][S])):(f(C[P][S+1]),f(C[P+1][S+1]),f(C[P+1][S]))}}function c(M){let v=new R;for(let x=0;x<r.length;x+=3)v.x=r[x+0],v.y=r[x+1],v.z=r[x+2],v.normalize().multiplyScalar(M),r[x+0]=v.x,r[x+1]=v.y,r[x+2]=v.z}function h(){let M=new R;for(let v=0;v<r.length;v+=3){M.x=r[v+0],M.y=r[v+1],M.z=r[v+2];let x=m(M)/2/Math.PI+.5,A=p(M)/Math.PI+.5;o.push(x,1-A)}g(),u()}function u(){for(let M=0;M<o.length;M+=6){let v=o[M+0],x=o[M+2],A=o[M+4],T=Math.max(v,x,A),C=Math.min(v,x,A);T>.9&&C<.1&&(v<.2&&(o[M+0]+=1),x<.2&&(o[M+2]+=1),A<.2&&(o[M+4]+=1))}}function f(M){r.push(M.x,M.y,M.z)}function d(M,v){let x=M*3;v.x=e[x+0],v.y=e[x+1],v.z=e[x+2]}function g(){let M=new R,v=new R,x=new R,A=new R,T=new ee,C=new ee,P=new ee;for(let b=0,S=0;b<r.length;b+=9,S+=6){M.set(r[b+0],r[b+1],r[b+2]),v.set(r[b+3],r[b+4],r[b+5]),x.set(r[b+6],r[b+7],r[b+8]),T.set(o[S+0],o[S+1]),C.set(o[S+2],o[S+3]),P.set(o[S+4],o[S+5]),A.copy(M).add(v).add(x).divideScalar(3);let L=m(A);_(T,S+0,M,L),_(C,S+2,v,L),_(P,S+4,x,L)}}function _(M,v,x,A){A<0&&M.x===1&&(o[v]=M.x-1),x.x===0&&x.z===0&&(o[v]=A/2/Math.PI+.5)}function m(M){return Math.atan2(M.z,-M.x)}function p(M){return Math.atan2(-M.y,Math.sqrt(M.x*M.x+M.z*M.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.details)}},Hr=class i extends kr{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-n,0,-s,n,0,s,-n,0,s,n,-s,-n,0,-s,n,0,s,-n,0,s,n,0,-n,0,-s,n,0,-s,-n,0,s,n,0,s],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}};var ln=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)n=this.getPoint(o/e),r+=n.distanceTo(s),t.push(r),s=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),s=0,r=n.length,o;t?o=t:o=e*n[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=n[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===o)return s/(r-1);let h=n[s],f=n[s+1]-h,d=(o-h)/f;return(s+d)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=t||(o.isVector2?new ee:new R);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new R,s=[],r=[],o=[],a=new R,l=new st;for(let d=0;d<=e;d++){let g=d/e;s[d]=this.getTangentAt(g,new R)}r[0]=new R,o[0]=new R;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),f=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),f<=c&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let d=1;d<=e;d++){if(r[d]=r[d-1].clone(),o[d]=o[d-1].clone(),a.crossVectors(s[d-1],s[d]),a.length()>Number.EPSILON){a.normalize();let g=Math.acos(Ye(s[d-1].dot(s[d]),-1,1));r[d].applyMatrix4(l.makeRotationAxis(a,g))}o[d].crossVectors(s[d],r[d])}if(t===!0){let d=Math.acos(Ye(r[0].dot(r[e]),-1,1));d/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(d=-d);for(let g=1;g<=e;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],d*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Os=class extends ln{constructor(e=0,t=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new ee){let n=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),f=l-this.aX,d=c-this.aY;l=f*h-d*u+this.aX,c=f*u+d*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},ca=class extends Os{constructor(e,t,n,s,r,o){super(e,t,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Kc(){let i=0,e=0,t=0,n=0;function s(r,o,a,l){i=r,e=a,t=-3*r+3*o-2*a-l,n=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,u){let f=(o-r)/c-(a-r)/(c+h)+(a-o)/h,d=(a-o)/h-(l-o)/(h+u)+(l-a)/u;f*=h,d*=h,s(o,a,f,d)},calc:function(r){let o=r*r,a=o*r;return i+e*r+t*o+n*a}}}var Xo=new R,pc=new Kc,mc=new Kc,gc=new Kc,Bs=class extends ln{constructor(e=[],t=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=s}getPoint(e,t=new R){let n=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(Xo.subVectors(s[0],s[1]).add(s[0]),c=Xo);let u=s[a%r],f=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Xo.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Xo),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(u),d),_=Math.pow(u.distanceToSquared(f),d),m=Math.pow(f.distanceToSquared(h),d);_<1e-4&&(_=1),g<1e-4&&(g=_),m<1e-4&&(m=_),pc.initNonuniformCatmullRom(c.x,u.x,f.x,h.x,g,_,m),mc.initNonuniformCatmullRom(c.y,u.y,f.y,h.y,g,_,m),gc.initNonuniformCatmullRom(c.z,u.z,f.z,h.z,g,_,m)}else this.curveType==="catmullrom"&&(pc.initCatmullRom(c.x,u.x,f.x,h.x,this.tension),mc.initCatmullRom(c.y,u.y,f.y,h.y,this.tension),gc.initCatmullRom(c.z,u.z,f.z,h.z,this.tension));return n.set(pc.calc(l),mc.calc(l),gc.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new R().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function _u(i,e,t,n,s){let r=(n-e)*.5,o=(s-t)*.5,a=i*i,l=i*a;return(2*t-2*n+r+o)*l+(-3*t+3*n-2*r-o)*a+r*i+t}function lp(i,e){let t=1-i;return t*t*e}function cp(i,e){return 2*(1-i)*i*e}function hp(i,e){return i*i*e}function Tr(i,e,t,n){return lp(i,e)+cp(i,t)+hp(i,n)}function up(i,e){let t=1-i;return t*t*t*e}function dp(i,e){let t=1-i;return 3*t*t*i*e}function fp(i,e){return 3*(1-i)*i*i*e}function pp(i,e){return i*i*i*e}function wr(i,e,t,n,s){return up(i,e)+dp(i,t)+fp(i,n)+pp(i,s)}var Vr=class extends ln{constructor(e=new ee,t=new ee,n=new ee,s=new ee){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new ee){let n=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(wr(e,s.x,r.x,o.x,a.x),wr(e,s.y,r.y,o.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ha=class extends ln{constructor(e=new R,t=new R,n=new R,s=new R){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new R){let n=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(wr(e,s.x,r.x,o.x,a.x),wr(e,s.y,r.y,o.y,a.y),wr(e,s.z,r.z,o.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Gr=class extends ln{constructor(e=new ee,t=new ee){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ee){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ee){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ua=class extends ln{constructor(e=new R,t=new R){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new R){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new R){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Wr=class extends ln{constructor(e=new ee,t=new ee,n=new ee){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ee){let n=t,s=this.v0,r=this.v1,o=this.v2;return n.set(Tr(e,s.x,r.x,o.x),Tr(e,s.y,r.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Xr=class extends ln{constructor(e=new R,t=new R,n=new R){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new R){let n=t,s=this.v0,r=this.v1,o=this.v2;return n.set(Tr(e,s.x,r.x,o.x),Tr(e,s.y,r.y,o.y),Tr(e,s.z,r.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},qr=class extends ln{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ee){let n=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],u=s[o>s.length-3?s.length-1:o+2];return n.set(_u(a,l.x,c.x,h.x,u.x),_u(a,l.y,c.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new ee().fromArray(s))}return this}},da=Object.freeze({__proto__:null,ArcCurve:ca,CatmullRomCurve3:Bs,CubicBezierCurve:Vr,CubicBezierCurve3:ha,EllipseCurve:Os,LineCurve:Gr,LineCurve3:ua,QuadraticBezierCurve:Wr,QuadraticBezierCurve3:Xr,SplineCurve:qr}),fa=class extends ln{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new da[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=n){let o=s[r]-n,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,s=this.curves.length;n<s;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(new da[s.type]().fromJSON(s))}return this}},Xi=class extends fa{constructor(e){super(),this.type="Path",this.currentPoint=new ee,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new Gr(this.currentPoint.clone(),new ee(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,s){let r=new Wr(this.currentPoint.clone(),new ee(e,t),new ee(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(e,t,n,s,r,o){let a=new Vr(this.currentPoint.clone(),new ee(e,t),new ee(n,s),new ee(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new qr(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,n,s,r,o),this}absarc(e,t,n,s,r,o){return this.absellipse(e,t,n,n,s,r,o),this}ellipse(e,t,n,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,s,r,o,a,l),this}absellipse(e,t,n,s,r,o,a,l){let c=new Os(e,t,n,s,r,o,a,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},Jt=class extends Xi{constructor(e){super(e),this.uuid=Qi(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,s=this.holes.length;n<s;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let s=e.holes[t];this.holes.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let s=this.holes[t];e.holes.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let s=e.holes[t];this.holes.push(new Xi().fromJSON(s))}return this}};function mp(i,e,t=2){let n=e&&e.length,s=n?e[0]*t:i.length,r=md(i,0,s,t,!0),o=[];if(!r||r.next===r.prev)return o;let a,l,c;if(n&&(r=vp(i,e,r,t)),i.length>80*t){a=1/0,l=1/0;let h=-1/0,u=-1/0;for(let f=t;f<s;f+=t){let d=i[f],g=i[f+1];d<a&&(a=d),g<l&&(l=g),d>h&&(h=d),g>u&&(u=g)}c=Math.max(h-a,u-l),c=c!==0?32767/c:0}return Yr(r,o,t,a,l,c,0),o}function md(i,e,t,n,s){let r;if(s===Ip(i,e,t,n)>0)for(let o=e;o<t;o+=n)r=xu(o/n|0,i[o],i[o+1],r);else for(let o=t-n;o>=e;o-=n)r=xu(o/n|0,i[o],i[o+1],r);return r&&zs(r,r.next)&&(Zr(r),r=r.next),r}function qi(i,e){if(!i)return i;e||(e=i);let t=i,n;do if(n=!1,!t.steiner&&(zs(t,t.next)||_t(t.prev,t,t.next)===0)){if(Zr(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function Yr(i,e,t,n,s,r,o){if(!i)return;!o&&r&&Tp(i,n,s,r);let a=i;for(;i.prev!==i.next;){let l=i.prev,c=i.next;if(r?_p(i,n,s,r):gp(i)){e.push(l.i,i.i,c.i),Zr(i),i=c.next,a=c.next;continue}if(i=c,i===a){o?o===1?(i=xp(qi(i),e),Yr(i,e,t,n,s,r,2)):o===2&&yp(i,e,t,n,s,r):Yr(qi(i),e,t,n,s,r,1);break}}}function gp(i){let e=i.prev,t=i,n=i.next;if(_t(e,t,n)>=0)return!1;let s=e.x,r=t.x,o=n.x,a=e.y,l=t.y,c=n.y,h=Math.min(s,r,o),u=Math.min(a,l,c),f=Math.max(s,r,o),d=Math.max(a,l,c),g=n.next;for(;g!==e;){if(g.x>=h&&g.x<=f&&g.y>=u&&g.y<=d&&Sr(s,a,r,l,o,c,g.x,g.y)&&_t(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function _p(i,e,t,n){let s=i.prev,r=i,o=i.next;if(_t(s,r,o)>=0)return!1;let a=s.x,l=r.x,c=o.x,h=s.y,u=r.y,f=o.y,d=Math.min(a,l,c),g=Math.min(h,u,f),_=Math.max(a,l,c),m=Math.max(h,u,f),p=Ec(d,g,e,t,n),M=Ec(_,m,e,t,n),v=i.prevZ,x=i.nextZ;for(;v&&v.z>=p&&x&&x.z<=M;){if(v.x>=d&&v.x<=_&&v.y>=g&&v.y<=m&&v!==s&&v!==o&&Sr(a,h,l,u,c,f,v.x,v.y)&&_t(v.prev,v,v.next)>=0||(v=v.prevZ,x.x>=d&&x.x<=_&&x.y>=g&&x.y<=m&&x!==s&&x!==o&&Sr(a,h,l,u,c,f,x.x,x.y)&&_t(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;v&&v.z>=p;){if(v.x>=d&&v.x<=_&&v.y>=g&&v.y<=m&&v!==s&&v!==o&&Sr(a,h,l,u,c,f,v.x,v.y)&&_t(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;x&&x.z<=M;){if(x.x>=d&&x.x<=_&&x.y>=g&&x.y<=m&&x!==s&&x!==o&&Sr(a,h,l,u,c,f,x.x,x.y)&&_t(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function xp(i,e){let t=i;do{let n=t.prev,s=t.next.next;!zs(n,s)&&_d(n,t,t.next,s)&&$r(n,s)&&$r(s,n)&&(e.push(n.i,t.i,s.i),Zr(t),Zr(t.next),t=i=s),t=t.next}while(t!==i);return qi(t)}function yp(i,e,t,n,s,r){let o=i;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&Rp(o,a)){let l=xd(o,a);o=qi(o,o.next),l=qi(l,l.next),Yr(o,e,t,n,s,r,0),Yr(l,e,t,n,s,r,0);return}a=a.next}o=o.next}while(o!==i)}function vp(i,e,t,n){let s=[];for(let r=0,o=e.length;r<o;r++){let a=e[r]*n,l=r<o-1?e[r+1]*n:i.length,c=md(i,a,l,n,!1);c===c.next&&(c.steiner=!0),s.push(Ap(c))}s.sort(Mp);for(let r=0;r<s.length;r++)t=Sp(s[r],t);return t}function Mp(i,e){let t=i.x-e.x;if(t===0&&(t=i.y-e.y,t===0)){let n=(i.next.y-i.y)/(i.next.x-i.x),s=(e.next.y-e.y)/(e.next.x-e.x);t=n-s}return t}function Sp(i,e){let t=bp(i,e);if(!t)return e;let n=xd(t,i);return qi(n,n.next),qi(t,t.next)}function bp(i,e){let t=e,n=i.x,s=i.y,r=-1/0,o;if(zs(i,t))return t;do{if(zs(i,t.next))return t.next;if(s<=t.y&&s>=t.next.y&&t.next.y!==t.y){let u=t.x+(s-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(u<=n&&u>r&&(r=u,o=t.x<t.next.x?t:t.next,u===n))return o}t=t.next}while(t!==e);if(!o)return null;let a=o,l=o.x,c=o.y,h=1/0;t=o;do{if(n>=t.x&&t.x>=l&&n!==t.x&&gd(s<c?n:r,s,l,c,s<c?r:n,s,t.x,t.y)){let u=Math.abs(s-t.y)/(n-t.x);$r(t,i)&&(u<h||u===h&&(t.x>o.x||t.x===o.x&&Ep(o,t)))&&(o=t,h=u)}t=t.next}while(t!==a);return o}function Ep(i,e){return _t(i.prev,i,e.prev)<0&&_t(e.next,i,i.next)<0}function Tp(i,e,t,n){let s=i;do s.z===0&&(s.z=Ec(s.x,s.y,e,t,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,wp(s)}function wp(i){let e,t=1;do{let n=i,s;i=null;let r=null;for(e=0;n;){e++;let o=n,a=0;for(let c=0;c<t&&(a++,o=o.nextZ,!!o);c++);let l=t;for(;a>0||l>0&&o;)a!==0&&(l===0||!o||n.z<=o.z)?(s=n,n=n.nextZ,a--):(s=o,o=o.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;n=o}r.nextZ=null,t*=2}while(e>1);return i}function Ec(i,e,t,n,s){return i=(i-t)*s|0,e=(e-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,i|e<<1}function Ap(i){let e=i,t=i;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==i);return t}function gd(i,e,t,n,s,r,o,a){return(s-o)*(e-a)>=(i-o)*(r-a)&&(i-o)*(n-a)>=(t-o)*(e-a)&&(t-o)*(r-a)>=(s-o)*(n-a)}function Sr(i,e,t,n,s,r,o,a){return!(i===o&&e===a)&&gd(i,e,t,n,s,r,o,a)}function Rp(i,e){return i.next.i!==e.i&&i.prev.i!==e.i&&!Cp(i,e)&&($r(i,e)&&$r(e,i)&&Pp(i,e)&&(_t(i.prev,i,e.prev)||_t(i,e.prev,e))||zs(i,e)&&_t(i.prev,i,i.next)>0&&_t(e.prev,e,e.next)>0)}function _t(i,e,t){return(e.y-i.y)*(t.x-e.x)-(e.x-i.x)*(t.y-e.y)}function zs(i,e){return i.x===e.x&&i.y===e.y}function _d(i,e,t,n){let s=Yo(_t(i,e,t)),r=Yo(_t(i,e,n)),o=Yo(_t(t,n,i)),a=Yo(_t(t,n,e));return!!(s!==r&&o!==a||s===0&&qo(i,t,e)||r===0&&qo(i,n,e)||o===0&&qo(t,i,n)||a===0&&qo(t,e,n))}function qo(i,e,t){return e.x<=Math.max(i.x,t.x)&&e.x>=Math.min(i.x,t.x)&&e.y<=Math.max(i.y,t.y)&&e.y>=Math.min(i.y,t.y)}function Yo(i){return i>0?1:i<0?-1:0}function Cp(i,e){let t=i;do{if(t.i!==i.i&&t.next.i!==i.i&&t.i!==e.i&&t.next.i!==e.i&&_d(t,t.next,i,e))return!0;t=t.next}while(t!==i);return!1}function $r(i,e){return _t(i.prev,i,i.next)<0?_t(i,e,i.next)>=0&&_t(i,i.prev,e)>=0:_t(i,e,i.prev)<0||_t(i,i.next,e)<0}function Pp(i,e){let t=i,n=!1,s=(i.x+e.x)/2,r=(i.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&s<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==i);return n}function xd(i,e){let t=Tc(i.i,i.x,i.y),n=Tc(e.i,e.x,e.y),s=i.next,r=e.prev;return i.next=e,e.prev=i,t.next=s,s.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function xu(i,e,t,n){let s=Tc(i,e,t);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Zr(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Tc(i,e,t){return{i,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Ip(i,e,t,n){let s=0;for(let r=e,o=t-n;r<t;r+=n)s+=(i[o]-i[r])*(i[r+1]+i[o+1]),o=r;return s}var wc=class{static triangulate(e,t,n=2){return mp(e,t,n)}},Fn=class i{static area(e){let t=e.length,n=0;for(let s=t-1,r=0;r<t;s=r++)n+=e[s].x*e[r].y-e[r].x*e[s].y;return n*.5}static isClockWise(e){return i.area(e)<0}static triangulateShape(e,t){let n=[],s=[],r=[];yu(e),vu(n,e);let o=e.length;t.forEach(yu);for(let l=0;l<t.length;l++)s.push(o),o+=t[l].length,vu(n,t[l]);let a=wc.triangulate(n,s);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}};function yu(i){let e=i.length;e>2&&i[e-1].equals(i[0])&&i.pop()}function vu(i,e){for(let t=0;t<e.length;t++)i.push(e[t].x),i.push(e[t].y)}var bi=class i extends yt{constructor(e=new Jt([new ee(.5,.5),new ee(-.5,.5),new ee(-.5,-.5),new ee(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,s=[],r=[];for(let a=0,l=e.length;a<l;a++){let c=e[a];o(c)}this.setAttribute("position",new Qe(s,3)),this.setAttribute("uv",new Qe(r,2)),this.computeVertexNormals();function o(a){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,f=t.bevelEnabled!==void 0?t.bevelEnabled:!0,d=t.bevelThickness!==void 0?t.bevelThickness:.2,g=t.bevelSize!==void 0?t.bevelSize:d-.1,_=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3,p=t.extrudePath,M=t.UVGenerator!==void 0?t.UVGenerator:Lp,v,x=!1,A,T,C,P;p&&(v=p.getSpacedPoints(h),x=!0,f=!1,A=p.computeFrenetFrames(h,!1),T=new R,C=new R,P=new R),f||(m=0,d=0,g=0,_=0);let b=a.extractPoints(c),S=b.shape,L=b.holes;if(!Fn.isClockWise(S)){S=S.reverse();for(let re=0,j=L.length;re<j;re++){let K=L[re];Fn.isClockWise(K)&&(L[re]=K.reverse())}}function k(re){let K=10000000000000001e-36,J=re[0];for(let fe=1;fe<=re.length;fe++){let ae=fe%re.length,pe=re[ae],Ge=pe.x-J.x,He=pe.y-J.y,w=Ge*Ge+He*He,y=Math.max(Math.abs(pe.x),Math.abs(pe.y),Math.abs(J.x),Math.abs(J.y)),B=K*y*y;if(w<=B){re.splice(ae,1),fe--;continue}J=pe}}k(S),L.forEach(k);let G=L.length,X=S;for(let re=0;re<G;re++){let j=L[re];S=S.concat(j)}function W(re,j,K){return j||console.error("THREE.ExtrudeGeometry: vec does not exist"),re.clone().addScaledVector(j,K)}let se=S.length;function U(re,j,K){let J,fe,ae,pe=re.x-j.x,Ge=re.y-j.y,He=K.x-re.x,w=K.y-re.y,y=pe*pe+Ge*Ge,B=pe*w-Ge*He;if(Math.abs(B)>Number.EPSILON){let q=Math.sqrt(y),ie=Math.sqrt(He*He+w*w),Y=j.x-Ge/q,Pe=j.y+pe/q,de=K.x-w/ie,Ae=K.y+He/ie,Re=((de-Y)*w-(Ae-Pe)*He)/(pe*w-Ge*He);J=Y+pe*Re-re.x,fe=Pe+Ge*Re-re.y;let le=J*J+fe*fe;if(le<=2)return new ee(J,fe);ae=Math.sqrt(le/2)}else{let q=!1;pe>Number.EPSILON?He>Number.EPSILON&&(q=!0):pe<-Number.EPSILON?He<-Number.EPSILON&&(q=!0):Math.sign(Ge)===Math.sign(w)&&(q=!0),q?(J=-Ge,fe=pe,ae=Math.sqrt(y)):(J=pe,fe=Ge,ae=Math.sqrt(y/2))}return new ee(J/ae,fe/ae)}let te=[];for(let re=0,j=X.length,K=j-1,J=re+1;re<j;re++,K++,J++)K===j&&(K=0),J===j&&(J=0),te[re]=U(X[re],X[K],X[J]);let oe=[],ge,De=te.concat();for(let re=0,j=G;re<j;re++){let K=L[re];ge=[];for(let J=0,fe=K.length,ae=fe-1,pe=J+1;J<fe;J++,ae++,pe++)ae===fe&&(ae=0),pe===fe&&(pe=0),ge[J]=U(K[J],K[ae],K[pe]);oe.push(ge),De=De.concat(ge)}let ke;if(m===0)ke=Fn.triangulateShape(X,L);else{let re=[],j=[];for(let K=0;K<m;K++){let J=K/m,fe=d*Math.cos(J*Math.PI/2),ae=g*Math.sin(J*Math.PI/2)+_;for(let pe=0,Ge=X.length;pe<Ge;pe++){let He=W(X[pe],te[pe],ae);we(He.x,He.y,-fe),J===0&&re.push(He)}for(let pe=0,Ge=G;pe<Ge;pe++){let He=L[pe];ge=oe[pe];let w=[];for(let y=0,B=He.length;y<B;y++){let q=W(He[y],ge[y],ae);we(q.x,q.y,-fe),J===0&&w.push(q)}J===0&&j.push(w)}}ke=Fn.triangulateShape(re,j)}let Ve=ke.length,Ke=g+_;for(let re=0;re<se;re++){let j=f?W(S[re],De[re],Ke):S[re];x?(C.copy(A.normals[0]).multiplyScalar(j.x),T.copy(A.binormals[0]).multiplyScalar(j.y),P.copy(v[0]).add(C).add(T),we(P.x,P.y,P.z)):we(j.x,j.y,0)}for(let re=1;re<=h;re++)for(let j=0;j<se;j++){let K=f?W(S[j],De[j],Ke):S[j];x?(C.copy(A.normals[re]).multiplyScalar(K.x),T.copy(A.binormals[re]).multiplyScalar(K.y),P.copy(v[re]).add(C).add(T),we(P.x,P.y,P.z)):we(K.x,K.y,u/h*re)}for(let re=m-1;re>=0;re--){let j=re/m,K=d*Math.cos(j*Math.PI/2),J=g*Math.sin(j*Math.PI/2)+_;for(let fe=0,ae=X.length;fe<ae;fe++){let pe=W(X[fe],te[fe],J);we(pe.x,pe.y,u+K)}for(let fe=0,ae=L.length;fe<ae;fe++){let pe=L[fe];ge=oe[fe];for(let Ge=0,He=pe.length;Ge<He;Ge++){let w=W(pe[Ge],ge[Ge],J);x?we(w.x,w.y+v[h-1].y,v[h-1].x+K):we(w.x,w.y,u+K)}}}Z(),ne();function Z(){let re=s.length/3;if(f){let j=0,K=se*j;for(let J=0;J<Ve;J++){let fe=ke[J];be(fe[2]+K,fe[1]+K,fe[0]+K)}j=h+m*2,K=se*j;for(let J=0;J<Ve;J++){let fe=ke[J];be(fe[0]+K,fe[1]+K,fe[2]+K)}}else{for(let j=0;j<Ve;j++){let K=ke[j];be(K[2],K[1],K[0])}for(let j=0;j<Ve;j++){let K=ke[j];be(K[0]+se*h,K[1]+se*h,K[2]+se*h)}}n.addGroup(re,s.length/3-re,0)}function ne(){let re=s.length/3,j=0;Me(X,j),j+=X.length;for(let K=0,J=L.length;K<J;K++){let fe=L[K];Me(fe,j),j+=fe.length}n.addGroup(re,s.length/3-re,1)}function Me(re,j){let K=re.length;for(;--K>=0;){let J=K,fe=K-1;fe<0&&(fe=re.length-1);for(let ae=0,pe=h+m*2;ae<pe;ae++){let Ge=se*ae,He=se*(ae+1),w=j+J+Ge,y=j+fe+Ge,B=j+fe+He,q=j+J+He;Je(w,y,B,q)}}}function we(re,j,K){l.push(re),l.push(j),l.push(K)}function be(re,j,K){ut(re),ut(j),ut(K);let J=s.length/3,fe=M.generateTopUV(n,s,J-3,J-2,J-1);I(fe[0]),I(fe[1]),I(fe[2])}function Je(re,j,K,J){ut(re),ut(j),ut(J),ut(j),ut(K),ut(J);let fe=s.length/3,ae=M.generateSideWallUV(n,s,fe-6,fe-3,fe-2,fe-1);I(ae[0]),I(ae[1]),I(ae[3]),I(ae[1]),I(ae[2]),I(ae[3])}function ut(re){s.push(l[re*3+0]),s.push(l[re*3+1]),s.push(l[re*3+2])}function I(re){r.push(re.x),r.push(re.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return Dp(t,n,e)}static fromJSON(e,t){let n=[];for(let r=0,o=e.shapes.length;r<o;r++){let a=t[e.shapes[r]];n.push(a)}let s=e.options.extrudePath;return s!==void 0&&(e.options.extrudePath=new da[s.type]().fromJSON(s)),new i(n,e.options)}},Lp={generateTopUV:function(i,e,t,n,s){let r=e[t*3],o=e[t*3+1],a=e[n*3],l=e[n*3+1],c=e[s*3],h=e[s*3+1];return[new ee(r,o),new ee(a,l),new ee(c,h)]},generateSideWallUV:function(i,e,t,n,s,r){let o=e[t*3],a=e[t*3+1],l=e[t*3+2],c=e[n*3],h=e[n*3+1],u=e[n*3+2],f=e[s*3],d=e[s*3+1],g=e[s*3+2],_=e[r*3],m=e[r*3+1],p=e[r*3+2];return Math.abs(a-h)<Math.abs(o-c)?[new ee(o,1-l),new ee(c,1-u),new ee(f,1-g),new ee(_,1-p)]:[new ee(a,1-l),new ee(h,1-u),new ee(d,1-g),new ee(m,1-p)]}};function Dp(i,e,t){if(t.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){let r=i[n];t.shapes.push(r.uuid)}else t.shapes.push(i.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var Jr=class i extends kr{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},Kr=class i extends yt{constructor(e=[new ee(0,-.5),new ee(.5,0),new ee(0,.5)],t=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:s},t=Math.floor(t),s=Ye(s,0,Math.PI*2);let r=[],o=[],a=[],l=[],c=[],h=1/t,u=new R,f=new ee,d=new R,g=new R,_=new R,m=0,p=0;for(let M=0;M<=e.length-1;M++)switch(M){case 0:m=e[M+1].x-e[M].x,p=e[M+1].y-e[M].y,d.x=p*1,d.y=-m,d.z=p*0,_.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case e.length-1:l.push(_.x,_.y,_.z);break;default:m=e[M+1].x-e[M].x,p=e[M+1].y-e[M].y,d.x=p*1,d.y=-m,d.z=p*0,g.copy(d),d.x+=_.x,d.y+=_.y,d.z+=_.z,d.normalize(),l.push(d.x,d.y,d.z),_.copy(g)}for(let M=0;M<=t;M++){let v=n+M*h*s,x=Math.sin(v),A=Math.cos(v);for(let T=0;T<=e.length-1;T++){u.x=e[T].x*x,u.y=e[T].y,u.z=e[T].x*A,o.push(u.x,u.y,u.z),f.x=M/t,f.y=T/(e.length-1),a.push(f.x,f.y);let C=l[3*T+0]*x,P=l[3*T+1],b=l[3*T+0]*A;c.push(C,P,b)}}for(let M=0;M<t;M++)for(let v=0;v<e.length-1;v++){let x=v+M*e.length,A=x,T=x+e.length,C=x+e.length+1,P=x+1;r.push(A,T,P),r.push(C,P,T)}this.setIndex(r),this.setAttribute("position",new Qe(o,3)),this.setAttribute("uv",new Qe(a,2)),this.setAttribute("normal",new Qe(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.points,e.segments,e.phiStart,e.phiLength)}};var Yi=class i extends yt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(n),l=Math.floor(s),c=a+1,h=l+1,u=e/a,f=t/l,d=[],g=[],_=[],m=[];for(let p=0;p<h;p++){let M=p*f-o;for(let v=0;v<c;v++){let x=v*u-r;g.push(x,-M,0),_.push(0,0,1),m.push(v/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let M=0;M<a;M++){let v=M+c*p,x=M+c*(p+1),A=M+1+c*(p+1),T=M+1+c*p;d.push(v,x,T),d.push(x,A,T)}this.setIndex(d),this.setAttribute("position",new Qe(g,3)),this.setAttribute("normal",new Qe(_,3)),this.setAttribute("uv",new Qe(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};var Ei=class i extends yt{constructor(e=new Jt([new ee(0,.5),new ee(-.5,-.5),new ee(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let n=[],s=[],r=[],o=[],a=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(a,l,h),a+=l,l=0;this.setIndex(n),this.setAttribute("position",new Qe(s,3)),this.setAttribute("normal",new Qe(r,3)),this.setAttribute("uv",new Qe(o,2));function c(h){let u=s.length/3,f=h.extractPoints(t),d=f.shape,g=f.holes;Fn.isClockWise(d)===!1&&(d=d.reverse());for(let m=0,p=g.length;m<p;m++){let M=g[m];Fn.isClockWise(M)===!0&&(g[m]=M.reverse())}let _=Fn.triangulateShape(d,g);for(let m=0,p=g.length;m<p;m++){let M=g[m];d=d.concat(M)}for(let m=0,p=d.length;m<p;m++){let M=d[m];s.push(M.x,M.y,0),r.push(0,0,1),o.push(M.x,M.y)}for(let m=0,p=_.length;m<p;m++){let M=_[m],v=M[0]+u,x=M[1]+u,A=M[2]+u;n.push(v,x,A),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Up(t,e)}static fromJSON(e,t){let n=[];for(let s=0,r=e.shapes.length;s<r;s++){let o=t[e.shapes[s]];n.push(o)}return new i(n,e.curveSegments)}};function Up(i,e){if(e.shapes=[],Array.isArray(i))for(let t=0,n=i.length;t<n;t++){let s=i[t];e.shapes.push(s.uuid)}else e.shapes.push(i.uuid);return e}var ks=class i extends yt{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(o+a,Math.PI),c=0,h=[],u=new R,f=new R,d=[],g=[],_=[],m=[];for(let p=0;p<=n;p++){let M=[],v=p/n,x=0;p===0&&o===0?x=.5/t:p===n&&l===Math.PI&&(x=-.5/t);for(let A=0;A<=t;A++){let T=A/t;u.x=-e*Math.cos(s+T*r)*Math.sin(o+v*a),u.y=e*Math.cos(o+v*a),u.z=e*Math.sin(s+T*r)*Math.sin(o+v*a),g.push(u.x,u.y,u.z),f.copy(u).normalize(),_.push(f.x,f.y,f.z),m.push(T+x,1-v),M.push(c++)}h.push(M)}for(let p=0;p<n;p++)for(let M=0;M<t;M++){let v=h[p][M+1],x=h[p][M],A=h[p+1][M],T=h[p+1][M+1];(p!==0||o>0)&&d.push(v,x,T),(p!==n-1||l<Math.PI)&&d.push(x,A,T)}this.setIndex(d),this.setAttribute("position",new Qe(g,3)),this.setAttribute("normal",new Qe(_,3)),this.setAttribute("uv",new Qe(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var jr=class i extends yt{constructor(e=new Xr(new R(-1,-1,0),new R(-1,1,0),new R(1,1,0)),t=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:s,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new R,l=new R,c=new ee,h=new R,u=[],f=[],d=[],g=[];_(),this.setIndex(g),this.setAttribute("position",new Qe(u,3)),this.setAttribute("normal",new Qe(f,3)),this.setAttribute("uv",new Qe(d,2));function _(){for(let v=0;v<t;v++)m(v);m(r===!1?t:0),M(),p()}function m(v){h=e.getPointAt(v/t,h);let x=o.normals[v],A=o.binormals[v];for(let T=0;T<=s;T++){let C=T/s*Math.PI*2,P=Math.sin(C),b=-Math.cos(C);l.x=b*x.x+P*A.x,l.y=b*x.y+P*A.y,l.z=b*x.z+P*A.z,l.normalize(),f.push(l.x,l.y,l.z),a.x=h.x+n*l.x,a.y=h.y+n*l.y,a.z=h.z+n*l.z,u.push(a.x,a.y,a.z)}}function p(){for(let v=1;v<=t;v++)for(let x=1;x<=s;x++){let A=(s+1)*(v-1)+(x-1),T=(s+1)*v+(x-1),C=(s+1)*v+x,P=(s+1)*(v-1)+x;g.push(A,T,P),g.push(T,C,P)}}function M(){for(let v=0;v<=t;v++)for(let x=0;x<=s;x++)c.x=v/t,c.y=x/s,d.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new i(new da[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var Qr=class extends zn{constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new $e(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};var Hn=class extends zn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new $e(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new $e(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xc,this.normalScale=new ee(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Rn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var pa=class extends zn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=td,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ma=class extends zn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var eo=class extends ni{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function $o(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Np(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var $i=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=t[++n],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}o=n,n=0;break t}break n}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},ga=class extends $i{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:yc,endingEnd:yc}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case vc:r=e,a=2*t-n;break;case Mc:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case vc:o=e,l=2*n-t;break;case Mc:o=1,l=n+s[1]-s[0];break;default:o=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,d=this._weightNext,g=(n-t)/(s-t),_=g*g,m=_*g,p=-f*m+2*f*_-f*g,M=(1+f)*m+(-1.5-2*f)*_+(-.5+f)*g+1,v=(-1-d)*m+(1.5+d)*_+.5*g,x=d*m-d*_;for(let A=0;A!==a;++A)r[A]=p*o[h+A]+M*o[c+A]+v*o[l+A]+x*o[u+A];return r}},_a=class extends $i{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=(n-t)/(s-t),u=1-h;for(let f=0;f!==a;++f)r[f]=o[c+f]*u+o[l+f]*h;return r}},xa=class extends $i{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},cn=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=$o(t,this.TimeBufferType),this.values=$o(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:$o(e.times,Array),values:$o(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new xa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new _a(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ga(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ar:t=this.InterpolantFactoryMethodDiscrete;break;case ea:t=this.InterpolantFactoryMethodLinear;break;case Zo:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ar;case this.InterpolantFactoryMethodLinear:return ea;case this.InterpolantFactoryMethodSmooth:return Zo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&Np(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Zo,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],h=e[a+1];if(c!==h&&(a!==1||c!==e[0]))if(s)l=!0;else{let u=a*n,f=u-n,d=u+n;for(let g=0;g!==n;++g){let _=t[u+g];if(_!==t[f+g]||_!==t[d+g]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let u=a*n,f=o*n;for(let d=0;d!==n;++d)t[f+d]=t[u+d]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,l=o*n,c=0;c!==n;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};cn.prototype.ValueTypeName="";cn.prototype.TimeBufferType=Float32Array;cn.prototype.ValueBufferType=Float32Array;cn.prototype.DefaultInterpolation=ea;var Ti=class extends cn{constructor(e,t,n){super(e,t,n)}};Ti.prototype.ValueTypeName="bool";Ti.prototype.ValueBufferType=Array;Ti.prototype.DefaultInterpolation=Ar;Ti.prototype.InterpolantFactoryMethodLinear=void 0;Ti.prototype.InterpolantFactoryMethodSmooth=void 0;var ya=class extends cn{constructor(e,t,n,s){super(e,t,n,s)}};ya.prototype.ValueTypeName="color";var va=class extends cn{constructor(e,t,n,s){super(e,t,n,s)}};va.prototype.ValueTypeName="number";var Ma=class extends $i{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-t)/(s-t),c=e*a;for(let h=c+a;c!==h;c+=4)Ft.slerpFlat(r,0,o,c-a,o,c,l);return r}},to=class extends cn{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new Ma(this.times,this.values,this.getValueSize(),e)}};to.prototype.ValueTypeName="quaternion";to.prototype.InterpolantFactoryMethodSmooth=void 0;var wi=class extends cn{constructor(e,t,n){super(e,t,n)}};wi.prototype.ValueTypeName="string";wi.prototype.ValueBufferType=Array;wi.prototype.DefaultInterpolation=Ar;wi.prototype.InterpolantFactoryMethodLinear=void 0;wi.prototype.InterpolantFactoryMethodSmooth=void 0;var Sa=class extends cn{constructor(e,t,n,s){super(e,t,n,s)}};Sa.prototype.ValueTypeName="vector";var Jo={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(this.files[i]=e)},get:function(i){if(this.enabled!==!1)return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}},ba=class{constructor(e,t,n){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.abortController=new AbortController,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=c.length;u<f;u+=2){let d=c[u],g=c[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}},yd=new ba,Hs=class{constructor(e){this.manager=e!==void 0?e:yd,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Hs.DEFAULT_MATERIAL_NAME="__DEFAULT";var Es=new WeakMap,Ea=class extends Hs{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=Jo.get(`image:${e}`);if(o!==void 0){if(o.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0);else{let u=Es.get(o);u===void 0&&(u=[],Es.set(o,u)),u.push({onLoad:t,onError:s})}return o}let a=Cs("img");function l(){h(),t&&t(this);let u=Es.get(this)||[];for(let f=0;f<u.length;f++){let d=u[f];d.onLoad&&d.onLoad(this)}Es.delete(this),r.manager.itemEnd(e)}function c(u){h(),s&&s(u),Jo.remove(`image:${e}`);let f=Es.get(this)||[];for(let d=0;d<f.length;d++){let g=f[d];g.onError&&g.onError(u)}Es.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),Jo.add(`image:${e}`,a),r.manager.itemStart(e),a.src=e,a}};var Zi=class extends Hs{constructor(e){super(e)}load(e,t,n,s){let r=new Ot,o=new Ea(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}},Vs=class extends Lt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new $e(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Ji=class extends Vs{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Lt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new $e(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},_c=new st,Mu=new R,Su=new R,Ta=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ee(512,512),this.mapType=In,this.map=null,this.mapPass=null,this.matrix=new st,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ns,this._frameExtents=new ee(1,1),this._viewportCount=1,this._viewports=[new ot(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Mu.setFromMatrixPosition(e.matrixWorld),t.position.copy(Mu),Su.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Su),t.updateMatrixWorld(),_c.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(_c,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(_c)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var bu=new st,Mr=new R,xc=new R,Ac=class extends Ta{constructor(){super(new Gt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ee(4,2),this._viewportCount=6,this._viewports=[new ot(2,1,1,1),new ot(0,1,1,1),new ot(3,1,1,1),new ot(1,1,1,1),new ot(3,0,1,1),new ot(1,0,1,1)],this._cubeDirections=[new R(1,0,0),new R(-1,0,0),new R(0,0,1),new R(0,0,-1),new R(0,1,0),new R(0,-1,0)],this._cubeUps=[new R(0,1,0),new R(0,1,0),new R(0,1,0),new R(0,1,0),new R(0,0,1),new R(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Mr.setFromMatrixPosition(e.matrixWorld),n.position.copy(Mr),xc.copy(n.position),xc.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(xc),n.updateMatrixWorld(),s.makeTranslation(-Mr.x,-Mr.y,-Mr.z),bu.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(bu,n.coordinateSystem,n.reversedDepth)}},no=class extends Vs{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Ac}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Vn=class extends Dr{constructor(e=-1,t=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,o=n+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Rc=class extends Ta{constructor(){super(new Vn(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ai=class extends Vs{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Lt.DEFAULT_UP),this.updateMatrix(),this.target=new Lt,this.shadow=new Rc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var wa=class extends Gt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var jc="\\[\\]\\.:\\/",Fp=new RegExp("["+jc+"]","g"),Qc="[^"+jc+"]",Op="[^"+jc.replace("\\.","")+"]",Bp=/((?:WC+[\/:])*)/.source.replace("WC",Qc),zp=/(WCOD+)?/.source.replace("WCOD",Op),kp=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Qc),Hp=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Qc),Vp=new RegExp("^"+Bp+zp+kp+Hp+"$"),Gp=["material","materials","bones","map"],Cc=class{constructor(e,t,n){let s=n||pt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},pt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Fp,"")}static parseTrackName(e){let t=Vp.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Gp.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=n(a.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[s];if(o===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};pt.Composite=Cc;pt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};pt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};pt.prototype.GetterByBindingType=[pt.prototype._getValue_direct,pt.prototype._getValue_array,pt.prototype._getValue_arrayElement,pt.prototype._getValue_toArray];pt.prototype.SetterByBindingTypeAndVersioning=[[pt.prototype._setValue_direct,pt.prototype._setValue_direct_setNeedsUpdate,pt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[pt.prototype._setValue_array,pt.prototype._setValue_array_setNeedsUpdate,pt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[pt.prototype._setValue_arrayElement,pt.prototype._setValue_arrayElement_setNeedsUpdate,pt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[pt.prototype._setValue_fromArray,pt.prototype._setValue_fromArray_setNeedsUpdate,pt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var sy=new Float32Array(1);var Eu=new st,io=class{constructor(e,t,n=0,s=1/0){this.ray=new Mi(e,t),this.near=n,this.far=s,this.camera=null,this.layers=new Ls,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Eu.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Eu),this}intersectObject(e,t=!0,n=[]){return Pc(e,this,n,t),n.sort(Tu),n}intersectObjects(e,t=!0,n=[]){for(let s=0,r=e.length;s<r;s++)Pc(e[s],this,n,t);return n.sort(Tu),n}};function Tu(i,e){return i.distance-e.distance}function Pc(i,e,t,n){let s=!0;if(i.layers.test(e.layers)&&i.raycast(e,t)===!1&&(s=!1),s===!0&&n===!0){let r=i.children;for(let o=0,a=r.length;o<a;o++)Pc(r[o],e,t,!0)}}var Gs=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Ye(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Ye(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var so=class extends On{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){console.warn("THREE.Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function eh(i,e,t,n){let s=Wp(n);switch(t){case Vc:return i*e;case Va:return i*e/s.components*s.byteLength;case Ga:return i*e/s.components*s.byteLength;case Wc:return i*e*2/s.components*s.byteLength;case Wa:return i*e*2/s.components*s.byteLength;case Gc:return i*e*3/s.components*s.byteLength;case yn:return i*e*4/s.components*s.byteLength;case Xa:return i*e*4/s.components*s.byteLength;case ao:case lo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case co:case ho:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ya:case Za:return Math.max(i,16)*Math.max(e,8)/4;case qa:case $a:return Math.max(i,8)*Math.max(e,8)/2;case Ja:case Ka:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case ja:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Qa:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case el:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case tl:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case nl:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case il:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case sl:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case rl:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case ol:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case al:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case ll:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case cl:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case hl:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case ul:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case dl:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case fl:case pl:case ml:return Math.ceil(i/4)*Math.ceil(e/4)*16;case gl:case _l:return Math.ceil(i/4)*Math.ceil(e/4)*8;case xl:case yl:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Wp(i){switch(i){case In:case Bc:return{byteLength:1,components:1};case Ws:case zc:case Xs:return{byteLength:2,components:1};case ka:case Ha:return{byteLength:2,components:4};case Ci:case za:case Ln:return{byteLength:4,components:1};case kc:case Hc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="180");function Gd(){let i=null,e=!1,t=null,n=null;function s(r,o){t(r,o),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function qp(i){let e=new WeakMap;function t(a,l){let c=a.array,h=a.usage,u=c.byteLength,f=i.createBuffer();i.bindBuffer(l,f),i.bufferData(l,c,h),a.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=i.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,l,c){let h=l.array,u=l.updateRanges;if(i.bindBuffer(c,a),u.length===0)i.bufferSubData(c,0,h);else{u.sort((d,g)=>d.start-g.start);let f=0;for(let d=1;d<u.length;d++){let g=u[f],_=u[d];_.start<=g.start+g.count+1?g.count=Math.max(g.count,_.start+_.count-g.start):(++f,u[f]=_)}u.length=f+1;for(let d=0,g=u.length;d<g;d++){let _=u[d];i.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(i.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var Yp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,$p=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Zp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Jp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Kp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,jp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Qp=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,em=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,tm=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,nm=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,im=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,sm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,rm=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,om=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,am=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,lm=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,cm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,hm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,um=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,dm=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,fm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,pm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,mm=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,gm=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,_m=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,xm=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,ym=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,vm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Mm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Sm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,bm="gl_FragColor = linearToOutputTexel( gl_FragColor );",Em=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Tm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,wm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Am=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Rm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Cm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Pm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Im=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Lm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Dm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Um=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Nm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Fm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Om=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Bm=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,zm=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,km=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Hm=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Vm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Gm=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Wm=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Xm=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,qm=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Ym=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,$m=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Zm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Jm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Km=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,jm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Qm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,eg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,tg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ng=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ig=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,sg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,rg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,og=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,ag=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,lg=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,cg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,ug=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,dg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,pg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,mg=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,gg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,_g=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,xg=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,yg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,vg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Mg=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Sg=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,bg=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Eg=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Tg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,wg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ag=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Rg=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Cg=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Pg=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Ig=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Lg=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Dg=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Ug=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Ng=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Fg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Og=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Bg=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,zg=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,kg=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Hg=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Vg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Gg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Wg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Xg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,qg=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Yg=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$g=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Zg=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Kg=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,jg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Qg=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,e0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,t0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,n0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,i0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,s0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,r0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,o0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,a0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,l0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,c0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,h0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,u0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,d0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,f0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,p0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,m0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,g0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,_0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,x0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,y0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,v0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,M0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,S0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,b0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,E0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,T0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ze={alphahash_fragment:Yp,alphahash_pars_fragment:$p,alphamap_fragment:Zp,alphamap_pars_fragment:Jp,alphatest_fragment:Kp,alphatest_pars_fragment:jp,aomap_fragment:Qp,aomap_pars_fragment:em,batching_pars_vertex:tm,batching_vertex:nm,begin_vertex:im,beginnormal_vertex:sm,bsdfs:rm,iridescence_fragment:om,bumpmap_pars_fragment:am,clipping_planes_fragment:lm,clipping_planes_pars_fragment:cm,clipping_planes_pars_vertex:hm,clipping_planes_vertex:um,color_fragment:dm,color_pars_fragment:fm,color_pars_vertex:pm,color_vertex:mm,common:gm,cube_uv_reflection_fragment:_m,defaultnormal_vertex:xm,displacementmap_pars_vertex:ym,displacementmap_vertex:vm,emissivemap_fragment:Mm,emissivemap_pars_fragment:Sm,colorspace_fragment:bm,colorspace_pars_fragment:Em,envmap_fragment:Tm,envmap_common_pars_fragment:wm,envmap_pars_fragment:Am,envmap_pars_vertex:Rm,envmap_physical_pars_fragment:zm,envmap_vertex:Cm,fog_vertex:Pm,fog_pars_vertex:Im,fog_fragment:Lm,fog_pars_fragment:Dm,gradientmap_pars_fragment:Um,lightmap_pars_fragment:Nm,lights_lambert_fragment:Fm,lights_lambert_pars_fragment:Om,lights_pars_begin:Bm,lights_toon_fragment:km,lights_toon_pars_fragment:Hm,lights_phong_fragment:Vm,lights_phong_pars_fragment:Gm,lights_physical_fragment:Wm,lights_physical_pars_fragment:Xm,lights_fragment_begin:qm,lights_fragment_maps:Ym,lights_fragment_end:$m,logdepthbuf_fragment:Zm,logdepthbuf_pars_fragment:Jm,logdepthbuf_pars_vertex:Km,logdepthbuf_vertex:jm,map_fragment:Qm,map_pars_fragment:eg,map_particle_fragment:tg,map_particle_pars_fragment:ng,metalnessmap_fragment:ig,metalnessmap_pars_fragment:sg,morphinstance_vertex:rg,morphcolor_vertex:og,morphnormal_vertex:ag,morphtarget_pars_vertex:lg,morphtarget_vertex:cg,normal_fragment_begin:hg,normal_fragment_maps:ug,normal_pars_fragment:dg,normal_pars_vertex:fg,normal_vertex:pg,normalmap_pars_fragment:mg,clearcoat_normal_fragment_begin:gg,clearcoat_normal_fragment_maps:_g,clearcoat_pars_fragment:xg,iridescence_pars_fragment:yg,opaque_fragment:vg,packing:Mg,premultiplied_alpha_fragment:Sg,project_vertex:bg,dithering_fragment:Eg,dithering_pars_fragment:Tg,roughnessmap_fragment:wg,roughnessmap_pars_fragment:Ag,shadowmap_pars_fragment:Rg,shadowmap_pars_vertex:Cg,shadowmap_vertex:Pg,shadowmask_pars_fragment:Ig,skinbase_vertex:Lg,skinning_pars_vertex:Dg,skinning_vertex:Ug,skinnormal_vertex:Ng,specularmap_fragment:Fg,specularmap_pars_fragment:Og,tonemapping_fragment:Bg,tonemapping_pars_fragment:zg,transmission_fragment:kg,transmission_pars_fragment:Hg,uv_pars_fragment:Vg,uv_pars_vertex:Gg,uv_vertex:Wg,worldpos_vertex:Xg,background_vert:qg,background_frag:Yg,backgroundCube_vert:$g,backgroundCube_frag:Zg,cube_vert:Jg,cube_frag:Kg,depth_vert:jg,depth_frag:Qg,distanceRGBA_vert:e0,distanceRGBA_frag:t0,equirect_vert:n0,equirect_frag:i0,linedashed_vert:s0,linedashed_frag:r0,meshbasic_vert:o0,meshbasic_frag:a0,meshlambert_vert:l0,meshlambert_frag:c0,meshmatcap_vert:h0,meshmatcap_frag:u0,meshnormal_vert:d0,meshnormal_frag:f0,meshphong_vert:p0,meshphong_frag:m0,meshphysical_vert:g0,meshphysical_frag:_0,meshtoon_vert:x0,meshtoon_frag:y0,points_vert:v0,points_frag:M0,shadow_vert:S0,shadow_frag:b0,sprite_vert:E0,sprite_frag:T0},_e={common:{diffuse:{value:new $e(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Xe},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Xe}},envmap:{envMap:{value:null},envMapRotation:{value:new Xe},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Xe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Xe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Xe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Xe},normalScale:{value:new ee(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Xe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Xe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Xe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Xe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new $e(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new $e(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0},uvTransform:{value:new Xe}},sprite:{diffuse:{value:new $e(16777215)},opacity:{value:1},center:{value:new ee(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Xe},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0}}},Xn={basic:{uniforms:Bt([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.fog]),vertexShader:Ze.meshbasic_vert,fragmentShader:Ze.meshbasic_frag},lambert:{uniforms:Bt([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new $e(0)}}]),vertexShader:Ze.meshlambert_vert,fragmentShader:Ze.meshlambert_frag},phong:{uniforms:Bt([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new $e(0)},specular:{value:new $e(1118481)},shininess:{value:30}}]),vertexShader:Ze.meshphong_vert,fragmentShader:Ze.meshphong_frag},standard:{uniforms:Bt([_e.common,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.roughnessmap,_e.metalnessmap,_e.fog,_e.lights,{emissive:{value:new $e(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ze.meshphysical_vert,fragmentShader:Ze.meshphysical_frag},toon:{uniforms:Bt([_e.common,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.gradientmap,_e.fog,_e.lights,{emissive:{value:new $e(0)}}]),vertexShader:Ze.meshtoon_vert,fragmentShader:Ze.meshtoon_frag},matcap:{uniforms:Bt([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,{matcap:{value:null}}]),vertexShader:Ze.meshmatcap_vert,fragmentShader:Ze.meshmatcap_frag},points:{uniforms:Bt([_e.points,_e.fog]),vertexShader:Ze.points_vert,fragmentShader:Ze.points_frag},dashed:{uniforms:Bt([_e.common,_e.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ze.linedashed_vert,fragmentShader:Ze.linedashed_frag},depth:{uniforms:Bt([_e.common,_e.displacementmap]),vertexShader:Ze.depth_vert,fragmentShader:Ze.depth_frag},normal:{uniforms:Bt([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,{opacity:{value:1}}]),vertexShader:Ze.meshnormal_vert,fragmentShader:Ze.meshnormal_frag},sprite:{uniforms:Bt([_e.sprite,_e.fog]),vertexShader:Ze.sprite_vert,fragmentShader:Ze.sprite_frag},background:{uniforms:{uvTransform:{value:new Xe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ze.background_vert,fragmentShader:Ze.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Xe}},vertexShader:Ze.backgroundCube_vert,fragmentShader:Ze.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ze.cube_vert,fragmentShader:Ze.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ze.equirect_vert,fragmentShader:Ze.equirect_frag},distanceRGBA:{uniforms:Bt([_e.common,_e.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ze.distanceRGBA_vert,fragmentShader:Ze.distanceRGBA_frag},shadow:{uniforms:Bt([_e.lights,_e.fog,{color:{value:new $e(0)},opacity:{value:1}}]),vertexShader:Ze.shadow_vert,fragmentShader:Ze.shadow_frag}};Xn.physical={uniforms:Bt([Xn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Xe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Xe},clearcoatNormalScale:{value:new ee(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Xe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Xe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Xe},sheen:{value:0},sheenColor:{value:new $e(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Xe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Xe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Xe},transmissionSamplerSize:{value:new ee},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Xe},attenuationDistance:{value:0},attenuationColor:{value:new $e(0)},specularColor:{value:new $e(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Xe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Xe},anisotropyVector:{value:new ee},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Xe}}]),vertexShader:Ze.meshphysical_vert,fragmentShader:Ze.meshphysical_frag};var vl={r:0,b:0,g:0},ts=new Rn,w0=new st;function A0(i,e,t,n,s,r,o){let a=new $e(0),l=r===!0?0:1,c,h,u=null,f=0,d=null;function g(v){let x=v.isScene===!0?v.background:null;return x&&x.isTexture&&(x=(v.backgroundBlurriness>0?t:e).get(x)),x}function _(v){let x=!1,A=g(v);A===null?p(a,l):A&&A.isColor&&(p(A,1),x=!0);let T=i.xr.getEnvironmentBlendMode();T==="additive"?n.buffers.color.setClear(0,0,0,1,o):T==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||x)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(v,x){let A=g(x);A&&(A.isCubeTexture||A.mapping===ro)?(h===void 0&&(h=new Mt(new kn(1,1,1),new Cn({name:"BackgroundCubeMaterial",uniforms:es(Xn.backgroundCube.uniforms),vertexShader:Xn.backgroundCube.vertexShader,fragmentShader:Xn.backgroundCube.fragmentShader,side:Wt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(T,C,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),ts.copy(x.backgroundRotation),ts.x*=-1,ts.y*=-1,ts.z*=-1,A.isCubeTexture&&A.isRenderTargetTexture===!1&&(ts.y*=-1,ts.z*=-1),h.material.uniforms.envMap.value=A,h.material.uniforms.flipEnvMap.value=A.isCubeTexture&&A.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(w0.makeRotationFromEuler(ts)),h.material.toneMapped=nt.getTransfer(A.colorSpace)!==at,(u!==A||f!==A.version||d!==i.toneMapping)&&(h.material.needsUpdate=!0,u=A,f=A.version,d=i.toneMapping),h.layers.enableAll(),v.unshift(h,h.geometry,h.material,0,0,null)):A&&A.isTexture&&(c===void 0&&(c=new Mt(new Yi(2,2),new Cn({name:"BackgroundMaterial",uniforms:es(Xn.background.uniforms),vertexShader:Xn.background.vertexShader,fragmentShader:Xn.background.fragmentShader,side:ei,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=A,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.toneMapped=nt.getTransfer(A.colorSpace)!==at,A.matrixAutoUpdate===!0&&A.updateMatrix(),c.material.uniforms.uvTransform.value.copy(A.matrix),(u!==A||f!==A.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,u=A,f=A.version,d=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null))}function p(v,x){v.getRGB(vl,Jc(i)),n.buffers.color.setClear(vl.r,vl.g,vl.b,x,o)}function M(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,x=1){a.set(v),l=x,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(v){l=v,p(a,l)},render:_,addToRenderList:m,dispose:M}}function R0(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null),r=s,o=!1;function a(S,L,O,k,G){let X=!1,W=u(k,O,L);r!==W&&(r=W,c(r.object)),X=d(S,k,O,G),X&&g(S,k,O,G),G!==null&&e.update(G,i.ELEMENT_ARRAY_BUFFER),(X||o)&&(o=!1,x(S,L,O,k),G!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(G).buffer))}function l(){return i.createVertexArray()}function c(S){return i.bindVertexArray(S)}function h(S){return i.deleteVertexArray(S)}function u(S,L,O){let k=O.wireframe===!0,G=n[S.id];G===void 0&&(G={},n[S.id]=G);let X=G[L.id];X===void 0&&(X={},G[L.id]=X);let W=X[k];return W===void 0&&(W=f(l()),X[k]=W),W}function f(S){let L=[],O=[],k=[];for(let G=0;G<t;G++)L[G]=0,O[G]=0,k[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:O,attributeDivisors:k,object:S,attributes:{},index:null}}function d(S,L,O,k){let G=r.attributes,X=L.attributes,W=0,se=O.getAttributes();for(let U in se)if(se[U].location>=0){let oe=G[U],ge=X[U];if(ge===void 0&&(U==="instanceMatrix"&&S.instanceMatrix&&(ge=S.instanceMatrix),U==="instanceColor"&&S.instanceColor&&(ge=S.instanceColor)),oe===void 0||oe.attribute!==ge||ge&&oe.data!==ge.data)return!0;W++}return r.attributesNum!==W||r.index!==k}function g(S,L,O,k){let G={},X=L.attributes,W=0,se=O.getAttributes();for(let U in se)if(se[U].location>=0){let oe=X[U];oe===void 0&&(U==="instanceMatrix"&&S.instanceMatrix&&(oe=S.instanceMatrix),U==="instanceColor"&&S.instanceColor&&(oe=S.instanceColor));let ge={};ge.attribute=oe,oe&&oe.data&&(ge.data=oe.data),G[U]=ge,W++}r.attributes=G,r.attributesNum=W,r.index=k}function _(){let S=r.newAttributes;for(let L=0,O=S.length;L<O;L++)S[L]=0}function m(S){p(S,0)}function p(S,L){let O=r.newAttributes,k=r.enabledAttributes,G=r.attributeDivisors;O[S]=1,k[S]===0&&(i.enableVertexAttribArray(S),k[S]=1),G[S]!==L&&(i.vertexAttribDivisor(S,L),G[S]=L)}function M(){let S=r.newAttributes,L=r.enabledAttributes;for(let O=0,k=L.length;O<k;O++)L[O]!==S[O]&&(i.disableVertexAttribArray(O),L[O]=0)}function v(S,L,O,k,G,X,W){W===!0?i.vertexAttribIPointer(S,L,O,G,X):i.vertexAttribPointer(S,L,O,k,G,X)}function x(S,L,O,k){_();let G=k.attributes,X=O.getAttributes(),W=L.defaultAttributeValues;for(let se in X){let U=X[se];if(U.location>=0){let te=G[se];if(te===void 0&&(se==="instanceMatrix"&&S.instanceMatrix&&(te=S.instanceMatrix),se==="instanceColor"&&S.instanceColor&&(te=S.instanceColor)),te!==void 0){let oe=te.normalized,ge=te.itemSize,De=e.get(te);if(De===void 0)continue;let ke=De.buffer,Ve=De.type,Ke=De.bytesPerElement,Z=Ve===i.INT||Ve===i.UNSIGNED_INT||te.gpuType===za;if(te.isInterleavedBufferAttribute){let ne=te.data,Me=ne.stride,we=te.offset;if(ne.isInstancedInterleavedBuffer){for(let be=0;be<U.locationSize;be++)p(U.location+be,ne.meshPerAttribute);S.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=ne.meshPerAttribute*ne.count)}else for(let be=0;be<U.locationSize;be++)m(U.location+be);i.bindBuffer(i.ARRAY_BUFFER,ke);for(let be=0;be<U.locationSize;be++)v(U.location+be,ge/U.locationSize,Ve,oe,Me*Ke,(we+ge/U.locationSize*be)*Ke,Z)}else{if(te.isInstancedBufferAttribute){for(let ne=0;ne<U.locationSize;ne++)p(U.location+ne,te.meshPerAttribute);S.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let ne=0;ne<U.locationSize;ne++)m(U.location+ne);i.bindBuffer(i.ARRAY_BUFFER,ke);for(let ne=0;ne<U.locationSize;ne++)v(U.location+ne,ge/U.locationSize,Ve,oe,ge*Ke,ge/U.locationSize*ne*Ke,Z)}}else if(W!==void 0){let oe=W[se];if(oe!==void 0)switch(oe.length){case 2:i.vertexAttrib2fv(U.location,oe);break;case 3:i.vertexAttrib3fv(U.location,oe);break;case 4:i.vertexAttrib4fv(U.location,oe);break;default:i.vertexAttrib1fv(U.location,oe)}}}}M()}function A(){P();for(let S in n){let L=n[S];for(let O in L){let k=L[O];for(let G in k)h(k[G].object),delete k[G];delete L[O]}delete n[S]}}function T(S){if(n[S.id]===void 0)return;let L=n[S.id];for(let O in L){let k=L[O];for(let G in k)h(k[G].object),delete k[G];delete L[O]}delete n[S.id]}function C(S){for(let L in n){let O=n[L];if(O[S.id]===void 0)continue;let k=O[S.id];for(let G in k)h(k[G].object),delete k[G];delete O[S.id]}}function P(){b(),o=!0,r!==s&&(r=s,c(r.object))}function b(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:P,resetDefaultState:b,dispose:A,releaseStatesOfGeometry:T,releaseStatesOfProgram:C,initAttributes:_,enableAttribute:m,disableUnusedAttributes:M}}function C0(i,e,t){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),t.update(h,n,1)}function o(c,h,u){u!==0&&(i.drawArraysInstanced(n,c,h,u),t.update(h,n,u))}function a(c,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,u);let d=0;for(let g=0;g<u;g++)d+=h[g];t.update(d,n,1)}function l(c,h,u,f){if(u===0)return;let d=e.get("WEBGL_multi_draw");if(d===null)for(let g=0;g<c.length;g++)o(c[g],h[g],f[g]);else{d.multiDrawArraysInstancedWEBGL(n,c,0,h,0,f,0,u);let g=0;for(let _=0;_<u;_++)g+=h[_]*f[_];t.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function P0(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(C){return!(C!==yn&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let P=C===Xs&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==In&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==Ln&&!P)}function l(C){if(C==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=t.logarithmicDepthBuffer===!0,f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),M=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),v=i.getParameter(i.MAX_VARYING_VECTORS),x=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),A=g>0,T=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:f,maxTextures:d,maxVertexTextures:g,maxTextureSize:_,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:M,maxVaryings:v,maxFragmentUniforms:x,vertexTextures:A,maxSamples:T}}function I0(i){let e=this,t=null,n=0,s=!1,r=!1,o=new gn,a=new Xe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let d=u.length!==0||f||n!==0||s;return s=f,n=u.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){t=h(u,f,0)},this.setState=function(u,f,d){let g=u.clippingPlanes,_=u.clipIntersection,m=u.clipShadows,p=i.get(u);if(!s||g===null||g.length===0||r&&!m)r?h(null):c();else{let M=r?0:n,v=M*4,x=p.clippingState||null;l.value=x,x=h(g,f,v,d);for(let A=0;A!==v;++A)x[A]=t[A];p.clippingState=x,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,f,d,g){let _=u!==null?u.length:0,m=null;if(_!==0){if(m=l.value,g!==!0||m===null){let p=d+_*4,M=f.matrixWorldInverse;a.getNormalMatrix(M),(m===null||m.length<p)&&(m=new Float32Array(p));for(let v=0,x=d;v!==_;++v,x+=4)o.copy(u[v]).applyMatrix4(M,a),o.normal.toArray(m,x),m[x+3]=o.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,m}}function L0(i){let e=new WeakMap;function t(o,a){return a===Fa?o.mapping=Ki:a===Oa&&(o.mapping=ji),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===Fa||a===Oa)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new ra(l.height);return c.fromEquirectangularTexture(i,o),e.set(o,c),o.addEventListener("dispose",s),t(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var Zs=4,vd=[.125,.215,.35,.446,.526,.582],ss=20,th=new Vn,Md=new $e,nh=null,ih=0,sh=0,rh=!1,is=(1+Math.sqrt(5))/2,$s=1/is,Sd=[new R(-is,$s,0),new R(is,$s,0),new R(-$s,0,is),new R($s,0,is),new R(0,is,-$s),new R(0,is,$s),new R(-1,1,-1),new R(1,1,-1),new R(-1,1,1),new R(1,1,1)],D0=new R,bl=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100,r={}){let{size:o=256,position:a=D0}=r;nh=this._renderer.getRenderTarget(),ih=this._renderer.getActiveCubeFace(),sh=this._renderer.getActiveMipmapLevel(),rh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Td(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ed(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(nh,ih,sh),this._renderer.xr.enabled=rh,e.scissorTest=!1,Ml(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ki||e.mapping===ji?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),nh=this._renderer.getRenderTarget(),ih=this._renderer.getActiveCubeFace(),sh=this._renderer.getActiveMipmapLevel(),rh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:An,minFilter:An,generateMipmaps:!1,type:Xs,format:yn,colorSpace:Vi,depthBuffer:!1},s=bd(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=bd(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=U0(r)),this._blurMaterial=N0(r,e,t)}return s}_compileMaterial(e){let t=new Mt(this._lodPlanes[0],e);this._renderer.compile(t,th)}_sceneToCubeUV(e,t,n,s,r){let l=new Gt(90,1,t,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,d=u.toneMapping;u.getClearColor(Md),u.toneMapping=ri,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(s),u.clearDepth(),u.setRenderTarget(null));let _=new Si({name:"PMREM.Background",side:Wt,depthWrite:!1,depthTest:!1}),m=new Mt(new kn,_),p=!1,M=e.background;M?M.isColor&&(_.color.copy(M),e.background=null,p=!0):(_.color.copy(Md),p=!0);for(let v=0;v<6;v++){let x=v%3;x===0?(l.up.set(0,c[v],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[v],r.y,r.z)):x===1?(l.up.set(0,0,c[v]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[v],r.z)):(l.up.set(0,c[v],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[v]));let A=this._cubeSize;Ml(s,x*A,v>2?A:0,A,A),u.setRenderTarget(s),p&&u.render(m,l),u.render(e,l)}m.geometry.dispose(),m.material.dispose(),u.toneMapping=d,u.autoClear=f,e.background=M}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===Ki||e.mapping===ji;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Td()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ed());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new Mt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;Ml(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(o,th)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Sd[(s-r-1)%Sd.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,s,"latitudinal",r),this._halfBlur(o,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new Mt(this._lodPlanes[s],c),f=c.uniforms,d=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*ss-1),_=r/g,m=isFinite(r)?1+Math.floor(h*_):ss;m>ss&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${ss}`);let p=[],M=0;for(let C=0;C<ss;++C){let P=C/_,b=Math.exp(-P*P/2);p.push(b),C===0?M+=b:C<m&&(M+=2*b)}for(let C=0;C<p.length;C++)p[C]=p[C]/M;f.envMap.value=e.texture,f.samples.value=m,f.weights.value=p,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);let{_lodMax:v}=this;f.dTheta.value=g,f.mipInt.value=v-n;let x=this._sizeLods[s],A=3*x*(s>v-Zs?s-v+Zs:0),T=4*(this._cubeSize-x);Ml(t,A,T,3*x,2*x),l.setRenderTarget(t),l.render(u,th)}};function U0(i){let e=[],t=[],n=[],s=i,r=i-Zs+1+vd.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let l=1/a;o>i-Zs?l=vd[o-i+Zs-1]:o===0&&(l=0),n.push(l);let c=1/(a-2),h=-c,u=1+c,f=[h,h,u,h,u,u,h,h,u,u,h,u],d=6,g=6,_=3,m=2,p=1,M=new Float32Array(_*g*d),v=new Float32Array(m*g*d),x=new Float32Array(p*g*d);for(let T=0;T<d;T++){let C=T%3*2/3-1,P=T>2?0:-1,b=[C,P,0,C+2/3,P,0,C+2/3,P+1,0,C,P,0,C+2/3,P+1,0,C,P+1,0];M.set(b,_*g*T),v.set(f,m*g*T);let S=[T,T,T,T,T,T];x.set(S,p*g*T)}let A=new yt;A.setAttribute("position",new $t(M,_)),A.setAttribute("uv",new $t(v,m)),A.setAttribute("faceIndex",new $t(x,p)),e.push(A),s>Zs&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function bd(i,e,t){let n=new Bn(i,e,t);return n.texture.mapping=ro,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ml(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function N0(i,e,t){let n=new Float32Array(ss),s=new R(0,1,0);return new Cn({name:"SphericalGaussianBlur",defines:{n:ss,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:mh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function Ed(){return new Cn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:mh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function Td(){return new Cn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:mh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function mh(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function F0(i){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){let l=a.mapping,c=l===Fa||l===Oa,h=l===Ki||l===ji;if(c||h){let u=e.get(a),f=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return t===null&&(t=new bl(i)),u=c?t.fromEquirectangular(a,u):t.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),u.texture;if(u!==void 0)return u.texture;{let d=a.image;return c&&d&&d.height>0||h&&d&&s(d)?(t===null&&(t=new bl(i)),u=c?t.fromEquirectangular(a):t.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function O0(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&Ps("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function B0(i,e,t,n){let s={},r=new WeakMap;function o(u){let f=u.target;f.index!==null&&e.remove(f.index);for(let g in f.attributes)e.remove(f.attributes[g]);f.removeEventListener("dispose",o),delete s[f.id];let d=r.get(f);d&&(e.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(u,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,t.memory.geometries++),f}function l(u){let f=u.attributes;for(let d in f)e.update(f[d],i.ARRAY_BUFFER)}function c(u){let f=[],d=u.index,g=u.attributes.position,_=0;if(d!==null){let M=d.array;_=d.version;for(let v=0,x=M.length;v<x;v+=3){let A=M[v+0],T=M[v+1],C=M[v+2];f.push(A,T,T,C,C,A)}}else if(g!==void 0){let M=g.array;_=g.version;for(let v=0,x=M.length/3-1;v<x;v+=3){let A=v+0,T=v+1,C=v+2;f.push(A,T,T,C,C,A)}}else return;let m=new(Zc(f)?Lr:Ir)(f,1);m.version=_;let p=r.get(u);p&&e.remove(p),r.set(u,m)}function h(u){let f=r.get(u);if(f){let d=u.index;d!==null&&f.version<d.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function z0(i,e,t){let n;function s(f){n=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function l(f,d){i.drawElements(n,d,r,f*o),t.update(d,n,1)}function c(f,d,g){g!==0&&(i.drawElementsInstanced(n,d,r,f*o,g),t.update(d,n,g))}function h(f,d,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,f,0,g);let m=0;for(let p=0;p<g;p++)m+=d[p];t.update(m,n,1)}function u(f,d,g,_){if(g===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<f.length;p++)c(f[p]/o,d[p],_[p]);else{m.multiDrawElementsInstancedWEBGL(n,d,0,r,f,0,_,0,g);let p=0;for(let M=0;M<g;M++)p+=d[M]*_[M];t.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function k0(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(r/3);break;case i.LINES:t.lines+=a*(r/2);break;case i.LINE_STRIP:t.lines+=a*(r-1);break;case i.LINE_LOOP:t.lines+=a*r;break;case i.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function H0(i,e,t){let n=new WeakMap,s=new ot;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,f=n.get(a);if(f===void 0||f.count!==u){let b=function(){C.dispose(),n.delete(a),a.removeEventListener("dispose",b)};f!==void 0&&f.texture.dispose();let d=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,_=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],M=a.morphAttributes.color||[],v=0;d===!0&&(v=1),g===!0&&(v=2),_===!0&&(v=3);let x=a.attributes.position.count*v,A=1;x>e.maxTextureSize&&(A=Math.ceil(x/e.maxTextureSize),x=e.maxTextureSize);let T=new Float32Array(x*A*4*u),C=new Pr(T,x,A,u);C.type=Ln,C.needsUpdate=!0;let P=v*4;for(let S=0;S<u;S++){let L=m[S],O=p[S],k=M[S],G=x*A*4*S;for(let X=0;X<L.count;X++){let W=X*P;d===!0&&(s.fromBufferAttribute(L,X),T[G+W+0]=s.x,T[G+W+1]=s.y,T[G+W+2]=s.z,T[G+W+3]=0),g===!0&&(s.fromBufferAttribute(O,X),T[G+W+4]=s.x,T[G+W+5]=s.y,T[G+W+6]=s.z,T[G+W+7]=0),_===!0&&(s.fromBufferAttribute(k,X),T[G+W+8]=s.x,T[G+W+9]=s.y,T[G+W+10]=s.z,T[G+W+11]=k.itemSize===4?s.w:1)}}f={count:u,texture:C,size:new ee(x,A)},n.set(a,f),a.addEventListener("dispose",b)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,t);else{let d=0;for(let _=0;_<c.length;_++)d+=c[_];let g=a.morphTargetsRelative?1:1-d;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",f.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function V0(i,e,t,n){let s=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,u=e.get(l,h);if(s.get(u)!==c&&(e.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return u}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}var Wd=new Ot,wd=new Or(1,1),Xd=new Pr,qd=new ia,Yd=new Ur,Ad=[],Rd=[],Cd=new Float32Array(16),Pd=new Float32Array(9),Id=new Float32Array(4);function js(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=Ad[s];if(r===void 0&&(r=new Float32Array(s),Ad[s]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,i[o].toArray(r,a)}return r}function Tt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function wt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function El(i,e){let t=Rd[e];t===void 0&&(t=new Int32Array(e),Rd[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function G0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function W0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Tt(t,e))return;i.uniform2fv(this.addr,e),wt(t,e)}}function X0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Tt(t,e))return;i.uniform3fv(this.addr,e),wt(t,e)}}function q0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Tt(t,e))return;i.uniform4fv(this.addr,e),wt(t,e)}}function Y0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Tt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),wt(t,e)}else{if(Tt(t,n))return;Id.set(n),i.uniformMatrix2fv(this.addr,!1,Id),wt(t,n)}}function $0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Tt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),wt(t,e)}else{if(Tt(t,n))return;Pd.set(n),i.uniformMatrix3fv(this.addr,!1,Pd),wt(t,n)}}function Z0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Tt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),wt(t,e)}else{if(Tt(t,n))return;Cd.set(n),i.uniformMatrix4fv(this.addr,!1,Cd),wt(t,n)}}function J0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function K0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Tt(t,e))return;i.uniform2iv(this.addr,e),wt(t,e)}}function j0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Tt(t,e))return;i.uniform3iv(this.addr,e),wt(t,e)}}function Q0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Tt(t,e))return;i.uniform4iv(this.addr,e),wt(t,e)}}function e_(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function t_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Tt(t,e))return;i.uniform2uiv(this.addr,e),wt(t,e)}}function n_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Tt(t,e))return;i.uniform3uiv(this.addr,e),wt(t,e)}}function i_(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Tt(t,e))return;i.uniform4uiv(this.addr,e),wt(t,e)}}function s_(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(wd.compareFunction=qc,r=wd):r=Wd,t.setTexture2D(e||r,s)}function r_(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||qd,s)}function o_(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||Yd,s)}function a_(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Xd,s)}function l_(i){switch(i){case 5126:return G0;case 35664:return W0;case 35665:return X0;case 35666:return q0;case 35674:return Y0;case 35675:return $0;case 35676:return Z0;case 5124:case 35670:return J0;case 35667:case 35671:return K0;case 35668:case 35672:return j0;case 35669:case 35673:return Q0;case 5125:return e_;case 36294:return t_;case 36295:return n_;case 36296:return i_;case 35678:case 36198:case 36298:case 36306:case 35682:return s_;case 35679:case 36299:case 36307:return r_;case 35680:case 36300:case 36308:case 36293:return o_;case 36289:case 36303:case 36311:case 36292:return a_}}function c_(i,e){i.uniform1fv(this.addr,e)}function h_(i,e){let t=js(e,this.size,2);i.uniform2fv(this.addr,t)}function u_(i,e){let t=js(e,this.size,3);i.uniform3fv(this.addr,t)}function d_(i,e){let t=js(e,this.size,4);i.uniform4fv(this.addr,t)}function f_(i,e){let t=js(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function p_(i,e){let t=js(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function m_(i,e){let t=js(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function g_(i,e){i.uniform1iv(this.addr,e)}function __(i,e){i.uniform2iv(this.addr,e)}function x_(i,e){i.uniform3iv(this.addr,e)}function y_(i,e){i.uniform4iv(this.addr,e)}function v_(i,e){i.uniform1uiv(this.addr,e)}function M_(i,e){i.uniform2uiv(this.addr,e)}function S_(i,e){i.uniform3uiv(this.addr,e)}function b_(i,e){i.uniform4uiv(this.addr,e)}function E_(i,e,t){let n=this.cache,s=e.length,r=El(t,s);Tt(n,r)||(i.uniform1iv(this.addr,r),wt(n,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||Wd,r[o])}function T_(i,e,t){let n=this.cache,s=e.length,r=El(t,s);Tt(n,r)||(i.uniform1iv(this.addr,r),wt(n,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||qd,r[o])}function w_(i,e,t){let n=this.cache,s=e.length,r=El(t,s);Tt(n,r)||(i.uniform1iv(this.addr,r),wt(n,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||Yd,r[o])}function A_(i,e,t){let n=this.cache,s=e.length,r=El(t,s);Tt(n,r)||(i.uniform1iv(this.addr,r),wt(n,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||Xd,r[o])}function R_(i){switch(i){case 5126:return c_;case 35664:return h_;case 35665:return u_;case 35666:return d_;case 35674:return f_;case 35675:return p_;case 35676:return m_;case 5124:case 35670:return g_;case 35667:case 35671:return __;case 35668:case 35672:return x_;case 35669:case 35673:return y_;case 5125:return v_;case 36294:return M_;case 36295:return S_;case 36296:return b_;case 35678:case 36198:case 36298:case 36306:case 35682:return E_;case 35679:case 36299:case 36307:return T_;case 35680:case 36300:case 36308:case 36293:return w_;case 36289:case 36303:case 36311:case 36292:return A_}}var ah=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=l_(t.type)}},lh=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=R_(t.type)}},ch=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],n)}}},oh=/(\w+)(\])?(\[|\.)?/g;function Ld(i,e){i.seq.push(e),i.map[e.id]=e}function C_(i,e,t){let n=i.name,s=n.length;for(oh.lastIndex=0;;){let r=oh.exec(n),o=oh.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Ld(t,c===void 0?new ah(a,i,e):new lh(a,i,e));break}else{let u=t.map[a];u===void 0&&(u=new ch(a),Ld(t,u)),t=u}}}var Js=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);C_(r,o,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&n.push(o)}return n}};function Dd(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var P_=37297,I_=0;function L_(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}var Ud=new Xe;function D_(i){nt._getMatrix(Ud,nt.workingColorSpace,i);let e=`mat3( ${Ud.elements.map(t=>t.toFixed(4))} )`;switch(nt.getTransfer(i)){case Rr:return[e,"LinearTransferOETF"];case at:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Nd(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+L_(i.getShaderSource(e),a)}else return r}function U_(i,e){let t=D_(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function N_(i,e){let t;switch(e){case $u:t="Linear";break;case Zu:t="Reinhard";break;case Ju:t="Cineon";break;case Na:t="ACESFilmic";break;case ju:t="AgX";break;case Qu:t="Neutral";break;case Ku:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Sl=new R;function F_(){nt.getLuminanceCoefficients(Sl);let i=Sl.x.toFixed(4),e=Sl.y.toFixed(4),t=Sl.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function O_(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(uo).join(`
`)}function B_(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function z_(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:i.getAttribLocation(e,o),locationSize:a}}return t}function uo(i){return i!==""}function Fd(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Od(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var k_=/^[ \t]*#include +<([\w\d./]+)>/gm;function hh(i){return i.replace(k_,V_)}var H_=new Map;function V_(i,e){let t=Ze[e];if(t===void 0){let n=H_.get(e);if(n!==void 0)t=Ze[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return hh(t)}var G_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Bd(i){return i.replace(G_,W_)}function W_(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function zd(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function X_(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Lc?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===Aa?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Gn&&(e="SHADOWMAP_TYPE_VSM"),e}function q_(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ki:case ji:e="ENVMAP_TYPE_CUBE";break;case ro:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Y_(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case ji:e="ENVMAP_MODE_REFRACTION";break}return e}function $_(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Fc:e="ENVMAP_BLENDING_MULTIPLY";break;case qu:e="ENVMAP_BLENDING_MIX";break;case Yu:e="ENVMAP_BLENDING_ADD";break}return e}function Z_(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function J_(i,e,t,n){let s=i.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=X_(t),c=q_(t),h=Y_(t),u=$_(t),f=Z_(t),d=O_(t),g=B_(r),_=s.createProgram(),m,p,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(uo).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(uo).join(`
`),p.length>0&&(p+=`
`)):(m=[zd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(uo).join(`
`),p=[zd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ri?"#define TONE_MAPPING":"",t.toneMapping!==ri?Ze.tonemapping_pars_fragment:"",t.toneMapping!==ri?N_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ze.colorspace_pars_fragment,U_("linearToOutputTexel",t.outputColorSpace),F_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(uo).join(`
`)),o=hh(o),o=Fd(o,t),o=Od(o,t),a=hh(a),a=Fd(a,t),a=Od(a,t),o=Bd(o),a=Bd(a),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===Yc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Yc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let v=M+m+o,x=M+p+a,A=Dd(s,s.VERTEX_SHADER,v),T=Dd(s,s.FRAGMENT_SHADER,x);s.attachShader(_,A),s.attachShader(_,T),t.index0AttributeName!==void 0?s.bindAttribLocation(_,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function C(L){if(i.debug.checkShaderErrors){let O=s.getProgramInfoLog(_)||"",k=s.getShaderInfoLog(A)||"",G=s.getShaderInfoLog(T)||"",X=O.trim(),W=k.trim(),se=G.trim(),U=!0,te=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(U=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,_,A,T);else{let oe=Nd(s,A,"vertex"),ge=Nd(s,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+X+`
`+oe+`
`+ge)}else X!==""?console.warn("THREE.WebGLProgram: Program Info Log:",X):(W===""||se==="")&&(te=!1);te&&(L.diagnostics={runnable:U,programLog:X,vertexShader:{log:W,prefix:m},fragmentShader:{log:se,prefix:p}})}s.deleteShader(A),s.deleteShader(T),P=new Js(s,_),b=z_(s,_)}let P;this.getUniforms=function(){return P===void 0&&C(this),P};let b;this.getAttributes=function(){return b===void 0&&C(this),b};let S=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=s.getProgramParameter(_,P_)),S},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=I_++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=A,this.fragmentShader=T,this}var K_=0,uh=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new dh(e),t.set(e,n)),n}},dh=class{constructor(e){this.id=K_++,this.code=e,this.usedTimes=0}};function j_(i,e,t,n,s,r,o){let a=new Ls,l=new uh,c=new Set,h=[],u=s.logarithmicDepthBuffer,f=s.vertexTextures,d=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(b){return c.add(b),b===0?"uv":`uv${b}`}function m(b,S,L,O,k){let G=O.fog,X=k.geometry,W=b.isMeshStandardMaterial?O.environment:null,se=(b.isMeshStandardMaterial?t:e).get(b.envMap||W),U=se&&se.mapping===ro?se.image.height:null,te=g[b.type];b.precision!==null&&(d=s.getMaxPrecision(b.precision),d!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",d,"instead."));let oe=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,ge=oe!==void 0?oe.length:0,De=0;X.morphAttributes.position!==void 0&&(De=1),X.morphAttributes.normal!==void 0&&(De=2),X.morphAttributes.color!==void 0&&(De=3);let ke,Ve,Ke,Z;if(te){let rt=Xn[te];ke=rt.vertexShader,Ve=rt.fragmentShader}else ke=b.vertexShader,Ve=b.fragmentShader,l.update(b),Ke=l.getVertexShaderID(b),Z=l.getFragmentShaderID(b);let ne=i.getRenderTarget(),Me=i.state.buffers.depth.getReversed(),we=k.isInstancedMesh===!0,be=k.isBatchedMesh===!0,Je=!!b.map,ut=!!b.matcap,I=!!se,re=!!b.aoMap,j=!!b.lightMap,K=!!b.bumpMap,J=!!b.normalMap,fe=!!b.displacementMap,ae=!!b.emissiveMap,pe=!!b.metalnessMap,Ge=!!b.roughnessMap,He=b.anisotropy>0,w=b.clearcoat>0,y=b.dispersion>0,B=b.iridescence>0,q=b.sheen>0,ie=b.transmission>0,Y=He&&!!b.anisotropyMap,Pe=w&&!!b.clearcoatMap,de=w&&!!b.clearcoatNormalMap,Ae=w&&!!b.clearcoatRoughnessMap,Re=B&&!!b.iridescenceMap,le=B&&!!b.iridescenceThicknessMap,ve=q&&!!b.sheenColorMap,Be=q&&!!b.sheenRoughnessMap,Le=!!b.specularMap,xe=!!b.specularColorMap,qe=!!b.specularIntensityMap,D=ie&&!!b.transmissionMap,ue=ie&&!!b.thicknessMap,me=!!b.gradientMap,Ee=!!b.alphaMap,ce=b.alphaTest>0,Q=!!b.alphaHash,Ce=!!b.extensions,We=ri;b.toneMapped&&(ne===null||ne.isXRRenderTarget===!0)&&(We=i.toneMapping);let dt={shaderID:te,shaderType:b.type,shaderName:b.name,vertexShader:ke,fragmentShader:Ve,defines:b.defines,customVertexShaderID:Ke,customFragmentShaderID:Z,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:d,batching:be,batchingColor:be&&k._colorsTexture!==null,instancing:we,instancingColor:we&&k.instanceColor!==null,instancingMorph:we&&k.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:ne===null?i.outputColorSpace:ne.isXRRenderTarget===!0?ne.texture.colorSpace:Vi,alphaToCoverage:!!b.alphaToCoverage,map:Je,matcap:ut,envMap:I,envMapMode:I&&se.mapping,envMapCubeUVHeight:U,aoMap:re,lightMap:j,bumpMap:K,normalMap:J,displacementMap:f&&fe,emissiveMap:ae,normalMapObjectSpace:J&&b.normalMapType===id,normalMapTangentSpace:J&&b.normalMapType===Xc,metalnessMap:pe,roughnessMap:Ge,anisotropy:He,anisotropyMap:Y,clearcoat:w,clearcoatMap:Pe,clearcoatNormalMap:de,clearcoatRoughnessMap:Ae,dispersion:y,iridescence:B,iridescenceMap:Re,iridescenceThicknessMap:le,sheen:q,sheenColorMap:ve,sheenRoughnessMap:Be,specularMap:Le,specularColorMap:xe,specularIntensityMap:qe,transmission:ie,transmissionMap:D,thicknessMap:ue,gradientMap:me,opaque:b.transparent===!1&&b.blending===ki&&b.alphaToCoverage===!1,alphaMap:Ee,alphaTest:ce,alphaHash:Q,combine:b.combine,mapUv:Je&&_(b.map.channel),aoMapUv:re&&_(b.aoMap.channel),lightMapUv:j&&_(b.lightMap.channel),bumpMapUv:K&&_(b.bumpMap.channel),normalMapUv:J&&_(b.normalMap.channel),displacementMapUv:fe&&_(b.displacementMap.channel),emissiveMapUv:ae&&_(b.emissiveMap.channel),metalnessMapUv:pe&&_(b.metalnessMap.channel),roughnessMapUv:Ge&&_(b.roughnessMap.channel),anisotropyMapUv:Y&&_(b.anisotropyMap.channel),clearcoatMapUv:Pe&&_(b.clearcoatMap.channel),clearcoatNormalMapUv:de&&_(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ae&&_(b.clearcoatRoughnessMap.channel),iridescenceMapUv:Re&&_(b.iridescenceMap.channel),iridescenceThicknessMapUv:le&&_(b.iridescenceThicknessMap.channel),sheenColorMapUv:ve&&_(b.sheenColorMap.channel),sheenRoughnessMapUv:Be&&_(b.sheenRoughnessMap.channel),specularMapUv:Le&&_(b.specularMap.channel),specularColorMapUv:xe&&_(b.specularColorMap.channel),specularIntensityMapUv:qe&&_(b.specularIntensityMap.channel),transmissionMapUv:D&&_(b.transmissionMap.channel),thicknessMapUv:ue&&_(b.thicknessMap.channel),alphaMapUv:Ee&&_(b.alphaMap.channel),vertexTangents:!!X.attributes.tangent&&(J||He),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,pointsUvs:k.isPoints===!0&&!!X.attributes.uv&&(Je||Ee),fog:!!G,useFog:b.fog===!0,fogExp2:!!G&&G.isFogExp2,flatShading:b.flatShading===!0&&b.wireframe===!1,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:Me,skinning:k.isSkinnedMesh===!0,morphTargets:X.morphAttributes.position!==void 0,morphNormals:X.morphAttributes.normal!==void 0,morphColors:X.morphAttributes.color!==void 0,morphTargetsCount:ge,morphTextureStride:De,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:b.dithering,shadowMapEnabled:i.shadowMap.enabled&&L.length>0,shadowMapType:i.shadowMap.type,toneMapping:We,decodeVideoTexture:Je&&b.map.isVideoTexture===!0&&nt.getTransfer(b.map.colorSpace)===at,decodeVideoTextureEmissive:ae&&b.emissiveMap.isVideoTexture===!0&&nt.getTransfer(b.emissiveMap.colorSpace)===at,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===xn,flipSided:b.side===Wt,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:Ce&&b.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ce&&b.extensions.multiDraw===!0||be)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return dt.vertexUv1s=c.has(1),dt.vertexUv2s=c.has(2),dt.vertexUv3s=c.has(3),c.clear(),dt}function p(b){let S=[];if(b.shaderID?S.push(b.shaderID):(S.push(b.customVertexShaderID),S.push(b.customFragmentShaderID)),b.defines!==void 0)for(let L in b.defines)S.push(L),S.push(b.defines[L]);return b.isRawShaderMaterial===!1&&(M(S,b),v(S,b),S.push(i.outputColorSpace)),S.push(b.customProgramCacheKey),S.join()}function M(b,S){b.push(S.precision),b.push(S.outputColorSpace),b.push(S.envMapMode),b.push(S.envMapCubeUVHeight),b.push(S.mapUv),b.push(S.alphaMapUv),b.push(S.lightMapUv),b.push(S.aoMapUv),b.push(S.bumpMapUv),b.push(S.normalMapUv),b.push(S.displacementMapUv),b.push(S.emissiveMapUv),b.push(S.metalnessMapUv),b.push(S.roughnessMapUv),b.push(S.anisotropyMapUv),b.push(S.clearcoatMapUv),b.push(S.clearcoatNormalMapUv),b.push(S.clearcoatRoughnessMapUv),b.push(S.iridescenceMapUv),b.push(S.iridescenceThicknessMapUv),b.push(S.sheenColorMapUv),b.push(S.sheenRoughnessMapUv),b.push(S.specularMapUv),b.push(S.specularColorMapUv),b.push(S.specularIntensityMapUv),b.push(S.transmissionMapUv),b.push(S.thicknessMapUv),b.push(S.combine),b.push(S.fogExp2),b.push(S.sizeAttenuation),b.push(S.morphTargetsCount),b.push(S.morphAttributeCount),b.push(S.numDirLights),b.push(S.numPointLights),b.push(S.numSpotLights),b.push(S.numSpotLightMaps),b.push(S.numHemiLights),b.push(S.numRectAreaLights),b.push(S.numDirLightShadows),b.push(S.numPointLightShadows),b.push(S.numSpotLightShadows),b.push(S.numSpotLightShadowsWithMaps),b.push(S.numLightProbes),b.push(S.shadowMapType),b.push(S.toneMapping),b.push(S.numClippingPlanes),b.push(S.numClipIntersection),b.push(S.depthPacking)}function v(b,S){a.disableAll(),S.supportsVertexTextures&&a.enable(0),S.instancing&&a.enable(1),S.instancingColor&&a.enable(2),S.instancingMorph&&a.enable(3),S.matcap&&a.enable(4),S.envMap&&a.enable(5),S.normalMapObjectSpace&&a.enable(6),S.normalMapTangentSpace&&a.enable(7),S.clearcoat&&a.enable(8),S.iridescence&&a.enable(9),S.alphaTest&&a.enable(10),S.vertexColors&&a.enable(11),S.vertexAlphas&&a.enable(12),S.vertexUv1s&&a.enable(13),S.vertexUv2s&&a.enable(14),S.vertexUv3s&&a.enable(15),S.vertexTangents&&a.enable(16),S.anisotropy&&a.enable(17),S.alphaHash&&a.enable(18),S.batching&&a.enable(19),S.dispersion&&a.enable(20),S.batchingColor&&a.enable(21),S.gradientMap&&a.enable(22),b.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reversedDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.decodeVideoTextureEmissive&&a.enable(20),S.alphaToCoverage&&a.enable(21),b.push(a.mask)}function x(b){let S=g[b.type],L;if(S){let O=Xn[S];L=pd.clone(O.uniforms)}else L=b.uniforms;return L}function A(b,S){let L;for(let O=0,k=h.length;O<k;O++){let G=h[O];if(G.cacheKey===S){L=G,++L.usedTimes;break}}return L===void 0&&(L=new J_(i,S,b,r),h.push(L)),L}function T(b){if(--b.usedTimes===0){let S=h.indexOf(b);h[S]=h[h.length-1],h.pop(),b.destroy()}}function C(b){l.remove(b)}function P(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:x,acquireProgram:A,releaseProgram:T,releaseShaderCache:C,programs:h,dispose:P}}function Q_(){let i=new WeakMap;function e(o){return i.has(o)}function t(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function ex(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function kd(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Hd(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function o(u,f,d,g,_,m){let p=i[e];return p===void 0?(p={id:u.id,object:u,geometry:f,material:d,groupOrder:g,renderOrder:u.renderOrder,z:_,group:m},i[e]=p):(p.id=u.id,p.object=u,p.geometry=f,p.material=d,p.groupOrder=g,p.renderOrder=u.renderOrder,p.z=_,p.group=m),e++,p}function a(u,f,d,g,_,m){let p=o(u,f,d,g,_,m);d.transmission>0?n.push(p):d.transparent===!0?s.push(p):t.push(p)}function l(u,f,d,g,_,m){let p=o(u,f,d,g,_,m);d.transmission>0?n.unshift(p):d.transparent===!0?s.unshift(p):t.unshift(p)}function c(u,f){t.length>1&&t.sort(u||ex),n.length>1&&n.sort(f||kd),s.length>1&&s.sort(f||kd)}function h(){for(let u=e,f=i.length;u<f;u++){let d=i[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function tx(){let i=new WeakMap;function e(n,s){let r=i.get(n),o;return r===void 0?(o=new Hd,i.set(n,[o])):s>=r.length?(o=new Hd,r.push(o)):o=r[s],o}function t(){i=new WeakMap}return{get:e,dispose:t}}function nx(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new R,color:new $e};break;case"SpotLight":t={position:new R,direction:new R,color:new $e,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new R,color:new $e,distance:0,decay:0};break;case"HemisphereLight":t={direction:new R,skyColor:new $e,groundColor:new $e};break;case"RectAreaLight":t={color:new $e,position:new R,halfWidth:new R,halfHeight:new R};break}return i[e.id]=t,t}}}function ix(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ee};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ee};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ee,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var sx=0;function rx(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function ox(i){let e=new nx,t=ix(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new R);let s=new R,r=new st,o=new st;function a(c){let h=0,u=0,f=0;for(let b=0;b<9;b++)n.probe[b].set(0,0,0);let d=0,g=0,_=0,m=0,p=0,M=0,v=0,x=0,A=0,T=0,C=0;c.sort(rx);for(let b=0,S=c.length;b<S;b++){let L=c[b],O=L.color,k=L.intensity,G=L.distance,X=L.shadow&&L.shadow.map?L.shadow.map.texture:null;if(L.isAmbientLight)h+=O.r*k,u+=O.g*k,f+=O.b*k;else if(L.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(L.sh.coefficients[W],k);C++}else if(L.isDirectionalLight){let W=e.get(L);if(W.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let se=L.shadow,U=t.get(L);U.shadowIntensity=se.intensity,U.shadowBias=se.bias,U.shadowNormalBias=se.normalBias,U.shadowRadius=se.radius,U.shadowMapSize=se.mapSize,n.directionalShadow[d]=U,n.directionalShadowMap[d]=X,n.directionalShadowMatrix[d]=L.shadow.matrix,M++}n.directional[d]=W,d++}else if(L.isSpotLight){let W=e.get(L);W.position.setFromMatrixPosition(L.matrixWorld),W.color.copy(O).multiplyScalar(k),W.distance=G,W.coneCos=Math.cos(L.angle),W.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),W.decay=L.decay,n.spot[_]=W;let se=L.shadow;if(L.map&&(n.spotLightMap[A]=L.map,A++,se.updateMatrices(L),L.castShadow&&T++),n.spotLightMatrix[_]=se.matrix,L.castShadow){let U=t.get(L);U.shadowIntensity=se.intensity,U.shadowBias=se.bias,U.shadowNormalBias=se.normalBias,U.shadowRadius=se.radius,U.shadowMapSize=se.mapSize,n.spotShadow[_]=U,n.spotShadowMap[_]=X,x++}_++}else if(L.isRectAreaLight){let W=e.get(L);W.color.copy(O).multiplyScalar(k),W.halfWidth.set(L.width*.5,0,0),W.halfHeight.set(0,L.height*.5,0),n.rectArea[m]=W,m++}else if(L.isPointLight){let W=e.get(L);if(W.color.copy(L.color).multiplyScalar(L.intensity),W.distance=L.distance,W.decay=L.decay,L.castShadow){let se=L.shadow,U=t.get(L);U.shadowIntensity=se.intensity,U.shadowBias=se.bias,U.shadowNormalBias=se.normalBias,U.shadowRadius=se.radius,U.shadowMapSize=se.mapSize,U.shadowCameraNear=se.camera.near,U.shadowCameraFar=se.camera.far,n.pointShadow[g]=U,n.pointShadowMap[g]=X,n.pointShadowMatrix[g]=L.shadow.matrix,v++}n.point[g]=W,g++}else if(L.isHemisphereLight){let W=e.get(L);W.skyColor.copy(L.color).multiplyScalar(k),W.groundColor.copy(L.groundColor).multiplyScalar(k),n.hemi[p]=W,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=_e.LTC_FLOAT_1,n.rectAreaLTC2=_e.LTC_FLOAT_2):(n.rectAreaLTC1=_e.LTC_HALF_1,n.rectAreaLTC2=_e.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=f;let P=n.hash;(P.directionalLength!==d||P.pointLength!==g||P.spotLength!==_||P.rectAreaLength!==m||P.hemiLength!==p||P.numDirectionalShadows!==M||P.numPointShadows!==v||P.numSpotShadows!==x||P.numSpotMaps!==A||P.numLightProbes!==C)&&(n.directional.length=d,n.spot.length=_,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.pointShadow.length=v,n.pointShadowMap.length=v,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=M,n.pointShadowMatrix.length=v,n.spotLightMatrix.length=x+A-T,n.spotLightMap.length=A,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=C,P.directionalLength=d,P.pointLength=g,P.spotLength=_,P.rectAreaLength=m,P.hemiLength=p,P.numDirectionalShadows=M,P.numPointShadows=v,P.numSpotShadows=x,P.numSpotMaps=A,P.numLightProbes=C,n.version=sx++)}function l(c,h){let u=0,f=0,d=0,g=0,_=0,m=h.matrixWorldInverse;for(let p=0,M=c.length;p<M;p++){let v=c[p];if(v.isDirectionalLight){let x=n.directional[u];x.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(m),u++}else if(v.isSpotLight){let x=n.spot[d];x.position.setFromMatrixPosition(v.matrixWorld),x.position.applyMatrix4(m),x.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(m),d++}else if(v.isRectAreaLight){let x=n.rectArea[g];x.position.setFromMatrixPosition(v.matrixWorld),x.position.applyMatrix4(m),o.identity(),r.copy(v.matrixWorld),r.premultiply(m),o.extractRotation(r),x.halfWidth.set(v.width*.5,0,0),x.halfHeight.set(0,v.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),g++}else if(v.isPointLight){let x=n.point[f];x.position.setFromMatrixPosition(v.matrixWorld),x.position.applyMatrix4(m),f++}else if(v.isHemisphereLight){let x=n.hemi[_];x.direction.setFromMatrixPosition(v.matrixWorld),x.direction.transformDirection(m),_++}}}return{setup:a,setupView:l,state:n}}function Vd(i){let e=new ox(i),t=[],n=[];function s(h){c.camera=h,t.length=0,n.length=0}function r(h){t.push(h)}function o(h){n.push(h)}function a(){e.setup(t)}function l(h){e.setupView(t,h)}let c={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function ax(i){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new Vd(i),e.set(s,[a])):r>=o.length?(a=new Vd(i),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var lx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,cx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function hx(i,e,t){let n=new Ns,s=new ee,r=new ee,o=new ot,a=new pa({depthPacking:nd}),l=new ma,c={},h=t.maxTextureSize,u={[ei]:Wt,[Wt]:ei,[xn]:xn},f=new Cn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ee},radius:{value:4}},vertexShader:lx,fragmentShader:cx}),d=f.clone();d.defines.HORIZONTAL_PASS=1;let g=new yt;g.setAttribute("position",new $t(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new Mt(g,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Lc;let p=this.type;this.render=function(T,C,P){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||T.length===0)return;let b=i.getRenderTarget(),S=i.getActiveCubeFace(),L=i.getActiveMipmapLevel(),O=i.state;O.setBlending(si),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);let k=p!==Gn&&this.type===Gn,G=p===Gn&&this.type!==Gn;for(let X=0,W=T.length;X<W;X++){let se=T[X],U=se.shadow;if(U===void 0){console.warn("THREE.WebGLShadowMap:",se,"has no shadow.");continue}if(U.autoUpdate===!1&&U.needsUpdate===!1)continue;s.copy(U.mapSize);let te=U.getFrameExtents();if(s.multiply(te),r.copy(U.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/te.x),s.x=r.x*te.x,U.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/te.y),s.y=r.y*te.y,U.mapSize.y=r.y)),U.map===null||k===!0||G===!0){let ge=this.type!==Gn?{minFilter:Zt,magFilter:Zt}:{};U.map!==null&&U.map.dispose(),U.map=new Bn(s.x,s.y,ge),U.map.texture.name=se.name+".shadowMap",U.camera.updateProjectionMatrix()}i.setRenderTarget(U.map),i.clear();let oe=U.getViewportCount();for(let ge=0;ge<oe;ge++){let De=U.getViewport(ge);o.set(r.x*De.x,r.y*De.y,r.x*De.z,r.y*De.w),O.viewport(o),U.updateMatrices(se,ge),n=U.getFrustum(),x(C,P,U.camera,se,this.type)}U.isPointLightShadow!==!0&&this.type===Gn&&M(U,P),U.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(b,S,L)};function M(T,C){let P=e.update(_);f.defines.VSM_SAMPLES!==T.blurSamples&&(f.defines.VSM_SAMPLES=T.blurSamples,d.defines.VSM_SAMPLES=T.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new Bn(s.x,s.y)),f.uniforms.shadow_pass.value=T.map.texture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,i.setRenderTarget(T.mapPass),i.clear(),i.renderBufferDirect(C,null,P,f,_,null),d.uniforms.shadow_pass.value=T.mapPass.texture,d.uniforms.resolution.value=T.mapSize,d.uniforms.radius.value=T.radius,i.setRenderTarget(T.map),i.clear(),i.renderBufferDirect(C,null,P,d,_,null)}function v(T,C,P,b){let S=null,L=P.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(L!==void 0)S=L;else if(S=P.isPointLight===!0?l:a,i.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let O=S.uuid,k=C.uuid,G=c[O];G===void 0&&(G={},c[O]=G);let X=G[k];X===void 0&&(X=S.clone(),G[k]=X,C.addEventListener("dispose",A)),S=X}if(S.visible=C.visible,S.wireframe=C.wireframe,b===Gn?S.side=C.shadowSide!==null?C.shadowSide:C.side:S.side=C.shadowSide!==null?C.shadowSide:u[C.side],S.alphaMap=C.alphaMap,S.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,S.map=C.map,S.clipShadows=C.clipShadows,S.clippingPlanes=C.clippingPlanes,S.clipIntersection=C.clipIntersection,S.displacementMap=C.displacementMap,S.displacementScale=C.displacementScale,S.displacementBias=C.displacementBias,S.wireframeLinewidth=C.wireframeLinewidth,S.linewidth=C.linewidth,P.isPointLight===!0&&S.isMeshDistanceMaterial===!0){let O=i.properties.get(S);O.light=P}return S}function x(T,C,P,b,S){if(T.visible===!1)return;if(T.layers.test(C.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&S===Gn)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,T.matrixWorld);let k=e.update(T),G=T.material;if(Array.isArray(G)){let X=k.groups;for(let W=0,se=X.length;W<se;W++){let U=X[W],te=G[U.materialIndex];if(te&&te.visible){let oe=v(T,te,b,S);T.onBeforeShadow(i,T,C,P,k,oe,U),i.renderBufferDirect(P,null,k,oe,T,U),T.onAfterShadow(i,T,C,P,k,oe,U)}}}else if(G.visible){let X=v(T,G,b,S);T.onBeforeShadow(i,T,C,P,k,X,null),i.renderBufferDirect(P,null,k,X,T,null),T.onAfterShadow(i,T,C,P,k,X,null)}}let O=T.children;for(let k=0,G=O.length;k<G;k++)x(O[k],C,P,b,S)}function A(T){T.target.removeEventListener("dispose",A);for(let P in c){let b=c[P],S=T.target.uuid;S in b&&(b[S].dispose(),delete b[S])}}}var ux={[Ra]:Ca,[Pa]:Da,[Ia]:Ua,[Hi]:La,[Ca]:Ra,[Da]:Pa,[Ua]:Ia,[La]:Hi};function dx(i,e){function t(){let D=!1,ue=new ot,me=null,Ee=new ot(0,0,0,0);return{setMask:function(ce){me!==ce&&!D&&(i.colorMask(ce,ce,ce,ce),me=ce)},setLocked:function(ce){D=ce},setClear:function(ce,Q,Ce,We,dt){dt===!0&&(ce*=We,Q*=We,Ce*=We),ue.set(ce,Q,Ce,We),Ee.equals(ue)===!1&&(i.clearColor(ce,Q,Ce,We),Ee.copy(ue))},reset:function(){D=!1,me=null,Ee.set(-1,0,0,0)}}}function n(){let D=!1,ue=!1,me=null,Ee=null,ce=null;return{setReversed:function(Q){if(ue!==Q){let Ce=e.get("EXT_clip_control");Q?Ce.clipControlEXT(Ce.LOWER_LEFT_EXT,Ce.ZERO_TO_ONE_EXT):Ce.clipControlEXT(Ce.LOWER_LEFT_EXT,Ce.NEGATIVE_ONE_TO_ONE_EXT),ue=Q;let We=ce;ce=null,this.setClear(We)}},getReversed:function(){return ue},setTest:function(Q){Q?ne(i.DEPTH_TEST):Me(i.DEPTH_TEST)},setMask:function(Q){me!==Q&&!D&&(i.depthMask(Q),me=Q)},setFunc:function(Q){if(ue&&(Q=ux[Q]),Ee!==Q){switch(Q){case Ra:i.depthFunc(i.NEVER);break;case Ca:i.depthFunc(i.ALWAYS);break;case Pa:i.depthFunc(i.LESS);break;case Hi:i.depthFunc(i.LEQUAL);break;case Ia:i.depthFunc(i.EQUAL);break;case La:i.depthFunc(i.GEQUAL);break;case Da:i.depthFunc(i.GREATER);break;case Ua:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Ee=Q}},setLocked:function(Q){D=Q},setClear:function(Q){ce!==Q&&(ue&&(Q=1-Q),i.clearDepth(Q),ce=Q)},reset:function(){D=!1,me=null,Ee=null,ce=null,ue=!1}}}function s(){let D=!1,ue=null,me=null,Ee=null,ce=null,Q=null,Ce=null,We=null,dt=null;return{setTest:function(rt){D||(rt?ne(i.STENCIL_TEST):Me(i.STENCIL_TEST))},setMask:function(rt){ue!==rt&&!D&&(i.stencilMask(rt),ue=rt)},setFunc:function(rt,Yn,Nn){(me!==rt||Ee!==Yn||ce!==Nn)&&(i.stencilFunc(rt,Yn,Nn),me=rt,Ee=Yn,ce=Nn)},setOp:function(rt,Yn,Nn){(Q!==rt||Ce!==Yn||We!==Nn)&&(i.stencilOp(rt,Yn,Nn),Q=rt,Ce=Yn,We=Nn)},setLocked:function(rt){D=rt},setClear:function(rt){dt!==rt&&(i.clearStencil(rt),dt=rt)},reset:function(){D=!1,ue=null,me=null,Ee=null,ce=null,Q=null,Ce=null,We=null,dt=null}}}let r=new t,o=new n,a=new s,l=new WeakMap,c=new WeakMap,h={},u={},f=new WeakMap,d=[],g=null,_=!1,m=null,p=null,M=null,v=null,x=null,A=null,T=null,C=new $e(0,0,0),P=0,b=!1,S=null,L=null,O=null,k=null,G=null,X=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),W=!1,se=0,U=i.getParameter(i.VERSION);U.indexOf("WebGL")!==-1?(se=parseFloat(/^WebGL (\d)/.exec(U)[1]),W=se>=1):U.indexOf("OpenGL ES")!==-1&&(se=parseFloat(/^OpenGL ES (\d)/.exec(U)[1]),W=se>=2);let te=null,oe={},ge=i.getParameter(i.SCISSOR_BOX),De=i.getParameter(i.VIEWPORT),ke=new ot().fromArray(ge),Ve=new ot().fromArray(De);function Ke(D,ue,me,Ee){let ce=new Uint8Array(4),Q=i.createTexture();i.bindTexture(D,Q),i.texParameteri(D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(D,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ce=0;Ce<me;Ce++)D===i.TEXTURE_3D||D===i.TEXTURE_2D_ARRAY?i.texImage3D(ue,0,i.RGBA,1,1,Ee,0,i.RGBA,i.UNSIGNED_BYTE,ce):i.texImage2D(ue+Ce,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ce);return Q}let Z={};Z[i.TEXTURE_2D]=Ke(i.TEXTURE_2D,i.TEXTURE_2D,1),Z[i.TEXTURE_CUBE_MAP]=Ke(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Z[i.TEXTURE_2D_ARRAY]=Ke(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Z[i.TEXTURE_3D]=Ke(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ne(i.DEPTH_TEST),o.setFunc(Hi),K(!1),J(Ic),ne(i.CULL_FACE),re(si);function ne(D){h[D]!==!0&&(i.enable(D),h[D]=!0)}function Me(D){h[D]!==!1&&(i.disable(D),h[D]=!1)}function we(D,ue){return u[D]!==ue?(i.bindFramebuffer(D,ue),u[D]=ue,D===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ue),D===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ue),!0):!1}function be(D,ue){let me=d,Ee=!1;if(D){me=f.get(ue),me===void 0&&(me=[],f.set(ue,me));let ce=D.textures;if(me.length!==ce.length||me[0]!==i.COLOR_ATTACHMENT0){for(let Q=0,Ce=ce.length;Q<Ce;Q++)me[Q]=i.COLOR_ATTACHMENT0+Q;me.length=ce.length,Ee=!0}}else me[0]!==i.BACK&&(me[0]=i.BACK,Ee=!0);Ee&&i.drawBuffers(me)}function Je(D){return g!==D?(i.useProgram(D),g=D,!0):!1}let ut={[yi]:i.FUNC_ADD,[Cu]:i.FUNC_SUBTRACT,[Pu]:i.FUNC_REVERSE_SUBTRACT};ut[Iu]=i.MIN,ut[Lu]=i.MAX;let I={[Du]:i.ZERO,[Uu]:i.ONE,[Nu]:i.SRC_COLOR,[Ko]:i.SRC_ALPHA,[Hu]:i.SRC_ALPHA_SATURATE,[zu]:i.DST_COLOR,[Ou]:i.DST_ALPHA,[Fu]:i.ONE_MINUS_SRC_COLOR,[jo]:i.ONE_MINUS_SRC_ALPHA,[ku]:i.ONE_MINUS_DST_COLOR,[Bu]:i.ONE_MINUS_DST_ALPHA,[Vu]:i.CONSTANT_COLOR,[Gu]:i.ONE_MINUS_CONSTANT_COLOR,[Wu]:i.CONSTANT_ALPHA,[Xu]:i.ONE_MINUS_CONSTANT_ALPHA};function re(D,ue,me,Ee,ce,Q,Ce,We,dt,rt){if(D===si){_===!0&&(Me(i.BLEND),_=!1);return}if(_===!1&&(ne(i.BLEND),_=!0),D!==Ru){if(D!==m||rt!==b){if((p!==yi||x!==yi)&&(i.blendEquation(i.FUNC_ADD),p=yi,x=yi),rt)switch(D){case ki:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Dc:i.blendFunc(i.ONE,i.ONE);break;case Uc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Nc:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case ki:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Dc:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Uc:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Nc:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}M=null,v=null,A=null,T=null,C.set(0,0,0),P=0,m=D,b=rt}return}ce=ce||ue,Q=Q||me,Ce=Ce||Ee,(ue!==p||ce!==x)&&(i.blendEquationSeparate(ut[ue],ut[ce]),p=ue,x=ce),(me!==M||Ee!==v||Q!==A||Ce!==T)&&(i.blendFuncSeparate(I[me],I[Ee],I[Q],I[Ce]),M=me,v=Ee,A=Q,T=Ce),(We.equals(C)===!1||dt!==P)&&(i.blendColor(We.r,We.g,We.b,dt),C.copy(We),P=dt),m=D,b=!1}function j(D,ue){D.side===xn?Me(i.CULL_FACE):ne(i.CULL_FACE);let me=D.side===Wt;ue&&(me=!me),K(me),D.blending===ki&&D.transparent===!1?re(si):re(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),o.setFunc(D.depthFunc),o.setTest(D.depthTest),o.setMask(D.depthWrite),r.setMask(D.colorWrite);let Ee=D.stencilWrite;a.setTest(Ee),Ee&&(a.setMask(D.stencilWriteMask),a.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),a.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),ae(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?ne(i.SAMPLE_ALPHA_TO_COVERAGE):Me(i.SAMPLE_ALPHA_TO_COVERAGE)}function K(D){S!==D&&(D?i.frontFace(i.CW):i.frontFace(i.CCW),S=D)}function J(D){D!==wu?(ne(i.CULL_FACE),D!==L&&(D===Ic?i.cullFace(i.BACK):D===Au?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Me(i.CULL_FACE),L=D}function fe(D){D!==O&&(W&&i.lineWidth(D),O=D)}function ae(D,ue,me){D?(ne(i.POLYGON_OFFSET_FILL),(k!==ue||G!==me)&&(i.polygonOffset(ue,me),k=ue,G=me)):Me(i.POLYGON_OFFSET_FILL)}function pe(D){D?ne(i.SCISSOR_TEST):Me(i.SCISSOR_TEST)}function Ge(D){D===void 0&&(D=i.TEXTURE0+X-1),te!==D&&(i.activeTexture(D),te=D)}function He(D,ue,me){me===void 0&&(te===null?me=i.TEXTURE0+X-1:me=te);let Ee=oe[me];Ee===void 0&&(Ee={type:void 0,texture:void 0},oe[me]=Ee),(Ee.type!==D||Ee.texture!==ue)&&(te!==me&&(i.activeTexture(me),te=me),i.bindTexture(D,ue||Z[D]),Ee.type=D,Ee.texture=ue)}function w(){let D=oe[te];D!==void 0&&D.type!==void 0&&(i.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function y(){try{i.compressedTexImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function B(){try{i.compressedTexImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function q(){try{i.texSubImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ie(){try{i.texSubImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Y(){try{i.compressedTexSubImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Pe(){try{i.compressedTexSubImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function de(){try{i.texStorage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ae(){try{i.texStorage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Re(){try{i.texImage2D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function le(){try{i.texImage3D(...arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ve(D){ke.equals(D)===!1&&(i.scissor(D.x,D.y,D.z,D.w),ke.copy(D))}function Be(D){Ve.equals(D)===!1&&(i.viewport(D.x,D.y,D.z,D.w),Ve.copy(D))}function Le(D,ue){let me=c.get(ue);me===void 0&&(me=new WeakMap,c.set(ue,me));let Ee=me.get(D);Ee===void 0&&(Ee=i.getUniformBlockIndex(ue,D.name),me.set(D,Ee))}function xe(D,ue){let Ee=c.get(ue).get(D);l.get(ue)!==Ee&&(i.uniformBlockBinding(ue,Ee,D.__bindingPointIndex),l.set(ue,Ee))}function qe(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},te=null,oe={},u={},f=new WeakMap,d=[],g=null,_=!1,m=null,p=null,M=null,v=null,x=null,A=null,T=null,C=new $e(0,0,0),P=0,b=!1,S=null,L=null,O=null,k=null,G=null,ke.set(0,0,i.canvas.width,i.canvas.height),Ve.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:ne,disable:Me,bindFramebuffer:we,drawBuffers:be,useProgram:Je,setBlending:re,setMaterial:j,setFlipSided:K,setCullFace:J,setLineWidth:fe,setPolygonOffset:ae,setScissorTest:pe,activeTexture:Ge,bindTexture:He,unbindTexture:w,compressedTexImage2D:y,compressedTexImage3D:B,texImage2D:Re,texImage3D:le,updateUBOMapping:Le,uniformBlockBinding:xe,texStorage2D:de,texStorage3D:Ae,texSubImage2D:q,texSubImage3D:ie,compressedTexSubImage2D:Y,compressedTexSubImage3D:Pe,scissor:ve,viewport:Be,reset:qe}}function fx(i,e,t,n,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ee,h=new WeakMap,u,f=new WeakMap,d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(w,y){return d?new OffscreenCanvas(w,y):Cs("canvas")}function _(w,y,B){let q=1,ie=He(w);if((ie.width>B||ie.height>B)&&(q=B/Math.max(ie.width,ie.height)),q<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){let Y=Math.floor(q*ie.width),Pe=Math.floor(q*ie.height);u===void 0&&(u=g(Y,Pe));let de=y?g(Y,Pe):u;return de.width=Y,de.height=Pe,de.getContext("2d").drawImage(w,0,0,Y,Pe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ie.width+"x"+ie.height+") to ("+Y+"x"+Pe+")."),de}else return"data"in w&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ie.width+"x"+ie.height+")."),w;return w}function m(w){return w.generateMipmaps}function p(w){i.generateMipmap(w)}function M(w){return w.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:w.isWebGL3DRenderTarget?i.TEXTURE_3D:w.isWebGLArrayRenderTarget||w.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function v(w,y,B,q,ie=!1){if(w!==null){if(i[w]!==void 0)return i[w];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let Y=y;if(y===i.RED&&(B===i.FLOAT&&(Y=i.R32F),B===i.HALF_FLOAT&&(Y=i.R16F),B===i.UNSIGNED_BYTE&&(Y=i.R8)),y===i.RED_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.R8UI),B===i.UNSIGNED_SHORT&&(Y=i.R16UI),B===i.UNSIGNED_INT&&(Y=i.R32UI),B===i.BYTE&&(Y=i.R8I),B===i.SHORT&&(Y=i.R16I),B===i.INT&&(Y=i.R32I)),y===i.RG&&(B===i.FLOAT&&(Y=i.RG32F),B===i.HALF_FLOAT&&(Y=i.RG16F),B===i.UNSIGNED_BYTE&&(Y=i.RG8)),y===i.RG_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RG8UI),B===i.UNSIGNED_SHORT&&(Y=i.RG16UI),B===i.UNSIGNED_INT&&(Y=i.RG32UI),B===i.BYTE&&(Y=i.RG8I),B===i.SHORT&&(Y=i.RG16I),B===i.INT&&(Y=i.RG32I)),y===i.RGB_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),B===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),B===i.UNSIGNED_INT&&(Y=i.RGB32UI),B===i.BYTE&&(Y=i.RGB8I),B===i.SHORT&&(Y=i.RGB16I),B===i.INT&&(Y=i.RGB32I)),y===i.RGBA_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),B===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),B===i.UNSIGNED_INT&&(Y=i.RGBA32UI),B===i.BYTE&&(Y=i.RGBA8I),B===i.SHORT&&(Y=i.RGBA16I),B===i.INT&&(Y=i.RGBA32I)),y===i.RGB&&(B===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),B===i.UNSIGNED_INT_10F_11F_11F_REV&&(Y=i.R11F_G11F_B10F)),y===i.RGBA){let Pe=ie?Rr:nt.getTransfer(q);B===i.FLOAT&&(Y=i.RGBA32F),B===i.HALF_FLOAT&&(Y=i.RGBA16F),B===i.UNSIGNED_BYTE&&(Y=Pe===at?i.SRGB8_ALPHA8:i.RGBA8),B===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),B===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&e.get("EXT_color_buffer_float"),Y}function x(w,y){let B;return w?y===null||y===Ci||y===qs?B=i.DEPTH24_STENCIL8:y===Ln?B=i.DEPTH32F_STENCIL8:y===Ws&&(B=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Ci||y===qs?B=i.DEPTH_COMPONENT24:y===Ln?B=i.DEPTH_COMPONENT32F:y===Ws&&(B=i.DEPTH_COMPONENT16),B}function A(w,y){return m(w)===!0||w.isFramebufferTexture&&w.minFilter!==Zt&&w.minFilter!==An?Math.log2(Math.max(y.width,y.height))+1:w.mipmaps!==void 0&&w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?y.mipmaps.length:1}function T(w){let y=w.target;y.removeEventListener("dispose",T),P(y),y.isVideoTexture&&h.delete(y)}function C(w){let y=w.target;y.removeEventListener("dispose",C),S(y)}function P(w){let y=n.get(w);if(y.__webglInit===void 0)return;let B=w.source,q=f.get(B);if(q){let ie=q[y.__cacheKey];ie.usedTimes--,ie.usedTimes===0&&b(w),Object.keys(q).length===0&&f.delete(B)}n.remove(w)}function b(w){let y=n.get(w);i.deleteTexture(y.__webglTexture);let B=w.source,q=f.get(B);delete q[y.__cacheKey],o.memory.textures--}function S(w){let y=n.get(w);if(w.depthTexture&&(w.depthTexture.dispose(),n.remove(w.depthTexture)),w.isWebGLCubeRenderTarget)for(let q=0;q<6;q++){if(Array.isArray(y.__webglFramebuffer[q]))for(let ie=0;ie<y.__webglFramebuffer[q].length;ie++)i.deleteFramebuffer(y.__webglFramebuffer[q][ie]);else i.deleteFramebuffer(y.__webglFramebuffer[q]);y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer[q])}else{if(Array.isArray(y.__webglFramebuffer))for(let q=0;q<y.__webglFramebuffer.length;q++)i.deleteFramebuffer(y.__webglFramebuffer[q]);else i.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&i.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let q=0;q<y.__webglColorRenderbuffer.length;q++)y.__webglColorRenderbuffer[q]&&i.deleteRenderbuffer(y.__webglColorRenderbuffer[q]);y.__webglDepthRenderbuffer&&i.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let B=w.textures;for(let q=0,ie=B.length;q<ie;q++){let Y=n.get(B[q]);Y.__webglTexture&&(i.deleteTexture(Y.__webglTexture),o.memory.textures--),n.remove(B[q])}n.remove(w)}let L=0;function O(){L=0}function k(){let w=L;return w>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+w+" texture units while this GPU supports only "+s.maxTextures),L+=1,w}function G(w){let y=[];return y.push(w.wrapS),y.push(w.wrapT),y.push(w.wrapR||0),y.push(w.magFilter),y.push(w.minFilter),y.push(w.anisotropy),y.push(w.internalFormat),y.push(w.format),y.push(w.type),y.push(w.generateMipmaps),y.push(w.premultiplyAlpha),y.push(w.flipY),y.push(w.unpackAlignment),y.push(w.colorSpace),y.join()}function X(w,y){let B=n.get(w);if(w.isVideoTexture&&pe(w),w.isRenderTargetTexture===!1&&w.isExternalTexture!==!0&&w.version>0&&B.__version!==w.version){let q=w.image;if(q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Z(B,w,y);return}}else w.isExternalTexture&&(B.__webglTexture=w.sourceTexture?w.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,B.__webglTexture,i.TEXTURE0+y)}function W(w,y){let B=n.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&B.__version!==w.version){Z(B,w,y);return}t.bindTexture(i.TEXTURE_2D_ARRAY,B.__webglTexture,i.TEXTURE0+y)}function se(w,y){let B=n.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&B.__version!==w.version){Z(B,w,y);return}t.bindTexture(i.TEXTURE_3D,B.__webglTexture,i.TEXTURE0+y)}function U(w,y){let B=n.get(w);if(w.version>0&&B.__version!==w.version){ne(B,w,y);return}t.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture,i.TEXTURE0+y)}let te={[vi]:i.REPEAT,[xi]:i.CLAMP_TO_EDGE,[Qo]:i.MIRRORED_REPEAT},oe={[Zt]:i.NEAREST,[ed]:i.NEAREST_MIPMAP_NEAREST,[oo]:i.NEAREST_MIPMAP_LINEAR,[An]:i.LINEAR,[Ba]:i.LINEAR_MIPMAP_NEAREST,[Ri]:i.LINEAR_MIPMAP_LINEAR},ge={[sd]:i.NEVER,[hd]:i.ALWAYS,[rd]:i.LESS,[qc]:i.LEQUAL,[od]:i.EQUAL,[cd]:i.GEQUAL,[ad]:i.GREATER,[ld]:i.NOTEQUAL};function De(w,y){if(y.type===Ln&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===An||y.magFilter===Ba||y.magFilter===oo||y.magFilter===Ri||y.minFilter===An||y.minFilter===Ba||y.minFilter===oo||y.minFilter===Ri)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(w,i.TEXTURE_WRAP_S,te[y.wrapS]),i.texParameteri(w,i.TEXTURE_WRAP_T,te[y.wrapT]),(w===i.TEXTURE_3D||w===i.TEXTURE_2D_ARRAY)&&i.texParameteri(w,i.TEXTURE_WRAP_R,te[y.wrapR]),i.texParameteri(w,i.TEXTURE_MAG_FILTER,oe[y.magFilter]),i.texParameteri(w,i.TEXTURE_MIN_FILTER,oe[y.minFilter]),y.compareFunction&&(i.texParameteri(w,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(w,i.TEXTURE_COMPARE_FUNC,ge[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Zt||y.minFilter!==oo&&y.minFilter!==Ri||y.type===Ln&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){let B=e.get("EXT_texture_filter_anisotropic");i.texParameterf(w,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function ke(w,y){let B=!1;w.__webglInit===void 0&&(w.__webglInit=!0,y.addEventListener("dispose",T));let q=y.source,ie=f.get(q);ie===void 0&&(ie={},f.set(q,ie));let Y=G(y);if(Y!==w.__cacheKey){ie[Y]===void 0&&(ie[Y]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,B=!0),ie[Y].usedTimes++;let Pe=ie[w.__cacheKey];Pe!==void 0&&(ie[w.__cacheKey].usedTimes--,Pe.usedTimes===0&&b(y)),w.__cacheKey=Y,w.__webglTexture=ie[Y].texture}return B}function Ve(w,y,B){return Math.floor(Math.floor(w/B)/y)}function Ke(w,y,B,q){let Y=w.updateRanges;if(Y.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,y.width,y.height,B,q,y.data);else{Y.sort((le,ve)=>le.start-ve.start);let Pe=0;for(let le=1;le<Y.length;le++){let ve=Y[Pe],Be=Y[le],Le=ve.start+ve.count,xe=Ve(Be.start,y.width,4),qe=Ve(ve.start,y.width,4);Be.start<=Le+1&&xe===qe&&Ve(Be.start+Be.count-1,y.width,4)===xe?ve.count=Math.max(ve.count,Be.start+Be.count-ve.start):(++Pe,Y[Pe]=Be)}Y.length=Pe+1;let de=i.getParameter(i.UNPACK_ROW_LENGTH),Ae=i.getParameter(i.UNPACK_SKIP_PIXELS),Re=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,y.width);for(let le=0,ve=Y.length;le<ve;le++){let Be=Y[le],Le=Math.floor(Be.start/4),xe=Math.ceil(Be.count/4),qe=Le%y.width,D=Math.floor(Le/y.width),ue=xe,me=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,qe),i.pixelStorei(i.UNPACK_SKIP_ROWS,D),t.texSubImage2D(i.TEXTURE_2D,0,qe,D,ue,me,B,q,y.data)}w.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,de),i.pixelStorei(i.UNPACK_SKIP_PIXELS,Ae),i.pixelStorei(i.UNPACK_SKIP_ROWS,Re)}}function Z(w,y,B){let q=i.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(q=i.TEXTURE_2D_ARRAY),y.isData3DTexture&&(q=i.TEXTURE_3D);let ie=ke(w,y),Y=y.source;t.bindTexture(q,w.__webglTexture,i.TEXTURE0+B);let Pe=n.get(Y);if(Y.version!==Pe.__version||ie===!0){t.activeTexture(i.TEXTURE0+B);let de=nt.getPrimaries(nt.workingColorSpace),Ae=y.colorSpace===oi?null:nt.getPrimaries(y.colorSpace),Re=y.colorSpace===oi||de===Ae?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Re);let le=_(y.image,!1,s.maxTextureSize);le=Ge(y,le);let ve=r.convert(y.format,y.colorSpace),Be=r.convert(y.type),Le=v(y.internalFormat,ve,Be,y.colorSpace,y.isVideoTexture);De(q,y);let xe,qe=y.mipmaps,D=y.isVideoTexture!==!0,ue=Pe.__version===void 0||ie===!0,me=Y.dataReady,Ee=A(y,le);if(y.isDepthTexture)Le=x(y.format===Ys,y.type),ue&&(D?t.texStorage2D(i.TEXTURE_2D,1,Le,le.width,le.height):t.texImage2D(i.TEXTURE_2D,0,Le,le.width,le.height,0,ve,Be,null));else if(y.isDataTexture)if(qe.length>0){D&&ue&&t.texStorage2D(i.TEXTURE_2D,Ee,Le,qe[0].width,qe[0].height);for(let ce=0,Q=qe.length;ce<Q;ce++)xe=qe[ce],D?me&&t.texSubImage2D(i.TEXTURE_2D,ce,0,0,xe.width,xe.height,ve,Be,xe.data):t.texImage2D(i.TEXTURE_2D,ce,Le,xe.width,xe.height,0,ve,Be,xe.data);y.generateMipmaps=!1}else D?(ue&&t.texStorage2D(i.TEXTURE_2D,Ee,Le,le.width,le.height),me&&Ke(y,le,ve,Be)):t.texImage2D(i.TEXTURE_2D,0,Le,le.width,le.height,0,ve,Be,le.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){D&&ue&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Ee,Le,qe[0].width,qe[0].height,le.depth);for(let ce=0,Q=qe.length;ce<Q;ce++)if(xe=qe[ce],y.format!==yn)if(ve!==null)if(D){if(me)if(y.layerUpdates.size>0){let Ce=eh(xe.width,xe.height,y.format,y.type);for(let We of y.layerUpdates){let dt=xe.data.subarray(We*Ce/xe.data.BYTES_PER_ELEMENT,(We+1)*Ce/xe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ce,0,0,We,xe.width,xe.height,1,ve,dt)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ce,0,0,0,xe.width,xe.height,le.depth,ve,xe.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ce,Le,xe.width,xe.height,le.depth,0,xe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else D?me&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,ce,0,0,0,xe.width,xe.height,le.depth,ve,Be,xe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,ce,Le,xe.width,xe.height,le.depth,0,ve,Be,xe.data)}else{D&&ue&&t.texStorage2D(i.TEXTURE_2D,Ee,Le,qe[0].width,qe[0].height);for(let ce=0,Q=qe.length;ce<Q;ce++)xe=qe[ce],y.format!==yn?ve!==null?D?me&&t.compressedTexSubImage2D(i.TEXTURE_2D,ce,0,0,xe.width,xe.height,ve,xe.data):t.compressedTexImage2D(i.TEXTURE_2D,ce,Le,xe.width,xe.height,0,xe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):D?me&&t.texSubImage2D(i.TEXTURE_2D,ce,0,0,xe.width,xe.height,ve,Be,xe.data):t.texImage2D(i.TEXTURE_2D,ce,Le,xe.width,xe.height,0,ve,Be,xe.data)}else if(y.isDataArrayTexture)if(D){if(ue&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Ee,Le,le.width,le.height,le.depth),me)if(y.layerUpdates.size>0){let ce=eh(le.width,le.height,y.format,y.type);for(let Q of y.layerUpdates){let Ce=le.data.subarray(Q*ce/le.data.BYTES_PER_ELEMENT,(Q+1)*ce/le.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Q,le.width,le.height,1,ve,Be,Ce)}y.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,le.width,le.height,le.depth,ve,Be,le.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Le,le.width,le.height,le.depth,0,ve,Be,le.data);else if(y.isData3DTexture)D?(ue&&t.texStorage3D(i.TEXTURE_3D,Ee,Le,le.width,le.height,le.depth),me&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,le.width,le.height,le.depth,ve,Be,le.data)):t.texImage3D(i.TEXTURE_3D,0,Le,le.width,le.height,le.depth,0,ve,Be,le.data);else if(y.isFramebufferTexture){if(ue)if(D)t.texStorage2D(i.TEXTURE_2D,Ee,Le,le.width,le.height);else{let ce=le.width,Q=le.height;for(let Ce=0;Ce<Ee;Ce++)t.texImage2D(i.TEXTURE_2D,Ce,Le,ce,Q,0,ve,Be,null),ce>>=1,Q>>=1}}else if(qe.length>0){if(D&&ue){let ce=He(qe[0]);t.texStorage2D(i.TEXTURE_2D,Ee,Le,ce.width,ce.height)}for(let ce=0,Q=qe.length;ce<Q;ce++)xe=qe[ce],D?me&&t.texSubImage2D(i.TEXTURE_2D,ce,0,0,ve,Be,xe):t.texImage2D(i.TEXTURE_2D,ce,Le,ve,Be,xe);y.generateMipmaps=!1}else if(D){if(ue){let ce=He(le);t.texStorage2D(i.TEXTURE_2D,Ee,Le,ce.width,ce.height)}me&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ve,Be,le)}else t.texImage2D(i.TEXTURE_2D,0,Le,ve,Be,le);m(y)&&p(q),Pe.__version=Y.version,y.onUpdate&&y.onUpdate(y)}w.__version=y.version}function ne(w,y,B){if(y.image.length!==6)return;let q=ke(w,y),ie=y.source;t.bindTexture(i.TEXTURE_CUBE_MAP,w.__webglTexture,i.TEXTURE0+B);let Y=n.get(ie);if(ie.version!==Y.__version||q===!0){t.activeTexture(i.TEXTURE0+B);let Pe=nt.getPrimaries(nt.workingColorSpace),de=y.colorSpace===oi?null:nt.getPrimaries(y.colorSpace),Ae=y.colorSpace===oi||Pe===de?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ae);let Re=y.isCompressedTexture||y.image[0].isCompressedTexture,le=y.image[0]&&y.image[0].isDataTexture,ve=[];for(let Q=0;Q<6;Q++)!Re&&!le?ve[Q]=_(y.image[Q],!0,s.maxCubemapSize):ve[Q]=le?y.image[Q].image:y.image[Q],ve[Q]=Ge(y,ve[Q]);let Be=ve[0],Le=r.convert(y.format,y.colorSpace),xe=r.convert(y.type),qe=v(y.internalFormat,Le,xe,y.colorSpace),D=y.isVideoTexture!==!0,ue=Y.__version===void 0||q===!0,me=ie.dataReady,Ee=A(y,Be);De(i.TEXTURE_CUBE_MAP,y);let ce;if(Re){D&&ue&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Ee,qe,Be.width,Be.height);for(let Q=0;Q<6;Q++){ce=ve[Q].mipmaps;for(let Ce=0;Ce<ce.length;Ce++){let We=ce[Ce];y.format!==yn?Le!==null?D?me&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,Ce,0,0,We.width,We.height,Le,We.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,Ce,qe,We.width,We.height,0,We.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?me&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,Ce,0,0,We.width,We.height,Le,xe,We.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,Ce,qe,We.width,We.height,0,Le,xe,We.data)}}}else{if(ce=y.mipmaps,D&&ue){ce.length>0&&Ee++;let Q=He(ve[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Ee,qe,Q.width,Q.height)}for(let Q=0;Q<6;Q++)if(le){D?me&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,ve[Q].width,ve[Q].height,Le,xe,ve[Q].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,qe,ve[Q].width,ve[Q].height,0,Le,xe,ve[Q].data);for(let Ce=0;Ce<ce.length;Ce++){let dt=ce[Ce].image[Q].image;D?me&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,Ce+1,0,0,dt.width,dt.height,Le,xe,dt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,Ce+1,qe,dt.width,dt.height,0,Le,xe,dt.data)}}else{D?me&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,Le,xe,ve[Q]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,qe,Le,xe,ve[Q]);for(let Ce=0;Ce<ce.length;Ce++){let We=ce[Ce];D?me&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,Ce+1,0,0,Le,xe,We.image[Q]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,Ce+1,qe,Le,xe,We.image[Q])}}}m(y)&&p(i.TEXTURE_CUBE_MAP),Y.__version=ie.version,y.onUpdate&&y.onUpdate(y)}w.__version=y.version}function Me(w,y,B,q,ie,Y){let Pe=r.convert(B.format,B.colorSpace),de=r.convert(B.type),Ae=v(B.internalFormat,Pe,de,B.colorSpace),Re=n.get(y),le=n.get(B);if(le.__renderTarget=y,!Re.__hasExternalTextures){let ve=Math.max(1,y.width>>Y),Be=Math.max(1,y.height>>Y);ie===i.TEXTURE_3D||ie===i.TEXTURE_2D_ARRAY?t.texImage3D(ie,Y,Ae,ve,Be,y.depth,0,Pe,de,null):t.texImage2D(ie,Y,Ae,ve,Be,0,Pe,de,null)}t.bindFramebuffer(i.FRAMEBUFFER,w),ae(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,q,ie,le.__webglTexture,0,fe(y)):(ie===i.TEXTURE_2D||ie>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&ie<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,q,ie,le.__webglTexture,Y),t.bindFramebuffer(i.FRAMEBUFFER,null)}function we(w,y,B){if(i.bindRenderbuffer(i.RENDERBUFFER,w),y.depthBuffer){let q=y.depthTexture,ie=q&&q.isDepthTexture?q.type:null,Y=x(y.stencilBuffer,ie),Pe=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,de=fe(y);ae(y)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,de,Y,y.width,y.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,de,Y,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,Y,y.width,y.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Pe,i.RENDERBUFFER,w)}else{let q=y.textures;for(let ie=0;ie<q.length;ie++){let Y=q[ie],Pe=r.convert(Y.format,Y.colorSpace),de=r.convert(Y.type),Ae=v(Y.internalFormat,Pe,de,Y.colorSpace),Re=fe(y);B&&ae(y)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Re,Ae,y.width,y.height):ae(y)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Re,Ae,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,Ae,y.width,y.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function be(w,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,w),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let q=n.get(y.depthTexture);q.__renderTarget=y,(!q.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),X(y.depthTexture,0);let ie=q.__webglTexture,Y=fe(y);if(y.depthTexture.format===As)ae(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,ie,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,ie,0);else if(y.depthTexture.format===Ys)ae(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,ie,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,ie,0);else throw new Error("Unknown depthTexture format")}function Je(w){let y=n.get(w),B=w.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==w.depthTexture){let q=w.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),q){let ie=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,q.removeEventListener("dispose",ie)};q.addEventListener("dispose",ie),y.__depthDisposeCallback=ie}y.__boundDepthTexture=q}if(w.depthTexture&&!y.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");let q=w.texture.mipmaps;q&&q.length>0?be(y.__webglFramebuffer[0],w):be(y.__webglFramebuffer,w)}else if(B){y.__webglDepthbuffer=[];for(let q=0;q<6;q++)if(t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[q]),y.__webglDepthbuffer[q]===void 0)y.__webglDepthbuffer[q]=i.createRenderbuffer(),we(y.__webglDepthbuffer[q],w,!1);else{let ie=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=y.__webglDepthbuffer[q];i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,ie,i.RENDERBUFFER,Y)}}else{let q=w.texture.mipmaps;if(q&&q.length>0?t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=i.createRenderbuffer(),we(y.__webglDepthbuffer,w,!1);else{let ie=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=y.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,ie,i.RENDERBUFFER,Y)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function ut(w,y,B){let q=n.get(w);y!==void 0&&Me(q.__webglFramebuffer,w,w.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),B!==void 0&&Je(w)}function I(w){let y=w.texture,B=n.get(w),q=n.get(y);w.addEventListener("dispose",C);let ie=w.textures,Y=w.isWebGLCubeRenderTarget===!0,Pe=ie.length>1;if(Pe||(q.__webglTexture===void 0&&(q.__webglTexture=i.createTexture()),q.__version=y.version,o.memory.textures++),Y){B.__webglFramebuffer=[];for(let de=0;de<6;de++)if(y.mipmaps&&y.mipmaps.length>0){B.__webglFramebuffer[de]=[];for(let Ae=0;Ae<y.mipmaps.length;Ae++)B.__webglFramebuffer[de][Ae]=i.createFramebuffer()}else B.__webglFramebuffer[de]=i.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){B.__webglFramebuffer=[];for(let de=0;de<y.mipmaps.length;de++)B.__webglFramebuffer[de]=i.createFramebuffer()}else B.__webglFramebuffer=i.createFramebuffer();if(Pe)for(let de=0,Ae=ie.length;de<Ae;de++){let Re=n.get(ie[de]);Re.__webglTexture===void 0&&(Re.__webglTexture=i.createTexture(),o.memory.textures++)}if(w.samples>0&&ae(w)===!1){B.__webglMultisampledFramebuffer=i.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let de=0;de<ie.length;de++){let Ae=ie[de];B.__webglColorRenderbuffer[de]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,B.__webglColorRenderbuffer[de]);let Re=r.convert(Ae.format,Ae.colorSpace),le=r.convert(Ae.type),ve=v(Ae.internalFormat,Re,le,Ae.colorSpace,w.isXRRenderTarget===!0),Be=fe(w);i.renderbufferStorageMultisample(i.RENDERBUFFER,Be,ve,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+de,i.RENDERBUFFER,B.__webglColorRenderbuffer[de])}i.bindRenderbuffer(i.RENDERBUFFER,null),w.depthBuffer&&(B.__webglDepthRenderbuffer=i.createRenderbuffer(),we(B.__webglDepthRenderbuffer,w,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Y){t.bindTexture(i.TEXTURE_CUBE_MAP,q.__webglTexture),De(i.TEXTURE_CUBE_MAP,y);for(let de=0;de<6;de++)if(y.mipmaps&&y.mipmaps.length>0)for(let Ae=0;Ae<y.mipmaps.length;Ae++)Me(B.__webglFramebuffer[de][Ae],w,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+de,Ae);else Me(B.__webglFramebuffer[de],w,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+de,0);m(y)&&p(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Pe){for(let de=0,Ae=ie.length;de<Ae;de++){let Re=ie[de],le=n.get(Re),ve=i.TEXTURE_2D;(w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(ve=w.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ve,le.__webglTexture),De(ve,Re),Me(B.__webglFramebuffer,w,Re,i.COLOR_ATTACHMENT0+de,ve,0),m(Re)&&p(ve)}t.unbindTexture()}else{let de=i.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(de=w.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(de,q.__webglTexture),De(de,y),y.mipmaps&&y.mipmaps.length>0)for(let Ae=0;Ae<y.mipmaps.length;Ae++)Me(B.__webglFramebuffer[Ae],w,y,i.COLOR_ATTACHMENT0,de,Ae);else Me(B.__webglFramebuffer,w,y,i.COLOR_ATTACHMENT0,de,0);m(y)&&p(de),t.unbindTexture()}w.depthBuffer&&Je(w)}function re(w){let y=w.textures;for(let B=0,q=y.length;B<q;B++){let ie=y[B];if(m(ie)){let Y=M(w),Pe=n.get(ie).__webglTexture;t.bindTexture(Y,Pe),p(Y),t.unbindTexture()}}}let j=[],K=[];function J(w){if(w.samples>0){if(ae(w)===!1){let y=w.textures,B=w.width,q=w.height,ie=i.COLOR_BUFFER_BIT,Y=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Pe=n.get(w),de=y.length>1;if(de)for(let Re=0;Re<y.length;Re++)t.bindFramebuffer(i.FRAMEBUFFER,Pe.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Re,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Pe.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Re,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Pe.__webglMultisampledFramebuffer);let Ae=w.texture.mipmaps;Ae&&Ae.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Pe.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Pe.__webglFramebuffer);for(let Re=0;Re<y.length;Re++){if(w.resolveDepthBuffer&&(w.depthBuffer&&(ie|=i.DEPTH_BUFFER_BIT),w.stencilBuffer&&w.resolveStencilBuffer&&(ie|=i.STENCIL_BUFFER_BIT)),de){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Pe.__webglColorRenderbuffer[Re]);let le=n.get(y[Re]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,le,0)}i.blitFramebuffer(0,0,B,q,0,0,B,q,ie,i.NEAREST),l===!0&&(j.length=0,K.length=0,j.push(i.COLOR_ATTACHMENT0+Re),w.depthBuffer&&w.resolveDepthBuffer===!1&&(j.push(Y),K.push(Y),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,K)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,j))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),de)for(let Re=0;Re<y.length;Re++){t.bindFramebuffer(i.FRAMEBUFFER,Pe.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Re,i.RENDERBUFFER,Pe.__webglColorRenderbuffer[Re]);let le=n.get(y[Re]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Pe.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Re,i.TEXTURE_2D,le,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Pe.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.resolveDepthBuffer===!1&&l){let y=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[y])}}}function fe(w){return Math.min(s.maxSamples,w.samples)}function ae(w){let y=n.get(w);return w.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function pe(w){let y=o.render.frame;h.get(w)!==y&&(h.set(w,y),w.update())}function Ge(w,y){let B=w.colorSpace,q=w.format,ie=w.type;return w.isCompressedTexture===!0||w.isVideoTexture===!0||B!==Vi&&B!==oi&&(nt.getTransfer(B)===at?(q!==yn||ie!==In)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),y}function He(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(c.width=w.naturalWidth||w.width,c.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(c.width=w.displayWidth,c.height=w.displayHeight):(c.width=w.width,c.height=w.height),c}this.allocateTextureUnit=k,this.resetTextureUnits=O,this.setTexture2D=X,this.setTexture2DArray=W,this.setTexture3D=se,this.setTextureCube=U,this.rebindTextures=ut,this.setupRenderTarget=I,this.updateRenderTargetMipmap=re,this.updateMultisampleRenderTarget=J,this.setupDepthRenderbuffer=Je,this.setupFrameBufferTexture=Me,this.useMultisampledRTT=ae}function px(i,e){function t(n,s=oi){let r,o=nt.getTransfer(s);if(n===In)return i.UNSIGNED_BYTE;if(n===ka)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ha)return i.UNSIGNED_SHORT_5_5_5_1;if(n===kc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Hc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Bc)return i.BYTE;if(n===zc)return i.SHORT;if(n===Ws)return i.UNSIGNED_SHORT;if(n===za)return i.INT;if(n===Ci)return i.UNSIGNED_INT;if(n===Ln)return i.FLOAT;if(n===Xs)return i.HALF_FLOAT;if(n===Vc)return i.ALPHA;if(n===Gc)return i.RGB;if(n===yn)return i.RGBA;if(n===As)return i.DEPTH_COMPONENT;if(n===Ys)return i.DEPTH_STENCIL;if(n===Va)return i.RED;if(n===Ga)return i.RED_INTEGER;if(n===Wc)return i.RG;if(n===Wa)return i.RG_INTEGER;if(n===Xa)return i.RGBA_INTEGER;if(n===ao||n===lo||n===co||n===ho)if(o===at)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===ao)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===lo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===co)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===ho)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===ao)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===lo)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===co)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===ho)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===qa||n===Ya||n===$a||n===Za)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===qa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ya)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===$a)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Za)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ja||n===Ka||n===ja)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ja||n===Ka)return o===at?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===ja)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Qa||n===el||n===tl||n===nl||n===il||n===sl||n===rl||n===ol||n===al||n===ll||n===cl||n===hl||n===ul||n===dl)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Qa)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===el)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===tl)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===nl)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===il)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===sl)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===rl)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ol)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===al)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===ll)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===cl)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===hl)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ul)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===dl)return o===at?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===fl||n===pl||n===ml)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===fl)return o===at?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===pl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ml)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===gl||n===_l||n===xl||n===yl)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===gl)return r.COMPRESSED_RED_RGTC1_EXT;if(n===_l)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===xl)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===yl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===qs?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var mx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,gx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,fh=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Br(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Cn({vertexShader:mx,fragmentShader:gx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Mt(new Yi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ph=class extends On{constructor(e,t){super();let n=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,f=null,d=null,g=null,_=typeof XRWebGLBinding<"u",m=new fh,p={},M=t.getContextAttributes(),v=null,x=null,A=[],T=[],C=new ee,P=null,b=new Gt;b.viewport=new ot;let S=new Gt;S.viewport=new ot;let L=[b,S],O=new wa,k=null,G=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let ne=A[Z];return ne===void 0&&(ne=new Ds,A[Z]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function(Z){let ne=A[Z];return ne===void 0&&(ne=new Ds,A[Z]=ne),ne.getGripSpace()},this.getHand=function(Z){let ne=A[Z];return ne===void 0&&(ne=new Ds,A[Z]=ne),ne.getHandSpace()};function X(Z){let ne=T.indexOf(Z.inputSource);if(ne===-1)return;let Me=A[ne];Me!==void 0&&(Me.update(Z.inputSource,Z.frame,c||o),Me.dispatchEvent({type:Z.type,data:Z.inputSource}))}function W(){s.removeEventListener("select",X),s.removeEventListener("selectstart",X),s.removeEventListener("selectend",X),s.removeEventListener("squeeze",X),s.removeEventListener("squeezestart",X),s.removeEventListener("squeezeend",X),s.removeEventListener("end",W),s.removeEventListener("inputsourceschange",se);for(let Z=0;Z<A.length;Z++){let ne=T[Z];ne!==null&&(T[Z]=null,A[Z].disconnect(ne))}k=null,G=null,m.reset();for(let Z in p)delete p[Z];e.setRenderTarget(v),d=null,f=null,u=null,s=null,x=null,Ke.stop(),n.isPresenting=!1,e.setPixelRatio(P),e.setSize(C.width,C.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){r=Z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){a=Z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u===null&&_&&(u=new XRWebGLBinding(s,t)),u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(Z){if(s=Z,s!==null){if(v=e.getRenderTarget(),s.addEventListener("select",X),s.addEventListener("selectstart",X),s.addEventListener("selectend",X),s.addEventListener("squeeze",X),s.addEventListener("squeezestart",X),s.addEventListener("squeezeend",X),s.addEventListener("end",W),s.addEventListener("inputsourceschange",se),M.xrCompatible!==!0&&await t.makeXRCompatible(),P=e.getPixelRatio(),e.getSize(C),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let Me=null,we=null,be=null;M.depth&&(be=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Me=M.stencil?Ys:As,we=M.stencil?qs:Ci);let Je={colorFormat:t.RGBA8,depthFormat:be,scaleFactor:r};u=this.getBinding(),f=u.createProjectionLayer(Je),s.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),x=new Bn(f.textureWidth,f.textureHeight,{format:yn,type:In,depthTexture:new Or(f.textureWidth,f.textureHeight,we,void 0,void 0,void 0,void 0,void 0,void 0,Me),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{let Me={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,t,Me),s.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),x=new Bn(d.framebufferWidth,d.framebufferHeight,{format:yn,type:In,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Ke.setContext(s),Ke.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function se(Z){for(let ne=0;ne<Z.removed.length;ne++){let Me=Z.removed[ne],we=T.indexOf(Me);we>=0&&(T[we]=null,A[we].disconnect(Me))}for(let ne=0;ne<Z.added.length;ne++){let Me=Z.added[ne],we=T.indexOf(Me);if(we===-1){for(let Je=0;Je<A.length;Je++)if(Je>=T.length){T.push(Me),we=Je;break}else if(T[Je]===null){T[Je]=Me,we=Je;break}if(we===-1)break}let be=A[we];be&&be.connect(Me)}}let U=new R,te=new R;function oe(Z,ne,Me){U.setFromMatrixPosition(ne.matrixWorld),te.setFromMatrixPosition(Me.matrixWorld);let we=U.distanceTo(te),be=ne.projectionMatrix.elements,Je=Me.projectionMatrix.elements,ut=be[14]/(be[10]-1),I=be[14]/(be[10]+1),re=(be[9]+1)/be[5],j=(be[9]-1)/be[5],K=(be[8]-1)/be[0],J=(Je[8]+1)/Je[0],fe=ut*K,ae=ut*J,pe=we/(-K+J),Ge=pe*-K;if(ne.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(Ge),Z.translateZ(pe),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),be[10]===-1)Z.projectionMatrix.copy(ne.projectionMatrix),Z.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{let He=ut+pe,w=I+pe,y=fe-Ge,B=ae+(we-Ge),q=re*I/w*He,ie=j*I/w*He;Z.projectionMatrix.makePerspective(y,B,q,ie,He,w),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function ge(Z,ne){ne===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(ne.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(s===null)return;let ne=Z.near,Me=Z.far;m.texture!==null&&(m.depthNear>0&&(ne=m.depthNear),m.depthFar>0&&(Me=m.depthFar)),O.near=S.near=b.near=ne,O.far=S.far=b.far=Me,(k!==O.near||G!==O.far)&&(s.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,G=O.far),O.layers.mask=Z.layers.mask|6,b.layers.mask=O.layers.mask&3,S.layers.mask=O.layers.mask&5;let we=Z.parent,be=O.cameras;ge(O,we);for(let Je=0;Je<be.length;Je++)ge(be[Je],we);be.length===2?oe(O,b,S):O.projectionMatrix.copy(b.projectionMatrix),De(Z,O,we)};function De(Z,ne,Me){Me===null?Z.matrix.copy(ne.matrixWorld):(Z.matrix.copy(Me.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(ne.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(ne.projectionMatrix),Z.projectionMatrixInverse.copy(ne.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=Rs*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(Z){l=Z,f!==null&&(f.fixedFoveation=Z),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=Z)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(O)},this.getCameraTexture=function(Z){return p[Z]};let ke=null;function Ve(Z,ne){if(h=ne.getViewerPose(c||o),g=ne,h!==null){let Me=h.views;d!==null&&(e.setRenderTargetFramebuffer(x,d.framebuffer),e.setRenderTarget(x));let we=!1;Me.length!==O.cameras.length&&(O.cameras.length=0,we=!0);for(let I=0;I<Me.length;I++){let re=Me[I],j=null;if(d!==null)j=d.getViewport(re);else{let J=u.getViewSubImage(f,re);j=J.viewport,I===0&&(e.setRenderTargetTextures(x,J.colorTexture,J.depthStencilTexture),e.setRenderTarget(x))}let K=L[I];K===void 0&&(K=new Gt,K.layers.enable(I),K.viewport=new ot,L[I]=K),K.matrix.fromArray(re.transform.matrix),K.matrix.decompose(K.position,K.quaternion,K.scale),K.projectionMatrix.fromArray(re.projectionMatrix),K.projectionMatrixInverse.copy(K.projectionMatrix).invert(),K.viewport.set(j.x,j.y,j.width,j.height),I===0&&(O.matrix.copy(K.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),we===!0&&O.cameras.push(K)}let be=s.enabledFeatures;if(be&&be.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&_){u=n.getBinding();let I=u.getDepthInformation(Me[0]);I&&I.isValid&&I.texture&&m.init(I,s.renderState)}if(be&&be.includes("camera-access")&&_){e.state.unbindTexture(),u=n.getBinding();for(let I=0;I<Me.length;I++){let re=Me[I].camera;if(re){let j=p[re];j||(j=new Br,p[re]=j);let K=u.getCameraImage(re);j.sourceTexture=K}}}}for(let Me=0;Me<A.length;Me++){let we=T[Me],be=A[Me];we!==null&&be!==void 0&&be.update(we,ne,c||o)}ke&&ke(Z,ne),ne.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ne}),g=null}let Ke=new Gd;Ke.setAnimationLoop(Ve),this.setAnimationLoop=function(Z){ke=Z},this.dispose=function(){}}},ns=new Rn,_x=new st;function xx(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,Jc(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,M,v,x){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),u(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p)):p.isMeshStandardMaterial?(r(m,p),f(m,p),p.isMeshPhysicalMaterial&&d(m,p,x)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),_(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,M,v):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Wt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Wt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let M=e.get(p),v=M.envMap,x=M.envMapRotation;v&&(m.envMap.value=v,ns.copy(x),ns.x*=-1,ns.y*=-1,ns.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(ns.y*=-1,ns.z*=-1),m.envMapRotation.value.setFromMatrix4(_x.makeRotationFromEuler(ns)),m.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,M,v){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*M,m.scale.value=v*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function f(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,M){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Wt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function _(m,p){let M=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function yx(i,e,t,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,v){let x=v.program;n.uniformBlockBinding(M,x)}function c(M,v){let x=s[M.id];x===void 0&&(g(M),x=h(M),s[M.id]=x,M.addEventListener("dispose",m));let A=v.program;n.updateUBOMapping(M,A);let T=e.render.frame;r[M.id]!==T&&(f(M),r[M.id]=T)}function h(M){let v=u();M.__bindingPointIndex=v;let x=i.createBuffer(),A=M.__size,T=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,x),i.bufferData(i.UNIFORM_BUFFER,A,T),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,v,x),x}function u(){for(let M=0;M<a;M++)if(o.indexOf(M)===-1)return o.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(M){let v=s[M.id],x=M.uniforms,A=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,v);for(let T=0,C=x.length;T<C;T++){let P=Array.isArray(x[T])?x[T]:[x[T]];for(let b=0,S=P.length;b<S;b++){let L=P[b];if(d(L,T,b,A)===!0){let O=L.__offset,k=Array.isArray(L.value)?L.value:[L.value],G=0;for(let X=0;X<k.length;X++){let W=k[X],se=_(W);typeof W=="number"||typeof W=="boolean"?(L.__data[0]=W,i.bufferSubData(i.UNIFORM_BUFFER,O+G,L.__data)):W.isMatrix3?(L.__data[0]=W.elements[0],L.__data[1]=W.elements[1],L.__data[2]=W.elements[2],L.__data[3]=0,L.__data[4]=W.elements[3],L.__data[5]=W.elements[4],L.__data[6]=W.elements[5],L.__data[7]=0,L.__data[8]=W.elements[6],L.__data[9]=W.elements[7],L.__data[10]=W.elements[8],L.__data[11]=0):(W.toArray(L.__data,G),G+=se.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,O,L.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(M,v,x,A){let T=M.value,C=v+"_"+x;if(A[C]===void 0)return typeof T=="number"||typeof T=="boolean"?A[C]=T:A[C]=T.clone(),!0;{let P=A[C];if(typeof T=="number"||typeof T=="boolean"){if(P!==T)return A[C]=T,!0}else if(P.equals(T)===!1)return P.copy(T),!0}return!1}function g(M){let v=M.uniforms,x=0,A=16;for(let C=0,P=v.length;C<P;C++){let b=Array.isArray(v[C])?v[C]:[v[C]];for(let S=0,L=b.length;S<L;S++){let O=b[S],k=Array.isArray(O.value)?O.value:[O.value];for(let G=0,X=k.length;G<X;G++){let W=k[G],se=_(W),U=x%A,te=U%se.boundary,oe=U+te;x+=te,oe!==0&&A-oe<se.storage&&(x+=A-oe),O.__data=new Float32Array(se.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=x,x+=se.storage}}}let T=x%A;return T>0&&(x+=A-T),M.__size=x,M.__cache={},this}function _(M){let v={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(v.boundary=4,v.storage=4):M.isVector2?(v.boundary=8,v.storage=8):M.isVector3||M.isColor?(v.boundary=16,v.storage=12):M.isVector4?(v.boundary=16,v.storage=16):M.isMatrix3?(v.boundary=48,v.storage=48):M.isMatrix4?(v.boundary=64,v.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),v}function m(M){let v=M.target;v.removeEventListener("dispose",m);let x=o.indexOf(v.__bindingPointIndex);o.splice(x,1),i.deleteBuffer(s[v.id]),delete s[v.id],delete r[v.id]}function p(){for(let M in s)i.deleteBuffer(s[M]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}var Ks=class{constructor(e={}){let{canvas:t=ud(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:f=!1}=e;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=o;let g=new Uint32Array(4),_=new Int32Array(4),m=null,p=null,M=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ri,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let x=this,A=!1;this._outputColorSpace=vt;let T=0,C=0,P=null,b=-1,S=null,L=new ot,O=new ot,k=null,G=new $e(0),X=0,W=t.width,se=t.height,U=1,te=null,oe=null,ge=new ot(0,0,W,se),De=new ot(0,0,W,se),ke=!1,Ve=new Ns,Ke=!1,Z=!1,ne=new st,Me=new R,we=new ot,be={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Je=!1;function ut(){return P===null?U:1}let I=n;function re(E,N){return t.getContext(E,N)}try{let E={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"180"}`),t.addEventListener("webglcontextlost",me,!1),t.addEventListener("webglcontextrestored",Ee,!1),t.addEventListener("webglcontextcreationerror",ce,!1),I===null){let N="webgl2";if(I=re(N,E),I===null)throw re(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let j,K,J,fe,ae,pe,Ge,He,w,y,B,q,ie,Y,Pe,de,Ae,Re,le,ve,Be,Le,xe,qe;function D(){j=new O0(I),j.init(),Le=new px(I,j),K=new P0(I,j,e,Le),J=new dx(I,j),K.reversedDepthBuffer&&f&&J.buffers.depth.setReversed(!0),fe=new k0(I),ae=new Q_,pe=new fx(I,j,J,ae,K,Le,fe),Ge=new L0(x),He=new F0(x),w=new qp(I),xe=new R0(I,w),y=new B0(I,w,fe,xe),B=new V0(I,y,w,fe),le=new H0(I,K,pe),de=new I0(ae),q=new j_(x,Ge,He,j,K,xe,de),ie=new xx(x,ae),Y=new tx,Pe=new ax(j),Re=new A0(x,Ge,He,J,B,d,l),Ae=new hx(x,B,K),qe=new yx(I,fe,K,J),ve=new C0(I,j,fe),Be=new z0(I,j,fe),fe.programs=q.programs,x.capabilities=K,x.extensions=j,x.properties=ae,x.renderLists=Y,x.shadowMap=Ae,x.state=J,x.info=fe}D();let ue=new ph(x,I);this.xr=ue,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){let E=j.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=j.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return U},this.setPixelRatio=function(E){E!==void 0&&(U=E,this.setSize(W,se,!1))},this.getSize=function(E){return E.set(W,se)},this.setSize=function(E,N,H=!0){if(ue.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}W=E,se=N,t.width=Math.floor(E*U),t.height=Math.floor(N*U),H===!0&&(t.style.width=E+"px",t.style.height=N+"px"),this.setViewport(0,0,E,N)},this.getDrawingBufferSize=function(E){return E.set(W*U,se*U).floor()},this.setDrawingBufferSize=function(E,N,H){W=E,se=N,U=H,t.width=Math.floor(E*H),t.height=Math.floor(N*H),this.setViewport(0,0,E,N)},this.getCurrentViewport=function(E){return E.copy(L)},this.getViewport=function(E){return E.copy(ge)},this.setViewport=function(E,N,H,V){E.isVector4?ge.set(E.x,E.y,E.z,E.w):ge.set(E,N,H,V),J.viewport(L.copy(ge).multiplyScalar(U).round())},this.getScissor=function(E){return E.copy(De)},this.setScissor=function(E,N,H,V){E.isVector4?De.set(E.x,E.y,E.z,E.w):De.set(E,N,H,V),J.scissor(O.copy(De).multiplyScalar(U).round())},this.getScissorTest=function(){return ke},this.setScissorTest=function(E){J.setScissorTest(ke=E)},this.setOpaqueSort=function(E){te=E},this.setTransparentSort=function(E){oe=E},this.getClearColor=function(E){return E.copy(Re.getClearColor())},this.setClearColor=function(){Re.setClearColor(...arguments)},this.getClearAlpha=function(){return Re.getClearAlpha()},this.setClearAlpha=function(){Re.setClearAlpha(...arguments)},this.clear=function(E=!0,N=!0,H=!0){let V=0;if(E){let F=!1;if(P!==null){let he=P.texture.format;F=he===Xa||he===Wa||he===Ga}if(F){let he=P.texture.type,ye=he===In||he===Ci||he===Ws||he===qs||he===ka||he===Ha,Te=Re.getClearColor(),Se=Re.getClearAlpha(),Oe=Te.r,ze=Te.g,Ue=Te.b;ye?(g[0]=Oe,g[1]=ze,g[2]=Ue,g[3]=Se,I.clearBufferuiv(I.COLOR,0,g)):(_[0]=Oe,_[1]=ze,_[2]=Ue,_[3]=Se,I.clearBufferiv(I.COLOR,0,_))}else V|=I.COLOR_BUFFER_BIT}N&&(V|=I.DEPTH_BUFFER_BIT),H&&(V|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",me,!1),t.removeEventListener("webglcontextrestored",Ee,!1),t.removeEventListener("webglcontextcreationerror",ce,!1),Re.dispose(),Y.dispose(),Pe.dispose(),ae.dispose(),Ge.dispose(),He.dispose(),B.dispose(),xe.dispose(),qe.dispose(),q.dispose(),ue.dispose(),ue.removeEventListener("sessionstart",Nn),ue.removeEventListener("sessionend",Gh),Di.stop()};function me(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),A=!0}function Ee(){console.log("THREE.WebGLRenderer: Context Restored."),A=!1;let E=fe.autoReset,N=Ae.enabled,H=Ae.autoUpdate,V=Ae.needsUpdate,F=Ae.type;D(),fe.autoReset=E,Ae.enabled=N,Ae.autoUpdate=H,Ae.needsUpdate=V,Ae.type=F}function ce(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Q(E){let N=E.target;N.removeEventListener("dispose",Q),Ce(N)}function Ce(E){We(E),ae.remove(E)}function We(E){let N=ae.get(E).programs;N!==void 0&&(N.forEach(function(H){q.releaseProgram(H)}),E.isShaderMaterial&&q.releaseShaderCache(E))}this.renderBufferDirect=function(E,N,H,V,F,he){N===null&&(N=be);let ye=F.isMesh&&F.matrixWorld.determinant()<0,Te=xf(E,N,H,V,F);J.setMaterial(V,ye);let Se=H.index,Oe=1;if(V.wireframe===!0){if(Se=y.getWireframeAttribute(H),Se===void 0)return;Oe=2}let ze=H.drawRange,Ue=H.attributes.position,je=ze.start*Oe,lt=(ze.start+ze.count)*Oe;he!==null&&(je=Math.max(je,he.start*Oe),lt=Math.min(lt,(he.start+he.count)*Oe)),Se!==null?(je=Math.max(je,0),lt=Math.min(lt,Se.count)):Ue!=null&&(je=Math.max(je,0),lt=Math.min(lt,Ue.count));let xt=lt-je;if(xt<0||xt===1/0)return;xe.setup(F,V,Te,H,Se);let ft,ht=ve;if(Se!==null&&(ft=w.get(Se),ht=Be,ht.setIndex(ft)),F.isMesh)V.wireframe===!0?(J.setLineWidth(V.wireframeLinewidth*ut()),ht.setMode(I.LINES)):ht.setMode(I.TRIANGLES);else if(F.isLine){let Ne=V.linewidth;Ne===void 0&&(Ne=1),J.setLineWidth(Ne*ut()),F.isLineSegments?ht.setMode(I.LINES):F.isLineLoop?ht.setMode(I.LINE_LOOP):ht.setMode(I.LINE_STRIP)}else F.isPoints?ht.setMode(I.POINTS):F.isSprite&&ht.setMode(I.TRIANGLES);if(F.isBatchedMesh)if(F._multiDrawInstances!==null)Ps("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ht.renderMultiDrawInstances(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount,F._multiDrawInstances);else if(j.get("WEBGL_multi_draw"))ht.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else{let Ne=F._multiDrawStarts,mt=F._multiDrawCounts,it=F._multiDrawCount,nn=Se?w.get(Se).bytesPerElement:1,hs=ae.get(V).currentProgram.getUniforms();for(let sn=0;sn<it;sn++)hs.setValue(I,"_gl_DrawID",sn),ht.render(Ne[sn]/nn,mt[sn])}else if(F.isInstancedMesh)ht.renderInstances(je,xt,F.count);else if(H.isInstancedBufferGeometry){let Ne=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,mt=Math.min(H.instanceCount,Ne);ht.renderInstances(je,xt,mt)}else ht.render(je,xt)};function dt(E,N,H){E.transparent===!0&&E.side===xn&&E.forceSinglePass===!1?(E.side=Wt,E.needsUpdate=!0,Eo(E,N,H),E.side=ei,E.needsUpdate=!0,Eo(E,N,H),E.side=xn):Eo(E,N,H)}this.compile=function(E,N,H=null){H===null&&(H=E),p=Pe.get(H),p.init(N),v.push(p),H.traverseVisible(function(F){F.isLight&&F.layers.test(N.layers)&&(p.pushLight(F),F.castShadow&&p.pushShadow(F))}),E!==H&&E.traverseVisible(function(F){F.isLight&&F.layers.test(N.layers)&&(p.pushLight(F),F.castShadow&&p.pushShadow(F))}),p.setupLights();let V=new Set;return E.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;let he=F.material;if(he)if(Array.isArray(he))for(let ye=0;ye<he.length;ye++){let Te=he[ye];dt(Te,H,F),V.add(Te)}else dt(he,H,F),V.add(he)}),p=v.pop(),V},this.compileAsync=function(E,N,H=null){let V=this.compile(E,N,H);return new Promise(F=>{function he(){if(V.forEach(function(ye){ae.get(ye).currentProgram.isReady()&&V.delete(ye)}),V.size===0){F(E);return}setTimeout(he,10)}j.get("KHR_parallel_shader_compile")!==null?he():setTimeout(he,10)})};let rt=null;function Yn(E){rt&&rt(E)}function Nn(){Di.stop()}function Gh(){Di.start()}let Di=new Gd;Di.setAnimationLoop(Yn),typeof self<"u"&&Di.setContext(self),this.setAnimationLoop=function(E){rt=E,ue.setAnimationLoop(E),E===null?Di.stop():Di.start()},ue.addEventListener("sessionstart",Nn),ue.addEventListener("sessionend",Gh),this.render=function(E,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(A===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),ue.enabled===!0&&ue.isPresenting===!0&&(ue.cameraAutoUpdate===!0&&ue.updateCamera(N),N=ue.getCamera()),E.isScene===!0&&E.onBeforeRender(x,E,N,P),p=Pe.get(E,v.length),p.init(N),v.push(p),ne.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),Ve.setFromProjectionMatrix(ne,wn,N.reversedDepth),Z=this.localClippingEnabled,Ke=de.init(this.clippingPlanes,Z),m=Y.get(E,M.length),m.init(),M.push(m),ue.enabled===!0&&ue.isPresenting===!0){let he=x.xr.getDepthSensingMesh();he!==null&&Wl(he,N,-1/0,x.sortObjects)}Wl(E,N,0,x.sortObjects),m.finish(),x.sortObjects===!0&&m.sort(te,oe),Je=ue.enabled===!1||ue.isPresenting===!1||ue.hasDepthSensing()===!1,Je&&Re.addToRenderList(m,E),this.info.render.frame++,Ke===!0&&de.beginShadows();let H=p.state.shadowsArray;Ae.render(H,E,N),Ke===!0&&de.endShadows(),this.info.autoReset===!0&&this.info.reset();let V=m.opaque,F=m.transmissive;if(p.setupLights(),N.isArrayCamera){let he=N.cameras;if(F.length>0)for(let ye=0,Te=he.length;ye<Te;ye++){let Se=he[ye];Xh(V,F,E,Se)}Je&&Re.render(E);for(let ye=0,Te=he.length;ye<Te;ye++){let Se=he[ye];Wh(m,E,Se,Se.viewport)}}else F.length>0&&Xh(V,F,E,N),Je&&Re.render(E),Wh(m,E,N);P!==null&&C===0&&(pe.updateMultisampleRenderTarget(P),pe.updateRenderTargetMipmap(P)),E.isScene===!0&&E.onAfterRender(x,E,N),xe.resetDefaultState(),b=-1,S=null,v.pop(),v.length>0?(p=v[v.length-1],Ke===!0&&de.setGlobalState(x.clippingPlanes,p.state.camera)):p=null,M.pop(),M.length>0?m=M[M.length-1]:m=null};function Wl(E,N,H,V){if(E.visible===!1)return;if(E.layers.test(N.layers)){if(E.isGroup)H=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(N);else if(E.isLight)p.pushLight(E),E.castShadow&&p.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||Ve.intersectsSprite(E)){V&&we.setFromMatrixPosition(E.matrixWorld).applyMatrix4(ne);let ye=B.update(E),Te=E.material;Te.visible&&m.push(E,ye,Te,H,we.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||Ve.intersectsObject(E))){let ye=B.update(E),Te=E.material;if(V&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),we.copy(E.boundingSphere.center)):(ye.boundingSphere===null&&ye.computeBoundingSphere(),we.copy(ye.boundingSphere.center)),we.applyMatrix4(E.matrixWorld).applyMatrix4(ne)),Array.isArray(Te)){let Se=ye.groups;for(let Oe=0,ze=Se.length;Oe<ze;Oe++){let Ue=Se[Oe],je=Te[Ue.materialIndex];je&&je.visible&&m.push(E,ye,je,H,we.z,Ue)}}else Te.visible&&m.push(E,ye,Te,H,we.z,null)}}let he=E.children;for(let ye=0,Te=he.length;ye<Te;ye++)Wl(he[ye],N,H,V)}function Wh(E,N,H,V){let F=E.opaque,he=E.transmissive,ye=E.transparent;p.setupLightsView(H),Ke===!0&&de.setGlobalState(x.clippingPlanes,H),V&&J.viewport(L.copy(V)),F.length>0&&bo(F,N,H),he.length>0&&bo(he,N,H),ye.length>0&&bo(ye,N,H),J.buffers.depth.setTest(!0),J.buffers.depth.setMask(!0),J.buffers.color.setMask(!0),J.setPolygonOffset(!1)}function Xh(E,N,H,V){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[V.id]===void 0&&(p.state.transmissionRenderTarget[V.id]=new Bn(1,1,{generateMipmaps:!0,type:j.has("EXT_color_buffer_half_float")||j.has("EXT_color_buffer_float")?Xs:In,minFilter:Ri,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:nt.workingColorSpace}));let he=p.state.transmissionRenderTarget[V.id],ye=V.viewport||L;he.setSize(ye.z*x.transmissionResolutionScale,ye.w*x.transmissionResolutionScale);let Te=x.getRenderTarget(),Se=x.getActiveCubeFace(),Oe=x.getActiveMipmapLevel();x.setRenderTarget(he),x.getClearColor(G),X=x.getClearAlpha(),X<1&&x.setClearColor(16777215,.5),x.clear(),Je&&Re.render(H);let ze=x.toneMapping;x.toneMapping=ri;let Ue=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),p.setupLightsView(V),Ke===!0&&de.setGlobalState(x.clippingPlanes,V),bo(E,H,V),pe.updateMultisampleRenderTarget(he),pe.updateRenderTargetMipmap(he),j.has("WEBGL_multisampled_render_to_texture")===!1){let je=!1;for(let lt=0,xt=N.length;lt<xt;lt++){let ft=N[lt],ht=ft.object,Ne=ft.geometry,mt=ft.material,it=ft.group;if(mt.side===xn&&ht.layers.test(V.layers)){let nn=mt.side;mt.side=Wt,mt.needsUpdate=!0,qh(ht,H,V,Ne,mt,it),mt.side=nn,mt.needsUpdate=!0,je=!0}}je===!0&&(pe.updateMultisampleRenderTarget(he),pe.updateRenderTargetMipmap(he))}x.setRenderTarget(Te,Se,Oe),x.setClearColor(G,X),Ue!==void 0&&(V.viewport=Ue),x.toneMapping=ze}function bo(E,N,H){let V=N.isScene===!0?N.overrideMaterial:null;for(let F=0,he=E.length;F<he;F++){let ye=E[F],Te=ye.object,Se=ye.geometry,Oe=ye.group,ze=ye.material;ze.allowOverride===!0&&V!==null&&(ze=V),Te.layers.test(H.layers)&&qh(Te,N,H,Se,ze,Oe)}}function qh(E,N,H,V,F,he){E.onBeforeRender(x,N,H,V,F,he),E.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),F.onBeforeRender(x,N,H,V,E,he),F.transparent===!0&&F.side===xn&&F.forceSinglePass===!1?(F.side=Wt,F.needsUpdate=!0,x.renderBufferDirect(H,N,V,F,E,he),F.side=ei,F.needsUpdate=!0,x.renderBufferDirect(H,N,V,F,E,he),F.side=xn):x.renderBufferDirect(H,N,V,F,E,he),E.onAfterRender(x,N,H,V,F,he)}function Eo(E,N,H){N.isScene!==!0&&(N=be);let V=ae.get(E),F=p.state.lights,he=p.state.shadowsArray,ye=F.state.version,Te=q.getParameters(E,F.state,he,N,H),Se=q.getProgramCacheKey(Te),Oe=V.programs;V.environment=E.isMeshStandardMaterial?N.environment:null,V.fog=N.fog,V.envMap=(E.isMeshStandardMaterial?He:Ge).get(E.envMap||V.environment),V.envMapRotation=V.environment!==null&&E.envMap===null?N.environmentRotation:E.envMapRotation,Oe===void 0&&(E.addEventListener("dispose",Q),Oe=new Map,V.programs=Oe);let ze=Oe.get(Se);if(ze!==void 0){if(V.currentProgram===ze&&V.lightsStateVersion===ye)return $h(E,Te),ze}else Te.uniforms=q.getUniforms(E),E.onBeforeCompile(Te,x),ze=q.acquireProgram(Te,Se),Oe.set(Se,ze),V.uniforms=Te.uniforms;let Ue=V.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Ue.clippingPlanes=de.uniform),$h(E,Te),V.needsLights=vf(E),V.lightsStateVersion=ye,V.needsLights&&(Ue.ambientLightColor.value=F.state.ambient,Ue.lightProbe.value=F.state.probe,Ue.directionalLights.value=F.state.directional,Ue.directionalLightShadows.value=F.state.directionalShadow,Ue.spotLights.value=F.state.spot,Ue.spotLightShadows.value=F.state.spotShadow,Ue.rectAreaLights.value=F.state.rectArea,Ue.ltc_1.value=F.state.rectAreaLTC1,Ue.ltc_2.value=F.state.rectAreaLTC2,Ue.pointLights.value=F.state.point,Ue.pointLightShadows.value=F.state.pointShadow,Ue.hemisphereLights.value=F.state.hemi,Ue.directionalShadowMap.value=F.state.directionalShadowMap,Ue.directionalShadowMatrix.value=F.state.directionalShadowMatrix,Ue.spotShadowMap.value=F.state.spotShadowMap,Ue.spotLightMatrix.value=F.state.spotLightMatrix,Ue.spotLightMap.value=F.state.spotLightMap,Ue.pointShadowMap.value=F.state.pointShadowMap,Ue.pointShadowMatrix.value=F.state.pointShadowMatrix),V.currentProgram=ze,V.uniformsList=null,ze}function Yh(E){if(E.uniformsList===null){let N=E.currentProgram.getUniforms();E.uniformsList=Js.seqWithValue(N.seq,E.uniforms)}return E.uniformsList}function $h(E,N){let H=ae.get(E);H.outputColorSpace=N.outputColorSpace,H.batching=N.batching,H.batchingColor=N.batchingColor,H.instancing=N.instancing,H.instancingColor=N.instancingColor,H.instancingMorph=N.instancingMorph,H.skinning=N.skinning,H.morphTargets=N.morphTargets,H.morphNormals=N.morphNormals,H.morphColors=N.morphColors,H.morphTargetsCount=N.morphTargetsCount,H.numClippingPlanes=N.numClippingPlanes,H.numIntersection=N.numClipIntersection,H.vertexAlphas=N.vertexAlphas,H.vertexTangents=N.vertexTangents,H.toneMapping=N.toneMapping}function xf(E,N,H,V,F){N.isScene!==!0&&(N=be),pe.resetTextureUnits();let he=N.fog,ye=V.isMeshStandardMaterial?N.environment:null,Te=P===null?x.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:Vi,Se=(V.isMeshStandardMaterial?He:Ge).get(V.envMap||ye),Oe=V.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,ze=!!H.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Ue=!!H.morphAttributes.position,je=!!H.morphAttributes.normal,lt=!!H.morphAttributes.color,xt=ri;V.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(xt=x.toneMapping);let ft=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,ht=ft!==void 0?ft.length:0,Ne=ae.get(V),mt=p.state.lights;if(Ke===!0&&(Z===!0||E!==S)){let Ht=E===S&&V.id===b;de.setState(V,E,Ht)}let it=!1;V.version===Ne.__version?(Ne.needsLights&&Ne.lightsStateVersion!==mt.state.version||Ne.outputColorSpace!==Te||F.isBatchedMesh&&Ne.batching===!1||!F.isBatchedMesh&&Ne.batching===!0||F.isBatchedMesh&&Ne.batchingColor===!0&&F.colorTexture===null||F.isBatchedMesh&&Ne.batchingColor===!1&&F.colorTexture!==null||F.isInstancedMesh&&Ne.instancing===!1||!F.isInstancedMesh&&Ne.instancing===!0||F.isSkinnedMesh&&Ne.skinning===!1||!F.isSkinnedMesh&&Ne.skinning===!0||F.isInstancedMesh&&Ne.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&Ne.instancingColor===!1&&F.instanceColor!==null||F.isInstancedMesh&&Ne.instancingMorph===!0&&F.morphTexture===null||F.isInstancedMesh&&Ne.instancingMorph===!1&&F.morphTexture!==null||Ne.envMap!==Se||V.fog===!0&&Ne.fog!==he||Ne.numClippingPlanes!==void 0&&(Ne.numClippingPlanes!==de.numPlanes||Ne.numIntersection!==de.numIntersection)||Ne.vertexAlphas!==Oe||Ne.vertexTangents!==ze||Ne.morphTargets!==Ue||Ne.morphNormals!==je||Ne.morphColors!==lt||Ne.toneMapping!==xt||Ne.morphTargetsCount!==ht)&&(it=!0):(it=!0,Ne.__version=V.version);let nn=Ne.currentProgram;it===!0&&(nn=Eo(V,N,F));let hs=!1,sn=!1,fr=!1,gt=nn.getUniforms(),fn=Ne.uniforms;if(J.useProgram(nn.program)&&(hs=!0,sn=!0,fr=!0),V.id!==b&&(b=V.id,sn=!0),hs||S!==E){J.buffers.depth.getReversed()&&E.reversedDepth!==!0&&(E._reversedDepth=!0,E.updateProjectionMatrix()),gt.setValue(I,"projectionMatrix",E.projectionMatrix),gt.setValue(I,"viewMatrix",E.matrixWorldInverse);let Yt=gt.map.cameraPosition;Yt!==void 0&&Yt.setValue(I,Me.setFromMatrixPosition(E.matrixWorld)),K.logarithmicDepthBuffer&&gt.setValue(I,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&gt.setValue(I,"isOrthographic",E.isOrthographicCamera===!0),S!==E&&(S=E,sn=!0,fr=!0)}if(F.isSkinnedMesh){gt.setOptional(I,F,"bindMatrix"),gt.setOptional(I,F,"bindMatrixInverse");let Ht=F.skeleton;Ht&&(Ht.boneTexture===null&&Ht.computeBoneTexture(),gt.setValue(I,"boneTexture",Ht.boneTexture,pe))}F.isBatchedMesh&&(gt.setOptional(I,F,"batchingTexture"),gt.setValue(I,"batchingTexture",F._matricesTexture,pe),gt.setOptional(I,F,"batchingIdTexture"),gt.setValue(I,"batchingIdTexture",F._indirectTexture,pe),gt.setOptional(I,F,"batchingColorTexture"),F._colorsTexture!==null&&gt.setValue(I,"batchingColorTexture",F._colorsTexture,pe));let pn=H.morphAttributes;if((pn.position!==void 0||pn.normal!==void 0||pn.color!==void 0)&&le.update(F,H,nn),(sn||Ne.receiveShadow!==F.receiveShadow)&&(Ne.receiveShadow=F.receiveShadow,gt.setValue(I,"receiveShadow",F.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(fn.envMap.value=Se,fn.flipEnvMap.value=Se.isCubeTexture&&Se.isRenderTargetTexture===!1?-1:1),V.isMeshStandardMaterial&&V.envMap===null&&N.environment!==null&&(fn.envMapIntensity.value=N.environmentIntensity),sn&&(gt.setValue(I,"toneMappingExposure",x.toneMappingExposure),Ne.needsLights&&yf(fn,fr),he&&V.fog===!0&&ie.refreshFogUniforms(fn,he),ie.refreshMaterialUniforms(fn,V,U,se,p.state.transmissionRenderTarget[E.id]),Js.upload(I,Yh(Ne),fn,pe)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(Js.upload(I,Yh(Ne),fn,pe),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&gt.setValue(I,"center",F.center),gt.setValue(I,"modelViewMatrix",F.modelViewMatrix),gt.setValue(I,"normalMatrix",F.normalMatrix),gt.setValue(I,"modelMatrix",F.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){let Ht=V.uniformsGroups;for(let Yt=0,Xl=Ht.length;Yt<Xl;Yt++){let Ui=Ht[Yt];qe.update(Ui,nn),qe.bind(Ui,nn)}}return nn}function yf(E,N){E.ambientLightColor.needsUpdate=N,E.lightProbe.needsUpdate=N,E.directionalLights.needsUpdate=N,E.directionalLightShadows.needsUpdate=N,E.pointLights.needsUpdate=N,E.pointLightShadows.needsUpdate=N,E.spotLights.needsUpdate=N,E.spotLightShadows.needsUpdate=N,E.rectAreaLights.needsUpdate=N,E.hemisphereLights.needsUpdate=N}function vf(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return T},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return P},this.setRenderTargetTextures=function(E,N,H){let V=ae.get(E);V.__autoAllocateDepthBuffer=E.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),ae.get(E.texture).__webglTexture=N,ae.get(E.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:H,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(E,N){let H=ae.get(E);H.__webglFramebuffer=N,H.__useDefaultFramebuffer=N===void 0};let Mf=I.createFramebuffer();this.setRenderTarget=function(E,N=0,H=0){P=E,T=N,C=H;let V=!0,F=null,he=!1,ye=!1;if(E){let Se=ae.get(E);if(Se.__useDefaultFramebuffer!==void 0)J.bindFramebuffer(I.FRAMEBUFFER,null),V=!1;else if(Se.__webglFramebuffer===void 0)pe.setupRenderTarget(E);else if(Se.__hasExternalTextures)pe.rebindTextures(E,ae.get(E.texture).__webglTexture,ae.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let Ue=E.depthTexture;if(Se.__boundDepthTexture!==Ue){if(Ue!==null&&ae.has(Ue)&&(E.width!==Ue.image.width||E.height!==Ue.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");pe.setupDepthRenderbuffer(E)}}let Oe=E.texture;(Oe.isData3DTexture||Oe.isDataArrayTexture||Oe.isCompressedArrayTexture)&&(ye=!0);let ze=ae.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(ze[N])?F=ze[N][H]:F=ze[N],he=!0):E.samples>0&&pe.useMultisampledRTT(E)===!1?F=ae.get(E).__webglMultisampledFramebuffer:Array.isArray(ze)?F=ze[H]:F=ze,L.copy(E.viewport),O.copy(E.scissor),k=E.scissorTest}else L.copy(ge).multiplyScalar(U).floor(),O.copy(De).multiplyScalar(U).floor(),k=ke;if(H!==0&&(F=Mf),J.bindFramebuffer(I.FRAMEBUFFER,F)&&V&&J.drawBuffers(E,F),J.viewport(L),J.scissor(O),J.setScissorTest(k),he){let Se=ae.get(E.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+N,Se.__webglTexture,H)}else if(ye){let Se=N;for(let Oe=0;Oe<E.textures.length;Oe++){let ze=ae.get(E.textures[Oe]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+Oe,ze.__webglTexture,H,Se)}}else if(E!==null&&H!==0){let Se=ae.get(E.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,Se.__webglTexture,H)}b=-1},this.readRenderTargetPixels=function(E,N,H,V,F,he,ye,Te=0){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Se=ae.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ye!==void 0&&(Se=Se[ye]),Se){J.bindFramebuffer(I.FRAMEBUFFER,Se);try{let Oe=E.textures[Te],ze=Oe.format,Ue=Oe.type;if(!K.textureFormatReadable(ze)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!K.textureTypeReadable(Ue)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=E.width-V&&H>=0&&H<=E.height-F&&(E.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+Te),I.readPixels(N,H,V,F,Le.convert(ze),Le.convert(Ue),he))}finally{let Oe=P!==null?ae.get(P).__webglFramebuffer:null;J.bindFramebuffer(I.FRAMEBUFFER,Oe)}}},this.readRenderTargetPixelsAsync=async function(E,N,H,V,F,he,ye,Te=0){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Se=ae.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ye!==void 0&&(Se=Se[ye]),Se)if(N>=0&&N<=E.width-V&&H>=0&&H<=E.height-F){J.bindFramebuffer(I.FRAMEBUFFER,Se);let Oe=E.textures[Te],ze=Oe.format,Ue=Oe.type;if(!K.textureFormatReadable(ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!K.textureTypeReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let je=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,je),I.bufferData(I.PIXEL_PACK_BUFFER,he.byteLength,I.STREAM_READ),E.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+Te),I.readPixels(N,H,V,F,Le.convert(ze),Le.convert(Ue),0);let lt=P!==null?ae.get(P).__webglFramebuffer:null;J.bindFramebuffer(I.FRAMEBUFFER,lt);let xt=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await dd(I,xt,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,je),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,he),I.deleteBuffer(je),I.deleteSync(xt),he}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(E,N=null,H=0){let V=Math.pow(2,-H),F=Math.floor(E.image.width*V),he=Math.floor(E.image.height*V),ye=N!==null?N.x:0,Te=N!==null?N.y:0;pe.setTexture2D(E,0),I.copyTexSubImage2D(I.TEXTURE_2D,H,0,0,ye,Te,F,he),J.unbindTexture()};let Sf=I.createFramebuffer(),bf=I.createFramebuffer();this.copyTextureToTexture=function(E,N,H=null,V=null,F=0,he=null){he===null&&(F!==0?(Ps("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),he=F,F=0):he=0);let ye,Te,Se,Oe,ze,Ue,je,lt,xt,ft=E.isCompressedTexture?E.mipmaps[he]:E.image;if(H!==null)ye=H.max.x-H.min.x,Te=H.max.y-H.min.y,Se=H.isBox3?H.max.z-H.min.z:1,Oe=H.min.x,ze=H.min.y,Ue=H.isBox3?H.min.z:0;else{let pn=Math.pow(2,-F);ye=Math.floor(ft.width*pn),Te=Math.floor(ft.height*pn),E.isDataArrayTexture?Se=ft.depth:E.isData3DTexture?Se=Math.floor(ft.depth*pn):Se=1,Oe=0,ze=0,Ue=0}V!==null?(je=V.x,lt=V.y,xt=V.z):(je=0,lt=0,xt=0);let ht=Le.convert(N.format),Ne=Le.convert(N.type),mt;N.isData3DTexture?(pe.setTexture3D(N,0),mt=I.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(pe.setTexture2DArray(N,0),mt=I.TEXTURE_2D_ARRAY):(pe.setTexture2D(N,0),mt=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,N.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,N.unpackAlignment);let it=I.getParameter(I.UNPACK_ROW_LENGTH),nn=I.getParameter(I.UNPACK_IMAGE_HEIGHT),hs=I.getParameter(I.UNPACK_SKIP_PIXELS),sn=I.getParameter(I.UNPACK_SKIP_ROWS),fr=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,ft.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,ft.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Oe),I.pixelStorei(I.UNPACK_SKIP_ROWS,ze),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Ue);let gt=E.isDataArrayTexture||E.isData3DTexture,fn=N.isDataArrayTexture||N.isData3DTexture;if(E.isDepthTexture){let pn=ae.get(E),Ht=ae.get(N),Yt=ae.get(pn.__renderTarget),Xl=ae.get(Ht.__renderTarget);J.bindFramebuffer(I.READ_FRAMEBUFFER,Yt.__webglFramebuffer),J.bindFramebuffer(I.DRAW_FRAMEBUFFER,Xl.__webglFramebuffer);for(let Ui=0;Ui<Se;Ui++)gt&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,ae.get(E).__webglTexture,F,Ue+Ui),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,ae.get(N).__webglTexture,he,xt+Ui)),I.blitFramebuffer(Oe,ze,ye,Te,je,lt,ye,Te,I.DEPTH_BUFFER_BIT,I.NEAREST);J.bindFramebuffer(I.READ_FRAMEBUFFER,null),J.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(F!==0||E.isRenderTargetTexture||ae.has(E)){let pn=ae.get(E),Ht=ae.get(N);J.bindFramebuffer(I.READ_FRAMEBUFFER,Sf),J.bindFramebuffer(I.DRAW_FRAMEBUFFER,bf);for(let Yt=0;Yt<Se;Yt++)gt?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,pn.__webglTexture,F,Ue+Yt):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,pn.__webglTexture,F),fn?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Ht.__webglTexture,he,xt+Yt):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,Ht.__webglTexture,he),F!==0?I.blitFramebuffer(Oe,ze,ye,Te,je,lt,ye,Te,I.COLOR_BUFFER_BIT,I.NEAREST):fn?I.copyTexSubImage3D(mt,he,je,lt,xt+Yt,Oe,ze,ye,Te):I.copyTexSubImage2D(mt,he,je,lt,Oe,ze,ye,Te);J.bindFramebuffer(I.READ_FRAMEBUFFER,null),J.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else fn?E.isDataTexture||E.isData3DTexture?I.texSubImage3D(mt,he,je,lt,xt,ye,Te,Se,ht,Ne,ft.data):N.isCompressedArrayTexture?I.compressedTexSubImage3D(mt,he,je,lt,xt,ye,Te,Se,ht,ft.data):I.texSubImage3D(mt,he,je,lt,xt,ye,Te,Se,ht,Ne,ft):E.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,he,je,lt,ye,Te,ht,Ne,ft.data):E.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,he,je,lt,ft.width,ft.height,ht,ft.data):I.texSubImage2D(I.TEXTURE_2D,he,je,lt,ye,Te,ht,Ne,ft);I.pixelStorei(I.UNPACK_ROW_LENGTH,it),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,nn),I.pixelStorei(I.UNPACK_SKIP_PIXELS,hs),I.pixelStorei(I.UNPACK_SKIP_ROWS,sn),I.pixelStorei(I.UNPACK_SKIP_IMAGES,fr),he===0&&N.generateMipmaps&&I.generateMipmap(mt),J.unbindTexture()},this.initRenderTarget=function(E){ae.get(E).__webglFramebuffer===void 0&&pe.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?pe.setTextureCube(E,0):E.isData3DTexture?pe.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?pe.setTexture2DArray(E,0):pe.setTexture2D(E,0),J.unbindTexture()},this.resetState=function(){T=0,C=0,P=null,J.reset(),xe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return wn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=nt._getDrawingBufferColorSpace(e),t.unpackColorSpace=nt._getUnpackColorSpace()}};var rs=class{constructor(e,{reduced:t=!1,density:n=70}={}){this.canvas=e,this.ctx=e.getContext("2d"),this.reduced=t,this.density=n,this.last=0,this.motes=Array.from({length:n},(s,r)=>({x:Math.random(),y:Math.random(),radius:.7+Math.random()*1.5,speed:.3+Math.random()*.7,phase:Math.random()*Math.PI*2,depth:.25+Math.random()*.75})),this.glow=this.sprite()}sprite(){let e=document.createElement("canvas");e.width=e.height=64;let t=e.getContext("2d"),n=t.createRadialGradient(32,32,0,32,32,32);return n.addColorStop(0,"rgba(255,247,188,1)"),n.addColorStop(.05,"rgba(255,229,129,.95)"),n.addColorStop(.14,"rgba(224,207,118,.65)"),n.addColorStop(.4,"rgba(194,200,133,.15)"),n.addColorStop(1,"rgba(161,207,155,0)"),t.fillStyle=n,t.fillRect(0,0,64,64),e}resize(e,t){let n=Math.min(devicePixelRatio||1,1.5);this.ratio=n,this.width=e,this.height=t,this.canvas.width=Math.round(e*n),this.canvas.height=Math.round(t*n),this.canvas.style.width=e+"px",this.canvas.style.height=t+"px",this.last=0}clear(){this.ctx.setTransform(1,0,0,1,0,0),this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)}draw(e,{particles:t=!0,lights:n=!0,night:s=!1,theme:r="elven",intensity:o=1,anchors:a=[]}={}){if(e-this.last<32||(this.last=e,this.clear(),!t&&!n||this.reduced))return;let l=this.ctx,c=this.width||this.canvas.clientWidth,h=this.height||this.canvas.clientHeight,u=e*.001,f=this.ratio||1;l.setTransform(f,0,0,f,0,0);let d=r==="mordor",_=d?"247,127,59":s?"151,202,229":"235,224,158";if(n){l.save(),l.globalCompositeOperation="screen";let m=c*(d?.82:.79),p=-h*.18,M=l.createRadialGradient(m,h*.03,10,m,h*.03,c*.57);M.addColorStop(0,`rgba(${_},${.13*o})`),M.addColorStop(.35,`rgba(${_},${.055*o})`),M.addColorStop(1,`rgba(${_},0)`),l.fillStyle=M,l.fillRect(0,0,c,h);for(let x=0;x<5;x++){let A=Math.sin(u*.055+x)*.016,T=.12+x*.036,C=m+(x-2)*30,P=c*(.06+x*.19+A),b=P+c*T,S=l.createLinearGradient(C,0,(P+b)/2,h*.96);S.addColorStop(0,`rgba(${_},0)`),S.addColorStop(.17,`rgba(${_},${(.026+x%2*.016)*o})`),S.addColorStop(.7,`rgba(${_},${.023*o})`),S.addColorStop(1,`rgba(${_},0)`),l.fillStyle=S,l.beginPath(),l.moveTo(C-20,p),l.lineTo(C+20,p),l.lineTo(b,h*1.05),l.lineTo(P,h*1.05),l.closePath(),l.fill()}let v=l.createRadialGradient(c*(.3+Math.sin(u*.025)*.1),h*.78,0,c*.5,h*.78,c*.52);v.addColorStop(0,`rgba(${_},${.035*o})`),v.addColorStop(1,`rgba(${_},0)`),l.fillStyle=v,l.fillRect(0,h*.45,c,h*.55),l.restore()}if(t){l.save(),l.globalCompositeOperation="screen";for(let m of this.motes){let p=(m.x*c+u*4*m.speed+c*100)%c+Math.sin(u*.28+m.phase)*20*m.depth,M=(m.y*h-u*5*m.speed+h*100)%h+Math.cos(u*.2+m.phase)*13,v=Math.pow((Math.sin(u*(.6+m.speed*.4)+m.phase)+1)/2,2),x=(.12+.72*v)*m.depth*o,A=(8+10*m.radius)*m.depth;l.globalAlpha=x,l.drawImage(this.glow,p-A/2,M-A/2,A,A),v>.92&&m.depth>.8&&(l.strokeStyle=`rgba(${_},${x*.45})`,l.lineWidth=.55,l.beginPath(),l.moveTo(p-3,M),l.lineTo(p+3,M),l.moveTo(p,M-3),l.lineTo(p,M+3),l.stroke())}for(let m of a.slice(0,18)){let p=(.45+.15*Math.sin(u*1.4+m.x*.03))*o,M=m.radius||18,v=l.createRadialGradient(m.x,m.y,0,m.x,m.y,M);v.addColorStop(0,`rgba(${m.color||_},${p*.5})`),v.addColorStop(.16,`rgba(${m.color||_},${p*.18})`),v.addColorStop(1,`rgba(${m.color||_},0)`),l.globalAlpha=1,l.fillStyle=v,l.beginPath(),l.arc(m.x,m.y,M,0,Math.PI*2),l.fill()}l.restore()}}};var $d={type:"change"},xh={type:"start"},Jd={type:"end"},Tl=new Mi,Zd=new gn,vx=Math.cos(70*Wn.DEG2RAD),At=new R,Kt=2*Math.PI,ct={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},_h=1e-6,Qs=class extends so{constructor(e,t=null){super(e,t),this.state=ct.NONE,this.target=new R,this.cursor=new R,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:_n.ROTATE,MIDDLE:_n.DOLLY,RIGHT:_n.PAN},this.touches={ONE:Pn.ROTATE,TWO:Pn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new R,this._lastQuaternion=new Ft,this._lastTargetPosition=new R,this._quat=new Ft().setFromUnitVectors(e.up,new R(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Gs,this._sphericalDelta=new Gs,this._scale=1,this._panOffset=new R,this._rotateStart=new ee,this._rotateEnd=new ee,this._rotateDelta=new ee,this._panStart=new ee,this._panEnd=new ee,this._panDelta=new ee,this._dollyStart=new ee,this._dollyEnd=new ee,this._dollyDelta=new ee,this._dollyDirection=new R,this._mouse=new ee,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Sx.bind(this),this._onPointerDown=Mx.bind(this),this._onPointerUp=bx.bind(this),this._onContextMenu=Px.bind(this),this._onMouseWheel=wx.bind(this),this._onKeyDown=Ax.bind(this),this._onTouchStart=Rx.bind(this),this._onTouchMove=Cx.bind(this),this._onMouseDown=Ex.bind(this),this._onMouseMove=Tx.bind(this),this._interceptControlDown=Ix.bind(this),this._interceptControlUp=Lx.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent($d),this.update(),this.state=ct.NONE}update(e=null){let t=this.object.position;At.copy(t).sub(this.target),At.applyQuaternion(this._quat),this._spherical.setFromVector3(At),this.autoRotate&&this.state===ct.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=Kt:n>Math.PI&&(n-=Kt),s<-Math.PI?s+=Kt:s>Math.PI&&(s-=Kt),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(At.setFromSpherical(this._spherical),At.applyQuaternion(this._quatInverse),t.copy(this.target).add(At),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=At.length();o=this._clampDistance(a*this._scale);let l=a-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let a=new R(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new R(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),o=At.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Tl.origin.copy(this.object.position),Tl.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Tl.direction))<vx?this.object.lookAt(this.target):(Zd.setFromNormalAndCoplanarPoint(this.object.up,this.target),Tl.intersectPlane(Zd,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>_h||8*(1-this._lastQuaternion.dot(this.object.quaternion))>_h||this._lastTargetPosition.distanceToSquared(this.target)>_h?(this.dispatchEvent($d),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Kt/60*this.autoRotateSpeed*e:Kt/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){At.setFromMatrixColumn(t,0),At.multiplyScalar(-e),this._panOffset.add(At)}_panUp(e,t){this.screenSpacePanning===!0?At.setFromMatrixColumn(t,1):(At.setFromMatrixColumn(t,0),At.crossVectors(this.object.up,At)),At.multiplyScalar(e),this._panOffset.add(At)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;At.copy(s).sub(this.target);let r=At.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=e-n.left,r=t-n.top,o=n.width,a=n.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Kt*this._rotateDelta.x/t.clientHeight),this._rotateUp(Kt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(Kt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-Kt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(Kt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-Kt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(n,s)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),s=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Kt*this._rotateDelta.x/t.clientHeight),this._rotateUp(Kt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new ee,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Mx(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function Sx(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function bx(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Jd),this.state=ct.NONE;break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function Ex(i){let e;switch(i.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case _n.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=ct.DOLLY;break;case _n.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ct.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ct.ROTATE}break;case _n.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ct.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ct.PAN}break;default:this.state=ct.NONE}this.state!==ct.NONE&&this.dispatchEvent(xh)}function Tx(i){switch(this.state){case ct.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case ct.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case ct.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function wx(i){this.enabled===!1||this.enableZoom===!1||this.state!==ct.NONE||(i.preventDefault(),this.dispatchEvent(xh),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(Jd))}function Ax(i){this.enabled!==!1&&this._handleKeyDown(i)}function Rx(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Pn.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=ct.TOUCH_ROTATE;break;case Pn.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=ct.TOUCH_PAN;break;default:this.state=ct.NONE}break;case 2:switch(this.touches.TWO){case Pn.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=ct.TOUCH_DOLLY_PAN;break;case Pn.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=ct.TOUCH_DOLLY_ROTATE;break;default:this.state=ct.NONE}break;default:this.state=ct.NONE}this.state!==ct.NONE&&this.dispatchEvent(xh)}function Cx(i){switch(this._trackPointer(i),this.state){case ct.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case ct.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case ct.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case ct.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=ct.NONE}}function Px(i){this.enabled!==!1&&i.preventDefault()}function Ix(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Lx(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var vn={first:{age:1,title:"Le Beleriand",name:"Premier \xC2ge \xB7 vers 450",date:"Vers 450 \xB7 Premier \xC2ge",feature:"Gondolin",desc:"Avant la submersion du Beleriand, les royaumes elfes font face \xE0 l\u2019ombre de Morgoth.",events:[["P. \xC2. 52","Fondation de Nargothrond."],["P. \xC2. 116","Ach\xE8vement de Gondolin, la cit\xE9 cach\xE9e."],["P. \xC2. 455","Dagor Bragollach : la Bataille de la Flamme Subite."],["Fin du P. \xC2.","La Guerre de la Col\xE8re entra\xEEne la submersion d\u2019une grande partie du Beleriand."]]},second:{age:2,title:"L\u2019essor de N\xFAmenor",name:"Deuxi\xE8me \xC2ge \xB7 vers 1600",date:"Vers 1600 \xB7 Deuxi\xE8me \xC2ge",feature:"Armenelos",desc:"N\xFAmenor domine les mers. En Terre du Milieu, l\u2019art des Anneaux vient de changer le destin du monde.",events:[["D. \xC2. 32","Les Edain s\u2019\xE9tablissent \xE0 N\xFAmenor."],["D. \xC2. 750","Fondation du royaume d\u2019Eregion."],["Vers 1600","Sauron forge l\u2019Anneau Unique en secret."],["D. \xC2. 3319","La Submersion de N\xFAmenor transforme le monde."]]},hobbit:{age:3,title:"La qu\xEAte d\u2019Erebor",name:"Troisi\xE8me \xC2ge \xB7 2941",date:"2941 \xB7 Troisi\xE8me \xC2ge",feature:"LonelyMountain",desc:"Une compagnie de treize Nains et un Hobbit prend la route de la Montagne Solitaire.",events:[["Printemps","Bilbo quitte Cul-de-Sac avec Thorin et sa compagnie."],["\xC9t\xE9","Au-del\xE0 des Monts Brumeux, Bilbo trouve l\u2019Anneau."],["Automne","La compagnie atteint la Montagne Solitaire."],["Fin d\u2019ann\xE9e","Mort de Smaug et Bataille des Cinq Arm\xE9es."]]},lotr:{age:3,title:"La Guerre de l\u2019Anneau",name:"Troisi\xE8me \xC2ge \xB7 3018",date:"3018 \xB7 Troisi\xE8me \xC2ge",feature:"Rivendell",desc:"\xC0 la fin du Troisi\xE8me \xC2ge, les chemins de la Terre du Milieu convergent vers Fondcombe.",events:[["23 sept. 3018","Frodon quitte Cul-de-Sac."],["25 oct. 3018","Le Conseil d\u2019Elrond d\xE9cide du sort de l\u2019Anneau."],["25 d\xE9c. 3018","La Communaut\xE9 quitte Fondcombe."],["25 mars 3019","Destruction de l\u2019Anneau et chute de Sauron."]]},fourth:{age:3,title:"Le Royaume R\xE9unifi\xE9",name:"Quatri\xE8me \xC2ge \xB7 vers 120",date:"Vers 120 \xB7 Quatri\xE8me \xC2ge",feature:"MinasTirith",desc:"Le temps des Hommes succ\xE8de aux grandes l\xE9gendes. Le Gondor et l\u2019Arnor sont de nouveau r\xE9unis.",events:[["D\xE9but du Q. \xC2.","Elessar r\xE8gne sur le Royaume R\xE9unifi\xE9."],["Q. \xC2. 6","La Comt\xE9 est prot\xE9g\xE9e des incursions des Hommes."],["Q. \xC2. 120","Mort d\u2019Aragorn ; Eldarion lui succ\xE8de."],["Q. \xC2. 120","Selon la tradition, Legolas et Gimli quittent la Terre du Milieu."]]}},er={Hobbiton:{name:"Hobbitebourg",sub:"Au c\u0153ur de la Comt\xE9",region:"La Comt\xE9",pano:"shire",kind:"Village hobbit",text:"Des portes rondes, des jardins bien tenus et des collines paisibles. Le village de Bilbo et Frodon est le point de d\xE9part de deux voyages qui changeront le monde."},BagEnd:{name:"Cul-de-Sac",sub:"La maison sous la colline",region:"La Comt\xE9",pano:"shire",kind:"Demeure hobbit",text:"Sur la colline de Hobbitebourg, la confortable demeure des Sacquet abrite cartes, souvenirs et promesses d\u2019aventure."},Rivendell:{name:"Fondcombe",sub:"Imladris \xB7 La vall\xE9e fendue",region:"Eriador",pano:"rivendell",kind:"Refuge elfique",text:"Cach\xE9e au creux d\u2019une vall\xE9e des Monts Brumeux, la demeure d\u2019Elrond accueille voyageurs et r\xE9cits anciens. C\u2019est ici que se forme la Communaut\xE9 de l\u2019Anneau."},MountDoom:{name:"Montagne du Destin",sub:"Orodruin \xB7 La montagne de feu",region:"Mordor",pano:"mordor",kind:"Volcan",text:"Au c\u0153ur du pays de l\u2019Ombre, les feux de l\u2019Orodruin ont servi \xE0 forger l\u2019Anneau Unique. Seuls ces m\xEAmes feux peuvent le d\xE9truire."},Bree:{name:"Bree",sub:"Au croisement des routes",region:"Eriador",kind:"Cit\xE9 des Hommes",text:"Hommes et Hobbits cohabitent dans cette petite ville entour\xE9e d\u2019une haie. L\u2019auberge du Poney Fringant offre un refuge aux voyageurs."},Weathertop:{name:"Mont Venteux",sub:"Amon S\xFBl",region:"Eriador",kind:"Ruines",text:"Les vestiges d\u2019une tour de guet de l\u2019Arnor dominent la Grande Route de l\u2019Est. C\u2019est sur cette hauteur que Frodon affronte les Nazg\xFBl."},CarasGaladhon:{name:"Caras Galadhon",sub:"La cit\xE9 des arbres",region:"Lothl\xF3rien",kind:"Cit\xE9 elfique",text:"Au c\u0153ur des mallornes de la L\xF3rien, les demeures des Galadhrim s\u2019\xE9l\xE8vent dans les branches. Galadriel et Celeborn y accueillent la Communaut\xE9."},MinasTirith:{pano:"minastirith",name:"Minas Tirith",sub:"La Cit\xE9 Blanche",region:"Gondor",kind:"Capitale",text:"Sept niveaux de pierre blanche s\u2019adossent au mont Mindolluin. Capitale du Gondor, la cit\xE9 devient le si\xE8ge du roi Elessar apr\xE8s la Guerre de l\u2019Anneau."},Osgiliath:{name:"Osgiliath",sub:"La citadelle des \xE9toiles",region:"Gondor",kind:"Ancienne capitale",text:"B\xE2tie sur les deux rives de l\u2019Anduin, l\u2019ancienne capitale du Gondor commande un passage strat\xE9gique entre l\u2019Est et l\u2019Ouest."},HelmsDeep:{name:"Gouffre de Helm",sub:"La forteresse du Hornburg",region:"Rohan",kind:"Forteresse",text:"Adoss\xE9e aux Montagnes Blanches, cette forteresse prot\xE8ge l\u2019entr\xE9e d\u2019une gorge. Th\xE9oden y rassemble les siens face aux arm\xE9es de l\u2019Isengard."},Edoras:{name:"Edoras",sub:"Meduseld \xB7 Le palais d\u2019or",region:"Rohan",kind:"Capitale",text:"Sur une colline des plaines du Rohan, le palais d\u2019or de Meduseld domine la cit\xE9 des Rohirrim et les tertres de leurs rois."},LonelyMountain:{name:"Erebor",sub:"La Montagne Solitaire",region:"Rhovanion",kind:"Royaume nain",text:"Sous la Montagne Solitaire, les Nains ont taill\xE9 un vaste royaume. Occup\xE9e par Smaug avant la qu\xEAte de Thorin, Erebor retrouve ensuite sa splendeur."},Dale:{name:"Dale",sub:"Au pied d\u2019Erebor",region:"Rhovanion",kind:"Cit\xE9 des Hommes",text:"La cit\xE9 des Hommes s\u2019\xE9tend au pied de la Montagne Solitaire. D\xE9truite par Smaug, elle rena\xEEt apr\xE8s les \xE9v\xE9nements du Hobbit."},LakeTown:{name:"Lacville",sub:"Esgaroth",region:"Rhovanion",kind:"Cit\xE9 lacustre",text:"Des maisons de bois sur pilotis s\u2019avancent au-dessus du Long Lac. Le commerce lie cette ville aux Elfes de la for\xEAt et aux terres du Nord."},ElvenkingsHalls:{name:"Palais de Thranduil",sub:"Le Royaume Sylvestre",region:"For\xEAt Noire",kind:"Palais elfique",text:"Dans les cavernes du nord de la grande for\xEAt, le roi Thranduil veille sur son peuple. Les compagnons de Bilbo y sont retenus prisonniers."},GreyHavens:{name:"Havres Gris",sub:"Mithlond",region:"Lindon",kind:"Port elfique",text:"Au fond du golfe de Lh\xFBn, les navires de C\xEDrdan attendent ceux qui partiront vers l\u2019Ouest. La mer marque ici la fin de nombreux chemins."},GoblinTown:{name:"Gobelinville",sub:"Sous les Monts Brumeux",region:"Monts Brumeux",kind:"Cavernes",text:"Un r\xE9seau de tunnels traverse les montagnes. Captur\xE9s par les Gobelins, Bilbo et les Nains y d\xE9couvrent un passage aussi dangereux qu\u2019inattendu."},FornostErain:{name:"Fornost",sub:"La forteresse du Nord",region:"Arnor",kind:"Ruines",text:"Ancienne cit\xE9 des rois de l\u2019Arthedain, Fornost garde la m\xE9moire du royaume du Nord et de sa lutte contre l\u2019Angmar."},Moria:{name:"Moria",sub:"Khazad-d\xFBm",region:"Monts Brumeux",kind:"Royaume nain",text:"Des salles immenses et des puits sans fond s\u2019\xE9tendent sous les montagnes. L\u2019ancien royaume nain est devenu un lieu d\u2019ombre, de silence et de p\xE9ril."},Isengard:{name:"Isengard",sub:"Orthanc",region:"Nan Curun\xEDr",kind:"Forteresse",text:"Un cercle de pierre entoure la tour d\u2019Orthanc, \xE0 l\u2019extr\xE9mit\xE9 sud des Monts Brumeux. Saroumane en fait le centre de sa puissance."},BaradDur:{name:"Barad-d\xFBr",sub:"La Tour Sombre",region:"Mordor",kind:"Forteresse",text:"La forteresse de Sauron domine le plateau de Gorgoroth. Sa puissance est li\xE9e \xE0 celle de l\u2019Anneau Unique."},Gondolin:{pano:"gondolin",name:"Gondolin",sub:"La cit\xE9 cach\xE9e de Turgon",region:"Beleriand",kind:"Cit\xE9 elfique",text:"Prot\xE9g\xE9e par les Montagnes de l\u2019Encerclement, Gondolin demeure longtemps cach\xE9e aux yeux de Morgoth. Ses tours blanches rappellent la beaut\xE9 de Tirion."},Menegroth:{name:"Menegroth",sub:"Les Mille Cavernes",region:"Doriath",kind:"Cit\xE9 elfique",text:"Dans les profondeurs du Doriath, Thingol et Melian r\xE8gnent sur les Mille Cavernes, fa\xE7onn\xE9es avec l\u2019aide des artisans nains."},Nargothrond:{name:"Nargothrond",sub:"Les cavernes du Narog",region:"Beleriand",kind:"Cit\xE9 elfique",text:"Finrod Felagund fonde ce royaume souterrain sur les rives du Narog. Son histoire se m\xEAle \xE0 celles de Beren, de T\xFArin et de Glaurung."},Himring:{name:"Himring",sub:"La colline toujours froide",region:"Beleriand oriental",kind:"Forteresse",text:"Sur cette hauteur, Maedhros garde les marches de l\u2019Est. La colline survivra \xE0 la fin du Beleriand sous la forme d\u2019une \xEEle."},Thangorodrim:{name:"Thangorodrim",sub:"Les pics de l\u2019oppression",region:"Angband",kind:"Sommets volcaniques",text:"Trois pics gigantesques s\u2019\xE9l\xE8vent au-dessus de la forteresse d\u2019Angband. Ils signalent la pr\xE9sence de Morgoth dans le Grand Nord."},Armenelos:{pano:"numenor",name:"Armenelos",sub:"La cit\xE9 des rois",region:"N\xFAmenor",kind:"Capitale",text:"\xC0 l\u2019int\xE9rieur des terres de l\u2019\xEEle de N\xFAmenor, Armenelos est la demeure des rois. La cit\xE9 se trouve \xE0 l\u2019est du Meneltarma."},Meneltarma:{name:"Meneltarma",sub:"Le Pilier du Ciel",region:"N\xFAmenor",kind:"Montagne sacr\xE9e",text:"Au centre de N\xFAmenor, le Meneltarma s\u2019\xE9l\xE8ve au-dessus des cinq p\xE9ninsules de l\u2019\xEEle. Son sommet est un lieu de silence et de recueillement."},Andunie:{name:"And\xFAni\xEB",sub:"Le port de l\u2019Ouest",region:"N\xFAmenor",kind:"Port",text:"Ce port occidental regarde vers les Terres Immortelles. Les seigneurs d\u2019And\xFAni\xEB sont les anc\xEAtres d\u2019Elendil et de la lign\xE9e des rois du Gondor."},Romenna:{name:"R\xF3menna",sub:"Le port de l\u2019Est",region:"N\xFAmenor",kind:"Port",text:"Les navires de N\xFAmenor partent de ce grand port oriental vers les c\xF4tes de la Terre du Milieu."},OstInEdhil:{name:"Ost-in-Edhil",sub:"La cit\xE9 des forgerons",region:"Eregion",kind:"Cit\xE9 elfique",text:"La cit\xE9 de Celebrimbor et des forgerons elfes se trouve \xE0 l\u2019ouest de Khazad-d\xFBm. Au Deuxi\xE8me \xC2ge, l\u2019art des Anneaux y atteint son apog\xE9e."}},yh=[{id:"Hobbiton",eras:["hobbit","lotr","fourth"],asset:"shire",name:"Hobbitebourg",region:"LA COMT\xC9 \xB7 TERRES DE L\u2019OUEST",sub:"Les collines o\xF9 commencent les plus grands voyages."},{id:"Rivendell",eras:["hobbit","lotr","fourth"],asset:"rivendell",name:"Fondcombe",region:"IMLADRIS \xB7 LES MONTS BRUMEUX",sub:"Un refuge de lumi\xE8re, entre les montagnes et les chutes d\u2019eau."},{id:"MountDoom",eras:["second","hobbit","lotr"],asset:"mordor",name:"La Montagne du Destin",region:"ORODRUIN \xB7 LE MORDOR",sub:"\xC0 l\u2019horizon des terres de cendre, les feux de l\u2019Anneau."},{id:"MinasTirith",asset:"minastirith",eras:["hobbit","lotr","fourth"],name:"Minas Tirith",region:"LA CIT\xC9 BLANCHE \xB7 LE GONDOR",sub:"Sept cercles de pierre blanche au pied du Mindolluin."},{id:"Gondolin",asset:"gondolin",eras:["first"],name:"Gondolin",region:"LA CIT\xC9 CACH\xC9E \xB7 PREMIER \xC2GE",sub:"Les tours de Turgon, au c\u0153ur des montagnes de l\u2019Encerclement."},{id:"Armenelos",asset:"numenor",eras:["second"],name:"Armenelos",region:"N\xDAMENOR \xB7 DEUXI\xC8ME \xC2GE",sub:"La splendeur de l\u2019\xEEle des rois, sous le regard du Meneltarma."}],wl=[{id:"fellowship",name:"La Communaut\xE9 de l\u2019Anneau",tag:"LE SEIGNEUR DES ANNEAUX",desc:"De la douceur de la Comt\xE9 aux feux du Mordor. Suivez Frodon, puis le chemin de la Communaut\xE9 jusqu\u2019\xE0 sa s\xE9paration.",eras:["lotr"],places:["Hobbiton","Bree","Weathertop","Rivendell","Moria","CarasGaladhon","Argonath","AmonHen","MountDoom"],note:"Parcours r\xE9sum\xE9 \xB7 apr\xE8s Amon Hen : chemin de Frodon"},{id:"bilbo",name:"Un voyage inattendu",tag:"LE HOBBIT",desc:"En compagnie de Bilbo, traversez les Monts Brumeux, la For\xEAt Noire et le Long Lac pour retrouver Erebor.",eras:["hobbit","lotr"],places:["Hobbiton","Rivendell","GoblinTown","BeornsHall","ElvenkingsHalls","LakeTown","LonelyMountain"],note:"Parcours r\xE9sum\xE9 \xB7 de Cul-de-Sac \xE0 Erebor"},{id:"beleriand",name:"Les royaumes perdus",tag:"LE SILMARILLION",desc:"Un itin\xE9raire de d\xE9couverte \xE0 travers les grandes cit\xE9s elfes du Beleriand, avant leur disparition.",eras:["first"],places:["Nargothrond","Menegroth","Gondolin","Himring"],note:"Circuit de d\xE9couverte \xB7 itin\xE9raire \xE9ditorial"},{id:"numenor",name:"L\u2019\xEEle des rois",tag:"DEUXI\xC8ME \xC2GE",desc:"Des ports d\u2019And\xFAni\xEB et de R\xF3menna au Meneltarma, explorez les terres des D\xFAnedain.",eras:["second"],places:["Andunie","Meneltarma","Armenelos","Romenna"],note:"Circuit de d\xE9couverte \xB7 itin\xE9raire \xE9ditorial"},{id:"reunited",name:"Les terres d\u2019Elessar",tag:"QUATRI\xC8ME \xC2GE",desc:"Les cit\xE9s du Sud et les terres du Nord dessinent l\u2019horizon du Royaume R\xE9unifi\xE9.",eras:["fourth"],places:["MinasTirith","Osgiliath","Bree","FornostErain"],note:"Circuit de d\xE9couverte \xB7 itin\xE9raire \xE9ditorial"}];var fo=new R;function Mn(i,e,t,n,s,r){let o=2*Math.PI*s/4,a=Math.max(r-2*s,0),l=Math.PI/4;fo.copy(e),fo[n]=0,fo.normalize();let c=.5*o/(o+a),h=1-fo.angleTo(i)/l;return Math.sign(fo[t])===1?h*c:a/(o+a)+c+c*(1-h)}var Al=class i extends kn{constructor(e=1,t=1,n=1,s=2,r=.1){let o=s*2+1;if(r=Math.min(e/2,t/2,n/2,r),super(1,1,1,o,o,o),this.type="RoundedBoxGeometry",this.parameters={width:e,height:t,depth:n,segments:s,radius:r},o===1)return;let a=this.toNonIndexed();this.index=null,this.attributes.position=a.attributes.position,this.attributes.normal=a.attributes.normal,this.attributes.uv=a.attributes.uv;let l=new R,c=new R,h=new R(e,t,n).divideScalar(2).subScalar(r),u=this.attributes.position.array,f=this.attributes.normal.array,d=this.attributes.uv.array,g=u.length/6,_=new R,m=.5/o;for(let p=0,M=0;p<u.length;p+=3,M+=2)switch(l.fromArray(u,p),c.copy(l),c.x-=Math.sign(c.x)*m,c.y-=Math.sign(c.y)*m,c.z-=Math.sign(c.z)*m,c.normalize(),u[p+0]=h.x*Math.sign(l.x)+c.x*r,u[p+1]=h.y*Math.sign(l.y)+c.y*r,u[p+2]=h.z*Math.sign(l.z)+c.z*r,f[p+0]=c.x,f[p+1]=c.y,f[p+2]=c.z,Math.floor(p/g)){case 0:_.set(1,0,0),d[M+0]=Mn(_,c,"z","y",r,n),d[M+1]=1-Mn(_,c,"y","z",r,t);break;case 1:_.set(-1,0,0),d[M+0]=1-Mn(_,c,"z","y",r,n),d[M+1]=1-Mn(_,c,"y","z",r,t);break;case 2:_.set(0,1,0),d[M+0]=1-Mn(_,c,"x","z",r,e),d[M+1]=Mn(_,c,"z","x",r,n);break;case 3:_.set(0,-1,0),d[M+0]=1-Mn(_,c,"x","z",r,e),d[M+1]=1-Mn(_,c,"z","x",r,n);break;case 4:_.set(0,0,1),d[M+0]=1-Mn(_,c,"x","y",r,e),d[M+1]=1-Mn(_,c,"y","x",r,t);break;case 5:_.set(0,0,-1),d[M+0]=Mn(_,c,"x","y",r,e),d[M+1]=1-Mn(_,c,"y","x",r,t);break}}static fromJSON(e){return new i(e.width,e.height,e.depth,e.segments,e.radius)}};var hn={Rivendell:{title:"La demeure d\u2019Elrond",culture:"Architecture elfique",maker:"elven",height:60,details:["Arches \xE9lanc\xE9es","Toitures de cuivre patin\xE9","Galeries ouvertes"],text:"Des pavillons de pierre claire, des passerelles et des fl\xE8ches fines \xE9pousent les terrasses de la vall\xE9e. Une interpr\xE9tation architecturale de Fondcombe."},Hobbiton:{title:"Les maisons de la Colline",culture:"Habitat hobbit",maker:"shire",height:25,details:["Portes rondes","Toits v\xE9g\xE9talis\xE9s","Jardins en terrasses"],text:"Des maisons blotties dans les collines, ponctu\xE9es de chemin\xE9es, de fen\xEAtres rondes et de petits jardins. Le paysage devient l\u2019architecture."},MinasTirith:{title:"Les sept cercles de Minas Tirith",culture:"Architecture du Gondor",maker:"minas",height:90,details:["Sept enceintes","Promontoire de pierre","Tour de la Citadelle"],text:"Sept terrasses fortifi\xE9es montent vers la Citadelle. La grande avanc\xE9e rocheuse traverse les remparts, au-dessus de la porte de la Cit\xE9 Blanche."},Isengard:{title:"La tour d\u2019Orthanc",culture:"Pierre noire du Gondor",maker:"orthanc",height:95,details:["Quatre piliers de pierre","Couronne \xE0 quatre pointes","Enceinte circulaire"],text:"Quatre puissants piliers noirs se rejoignent sous une couronne de pointes. La silhouette d\u2019Orthanc se d\xE9tache au centre de l\u2019enceinte de l\u2019Isengard."},BaradDur:{title:"La Tour Sombre",culture:"Forteresse du Mordor",maker:"dark",height:115,details:["Contreforts massifs","Couronne de pointes","Pierre volcanique"],text:"Des contreforts et des \xE9tages de pierre sombre s\u2019empilent en une silhouette hostile. Une interpr\xE9tation de la forteresse de Sauron avant sa destruction."},Edoras:{title:"Meduseld, le palais d\u2019or",culture:"Architecture du Rohan",maker:"rohan",height:42,details:["Grande halle de bois","Toiture dor\xE9e","Pignons sculpt\xE9s"],text:"Une grande halle domine la colline d\u2019Edoras. Ses charpentes, son toit dor\xE9 et ses pignons \xE9lanc\xE9s \xE9voquent le savoir-faire des Rohirrim."},HelmsDeep:{title:"Le fort de Helm",culture:"Fortifications du Rohan",maker:"fort",height:42,details:["Mur du Gouffre","Tour du Cor","Remparts cr\xE9nel\xE9s"],text:"Un rempart barre la gorge et rejoint la Tour du Cor. Les diff\xE9rentes hauteurs de murs rendent lisibles les lignes de d\xE9fense."},Moria:{title:"Les Portes de Durin",culture:"Ouvrage nain de Khazad-d\xFBm",maker:"dwarf",height:42,details:["Fa\xE7ade taill\xE9e dans la roche","Piliers monumentaux","Porte \xE0 double vantail"],text:"Le portail de pierre et ses piliers soulignent l\u2019entr\xE9e du royaume souterrain. Le mod\xE8le repr\xE9sente le seuil de la Moria, et non l\u2019ensemble de ses salles."},LonelyMountain:{title:"La Porte d\u2019Erebor",culture:"Architecture naine",maker:"dwarf",height:45,details:["Contreforts de pierre","Porte monumentale","Motifs g\xE9om\xE9triques"],text:"Une porte massive encadr\xE9e de piliers \xE9merge du flanc rocheux d\u2019Erebor. Les lignes droites et les proportions lourdes expriment l\u2019architecture naine."},GreyHavens:{title:"Les quais de Mithlond",culture:"Port elfique du Lindon",maker:"haven",height:43,details:["Quais de pierre","Tours de guet","Navires effil\xE9s"],text:"Un ensemble de tours, de quais et de navires dessine l\u2019ouverture vers l\u2019Ouest. Les voiles et les toitures reprennent les courbes des \xE9difices elfiques."},CarasGaladhon:{title:"Les demeures des Galadhrim",culture:"Architecture de Lothl\xF3rien",maker:"treecity",height:76,details:["Plateformes dans les arbres","Passerelles suspendues","Canop\xE9e dor\xE9e"],text:"Des plateformes et de fines passerelles entourent les troncs des grands arbres. La lumi\xE8re des feuillages dor\xE9s enveloppe les habitations."},Gondolin:{title:"Les tours de la cit\xE9 cach\xE9e",culture:"Architecture des Noldor",maker:"gondolin",height:78,details:["Enceintes de pierre blanche","Tours \xE9lanc\xE9es","Fl\xE8ches argent\xE9es"],text:"Une cit\xE9 de pierre blanche s\u2019organise autour de tours fines. Cette maquette est une interpr\xE9tation des formes de Gondolin, au Premier \xC2ge."},Menegroth:{title:"L\u2019entr\xE9e des Mille Cavernes",culture:"Palais du Doriath",maker:"dwarf",height:40,details:["Galeries sous la roche","Piliers sculpt\xE9s","Seuil monumental"],text:"Un seuil monumental s\u2019ouvre dans la roche du Doriath. La maquette \xE9voque l\u2019acc\xE8s aux Mille Cavernes, sans pr\xE9tendre en reconstituer les int\xE9rieurs."},Nargothrond:{title:"Les portes du Narog",culture:"Royaume de Finrod",maker:"dwarf",height:41,details:["Fa\xE7ade dans la roche","Galeries de pierre","Portes profondes"],text:"Un ouvrage de pierre s\u2019inscrit dans le relief. L\u2019architecture souligne ici la relation du royaume souterrain avec les falaises du Narog."},Armenelos:{title:"Le palais des rois de N\xFAmenor",culture:"Architecture n\xFAmen\xF3r\xE9enne",maker:"numenor",height:70,details:["Terrasses de calcaire","Coupoles azur\xE9es","Colonnades"],text:"Un palais de pierre claire, des cours et des coupoles bleues composent une \xE9vocation de la splendeur de N\xFAmenor. Interpr\xE9tation artistique, sans plan canonique."},Andunie:{title:"Les quais d\u2019And\xFAni\xEB",culture:"Port de N\xFAmenor",maker:"haven",height:43,details:["Quais de pierre","Pavillons du port","M\xE2ts et voiles"],text:"Le port occidental de N\xFAmenor prend forme autour de ses quais et de ses pavillons. Une \xE9vocation architecturale du lien entre l\u2019\xEEle et la mer."},OstInEdhil:{title:"Les ateliers d\u2019Eregion",culture:"Architecture des forgerons elfes",maker:"elven",height:60,details:["Galeries de pierre","Pavillons \xE0 fl\xE8ches","Cours ouvertes"],text:"Des galeries et des pavillons de pierre \xE9voquent la cit\xE9 des forgerons d\u2019Eregion. Au Troisi\xE8me \xC2ge, le mod\xE8le laisse place \xE0 des vestiges."}},Rl=new Map,ef=new Set,Sn;function Dx(i=42){return()=>{i|=0,i=i+1831565813|0;let e=Math.imul(i^i>>>15,1|i);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function vh(i="stone"){if(typeof document>"u")return null;let e=document.createElement("canvas");e.width=e.height=256;let t=e.getContext("2d"),n=Dx(i==="roof"?114:i==="wood"?17:991);if(i==="roof"){t.fillStyle="#40746a",t.fillRect(0,0,256,256);for(let r=-16;r<256;r+=16)for(let o=-32;o<256;o+=32){let a=55+n()*25;t.fillStyle=`rgb(${a},${a+42},${a+30})`,t.fillRect(o+(r%32?16:0)+.6,r+.6,30.8,14.8),t.strokeStyle="#91a98c55",t.strokeRect(o+(r%32?16:0)+.5,r+.5,31,15)}}else if(i==="wood"){t.fillStyle="#9a7851",t.fillRect(0,0,256,256);for(let r=0;r<256;r+=3){t.strokeStyle=`rgba(52,35,16,${.1+n()*.18})`,t.beginPath(),t.moveTo(r,0);for(let o=0;o<260;o+=12)t.lineTo(r+Math.sin(o*.05+r)*1.2,o);t.stroke()}for(let r=0;r<256;r+=32)t.fillStyle="#473b2944",t.fillRect(r,0,1,256)}else{t.fillStyle="#c9c4ac",t.fillRect(0,0,256,256);for(let r=0;r<256;r+=16)for(let o=-40;o<256;o+=40){let a=214+n()*31;t.fillStyle=`rgb(${a},${a-3},${a-13})`,t.fillRect(o+(r%32?20:0)+.7,r+.6,38.8,14.8)}for(let r=0;r<60;r++)t.fillStyle="#8990750b",t.fillRect(n()*256,n()*256,2+n()*8,5+n()*24)}for(let r=0;r<6e3;r++)t.fillStyle=n()>.5?"#fff2":"#241c1209",t.fillRect(n()*256,n()*256,1,1);let s=new Fr(e);return s.colorSpace=vt,s.wrapS=s.wrapT=vi,s.anisotropy=4,s}function bt(){if(Sn)return Sn;let i=vh(),e=(t,n=.85,s=0)=>new Hn({color:t,roughness:n,metalness:s});if(Sn={stone:e("#e4ddc6"),ivory:e("#f1ead8"),shade:e("#bdbda5"),roof:e("#356d66",.57,.35),gold:e("#bc9d58",.44,.65),silver:e("#b9d0c6",.45,.6),wood:e("#79543b"),darkwood:e("#463b2c"),grass:e("#6e8650"),leaf:e("#647d4b"),autumn:e("#b8a14e"),rock:e("#899080"),black:e("#202a2a",.32,.48),dark:e("#3e4540"),water:e("#6ba8a0",.3,.3),door:e("#456943"),soil:e("#a69b73"),cloth:e("#e0d9bd"),glow:new Hn({color:"#f6d391",emissive:"#e5aa49",emissiveIntensity:1.15,roughness:.4})},i){for(let s of["stone","ivory","shade"])Sn[s].map=i,Sn[s].bumpMap=i,Sn[s].bumpScale=.08;let t=vh("roof"),n=vh("wood");Sn.roof.map=t,Sn.roof.bumpMap=t,Sn.roof.bumpScale=.08,Sn.wood.map=n,Sn.darkwood.map=n}return Sn}function Mh(i,e){return Rl.has(i)||(Rl.set(i,e()),ef.add(Rl.get(i))),Rl.get(i)}function Dt(i,e,t,n=0,s=0,r=0,o=0){let a=new Mt(e,t);return a.position.set(n,s,r),a.rotation.y=o,a.castShadow=!0,a.receiveShadow=!0,i.add(a),a}function Ie(i,e,t,n,s,r,o,a,l=0){let c=Mh(`b:${s}:${r}:${o}`,()=>Math.min(s,r,o)>1.4?new Al(s,r,o,1,Math.min(.18,Math.min(s,r,o)*.055)):new kn(s,r,o));return Dt(i,c,a,e,t+r/2,n,l)}function et(i,e,t,n,s,r,o,a,l=16){return Dt(i,Mh(`c:${s}:${r}:${o}:${l}`,()=>new Fs(s,r,o,l)),a,e,t+o/2,n)}function jt(i,e,t,n,s,r,o,a){let l=a===bt().leaf||a===bt().autumn,c=Mh(l?"organic-canopy":"sphere",()=>{let u=new ks(1,l?18:20,l?12:14);if(l){let f=u.attributes.position;for(let d=0;d<f.count;d++){let g=f.getX(d),_=f.getY(d),m=f.getZ(d),p=1+.065*Math.sin(g*14+m*8)*Math.cos(_*11)+.035*Math.cos(m*17);f.setXYZ(d,g*p,_*p,m*p)}u.computeVertexNormals()}return u}),h=Dt(i,c,a,e,t,n);return h.scale.set(s,r,o),h}function mo(i,e,t,n,s,r,o,a,l=0,c=Math.PI*2){let h=new Jt;h.absarc(0,0,s,l,l+c,!1),h.absarc(0,0,s-r,l+c,l,!0),h.closePath();let u=new bi(h,{depth:o,bevelEnabled:!0,bevelSize:.3,bevelThickness:.3,bevelSegments:1,curveSegments:28});return u.rotateX(-Math.PI/2),Dt(i,u,a,e,t,n)}function go(i,e,t,n,s,r,o,a){let l=new Jt;l.moveTo(-s/2,0),l.lineTo(-s/2,r-s*.5),l.quadraticCurveTo(-s/2,r,0,r+s*.12),l.quadraticCurveTo(s/2,r,s/2,r-s*.5),l.lineTo(s/2,0),l.closePath();let c=new Xi,h=s*.31;c.moveTo(-h,0),c.lineTo(h,0),c.lineTo(h,r-s*.55),c.quadraticCurveTo(h,r-s*.12,0,r-s*.04),c.quadraticCurveTo(-h,r-s*.12,-h,r-s*.55),c.closePath(),l.holes.push(c);let u=new bi(l,{depth:o,bevelEnabled:!0,bevelThickness:.15,bevelSize:.15,bevelSegments:1,curveSegments:7});return Dt(i,u,a,e,t,n)}function Pi(i,e,t,n,s,r,o){let a=[new ee(0,0),new ee(s*1.04,0),new ee(s*.94,r*.12),new ee(s*.57,r*.38),new ee(s*.24,r*.75),new ee(.12,r)];return Dt(i,new Kr(a,24),o,e,t,n)}function po(i,e,t,n=12,s=!1){let r=bt();et(i,e,0,t,.8,1.3,n*.65,r.wood,7),jt(i,e,n*.68,t,n*.3,n*.36,n*.3,s?r.autumn:r.leaf),jt(i,e-n*.2,n*.55,t+n*.1,n*.23,n*.25,n*.22,s?r.autumn:r.leaf)}function Cl(i,e,t,n,s,r,o,a){let l=new Jt;l.moveTo(-s*.55,0),l.quadraticCurveTo(-s*.25,o*.3,0,o),l.quadraticCurveTo(s*.25,o*.3,s*.55,0),l.closePath();let c=new bi(l,{depth:r+2,bevelEnabled:!1}),h=Dt(i,c,a,e,t,n-r/2-1),u=bt();Ie(i,e,t+o-.1,n,.22,.25,r+3,u.gold);for(let f=0;f<9;f++){let d=n-r/2+f*r/8,g=new yt().setFromPoints([new R(e-s*.55,t+.1,d),new R(e-s*.25,t+o*.3,d),new R(e,t+o,d),new R(e+s*.25,t+o*.3,d),new R(e+s*.55,t+.1,d)]);i.add(new Wi(g,new ni({color:7049600,transparent:!0,opacity:.6})))}return h}function Ux(i,e,t,n,s,r,o,a){let l=bt();for(let c=0;c<o;c++){let h=e-s/2+(c+.5)*s/o,u=s/o*.33;Ie(i,h,t,n,u,r,.2,l.dark),Ie(i,h,t+.2,n+.14,u*.68,r*.8,.16,a),Ie(i,h,t,n+.28,.12,r,.18,l.gold),Ie(i,h,t+r*.55,n+.28,u,.12,.18,l.gold);let f=new Jt;f.moveTo(-u*.5,0),f.quadraticCurveTo(-u*.48,u*.65,0,u),f.quadraticCurveTo(u*.48,u*.65,u*.5,0),f.closePath(),Dt(i,new Ei(f),l.glow,h,t+r,n+.12)}}function nr(i,e,t,n=30,s=3.2){let r=bt();et(i,e,0,t,s*1.1,s*1.35,2,r.shade),et(i,e,2,t,s*.83,s,n,r.ivory,24);for(let o=0;o<4;o++){let a=2+o*n/4;et(i,e,a,t,s*(1-o*.035),s*(1-o*.035),.19,r.shade,24)}et(i,e,n*.68,t,s*1.35,s*1.35,.7,r.gold);for(let o=0;o<6;o++){let a=o*Math.PI/3,l=Ie(i,e+Math.cos(a)*s*.82,n*.4,t+Math.sin(a)*s*.82,.4,n*.6,.4,r.stone);l.rotation.y=a;let c=Ie(i,e+Math.cos(a)*s*.85,n*.53,t+Math.sin(a)*s*.85,.7,n*.16,.18,r.glow);c.rotation.y=-a+Math.PI/2}Pi(i,e,n+2,t,s*1.45,n*.62,r.roof),Pi(i,e,n*1.62+1,t,.45,4,r.gold)}function Pl(i,e,t,n,s,r,o){Ie(i,e,0,t,n,r,s,o.stone),Ux(i,e,r*.45,t+s/2+.1,n,r*.32,Math.max(3,Math.floor(n/4)),o.glow),Cl(i,e,r,t,n,s,r*.65,o.roof);for(let a of[-n*.45,n*.45])et(i,e+a,0,t+s*.6,.45,.65,r*.9,o.ivory,8),Pi(i,e+a,r*.9,t+s*.6,.8,6,o.silver)}function Nx(i){let e=bt();et(i,0,-3,0,25,31,3,e.rock,32),et(i,0,0,0,22,25,2,e.shade,32),Pl(i,-4,0,16,11,12,e),Pl(i,12,-7,10,9,10,e),nr(i,-16,-8,28,3),nr(i,9,6,24,2.5),nr(i,17,-11,22,2.2);for(let t=0;t<5;t++)go(i,-17+t*8,3,18,8,8,2,e.stone);Ie(i,-1,12,19,42,1.4,6,e.ivory);for(let t=0;t<13;t++)Ie(i,-21+t*3.3,13.4,16,.4,2,.4,e.silver),Ie(i,-21+t*3.3,13.4,22,.4,2,.4,e.silver);Ie(i,-1,15.2,16,42,.25,.3,e.gold),Ie(i,-1,15.2,22,42,.25,.3,e.gold),po(i,-22,1,17,!0),po(i,18,13,14,!0),po(i,-11,-17,13)}function Fx(i){let e=bt();et(i,0,-3,0,28,30,3,e.soil,32),jt(i,-8,5,-4,16,9,15,e.grass),jt(i,12,3,4,13,7,12,e.grass);for(let[t,n,s]of[[-9,7,1],[12,13,.8],[-16,-3,.65],[7,-8,.7]]){let r=Dt(i,new ii(5*s,20),e.ivory,t,3*s,n);r.scale.y=.85;let o=Dt(i,new ii(2*s,20),e.door,t,2.1*s,n+.14);et(i,t-3*s,8*s,n-5*s,1,1,5*s,e.stone,8);for(let a of[-3.4,3.4])Dt(i,new ii(.85*s,12),e.glow,t+a*s,3.5*s,n+.17);Ie(i,t+1*s,1.9*s,n+.3,.28,.3,.4,e.gold)}po(i,-5,-12,22);for(let t=0;t<10;t++)Ie(i,-23+t*5,0,23,.55,3,.55,e.wood);Ie(i,0,1.5,23,46,.4,.4,e.wood),Ie(i,0,.4,23,46,.4,.4,e.wood);for(let t=0;t<4;t++)Ie(i,14,0,-18+t*2,9,.3,.6,e.soil)}function Kd(i,e,t,n,s){let r=new Jt,o=48;for(let l=0;l<=o;l++){let c=-1.83+l/o*3.66,h=Math.sin(c)*e,u=-Math.cos(c)*e;l?r.lineTo(h,u):r.moveTo(h,u)}r.closePath();let a=new bi(r,{depth:n,bevelEnabled:!0,bevelThickness:.15,bevelSize:.2,bevelSegments:1});return a.rotateX(-Math.PI/2),Dt(i,a,s,0,t,0)}function Ox(i){let e=bt();Kd(i,37,-3,3,e.rock);let t=new Jr(1,2),n=t.attributes.position;for(let l=0;l<n.count;l++){let c=n.getX(l),h=n.getY(l),u=n.getZ(l),f=1+.09*Math.sin(c*17+u*11)*Math.cos(h*13);n.setXYZ(l,c*f,h*f,u*f)}t.computeVertexNormals();let s=Dt(i,t,e.rock,0,23,-17);s.scale.set(20,26,13),s.rotation.y=.2;for(let l=0;l<7;l++){let c=34-l*3.9,h=l*5.2;Kd(i,c,h,5,e.shade);let u=42-l*3;for(let d=0;d<u;d++){let g=-1.83+d/(u-1)*3.66,_=Math.sin(g)*c,m=Math.cos(g)*c;Ie(i,_,h+4.5,m,2.25,2.4,1.1,e.ivory,-g),d%2===0&&Ie(i,_,h+6.9,m,1.1,.8,1.3,e.stone,-g)}let f=23-l*3;for(let d=0;d<f;d++){let g=-1.68+(d+.5)/f*3.36,_=c-3.1,m=Math.sin(g)*_,p=Math.cos(g)*_,M=1.5+(d*7+l*3)%5*.37;Ie(i,m,h+5,p,1.8,M,2.2,d%4?e.ivory:e.stone,-g),Cl(i,m,h+5+M,p,1.95,2.4,1.3,e.shade),d%4===0&&Ie(i,m,h+5.4,p+1.2,.35,.65,.15,e.glow)}l<6&&go(i,l%2?-5:5,h+4.5,c+1.3,4,3,1.5,e.ivory)}let r=[-2,0,-10,2,0,-10,-2,0,37,2,0,37,-2,37,-10,2,37,-10,-1,29,33,1,29,33],o=[0,2,1,1,2,3,4,5,6,5,7,6,0,4,2,2,4,6,1,3,5,3,7,5,2,6,3,3,6,7,0,1,4,1,5,4],a=new yt;a.setAttribute("position",new Qe(r,3)),a.setIndex(o),a.computeVertexNormals(),Dt(i,a,e.rock),et(i,0,36,-5,2.4,3.8,35,e.ivory,28),et(i,0,70,-5,3.5,3.5,1.2,e.ivory,28),Pi(i,0,71,-5,2.9,5,e.ivory);for(let l=0;l<4;l++){let c=l*Math.PI/2;Ie(i,Math.cos(c)*2.7,54,-5+Math.sin(c)*2.7,.5,7,.3,e.glow,c)}go(i,7,0,33.5,6,7,2,e.ivory)}function jd(i,e=!1){let t=bt();et(i,0,-2,0,28,30,2,t.rock,36),mo(i,0,0,0,29,1.7,4,t.shade);let n=e?t.dark:t.black;et(i,0,0,0,10,15,5,n,8);for(let s=0;s<4;s++){let r=Math.PI/4+s*Math.PI/2,o=Math.cos(r)*4.5,a=Math.sin(r)*4.5;et(i,o,5,a,2.7,4,54,n,5),et(i,o*1.8,58,a*1.8,0,2.8,20,n,5),Ie(i,o*1.1,44,a*1.1,1.1,8,1,t.glow,r)}if(et(i,0,42,0,7,5,12,n,8),et(i,0,55,0,5,7,5,n,8),e){for(let s=0;s<3;s++)et(i,0,s*12,0,14-s*2,20-s*2,11,n,8);et(i,0,68,0,0,2,25,n,6),jt(i,0,76,0,3,1.5,.6,t.glow)}else for(let s=0;s<8;s++){let r=s*Math.PI/4;Ie(i,Math.cos(r)*17,0,Math.sin(r)*17,4,2,4,t.dark)}}function Bx(i){let e=bt();jt(i,0,0,0,29,10,25,e.grass);let t=new It;t.position.y=8,i.add(t),Ie(t,0,0,0,24,10,34,e.wood),Cl(t,0,10,0,27,37,13,e.gold),Ie(t,0,9,19,27,1,8,e.wood);for(let n of[-11,-5,5,11])Ie(t,n,0,21,.8,10,.8,e.wood);for(let n=0;n<5;n++)Ie(i,0,4-n*1.2,23+n*2,10,.7,3,e.shade);for(let n of[-20,20]){let s=Ie(t,0,20,n,.6,7,.6,e.gold);s.rotation.z=n>0?.6:-.6}for(let n of[-21,21])for(let s of[-13,12]){let r=new It;r.position.set(n,1,s),r.scale.setScalar(.5),i.add(r),Ie(r,0,0,0,12,8,17,e.wood),Cl(r,0,8,0,15,20,8,e.soil)}}function zx(i){let e=bt();et(i,-11,0,-5,13,17,14,e.rock,18),mo(i,-11,14,-5,14,2,10,e.stone),et(i,-16,14,-8,4,5,28,e.ivory,16),mo(i,-16,42,-8,5,1,2,e.shade),Ie(i,12,0,8,48,13,4,e.stone);for(let t=0;t<23;t++)Ie(i,-11+t*2.2,13,8,1.1,1.6,4,e.ivory);go(i,0,0,10,8,7,2,e.shade);for(let t=0;t<5;t++)Ie(i,32,0,8-t*4,4,12,4,e.stone)}function kx(i){let e=bt();jt(i,0,8,-3,26,24,15,e.rock),Ie(i,0,0,11,27,30,4,e.dark),Ie(i,0,0,13.2,11,20,1,e.darkwood);for(let t of[-11,11]){Ie(i,t,0,15,5,31,7,e.shade),Ie(i,t,0,15,8,3,9,e.stone),Ie(i,t,29,15,8,3,9,e.stone);for(let n=0;n<5;n++)Ie(i,t-2.6+n*1.3,5,18.5,.4,20,.3,e.ivory)}Ie(i,0,31,15,30,4,7,e.stone),Ie(i,0,0,14,1,21,1,e.silver);for(let t=0;t<7;t++)Ie(i,-11+t*3.6,24,14.1,1.3,2,.3,e.silver);for(let t=0;t<5;t++)Ie(i,0,-.3-t*.7,21+t*2,19,.7,3,e.shade)}function Hx(i){let e=bt();Ie(i,0,-2,0,52,2,34,e.shade);for(let t of[-18,-6,6,18])Ie(i,t,-1,27,4,2,28,e.stone);Pl(i,-11,-8,16,10,12,e),nr(i,16,-6,32,2.8),nr(i,-23,-7,20,2);for(let t of[-12,13]){let n=jt(i,t,0,29,3,2,11,e.darkwood);et(i,t,1,29,.2,.3,21,e.wood,6);let s=new Jt;s.moveTo(0,0),s.quadraticCurveTo(10,8,0,17),s.closePath();let r=Dt(i,new Ei(s),e.cloth,t,4,29);r.rotation.y=.6}}function Vx(i){let e=bt();et(i,0,-3,0,30,32,3,e.soil,28);for(let[t,n,s]of[[0,0,52],[-17,8,36],[18,-5,42],[-9,-18,39]]){et(i,t,0,n,1.5,3.3,s,e.wood,10);for(let r=0;r<3;r++){let o=s*.4+r*8;et(i,t,o,n,7-r,7.5-r,1,e.ivory,20),mo(i,t,o+1,n,7-r,.3,1.8,e.gold);for(let a=0;a<6;a++)et(i,t+Math.cos(a*Math.PI/3)*5.3,o+1,n+Math.sin(a*Math.PI/3)*5.3,.15,.2,5,e.gold,6);Pi(i,t,o+6,n,6,6,e.roof)}jt(i,t,s,n,12,13,12,e.autumn),jt(i,t-7,s-7,n+5,9,9,9,e.leaf)}}function Gx(i){let e=bt();et(i,0,-4,0,32,38,5,e.rock,32);for(let t=0;t<2;t++)mo(i,0,t*4,0,31-t*5,1.4,5,e.ivory);Pl(i,0,0,20,14,15,e);for(let[t,n,s]of[[-19,0,34],[18,-4,40],[-9,-16,46],[10,14,27],[0,4,51]])nr(i,t,n,s,2.4);go(i,0,0,30,8,9,3,e.ivory)}function Wx(i){let e=bt();for(let n=0;n<3;n++)Ie(i,0,n*4,0,58-n*10,4,42-n*7,e.shade);Ie(i,0,12,0,33,15,23,e.ivory);for(let n=0;n<8;n++)et(i,-15+n*4.3,12,13,.65,.8,13,e.ivory,10),et(i,-15+n*4.3,24.5,13,1,1,.5,e.gold,10);Ie(i,0,26,13,36,1.5,4,e.ivory),et(i,0,27,0,9,11,4,e.stone,24);let t=Dt(i,new ks(10,24,12,0,Math.PI*2,0,Math.PI/2),e.roof,0,31,0);t.scale.y=.9,Pi(i,0,40,0,1,6,e.gold);for(let n of[-23,23])et(i,n,4,-5,3.4,4.5,36,e.ivory),Pi(i,n,40,-5,4.8,14,e.roof);for(let n=0;n<7;n++)Ie(i,0,8-n*1.2,24+n*2,17,1.2,3,e.ivory);for(let n of[-23,23])po(i,n,18,12)}function tr(i,e,t,n){let s=new Bs(e.map(r=>new R(...r)));return Dt(i,new jr(s,12,t,5,!1),n)}function os(i,e,t,n){let s=bt();et(i,e,t+2.1,n,.055,.055,1.8,s.gold,5),Ie(i,e,t,n,.65,1.7,.65,s.glow);for(let r of[-.42,.42])for(let o of[-.42,.42])Ie(i,e+r,t,n+o,.09,1.9,.09,s.gold);et(i,e,t+1.8,n,.55,.55,.2,s.gold,8),Pi(i,e,t+2,n,.6,.6,s.roof)}function Xx(i,e,t){let n=bt();if(["elven","gondolin"].includes(t)){for(let s=0;s<5;s++){let r=-17+s*8;tr(i,[[r-3.7,13.1,22.4],[r-1.2,17,22.4],[r,18,22.4],[r+1.2,17,22.4],[r+3.7,13.1,22.4]],.1,n.gold),s%2===0&&os(i,r,9.5,20)}for(let[s,r]of[[-11,-7],[3,-7],[14,-10]])tr(i,[[s,2,r],[s-3,6,r],[s-2,11,r],[s,14,r]],.22,n.ivory);for(let[s,r]of[[-23,11],[20,13],[-14,-18]])jt(i,s,1,r,3,1.4,2,n.rock),jt(i,s+1,2.3,r,2,.5,1.6,n.grass)}if(t==="shire")for(let[s,r]of[[-9,7],[12,13]]){for(let o=0;o<9;o++){let a=o/8*Math.PI,l=s+Math.cos(a)*2.45,c=2.1+Math.sin(a)*2.45;Ie(i,l,c,r+.5,.6,.4,.55,n.stone,a)}os(i,s+3.2,2,r+.7);for(let o=0;o<6;o++)jt(i,s-4+o*.6,.45,r+2,.27,.35,.27,o%2?n.autumn:n.leaf)}if(["orthanc","dark"].includes(t))for(let s=0;s<4;s++){let r=s*Math.PI/2+Math.PI/4,o=Math.cos(r)*4.8,a=Math.sin(r)*4.8;for(let l=0;l<3;l++)Ie(i,o,14+l*12,a,.35,4,.3,n.glow,r);tr(i,[[o*1.8,1,a*1.8],[o*1.4,12,a*1.4],[o,26,a]],.4,n.black)}if(t==="dwarf"){for(let s of[-7,7]){Ie(i,s,1,14.2,.18,20,.18,n.silver);for(let r=0;r<4;r++){let o=Ie(i,s,4+r*4.3,14.4,1.2,1.2,.2,n.silver);o.rotation.z=Math.PI/4}}for(let s of[-3.6,3.6])os(i,s,13,15);if(e==="Moria"){tr(i,[[0,5,14.5],[0,9,14.5],[0,15,14.5]],.12,n.silver);for(let s of[-1,1])for(let r=0;r<3;r++)tr(i,[[0,8+r*2,14.5],[s*1.5,11+r*2,14.5],[s*2.3,12.5+r*2,14.5]],.08,n.silver)}}if(t==="rohan"){for(let s of[-9,9]){os(i,s,10,21);for(let r=0;r<7;r++)Ie(i,s,8+r*1.4,17,.3,.6,1,n.gold)}for(let s of[-19,19])tr(i,[[0,31,s],[0,35,s+2],[0,36,s+3.5],[0,34,s+4]],.4,n.gold)}if(t==="numenor"){for(let s of[-13,-5,5,13])os(i,s,16,13.4),Ie(i,s,12,13.6,.24,10,.24,n.gold);for(let s of[-20,20])et(i,s,8,15,1.8,2.2,1,n.ivory),jt(i,s,9.8,15,1.9,2.4,1.9,n.leaf)}if(t==="fort")for(let s of[-8,7,20])os(i,s,8,10.5);if(t==="haven")for(let s of[-18,-6,6,18])os(i,s,1,15)}function tf(i){i.updateMatrixWorld(!0);let e=i.position.clone(),t=[];return i.traverseVisible(n=>{if(!n.isMesh||!n.material?.emissive||n.material.emissiveIntensity<.5||n.material.emissive.getHex()===0)return;let s=n.getWorldPosition(new R).sub(e),r=new R(0,0,1).applyQuaternion(n.getWorldQuaternion(new Ft));t.some(o=>o.position.distanceTo(s)<1.4)||t.push({position:s,front:r})}),t.filter((n,s)=>s%Math.max(1,Math.floor(t.length/24))===0).slice(0,24)}function Sh(i,e="lotr"){let t=hn[i];if(!t)return null;let n=new It;return n.name=i,n.userData.landmarkId=i,{elven:Nx,shire:Fx,minas:Ox,orthanc:jd,dark:r=>jd(r,!0),rohan:Bx,fort:zx,dwarf:kx,haven:Hx,treecity:Vx,gondolin:Gx,numenor:Wx}[t.maker](n),Xx(n,i,t.maker),i==="OstInEdhil"&&["hobbit","lotr","fourth"].includes(e)&&(n.traverse(r=>{r.isMesh&&r.position.y>14&&(r.visible=!1)}),n.scale.y=.55),n.traverse(r=>{r.isMesh&&(r.userData.landmarkId=i)}),n}function bh(i){i.removeFromParent();let e=new Set(Object.values(bt()));i.traverse(t=>{t.geometry&&!ef.has(t.geometry)&&t.geometry.dispose(),t.material&&!e.has(t.material)&&!Array.isArray(t.material)&&t.material.dispose()})}function Eh(i){i.updateMatrixWorld(!0);let e=i.position.clone(),t=[];return i.traverseVisible(n=>{if(!n.isMesh||n.userData.skipSoftware)return;let s=n.geometry,r=s.attributes.position,o=s.index,a=s.attributes.uv,l=Array.isArray(n.material)?n.material[0]:n.material;if(!l||l.opacity<.1)return;let c=new R,h=new R,u=new R,f=new R,d=new R,g=new R;for(let _=0;_<(o?o.count:r.count);_+=3){let m=o?[o.getX(_),o.getX(_+1),o.getX(_+2)]:[_,_+1,_+2];c.fromBufferAttribute(r,m[0]).applyMatrix4(n.matrixWorld).sub(e),h.fromBufferAttribute(r,m[1]).applyMatrix4(n.matrixWorld).sub(e),u.fromBufferAttribute(r,m[2]).applyMatrix4(n.matrixWorld).sub(e),f.crossVectors(d.subVectors(h,c),g.subVectors(u,c)).normalize();let p=Math.max(.48,.69+f.dot(new R(-.5,.8,.4).normalize())*.35),M=l.color.clone().multiplyScalar(p);t.push({v:[c.x,c.y,c.z,h.x,h.y,h.z,u.x,u.y,u.z],color:M.getStyle(),texture:l.map?.image||null,uv:l.map&&a?m.flatMap(v=>[a.getX(v)*(l.map?.image?.width||128),(1-a.getY(v))*(l.map?.image?.height||128)]):null,center:[(c.x+h.x+u.x)/3,(c.y+h.y+u.y)/3,(c.z+h.z+u.z)/3]})}}),t}var Qd=new WeakMap;function Th(i,e,t,n,s,r=0){let o=Qd.get(i);o||(o=new WeakMap,Qd.set(i,o)),t.updateMatrixWorld();let a=new st().multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse).elements,l=(h,u,f)=>{let d=a[3]*h+a[7]*u+a[11]*f+a[15];return[(a[0]*h+a[4]*u+a[8]*f+a[12])/d,(a[1]*h+a[5]*u+a[9]*f+a[13])/d,(a[2]*h+a[6]*u+a[10]*f+a[14])/d]},c=e.map(h=>({f:h,depth:l(...h.center)[2]})).sort((h,u)=>u.depth-h.depth);for(let{f:h}of c){let[u,f,d,g,_,m,p,M,v]=h.v,x=l(u,f+r,d),A=l(g,_+r,m),T=l(p,M+r,v),C=(x[0]+1)*n/2,P=(1-x[1])*s/2,b=(A[0]+1)*n/2,S=(1-A[1])*s/2,L=(T[0]+1)*n/2,O=(1-T[1])*s/2,k=(b-C)*(O-P)-(S-P)*(L-C);if(!(k>-.16)&&(i.fillStyle=h.color,i.strokeStyle=h.color,i.lineWidth=.35,i.beginPath(),i.moveTo(C,P),i.lineTo(b,S),i.lineTo(L,O),i.closePath(),i.fill(),k<-24&&(i.lineWidth=.3,i.stroke()),h.texture&&h.uv)){let[G,X,W,se,U,te]=h.uv,oe=W-G,ge=se-X,De=U-G,ke=te-X,Ve=oe*ke-De*ge;if(Math.abs(Ve)>.001&&Math.abs((b-C)*(O-P)-(S-P)*(L-C))>120){let Ke=((b-C)*ke-(L-C)*ge)/Ve,Z=((L-C)*oe-(b-C)*De)/Ve,ne=((S-P)*ke-(O-P)*ge)/Ve,Me=((O-P)*oe-(S-P)*De)/Ve,we=o.get(h.texture);we||(we=i.createPattern(h.texture,"repeat"),o.set(h.texture,we)),i.save(),i.clip(),i.globalAlpha=.45,i.globalCompositeOperation="multiply",i.transform(Ke,ne,Z,Me,C-Ke*G-Z*X,P-ne*G-Me*X),i.fillStyle=we;let be=Math.min(G,W,U),Je=Math.min(X,se,te);i.fillRect(be-1,Je-1,Math.max(G,W,U)-be+2,Math.max(X,se,te)-Je+2),i.restore()}}}}var Il=class{constructor(e,t,n,s){this.scene=e,this.camera=t,this.world=n,this.onSelect=s,this.entries=[],this.visible=!0,this.version=0,this.group=new It,this.group.name="Architectures de la Terre du Milieu",e.add(this.group)}build(e,t){for(let n of this.entries)bh(n.model);this.entries=[],this.group.clear();for(let n of e){if(!hn[n.id])continue;let s=Sh(n.id,t);s.position.copy(this.world(n.p,2)),s.rotation.y=-.35,s.scale.multiplyScalar(1.22),this.group.add(s);let r=Eh(s),o=new an().setFromObject(s).translate(s.position.clone().negate());this.entries.push({id:n.id,place:n,model:s,faces:r,box:o,sprite:null,key:"",screen:null})}this.version++,this.group.visible=this.visible}setVisible(e){this.visible=e,this.group.visible=e,this.version++}updateHeights(){for(let e of this.entries)e.model.position.copy(this.world(e.place.p,2));this.version++}paint(e,t,n,s){if(!this.visible)return;let r=this.camera,o=new R,a=r.position.clone().sub(new R(0,0,0)),l=r.getWorldDirection(new R).negate().normalize(),c=[Math.round(l.x*25),Math.round(l.y*25),Math.round(l.z*25)].join(":"),h=[...this.entries].sort((u,f)=>f.model.position.clone().project(r).z-u.model.position.clone().project(r).z);for(let u of h){if(o.copy(u.model.position).project(r),Math.abs(o.x)>1.25||Math.abs(o.y)>1.3){u.screen=null;continue}let f=u.box.getSize(new R),d=Math.max(f.x,f.z,f.y)*1.52+14;if(u.key!==c||!u.sprite){u.sprite=document.createElement("canvas"),u.sprite.width=u.sprite.height=320;let T=new Vn(-d/2,d/2,d/2,-d/2,.1,3e3),C=new R(0,f.y*.43,0);T.position.copy(C).addScaledVector(l,800),T.up.copy(r.up),T.lookAt(C),T.updateMatrixWorld();let P=u.sprite.getContext("2d");Th(P,u.faces,T,320,320);let b=new R(0,0,0).project(T);u.anchor=[(b.x+1)*160,(1-b.y)*160],u.key=c}let g=(o.x+1)*t/2,_=(1-o.y)*n/2,m=n/(r.top-r.bottom)*r.zoom,p=m*d/320,M=320*p,v=g-u.anchor[0]*p,x=_-u.anchor[1]*p;e.save(),e.translate(g,_),e.scale(1,.42);let A=e.createRadialGradient(0,0,2,0,0,24*m);A.addColorStop(0,"#193b2c70"),A.addColorStop(1,"#193b2c00"),e.fillStyle=A,e.beginPath(),e.ellipse(3*m,0,28*m,21*m,0,0,Math.PI*2),e.fill(),e.restore(),u.id===s&&(e.strokeStyle="#f2d48ca6",e.lineWidth=1,e.beginPath(),e.ellipse(g,_+3,25*m,9*m,0,0,Math.PI*2),e.stroke()),e.drawImage(u.sprite,v,x,M,M),u.screen={x:v,y:x,w:M,h:M,groundX:g,groundY:_}}}hit(e,t){if(!this.visible)return null;let n=null,s=1/0;for(let r of this.entries){let o=r.screen;if(!o)continue;let a=e-o.groundX,l=t-(o.groundY-o.h*.2),c=Math.hypot(a,l);e>o.x+o.w*.15&&e<o.x+o.w*.85&&t>o.y+o.h*.1&&t<o.y+o.h*.95&&c<s&&(n=r.id,s=c)}return n}};function nf({onLocate:i,onChange:e,reduced:t=!1,getEffects:n=()=>({particles:!0,lights:!0,night:!1})}){let s=document.querySelector("#architecture-viewer"),r=document.querySelector("#architecture-stage"),o,a=!1,l,c,h,u=[],f,d="",g=0,_=0,m=[],p=0,M=!t,v=new rs(document.querySelector("#architecture-fx"),{reduced:t,density:innerWidth<800?38:75});document.querySelector("#architecture-effects").classList.toggle("active",M),document.querySelector("#architecture-effects").setAttribute("aria-pressed",M);let x=new Gi,A=new Vn(-90,90,80,-80,.1,4e3);A.position.set(130,95,155);try{if(!document.createElement("canvas").getContext("webgl2"))throw Error("no-webgl");o=new Ks({antialias:!0,alpha:!0}),o.setPixelRatio(Math.min(devicePixelRatio,2)),o.outputColorSpace=vt,o.toneMapping=Na,o.toneMappingExposure=1.15,o.shadowMap.enabled=!0,o.shadowMap.type=Aa}catch{a=!0;let U=document.createElement("canvas");o={domElement:U,setSize(te,oe){U.width=te,U.height=oe},render(){let te=[...A.matrixWorld.elements.map(ge=>Math.round(ge*1e4)),Math.round(A.zoom*1e4),h,U.width,U.height,p].join(",");if(te===d)return;d=te;let oe=U.getContext("2d");oe.clearRect(0,0,U.width,U.height),c&&Th(oe,c,A,U.width,U.height)}}}r.appendChild(o.domElement);let T=new Qs(A,o.domElement);T.target.set(0,27,0),T.enableDamping=!0,T.dampingFactor=.1,T.minZoom=.5,T.maxZoom=3.5,T.enablePan=!1,T.minPolarAngle=.25,T.maxPolarAngle=Math.PI*.49,T.autoRotate=!t&&!a,document.querySelector("#architecture-rotate").classList.toggle("active",T.autoRotate),T.autoRotateSpeed=.45,T.update();let C=new Ji(15069668,5727831,2.1);x.add(C);let P=new Ai(16773326,2.9);P.position.set(-80,160,110),P.castShadow=!0,P.shadow.mapSize.set(2048,2048),Object.assign(P.shadow.camera,{left:-80,right:80,top:100,bottom:-60,near:1,far:600}),P.shadow.normalBias=.12,x.add(P);let b=new Ai(9221817,.8);b.position.set(70,20,-80),x.add(b);let S=Array.from({length:3},()=>{let U=new no(16763764,35,32,2);return x.add(U),U}),L=new Mt(new ii(85,64),new Qr({opacity:.23}));L.rotation.x=-Math.PI/2,L.position.y=-4,L.receiveShadow=!0,x.add(L);function O(){if(!s.open)return;let U=r.clientWidth,te=r.clientHeight;o.setSize(U,te),v.resize(innerWidth,innerHeight);let oe=U/te;A.left=-92*oe,A.right=92*oe,A.top=92,A.bottom=-92,A.updateProjectionMatrix(),d=""}window.addEventListener("resize",O);function k(U){if(l&&bh(l),h=U,l=Sh(U,f),!l)return;l.position.set(0,0,0),x.add(l),c=a?Eh(l):null,m=tf(l),S.forEach((ke,Ve)=>{ke.visible=!!m[Ve],m[Ve]&&ke.position.copy(m[Ve].position)});let te=new an().setFromObject(l),oe=te.getSize(new R),ge=new R(0,oe.y*.42,0);T.target.copy(ge),A.position.copy(ge).add(new R(125,86,148)),A.zoom=Math.min(1.65,115/Math.max(oe.x,oe.z,oe.y)),A.updateProjectionMatrix(),T.update();let De=hn[U];document.querySelector("#architecture-title").textContent=De.title,document.querySelector("#architecture-culture").textContent=De.culture,document.querySelector("#architecture-description").textContent=De.text,document.querySelector("#architecture-details").innerHTML=De.details.map((ke,Ve)=>`<div><span>0${Ve+1}</span>${ke}</div>`).join(""),document.querySelector("#architecture-index").textContent=`${String(u.indexOf(U)+1).padStart(2,"0")} / ${String(u.length).padStart(2,"0")}`,document.querySelector("#architecture-caption").textContent="Interpr\xE9tation architecturale \xB7 proportions adapt\xE9es \xE0 l\u2019atlas",d="",O(),G()}function G(){let U=p===1,te=p===2;a&&(o.domElement.style.filter=U?"brightness(.67) saturate(.7) hue-rotate(10deg)":te?"brightness(1.08)":"none"),s.classList.toggle("architecture-moon",U),s.classList.toggle("architecture-studio",te),document.querySelector("#architecture-light-label").textContent=U?"Clair de lune":te?"Lumi\xE8re d\u2019atelier":"Lueur dor\xE9e",document.querySelector("#architecture-light").textContent=U?"\u263E":te?"\u25C9":"\u263C",P.color.set(U?10733288:te?16053995:16770483),P.intensity=U?1.8:te?2.6:2.9,C.intensity=U?1.35:te?2.6:2.1,b.intensity=U?1.6:.8,a||(o.toneMappingExposure=U?.9:te?1.15:1.08),d=""}document.querySelector("#architecture-light").onclick=()=>{p=(p+1)%3,G()},document.querySelector("#architecture-effects").onclick=()=>{M=!M,document.querySelector("#architecture-effects").classList.toggle("active",M),document.querySelector("#architecture-effects").setAttribute("aria-pressed",M),M||v.clear()};function X(U){let te=n();if(!M){v.clear();return}let oe=[],ge=r.getBoundingClientRect(),De=A.getWorldDirection(new R).negate();for(let ke of m){if(ke.front.dot(De)<.05)continue;let Ve=ke.position.clone().project(A);oe.push({x:ge.x+(Ve.x+1)*ge.width/2,y:ge.y+(1-Ve.y)*ge.height/2,radius:Math.min(20,10*A.zoom),color:h==="Moria"?"143,205,227":"255,214,137"})}v.draw(U,{particles:te.particles,lights:te.lights,night:p===1,intensity:p===2?.4:1,anchors:oe,theme:h==="BaradDur"?"mordor":"elven"})}function W(U){if(!s.open){g=0;return}if(a&&U-_<50){g=requestAnimationFrame(W);return}_=U,T.update(),o.render(x,A),X(U),g=requestAnimationFrame(W)}function se(U,te,oe){u=te,f=oe,n().night&&(p=1),k(U),s.open||s.showModal(),O(),g||(g=requestAnimationFrame(W))}return document.querySelector("#architecture-close").onclick=()=>s.close(),s.addEventListener("close",()=>{cancelAnimationFrame(g),g=0,v.clear()}),document.querySelector("#architecture-rotate").onclick=()=>{T.autoRotate=!T.autoRotate,document.querySelector("#architecture-rotate").classList.toggle("active",T.autoRotate),document.querySelector("#architecture-rotate").setAttribute("aria-pressed",T.autoRotate)},document.querySelector("#architecture-reset").onclick=()=>k(h),document.querySelector("#architecture-zoom-in").onclick=()=>{A.zoom=Math.min(3.5,A.zoom*1.2),A.updateProjectionMatrix()},document.querySelector("#architecture-zoom-out").onclick=()=>{A.zoom=Math.max(.5,A.zoom/1.2),A.updateProjectionMatrix()},document.querySelector("#architecture-prev").onclick=()=>k(u[(u.indexOf(h)+u.length-1)%u.length]),document.querySelector("#architecture-next").onclick=()=>k(u[(u.indexOf(h)+1)%u.length]),document.querySelector("#architecture-locate").onclick=()=>{s.close(),i(h)},T.addEventListener("start",()=>{T.autoRotate=!1,document.querySelector("#architecture-rotate").classList.remove("active")}),s.addEventListener("keydown",U=>{U.key==="ArrowLeft"&&document.querySelector("#architecture-prev").click(),U.key==="ArrowRight"&&document.querySelector("#architecture-next").click()}),{open:se}}var $=i=>document.querySelector(i),kt=i=>[...document.querySelectorAll(i)],sf={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',moon:'<path d="M20.8 14A9 9 0 0 1 10 3.2 9 9 0 1 0 20.8 14Z"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',back:'<path d="M20 12H4m6-6-6 6 6 6"/>',bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>',camera:'<path d="M3 7h4l2-3h6l2 3h4v13H3V7Z"/><circle cx="12" cy="13" r="4"/>',mountain:'<path d="m2 20 8-15 5 9 2-4 5 10H2Z"/><path d="m7 11 3 2 3-2"/>',castle:'<path d="M4 21V7h3V3h3v4h4V3h3v4h3v14H4Z"/><path d="M10 21v-6h4v6"/>',chevron:'<path d="m8 4 8 8-8 8"/>',chevronDown:'<path d="m5 9 7 7 7-7"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',layers:'<path d="m12 3 10 6-10 6L2 9l10-6Zm-10 12 10 6 10-6M2 12l10 6 10-6"/>',ruler:'<path d="m4 16 12-12 5 5L9 21l-5-5Zm4-4 2 2m2-6 2 2m2-6 2 2"/>',home:'<circle cx="12" cy="12" r="6"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>',person:'<circle cx="12" cy="4" r="2.5"/><path d="m8 9-3 5 2 1 3-4-1 6-2 6h4l1-5 2 5h3l-2-7-1-5 3 4 2-1-4-5H8Z"/>',play:'<path d="m8 4 12 8-12 8V4Z"/>',pause:'<path d="M8 4v16m8-16v16"/>'},ai=(i,e=!1)=>`<svg viewBox="0 0 24 24" fill="${e?"currentColor":"none"}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${sf[i]||sf.castle}</svg>`;for(let[i,e]of Object.entries({"search-icon":"search","world-icon":"globe",night:"moon",info:"info",collapse:"chevron",measure:"ruler",home:"home",pegman:"person","peg-ghost":"person","layers-icon":"layers","time-icon":"clock","event-toggle":"chevronDown","pano-close":"back","pano-light":"sun"}))$("#"+i).innerHTML=ai(e);var Mo=matchMedia("(prefers-reduced-motion: reduce)").matches,z={era:"lotr",view:"explore",filter:"all",base:"leather",relief:!0,layers:{places:!0,territories:!1,roads:!1,panos:!0,particles:!Mo,lights:!0,buildings:!0,scenery:!0},selected:"Rivendell",peg:!1,route:null,step:0,playing:!1,night:!1,measuring:!1,measurePoints:[]};kt("[data-layer]").forEach(i=>{i.checked=!!z.layers[i.dataset.layer]});var zt;try{zt=JSON.parse(localStorage.getItem("arda-carnet")||"[]"),Array.isArray(zt)||(zt=[])}catch{zt=[]}var rf="",Fl=null,Rh=0,of=0,Et,Xt=[],sr,Dn,qn,Un,li,Ii=new It,as=new It,rr=new It,_o=[],Ch=[],qt,Ll=0,or=null,Li=0,vo=0,Ih=!1,cf,af,dn=new Gi;dn.background=new $e("#375e67");var Fe=new Vn(-1e3,1e3,800,-800,.1,1e4);Fe.position.set(-180,1900,1550);Fe.lookAt(-180,0,0);var Ct,kl=!1;try{if(!document.createElement("canvas").getContext("webgl2"))throw Error("webgl-unavailable");Ct=new Ks({antialias:!0,alpha:!1,powerPreference:"high-performance"})}catch{kl=!0;let e=document.createElement("canvas"),t=e.getContext("2d");Ct={domElement:e,setPixelRatio(){},setSize(n,s){e.width=n,e.height=s},capabilities:{getMaxAnisotropy:()=>1},render(){qx(t)}},$("#relief").textContent="2.5D",$("#relief").title="Relief illustr\xE9 \xB7 WebGL indisponible sur ce navigateur"}function ir(i,e,t,n,s){let r=new R(i,e,t).project(Fe);return[(r.x*.5+.5)*n,(-r.y*.5+.5)*s]}function qx(i){let e=[...Fe.matrixWorld.elements,Fe.zoom,z.era,z.base,z.layers.territories,z.layers.roads,z.route,z.measurePoints.length,z.relief,i.canvas.width,i.canvas.height,z.selected,z.layers.buildings,z.layers.scenery,hi?.version,Rh,qn?.map?.uuid].join(",");if(e===rf)return;rf=e;let t=i.canvas,n=t.width,s=t.height;if(i.setTransform(1,0,0,1,0,0),i.fillStyle=z.base==="leather"?"#375e67":"#79988c",i.fillRect(0,0,n,s),!qn?.map?.image||!Et)return;let r=qn.map.image,o=ir(-900,0,-Et.height/2,n,s),a=ir(900,0,-Et.height/2,n,s),l=ir(-900,0,Et.height/2,n,s);i.save(),i.setTransform((a[0]-o[0])/r.width,(a[1]-o[1])/r.width,(l[0]-o[0])/r.height,(l[1]-o[1])/r.height,o[0],o[1]),i.drawImage(r,0,0),i.restore();let c=h=>{if(!h.visible||!h.geometry)return;let u=h.geometry.attributes.position,f=h.material;if(i.strokeStyle="#"+f.color.getHexString(),i.fillStyle=i.strokeStyle,i.globalAlpha=f.opacity??1,i.lineWidth=1.4,h.isMesh){let d=h.geometry.index,g=d?d.count:u.count;i.beginPath();for(let _=0;_<g;_+=3){for(let m=0;m<3;m++){let p=d?d.getX(_+m):_+m,M=ir(u.getX(p),u.getY(p),u.getZ(p),n,s);m?i.lineTo(...M):i.moveTo(...M)}i.closePath()}i.fill()}else{i.setLineDash(f.isLineDashedMaterial?[5,4]:[]),i.beginPath();for(let d=0;d<u.count;d++){let g=ir(u.getX(d),u.getY(d),u.getZ(d),n,s);d?i.lineTo(...g):i.moveTo(...g)}i.stroke(),i.setLineDash([])}i.globalAlpha=1};if(Ii.visible&&Ii.children.forEach(c),as.visible&&as.children.forEach(c),Un&&c(Un),li&&c(li),z.layers.scenery&&Fl&&Fe.zoom>1.5){i.fillStyle="#2e51369c";for(let[h,u,f]of Fl.trees){let d=tn([h,u],2),g=ir(d.x,d.y,d.z,n,s);if(g[0]<0||g[0]>n||g[1]<0||g[1]>s)continue;let _=f*Fe.zoom*.75;i.beginPath(),i.moveTo(g[0],g[1]-_*2),i.lineTo(g[0]-_,g[1]+_),i.lineTo(g[0]+_,g[1]+_),i.closePath(),i.fill()}}hi&&hi.paint(i,n,s,z.selected)}var Ph=0,Ol=new Zi().load("/assets/leather-grain.webp");Ol.wrapS=Ol.wrapT=vi;function hf(i,e){return e!=="leather"?new Si({map:i}):(Ol.repeat.set(6,6*(Et?.height||1400)/1800),new Hn({map:i,color:14210506,roughness:.91,metalness:.015,bumpMap:Ol,bumpScale:.65}))}function Lh(){document.body.classList.toggle("leather-map",z.base==="leather"),dn.background.set(z.base==="leather"?"#375e67":"#718f81");let i={leather:"Cuir",terrain:"Terrain",parchment:"Parchemin"};$("#layer-caption").textContent=[i[z.base],z.layers.territories?"Royaumes":"Lieux"].join(" \xB7 "),$(".layer-thumb").style.backgroundImage=`url('/assets/${z.base}-${qt||3}.webp')`}Ct.setPixelRatio(Math.min(devicePixelRatio,1.7));Ct.outputColorSpace=vt;$("#map").appendChild(Ct.domElement);var tt=new Qs(Fe,Ct.domElement);tt.enableDamping=!0;tt.dampingFactor=.085;tt.screenSpacePanning=!1;tt.minZoom=.5;tt.maxZoom=7;tt.minPolarAngle=.05;tt.maxPolarAngle=Math.PI*.39;tt.target.set(-180,0,0);tt.mouseButtons={LEFT:_n.PAN,MIDDLE:_n.DOLLY,RIGHT:_n.ROTATE};tt.touches={ONE:Pn.PAN,TWO:Pn.DOLLY_ROTATE};tt.update();dn.add(new Ji(16775647,7701875,2.6));var uf=new Ai(16775652,1.1);uf.position.set(-1e3,2e3,-1500);dn.add(uf);dn.add(Ii,as,rr);var hi=new Il(dn,Fe,tn,i=>Dh(i)),Yx=nf({reduced:Mo,getEffects:()=>({particles:z.layers.particles,lights:z.layers.lights,night:z.night}),onLocate:i=>{hr(i,!1),So(tn(ur(i).p,0),3.3)}});function Dh(i){hn[i]&&(ar(),Yx.open(i,Xt.filter(e=>hn[e.id]).map(e=>e.id),z.era))}var Bl=new io,xo=new ee,Qt=new R;function df(){let i=$("#map").clientWidth,e=$("#map").clientHeight;Ct.setSize(i,e);let t=1550;Fe.left=-t*i/e/2,Fe.right=t*i/e/2,Fe.top=t/2,Fe.bottom=-t/2,Fe.updateProjectionMatrix(),ny()}window.addEventListener("resize",df);function en(i){$("#toast").textContent=i,$("#toast").classList.add("show"),clearTimeout(af),af=setTimeout(()=>$("#toast").classList.remove("show"),3400)}function Rt(i){return String(i).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function cr(i){return er[i]?.name||i.replace(/([a-z])([A-Z])/g,"$1 $2")}function ls(i){let e={name:cr(i.id),kind:i.type==="sommet"?"Sommet":"Lieu historique",region:vn[z.era].age===1?"Beleriand":vn[z.era].age===2?"Terres du Deuxi\xE8me \xC2ge":"Terre du Milieu",sub:"Les chemins du l\xE9gendaire",text:"Un rep\xE8re des terres imagin\xE9es par Tolkien. Retrouvez ce lieu dans le paysage, ajoutez-le \xE0 votre carnet ou partez \xE0 la d\xE9couverte des r\xE9gions voisines.",...er[i.id]};return e.pano&&!yh.some(t=>t.asset===e.pano&&(!t.eras||t.eras.includes(z.era)))&&delete e.pano,e}function ur(i){return Xt.find(e=>e.id===i)}function Hl(i,e){if(!sr||!Et)return 0;let t=Wn.clamp((i+900)/1800,0,1),n=Wn.clamp((e+Et.height/2)/Et.height,0,1);return sr.data[(Math.floor(n*(sr.h-1))*sr.w+Math.floor(t*(sr.w-1)))*4]/255*70*(z.relief?1:.035)}function tn(i,e=3){let t=i[0]-900,n=i[1]-Et.height/2;return new R(t,Hl(t,n)+e,n)}function yo(i,e){let t=Et.bounds;return[(i-t[0])/(t[2]-t[0])*1800,(t[3]-e)/(t[3]-t[1])*Et.height]}function Uh(i){for(let e of[...i.children])i.remove(e),e.geometry?.dispose(),e.material?.dispose()}async function $x(i){let e=new Image;return e.src=i,await e.decode(),e}async function Nh(i,e=!1){let t=++Ll;++Ph,ar(),z.era=i,z.route=null,z.measuring=!1,z.measurePoints=[],$("#measure").classList.remove("active"),Hh(),$("#events").hidden=!0,$("#header-era").textContent=vn[i].name,$("#map-era").textContent=vn[i].title,kt("[data-era]").forEach(n=>{n.classList.toggle("active",n.dataset.era===i),n.setAttribute("aria-pressed",n.dataset.era===i)}),$("#map-loading").style.opacity=e?"1":".85",$("#map-loading").style.display="flex";try{let n=vn[i].age,[s,r]=await Promise.all([fetch(`/assets/map-${n}.json`).then(d=>{if(!d.ok)throw Error("map");return d.json()}),$x(`/assets/height-${n}.png`)]);if(t!==Ll)return;Et=s;let o=document.createElement("canvas");o.width=r.width,o.height=r.height;let a=o.getContext("2d",{willReadFrequently:!0});a.drawImage(r,0,0),sr={data:a.getImageData(0,0,o.width,o.height).data,w:o.width,h:o.height},Xt=[...s.places];let l=new Set;Xt=Xt.filter(d=>l.has(d.id)?!1:(l.add(d.id),!0)),n===3&&Xt.push({id:"Moria",p:yo(.03535,-.01263),type:"cit\xE9",size:3},{id:"Isengard",p:yo(.03428,-.01514),type:"cit\xE9",size:3},{id:"BaradDur",p:yo(.04102,-.01735),type:"cit\xE9",size:3}),i==="second"&&(Xt=Xt.filter(d=>!["Rivendell","MinasAnor","MinasIthil","Osgiliath","Bree","Dunharrow","Edhellond"].includes(d.id))),i==="fourth"&&(Xt=Xt.filter(d=>!["BaradDur","GoblinTown","GoblinGate","ShelobsLair"].includes(d.id))),Dn&&(dn.remove(Dn),Dn.geometry.dispose(),qn.map?.dispose(),qn.dispose());let c=new Yi(1800,s.height,511,Math.round(511*s.height/1800));c.rotateX(-Math.PI/2);let h=c.attributes.position;for(let d=0;d<h.count;d++)h.setY(d,Hl(h.getX(d),h.getZ(d)));c.computeVertexNormals();let u=await new Zi().loadAsync(`/assets/${z.base}-${n}.webp?v=5`);if(t!==Ll){u.dispose();return}u.colorSpace=vt,u.anisotropy=Math.min(8,Ct.capabilities.getMaxAnisotropy()),qn=hf(u,z.base),Dn=new Mt(c,qn),dn.add(Dn),qt=n,Lh(),z.selected=vn[i].feature,Bh(),hi.build(Xt,z.era),jx(n),Vl(),pf(),ff(),Fh(e),un(),Oh(),$("#map-loading").style.opacity="0",setTimeout(()=>{t===Ll&&($("#map-loading").style.display="none")},550);let f=new URLSearchParams(location.search).get("place");e&&f&&ur(f)&&hr(f,!0)}catch(n){console.error(n),$("#map-loading").innerHTML='<p>Le chargement de l\u2019atlas a \xE9t\xE9 interrompu.</p><button id="retry" class="primary-btn">R\xE9essayer</button>',$("#retry").onclick=()=>location.reload()}}function Fh(i=!1){let e=new R(innerWidth<800?-100:-190,0,100),t=innerWidth<800?1.1:1.12;qt===2&&(e.set(-120,0,-20),t=.85),So(e,t,i)}function So(i,e=1.6,t=!1){let n=Fe.position.clone().sub(tt.target);if(t||Mo){tt.target.copy(i),Fe.position.copy(i).add(n),Fe.zoom=e,Fe.updateProjectionMatrix(),tt.update(),or=null;return}or={from:tt.target.clone(),to:i.clone(),offset:n,zoomFrom:Fe.zoom,zoomTo:e,time:performance.now(),duration:1150}}tt.addEventListener("start",()=>or=null);function hr(i,e=!0){let t=ur(i);if(!t)return;z.selected=i,z.view="explore",zh(),un(),Vl(),e&&So(tn(t.p,0),Math.max(2.2,Fe.zoom));let n=new URL(location.href);n.searchParams.set("era",z.era),n.searchParams.set("place",i),history.replaceState({},"",n),innerWidth<800&&$("#atlas").classList.add("sidebar-hidden")}function Zx(i){let e=zt.findIndex(t=>t.id===i&&t.era===z.era);e>=0?(zt.splice(e,1),en("Lieu retir\xE9 de votre carnet")):(zt.push({id:i,era:z.era}),en("Lieu ajout\xE9 \xE0 votre carnet"));try{localStorage.setItem("arda-carnet",JSON.stringify(zt))}catch{en("Le carnet ne peut pas \xEAtre enregistr\xE9 sur cet appareil.")}Oh(),un()}function Oh(){$("#save-count").textContent=zt.length}function wh(i){return zt.some(e=>e.id===i&&e.era===z.era)}function Jx(i){let e=ls(i);return`<button class="place-row" data-place="${Rt(i.id)}">${e.pano?`<img src="/assets/${e.pano}.webp" alt="" loading="lazy">`:`<span class="row-symbol">${ai(i.type==="sommet"?"mountain":"castle")}</span>`}<span><b>${Rt(e.name)}</b><small>${Rt(e.region)} \xB7 ${Rt(e.kind)}</small></span><span class="arrow">\u2197</span></button>`}function un(){let i=$("#panel-content");if(z.view==="saved"){i.innerHTML=`<div class="section-label">MON CARNET DE VOYAGE<span>${zt.length} lieux</span></div>${zt.length?zt.map((r,o)=>`<div class="saved-row"><button class="place-row" data-saved="${o}"><span class="row-symbol">${ai("bookmark",!0)}</span><span><b>${Rt(cr(r.id))}</b><small>${Rt(vn[r.era]?.name||"")}</small></span><span class="arrow">\u2197</span></button><button class="mini-link" data-remove="${o}">Retirer du carnet</button></div>`).join(""):'<div class="empty-note">Votre voyage commence ici.<br>Ouvrez un lieu et touchez le marque-page pour le retrouver dans ce carnet.</div>'}`,kt("[data-saved]").forEach(r=>r.onclick=async()=>{let o=zt[+r.dataset.saved];z.era!==o.era&&await Nh(o.era),hr(o.id)}),kt("[data-remove]").forEach(r=>r.onclick=()=>{zt.splice(+r.dataset.remove,1);try{localStorage.setItem("arda-carnet",JSON.stringify(zt))}catch{}Oh(),un()});return}if(z.view==="journeys"){let r=wl.filter(a=>a.eras.includes(z.era)),o=r.find(a=>a.id===z.route);i.innerHTML=`<div class="section-label">LES GRANDS VOYAGES<span>${r.length} itin\xE9raire${r.length>1?"s":""}</span></div>`+(o?`<button class="mini-link" id="back-routes">\u2190 Tous les voyages</button><div class="route-card"><div class="eyebrow">${o.tag}</div><h3>${o.name}</h3><p>${o.desc}</p><small>${o.note}</small></div><button class="primary-btn" id="play-route">${z.playing?"Mettre en pause":"Parcourir les \xE9tapes"}${ai(z.playing?"pause":"play")}</button><div class="route-steps">${o.places.map((a,l)=>`<button class="route-step ${l===z.step?"current":""}" data-step="${l}"><i>${l+1}</i><span>${Rt(cr(a))}</span></button>`).join("")}</div>`:r.map(a=>`<button class="route-card" data-route="${a.id}"><div class="eyebrow">${a.tag}</div><h3>${a.name}</h3><p>${a.desc}</p><small>${a.places.length} \xE9tapes &nbsp;\xB7&nbsp; Ouvrir le voyage \u2197</small></button>`).join("")),kt("[data-route]").forEach(a=>a.onclick=()=>mf(a.dataset.route)),$("#back-routes")?.addEventListener("click",()=>{ar(),z.route=null,Bh(),un()}),$("#play-route")?.addEventListener("click",()=>{z.playing?(ar(),un()):(z.playing=!0,Ah(),un(),cf=setInterval(()=>{if(z.step>=o.places.length-1){ar(),un(),en("Vous \xEAtes au terme de ce voyage.");return}z.step++,Ah(),un()},5e3))}),kt("[data-step]").forEach(a=>a.onclick=()=>{z.step=+a.dataset.step,Ah(),un()});return}let e=ur(z.selected)||Xt[0];if(!e)return;let t=ls(e);z.era==="fourth"&&e.id==="MountDoom"&&delete t.pano;let n=t.text;z.era==="fourth"&&e.id==="Rivendell"&&(n="Apr\xE8s le d\xE9part d\u2019Elrond, ses fils demeurent un temps \xE0 Fondcombe. La vall\xE9e conserve la m\xE9moire des Elfes alors que commence l\u2019\xC2ge des Hommes."),z.era==="hobbit"&&e.id==="LonelyMountain"&&(n="En 2941, Smaug occupe encore Erebor. Thorin, ses douze compagnons et Bilbo tentent de reconqu\xE9rir le royaume sous la montagne.");let s=Xt.filter(r=>r.id!==e.id&&er[r.id]&&(z.filter==="all"||z.filter==="architecture"&&hn[r.id]||r.type===z.filter));if(z.filter==="all"){let r=z.era==="first"?["Menegroth","Nargothrond","Himring"]:z.era==="second"?["Meneltarma","Andunie","OstInEdhil"]:["Hobbiton","MountDoom","MinasTirith","LonelyMountain","Edoras","Moria"];s.sort((o,a)=>(r.includes(o.id)?r.indexOf(o.id):50)-(r.includes(a.id)?r.indexOf(a.id):50))}i.innerHTML=`<div class="section-label">${z.selected===vn[z.era].feature?"ESCALE \xC0 D\xC9COUVRIR":"VOTRE ESCALE"}<span>${vn[z.era].date}</span></div><article class="feature-card">${t.pano?`<div class="feature-media" id="card-media"><img class="feature-image" src="/assets/${t.pano}.webp" alt="Reconstitution artistique de ${Rt(t.name)}"><span class="pano-tag">${ai("camera")} PANORAMA ILLUSTR\xC9</span></div>`:""}${hn[e.id]?`<button class="architecture-entry" id="inspect-building"><span class="architecture-entry-icon">${ai("castle")}</span><span><b>${Rt(hn[e.id].title)}</b><small>EXAMINER L\u2019ARCHITECTURE</small></span><span>\u2197</span></button>`:""}<div class="feature-body"><div class="place-meta">${Rt(t.region)} \xB7 ${Rt(t.kind)}<button id="save-place" aria-label="${wh(e.id)?"Retirer du carnet":"Ajouter au carnet"}" title="${wh(e.id)?"Retirer du carnet":"Ajouter au carnet"}">${ai("bookmark",wh(e.id))}</button></div><h2>${Rt(t.name)}</h2><div class="elven">${Rt(t.sub)}</div><p>${Rt(n)}</p><button class="primary-btn" id="place-action">${t.pano?"Entrer dans le paysage":"Centrer sur ce lieu"}${ai(t.pano?"arrow":"home")}</button></div></article><div class="discover-list"><div class="section-label">${z.filter==="all"?"LE VOYAGE CONTINUE":z.filter==="cit\xE9"?"CIT\xC9S & REFUGES":z.filter==="architecture"?"ARCHITECTURES REMARQUABLES":"SOMMETS \xC0 EXPLORER"}<span>${s.length} lieux</span></div>${s.slice(0,12).map(Jx).join("")}</div>`,$("#inspect-building")?.addEventListener("click",()=>Dh(e.id)),$("#save-place").onclick=()=>Zx(e.id),$("#card-media")?.addEventListener("click",()=>zl(t.pano)),$("#place-action").onclick=()=>t.pano?zl(t.pano):So(tn(e.p,0),2.6),kt("[data-place]").forEach(r=>r.onclick=()=>hr(r.dataset.place))}function Vl(){let i=$("#labels");i.innerHTML="",_o=[],Ch=[];for(let t of Xt){if(t.id==="BagEnd"||t.id==="GreyHavens"&&_o.find(r=>r.p.id===t.id))continue;let n=ls(t),s=document.createElement("button");s.className=`marker ${er[t.id]?"major":"minor"} ${n.pano&&z.layers.panos?"pano":""} ${t.id===z.selected?"selected":""} ${hn[t.id]?"architectural":""}`,s.innerHTML=`<i></i><span>${Rt(n.name)}</span>`,s.title=`${n.name} \xB7 ${n.kind}`,s.setAttribute("aria-label",n.name+(n.pano?" \u2014 panorama disponible":"")),s.onclick=r=>{r.stopPropagation(),z.peg?n.pano?(dr(!1),zl(n.pano)):en("Choisissez un rep\xE8re dor\xE9 pour ouvrir un panorama."):hr(t.id)},i.append(s),_o.push({el:s,p:t,major:!!er[t.id],pano:!!n.pano})}let e=qt===1?[["BELERIAND",.0178,-.0082],["DORIATH",.0184,-.0066],["HITHLUM",.0166,-.0055],["BELEGAER",.0145,-.0092,"water"]]:qt===2?[["N\xDAMENOR",.0133,-.0207],["ERIADOR",.023,-.0078],["RHOVANION",.028,-.0083],["MORDOR",.0295,-.0125],["BELEGAER",.017,-.0155,"water"]]:[["ERIADOR",.0314,-.0087],["LA COMT\xC9",.0304,-.0111],["FOR\xCAT NOIRE",.0382,-.0115,"mountain"],["ROHAN",.0361,-.0155],["GONDOR",.0356,-.0185],["MORDOR",.0415,-.0181],["RH\xDBN",.0424,-.011],["BELEGAER",.027,-.016,"water"],["MONTS BRUMEUX",.0352,-.011,"mountain"]];for(let[t,n,s,r]of e){let o=document.createElement("div");o.className="region-label "+(r||""),o.textContent=t,i.append(o),Ch.push({el:o,p:yo(n,s)})}}function Kx(){if(!Et)return;let i=Ct.domElement.clientWidth,e=Ct.domElement.clientHeight,t=[],n=[..._o].sort((a,l)=>(l.p.id===z.selected?20:l.pano?10:l.major?5:0)-(a.p.id===z.selected?20:a.pano?10:a.major?5:0));for(let a of n){let{el:l,p:c,major:h,pano:u}=a,f=z.filter==="architecture"?!hn[c.id]:z.filter!=="all"&&c.type!==z.filter,d=z.layers.places&&!f&&(h||Fe.zoom>1.8)&&(!z.peg||u);Qt.copy(tn(c.p,2)).project(Fe);let g=(Qt.x*.5+.5)*i,_=(-Qt.y*.5+.5)*e+(hn[c.id]&&z.layers.buildings?Math.min(30,12*Fe.zoom):0);d=d&&Qt.z>-1&&Qt.z<1&&g>-80&&g<i+80&&_>-20&&_<e+20;let m=Math.min(180,30+cr(c.id).length*(h?7:5.8));if(d&&c.id!==z.selected){for(let p of t)if(Math.abs(g-p.x)<(m+p.w)/2&&Math.abs(_-p.y)<24){d=!1;break}}d&&t.push({x:g,y:_,w:m}),l.style.display=d?"flex":"none",l.setAttribute("aria-hidden",d?"false":"true"),l.tabIndex=d?0:-1,l.style.pointerEvents=d?"auto":"none",l.style.transform=`translate(${g}px,${_}px) translate(-50%,-50%)`}for(let a of Ch)Qt.copy(tn(a.p,1)).project(Fe),a.el.style.left=(Qt.x*.5+.5)*i+"px",a.el.style.top=(-Qt.y*.5+.5)*e+"px",a.el.style.opacity=Fe.zoom>3?"0":".9";let s=Math.atan2(Fe.position.x-tt.target.x,Fe.position.z-tt.target.z);$("#compass svg").style.transform=`rotate(${s}rad)`;let r=qt===1?1:qt===2?3.6:1.3,o=(Fe.right-Fe.left)/Fe.zoom/i*90*r;$("#scale-label").textContent=Math.round(o/10)*10+" km"}function Gl(i,e,t=1,n=!1){let s=[];for(let l=0;l<i.length-1;l++){let c=i[l],h=i[l+1],u=Math.max(2,Math.ceil(Math.hypot(c[0]-h[0],c[1]-h[1])/6));for(let f=0;f<u;f++){let d=[c[0]+(h[0]-c[0])*f/u,c[1]+(h[1]-c[1])*f/u];s.push(tn(d,4))}}i.length&&s.push(tn(i.at(-1),4));let r=new yt().setFromPoints(s),o=n?new eo({color:e,transparent:!0,opacity:t,dashSize:6,gapSize:4,depthTest:!1}):new ni({color:e,transparent:!0,opacity:t,depthTest:!1}),a=new Wi(r,o);return a.computeLineDistances(),a.renderOrder=5,a}async function jx(i){let e=++of;Uh(rr),Fl=null,Rh++;try{let t=await fetch(`/assets/scatter-${i}.json`).then(c=>c.json());if(qt!==i||e!==of)return;if(kl){Fl=t,Rh++;return}let n=new st,s=new Ft,r=new R,o=new R,a=new Us(new zr(1.4,5.8,6),new Hn({color:4285257,roughness:1}),t.trees.length);t.trees.forEach(([c,h,u],f)=>{o.copy(tn([c,h],u*2.5)),r.set(u,u,u),n.compose(o,s,r),a.setMatrixAt(f,n),a.setColorAt(f,new $e().setHSL(.28+f%7*.008,.16,.2+f%13*.009))}),a.instanceMatrix.needsUpdate=!0,a.castShadow=!0,rr.add(a);let l=new Us(new Hr(1.3,0),new Hn({color:10592909,roughness:1}),t.rocks.length);t.rocks.forEach(([c,h,u],f)=>{o.copy(tn([c,h],u*.2)),r.set(u*1.2,u*.7,u),s.setFromAxisAngle(new R(0,1,0),f),n.compose(o,s,r),l.setMatrixAt(f,n)}),l.instanceMatrix.needsUpdate=!0,rr.add(l),rr.visible=z.layers.scenery}catch(t){console.warn("D\xE9cor secondaire indisponible",t.message)}}function ff(){Uh(as);for(let i of Et.roads)i.length>1&&as.add(Gl(i,12033125,.7,!0));as.visible=z.layers.roads}function pf(){Uh(Ii);let i=[],e=[9412453,12294494,7248272,9737390,12286811,11906410];if(qt===1||qt===2)i=Et.regions;else{let t=[["Rohan",[[.0338,-.0148],[.0351,-.0146],[.0378,-.0155],[.0375,-.017],[.0355,-.0167],[.0341,-.0162]]],["Gondor",[[.031,-.0176],[.0339,-.0168],[.0358,-.0171],[.0389,-.0177],[.0392,-.0198],[.0373,-.0205],[.0344,-.0198]]],["Mordor",[[.0393,-.0162],[.0444,-.016],[.0445,-.0208],[.0405,-.0203],[.0393,-.0187]]],["Comt\xE9",[[.0298,-.01],[.0312,-.01],[.03125,-.011],[.0298,-.0112]]],["Lindon",[[.0257,-.0085],[.0285,-.0095],[.0285,-.0115],[.027,-.0121],[.0258,-.011]]]];z.era==="fourth"&&(t[1]=["Royaume R\xE9unifi\xE9",[[.029,-.0084],[.0325,-.0085],[.0344,-.0121],[.034,-.0166],[.037,-.0175],[.0392,-.0198],[.0373,-.0205],[.0344,-.0198],[.0304,-.0186],[.0327,-.0135]]]),i=t.map(([n,s])=>({id:n,rings:[s.map(r=>yo(...r))]}))}i.forEach((t,n)=>{for(let s of t.rings.slice(0,1)){if(s.length<3)continue;let r=new Jt;r.moveTo(s[0][0]-900,-s[0][1]+Et.height/2),s.slice(1).forEach(c=>r.lineTo(c[0]-900,-c[1]+Et.height/2));let o=new Ei(r);o.rotateX(-Math.PI/2);let a=o.attributes.position;for(let c=0;c<a.count;c++)a.setY(c,Hl(a.getX(c),a.getZ(c))+1.5);let l=new Si({color:e[n%e.length],opacity:.22,transparent:!0,depthWrite:!1,side:xn});Ii.add(new Mt(o,l)),Ii.add(Gl([...s,s[0]],e[n%e.length],.9,!0))}}),Ii.visible=z.layers.territories}function Bh(){Un&&(dn.remove(Un),Un.geometry.dispose(),Un.material.dispose(),Un=null)}function mf(i){ar(),z.route=i,z.step=0;let e=wl.find(n=>n.id===i);Bh();let t=e.places.map(ur).filter(Boolean).map(n=>n.p);Un=Gl(t,16177809,1,!0),Un.material.dashSize=10,Un.material.gapSize=5,dn.add(Un),z.view="journeys",un(),Fh(),en("Itin\xE9raire affich\xE9 \xB7 choisissez une \xE9tape pour vous y rendre.")}function Ah(){let i=wl.find(t=>t.id===z.route);if(!i)return;let e=ur(i.places[z.step]);e&&(z.selected=e.id,Vl(),So(tn(e.p,0),2.1))}function ar(){z.playing=!1,clearInterval(cf)}function zh(){kt(".nav").forEach(i=>i.classList.toggle("active",i.dataset.view===z.view))}kt(".nav").forEach(i=>i.onclick=()=>{z.view=i.dataset.view,zh(),un(),innerWidth<800&&$("#atlas").classList.add("sidebar-hidden")});kt("[data-era]").forEach(i=>i.onclick=()=>{let e=new URL(location.href);e.searchParams.set("era",i.dataset.era),e.searchParams.delete("place"),history.replaceState({},"",e),Nh(i.dataset.era)});kt("[data-filter]").forEach(i=>i.onclick=()=>{z.filter=i.dataset.filter,kt("[data-filter]").forEach(e=>e.classList.toggle("active",e===i)),z.view="explore",zh(),un()});$("#search").addEventListener("input",()=>{let i=$("#search").value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),e=Xt.filter(t=>(cr(t.id)+" "+t.id+" "+ls(t).region).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(i)).slice(0,12);$("#search-results").hidden=!i,$("#search-results").innerHTML=e.length?e.map(t=>`<button data-result="${Rt(t.id)}">${Rt(cr(t.id))}<small>${Rt(ls(t).region)} \xB7 ${Rt(ls(t).kind)}</small></button>`).join(""):"<p>Aucun lieu trouv\xE9 dans cette \xE9poque. Essayez un autre \xC2ge.</p>",kt("[data-result]").forEach(t=>t.onclick=()=>{hr(t.dataset.result),$("#search-results").hidden=!0,$("#search").value=""})});$("#search").addEventListener("keydown",i=>{i.key==="Enter"&&$("#search-results button")?.click()});document.addEventListener("click",i=>{i.target.closest(".search-wrap")||($("#search-results").hidden=!0),i.target.closest(".layer-area")||($("#layer-menu").hidden=!0)});$("#collapse").onclick=()=>{$("#atlas").classList.toggle("sidebar-hidden"),$("#collapse").setAttribute("aria-label",($("#atlas").classList.contains("sidebar-hidden"),"Afficher ou masquer le panneau"))};$("#zoom-in").onclick=()=>{Fe.zoom=Math.min(7,Fe.zoom*1.3),Fe.updateProjectionMatrix()};$("#zoom-out").onclick=()=>{Fe.zoom=Math.max(.5,Fe.zoom/1.3),Fe.updateProjectionMatrix()};$("#home").onclick=()=>Fh();$("#compass").onclick=()=>{let i=Fe.position.distanceTo(tt.target);Fe.position.copy(tt.target).add(new R(0,z.relief?i*.77:i,z.relief?i*.64:.01)),tt.update()};$("#relief").onclick=()=>{z.relief=!z.relief,$("#relief").textContent=z.relief?kl?"2.5D":"3D":"2D",$("#relief").classList.toggle("active",z.relief),tt.enableRotate=z.relief;let i=Fe.position.distanceTo(tt.target);Fe.position.copy(tt.target).add(new R(0,z.relief?i*.77:i,z.relief?i*.64:.01));let e=Dn.geometry.attributes.position;for(let t=0;t<e.count;t++)e.setY(t,Hl(e.getX(t),e.getZ(t)));e.needsUpdate=!0,Dn.geometry.computeVertexNormals(),pf(),ff(),hi.updateHeights(),z.route&&mf(z.route),tt.update()};$("#layers").onclick=()=>$("#layer-menu").hidden=!$("#layer-menu").hidden;kt("[data-base]").forEach(i=>i.onclick=async()=>{if(!Dn||$("#map-loading").style.display!=="none")return;let e=++Ph,t=i.dataset.base,n=qt;try{let s=await new Zi().loadAsync(`/assets/${t}-${n}.webp?v=5`);if(e!==Ph||n!==qt){s.dispose();return}s.colorSpace=vt,s.anisotropy=Math.min(8,Ct.capabilities.getMaxAnisotropy());let r=hf(s,t);qn.map.dispose(),qn.dispose(),qn=r,Dn.material=r,z.base=t,Lh(),kt("[data-base]").forEach(o=>o.classList.toggle("selected",o===i))}catch{en("Ce fond de carte n\u2019a pas pu \xEAtre charg\xE9.")}});kt("[data-layer]").forEach(i=>i.onchange=()=>{z.layers[i.dataset.layer]=i.checked,hi.setVisible(z.layers.buildings),rr.visible=z.layers.scenery,Ii.visible=z.layers.territories,as.visible=z.layers.roads,Vl(),Lh()});$("#night").onclick=()=>{z.night=!z.night,$("#night").innerHTML=ai(z.night?"sun":"moon"),document.body.classList.toggle("night",z.night),en(z.night?"Le cr\xE9puscule tombe sur la Terre du Milieu.":"La lumi\xE8re revient sur la Terre du Milieu.")};$("#info").onclick=()=>$("#about").showModal();$("#about .modal-close").onclick=()=>$("#about").close();$("#about").addEventListener("click",i=>{if(i.target===$("#about")){let e=$("#about").getBoundingClientRect();(i.clientX<e.left||i.clientX>e.right||i.clientY<e.top||i.clientY>e.bottom)&&$("#about").close()}});$("#event-toggle").onclick=()=>{let i=vn[z.era];$("#events").hidden=!$("#events").hidden,$("#events").innerHTML=`<h3>${i.title}</h3><p>${i.desc}</p>${i.events.map(([e,t])=>`<div class="event-row"><b>${e}</b><span>${t}</span></div>`).join("")}`};function Qx(i){let e=Ct.domElement.getBoundingClientRect();return xo.x=(i.clientX-e.left)/e.width*2-1,xo.y=-(i.clientY-e.top)/e.height*2+1,Bl.setFromCamera(xo,Fe),Dn?Bl.intersectObject(Dn)[0]?.point:null}function dr(i){z.peg=i,$("#atlas").classList.toggle("peg-mode",i),$("#pegman").setAttribute("aria-pressed",i),i&&en("D\xE9posez le voyageur sur un rep\xE8re dor\xE9 pour entrer dans le paysage.")}var cs=null,kh=!1;$("#pegman").addEventListener("pointerdown",i=>{i.preventDefault(),cs={x:i.clientX,y:i.clientY},kh=!1,$("#pegman").setPointerCapture(i.pointerId),dr(!0)});$("#pegman").addEventListener("pointermove",i=>{cs&&Math.hypot(i.clientX-cs.x,i.clientY-cs.y)>8&&(kh=!0,$("#peg-ghost").hidden=!1,$("#peg-ghost").style.left=i.clientX+"px",$("#peg-ghost").style.top=i.clientY+"px")});$("#pegman").addEventListener("pointerup",i=>{kh?gf(i):cs&&z.peg&&en("Touchez un rep\xE8re dor\xE9 pour entrer dans son panorama."),cs=null,$("#peg-ghost").hidden=!0});$("#pegman").addEventListener("pointercancel",()=>{cs=null,$("#peg-ghost").hidden=!0,dr(!1)});function gf(i){let e,t=1/0;for(let n of _o.filter(s=>s.pano)){Qt.copy(tn(n.p.p)).project(Fe);let s=Ct.domElement.getBoundingClientRect(),r=(Qt.x*.5+.5)*s.width+s.left,o=(-Qt.y*.5+.5)*s.height+s.top,a=Math.hypot(i.clientX-r,i.clientY-o);a<t&&(e=n,t=a)}e&&t<120?(dr(!1),zl(ls(e.p).pano)):en("D\xE9posez le voyageur plus pr\xE8s d\u2019un rep\xE8re dor\xE9.")}var Dl;Ct.domElement.addEventListener("pointerdown",i=>Dl={x:i.clientX,y:i.clientY});Ct.domElement.addEventListener("pointerup",i=>{if(!Dl||Math.hypot(i.clientX-Dl.x,i.clientY-Dl.y)>5)return;if(z.peg){gf(i);return}if(!z.measuring){let r;if(kl){let o=Ct.domElement.getBoundingClientRect();r=hi.hit(i.clientX-o.left,i.clientY-o.top)}else{let o=Ct.domElement.getBoundingClientRect();xo.set((i.clientX-o.left)/o.width*2-1,-(i.clientY-o.top)/o.height*2+1),Bl.setFromCamera(xo,Fe),r=Bl.intersectObjects(hi.group.children,!0)[0]?.object.userData.landmarkId}r&&z.layers.buildings&&Dh(r);return}let e=Qx(i);if(!e)return;if(z.measurePoints.push([e.x+900,e.z+Et.height/2]),z.measurePoints.length>2&&(z.measurePoints=[z.measurePoints.at(-1)]),Hh(),z.measurePoints.length===1){en("Choisissez le point d\u2019arriv\xE9e.");return}li=Gl(z.measurePoints,16770468,1,!0),dn.add(li);let[t,n]=z.measurePoints,s=Math.hypot(t[0]-n[0],t[1]-n[1])*(qt===1?1:qt===2?3.6:1.3);en(`Environ ${Math.round(s)} km \xE0 vol d\u2019oiseau \xB7 estimation cartographique`)});function Hh(){li&&(dn.remove(li),li.geometry.dispose(),li.material.dispose(),li=null)}$("#measure").onclick=()=>{dr(!1),z.measuring=!z.measuring,z.measurePoints=[],Hh(),$("#measure").classList.toggle("active",z.measuring),Ct.domElement.style.cursor=z.measuring?"crosshair":"",z.measuring&&en("Cliquez sur deux points de la carte pour mesurer leur distance.")};function ci(){return yh.filter(i=>!i.eras||i.eras.includes(z.era))}function zl(i){let e=ci().findIndex(t=>t.asset===i);e<0||(Li=e,vo=0,Vh(),$("#panorama").open||$("#panorama").showModal())}function Vh(){let i=ci()[Li];$("#pano-image").src=`/assets/${i.asset}.webp`,$("#pano-image").alt=`Reconstitution artistique de ${i.name}`,$("#pano-title").textContent=i.name,$("#pano-region").textContent=i.region,$("#pano-sub").textContent=i.sub,$("#pano-index").textContent=`0${Li+1} / 0${ci().length}`,$("#pano-prev").hidden=ci().length<2,$("#pano-next").hidden=ci().length<2,vo=0,$("#pano-image").style.transform="translateX(-50%)"}$("#pano-close").onclick=()=>$("#panorama").close();$("#pano-prev").onclick=()=>{Li=(Li+ci().length-1)%ci().length,Vh()};$("#pano-next").onclick=()=>{Li=(Li+1)%ci().length,Vh()};$("#pano-light").onclick=()=>$("#panorama").classList.toggle("pano-night");var lr;$("#pano-stage").addEventListener("pointerdown",i=>{lr={x:i.clientX,offset:vo},Ih=!0,$("#pano-stage").setPointerCapture(i.pointerId)});$("#pano-stage").addEventListener("pointermove",i=>{if(!lr)return;let e=$("#pano-image"),t=Math.max(0,(e.getBoundingClientRect().width-innerWidth)/2);vo=Wn.clamp(lr.offset+i.clientX-lr.x,-t,t),e.style.transform=`translateX(calc(-50% + ${vo}px))`});$("#pano-stage").addEventListener("pointerup",()=>{lr=null,Ih=!1});$("#pano-stage").addEventListener("pointercancel",()=>{lr=null,Ih=!1});$("#panorama").addEventListener("keydown",i=>{i.key==="ArrowRight"&&$("#pano-next").click(),i.key==="ArrowLeft"&&$("#pano-prev").click()});document.addEventListener("keydown",i=>{i.key==="/"&&i.target.tagName!=="INPUT"&&(i.preventDefault(),innerWidth<800&&$("#atlas").classList.add("sidebar-hidden"),$("#search").focus()),i.key==="Escape"&&(dr(!1),$("#layer-menu").hidden=!0,$("#events").hidden=!0,$("#search-results").hidden=!0,z.measuring&&$("#measure").click())});var ey=$("#dust"),ty=$("#pano-dust"),Ul=new rs(ey,{reduced:Mo,density:innerWidth<800?38:84}),Nl=new rs(ty,{reduced:Mo,density:innerWidth<800?42:95});function ny(){Ul.resize(innerWidth,$("#atlas").clientHeight),Nl.resize(innerWidth,innerHeight)}df();function iy(i){if($("#architecture-viewer").open){Ul.clear(),Nl.clear();return}let e=$("#panorama").open,t=[];if(!e&&Et&&z.layers.buildings)for(let s of hi.entries){if(s.id!==z.selected&&Fe.zoom<1.8)continue;Qt.copy(tn(s.place.p,12)).project(Fe);let r=(Qt.x*.5+.5)*innerWidth,o=(-Qt.y*.5+.5)*$("#atlas").clientHeight;r>0&&r<innerWidth&&o>0&&t.push({x:r,y:o,radius:s.id===z.selected?30:12,color:s.id==="BaradDur"?"245,130,65":"244,218,141"})}let n={particles:z.layers.particles,lights:z.layers.lights,night:z.night,intensity:e?.9:.8,anchors:t,theme:e&&ci()[Li]?.asset==="mordor"?"mordor":"elven"};e?(Ul.clear(),Nl.draw(i,n)):(Nl.clear(),Ul.draw(i,n))}function _f(i){if(requestAnimationFrame(_f),or){let e=or,t=Math.min(1,(i-e.time)/e.duration);t=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,tt.target.lerpVectors(e.from,e.to,t),Fe.position.copy(tt.target).add(e.offset),Fe.zoom=Wn.lerp(e.zoomFrom,e.zoomTo,t),Fe.updateProjectionMatrix(),i-e.time>=e.duration&&(or=null)}if(tt.update(),Et){let e=qt===2?1600:1100,t=Wn.clamp(tt.target.x,-e,e),n=Wn.clamp(tt.target.z,-e,e);Fe.position.x+=t-tt.target.x,Fe.position.z+=n-tt.target.z,tt.target.x=t,tt.target.z=n}Ct.render(dn,Fe),Kx(),iy(i)}requestAnimationFrame(_f);var lf=new URLSearchParams(location.search).get("era");Nh(vn[lf]?lf:"lotr",!0);
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2025 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
