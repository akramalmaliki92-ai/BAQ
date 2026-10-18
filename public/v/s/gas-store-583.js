/* مخزن أسطوانات الغاز — مناقصة مصافي الجنوب 583/2026 — مشهد مخصص للعارض الموحّد (public/v/s/gas-store-583.js) */
(function(){
"use strict";
/* ================= البيانات (من لوحات A_01..A_12 ومخطط الأسس) ================= */
// س: على طول البناية، المحور 17 عند 0 والمحور 1 عند 80. ص: المحور E عند 0 (جهة أبواب الطوارئ) والمحور A عند 18 (جهة الأبواب المنزلقة والمنحدرات).
const GX = n => (17-n)*5;
const GY = {A:18,B:12,C:9,D:6,E:0};
const FFL=0.30, EAVE=6.00, RIDGE=7.30, LEN=80, WID=18, T=0.36;
const roofZ = y => EAVE + (RIDGE-EAVE)*(1-Math.abs(y-9)/9);

const ROOMS=[
 {id:"gen", name:"غازات عامة", area:695, x0:0, x1:40, col:"#9fc3d6"},
 {id:"ref", name:"غازات التبريد", area:169, x0:40, x1:50, col:"#9fd3c0"},
 {id:"oxy", name:"غاز الأوكسجين", area:169, x0:50, x1:60, col:"#c9b8e0"},
 {id:"chl", name:"غاز الكلورين", area:344, x0:60, x1:80, col:"#e3d58e"},
];
const PARTS=[40,50,60]; // جدران فاصلة خرسانية عند المحاور 9 و7 و5
// الأبواب المنزلقة D1 ‏3×3 (جهة A) — البحور 12-13 و8-9 و6-7 و2-3
const D1=[12,8,6,2].map(n=>({x0:GX(n)-4, x1:GX(n)-1, n}));
// أبواب الطوارئ D2 ‏1.20×2.10 (جهة E)
const D2=[[15,0.9],[12,1.1],[9,0.9],[7,0.65],[5,0.65]].map(([n,o])=>({x0:GX(n)+o, x1:GX(n)+o+1.2}));
// فتحات علوية W1 ‏4.75×2.50 (6 بكل جهة)، وسفلية W2 ‏4.75×2.20
const W1X=[5,15,25,35,45,55];
const W1N=W1X.map(x=>({x0:x+0.125,x1:x+4.875,z0:3.5,z1:6.0,t:"W1"}));
const W1S=W1X.map(x=>({x0:x+0.125,x1:x+4.875,z0:3.4,z1:5.9,t:"W1"}));
const W2N=[75,65].map(x=>({x0:x+0.125,x1:x+4.875,z0:FFL,z1:FFL+2.2,t:"W2"}));
const W2S=[65,70,75].map(x=>({x0:x+0.125,x1:x+4.875,z0:FFL,z1:FFL+2.2,t:"W2"}));
const TRENCH=[12.5,27.5,45,55,70]; // مجاري تصريف عرضية (المخطط المعماري A_03)
const CW1={x:80,y0:12.33,y1:17.67}; // واجهة زجاجية شرقية بين B وA
const CW2={x:0,y0:0.33,y1:5.67};    // واجهة زجاجية غربية بين E وD

/* ================= المشهد ================= */
const host=document.getElementById("three");
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);renderer.domElement.style.display="block";
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xdde6ea);
scene.fog=new THREE.Fog(0xdfe7ea,180,420);
const camera=new THREE.PerspectiveCamera(38,1,0.1,1000);
const controls=new THREE.OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.maxPolarAngle=Math.PI/2-0.02;
scene.add(new THREE.HemisphereLight(0xffffff,0x8a7d6a,0.7));
const P=(x,y,z=0)=>new THREE.Vector3(x,z,-y);
// الشمس: محور البناية يتجه 57° عن الشمال؛ شمس بعد الظهر من الجنوب الغربي
const sun=new THREE.DirectionalLight(0xfff3e0,0.85);
sun.position.copy(P(40-55,9-42,75)); sun.castShadow=true; sun.shadow.mapSize.set(4096,2048);
Object.assign(sun.shadow.camera,{left:-75,right:75,top:45,bottom:-45,near:1,far:300});
sun.shadow.bias=-0.0005;
sun.target.position.copy(P(40,9,0)); scene.add(sun,sun.target);

