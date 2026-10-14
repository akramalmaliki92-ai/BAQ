/* مقهى PEX الرياضي — مشهد مخصص للعارض الموحّد لبيت القصيد (public/v/s/pex-cafe.js) */
(function(){
"use strict";
/* ============ GEOMETRY BASIS (metres) ============
   x: 0 → 20.4 (left wall → right wall, looking from the street)
   z: 0 = back wall, front facade slopes: z=11.76 at left → 9.26 at right
   Floor-to-floor 4.0 m; GF false ceiling at 3.0 m (per elevations).        */
const W=20.4, DL=11.76, DR=9.26, FH=4.0, NF=3;
const frontZ=x=>DL-(DL-DR)*x/W;
const R=Math.PI/180;

/* ---------- renderer ---------- */
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
(document.getElementById('three')||document.body).appendChild(renderer.domElement);renderer.domElement.style.display='block';
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(50,1.6,0.05,400);
camera.position.set(-16,20,40);
const controls=new THREE.OrbitControls(camera,renderer.domElement);
controls.target.set(W/2,4,5.5);
controls.enableDamping=true;controls.dampingFactor=.08;
controls.maxPolarAngle=88*R;controls.minDistance=2;controls.maxDistance=120;

/* ---------- procedural textures ---------- */
function cnv(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);return c;}
function tex(c,rx,ry,srgb=true){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);if(srgb)t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;}
function noise(g,w,h,a,base){const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-.5)*a;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n;}g.putImageData(d,0,0);}
const C={
  tile:cnv(512,512,(g,w,h)=>{g.fillStyle='#8f8b88';g.fillRect(0,0,w,h);noise(g,w,h,22);for(let i=0;i<40;i++){g.fillStyle=`rgba(${Math.random()<.5?60:200},${Math.random()<.5?60:195},190,.04)`;g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,60+Math.random()*90,30+Math.random()*50,Math.random()*3,0,7);g.fill();}g.strokeStyle='#6c6865';g.lineWidth=2;g.strokeRect(0,0,w,h);g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();}),
  brick:cnv(512,512,(g,w,h)=>{g.fillStyle='#4a2c25';g.fillRect(0,0,w,h);const bh=32,bw=96;for(let r=0;r<h/bh;r++){for(let c=-1;c<w/bw+1;c++){const x=c*bw+(r%2?bw/2:0);const v=Math.random()*40;g.fillStyle=`rgb(${120+v},${55+v*.5},${42+v*.4})`;g.fillRect(x+3,r*bh+3,bw-6,bh-6);}}noise(g,w,h,26);}),
  corr:cnv(256,64,(g,w,h)=>{for(let x=0;x<w;x++){const s=Math.sin(x/w*Math.PI*2*8);const v=150+s*55;g.fillStyle=`rgb(${v+40},${v*.12},${v*.14})`;g.fillRect(x,0,1,h);}}),
  wood:cnv(512,256,(g,w,h)=>{g.fillStyle='#4b2f22';g.fillRect(0,0,w,h);for(let i=0;i<160;i++){g.strokeStyle=`rgba(${20+Math.random()*30},${10+Math.random()*15},5,${.15+Math.random()*.25})`;g.lineWidth=1+Math.random()*2;g.beginPath();const y=Math.random()*h;g.moveTo(0,y);for(let x=0;x<=w;x+=32)g.lineTo(x,y+Math.sin(x/60+i)*4);g.stroke();}}),
  conc:cnv(512,512,(g,w,h)=>{g.fillStyle='#5d5a58';g.fillRect(0,0,w,h);noise(g,w,h,30);for(let i=0;i<60;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.06})`;g.beginPath();g.arc(Math.random()*w,Math.random()*h,20+Math.random()*80,0,7);g.fill();}}),
  mesh:cnv(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#fff';g.lineWidth=7;for(let i=-w;i<w*2;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i+h,h);g.stroke();g.beginPath();g.moveTo(i,h);g.lineTo(i+h,0);g.stroke();}}),
  cnc:cnv(256,256,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#000';const s=64;for(let y=0;y<4;y++)for(let x=0;x<4;x++)g.fillRect(x*s+10,y*s+10,s-20,s-20);}),
  subway:cnv(256,256,(g,w,h)=>{g.fillStyle='#202020';g.fillRect(0,0,w,h);const bh=32,bw=64;for(let r=0;r<8;r++)for(let c=-1;c<5;c++){const x=c*bw+(r%2?32:0);const v=30+Math.random()*10;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x+2,r*bh+2,bw-4,bh-4);}}),
  steel:cnv(256,256,(g,w,h)=>{for(let y=0;y<h;y++){const v=150+Math.random()*30;g.fillStyle=`rgb(${v},${v},${v+3})`;g.fillRect(0,y,w,1);}}),
  peg:cnv(128,128,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#000';for(let y=8;y<h;y+=16)for(let x=8;x<w;x+=16){g.beginPath();g.arc(x,y,3,0,7);g.fill();}}),
  felt:cnv(64,64,(g,w,h)=>{g.fillStyle='#1d5a3b';g.fillRect(0,0,w,h);noise(g,w,h,14);}),
};

/* ---------- materials ---------- */
const M={};
const std=(o)=>new THREE.MeshStandardMaterial(o);
M.floor=std({map:tex(C.tile,1/1.2,1/1.2),roughness:.35,metalness:.05});
M.brick=std({map:tex(C.brick,1,1),roughness:.9});
M.corr=std({map:tex(C.corr,1,1),roughness:.35,metalness:.55});
M.wood=std({map:tex(C.wood,1,1),roughness:.55});
M.woodDark=std({map:tex(C.wood,2,1),color:0x9a7a6a,roughness:.6});
M.conc=std({map:tex(C.conc,1,1),roughness:.95});
M.plaster=std({color:0xd8d4cf,roughness:.95});
M.gyps=std({color:0x5a5658,roughness:.9});
M.black=std({color:0x161414,roughness:.55,metalness:.6});
M.blackMatte=std({color:0x1c1a1a,roughness:.9});
M.mesh=std({color:0x1a1a1a,alphaMap:tex(C.mesh,4,4,false),transparent:true,alphaTest:.4,side:THREE.DoubleSide,metalness:.6,roughness:.5});
M.cnc=std({color:0xb8141c,alphaMap:tex(C.cnc,2,4,false),transparent:true,alphaTest:.5,side:THREE.DoubleSide,roughness:.45});
M.subway=std({map:tex(C.subway,3,2),roughness:.3});
M.steel=std({map:tex(C.steel,1,1),metalness:.85,roughness:.35});
M.alu=std({map:tex(C.steel,1,1),color:0xbfbfc4,metalness:.7,roughness:.3});
M.peg=std({color:0x2a2a2a,alphaMap:tex(C.peg,3,3,false),transparent:true,alphaTest:.5,side:THREE.DoubleSide});
M.leather=std({color:0x3b2119,roughness:.6});
M.leatherRed=std({color:0x6a1418,roughness:.55});
M.fabric=std({color:0x2a2324,roughness:.95});
M.glass=std({color:0x9fb8c4,transparent:true,opacity:.18,roughness:.05,metalness:.2,depthWrite:false,side:THREE.DoubleSide});
M.glassDark=std({color:0x223038,transparent:true,opacity:.45,roughness:.05,metalness:.3,depthWrite:false});
M.felt=std({map:tex(C.felt,1,1),roughness:.95});
M.red=std({color:0xb3141c,roughness:.45});
M.white=std({color:0xeeeeee,roughness:.3});
M.plant=std({color:0x2f5a2a,roughness:.9});
M.ext=std({color:0x2b2829,roughness:.6,metalness:.4});
M.ground=std({color:0x3a3836,roughness:1});
M.side=std({color:0x8a8178,roughness:1});
// emissive (LED) — intensity driven by day/night
const glow=[];
function led(color,base){const m=new THREE.MeshStandardMaterial({color:0x111111,emissive:color,emissiveIntensity:base});m.userData.base=base;glow.push(m);return m;}
M.ledRed=led(0xff1f2a,1.2);
M.ledWarm=led(0xffc98a,1.0);
M.ledWhite=led(0xf6f2ea,1.1);

/* ---------- animated screens ---------- */
const scr={};
function screenTex(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return {c,g:c.getContext('2d'),t};}
scr.foot=screenTex(512,288);scr.race=screenTex(512,288);scr.holo=screenTex(256,512);scr.game=screenTex(512,288);
const players=[...Array(14)].map((_,i)=>({x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.004,vy:(Math.random()-.5)*.004,t:i<7}));
let ball={x:.5,y:.5,vx:.006,vy:.003};
function drawFoot(tm){const {g}=scr.foot,w=512,h=288;g.fillStyle='#2f7a35';g.fillRect(0,0,w,h);for(let i=0;i<10;i++){g.fillStyle=i%2?'#2c7332':'#338238';g.fillRect(i*w/10,0,w/10,h);}g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=2;g.strokeRect(20,20,w-40,h-40);g.beginPath();g.moveTo(w/2,20);g.lineTo(w/2,h-20);g.stroke();g.beginPath();g.arc(w/2,h/2,36,0,7);g.stroke();g.strokeRect(20,h/2-55,60,110);g.strokeRect(w-80,h/2-55,60,110);
  ball.x+=ball.vx;ball.y+=ball.vy;if(ball.x<.06||ball.x>.94)ball.vx*=-1;if(ball.y<.08||ball.y>.92)ball.vy*=-1;
  players.forEach(p=>{p.vx+= (ball.x-p.x)*.00009+(Math.random()-.5)*.0006;p.vy+=(ball.y-p.y)*.00009+(Math.random()-.5)*.0006;p.vx*=.97;p.vy*=.97;p.x+=p.vx;p.y+=p.vy;g.fillStyle=p.t?'#d4262f':'#f2f2f2';g.beginPath();g.arc(20+p.x*(w-40),20+p.y*(h-40),5,0,7);g.fill();});
  g.fillStyle='#fff';g.beginPath();g.arc(20+ball.x*(w-40),20+ball.y*(h-40),3.5,0,7);g.fill();
  g.fillStyle='rgba(10,10,10,.75)';g.fillRect(14,10,150,26);g.fillStyle='#fff';g.font='bold 15px sans-serif';g.fillText('PEX LIVE   2 - 1',22,28);g.fillStyle='#d4262f';g.fillRect(14,10,6,26);
  g.fillStyle='rgba(10,10,10,.75)';g.fillRect(w-86,10,72,26);g.fillStyle='#fff';const mm=Math.floor(tm/1000)%90;g.fillText((mm+'').padStart(2,'0')+"'",w-66,28);
  scr.foot.t.needsUpdate=true;}
function drawRace(tm){const {g}=scr.race,w=512,h=288;const sky=g.createLinearGradient(0,0,0,h*.45);sky.addColorStop(0,'#7aa9d6');sky.addColorStop(1,'#cfe0ee');g.fillStyle=sky;g.fillRect(0,0,w,h*.45);g.fillStyle='#4f7a3a';g.fillRect(0,h*.45,w,h);const cx=w/2+Math.sin(tm/1400)*60;g.fillStyle='#3a3a3c';g.beginPath();g.moveTo(cx-8,h*.45);g.lineTo(cx+8,h*.45);g.lineTo(w*.95,h);g.lineTo(w*.05,h);g.fill();const o=(tm/60)%40;for(let i=0;i<12;i++){const t=((i*40+o)%480)/480;const y=h*.45+t*t*h*.55;const x=cx+(w/2-cx)*t;const ww=2+t*14;g.fillStyle=i%2?'#e33':'#fff';g.fillRect(cx-8-(cx-8-w*.05)*t-ww,y,ww,3+t*8);g.fillRect(cx+8+(w*.95-cx-8)*t,y,ww,3+t*8);g.fillStyle='#ddd';g.fillRect(x-1-t*3,y,2+t*6,2+t*10);}g.fillStyle='#c41a22';g.fillRect(w/2-34,h-70,68,40);g.fillStyle='#111';g.fillRect(w/2-44,h-44,20,22);g.fillRect(w/2+24,h-44,20,22);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(10,10,120,24);g.fillStyle='#fff';g.font='bold 14px sans-serif';g.fillText('LAP 2/5  P3',18,27);g.fillText(Math.floor(180+Math.sin(tm/700)*60)+' km/h',w-110,h-14);scr.race.t.needsUpdate=true;}
function drawHolo(tm){const {g}=scr.holo,w=256,h=512;g.fillStyle='#000';g.fillRect(0,0,w,h);g.save();g.translate(w/2,h*.52);const k=Math.sin(tm/500);g.strokeStyle='rgba(90,220,255,.95)';g.lineWidth=9;g.lineCap='round';g.shadowColor='#4cd8ff';g.shadowBlur=16;
  g.beginPath();g.arc(0,-150,22,0,7);g.stroke();g.beginPath();g.moveTo(0,-125);g.lineTo(4,-30);g.stroke();
  g.beginPath();g.moveTo(0,-110);g.lineTo(-45,-70+k*10);g.moveTo(0,-110);g.lineTo(48,-80-k*10);g.stroke();
  g.beginPath();g.moveTo(4,-30);g.lineTo(-30,40);g.lineTo(-38,120);g.moveTo(4,-30);g.lineTo(40+k*25,30);g.lineTo(70+k*40,80+k*-10);g.stroke();
  g.beginPath();g.arc(92+k*40,105,16,0,7);g.stroke();g.restore();
  g.strokeStyle='rgba(90,220,255,.5)';g.lineWidth=2;g.strokeRect(14,14,90,34);g.fillStyle='rgba(90,220,255,.9)';g.font='bold 15px sans-serif';g.fillText('PLAYER 10',22,37);
  for(let i=0;i<4;i++){g.strokeRect(w-60,120+i*60,40,40);}
  const s=(tm/12)%h;g.fillStyle='rgba(90,220,255,.12)';g.fillRect(0,s,w,6);
  for(let y=0;y<h;y+=4){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,y,w,1);}scr.holo.t.needsUpdate=true;}
function drawGame(tm){const {g}=scr.game,w=512,h=288;g.fillStyle='#1b1030';g.fillRect(0,0,w,h);for(let i=0;i<8;i++){g.fillStyle=`hsl(${(tm/20+i*45)%360},70%,55%)`;const x=(i*80+tm/8)%(w+80)-40;g.fillRect(x,h*.6-Math.abs(Math.sin(tm/300+i))*60,40,120);}g.fillStyle='#fff';g.font='bold 16px sans-serif';g.fillText('P1  24,560',16,28);g.fillText('P2  21,300',w-120,28);scr.game.t.needsUpdate=true;}
const screenMats={foot:new THREE.MeshBasicMaterial({map:scr.foot.t,toneMapped:false}),race:new THREE.MeshBasicMaterial({map:scr.race.t,toneMapped:false}),game:new THREE.MeshBasicMaterial({map:scr.game.t,toneMapped:false}),
  holo:new THREE.MeshBasicMaterial({map:scr.holo.t,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false})};

/* ---------- builders ---------- */
const root=new THREE.Group();root.scale.x=-1;root.position.x=W;scene.add(root);
const spand=[[],[],[]],floors=[],ceils=[],colliders=[[],[],[]],labels=[],seats=[[],[],[]],extParts=[];
let roof;
for(let f=0;f<NF;f++){const g=new THREE.Group();g.position.y=f*FH;root.add(g);floors.push(g);const c=new THREE.Group();g.add(c);ceils.push(c);}
function info(o,title,spec,zone){o.userData.info={title,spec,zone};return o;}
function uvScale(geo,sx,sy,sz){ // box-ish world-scale UVs
  geo.computeBoundingBox();const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;
  for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));let u,v;
    if(ny>.5){u=p.getX(i);v=p.getZ(i);}else if(nx>.5){u=p.getZ(i);v=p.getY(i);}else{u=p.getX(i);v=p.getY(i);}uv.setXY(i,u,v);}uv.needsUpdate=true;return geo;}
function box(parent,w,h,d,mat,x,y,z,ry=0,opt={}){const geo=uvScale(new THREE.BoxGeometry(w,h,d));const m=new THREE.Mesh(geo,mat);m.position.set(x,y+h/2,z);m.rotation.y=ry;m.castShadow=opt.cast!==false;m.receiveShadow=true;parent.add(m);return m;}
function cyl(parent,r1,r2,h,mat,x,y,z,seg=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function seg2(f,x1,z1,x2,z2,t){colliders[f].push({x1,z1,x2,z2,t});}
// wall along a segment in plan
function wall(f,x1,z1,x2,z2,h,t,mat,y=0,collide=true,parent){const dx=x2-x1,dz=z2-z1,L=Math.hypot(dx,dz);const m=box(parent||floors[f],L,h,t,mat,(x1+x2)/2,y,(z1+z2)/2,-Math.atan2(dz,dx));if(collide)seg2(f,x1,z1,x2,z2,t);return m;}
function grp(parent,x,z,ry=0,y=0){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);return g;}
function label(f,x,z,text,y=1.9){labels.push({f,v:new THREE.Vector3(W-x,f*FH+y,z),el:Object.assign(document.createElement('div'),{className:'lbl',textContent:text})});}

/* furniture pieces (local coords, origin at footprint centre) */
function chair(p,x,z,ry,mat=M.leather){const g=grp(p,x,z,ry);box(g,.46,.06,.46,mat,0,.45,0);box(g,.46,.42,.06,mat,0,.5,-.21);[[-.19,-.19],[.19,-.19],[-.19,.19],[.19,.19]].forEach(([a,b])=>cyl(g,.015,.015,.45,M.black,a,0,b,6));return g;}
function table4(f,x,z,ry=0,size=.8,label_='طاولة طعام 4 أشخاص'){const p=floors[f];const g=grp(p,x,z,ry);box(g,size,.04,size,M.wood,0,.72,0);box(g,.08,.7,.08,M.black,0,.02,0);box(g,.5,.02,.5,M.black,0,0,0);
  const d=size/2+.28;[[0,d,Math.PI],[0,-d,0],[d,0,-Math.PI/2],[-d,0,Math.PI/2]].forEach(([a,b,r])=>{chair(g,a,b,r);const v=new THREE.Vector3(a,0,b).applyAxisAngle(new THREE.Vector3(0,1,0),ry);seats[f].push({x:x+v.x,z:z+v.z,ry:ry+r});});
  info(g,label_,'سطح طاولة 800×800 ملم بقشرة جوز داكن على MDF، قاعدة وسطية حديد مطلي بودرة أسود. كراسي جلد صناعي بني داكن بأرجل معدنية سوداء.');seg2(f,x-.01,z,x+.01,z,size+.5);return g;}
function boothTable(f,x,z,ry=0,w=1.2,d=.9){const g=grp(floors[f],x,z,ry);box(g,w,.04,d,M.wood,0,.72,0);box(g,.08,.7,.08,M.black,-w/2+.15,.02,0);box(g,.08,.7,.08,M.black,w/2-.15,.02,0);info(g,'طاولة جلسة ثابتة','1200×900 ملم قشرة خشب على MDF بسمك 18 ملم، أرجل حديد مربع 30 ملم أسود.');seg2(f,x-w/2,z,x+w/2,z,d);return g;}
function bench(f,x1,z1,x2,z2,depth=.6,mat=M.leather,back=true){ // along segment, seat faces +normal(left side)
  const dx=x2-x1,dz=z2-z1,L=Math.hypot(dx,dz),a=-Math.atan2(dz,dx);const g=grp(floors[f],(x1+x2)/2,(z1+z2)/2,a);
  box(g,L,.42,depth,M.wood,0,0,depth/2);box(g,L,.12,depth-.05,mat,0,.42,depth/2+.02);if(back){box(g,L,.55,.14,mat,0,.5,.08);box(g,L,.04,.06,M.ledRed,0,1.04,.05,0,{cast:false});}
  info(g,'كنبة ثابتة مفصّلة','هيكل خشبي مكسو بقشرة خشب، تنجيد جلد صناعي بني بخياطة أفقية، شريط LED أحمر مخفي أعلى المسند.');seg2(f,x1,z1,x2,z2,depth*1.6);return g;}
function sofa(f,x,z,ry,L=2.2,mat=M.leather){const g=grp(floors[f],x,z,ry);box(g,L,.4,.85,mat,0,0,0);box(g,L,.45,.22,mat,0,.4,-.32);box(g,.2,.6,.85,mat,-L/2+.1,0,0);box(g,.2,.6,.85,mat,L/2-.1,0,0);for(let i=0;i<Math.round(L/0.7);i++){const s=box(g,L/Math.round(L/.7)-.06,.14,.6,mat,-L/2+.1+(i+.5)*(L-.2)/Math.round(L/.7),.4,.08);}info(g,'كنبة جلد Chesterfield','جلد طبيعي/صناعي بني بتنجيد مضلّع، كما في لوحة المزاج.');seg2(f,x,z,x+.01,z,Math.max(L,.85));return g;}
function stool(p,x,z){cyl(p,.19,.19,.06,M.leather,x,.74,z,14);cyl(p,.025,.025,.74,M.black,x,0,z,6);cyl(p,.2,.2,.02,M.black,x,0,z,14);const r=new THREE.Mesh(new THREE.TorusGeometry(.17,.012,6,16),M.black);r.rotation.x=Math.PI/2;r.position.set(x,.3,z);p.add(r);}
function pendant(f,x,z,y=2.4,drop=.8){const p=floors[f];const g=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),new THREE.MeshBasicMaterial({color:0x111111,wireframe:true}));g.position.set(x,y,z);g.scale.y=1.3;p.add(g);const b=new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),M.ledWarm);b.position.set(x,y,z);p.add(b);cyl(p,.004,.004,drop,M.black,x,y+.2,z,4);info(g,'معلّقة إنارة هندسية','إطار معدني أسود مضلّع مع لمبة Edison دافئة 2700K.');return g;}
function tv(f,x,y,z,ry,w=1.6,kind='foot',frame=true){const p=floors[f];const g=grp(p,x,z,ry,y);if(frame)box(g,w+.06,w*.5625+.06,.06,M.black,0,0,-.03);const s=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.5625),screenMats[kind]);s.position.set(0,(w*.5625+.06)/2,.002);s.scale.x=-1;g.add(s);info(g,'شاشة عرض '+(w>=1.6?'75':'55')+' بوصة','شاشة LED لعرض المباريات، تثبيت جداري/معلّق بحامل حديد أسود.');return g;}
function planter(p,x,z,w=.9,d=.4,h=.6){box(p,w,h,d,M.wood,x,0,z);for(let i=0;i<5;i++){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(.16+Math.random()*.1,0),M.plant);s.position.set(x+(Math.random()-.5)*(w-.2),h+.12,z+(Math.random()-.5)*(d-.15));s.castShadow=true;p.add(s);}}
function stripY(p,x1,z1,x2,z2,y,mat=M.ledRed,t=.03){const dx=x2-x1,dz=z2-z1;box(p,Math.hypot(dx,dz),t,t,mat,(x1+x2)/2,y,(z1+z2)/2,-Math.atan2(dz,dx),{cast:false});}

/* ---------- shell per floor ---------- */
function footprint(f){
  if(f===0) return [[0,0],[W,0],[W,DR],[0,DL]];
  const r=1.4,pts=[[0,0],[W,0],[W,DR-r]];const e=[W-r,frontZ(W-r)];
  for(let i=1;i<=8;i++){const t=i/8;const a=[W,DR-r],c=[W,DR];pts.push([(1-t)*(1-t)*a[0]+2*(1-t)*t*c[0]+t*t*e[0],(1-t)*(1-t)*a[1]+2*(1-t)*t*c[1]+t*t*e[1]]);}
  pts.push([0,DL]);return pts;}
function shapeOf(pts,flipZ){const s=new THREE.Shape();pts.forEach(([x,z],i)=>i?s.lineTo(x,flipZ?-z:z):s.moveTo(x,flipZ?-z:z));s.closePath();return s;}
function stadium(x1,z1,x2,z2,flip){const r=(z2-z1)/2,p=new THREE.Path(),s=flip?-1:1;p.moveTo(x1+r,s*z1);p.lineTo(x2-r,s*z1);p.absarc(x2-r,s*(z1+r),r,-Math.PI/2*s,Math.PI/2*s,!flip?false:true);p.lineTo(x1+r,s*z2);p.absarc(x1+r,s*(z1+r),r,Math.PI/2*s,3*Math.PI/2*s,!flip?false:true);return p;}

const piersX=[0.2,5.15,10.3,15.3,20.2];
for(let f=0;f<NF;f++){
  const P=floors[f],fp=footprint(f);
  // floor finish
  const fg=new THREE.ShapeGeometry(shapeOf(fp,true));fg.rotateX(-Math.PI/2);const fl=new THREE.Mesh(fg,M.floor);fl.position.y=.001;fl.receiveShadow=true;P.add(fl);info(fl,'أرضية بورسلين','بلاط بورسلين رمادي بملمس كونكريت مقاس 1200×600 ملم، فواصل 2 ملم (من المناظير — لا يوجد مخطط أرضيات).');
  // structural slab under
  const sg=new THREE.ExtrudeGeometry(shapeOf(fp,false),{depth:.3,bevelEnabled:false});sg.rotateX(Math.PI/2);const sl=new THREE.Mesh(sg,M.ext);sl.position.y=0;P.add(sl);extParts.push(sl);
  // back wall & left wall (party walls) – brick wallpaper on gypsum inside
  wall(f,0,-.12,W,-.12,FH,.24,M.conc);wall(f,-.12,0,-.12,DL,FH,.24,M.conc);
  // right wall
  if(f===0) wall(f,W+.12,0,W+.12,DR,FH,.24,M.conc);
  else{wall(f,W+.12,0,W+.12,1.2,FH,.24,M.conc);
    const fpR=fp.filter(p=>p[0]>W-1.5&&p[1]>1);for(let i=0;i<fpR.length-1;i++){const [a,b]=[fpR[i],fpR[i+1]];wall(f,a[0],a[1],b[0],b[1],3.2,.04,M.glass,0,true);stripY(P,a[0],a[1],b[0],b[1],3.2,M.black,.08);}
    box(P,.12,3.2,.12,M.black,W,0,1.2);}
  // front curtain wall between piers
  for(let i=0;i<piersX.length-1;i++){const x1=piersX[i]+.3,x2=piersX[i+1]-.3;let xe=x2;if(f>0&&i===piersX.length-2)xe=W-1.4;
    const z1=frontZ(x1),z2=frontZ(xe);wall(f,x1,z1,xe,z2,3.2,.03,M.glass,0,true);stripY(P,x1,z1,xe,z2,3.2,M.black,.1);stripY(P,x1,z1,xe,z2,0,M.black,.08);
    const n=Math.ceil((xe-x1)/1.25);for(let k=1;k<n;k++){const xx=x1+(xe-x1)*k/n;box(P,.06,3.2,.1,M.black,xx,0,frontZ(xx));}}
  // spandrel band on facade
  const fr=fp.filter(p=>p[1]>DR-2);const sp=fr.slice().sort((a,b)=>a[0]-b[0]);
  for(let i=0;i<sp.length-1;i++){const a=sp[i],b=sp[i+1];if(Math.abs(a[1]-frontZ(a[0]))<.01&&Math.abs(b[1]-frontZ(b[0]))<.01||f>0){const m=wall(f,a[0],a[1]+.12,b[0],b[1]+.12,.8,.2,M.ext,3.2,false);spand[f].push(m);}}
  // piers & columns (concrete, partly red corrugated clad)
  piersX.forEach((x,i)=>{const z=frontZ(x)-.3;const c=box(P,.6,FH,.6,i===0||i===4?M.conc:M.corr,x,0,z);info(c,'عمود واجهة مكسو','كسوة صفيح مموّج أحمر (Corrugated Metal) مطلي فرن، مع إنارة LED خطية حمراء عند الحواف.');seg2(f,x,z,x+.01,z,.7);});
  [[5.15,5.7],[10.3,5.4],[15.3,5.4],[10.3,0.3],[15.3,0.3],[20.1,4.7]].forEach(([x,z])=>{const c=box(P,.55,FH,.55,f===0&&x===5.15?M.corr:M.conc,x,0,z);info(c,'عمود إنشائي','عمود خرساني مكسو صبغ بملمس كونكريت أو صفيح مموّج أحمر حسب الموقع.');seg2(f,x,z,x+.01,z,.62);});
  // core: stair (U-flight) + lift
  const stepH=FH/24;
  for(let i=0;i<12;i++){box(P,1.0,stepH*(i+1),.3,M.conc,4.3,0,3.75-i*.28);}
  box(P,4.6,2.0,1.15,M.conc,2.5,0,.6);
  for(let i=0;i<12;i++){box(P,1.0,2.0+stepH*(i+1),.3,M.conc,.75,0,1.35+i*.22);}
  wall(f,1.5,1.5,3.6,1.5,FH,.2,M.steel);wall(f,1.5,3.7,3.6,3.7,FH,.2,M.steel);wall(f,1.5,1.5,1.5,3.7,FH,.2,M.steel);wall(f,3.6,1.5,3.6,3.7,FH,.2,M.steel);
  const ld=box(P,1.0,2.2,.04,M.alu,2.55,0,3.82);info(ld,'المصعد','مصعد ركاب داخل بئر الدرج، أبواب ستانلس ستيل مصقول، تكسية المدخل لامينيت بمظهر ألمنيوم مصقول على MDF 18 ملم.');
  stripY(P,0,4.0,5.0,4.0,1.0,M.black,.05);seg2(f,3.8,.3,3.8,3.95,.1);seg2(f,1.3,1.4,1.3,3.95,.1);seg2(f,0,.2,5,.2,.1);
  info(P.children[P.children.length-1],'الدرج','درج خرساني بشكل U حول بئر المصعد، درابزين حديد أسود.');
  // WC block
  wall(f,5.15,2.15,8.3,2.15,FH,.15,M.plaster);wall(f,5.15,2.15,5.15,5.1,FH,.15,M.plaster);wall(f,8.3,2.15,8.3,4.1,FH,.15,M.plaster);wall(f,5.15,5.1,8.3,5.1,FH,.15,f===0?M.brick:M.plaster);
  box(P,.65,.4,.45,M.white,6.1,0,2.5);box(P,.65,.4,.45,M.white,7.5,0,2.5);box(P,.08,2.1,1.3,M.blackMatte,6.8,0,2.85);box(P,1.4,.85,.5,M.subway,5.9,0,4.6);const wc=box(P,1.0,.04,.45,M.white,5.9,.85,4.6);info(wc,'دورة المياه','حمّامان مع حاجز فينولي أسود، مغسلة على كاونتر مكسو ببلاط Subway داكن، باب خشبي بقشرة.');
  // shaft / service
  wall(f,5.15,1.95,8.0,1.95,FH,.15,M.plaster);wall(f,8.0,0,8.0,1.95,FH,.15,M.plaster);
  // ceiling for this floor
  const C_=ceils[f];
  if(f===0){const sh=shapeOf(fp,false);sh.holes.push(stadium(13.65,1.0,19.3,3.4,false));const cg=new THREE.ShapeGeometry(sh);cg.rotateX(Math.PI/2);const cm=new THREE.Mesh(cg,M.plaster);cm.position.y=3.0;C_.add(cm);info(cm,'سقف ثانوي جبسي','جبس بورد مصبوغ مع إنارة مخفية (Cove) عند الحواف، ارتفاعه حسب الموقع. فتحة بيضوية فوق الجلسات الثابتة.');
    const top=box(C_,5.9,.02,2.6,M.blackMatte,16.47,3.85,2.2,0,{cast:false});
    for(let i=0;i<2;i++){const d=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,5.2,14),M.steel);d.rotation.z=Math.PI/2;d.position.set(16.47,3.55,1.7+i*1.0);C_.add(d);info(d,'مجاري تكييف مكشوفة','مجاري حلزونية مصبوغة بالأسود ظاهرة من الفتحة البيضوية في السقف.');}
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.025,6,48),M.ledWhite);ring.rotation.x=Math.PI/2;ring.scale.set(2.82,1.2,1);ring.position.set(16.47,2.98,2.2);C_.add(ring);
    [[2,9.5,9.2],[6,8.6,8.8],[11,8.5,8.1],[16,7.8,7.6]].forEach(([x,z])=>stripY(C_,x,z,x+3.4,z-.42,2.98,M.ledWhite,.04));
    // cove around perimeter
    stripY(C_,.3,.3,W-.3,.3,2.96,M.ledWarm,.05);}
  else{const cg=new THREE.ShapeGeometry(shapeOf(fp,false));cg.rotateX(Math.PI/2);const cm=new THREE.Mesh(cg,M.blackMatte);cm.position.y=3.75;C_.add(cm);info(cm,'سقف مكشوف','بلاطة مكشوفة مصبوغة أسود مطفي مع مجاري تكييف ظاهرة وخطوط إنارة LED خطية.');
    for(let i=0;i<2;i++){const d=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,16,14),M.steel);d.rotation.z=Math.PI/2;d.position.set(11.5,3.35,4.2+i*2.4);C_.add(d);}
    [[1,8],[3,6.5],[9,8.2],[12,7.6],[16,7]].forEach(([x,z])=>stripY(C_,x,z,x+3.6,z-.44,3.7,M.ledWhite,.04));
    stripY(C_,.3,.3,W-.3,.3,3.6,M.ledRed,.05);}
}

/* ============ GROUND FLOOR ============ */
(function(){const f=0,P=floors[0];
  // entrance door (double glass) front-left
  const dz=frontZ(1.9);const dg=grp(P,1.9,dz-.05,Math.atan2(DL-DR,W));box(dg,1.7,2.6,.05,M.glassDark,0,0,0);box(dg,.06,2.6,.08,M.black,0,0,0);box(dg,.04,1,.04,M.steel,-.12,.6,.06);box(dg,.04,1,.04,M.steel,.12,.6,.06);info(dg,'المدخل الرئيسي','باب زجاجي مزدوج سيكوريت بإطار ألمنيوم أسود، مقابض ستانلس عمودية.');
  // reception desk: CNC mesh front + wood top + warm uplights (render 1)
  const rd=grp(P,3.55,9.25,Math.PI/2);box(rd,2.4,1.05,.6,M.black,0,0,0);const fm=new THREE.Mesh(new THREE.PlaneGeometry(2.36,1.0),M.mesh);fm.position.set(0,.53,.31);rd.add(fm);box(rd,2.3,.9,.02,M.ledWarm,0,.05,.27,0,{cast:false});box(rd,2.5,.05,.7,M.wood,0,1.05,0);
  info(rd,'كاونتر الاستقبال','2400×600 ملم: هيكل حديد مربع 30 ملم أسود، واجهة شبك معدني (Metal Mesh) خلفها إنارة دافئة، سطح قشرة خشب. خلفه وحدة عرض قمصان وكرات بإنارة حمراء.');seg2(f,3.55,8.05,3.55,10.45,.7);
  // display wall behind reception (left wall) with red frames
  const dw=grp(P,.15,10.3,Math.PI/2);box(dw,2.6,2.6,.3,M.woodDark,0,.2,0);for(let r=0;r<3;r++)for(let c=0;c<4;c++){box(dw,.5,.5,.05,M.ledRed,-.95+c*.63,.55+r*.75,.16,0,{cast:false});box(dw,.42,.42,.06,M.blackMatte,-.95+c*.63,.59+r*.75,.17);}info(dw,'وحدة عرض الاستقبال','رفوف عرض مكعبة بإطارات LED حمراء لعرض القمصان والخوذ والكرات.');
  // lounge: Chesterfield sofa + armchairs + coffee table + PEX feature wall
  sofa(f,.65,7.5,Math.PI/2,2.4);const ct=box(P,1.1,.38,.6,M.blackMatte,1.75,0,7.5);info(ct,'طاولة قهوة','سطح حجر/كوارتز أسود بقاعدة معدنية.');
  [[2.3,8.7,-2.3],[2.3,6.3,-.9]].forEach(([x,z,r])=>{const g=grp(P,x,z,r);box(g,.8,.42,.8,M.leather,0,0,0);box(g,.8,.4,.18,M.leather,0,.42,-.31);});
  const pw=grp(P,.14,7.0,Math.PI/2);const cp=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.4),M.cnc);cp.position.set(0,1.75,.02);pw.add(cp);box(pw,3.5,2.5,.04,M.blackMatte,0,.5,-.03);box(pw,3.5,.04,.04,M.ledRed,0,.5,0,0,{cast:false});box(pw,3.5,.04,.04,M.ledRed,0,2.98,0,0,{cast:false});
  const sgn=cnv(512,180,(g,w,h)=>{g.font='900 140px "Readex Pro",sans-serif';g.textAlign='center';g.fillStyle='#ff3b42';g.shadowColor='#ff0000';g.shadowBlur=24;g.fillText('PeX',w/2,140);});
  const sm=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.63),new THREE.MeshBasicMaterial({map:tex(sgn,1,1),transparent:true,toneMapped:false}));sm.position.set(0,1.95,.06);sm.scale.x=-1;pw.add(sm);info(pw,'جدار PEX المميز','ألواح MDF بتصميم CNC شبكي مصبوغة أحمر على خلفية سوداء، شعار PEX مضيء بنيون أحمر، شريطا LED أعلى وأسفل.');
  label(f,1.8,8.2,'صالة الانتظار');label(f,3.5,10.4,'الاستقبال',1.5);
  // hologram (render: transparent LED display, red curtain/corrugated column beside)
  const hg=grp(P,7.0,5.95,0);box(hg,2.6,.25,.4,M.black,0,0,0);box(hg,.12,3.0,.12,M.black,-1.3,0,0);box(hg,.12,3.0,.12,M.black,1.3,0,0);box(hg,2.6,.12,.12,M.black,0,2.88,0);const hs=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.55),screenMats.holo);hs.scale.x=-1;hs.position.set(0,1.55,0);hg.add(hs);const hb=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.55),M.glassDark);hb.position.set(0,1.55,-.02);hg.add(hb);
  info(hg,'شاشة الهولوغرام','شاشة LED شفافة 2600 ملم بإطار حديد مربع أسود، تعرض محتوى تفاعلياً للاعبين (توريد خاص). خلفها جدار صبغ بملمس كونكريت.');seg2(f,5.7,5.95,8.3,5.95,.4);label(f,7,6.4,'الهولوغرام',3.3);
  // fin partitions at front piers: wood cabinet + red CNC + planter (plan: px465-490 etc.)
  [[5.15,3.0],[10.3,2.6],[15.3,2.1]].forEach(([x,L])=>{const z0=frontZ(x)-.6;const g=grp(P,x,z0-L/2,0);box(g,.3,2.5,L,M.woodDark,0,0,0);const c=new THREE.Mesh(new THREE.PlaneGeometry(L,2.1),M.cnc);c.rotation.y=Math.PI/2;c.position.set(.16,1.3,0);g.add(c);const c2=c.clone();c2.position.x=-.16;g.add(c2);planter(g,0,L/2-.3,.35,.5,.5);info(g,'حاجز فاصل بين الجلسات','صندوق MDF بقشرة خشب جوز مع ألواح CNC شبكية حمراء على الوجهين وحوض زرع مدمج، يمتد من عمود الواجهة إلى الداخل.');seg2(f,x,z0,x,z0-L,.35);});
  // dining tables (from plan)
  [[6.7,9.4,0],[8.8,8.7,0],[11.8,8.6,0],[13.8,8.4,0],[16.9,7.9,45*R],[11.6,6.4,0],[13.9,6.4,0],[16.9,4.0,45*R],[19.0,3.4,45*R]].forEach(([x,z,r])=>table4(f,x,z,r));
  [[6.7,9.4],[11.8,8.6],[13.9,6.4],[16.9,7.9]].forEach(([x,z])=>pendant(f,x,z,2.35,.6));
  label(f,10.6,8.7,'جلسات الطعام');
  // brick feature wall with TV on interior columns
  [[10.3,5.4],[15.3,5.4]].forEach(([x,z])=>{const bw=box(P,.7,3.0,.7,M.brick,x,0,z);info(bw,'عمود مكسو بورق طابوق','ورق جدران بنقشة طابوق على جبس، إطار حديد مربع 20 ملم أسود مع شبك معدني على الجوانب.');tv(f,x,1.5,z+.36,0,1.4);});
  // bar along right wall: front counter (x18.07-19.0, z5.1-8.67) + back counter & shelves
  const bar=grp(P,18.55,6.9,Math.PI/2);box(bar,3.6,1.05,.9,M.black,0,0,0);[-1.2,0,1.2].forEach(o=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.0),M.mesh);m.position.set(o,.52,.46);bar.add(m);});
  box(bar,3.6,.03,.03,M.ledRed,0,.02,.47,0,{cast:false});box(bar,.03,1.05,.03,M.ledRed,-1.8,0,.47,0,{cast:false});box(bar,.03,1.05,.03,M.ledRed,1.8,0,.47,0,{cast:false});box(bar,3.7,.05,1.0,M.wood,0,1.05,0);
  const vit=box(bar,1.3,.35,.5,M.glass,.8,1.1,-.1);
  info(bar,'كاونتر البار','3600×900 ملم: إطار حديد مربع 30 ملم أسود، واجهة شبك معدني بزخرفة ماسية، إنارة LED حمراء على المحيط، سطح قشرة خشب، فاترينة حلويات زجاجية.');seg2(f,18.55,5.1,18.55,8.7,.95);
  for(let i=0;i<4;i++)stool(P,17.75,5.6+i*.95);
  const bb=grp(P,20.1,6.85,-Math.PI/2);box(bb,3.7,.9,.6,M.alu,0,0,0);box(bb,3.7,.04,.62,M.blackMatte,0,.9,0);const tl=box(bb,3.7,1.9,.05,M.subway,0,.95,-.3);
  for(let r=0;r<3;r++){box(bb,3.5,.03,.28,M.wood,0,1.35+r*.45,-.15);box(bb,3.5,.02,.02,M.ledWarm,0,1.33+r*.45,-.05,0,{cast:false});for(let k=0;k<12;k++){cyl(bb,.05,.05,.18+Math.random()*.08,k%3?M.leatherRed:M.alu,-1.6+k*.29,1.38+r*.45,-.15,8);}}
  const menu=box(bb,1.4,.7,.03,M.blackMatte,0,2.95,-.26);
  info(bb,'الكاونتر الخلفي ورفوف البار','خزائن سفلية بلامينيت ألمنيوم مصقول، جدار بلاط Subway داكن، رفوف قشرة خشب بإنارة مخفية دافئة (معبأة بمرطبانات قهوة وعبوات عصير)، لوحة قائمة طعام سوداء.');seg2(f,20.1,5,20.1,8.7,.6);
  // hanging screens frame over bar
  const hf=grp(P,18.55,6.9,Math.PI/2,2.35);box(hf,3.4,.06,.9,M.black,0,0,0);const hm=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.9),M.mesh);hm.rotation.x=-Math.PI/2;hm.position.y=.07;hf.add(hm);[-1.1,0,1.1].forEach((o,i)=>{const t=tv(f,0,0,0,0,1.05,'foot');hf.add(t);t.position.set(o,.08,.42);t.rotation.set(0,0,0);});info(hf,'إطار الشاشات المعلّق','إطار حديد مربع معلّق بشبك معدني أفقي، يحمل 3 شاشات فوق البار.');
  label(f,18.6,7.0,'البار');
  // fixed seating zone (booths) with partition wall x=12.6
  wall(f,12.6,0,12.6,5.0,FH,.15,M.brick);const wb=floors[0].children[floors[0].children.length-1];info(wb,'جدار الجلسات الثابتة','ورق جدران بنقشة طابوق على جبس مع لوحات رياضية مؤطرة.');
  bench(f,12.75,4.6,12.75,.25,.6);bench(f,13.3,.15,20.25,.15,.6);
  [[14.2,3.4],[14.2,1.25],[16.7,1.25],[18.9,1.25]].forEach(([x,z])=>{boothTable(f,x,z);chair(P,x-.3,z+.75,Math.PI);chair(P,x+.3,z+.75,Math.PI);seats[0].push({x:x-.3,z:z+.75,ry:Math.PI});});
  // corrugated red panel feature in booth area + TV
  const rp=box(P,2.6,2.6,.06,M.corr,16.5,.2,.08);info(rp,'لوح صفيح مموّج أحمر','صفيح مموّج مطلي أحمر لامع، مثبت على الجدار الخلفي فوق الكنبة.');tv(f,16.5,1.35,.15,0,1.4);
  [[14.2,2.3],[16.6,2.3],[18.9,2.3]].forEach(([x,z])=>pendant(f,x,z,2.6,1.0));
  label(f,16.3,2.4,'الجلسات الثابتة');
  // hookah room
  wall(f,9.25,3.1,9.25,5.1,FH,.15,M.plaster);wall(f,9.25,5.1,11.35,5.1,FH,.15,M.brick);wall(f,11.35,3.1,11.35,5.1,FH,.15,M.plaster);wall(f,9.9,3.1,11.35,3.1,FH,.15,M.plaster);
  sofa(f,10.3,3.6,0,1.8,M.leatherRed);box(P,.8,.4,.5,M.blackMatte,10.3,0,4.4);label(f,10.3,4.1,'غرفة الأركيلة');
  // kitchen
  wall(f,8.3,3.1,9.25,3.1,FH,.15,M.plaster);wall(f,11.35,3.1,12.6,3.1,FH,.15,M.plaster);box(P,4.0,.9,.65,M.steel,10.4,0,.45);box(P,.65,.9,2.0,M.steel,12.15,0,1.8);box(P,1.4,.9,.9,M.steel,9.5,0,1.9);const kh=box(P,2.0,.5,.9,M.steel,10.4,2.2,.5);info(kh,'المطبخ','طاولات عمل ستانلس ستيل، شفاط فوق خط الطبخ، أرضية مقاومة للانزلاق (التفاصيل غير مذكورة في المخططات).');label(f,10.4,1.6,'المطبخ');
  label(f,6.7,3.6,'دورات المياه');label(f,2.5,2.6,'الدرج والمصعد',2.2);
})();

/* ============ FIRST FLOOR ============ */
(function(){const f=1,P=floors[1];
  // control room + hologram
  wall(f,5.15,5.1,5.15,6.2,FH,.15,M.plaster);wall(f,5.15,6.2,7.8,6.2,FH,.15,M.brick);wall(f,7.8,5.6,7.8,6.2,FH,.15,M.plaster);label(f,6.4,5.6,'غرفة التحكم');
  const hg=grp(P,6.3,6.85,0);box(hg,2.5,.2,.35,M.black,0,0,0);const hs=new THREE.Mesh(new THREE.PlaneGeometry(2.3,2.5),screenMats.holo);hs.scale.x=-1;hs.position.set(0,1.5,0);hg.add(hs);info(hg,'شاشة الهولوغرام – الطابق الأول','شاشة LED شفافة بإطار حديد أسود مقابل جدار عرض الكرات الرياضية.');
  // bar area: front counter z~6.1 + back bar; tiled zone
  const bar=grp(P,11.65,6.1,0);box(bar,3.6,1.05,.6,M.black,0,0,0);const m=new THREE.Mesh(new THREE.PlaneGeometry(3.5,1.0),M.mesh);m.position.set(0,.52,.31);bar.add(m);box(bar,3.6,.03,.03,M.ledRed,0,.02,.32,0,{cast:false});box(bar,3.7,.05,.7,M.wood,0,1.05,0);info(bar,'كاونتر بار الطابق الأول','3632 ملم: حديد أسود وشبك معدني ماسي بإنارة LED حمراء، سطح خشب، 5 كراسي بار.');seg2(f,9.85,6.1,13.45,6.1,.65);
  for(let i=0;i<5;i++)stool(P,10.2+i*.72,6.8);
  const bb=grp(P,11.9,4.55,0);box(bb,4.3,.9,.6,M.alu,0,0,0);box(bb,4.3,2.0,.05,M.subway,0,.9,-.3);for(let r=0;r<3;r++){box(bb,4.1,.03,.28,M.wood,0,1.3+r*.45,-.15);box(bb,4.1,.02,.02,M.ledWarm,0,1.28+r*.45,-.05,0,{cast:false});}info(bb,'رفوف البار الخلفية','بلاط Subway داكن، رفوف خشب بإنارة مخفية، خزائن سفلية لامينيت ألمنيوم.');seg2(f,9.8,4.4,14.0,4.4,.6);
  const hf=grp(P,11.65,5.4,0,2.4);box(hf,3.4,.06,.8,M.black,0,0,0);[-1.1,0,1.1].forEach(o=>{const t=tv(f,0,0,0,0,1.0,'foot');hf.add(t);t.position.set(o,.08,.4);});
  label(f,11.6,5.4,'البار');
  // hookah room
  wall(f,7.85,.15,7.85,4.2,FH,.15,M.plaster);wall(f,8.6,4.2,11.25,4.2,FH,.15,M.brick);wall(f,11.25,.15,11.25,4.2,FH,.15,M.plaster);
  bench(f,8.0,.25,11.1,.25,.6,M.leatherRed);bench(f,8.0,3.9,8.0,.9,.6,M.leatherRed);[[9.3,1.3],[10.5,1.3],[9.3,2.8]].forEach(([x,z])=>boothTable(f,x,z,0,.9,.6));label(f,9.6,2.2,'غرفة الأركيلة');
  // lounge: L sofa + tables + TV wall + red corrugated
  bench(f,11.6,4.0,11.6,.4,.7);bench(f,11.8,.25,16.5,.25,.7);boothTable(f,13.3,3.0,Math.PI/2,1.2,.5);boothTable(f,13.6,1.3);boothTable(f,15.6,1.3);table4(f,15.9,5.0);
  const tw=grp(P,17.05,2.45,-Math.PI/2);box(tw,2.4,3.2,.15,M.corr,0,0,0);info(tw,'جدار الشاشة – صالة الجلوس','صفيح مموّج أحمر بإطار حديد، شاشة 75 بوصة.');tv(f,16.95,1.4,2.45,-Math.PI/2,1.7);
  label(f,14.2,2.4,'صالة الجلوس');
  // right-window booths (4)
  [[7.3],[5.6],[3.0],[1.3]].forEach(([z],i)=>{bench(f,20.25,z-.75,20.25,z+.75,.55,M.leather,true);boothTable(f,19.3,z,Math.PI/2,1.0,.7);chair(P,18.6,z-.3,Math.PI/2);chair(P,18.6,z+.3,Math.PI/2);});
  label(f,19.4,4.3,'جلسات النوافذ');
  // front/left cafe tables
  [[2.6,10.2,0],[1.3,8.6,45*R],[3.8,8.6,45*R],[1.3,6.6,45*R],[6.4,9.7,0],[8.7,9.3,0],[11.1,9.0,0],[13.4,8.7,0],[16.0,8.3,0],[18.0,7.9,0]].forEach(([x,z,r])=>table4(f,x,Math.min(z,frontZ(x)-1.0),r));
  [[2.6,9.3],[8.7,8.6],[13.4,8.0]].forEach(([x,z])=>pendant(f,x,z,2.6,1.0));
  // fin partitions with planters
  [[5.15,2.2],[10.3,2.2],[15.3,2.2]].forEach(([x,L])=>{const z0=frontZ(x)-.6;const g=grp(P,x,z0-L/2,0);box(g,.3,1.0,L,M.woodDark,0,0,0);planter(g,0,0,.3,L-.2,1.0);const c=new THREE.Mesh(new THREE.PlaneGeometry(L,1.6),M.mesh);c.rotation.y=Math.PI/2;c.position.set(0,2.0,0);g.add(c);info(g,'حاجز نباتات','صندوق زرع بقشرة خشب يعلوه إطار حديد أسود بشبك معدني.');seg2(f,x,z0,x,z0-L,.35);});
  // ball display wall (render) on left wall
  const bw=grp(P,.15,4.9,Math.PI/2);box(bw,1.6,3.0,.25,M.woodDark,0,0,0);for(let r=0;r<6;r++)for(let c=0;c<3;c++){const s=new THREE.Mesh(new THREE.SphereGeometry(.2,14,10),std({color:[0xd3532a,0xe8e8e8,0x2a4ea6,0xc21e2a][(r+c)%4],roughness:.6}));s.position.set(-.5+c*.5,.4+r*.46,.2);bw.add(s);}info(bw,'جدار عرض الكرات','رفوف كرات رياضية مثبتة على لوح خشبي، بجانب شاشة الهولوغرام.');
  label(f,3.0,8.0,'جلسات المقهى');
})();

/* ============ SECOND FLOOR ============ */
(function(){const f=2,P=floors[2];
  // racing simulators ×3 facing +x with triple screens
  [9.5,7.5,5.5].forEach(z=>{const g=grp(P,1.2,z,Math.PI/2);box(g,1.3,.12,2.1,M.black,0,0,0);box(g,.6,.35,.65,M.leatherRed,0,.12,.25);box(g,.6,.7,.15,M.leatherRed,0,.3,.6);box(g,.6,.08,.08,M.black,0,.72,-.35);const w=new THREE.Mesh(new THREE.TorusGeometry(.17,.03,8,20),M.black);w.position.set(0,.95,-.35);w.rotation.x=-.3;g.add(w);
    box(g,.06,1.3,.06,M.black,0,0,-.95);[-0.72,0,0.72].forEach((o,i)=>{const t=tv(f,0,0,0,0,.72,'race');g.add(t);t.position.set(o,1.05,-.95);t.rotation.y=(i-1)*-0.5;});
    info(g,'جهاز محاكاة سباق','كوكبيت محاكاة احترافي بمقعد Bucket أحمر ومقود ودواسات، و3 شاشات منحنية 32 بوصة (توريد خاص).');seg2(f,1.2,z-.7,1.2,z+.7,1.2);});
  [[2.9,8.6],[3.0,6.6]].forEach(([x,z])=>{const s=new THREE.Mesh(new THREE.SphereGeometry(.4,14,10),M.leatherRed);s.scale.y=.6;s.position.set(x,.22,z);P.add(s);info(s,'كرسي Bean bag','جلد صناعي أحمر لمنطقة انتظار المتسابقين.');});
  // racing wall graphic: red chevrons on black
  const rw=grp(P,.14,7.5,Math.PI/2);box(rw,5.5,3.2,.05,M.blackMatte,0,0,0);for(let i=0;i<5;i++){box(rw,.35,1.6,.06,M.red,-2.2+i*.55,1.6,.02).rotation.z=.6;}info(rw,'جدار منطقة السباق','لوح ACP أسود مع شرائط حمراء مائلة (Chevrons)، بلا شعارات تجارية.');
  label(f,2.0,7.6,'محاكيات السباق');
  // billiards ×2
  [[7.35,9.0],[12.3,8.4]].forEach(([x,z])=>{const g=grp(P,x,z,0);box(g,2.3,.15,1.3,M.woodDark,0,.65,0);box(g,2.1,.03,1.1,M.felt,0,.8,0);[[-1,-.5],[1,-.5],[-1,.5],[1,.5]].forEach(([a,b])=>box(g,.14,.65,.14,M.woodDark,a,0,b));const l=box(g,1.8,.06,.3,M.black,0,2.35,0);box(g,1.7,.02,.2,M.ledWhite,0,2.33,0,0,{cast:false});
    const c=new THREE.Mesh(new THREE.CylinderGeometry(.012,.006,1.45,6),M.wood);c.rotation.z=Math.PI/2.15;c.position.set(.3,.86,.2);g.add(c);
    info(g,'طاولة بلياردو','طاولة 8 قدم بقماش أخضر وإطار خشب داكن، فوقها إنارة خطية معلّقة سوداء.');seg2(f,x-1.15,z,x+1.15,z,1.3);});
  label(f,9.8,9.0,'البلياردو');
  // cue rack / pegboard display
  const pg=grp(P,9.9,6.6,0);const pm=new THREE.Mesh(new THREE.PlaneGeometry(1.8,2.4),M.peg);pm.position.y=1.3;pg.add(pm);box(pg,1.9,2.6,.05,M.ledRed,0,.05,-.04,0,{cast:false});
  // hookah room
  wall(f,5.15,5.1,5.15,6.2,FH,.15,M.plaster);wall(f,5.15,6.2,7.8,6.2,FH,.15,M.brick);wall(f,7.8,5.1,7.8,5.6,FH,.15,M.plaster);sofa(f,6.4,5.65,Math.PI,2.2,M.leatherRed);label(f,6.4,5.7,'الأركيلة');
  // bar + reception counters
  const bar=grp(P,10.2,6.05,0);box(bar,2.8,1.05,.55,M.black,0,0,0);const bm=new THREE.Mesh(new THREE.PlaneGeometry(2.7,1.0),M.mesh);bm.position.set(0,.52,.29);bar.add(bm);box(bar,2.8,.03,.03,M.ledRed,0,.02,.3,0,{cast:false});box(bar,2.9,.05,.65,M.wood,0,1.05,0);info(bar,'بار الطابق الثاني','2803 ملم حديد وشبك ماسي بإنارة حمراء، فوقه إطار شاشات معلّق.');for(let i=0;i<4;i++)stool(P,9.2+i*.68,6.7);seg2(f,8.8,6.05,11.6,6.05,.6);
  const rc=grp(P,14.1,6.05,0);box(rc,2.8,1.05,.6,M.black,0,0,0);box(rc,2.7,.9,.02,M.ledWarm,0,.06,.31,0,{cast:false});const rm=new THREE.Mesh(new THREE.PlaneGeometry(2.7,1.0),M.mesh);rm.position.set(0,.52,.32);rc.add(rm);box(rc,2.9,.05,.7,M.wood,0,1.05,0);info(rc,'كاونتر استقبال الألعاب','شبك معدني خلفه إنارة دافئة، سطح خشب، لحجز غرف البلايستيشن والطاولات.');seg2(f,12.7,6.05,15.5,6.05,.6);
  const hf=grp(P,10.2,5.6,0,2.4);box(hf,2.8,.06,.7,M.black,0,0,0);[-.9,.9].forEach(o=>{const t=tv(f,0,0,0,0,1.0,'foot');hf.add(t);t.position.set(o,.08,.35);});
  label(f,10.2,6.6,'البار',1.6);label(f,14.1,6.6,'الاستقبال',1.6);
  // PlayStation rooms 2×2
  [[8.85,11.6,1],[12.75,15.45,0]].forEach(([x1,x2,side])=>{[[2.75,5.25],[.15,2.7]].forEach(([z1,z2])=>{
    const dx=side?x2:x1,ox=side?x1:x2;
    wall(f,ox,z1,ox,z2,FH,.12,M.brick);wall(f,x1,z1,x2,z1,FH,.12,M.plaster);wall(f,x1,z2,x2,z2,FH,.12,M.brick);
    wall(f,dx,z1,dx,z1+.25,FH,.12,M.plaster);wall(f,dx,z1+1.2,dx,z2,FH,.12,M.plaster);wall(f,dx,z1+.25,dx,z1+1.2,1.6,.12,M.black,2.4,false);
    const cx=(x1+x2)/2;sofa(f,cx,z1+.6,0,2.0,M.leatherRed);box(P,.9,.35,.5,M.blackMatte,cx,0,z1+1.35);tv(f,cx,1.0,z2-.1,Math.PI,1.4,'game');stripY(P,x1+.1,z2-.08,x2-.1,z2-.08,2.8,M.ledRed,.04);
    const r=box(P,.01,.01,.01,M.black,cx,0,(z1+z2)/2);info(r,'غرفة بلايستيشن','غرفة خاصة 2.5×2.4 م: ورق طابوق، كنبة جلد حمراء، شاشة 65 بوصة، جهاز PS5، إنارة LED حمراء مخفية، الباب على الممر الوسطي.');
  });});
  ['PS 1','PS 2','PS 3','PS 4'].forEach((t,i)=>label(f,[10.2,10.2,14.1,14.1][i],[4.3,1.6,4.3,1.6][i],'غرفة '+t));
  // cafe seating right
  [[17.0,5.4],[19.6,5.4],[17.0,3.45],[19.6,3.4],[17.0,1.75],[19.6,1.75],[16.0,8.3],[19.0,7.4]].forEach(([x,z])=>table4(f,x,Math.min(z,frontZ(x)-1.0)));
  [[18.3,4.4],[18.3,2.6]].forEach(([x,z])=>pendant(f,x,z,2.6,1.0));
  tv(f,17.95,1.2,.12,0,1.6);label(f,18.3,4.4,'جلسات المقهى');
  // fins
  [[5.15,1.9],[10.3,2.5],[15.3,1.9]].forEach(([x,L])=>{const z0=frontZ(x)-.6;const g=grp(P,x,z0-L/2,0);box(g,.3,3.2,L,M.brick,0,0,0);box(g,.32,.03,L,M.ledRed,0,3.0,0);info(g,'عمود/حاجز مكسو بالطابوق','ورق طابوق بإطار LED أحمر، يحمل شاشة أو رف عرض خوذ.');seg2(f,x,z0,x,z0-L,.35);});
})();

/* ---------- roof & signage & context ---------- */
roof=new THREE.Group();root.add(roof);
{const fp=footprint(2);const sg=new THREE.ExtrudeGeometry(shapeOf(fp,false),{depth:.3,bevelEnabled:false});sg.rotateX(Math.PI/2);const rs=new THREE.Mesh(sg,M.ext);rs.position.y=NF*FH+.3;roof.add(rs);
 const par=new THREE.Group();roof.add(par);fp.forEach((a,i)=>{const b=fp[(i+1)%fp.length];const dx=b[0]-a[0],dz=b[1]-a[1];const m=box(par,Math.hypot(dx,dz),1.0,.2,M.ext,(a[0]+b[0])/2,NF*FH+.3,(a[1]+b[1])/2,-Math.atan2(dz,dx));});
 const s=cnv(1024,256,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);g.font='900 190px "Readex Pro",sans-serif';g.textAlign='center';g.fillStyle='#ff2d36';g.shadowColor='#ff0000';g.shadowBlur=30;g.fillText('PEX',w*.32,190);g.font='600 64px "Readex Pro",sans-serif';g.fillStyle='#fff';g.shadowBlur=0;g.fillText('SPORTS CAFE',w*.72,160);});
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(8,2),new THREE.MeshBasicMaterial({map:tex(s,1,1),toneMapped:false}));const a=Math.atan2(DL-DR,W);sign.position.set(7,FH+.4,frontZ(7)+.35);sign.rotation.y=a;sign.scale.set(-1,.38,1);roof.add(sign);info(sign,'لافتة الواجهة','حروف بارزة مضيئة PEX حمراء على شريط ACP أسود بين الطابق الأرضي والأول.');}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),M.ground);ground.rotation.x=-Math.PI/2;ground.position.y=-.31;ground.receiveShadow=true;root.add(ground);
const walk=box(root,W+8,.15,4,std({color:0x77716b,roughness:1}),W/2,-.31,DL+2.6);walk.rotation.y=Math.atan2(DL-DR,W)*.0;
const road=box(root,80,.02,9,std({color:0x2a2a2c,roughness:1}),W/2,-.31,DL+9.5);
for(let i=0;i<14;i++)box(root,2,.03,.15,std({color:0xdddddd}),-30+i*6+W/2,-.3,DL+9.5);
box(root,12,17,14,M.side,-6.3,-.31,5.5);/* corner plot: side street along the right wall (viewer's left from the main street) */box(root,3,.15,DL+4,std({color:0x77716b,roughness:1}),W+1.75,-.31,(DL+4)/2-2);box(root,9,.02,70,std({color:0x2a2a2c,roughness:1}),W+7.75,-.31,DL+5-35);for(let i=0;i<10;i++)box(root,.15,.03,2,std({color:0xdddddd}),W+7.75,-.3,DL+3-i*6);box(root,.08,FH,DR,M.ext,W+.27,0,DR/2);[1,2].forEach(f=>box(root,.08,FH,1.2,M.ext,W+.27,f*FH,.6));box(root,W+12,20,10,M.side,W/2-6,-.31,-5.4);

/* ---------- lights ---------- */
const hemi=new THREE.HemisphereLight(0xdfe8f2,0x3a3430,.65);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1dd,1.6);sun.position.set(30,40,45);sun.target.position.set(W/2,0,5);scene.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:120});sun.shadow.bias=-.0005;
const amb=new THREE.AmbientLight(0xffffff,.25);scene.add(amb);
const pts=[];[[0,4,8],[0,11,7],[0,17,3],[0,18.6,6.8],[1,4,8],[1,12,5],[1,16,3],[2,4,7],[2,10,8],[2,17,4]].forEach(([f,x,z])=>{const l=new THREE.PointLight(0xffb27a,0,9,1.6);l.position.set(x,f*FH+2.6,z);root.add(l);pts.push(l);});
const sky={day:new THREE.Color(0xb9c9d6),night:new THREE.Color(0x0b0d14)};
scene.background=sky.day.clone();scene.fog=new THREE.Fog(scene.background,80,220);

let night=false;
function applyLight(){scene.background.copy(night?sky.night:sky.day);scene.fog.color.copy(scene.background);hemi.intensity=night?.12:.65;sun.intensity=night?0:1.6;amb.intensity=night?.12:.25;pts.forEach(l=>l.intensity=night?1.4:0);glow.forEach(m=>m.emissiveIntensity=m.userData.base*(night?2.2:.9));renderer.toneMappingExposure=night?1.25:1.05;}
applyLight();

/* ---------- people simulation ---------- */
const people=new THREE.Group();root.add(people);
const tones=[0x2b2b33,0x5a3a2a,0x1f3550,0x6b6b6b,0x3a2a22,0x7a1c22,0x223322];
function person(seated){const g=new THREE.Group();const c=std({color:tones[Math.floor(Math.random()*tones.length)],roughness:.8});const skin=std({color:[0xc79a78,0xa47452,0x8a5a3c][Math.floor(Math.random()*3)],roughness:.7});
  if(seated){const b=new THREE.Mesh(new THREE.CylinderGeometry(.17,.19,.6,10),c);b.position.y=.8;g.add(b);const l=new THREE.Mesh(new THREE.BoxGeometry(.32,.14,.45),std({color:0x222228}));l.position.set(0,.52,.15);g.add(l);const h=new THREE.Mesh(new THREE.SphereGeometry(.11,12,10),skin);h.position.y=1.22;g.add(h);}
  else{const b=new THREE.Mesh(new THREE.CylinderGeometry(.17,.15,.7,10),c);b.position.y=1.15;g.add(b);const lg=std({color:0x222228});const l1=new THREE.Mesh(new THREE.BoxGeometry(.11,.8,.13),lg);l1.position.set(-.07,.4,0);const l2=l1.clone();l2.position.x=.07;g.add(l1,l2);g.userData.legs=[l1,l2];const h=new THREE.Mesh(new THREE.SphereGeometry(.11,12,10),skin);h.position.y=1.63;g.add(h);}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
const routes=[
  [0,[[1.9,10.6],[3.0,7.15],[5.8,7.15],[10.3,7.1],[15.5,6.7],[17.2,6.0],[15.5,5.0],[11.0,7.4],[6.0,7.2],[2.6,7.6]]],
  [0,[[17.3,8.4],[17.3,5.2],[15.6,4.6],[13.4,4.9],[13.1,7.6],[15.5,7.4]]],
  [0,[[8.8,4.0],[8.8,6.9],[12.4,7.4],[16.0,6.0],[12.4,5.0]]],
  [1,[[4.5,4.8],[4.5,7.6],[9.5,7.8],[15.0,7.1],[17.6,6.0],[17.6,1.0],[17.6,6.2],[9.4,7.0]]],
  [1,[[14.9,5.5],[9.0,7.5],[5.0,8.6],[2.6,6.8],[5.0,6.4]]],
  [2,[[4.5,4.8],[4.4,8.5],[9.7,7.4],[11.9,7.1],[12.2,3.0],[12.2,7.0],[16.2,6.9],[18.3,4.4],[18.3,1.2],[16.3,6.6]]],
  [2,[[2.6,9.6],[5.0,9.8],[9.9,7.6],[14.7,7.5],[9.9,7.2],[3.3,8.0]]],
];
const walkers=routes.map(([f,pts])=>{const p=person(false);people.add(p);return {f,pts,i:0,t:Math.random(),p,sp:.7+Math.random()*.4};});
const sitters=[];[0,1,2].forEach(f=>{const s=seats[f].filter(()=>Math.random()<.32);s.forEach(st=>{const p=person(true);p.position.set(st.x,f*FH,st.z);p.rotation.y=st.ry;people.add(p);sitters.push({f,p});});});
function stepPeople(dt,tm){walkers.forEach(w=>{const a=w.pts[w.i],b=w.pts[(w.i+1)%w.pts.length];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);w.t+=dt*w.sp/L;if(w.t>=1){w.t=0;w.i=(w.i+1)%w.pts.length;return;}const x=a[0]+(b[0]-a[0])*w.t,z=a[1]+(b[1]-a[1])*w.t;w.p.position.set(x,w.f*FH,z);w.p.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);const s=Math.sin(tm/160*w.sp)*.35;w.p.userData.legs[0].rotation.x=s;w.p.userData.legs[1].rotation.x=-s;});}

/* ---------- labels DOM (inside the unified viewer's #labels layer) ---------- */
const labelHost=document.getElementById('labels')||document.body;
const lblCss=document.createElement('style');
lblCss.textContent='.pexl{position:absolute;transform:translate(-50%,-50%);pointer-events:none;font:700 11.5px Almarai,Tahoma,sans-serif;color:#fff;background:rgba(20,16,17,.8);border:1px solid rgba(212,38,47,.7);padding:2px 8px;border-radius:5px;white-space:nowrap}';
document.head.appendChild(lblCss);
labels.forEach(l=>{l.el.className='pexl';labelHost.appendChild(l.el);});

/* ---------- state ---------- */
let floorSel='all',mode='orbit',showCeil=false,showLabels=true,showPeople=true,playScreens=true;
function visFloors(){const k=floorSel==='all'?NF-1:+floorSel;
  floors.forEach((g,i)=>{g.visible=i<=k;ceils[i].visible=(mode==='walk')||(floorSel==='all')||showCeil||i<k;});
  roof.visible=floorSel==='all';spand.forEach((a,i)=>a.forEach(m=>m.visible=floorSel==='all'||mode==='walk'||i<k));
  people.children.forEach(p=>{const f=Math.round(p.position.y/FH);p.visible=showPeople&&f<=k;});}
function setFloor(v,moveCam=true){floorSel=v;
  if(mode==='walk'){const f=v==='all'?0:+v;walkStart(f);}
  else if(moveCam){const y=v==='all'?5:(+v)*FH;tweenCam(v==='all'?new THREE.Vector3(-16,20,40):new THREE.Vector3(W/2+3,y+13,DL+10),new THREE.Vector3(W/2,y+(v==='all'?5:0.8),5.5));}
  visFloors();}

/* camera tween */
let tw=null;
function tweenCam(pos,tgt,ms=1100){tw={p0:camera.position.clone(),t0:controls.target.clone(),p1:pos,t1:tgt,s:performance.now(),ms};}
function topView(){stopTour();if(mode==='walk')exitWalk();if(floorSel==='all')setFloor('0',false);const y=(+floorSel)*FH;tweenCam(new THREE.Vector3(W/2,y+26,5.4),new THREE.Vector3(W/2,y,5.5));}
function frontView(){stopTour();if(mode==='walk')exitWalk();setFloor('all',false);tweenCam(new THREE.Vector3(W/2,7,DL+30),new THREE.Vector3(W/2,6,5));}
function overView(){stopTour();if(mode==='walk')exitWalk();setFloor('all');}

/* walk mode */
const fp={f:0,x:4.5,z:5.2,yaw:Math.PI*.75,pitch:0};const keys={},padK={};
function enterWalk(){mode='walk';controls.enabled=false;if(floorSel==='all')setFloor('0',false);walkStart(+floorSel);visFloors();}
function walkStart(f){fp.f=f;fp.pitch=-.05;if(f===0){fp.x=1.9;fp.z=frontZ(1.9)-1.0;fp.yaw=-.46;}else{fp.x=4.5;fp.z=8.2;fp.yaw=-1.67;}}
function exitWalk(){mode='orbit';controls.enabled=true;
  camera.position.set(W-fp.x+8,fp.f*FH+12,fp.z+12);controls.target.set(W-fp.x,fp.f*FH+1,fp.z);visFloors();}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key==='Escape'&&mode==='walk'){stopTour();exitWalk();}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
let drag=null,downAt=null;
renderer.domElement.addEventListener('pointerdown',e=>{downAt={x:e.clientX,y:e.clientY};if(mode==='walk'){drag={x:e.clientX,y:e.clientY};}});
addEventListener('pointermove',e=>{if(drag&&mode==='walk'){fp.yaw+=(e.clientX-drag.x)*.004;fp.pitch=Math.max(-1.2,Math.min(1.2,fp.pitch-(e.clientY-drag.y)*.004));drag={x:e.clientX,y:e.clientY};}});
addEventListener('pointerup',e=>{drag=null;if(downAt&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)<5&&e.target===renderer.domElement)pick(e);downAt=null;});
function collide(f,x,z,r=.28){for(const s of colliders[f]){const dx=s.x2-s.x1,dz=s.z2-s.z1,L2=dx*dx+dz*dz||1e-6;let t=((x-s.x1)*dx+(z-s.z1)*dz)/L2;t=Math.max(0,Math.min(1,t));const px=s.x1+dx*t,pz=s.z1+dz*t;const d=Math.hypot(x-px,z-pz);const lim=r+s.t/2;if(d<lim){const k=(lim-d)/(d||1e-6);x+=(x-px)*k;z+=(z-pz)*k;}}return [x,z];}
function inside(f,x,z){const fz=frontZ(x)-.35;return [Math.max(.35,Math.min(W-.35,x)),Math.max(.35,Math.min(fz,z))];}
function stepWalk(dt){let mv=0,st=0,turn=0;if(keys['w']||keys['arrowup']||padK.f)mv+=1;if(keys['s']||keys['arrowdown']||padK.b)mv-=1;if(keys['a'])st+=1;if(keys['d'])st-=1;if(keys['arrowleft']||padK.l)turn+=1;if(keys['arrowright']||padK.r)turn-=1;
  fp.yaw-=turn*dt*1.6;const sp=2.2*dt;const fx=-Math.sin(fp.yaw),fz=-Math.cos(fp.yaw);let x=fp.x+(fx*mv-fz*st)*sp,z=fp.z+(fz*mv+fx*st)*sp;[x,z]=collide(fp.f,x,z);[x,z]=inside(fp.f,x,z);fp.x=x;fp.z=z;
  camera.position.set(W-fp.x,fp.f*FH+1.6,fp.z);const look=new THREE.Vector3(W-(fp.x-Math.sin(fp.yaw)*Math.cos(fp.pitch)),fp.f*FH+1.6+Math.sin(fp.pitch),fp.z-Math.cos(fp.yaw)*Math.cos(fp.pitch));camera.lookAt(look);}

/* guided tour (eye-level simulation through all floors) */
const tour=[
  {f:0,x:1.9,z:10.7,yaw:-.46,t:'المدخل: الاستقبال وصالة الانتظار وجدار PEX'},
  {f:0,x:4.3,z:7.6,yaw:-1.03,t:'شاشة الهولوغرام وجلسات الطعام'},
  {f:0,x:12.0,z:7.6,yaw:-1.67,t:'البار وإطار الشاشات المعلّق'},
  {f:0,x:15.0,z:6.4,yaw:-.29,t:'الجلسات الثابتة تحت الفتحة البيضوية'},
  {f:1,x:4.6,z:8.0,yaw:-1.67,t:'الطابق الأول: جلسات المقهى المطلة على الشارع'},
  {f:1,x:11.6,z:8.1,yaw:0,t:'بار الطابق الأول وغرفة الأركيلة'},
  {f:1,x:17.6,z:6.8,yaw:.1,t:'صالة الجلوس وجلسات النوافذ'},
  {f:2,x:4.4,z:8.5,yaw:1.28,t:'الطابق الثاني: محاكيات السباق'},
  {f:2,x:9.8,z:7.5,yaw:-1.91,t:'البلياردو والبار والاستقبال'},
  {f:2,x:12.2,z:6.9,yaw:0,t:'ممر غرف البلايستيشن'},
  {f:2,x:16.4,z:7.0,yaw:-.46,t:'جلسات المقهى في الطابق الثاني'},
];
let tourOn=false,tourI=0,tourT=0,tourFrom=null;
const hud=h=>{if(window.BAQV)BAQV.hud(h);};
const escH=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;');
function startTour(){if(mode!=='walk')enterWalk();tourOn=true;tourI=0;tourT=0;tourFrom={...fp};}
function stopTour(){if(!tourOn)return;tourOn=false;hud(null);}
function stepTour(dt){const s=tour[tourI];if(tourT===0){if(s.f!==fp.f){fp.f=s.f;fp.x=s.x;fp.z=s.z;fp.yaw=s.yaw;floorSel=String(s.f);visFloors();}tourFrom={...fp};hud('الجولة '+(tourI+1)+' من '+tour.length+': <b>'+escH(s.t)+'</b>');}
  tourT+=dt/4.5;const k=Math.min(1,tourT),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;let dy=s.yaw-tourFrom.yaw;while(dy>Math.PI)dy-=2*Math.PI;while(dy<-Math.PI)dy+=2*Math.PI;
  fp.x=tourFrom.x+(s.x-tourFrom.x)*e;fp.z=tourFrom.z+(s.z-tourFrom.z)*e;fp.yaw=tourFrom.yaw+dy*e;fp.pitch=-.04;
  if(tourT>=1.35){tourT=0;tourI++;if(tourI>=tour.length){stopTour();}}}
function goStop(i){stopTour();const s=tour[i];if(mode!=='walk')enterWalk();fp.f=s.f;fp.x=s.x;fp.z=s.z;fp.yaw=s.yaw;fp.pitch=-.04;floorSel=String(s.f);visFloors();}

/* picking → viewer HUD */
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
function pick(e){const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);
  const objs=[];scene.traverseVisible(o=>{if(o.isMesh&&o!==ground)objs.push(o);});const hits=ray.intersectObjects(objs,false);
  for(const h of hits){let o=h.object;if(o.material===M.glass||o.material===M.mesh&&!o.parent.userData.info)continue;while(o&&!o.userData.info)o=o.parent;if(o){const f=Math.max(0,Math.min(2,Math.floor((h.point.y+.05)/FH)));hud(['الطابق الأرضي','الطابق الأول','الطابق الثاني'][f]+' · <b>'+escH(o.userData.info.title)+'</b><br>'+escH(o.userData.info.spec));return;}}
  hud(null);}

/* layer groups for the unified viewer */
const furnObjs=[],acObjs=[],lightObjs=[];
scene.traverse(o=>{const i=o.userData.info;if(!i)return;const t=i.title;
  if(/طاولة|كرسي|كنبة|بلياردو|محاكاة|Bean/.test(t))furnObjs.push(o);
  if(/مجاري تكييف/.test(t))acObjs.push(o);
  if(/معلّقة إنارة/.test(t))lightObjs.push(o);});
ceils.forEach(c=>c.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.type==='CylinderGeometry')acObjs.push(o);}));
let furnOn=true,acOn=true,lightOn=true;

/* ---------- size to the viewer stage ---------- */
const host=document.getElementById('three')||document.body;
function fit(){const w=host.clientWidth||innerWidth,h=host.clientHeight||innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
fit();if(window.ResizeObserver)new ResizeObserver(fit).observe(host);else addEventListener('resize',fit);

/* ---------- loop ---------- */
const clock=new THREE.Clock();let scrAcc=0;const v3=new THREE.Vector3();
function frame(){const dt=Math.min(clock.getDelta(),.05),tm=performance.now();
  if(tw){const k=Math.min(1,(tm-tw.s)/tw.ms),e=1-Math.pow(1-k,3);camera.position.lerpVectors(tw.p0,tw.p1,e);controls.target.lerpVectors(tw.t0,tw.t1,e);if(k>=1)tw=null;}
  if(mode==='walk'){if(tourOn)stepTour(dt);stepWalk(dt);}else controls.update();
  if(showPeople)stepPeople(dt,tm);
  scrAcc+=dt;if(playScreens&&scrAcc>1/20){scrAcc=0;drawFoot(tm);drawRace(tm);drawHolo(tm);drawGame(tm);}
  renderer.render(scene,camera);
  const k=floorSel==='all'?-1:+floorSel,cw=renderer.domElement.clientWidth,ch=renderer.domElement.clientHeight;
  labels.forEach(l=>{const vis=showLabels&&(floorSel==='all'?false:l.f===k);if(!vis){l.el.hidden=true;return;}v3.copy(l.v).project(camera);if(v3.z>1||Math.abs(v3.x)>1.1||Math.abs(v3.y)>1.1){l.el.hidden=true;return;}
    if(mode==='walk'&&camera.position.distanceTo(l.v)>9){l.el.hidden=true;return;}l.el.hidden=false;l.el.style.left=((v3.x+1)/2*cw)+'px';l.el.style.top=((1-v3.y)/2*ch)+'px';});
  requestAnimationFrame(frame);}
drawFoot(0);drawRace(0);drawHolo(0);drawGame(0);
visFloors();frame();

/* ---------- register with the unified BAQ viewer ---------- */
const FL=['all','0','1','2'];
const moveNode=document.createElement('div');
moveNode.innerHTML='<label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer"><input type="checkbox" id="pex-people" checked> زبائن يتحركون في الممرات وآخرون جالسون</label><label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer"><input type="checkbox" id="pex-screens" checked> تشغيل الشاشات والهولوغرام والمحاكيات</label>';
moveNode.style.cssText='display:flex;flex-direction:column;gap:6px';
moveNode.querySelector('#pex-people').addEventListener('change',e=>{showPeople=e.target.checked;visFloors();});
moveNode.querySelector('#pex-screens').addEventListener('change',e=>{playScreens=e.target.checked;});
const SPACES=[
 {n:'الاستقبال وصالة الانتظار',a:'الأرضي'},{n:'جلسات الطعام',a:'الأرضي'},{n:'شاشة الهولوغرام',a:'الأرضي'},{n:'البار',a:'الأرضي'},{n:'الجلسات الثابتة',a:'الأرضي'},{n:'غرفة الأركيلة',a:'الأرضي'},{n:'المطبخ',a:'الأرضي'},{n:'دورات المياه',a:'كل الطوابق'},
 {n:'جلسات المقهى',a:'الأول'},{n:'البار',a:'الأول'},{n:'صالة الجلوس',a:'الأول'},{n:'جلسات النوافذ',a:'الأول'},{n:'غرفة الأركيلة',a:'الأول'},{n:'غرفة التحكم والهولوغرام',a:'الأول'},
 {n:'محاكيات السباق (3)',a:'الثاني'},{n:'البلياردو (2)',a:'الثاني'},{n:'غرف البلايستيشن (4)',a:'الثاني'},{n:'البار والاستقبال',a:'الثاني'},{n:'جلسات المقهى',a:'الثاني'},{n:'الأركيلة',a:'الثاني'}];
function boot(){if(!window.BAQV){setTimeout(boot,100);return;}
BAQV.register({
  layers:{
    arch:{get:()=>showCeil,set:v=>{showCeil=v;visFloors();}},
    furn:{get:()=>furnOn,set:v=>{furnOn=v;furnObjs.forEach(o=>o.visible=v);}},
    ac:{get:()=>acOn,set:v=>{acOn=v;acObjs.forEach(o=>o.visible=v);}},
    light:{get:()=>lightOn,set:v=>{lightOn=v;lightObjs.forEach(o=>o.visible=v);glow.forEach(m=>m.emissiveIntensity=v?m.userData.base*(night?2.2:.9):0);}}
  },
  options:[{id:'labels',label:'أسماء المناطق',get:()=>showLabels,set:v=>{showLabels=v;}}],
  views:{over:overView,top:topView,front:frontView},
  insides:tour.map((s,i)=>({label:s.t,go:()=>goStop(i)})),
  floors:{items:['المبنى','الأرضي','الأول','الثاني'],get:()=>mode==='walk'?fp.f+1:FL.indexOf(floorSel),set:i=>{stopTour();if(mode==='walk'&&i===0){exitWalk();setFloor('all');}else setFloor(FL[i]);}},
  sims:{
    night:{get:()=>night,set:v=>{night=v;applyLight();if(!lightOn)glow.forEach(m=>m.emissiveIntensity=0);}},
    move:{node:moveNode},
    walk:{tour:{start:startTour,stop:stopTour,on:()=>tourOn},walk:{toggle:()=>{stopTour();mode==='walk'?exitWalk():enterWalk();},on:()=>mode==='walk',key:(k,d)=>{padK[k]=d;}}}
  },
  info:{
    facts:[['عدد الطوابق','أرضي + 2'],['المساحة الطابقية','≈ 642 م²'],['ارتفاع الطابق','4.0 م'],['السقف الثانوي في الأرضي','3.0 م'],['التصميم','Rady Interior'],['الموقع','البصرة · بناية ركن']],
    spaceCols:[['n','الفضاء'],['a','الطابق']],spaces:SPACES,
    about:['الطابق الأرضي مبني بقياسات المخطط التنفيذي RAD-006-26، والطابقان الأول والثاني من مخططات التوزيع في العرض التصميمي.','اضغط على أي عنصر لعرض مادته ومواصفته.','البناية ركن: الشارع الجانبي على يسار الناظر من الشارع الرئيسي.','الأثاث والأجهزة بأشكال مبسطة لتوضيح التوزيع والألوان.','رفوف البار معبأة بمرطبانات قهوة وعبوات عصير، ولا تُنفَّذ العلامات التجارية المحمية الظاهرة في المناظير.']
  }
});
setTimeout(()=>BAQV.ready(),400);}
boot();
})();