const L={}; ["roof","walls","steel","fdn","drain","water","base","glass","zone","plain"].forEach(k=>{L[k]=new THREE.Group();scene.add(L[k]);});
const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0},o));
const mat={
 wall:M(0xf3f1ea), wallDS:M(0xf3f1ea,{side:THREE.DoubleSide}), wallIn:M(0xe9e6dc), rc:M(0xc9c9c4), steel:M(0x5d6b73,{metalness:.5,roughness:.5}),
 purlin:M(0x7d8a90,{metalness:.4,roughness:.55}), frame:M(0x8a5a2b,{roughness:.6}), alu:M(0x9aa3a8,{metalness:.6,roughness:.4}),
 glass:new THREE.MeshStandardMaterial({color:0x9ec3cf,transparent:true,opacity:.42,roughness:.1,metalness:.2,side:THREE.DoubleSide}),
 pave:M(0xd9ccb0), ground:M(0xa58a66), slab:M(0xb9bfbd), ramp:M(0xa9aeb0,{side:THREE.DoubleSide}), conc:M(0xbdb7ab), fdn:M(0xa9a397),
 grate:M(0x6f7a80,{metalness:.6,roughness:.4}), trench:M(0x3a4246), pipe:M(0xd0d4d6), tank:M(0x2d6fa3), door:M(0xc8cdd0,{metalness:.5,roughness:.45}),
 dfire:M(0xb8423a), canopy:M(0xdadfe1,{metalness:.5,roughness:.4}), gutter:M(0xcfd5d8,{metalness:.5,roughness:.4})
};
function box(g,x0,x1,y0,y1,z0,z1,m,shadow=true){
  const geo=new THREE.BoxGeometry(Math.abs(x1-x0),Math.abs(z1-z0),Math.abs(y1-y0));
  const me=new THREE.Mesh(geo,m); me.position.copy(P((x0+x1)/2,(y0+y1)/2,(z0+z1)/2));
  me.castShadow=shadow; me.receiveShadow=true; g.add(me); return me;
}
function beam(g,a,b,w,h,m){
  const pa=P(...a),pb=P(...b),len=pa.distanceTo(pb);
  const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,len),m);
  me.position.copy(pa.clone().add(pb).multiplyScalar(.5)); me.lookAt(pb);
  me.castShadow=true; me.receiveShadow=true; g.add(me); return me;
}
function quad(g,pts,m,uv){
  const geo=new THREE.BufferGeometry();
  const v=[];[0,1,2,0,2,3].forEach(i=>{const p=P(...pts[i]);v.push(p.x,p.y,p.z);});
  geo.setAttribute("position",new THREE.Float32BufferAttribute(v,3));
  if(uv){const u=[];[0,1,2,0,2,3].forEach(i=>u.push(...uv[i]));geo.setAttribute("uv",new THREE.Float32BufferAttribute(u,2));}
  geo.computeVertexNormals(); const me=new THREE.Mesh(geo,m); me.castShadow=true; me.receiveShadow=true; g.add(me); return me;
}
function tex(draw,w=256,h=256,rx=1,ry=1){
  const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=8;return t;
}

/* ---------- الأرض والموقع ---------- */
const groundMat=M(0xa58a66,{transparent:true,opacity:1});
groundMat.map=tex((c,w,h)=>{c.fillStyle="#a88c68";c.fillRect(0,0,w,h);for(let i=0;i<2600;i++){c.fillStyle=`rgba(${70+Math.random()*60|0},${50+Math.random()*40|0},30,.25)`;c.fillRect(Math.random()*w,Math.random()*h,2,2);}},256,256,60,60);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),groundMat);
ground.rotation.x=-Math.PI/2; ground.position.copy(P(40,9,-0.001)); ground.receiveShadow=true; L.base.add(ground);
// حدود الأرض (من إحداثيات لوحة A_02: ≈101 × 39 م) — موضع البناية داخلها تقريبي
(function(){
  const sx0=40-50.5,sx1=40+50.5,sy0=9-19.5,sy1=9+19.5;
  const pts=[[sx0,sy0],[sx1,sy0],[sx1,sy1],[sx0,sy1],[sx0,sy0]].map(([x,y])=>P(x,y,0.03));
  const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color:0x5a3d1e,dashSize:2,gapSize:1.2}));
  ln.computeLineDistances(); L.base.add(ln);
})();
// الرصيف المحيط 2 م
const paveMat=M(0xd8cbb0); paveMat.map=tex((c,w,h)=>{c.fillStyle="#d8cbb0";c.fillRect(0,0,w,h);c.strokeStyle="rgba(120,100,70,.35)";c.lineWidth=3;for(let i=0;i<=4;i++){c.beginPath();c.moveTo(i*w/4,0);c.lineTo(i*w/4,h);c.stroke();c.beginPath();c.moveTo(0,i*h/4);c.lineTo(w,i*h/4);c.stroke();}},256,256,42,11);
box(L.base,-2.09,82.09,-2.2,20.2,0,0.12,paveMat,false);
// البلاطة الأرضية والمخازن الملوّنة
ROOMS.forEach(r=>{
  const zm=M(new THREE.Color(r.col).getHex(),{roughness:.5});
  box(L.zone,r.x0+0.18,r.x1-0.18,0.18,17.82,0.12,FFL+0.004,zm,false);
});
box(L.plain,0.18,79.82,0.18,17.82,0.12,FFL+0.004,M(0xaab3b1,{roughness:.45}),false);
box(L.base,-0.18,80.18,-0.18,18.18,0.12,FFL-0.01,mat.slab,false);
// مجاري التصريف بأغطية مشبكة
const grateTex=tex((c,w,h)=>{c.fillStyle="#6b767c";c.fillRect(0,0,w,h);c.fillStyle="#2c3337";for(let i=0;i<16;i++)c.fillRect(0,i*16+5,w,6);},64,256,1,30);
TRENCH.forEach(x=>{const m=mat.grate.clone();m.map=grateTex;box(L.base,x-0.15,x+0.15,0.5,17.5,FFL,FFL+0.012,m,false);});
// المنحدرات أمام الأبواب المنزلقة
D1.forEach(d=>{
  const xa=d.x0-0.6,xb=d.x1+0.6,y0=18.18,y1=22.8;
  quad(L.base,[[xa,y0,FFL],[xb,y0,FFL],[xb,y1,0.12],[xa,y1,0.12]],mat.ramp);
  box(L.base,xa,xb,y0,y1,0.12,0.2,mat.ramp,false);
  [xa,xb].forEach(x=>quad(L.base,[[x,y0,FFL],[x,y0,0.12],[x,y1,0.12],[x,y1,0.12]],mat.ramp));
});
// عتبات أبواب الطوارئ
D2.forEach(d=>box(L.base,d.x0-0.3,d.x1+0.3,-1.2,-0.18,0.12,FFL-0.02,mat.conc));

/* ---------- الجدران (طابوق 36 سم ملبّخ) ---------- */
function wallRun(g,axis,c,a0,a1,ops,zTop,m){
  // axis "x": جدار على طول س عند ص=c ؛ axis "y": جدار على طول ص عند س=c
  ops=ops.slice().sort((p,q)=>p.x0-q.x0); let s=a0;
  const seg=(u0,u1,z0,z1)=>{ if(u1-u0<0.01||z1-z0<0.01) return;
    if(axis==="x") box(g,u0,u1,c-T/2,c+T/2,z0,z1,m); else box(g,c-T/2,c+T/2,u0,u1,z0,z1,m); };
  ops.forEach(o=>{ seg(s,o.x0,FFL,zTop); if(o.z0>FFL) seg(o.x0,o.x1,FFL,o.z0); if(o.z1<zTop) seg(o.x0,o.x1,o.z1,zTop); s=o.x1; });
  seg(s,a1,FFL,zTop);
}
const northOps=[...D1.map(d=>({x0:d.x0,x1:d.x1,z0:FFL,z1:FFL+3})),...W1N,...W2N];
const southOps=[...D2.map(d=>({x0:d.x0,x1:d.x1,z0:FFL,z1:FFL+2.1})),...W1S,...W2S];
wallRun(L.walls,"x",18,-0.18,80.18,northOps,EAVE,mat.wall);
wallRun(L.walls,"x",0,-0.18,80.18,southOps,EAVE,mat.wall);
// الجدران الجملونية مع الواجهات الزجاجية
function gable(x,cw){
  wallRun(L.walls,"y",x,0.18,17.82,[{x0:cw.y0,x1:cw.y1,z0:FFL+0.13,z1:9}],EAVE,mat.wall);
  // المثلث فوق الكتف، دون الجزء الذي تشغله الواجهة الزجاجية
  const br=[0,9,18,cw.y0,cw.y1].sort((a,b)=>a-b);
  for(let i=0;i<br.length-1;i++){const a=br[i],b=br[i+1]; if(b-a<0.01|| (a>=cw.y0-0.01&&b<=cw.y1+0.01)) continue;
    quad(L.walls,[[x,a,EAVE],[x,b,EAVE],[x,b,roofZ(b)-0.05],[x,a,roofZ(a)-0.05]],mat.wallDS);
    box(L.walls,x-T/2,x+T/2,a,b,EAVE-0.01,EAVE,mat.wall,false);
    // سماكة الجدار بقطع رقيقة متدرجة
    const n=Math.max(1,Math.round((b-a)/0.5));for(let k=0;k<n;k++){const ya=a+(b-a)*k/n,yb=a+(b-a)*(k+1)/n;box(L.walls,x-T/2,x+T/2,ya,yb,EAVE,Math.min(roofZ(ya),roofZ(yb))-0.05,mat.wall);}
  }
}
gable(80,CW1); gable(0,CW2);
// الجدران الفاصلة (خرسانة مسلحة) حتى السقف
PARTS.forEach(x=>{
  box(L.walls,x-0.15,x+0.15,0.18,17.82,FFL,EAVE,mat.rc);
  for(let k=0;k<36;k++){const ya=0.18+k*17.64/36,yb=ya+17.64/36;box(L.walls,x-0.15,x+0.15,ya,yb,EAVE,Math.min(roofZ(ya),roofZ(yb))-0.22,mat.rc);}
});
// أطر الشبابيك والزجاج
function windowX(o,y,isN){
  const g=L.glass, d=0.06, yy=y;
  box(g,o.x0,o.x1,yy-0.04,yy+0.04,o.z0+0.05,o.z1-0.05,mat.glass,false);
  const fm=mat.frame;
  box(g,o.x0,o.x1,yy-0.08,yy+0.08,o.z0,o.z0+0.08,fm); box(g,o.x0,o.x1,yy-0.08,yy+0.08,o.z1-0.08,o.z1,fm);
  box(g,o.x0,o.x0+0.08,yy-0.08,yy+0.08,o.z0,o.z1,fm); box(g,o.x1-0.08,o.x1,yy-0.08,yy+0.08,o.z0,o.z1,fm);
  [1,2].forEach(i=>{const xm=o.x0+(o.x1-o.x0)*i/3;box(g,xm-0.03,xm+0.03,yy-0.06,yy+0.06,o.z0,o.z1,fm);});
}
W1N.concat(W2N).forEach(o=>windowX(o,18+T/2-0.05,true));
W1S.concat(W2S).forEach(o=>windowX(o,-T/2+0.05,false));
// الواجهتان الزجاجيتان (هيكل ألمنيوم، 5 ألواح بعرض 1.07)
function curtain(cw){
  const g=L.glass,x=cw.x+(cw.x>40?0.1:-0.1),z0=FFL+0.13;
  const zt=y=>roofZ(y)-0.12;
  quad(g,[[x,cw.y0,z0],[x,cw.y1,z0],[x,cw.y1,zt(cw.y1)],[x,cw.y0,zt(cw.y0)]],mat.glass);
  for(let i=0;i<=5;i++){const y=cw.y0+(cw.y1-cw.y0)*i/5;box(g,x-0.06,x+0.06,y-0.035,y+0.035,z0,zt(y),mat.alu);}
  [z0,z0+2.4,z0+4.8].forEach(z=>beam(g,[x,cw.y0,z],[x,cw.y1,z],0.12,0.07,mat.alu));
  beam(g,[x,cw.y0,zt(cw.y0)],[x,cw.y1,zt(cw.y1)],0.12,0.08,mat.alu);
}
curtain(CW1); curtain(CW2);
// الأبواب
D1.forEach(d=>{
  box(L.glass,d.x0,d.x1,18+T/2+0.02,18+T/2+0.1,FFL,FFL+3,mat.door);
  for(let i=1;i<6;i++){const z=FFL+i*0.5;box(L.glass,d.x0,d.x1,18+T/2+0.1,18+T/2+0.12,z-0.01,z+0.01,mat.steel,false);}
  // مظلة/مجرى الباب المنزلق (حسب الواجهة A)
  box(L.glass,d.x0-3.2,d.x1+0.2,18.18,19.3,3.35,3.5,mat.canopy);
});
D2.forEach(d=>{
  box(L.glass,d.x0,d.x1,-T/2-0.08,-T/2+0.02,FFL,FFL+2.1,mat.dfire);
  box(L.glass,d.x0+0.9,d.x0+1.05,-T/2-0.14,-T/2-0.08,FFL+0.95,FFL+1.05,mat.door,false);
});

/* ---------- السقف (ألواح Kirby) ---------- */
const sheetTex=tex((c,w,h)=>{const gr=c.createLinearGradient(0,0,w,0);
  for(let i=0;i<8;i++){gr.addColorStop(i/8,"#e9ecec");gr.addColorStop(i/8+0.05,"#c9cfd1");gr.addColorStop(i/8+0.1,"#eef0f0");}
  c.fillStyle=gr;c.fillRect(0,0,w,h);},256,16,1,1);
const roofMat=new THREE.MeshStandardMaterial({color:0xffffff,map:sheetTex,roughness:.45,metalness:.35,side:THREE.DoubleSide});
const OV=0.45, ys0=-OV, ys1=18+OV, zEdge=EAVE-(RIDGE-EAVE)*OV/9;
const ux=(LEN+2*OV)/2.2;
quad(L.roof,[[-OV,ys0,zEdge],[LEN+OV,ys0,zEdge],[LEN+OV,9,RIDGE],[-OV,9,RIDGE]],roofMat,[[0,0],[ux,0],[ux,1],[0,1]]);
quad(L.roof,[[-OV,9,RIDGE],[LEN+OV,9,RIDGE],[LEN+OV,ys1,zEdge],[-OV,ys1,zEdge]],roofMat,[[0,0],[ux,0],[ux,1],[0,1]]);
beam(L.roof,[-OV,9,RIDGE+0.06],[LEN+OV,9,RIDGE+0.06],0.5,0.12,mat.gutter); // غطاء الذروة
[ys0,ys1].forEach(y=>beam(L.roof,[-OV,y,zEdge-0.1],[LEN+OV,y,zEdge-0.1],0.18,0.18,mat.gutter)); // مزاريب
[-OV,LEN+OV].forEach(x=>{beam(L.roof,[x,ys0,zEdge+0.02],[x,9,RIDGE+0.02],0.06,0.22,mat.gutter);beam(L.roof,[x,9,RIDGE+0.02],[x,ys1,zEdge+0.02],0.06,0.22,mat.gutter);});

/* ---------- الهيكل الحديدي ---------- */
for(let n=1;n<=17;n++){
  const x=GX(n);
  [0,18].forEach(y=>beam(L.steel,[x,y,FFL],[x,y,EAVE],0.18,0.40,mat.steel)); // أعمدة IPE400
  beam(L.steel,[x,0,EAVE],[x,9,RIDGE-0.05],0.18,0.40,mat.steel);           // جملون IPE400
  beam(L.steel,[x,9,RIDGE-0.05],[x,18,EAVE],0.18,0.40,mat.steel);
}
[0,80].forEach(x=>["B","C","D"].forEach(k=>{const y=GY[k];beam(L.steel,[x,y,FFL],[x,y,roofZ(y)-0.2],0.18,0.3,mat.steel);}));
// المدادات UPE160
for(let i=0;i<7;i++){ const t=0.15+i*(8.6/6); [t,18-t].forEach(y=>beam(L.steel,[0,y,roofZ(y)+0.02],[80,y,roofZ(y)+0.02],0.07,0.16,mat.purlin)); }
// جسر IPE300 بمنسوب +2.80 على الجدارين الطويلين
[0,18].forEach(y=>beam(L.steel,[0,y,2.8],[80,y,2.8],0.15,0.30,mat.purlin));
// تقوية قطرية في البحرين الطرفيين للسقف
[[0,5],[75,80]].forEach(([a,b])=>[[0,9],[9,18]].forEach(([y0,y1])=>{beam(L.steel,[a,y0,roofZ(y0)-0.1],[b,y1,roofZ(y1)-0.1],0.03,0.03,mat.purlin);beam(L.steel,[b,y0,roofZ(y0)-0.1],[a,y1,roofZ(y1)-0.1],0.03,0.03,mat.purlin);}));

/* ---------- الأسس (قواعد منفصلة 2×2 م وجسور ربط) ---------- */
for(let n=1;n<=17;n++){ const x=GX(n);
  [0,18].forEach(y=>{box(L.fdn,x-1,x+1,y-1,y+1,-0.9,-0.4,mat.fdn);box(L.fdn,x-0.3,x+0.3,y-0.3,y+0.3,-0.4,0.12,mat.conc);});
}
[0,80].forEach(x=>["B","C","D"].forEach(k=>{const y=GY[k];box(L.fdn,x-1,x+1,y-1,y+1,-0.9,-0.4,mat.fdn);}));
box(L.fdn,0,80,-0.2,0.2,-0.4,0.12,mat.conc); box(L.fdn,0,80,17.8,18.2,-0.4,0.12,mat.conc);
[0,80].forEach(x=>box(L.fdn,x-0.2,x+0.2,0,18,-0.4,0.12,mat.conc));
PARTS.forEach(x=>box(L.fdn,x-0.3,x+0.3,0.2,17.8,-0.6,0.12,mat.conc));

/* ---------- الخدمات الخارجية (من مخطط الأسس – مواقع تقريبية) ---------- */
const MH=[20,45,55,70];
MH.forEach(x=>{box(L.drain,x-0.3,x+0.3,20.9,21.5,0,0.18,mat.conc);});
beam(L.drain,[72,21.2,0.08],[-4.5,21.2,0.08],0.16,0.16,mat.pipe);
MH.forEach(x=>beam(L.drain,[x,18.2,0.08],[x,20.9,0.08],0.12,0.12,mat.pipe));
// خزان التعفين 3.5×5×3 م
box(L.drain,-8,-3,20,23.5,-2.8,0.25,mat.conc);
[[-6.8,21],[-4.3,22.5]].forEach(([x,y])=>box(L.drain,x-0.35,x+0.35,y-0.35,y+0.35,0.25,0.3,mat.steel,false));
// خزان الماء ومضخة الدفع
const tk=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,1.9,28),mat.tank); tk.position.copy(P(-5,26.5,0.95+0.12)); tk.castShadow=true; L.water.add(tk);
box(L.water,-6.1,-3.9,25.4,27.6,0,0.12,mat.conc);
box(L.water,-3.3,-2.5,25.9,26.5,0.12,0.6,M(0x2f7d4f));
beam(L.water,[-2.9,26.2,0.4],[-2.9,18.4,0.4],0.06,0.06,mat.pipe);

/* ---------- التسميات ---------- */
const LBL=[];
function addLabel(html,pos,cls=""){const el=document.createElement("div");el.className="lb "+cls;el.innerHTML=html;document.getElementById("labels").appendChild(el);LBL.push({el,pos});}
ROOMS.forEach(r=>addLabel(`${r.name}<small>${r.area} م²</small>`,P((r.x0+r.x1)/2,9,FFL+1.4)));
addLabel("خزان التعفين",P(-5.5,21.7,1),"sm");
addLabel("خزان الماء والمضخة",P(-4.4,26.5,2.6),"sm");
D1.forEach((d,i)=>addLabel("D1",P((d.x0+d.x1)/2,21.5,0.9),"sm"));
addLabel("CW1",P(80.4,15,4),"sm"); addLabel("CW2",P(-0.4,3,4),"sm");

/* ================= المخطط ================= */
function drawPlan(){
  const s=12, ox=112, oy=14, X=x=>ox+x*s, Y=y=>oy+(28.5-y)*s;
  const ink="#2b241d", mut="#6b5f52", acc="#8a6a3f", line="#cdbfa9", pnl="#fbf6ee";
  let o=`<svg viewBox="0 0 1180 500" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans Arabic, sans-serif">`;
  const R=(x0,y0,x1,y1,f,stroke="none",sw=0,extra="")=>`<rect x="${X(Math.min(x0,x1))}" y="${Y(Math.max(y0,y1))}" width="${Math.abs(x1-x0)*s}" height="${Math.abs(y1-y0)*s}" fill="${f}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
  const Ln=(x0,y0,x1,y1,c,w=1,d="")=>`<line x1="${X(x0)}" y1="${Y(y0)}" x2="${X(x1)}" y2="${Y(y1)}" stroke="${c}" stroke-width="${w}" ${d?`stroke-dasharray="${d}"`:""}/>`;
  const Tx=(x,y,t,sz=12,c=ink,w=500,anc="middle")=>`<text x="${X(x)}" y="${Y(y)}" font-size="${sz}" fill="${c}" font-weight="${w}" text-anchor="${anc}" dominant-baseline="middle">${t}</text>`;
  o+=R(-2.09,-2.2,82.09,20.2,"#d8cbb0","#b8a888",1);
  D1.forEach(d=>o+=R(d.x0-0.6,18.18,d.x1+0.6,22.8,"#c3c7c8","#8d9395",1)+Tx((d.x0+d.x1)/2,21.3,"DN ↓",10,"#3a4246"));
  ROOMS.forEach(r=>o+=R(r.x0,0,r.x1,18,st.zone?r.col:"#e4e7e6"));
  for(let n=1;n<=17;n++){const x=GX(n);o+=Ln(x,-3.2,x,21.6,acc,.6,"6 3");o+=`<circle cx="${X(x)}" cy="${Y(-4.1)}" r="9" fill="${pnl}" stroke="${acc}"/>`+Tx(x,-4.1,n,10,acc,600);}
  Object.entries(GY).forEach(([k,y])=>{o+=Ln(-3.5,y,83.5,y,acc,.6,"6 3");o+=`<circle cx="${X(85)}" cy="${Y(y)}" r="9" fill="${pnl}" stroke="${acc}"/>`+Tx(85,y,k,10,acc,600);});
  TRENCH.forEach(x=>o+=R(x-0.15,0.5,x+0.15,17.5,"#5d676c"));
  // جدران
  const wallsX=(y,ops)=>{let s0=-0.18;ops.filter(p=>p.z0<1.2).sort((a,b)=>a.x0-b.x0).forEach(p=>{o+=R(s0,y-T/2,p.x0,y+T/2,ink);s0=p.x1;});o+=R(s0,y-T/2,80.18,y+T/2,ink);};
  wallsX(18,northOps); wallsX(0,southOps);
  [[0,CW2],[80,CW1]].forEach(([x,cw])=>{o+=R(x-T/2,0.18,x+T/2,cw.y0,ink)+R(x-T/2,cw.y1,x+T/2,17.82,ink)+R(x-0.05,cw.y0,x+0.05,cw.y1,"#6aa8bd");});
  PARTS.forEach(x=>o+=R(x-0.15,0.18,x+0.15,17.82,"#7d7d78"));
  [...W2N].forEach(w=>o+=R(w.x0,18-0.06,w.x1,18+0.06,"#6aa8bd"));
  [...W2S].forEach(w=>o+=R(w.x0,-0.06,w.x1,0.06,"#6aa8bd"));
  W1N.forEach(w=>o+=Ln(w.x0,18.35,w.x1,18.35,mut,1,"3 2"));
  W1S.forEach(w=>o+=Ln(w.x0,-0.35,w.x1,-0.35,mut,1,"3 2"));
  D1.forEach(d=>{o+=Ln(d.x0-3,18.32,d.x1,18.32,"#b8423a",2);o+=Tx((d.x0+d.x1)/2,19.0,"D1",9,"#b8423a",600);});
  D2.forEach(d=>{o+=`<path d="M${X(d.x0)} ${Y(0)} L${X(d.x0)} ${Y(-1.2)} A${1.2*s} ${1.2*s} 0 0 0 ${X(d.x1)} ${Y(0)}" fill="none" stroke="#b8423a" stroke-width="1.2"/>`+Tx(d.x0+0.6,-1.6,"D2",9,"#b8423a",600);});
  for(let n=1;n<=17;n++)[0,18].forEach(y=>o+=R(GX(n)-0.2,y-0.09,GX(n)+0.2,y+0.09,"#1d2a2f"));
  ROOMS.forEach(r=>o+=Tx((r.x0+r.x1)/2,10,r.name,15,"#17262b",600)+Tx((r.x0+r.x1)/2,8,r.area+" م²",13,"#17262b",500));
  W1N.forEach(w=>o+=Tx((w.x0+w.x1)/2,16.9,"W1",9,"#45565c"));W1S.forEach(w=>o+=Tx((w.x0+w.x1)/2,1.1,"W1",9,"#45565c"));
  W2N.forEach(w=>o+=Tx((w.x0+w.x1)/2,16.9,"W2",9,"#1f6680",600));W2S.forEach(w=>o+=Tx((w.x0+w.x1)/2,1.1,"W2",9,"#1f6680",600));
  o+=Tx(78.6,15,"CW1",9,"#1f6680",600)+Tx(1.4,3,"CW2",9,"#1f6680",600);
  if(st.drain||st.water){MH.forEach(x=>o+=R(x-0.3,20.9,x+0.3,21.5,"#8d877c","#4b463e",1));o+=Ln(72,21.2,-4.5,21.2,"#4f7a90",2,"8 4");o+=R(-8,20,-3,23.5,"#bdb7ab","#4b463e",1)+Tx(-5.5,24.4,"خزان تعفين",9,mut);
    o+=`<circle cx="${X(-5)}" cy="${Y(26.5)}" r="${0.9*s}" fill="#2d6fa3"/>`;}
  // أبعاد
  o+=Ln(-0.18,-6.2,80.18,-6.2,ink,1)+Tx(40,-6.8,"80.18",11,ink,500);
  o+=Ln(-3,-0.18,-3,18.18,ink,1)+`<text x="${X(-3.8)}" y="${Y(9)}" font-size="11" fill="${ink}" text-anchor="middle" transform="rotate(-90 ${X(-3.8)} ${Y(9)})">18.40</text>`;
  // سهم الشمال (محور البناية يتجه 57° عن الشمال)
  const nx=Math.cos(-57*Math.PI/180), ny=Math.cos(-327*Math.PI/180), cx=X(-5), cy=Y(-5)+10;
  o+=`<g transform="translate(${cx} ${cy-10})"><circle r="16" fill="${pnl}" stroke="${line}"/><line x1="0" y1="0" x2="${nx*13}" y2="${-ny*13}" stroke="${ink}" stroke-width="2"/><text x="${nx*24}" y="${-ny*24}" font-size="11" text-anchor="middle" dominant-baseline="middle" fill="${ink}" font-weight="600">N</text></g>`;
  o+=`<text x="${X(40)}" y="${Y(-9.2)}" font-size="11" fill="${mut}" text-anchor="middle">مخطط الطابق الأرضي · منسوب الأرضية +0.30 · المحاور كل 5 م</text></svg>`; document.getElementById("plan").innerHTML=o;
}


/* ================= العارض الموحّد ================= */
const st={roof:true,walls:true,steel:false,fdn:false,drain:true,water:true,zone:true,lbl:true,plan:false};
const planEl=document.getElementById("plan");
function apply(){
  L.roof.visible=st.roof; L.walls.visible=st.walls; L.glass.visible=st.walls; L.steel.visible=st.steel;
  L.fdn.visible=st.fdn; L.drain.visible=st.drain; L.water.visible=st.water; L.zone.visible=st.zone; L.plain.visible=!st.zone;
  groundMat.opacity=st.fdn?0.35:1; groundMat.transparent=st.fdn; groundMat.depthWrite=!st.fdn;
  paveMat.transparent=st.fdn; paveMat.opacity=st.fdn?0.4:1; mat.slab.transparent=st.fdn; mat.slab.opacity=st.fdn?0.5:1;
  const lb=document.getElementById("labels"); if(lb) lb.hidden=!st.lbl||st.plan;
  if(planEl){ planEl.hidden=!st.plan; if(st.plan) drawPlan(); }
}
const VIEWS={
  persp:{pos:[112,36,-58],tgt:[40,3,-10]},
  north:{pos:[40,9,-98],tgt:[40,3.5,-9]},
  top:{pos:[40,135,-8.99],tgt:[40,0,-9]}
};
function setView(v){ if(st.plan){st.plan=false;apply();} const c=VIEWS[v];camera.position.set(...c.pos);controls.target.set(...c.tgt);controls.update(); }
function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
if(window.ResizeObserver) new ResizeObserver(resize).observe(host); window.addEventListener("resize",resize);
const v3=new THREE.Vector3();
function loop(){requestAnimationFrame(loop);controls.update();renderer.render(scene,camera);
  if(st.lbl&&!st.plan){const r=host.getBoundingClientRect();LBL.forEach(l=>{v3.copy(l.pos).project(camera);
    const vis=v3.z<1&&Math.abs(v3.x)<1.1&&Math.abs(v3.y)<1.1;l.el.style.display=vis?"":"none";
    l.el.style.left=((v3.x+1)/2*r.width)+"px";l.el.style.top=((1-v3.y)/2*r.height)+"px";});}}
setView("persp"); apply(); resize(); loop();

const flag=k=>({get:()=>st[k],set:v=>{st[k]=v;apply();}});
function boot(){ if(!window.BAQV){setTimeout(boot,100);return;}
BAQV.register({
  layers:{
    arch:{get:()=>st.walls,set:v=>{st.walls=v;apply();}},
    struct:{get:()=>st.steel,set:v=>{st.steel=v;apply();}},
    drain:flag("drain"),
    water:flag("water")
  },
  legends:{
    arch:[["#f3f1ea","جدران طابوق 36 سم ملبّخة"],["#c9c9c4","جدران فاصلة خرسانية"],["#9ec3cf","واجهات زجاجية وشبابيك"]],
    struct:[["#5d6b73","أعمدة وجملونات IPE400"],["#7d8a90","مدادات UPE160 وجسر IPE300"]],
    drain:[["#6f7a80","مجاري الأرضية بأغطية مغلونة"],["#d0d4d6","أنبوب UPVC 6″"],["#bdb7ab","المناهل وخزان التعفين"]],
    water:[["#2d6fa3","خزان الماء"],["#2f7d4f","مضخة الدفع"]]
  },
  options:[
    {id:"roof",label:"السقف",get:()=>st.roof,set:v=>{st.roof=v;apply();}},
    {id:"zones",label:"ألوان المخازن",get:()=>st.zone,set:v=>{st.zone=v;apply();}},
    {id:"labels",label:"أسماء المخازن",get:()=>st.lbl,set:v=>{st.lbl=v;apply();}},
    {id:"fdn",label:"الأسس تحت الأرض",get:()=>st.fdn,set:v=>{st.fdn=v;apply();}},
    {id:"plan",label:"المخطط ثنائي الأبعاد",get:()=>st.plan,set:v=>{st.plan=v;apply();}}
  ],
  views:{over:()=>setView("persp"),top:()=>setView("top"),front:()=>setView("north")},
  info:{
    facts:[["صاحب العمل","شركة مصافي الجنوب"],["المناقصة","العامة المحلية 583/2026"],["الموقع","البصرة · الشعيبة"],["الأبعاد","80.18 × 18.40 م"],["المساحة المسقّفة","1475 م²"],["ارتفاع الكتف / الذروة","6.00 / 7.30 م"],["منسوب الأرضية","+0.30 م"],["النظام الإنشائي","إطارات حديدية بجملون بحر 18 م"]],
    spaceCols:[["n","المخزن"],["x","المحاور"],["a","م²"]],
    spaces:ROOMS.map(r=>({n:r.name,x:(17-r.x0/5)+"–"+(17-r.x1/5),a:r.area})).concat([{n:"المجموع الصافي",x:"",a:1377}]),
    counts:[["أبواب منزلقة 3.00×3.00 مع منحدرات","4"],["أبواب طوارئ ضد الحريق 1.20×2.10","5"],["فتحات علوية 4.75×2.50","12"],["فتحات سفلية 4.75×2.20","5"],["واجهات زجاجية بإطار ألمنيوم","2"],["أعمدة وجملونات IPE400","17 إطاراً"],["مجاري تصريف الأرضية","5"]],
    about:["النموذج مبني بأبعاد مخططات المناقصة A_01 إلى A_12 ومخطط الأسس.","السقف ألواح Kirby على مدادات UPE160، والجدران طابوق 36 سم ملبّخ، والجدران الفاصلة بين أنواع الغاز خرسانة مسلحة.","مواقع خزان التعفين وخزان الماء والمناهل توضيحية من مخطط الأسس.","التفاصيل التنفيذية تُعتمد في المخططات الهندسية المصادق عليها."]
  }
});
setTimeout(()=>BAQV.ready(),400);}
boot();
})();
