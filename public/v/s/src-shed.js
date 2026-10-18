/* توسعة سقيفة المعدات الدوارة — مصافي الجنوب — مشهد مخصص للعارض الموحّد لبيت القصيد (public/v/s/src-shed.js) */

(function(){
"use strict";
const V=THREE.Vector3;
const roomLabels=[];let labelsOn=true;
const viewer=document.getElementById('three')||document.body;
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
viewer.appendChild(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xe9e2d5); scene.fog=new THREE.Fog(0xe9e2d5,150,340);
const camera=new THREE.PerspectiveCamera(42,1,0.1,800);
const controls=new THREE.OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.maxPolarAngle=Math.PI*0.495;
scene.add(new THREE.HemisphereLight(0xfffaf0,0xb9ab92,0.75));
const sun=new THREE.DirectionalLight(0xffffff,0.85); sun.position.set(-40,60,-30); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); const sc=sun.shadow.camera; sc.left=-42;sc.right=42;sc.top=42;sc.bottom=-42;sc.near=1;sc.far=220;
sun.target.position.set(18.4,0,15.2); scene.add(sun); scene.add(sun.target);

/* ---------- Grid (S201/S202, A-sheets) ---------- */
const GX={D:0,C:12.30,B:24.50,A:36.80};
const GZ=[0,7.6,15.2,22.8,30.4];
const XS=[GX.D,GX.C,GX.B,GX.A];
/* Roof (S207 + elevations): symmetric gable, cladding +8.30 at eaves, +13.02 at ridge (x=18.4) */
const RIDGE=18.4, SL=(13.02-8.30)/18.4;
const yC=x=>13.02-SL*Math.abs(x-RIDGE);      // top of roof sheeting
const hR=x=>yC(x)-0.60;                        // underside of rafter I4 (560 deep)

/* ---------- Materials ---------- */
const mat=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6,metalness:.1},o||{}));
const M={
  col:mat(0x6f7f8a,{metalness:.45,roughness:.45}), beam:mat(0x8a979f,{metalness:.45,roughness:.45}),
  brace:mat(0x4f6f7f,{metalness:.4,roughness:.45}), truss:mat(0xa3adb3,{metalness:.4,roughness:.45}),
  rafter:mat(0x95a1a8,{metalness:.45,roughness:.45}), crane:mat(0xd9892c,{metalness:.35,roughness:.5}),
  conc:mat(0xb9b2a4,{roughness:.9}), foot:mat(0x9f9785,{roughness:.95}), plate:mat(0x3e4a52,{metalness:.5,roughness:.4}),
  slab:mat(0xcac3b3,{roughness:.9}), apron:mat(0xbdb5a5,{roughness:.95}), trench:mat(0x4a4a46,{roughness:.8}),
  brick:mat(0xa8644d,{roughness:.9}), part:mat(0xeee6d8,{roughness:.9}),
  glass:mat(0x8fb6c9,{transparent:true,opacity:.42,roughness:.1,metalness:.2,depthWrite:false,side:THREE.DoubleSide}),
  frame:mat(0xd9a441,{roughness:.6}), alu:mat(0x9aa3a8,{metalness:.5,roughness:.35}),
  door:mat(0xcfd3d1,{metalness:.4,roughness:.4}), wdoor:mat(0x8a6a4a,{roughness:.7}),
  roof:mat(0xdfe3e0,{side:THREE.DoubleSide,roughness:.6,metalness:.25}),
  sky:mat(0x9cc6dc,{side:THREE.DoubleSide,transparent:true,opacity:.5,depthWrite:false}),
  stair:mat(0xc2bbab,{roughness:.9}), steelSt:mat(0x5d6a72,{metalness:.5,roughness:.4}),
  ground:mat(0xd9ceb5,{roughness:1})
};

/* ---------- Layers ---------- */
const LAYERS=[
  ['grid','المحاور والتسميات',0x3b3026,'',true],
  ['found','الأسس والجسور الأرضية',0x9f9785,'S209 S210',true],
  ['floor','الأرضية والرصيف والقناة',0xcac3b3,'',true],
  ['cols','الأعمدة',0x6f7f8a,'C1 C2',true],
  ['brace','التكتيف',0x4f6f7f,'Br1',true],
  ['beams','الجسور الطولية والأفقية',0x8a979f,'I2 I5 I6',true],
  ['rafters','جسور السقف',0x95a1a8,'I4',true],
  ['truss','المدادات الشبكية',0xa3adb3,'Tr1',true],
  ['crane','مسارا الرافعتين والكوابيل',0xd9892c,'I3',true],
  ['annex','المبنى الإداري والأدراج',0xeee6d8,'A-sheets',true],
  ['walls','الجدران والشبابيك والأبواب',0xa8644d,'',true],
  ['roof','صفائح السقف (كيربي)',0xdfe3e0,'',true],
  ['sky','إنارة سماوية (في المنظور فقط)',0x9cc6dc,'',false]
];
const G={}; LAYERS.forEach(l=>{G[l[0]]=new THREE.Group();G[l[0]].visible=l[4];scene.add(G[l[0]]);});

/* ---------- Sections (S211), metres ---------- */
const SEC={
  C1:{type:'I',d:.60,b:.25,tf:.02,tw:.01,m:M.col,ar:'عمود رئيسي C1',sz:'I 600×250×20×10',bq:210},
  C2:{type:'I',d:.3051,b:.1016,tf:.007,tw:.0058,m:M.col,ar:'عمود واجهة C2',sz:'UB 305×102',bq:60},
  I2:{type:'I',d:.23,b:.09,tf:.02,tw:.01,m:M.beam,ar:'جسر I2',sz:'I 230×90',bq:130},
  I3:{type:'I',d:.64,b:.20,tf:.02,tw:.01,m:M.crane,ar:'مسار رافعة I3',sz:'I 640×200×20×10',bq:130},
  I4:{type:'I',d:.56,b:.20,tf:.02,tw:.008,m:M.rafter,ar:'جسر سقف I4',sz:'I 560×200×20×8',bq:210},
  I5:{type:'I',d:.20,b:.09,tf:.012,tw:.01,m:M.beam,ar:'جسر I5',sz:'I 200×90',bq:210},
  I6:{type:'I',d:.55,b:.20,tf:.02,tw:.01,m:M.beam,ar:'جسر الطرف I6',sz:'I 550×200×20×10',bq:65},
  Br1:{type:'B',d:.20,b:.15,kgm:43.2,m:M.brace,ar:'تكتيف Br1',sz:'RHS 200×150×8 (السماكة مفترضة)'}
};
for(const k in SEC){const s=SEC[k]; if(s.type==='I')s.kgm=(2*s.b*s.tf+(s.d-2*s.tf)*s.tw)*7850;}
const Q={},QC={},QO={};
const addQ=(t,L)=>{const q=Q[t]||(Q[t]={n:0,L:0});q.n++;q.L+=L;};
const addC=(n,v)=>{QC[n]=(QC[n]||0)+v;};

function iShape(d,b,tf,tw){
  const s=new THREE.Shape(),h=d/2,w=b/2,t=tw/2;
  s.moveTo(-w,-h);s.lineTo(w,-h);s.lineTo(w,-h+tf);s.lineTo(t,-h+tf);s.lineTo(t,h-tf);s.lineTo(w,h-tf);
  s.lineTo(w,h);s.lineTo(-w,h);s.lineTo(-w,h-tf);s.lineTo(-t,h-tf);s.lineTo(-t,-h+tf);s.lineTo(-w,-h+tf);s.closePath();return s;
}
const UPX=new V(1,0,0),UPZ=new V(0,0,1);
function member(grp,tag,p1,p2,up,noQ){
  const s=SEC[tag],L=p1.distanceTo(p2);let geo;
  if(s.type==='I')geo=new THREE.ExtrudeGeometry(iShape(s.d,s.b,s.tf,s.tw),{depth:L,bevelEnabled:false});
  else{geo=new THREE.BoxGeometry(s.b,s.d,L);geo.translate(0,0,L/2);}
  const m=new THREE.Mesh(geo,s.m);m.position.copy(p1);if(up)m.up.copy(up);m.lookAt(p2);
  m.castShadow=true;m.receiveShadow=true;
  m.userData={title:s.ar,lines:[['المقطع',s.sz],['الطول',L.toFixed(2)+' م'],['الوزن التقريبي',Math.round(s.kgm*L)+' كغم']]};
  grp.add(m);if(!noQ)addQ(tag,L);return m;
}
function box(grp,material,x0,x1,y0,y1,z0,z1,info,shadow){
  const m=new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1-x0),Math.abs(y1-y0),Math.abs(z1-z0)),material);
  m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
  if(shadow!==false){m.castShadow=true;m.receiveShadow=true;}
  if(info)m.userData=info;grp.add(m);return m;
}

/* ---------- Foundations (S201, S209, S210) ---------- */
XS.forEach(x=>GZ.forEach(z=>{
  box(G.found,M.foot,x-1.075,x+1.075,-0.35,0.45,z-1.075,z+1.075,{title:'قاعدة منفصلة للعمود C1',lines:[['الأبعاد','2.15 × 2.15 × 0.80 م'],['التسليح','Ø25@150 + Ø16@150 طبقتان'],['المنسوب','-0.35 إلى +0.45']]});
  addC('قواعد C1 (2.15×2.15×0.80)',2.15*2.15*0.8);
  box(G.found,M.conc,x-0.45,x+0.45,0.45,0.75,z-0.32,z+0.32,{title:'رقبة القاعدة',lines:[['الأبعاد','0.90 × 0.64 × 0.30 م']]});
  addC('رقاب القواعد',0.9*0.64*0.3);
  box(G.cols,M.plate,x-0.40,x+0.40,0.75,0.78,z-0.27,z+0.27,{title:'صفيحة قاعدة نوع A',lines:[['الأبعاد','800 × 540 × 30 مم'],['البراغي','8 × Ø30 بطول 1120 مم']]});
}));
const C2X=[4.10,8.20,15.15,21.20,28.40,32.60];
C2X.forEach(x=>{
  box(G.found,M.foot,x-0.6,x+0.6,-0.20,0.45,-0.6,0.6,{title:'قاعدة العمود C2',lines:[['الأبعاد','1.20 × 1.20 × 0.65 م']]});
  addC('قواعد C2 (1.20×1.20×0.65)',1.2*1.2*0.65);
  box(G.found,M.conc,x-0.25,x+0.25,0.45,0.75,-0.25,0.25,{title:'رقبة قاعدة C2',lines:[['الأبعاد','0.50 × 0.50 × 0.30 م']]});
  addC('رقاب القواعد',0.5*0.5*0.3);
});
const tbInfo={title:'جسر أرضي (Tie beam)',lines:[['المقطع','1.00 × 0.60 م'],['التسليح','D16@150 ، D12@100']]};
[GX.D,GX.A].forEach(x=>{for(let i=0;i<4;i++){const z0=GZ[i]+1.075,z1=GZ[i+1]-1.075;box(G.found,M.foot,x-0.5,x+0.5,-0.15,0.45,z0,z1,tbInfo);addC('جسور أرضية 1.00×0.60',(z1-z0)*0.6);}});
[0,30.4].forEach(z=>{for(let i=0;i<3;i++){const x0=XS[i]+1.075,x1=XS[i+1]-1.075;box(G.found,M.foot,x0,x1,-0.15,0.45,z-0.5,z+0.5,tbInfo);addC('جسور أرضية 1.00×0.60',(x1-x0)*0.6);}});

/* ---------- Floor ---------- */
box(G.floor,M.slab,-0.31,37.11,0.50,0.75,-0.31,30.4,{title:'أرضية خرسانية',lines:[['السماكة','250 مم مع نايلون تحتها'],['التسليح','BRC'],['المنسوب','+0.75']]});
addC('أرضية خرسانية 250 مم',37.42*30.71*0.25);
box(G.floor,M.trench,18.1,18.7,0.74,0.765,1.6,30.4,{title:'قناة تصريف المياه',lines:[['الغطاء','مشبك حديد مقاوم للمواد النفطية'],['المرجع','المسقط الأرضي A-sheets']]},false);
const ap={title:'رصيف محيطي',lines:[['العرض','1.00 م تقريباً']]};
box(G.floor,M.apron,-1.55,38.35,0.62,0.70,-1.55,-0.55,ap);
box(G.floor,M.apron,-1.55,-0.55,0.62,0.70,-0.55,31.4,ap);box(G.floor,M.apron,37.35,38.35,0.62,0.70,-0.55,30.4,ap);
box(G.floor,M.apron,-1.55,12.4,0.62,0.70,30.95,31.95,ap);
box(G.floor,M.apron,15.6,21.2,0.55,0.72,-3.2,-1.55,{title:'منحدر الباب الرئيسي',lines:[['الباب','D1 بقياس 5.0 × 5.5 م']]});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),M.ground);ground.rotation.x=-Math.PI/2;ground.position.set(18.4,0.17,15.2);ground.receiveShadow=true;scene.add(ground);

/* ---------- Columns ---------- */
XS.forEach(x=>GZ.forEach(z=>member(G.cols,'C1',new V(x,0.78,z),new V(x,hR(x),z),UPX)));
C2X.forEach(x=>member(G.cols,'C2',new V(x,0.77,0),new V(x,hR(x),0),UPZ));

/* ---------- Bracing Br1 (S203–S206) ---------- */
[[0,7.6],[22.8,30.4]].forEach(([za,zb])=>{
  const zm=(za+zb)/2,b=0.85;
  [GX.D,GX.A].forEach(x=>{member(G.brace,'Br1',new V(x,b,za),new V(x,7.60,zm));member(G.brace,'Br1',new V(x,b,zb),new V(x,7.60,zm));});
  const tc=hR(GX.C)-0.1;
  member(G.brace,'Br1',new V(GX.C,b,za),new V(GX.C,8.11,zm));member(G.brace,'Br1',new V(GX.C,b,zb),new V(GX.C,8.11,zm));
  member(G.brace,'Br1',new V(GX.C,tc,za),new V(GX.C,8.11,zm));member(G.brace,'Br1',new V(GX.C,tc,zb),new V(GX.C,8.11,zm));
  member(G.brace,'Br1',new V(GX.B,b,za),new V(GX.B,5.94,zm));member(G.brace,'Br1',new V(GX.B,b,zb),new V(GX.B,5.94,zm));
  member(G.brace,'Br1',new V(GX.B,5.94,za),new V(GX.B,tc,zb));member(G.brace,'Br1',new V(GX.B,5.94,zb),new V(GX.B,tc,za));
});

/* ---------- Longitudinal and gable beams ---------- */
const zb=(tag,x,top,z0,z1)=>{const y=top-SEC[tag].d/2;member(G.beams,tag,new V(x,y,z0),new V(x,y,z1));};
const xb=(tag,z,top,x0,x1)=>{const y=top-SEC[tag].d/2;member(G.beams,tag,new V(x0,y,z),new V(x1,y,z));};
zb('I6',GX.D,hR(GX.D)+0.55,0,30.4); zb('I6',GX.A,hR(GX.A)+0.55,0,30.4);   // eave beams
zb('I2',GX.D,3.95,0,30.4); zb('I2',GX.D,7.15,0,30.4);                       // S206 / S208
zb('I2',GX.A,3.95,0,30.4); zb('I2',GX.A,7.15,0,30.4);
xb('I5',0,4.15,0,15.9); xb('I5',0,4.15,20.9,36.8); xb('I5',0,7.15,0,36.8);  // S207 H-H girts on axis 1
xb('I5',0,10.35,12.3,24.5);
xb('I5',30.4,4.15,12.3,36.8); xb('I5',30.4,7.15,0,36.8);                  // axis 5 (open to old shed)
zb('I5',GX.B,6.20,0,30.4);

/* ---------- Rafters I4 ---------- */
GZ.forEach(z=>{
  member(G.rafters,'I4',new V(-0.4,hR(-0.4)+0.28,z),new V(RIDGE,hR(RIDGE)+0.28,z));
  member(G.rafters,'I4',new V(RIDGE,hR(RIDGE)+0.28,z),new V(37.2,hR(37.2)+0.28,z));
});

/* ---------- Tr1 lattice purlins between rafters (depth 0.55, 18 lines) ---------- */
const TRX=[];for(let k=0;k<9;k++){const x=0.9+k*2.1;TRX.push(x,36.8-x);}
let trussLen=0;
(function(){
  const chordGeo=new THREE.BoxGeometry(0.10,0.05,1),webGeo=new THREE.BoxGeometry(0.05,0.05,1);
  const chords=[],webs=[],n=32,p=30.4/n;
  TRX.forEach(x=>{
    const yt=hR(x)+0.535,yb=yt-0.50;
    chords.push([new V(x,yt,0),new V(x,yt,30.4)],[new V(x,yb,0),new V(x,yb,30.4)]);
    for(let i=0;i<=n;i++){const z=i*p;webs.push([new V(x,yb,z),new V(x,yt,z)]);
      if(i<n){const z2=(i+1)*p;webs.push(i%2?[new V(x,yt,z),new V(x,yb,z2)]:[new V(x,yb,z),new V(x,yt,z2)]);}}
    trussLen+=30.4;
  });
  const inst=(geo,list,m,info)=>{const im=new THREE.InstancedMesh(geo,m,list.length);const d=new THREE.Object3D();d.up.set(1,0,0);
    list.forEach((pq,i)=>{const L=pq[0].distanceTo(pq[1]);d.position.copy(pq[0]).lerp(pq[1],0.5);d.scale.set(1,1,L);d.lookAt(pq[1]);d.updateMatrix();im.setMatrixAt(i,d.matrix);});
    im.castShadow=true;im.receiveShadow=true;im.userData=info;G.truss.add(im);};
  const info={title:'مدادة شبكية Tr1',lines:[['العمق','0.55 م ، تقسيمات 0.95 م'],['الأوتار','2L 50×50×5 (تقريبي)'],['العدد','18 خطاً × 30.40 م']]};
  inst(chordGeo,chords,M.truss,info);inst(webGeo,webs,M.truss,info);
})();

/* ---------- Roof sheeting + skylights ---------- */
function quad(grp,material,x1,x2,z1,z2,info,lift){
  const L=lift||0,g=new THREE.BufferGeometry();
  const p=[x1,yC(x1)+L,z1, x2,yC(x2)+L,z1, x2,yC(x2)+L,z2, x1,yC(x1)+L,z1, x2,yC(x2)+L,z2, x1,yC(x1)+L,z2];
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,material);m.receiveShadow=true;m.castShadow=material!==M.sky;if(info)m.userData=info;grp.add(m);
}
const roofInfo={title:'صفائح كيربي مضلعة مجلفنة',lines:[['السماكة','0.7 ملم (جدول المناقصة)'],['الكمية في المناقصة','1200 م²']]};
quad(G.roof,M.roof,-0.8,RIDGE,-0.8,30.9,roofInfo);quad(G.roof,M.roof,RIDGE,37.6,-0.8,30.9,roofInfo);
const roofArea=2*Math.hypot(RIDGE+0.8,yC(RIDGE)-yC(-0.8))*31.7;
const skyInfo={title:'إنارة سماوية',lines:[['ملاحظة','تظهر في المنظور A101 فقط، وغير موجودة في جدول المناقصة']]};
for(let j=0;j<4;j++){const zm=(GZ[j]+GZ[j+1])/2;[[2,16.5],[20.3,34.8]].forEach(([a,b])=>quad(G.sky,M.sky,a,b,zm-1.2,zm+1.2,skyInfo,0.03));}

/* ---------- Crane runways (S212, S207) ---------- */
function runway(x,dir,top,brTop){
  const xr=x+dir*0.97,yc=top-0.32;
  member(G.crane,'I3',new V(xr,yc,0),new V(xr,yc,30.4));
  box(G.crane,M.plate,xr-0.03,xr+0.03,top,top+0.06,0,30.4,{title:'سكة الرافعة',lines:[['ملاحظة','مقاسها غير مذكور']]});
  GZ.forEach(z=>{const xa=x+dir*0.30,xbb=x+dir*1.07;
    box(G.crane,M.crane,Math.min(xa,xbb),Math.max(xa,xbb),brTop-0.55,brTop,z-0.125,z+0.125,{title:'كابولي الرافعة',lines:[['البروز','770 مم من وجه العمود'],['منسوب أعلاه','+'+brTop.toFixed(2)],['المرجع','S212 ، S207']]});});
}
runway(GX.C,1,8.49,7.81);runway(GX.B,-1,8.49,7.81);   // upper crane, bay C–B
runway(GX.B,1,5.94,5.26);runway(GX.A,-1,5.94,5.26);   // lower crane, bay B–A

/* ---------- Annex (administration block D–C) ---------- */
const AX0=0.31,AX1=12.15,AZ0=0.31,AZ1=30.1;
const slabInfo=lv=>({title:'سقف خرساني للمبنى الإداري',lines:[['المنسوب',lv],['السماكة','200 مم'],['التسليح','D12@150 باتجاهين علوي وسفلي']]});
const H={x0:0.31,x1:4.5,z0:11.6,z1:14.85};
box(G.annex,M.slab,AX0,AX1,3.75,3.95,AZ0,H.z0,slabInfo('+3.95'));box(G.annex,M.slab,AX0,AX1,3.75,3.95,H.z1,AZ1,slabInfo('+3.95'));
box(G.annex,M.slab,H.x1,AX1,3.75,3.95,H.z0,H.z1,slabInfo('+3.95'));
box(G.annex,M.slab,AX0,AX1,6.95,7.15,AZ0,AZ1,slabInfo('+7.15'));
const A1=(AX1-AX0)*(AZ1-AZ0);addC('سقفا المبنى الإداري 200 مم',(2*A1-(H.x1-H.x0)*(H.z1-H.z0))*0.2);

/* internal stair (A115, S213) */
const stInfo={title:'درج داخلي خرساني',lines:[['من','+0.75 إلى +3.95'],['البسطة','+2.43'],['الدرجة','300 × 168 مم'],['المرجع','S213 ، A115']]};
(function(){
  const r1=10,h1=(2.43-0.75)/r1,r2=9,h2=(3.95-2.43)/r2,t=0.30;
  for(let i=0;i<r1;i++){const y=0.75+(i+1)*h1,x=4.4-i*t;box(G.annex,M.stair,x-t,x,y-0.22,y,11.7,12.95,stInfo);}
  box(G.annex,M.stair,0.31,1.4,2.23,2.43,11.7,14.75,stInfo);
  for(let i=0;i<r2;i++){const y=2.43+(i+1)*h2,x=1.4+i*t;box(G.annex,M.stair,x,x+t,y-0.22,y,13.5,14.75,stInfo);}
  addC('الدرج الداخلي',(r1+r2)*1.25*0.3*0.22+1.1*3*0.2);
})();
/* external emergency stair on axis 1 (A117, north elevation) */
const exInfo={title:'درج الطوارئ الخارجي',lines:[['من','+0.75 إلى +3.95'],['الموقع','الواجهة الشمالية، فضاء D–C'],['المرجع','A117']]};
(function(){
  const n=19,h=(3.95-0.75)/n,t=0.30,z0=-1.75,z1=-0.65;
  for(let i=0;i<n;i++){const y=0.75+(i+1)*h,x=-0.2+i*t;box(G.annex,M.steelSt,x,x+t,y-0.05,y,z0,z1,exInfo);}
  box(G.annex,M.steelSt,5.5,7.5,3.85,3.95,z0,z1,exInfo);
  [[5.6,z0],[7.4,z0],[5.6,z1],[7.4,z1]].forEach(([x,z])=>box(G.annex,M.steelSt,x-0.06,x+0.06,0.75,3.85,z-0.06,z+0.06,exInfo));
  const lm=new THREE.LineBasicMaterial({color:0x3e4a52});
  const ln=pts=>{G.annex.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lm));};
  ln([new V(-0.2,1.75,z0),new V(5.5,4.95,z0),new V(7.5,4.95,z0),new V(7.5,4.95,z1)]);
})();

/* partitions + room labels (A-sheets ground and first floor plans) */
const partInfo={title:'قاطع طابوق',lines:[['السماكة','150 مم تقريباً'],['المرجع','المساقط المعمارية']]};
function corridorWall(x,y0,y1,doors){let z=AZ0;doors.slice().sort((a,b)=>a-b).forEach(d=>{if(d-0.5>z)box(G.annex,M.part,x-0.075,x+0.075,y0,y1,z,d-0.5,partInfo);
  box(G.annex,M.part,x-0.075,x+0.075,y0+2.2,y1,d-0.5,d+0.5,partInfo);z=d+0.5;});if(z<AZ1)box(G.annex,M.part,x-0.075,x+0.075,y0,y1,z,AZ1,partInfo);}
function crossWalls(xa,xb2,y0,y1,zs){zs.forEach(z=>box(G.annex,M.part,xa,xb2,y0,y1,z-0.075,z+0.075,partInfo));}
const WX=[AX0,4.9],EX=[7.2,AX1];
/* ground floor */
crossWalls(WX[0],WX[1],0.75,3.75,[3.6,7.6,11.0,15.2,18.8,22.6,26.4]);
crossWalls(EX[0],EX[1],0.75,3.75,[3.8,7.6,11.5,15.2,18.8,22.6]);
corridorWall(4.9,0.75,3.75,[3.0,7.0,10.4,15.8,22.0,25.8,29.6]);
(function(){let segs=[[AZ0,11.5],[15.2,AZ1]];const doors=[[0.9],[4.4],[8.2],[],[15.8],[19.4],[23.2]];
  box(G.annex,M.part,7.125,7.275,0.75,3.75,AZ0,11.5,partInfo);box(G.annex,M.part,7.125,7.275,0.75,3.75,15.2,AZ1,partInfo);})();
/* first floor */
crossWalls(WX[0],WX[1],3.95,6.95,[7.6,11.5,15.2,18.8,22.6,26.4]);
crossWalls(EX[0],EX[1],3.95,6.95,[7.6,11.5,15.2,18.8,22.6]);
corridorWall(4.9,3.95,6.95,[6.9,8.2,15.8,22.0,25.8,29.6]);
box(G.annex,M.part,7.125,7.275,3.95,6.95,AZ0,11.5,partInfo);box(G.annex,M.part,7.125,7.275,3.95,6.95,15.2,AZ1,partInfo);

/* ---------- Walls with openings ---------- */
const brickInfo={title:'جدار طابوق مع لبخ',lines:[['السماكة','240 مم (مفترضة)'],['المرجع','الواجهات والمقطع F-F']]};
const rect=(u0,u1,v0,v1,kind)=>({pts:[[u0,v0],[u1,v0],[u1,v1],[u0,v1]],u0,u1,v0,v1,kind:kind||'w'});
function wall(profile,holes,place,material){
  const s=new THREE.Shape();s.moveTo(...profile[0]);profile.slice(1).forEach(p=>s.lineTo(...p));s.closePath();
  holes.forEach(h=>{const p=new THREE.Path();p.moveTo(...h.pts[0]);h.pts.slice(1).forEach(q=>p.lineTo(...q));p.closePath();s.holes.push(p);});
  const g=new THREE.Group(),t=0.24;
  const w=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:t,bevelEnabled:false}),material||M.brick);w.castShadow=true;w.receiveShadow=true;w.userData=brickInfo;g.add(w);
  holes.forEach(h=>fill(g,h,t));place(g);G.walls.add(g);return g;
}
function bar(g,m,x0,x1,y0,y1,z){const b=new THREE.Mesh(new THREE.BoxGeometry(Math.max(x1-x0,0.01),Math.max(y1-y0,0.01),0.1),m);b.position.set((x0+x1)/2,(y0+y1)/2,z);g.add(b);}
function fill(g,h,t){
  const {u0,u1,v0,v1,kind}=h,cw=u1-u0,ch=v1-v0,cu=(u0+u1)/2,cv=(v0+v1)/2;
  const info=(ttl,extra)=>({title:ttl,lines:[['الفتحة',cw.toFixed(2)+' × '+ch.toFixed(2)+' م'],...(extra||[])]});
  if(kind==='D1'){const d=new THREE.Mesh(new THREE.BoxGeometry(cw,ch,0.06),M.door);d.position.set(cu,cv,0.06);d.userData=info('باب D1 كبنك حديد كهربائي ضد الحريق',[['القياس في المناقصة','5.0 × 5.5 م']]);g.add(d);
    for(let y=v0+0.3;y<v1;y+=0.3)bar(g,M.alu,u0,u1,y-0.01,y+0.01,0.02);return;}
  if(kind==='d'){const d=new THREE.Mesh(new THREE.BoxGeometry(cw,ch,0.05),M.wdoor);d.position.set(cu,cv,t/2);d.userData=info('باب',[['النوع','D2 / D4 حسب جدول الأبواب']]);g.add(d);return;}
  if(kind==='cw'){
    const sh=new THREE.Shape();sh.moveTo(...h.pts[0]);h.pts.slice(1).forEach(q=>sh.lineTo(...q));sh.closePath();
    const gl=new THREE.Mesh(new THREE.ShapeGeometry(sh),M.glass);gl.position.z=t/2;gl.userData={title:'حائط زجاجي ألمنيوم '+h.code,lines:[['الزجاج','مزدوج 6 ملم شفاف'],['الألمنيوم','مقطع 10 سم سمك 3 ملم']]};g.add(gl);
    const topAt=u=>{const a=h.pts[3],b=h.pts[2];return a[1]+(b[1]-a[1])*(u-a[0])/(b[0]-a[0]);};
    const nv=Math.max(2,Math.round(cw/1.3));for(let i=0;i<=nv;i++){const u=u0+cw*i/nv;bar(g,M.alu,u-0.04,u+0.04,v0,topAt(u),t/2);}
    const tmin=Math.min(h.pts[2][1],h.pts[3][1]);for(let v=v0;v<tmin-0.2;v+=2.0)bar(g,M.alu,u0,u1,v-0.04,v+0.04,t/2);
    const a=h.pts[3],b=h.pts[2],L=Math.hypot(b[0]-a[0],b[1]-a[1]),tb=new THREE.Mesh(new THREE.BoxGeometry(L,0.08,0.1),M.alu);
    tb.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,t/2);tb.rotation.z=Math.atan2(b[1]-a[1],b[0]-a[0]);g.add(tb);return;}
  const gl=new THREE.Mesh(new THREE.BoxGeometry(cw,ch,0.02),M.glass);gl.position.set(cu,cv,t/2);
  gl.userData=info(kind==='v'?'هوائية W4':'شباك ألمنيوم W1',[['الزجاج','مزدوج مقسى 6 ملم']]);g.add(gl);
  const f=0.05,z=t/2;bar(g,M.frame,u0,u1,v0,v0+f,z);bar(g,M.frame,u0,u1,v1-f,v1,z);bar(g,M.frame,u0,u0+f,v0,v1,z);bar(g,M.frame,u1-f,u1,v0,v1,z);
  if(kind!=='v'){bar(g,M.frame,cu-f/2,cu+f/2,v0,v1,z);bar(g,M.frame,u0,u1,cv-f/2,cv+f/2,z);}
}
const longPlace=x=>g=>{g.rotation.y=-Math.PI/2;g.position.x=x;};
const eaveTop=yC(-0.55)-0.06;
/* west wall, axis D (west elevation) */
(function(){const h=[];
  [[0.8,2.4],[4.3,5.9],[9.2,10.8],[16.8,18.4],[19.5,21.1],[24.8,26.4],[28.5,30.1]].forEach(([a,b])=>h.push(rect(a,b,1.75,3.25)));
  [[2.6,4.2],[5.4,7.0],[9.2,10.8],[16.8,18.4],[19.5,21.1],[24.8,26.4],[28.5,30.1]].forEach(([a,b])=>h.push(rect(a,b,4.95,6.45)));
  [[23.2,24.2],[26.9,27.9]].forEach(([a,b])=>{h.push(rect(a,b,2.65,3.25,'v'));h.push(rect(a,b,5.85,6.45,'v'));});
  h.push(rect(0.5,1.5,5.85,6.45,'v'));
  wall([[-0.55,0.45],[30.4,0.45],[30.4,eaveTop],[-0.55,eaveTop]],h,longPlace(-0.31));})();
/* east wall, axis A (east elevation) */
(function(){const h=[];
  h.push(Object.assign(rect(22.8,25.9,0.95,7.2,'cw'),{code:'CW2'}));h.push(Object.assign(rect(3.1,6.3,0.95,7.2,'cw'),{code:'CW2'}));
  [[19.6,22.3],[15.8,18.4],[11.97,14.6],[8.2,10.8]].forEach(([a,b])=>h.push(rect(a,b,4.86,5.86)));
  [[19.6,22.3],[15.8,18.4],[8.2,10.8]].forEach(([a,b])=>h.push(rect(a,b,1.66,3.16)));
  h.push(rect(29.1,30.1,0.75,2.95,'d'));h.push(rect(14.0,15.0,0.75,2.95,'d'));
  wall([[-0.55,0.45],[30.4,0.45],[30.4,eaveTop],[-0.55,eaveTop]],h,longPlace(37.35));})();
/* north gable, axis 1 */
(function(){
  const pts=[[-0.55,0.45],[37.35,0.45]];[37.35,RIDGE,-0.55].forEach(x=>pts.push([x,yC(x)-0.06]));
  const cw=[[28.6,0.95],[36.4,0.95],[36.4,yC(36.4)-0.45],[28.6,yC(28.6)-0.45]];
  wall(pts,[rect(15.9,20.9,0.75,6.25,'D1'),rect(6.1,7.1,0.75,2.95,'d'),rect(6.1,7.1,3.95,6.15,'d'),
    {pts:cw,u0:28.6,u1:36.4,v0:0.95,v1:yC(28.6)-0.45,kind:'cw',code:'CW1'}],g=>{g.position.z=-0.55;});
})();
/* south side, axis 5: only the admin block is closed; C–A opens to the old shed */
wall([[-0.55,0.45],[12.42,0.45],[12.42,yC(12.42)-0.06],[-0.55,yC(-0.55)-0.06]],[],g=>{g.position.z=30.4;});
/* admin block inner wall on axis C */
wall([[0,0.75],[30.4,0.75],[30.4,7.15],[0,7.15]],[rect(12.4,14.2,0.75,3.0,'d')],longPlace(12.42));

/* ---------- Labels ---------- */
function textSprite(txt,opt){
  const o=Object.assign({size:56,fg:'#3b3026',bg:null,font:'Almarai',w:1.0},opt);
  const c=document.createElement('canvas'),x=c.getContext('2d');x.font='700 '+o.size+'px '+o.font+', Arial, sans-serif';
  const tw=Math.ceil(x.measureText(txt).width*1.25)+o.size;c.width=tw;c.height=Math.ceil(o.size*1.6);
  const y=c.getContext('2d');y.font='700 '+o.size+'px '+o.font+', Arial, sans-serif';y.textAlign='center';y.textBaseline='middle';y.direction='rtl';
  if(o.bg){y.fillStyle=o.bg;y.fillRect(0,0,c.width,c.height);}y.fillStyle=o.fg;y.fillText(txt,c.width/2,c.height/2+2);
  const tx=new THREE.CanvasTexture(c);tx.encoding=THREE.sRGBEncoding;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:o.depth!==false,transparent:true}));
  const hh=o.w*0.9;s.scale.set(hh*c.width/c.height,hh,1);return s;
}
function bubble(txt){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  x.fillStyle='#ffffff';x.strokeStyle='#3b3026';x.lineWidth=6;x.beginPath();x.arc(64,64,56,0,Math.PI*2);x.fill();x.stroke();
  x.fillStyle='#3b3026';x.font='700 60px Montserrat, Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,64,68);
  const tx=new THREE.CanvasTexture(c);tx.encoding=THREE.sRGBEncoding;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:false}));s.scale.set(1.8,1.8,1);s.renderOrder=5;return s;
}
const gl=new THREE.LineDashedMaterial({color:0x3b3026,dashSize:.8,gapSize:.4,transparent:true,opacity:.55});
function gline(a,b){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),gl);l.computeLineDistances();G.grid.add(l);}
Object.entries(GX).forEach(([k,x])=>{gline(new V(x,0.80,-5),new V(x,0.80,35.4));const b=bubble(k);b.position.set(x,1.4,-6.2);G.grid.add(b);});
GZ.forEach((z,i)=>{gline(new V(-5,0.80,z),new V(41.8,0.80,z));const b=bubble(String(i+1));b.position.set(43,1.4,z);G.grid.add(b);});
function buildLabels(){
  const L=(t,x,y,z,o)=>{const s=textSprite(t,o);s.position.set(x,y,z);G.grid.add(s);};
  L('السقيفة القديمة (مفتوحة على التوسعة)',24.6,1.6,33.2,{w:1.6,depth:false,bg:'rgba(246,231,210,.9)'});
  L('الشمال',18.4,1.6,-8.6,{w:1.3,depth:false,fg:'#5d6c59'});
  const R=(t,x,z,y)=>{const s=textSprite(t,{w:0.75});s.position.set(x,y,z);s.visible=labelsOn;roomLabels.push(s);G.annex.add(s);};
  [['مكتب',1.8],['غرفة',5.6],['غرفة',9.3],['درج',13.2],['مكتب',17.0],['غرفة تدخين',20.7],['مرافق',24.5],['مرافق',28.3]].forEach(([t,z])=>R(t,2.6,z,1.8));
  [['غرفة',2.0],['غرفة',5.7],['غرفة',9.5],['مدخل',13.3],['مكتب',17.0],['مكتب',20.7],['مكتب',26.4]].forEach(([t,z])=>R(t,9.7,z,1.8));
  R('ممر',6.05,21,1.8);
  [['المدير',3.9],['مكتب',9.5],['مكتب',17.0],['مكتب',20.7],['مرافق',24.5],['مرافق',28.3]].forEach(([t,z])=>R(t,2.6,z,5.0));
  [['الإدارة',3.9],['مكتب',9.5],['مكتب',17.0],['مكتب',20.7],['مكتب',26.4]].forEach(([t,z])=>R(t,9.7,z,5.0));
}
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(buildLabels,buildLabels);


/* ---------- BAQ client viewer integration (no internal notes, tender data or quantities) ---------- */
const ARCH=['floor','annex','walls','roof'],STR=['found','cols','brace','beams','rafters','truss','crane'];
let archOn=true,strOn=true,roofOn=true,gridOn=true,floorSel=0;
function vis(){ARCH.forEach(k=>{G[k].visible=archOn&&(k!=='roof'||roofOn);});STR.forEach(k=>{G[k].visible=strOn;});G.grid.visible=gridOn;G.sky.visible=false;roomLabels.forEach(s=>{s.visible=labelsOn;});}
const pY=new THREE.Plane(new V(0,-1,0),100);renderer.clippingPlanes=[pY];
const CUT=[100,3.7,6.9];
function setFloor(i){floorSel=i;pY.constant=CUT[i];if(i>0){roofOn=false;}else{roofOn=true;}vis();}
function cam(p,t){camera.position.set(p[0],p[1],p[2]);controls.target.set(t[0],t[1],t[2]);controls.update();}
const overView=()=>{setFloor(0);cam([-26,26,-34],[18.4,5,15.2]);};
vis();overView();

const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;down=null;
  const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(mouse,camera);const objs=[];scene.traverseVisible(o=>{if(o.isMesh&&o.userData&&o.userData.title)objs.push(o);});
  const hit=ray.intersectObjects(objs,false).find(h=>pY.distanceToPoint(h.point)>=0);
  if(!hit){BAQV.hud(null);return;}
  const d=hit.object.userData,esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  BAQV.hud('<b>'+esc(d.title)+'</b> · '+d.lines.slice(0,2).map(l=>esc(l[0])+': <b>'+esc(l[1])+'</b>').join(' · '));
});

function size(){const w=viewer.clientWidth||innerWidth,h=viewer.clientHeight||innerHeight;renderer.setSize(w,h);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();}
if(window.ResizeObserver)new ResizeObserver(size).observe(viewer);else addEventListener('resize',size);size();
(function loop(){controls.update();renderer.render(scene,camera);requestAnimationFrame(loop);})();

const SPACES=[
 {n:'صالة الورشة (رافعتان جسريتان)',a:'الأرضي',s:'≈ 750 م²'},
 {n:'مكتب',a:'الأرضي',s:'4'},{n:'غرفة',a:'الأرضي',s:'6'},{n:'غرفة تدخين',a:'الأرضي',s:'1'},{n:'مرافق صحية',a:'الأرضي',s:'2'},
 {n:'غرفة المدير',a:'الأول',s:'1'},{n:'الإدارة',a:'الأول',s:'1'},{n:'مكتب',a:'الأول',s:'7'},{n:'مرافق صحية',a:'الأول',s:'2'}];
function boot(){if(!window.BAQV){setTimeout(boot,100);return;}
BAQV.register({
  layers:{
    arch:{get:()=>archOn,set:v=>{archOn=v;vis();}},
    struct:{get:()=>strOn,set:v=>{strOn=v;vis();}}
  },
  options:[
    {id:'roof',label:'صفائح السقف',get:()=>roofOn,set:v=>{roofOn=v;vis();}},
    {id:'labels',label:'أسماء الغرف',get:()=>labelsOn,set:v=>{labelsOn=v;vis();}},
    {id:'grid',label:'المحاور والتسميات',get:()=>gridOn,set:v=>{gridOn=v;vis();}}
  ],
  views:{
    over:overView,
    top:()=>{setFloor(0);cam([18.4,74,15.25],[18.4,0,15.2]);},
    front:()=>{setFloor(0);cam([18.4,7,-52],[18.4,6,15.2]);}
  },
  insides:[
    {label:'صالة الورشة',go:()=>{setFloor(0);cam([30,2.6,29.5],[18.4,6.5,0]);}},
    {label:'المبنى الإداري — الطابق الأرضي',go:()=>{setFloor(1);cam([-8,20,34],[6,0.5,14]);}},
    {label:'المبنى الإداري — الطابق الأول',go:()=>{setFloor(2);cam([-8,23,34],[6,3.9,14]);}},
    {label:'درج الطوارئ الخارجي',go:()=>{setFloor(0);cam([2,3,-12],[3.5,2.5,-1]);}}
  ],
  floors:{items:['المبنى','الأرضي','الأول'],get:()=>floorSel,set:i=>{setFloor(i);}},
  info:{
    facts:[['الأبعاد','36.80 × 30.40 م'],['ارتفاع القمة','13.02 م'],['ارتفاع الطرف','8.30 م'],['الهيكل','حديد I بأعمدة 600 مم ومدادات شبكية'],['الرافعات','رافعتان جسريتان على مسارين'],['المبنى الإداري','طابقان بين المحورين D وC'],['السقف','صفائح كيربي مجلفنة'],['الموقع','البصرة — مصافي الجنوب']],
    spaceCols:[['n','الفضاء'],['a','الطابق'],['s','العدد / المساحة']],spaces:SPACES,
    about:['النموذج مبني من المخططات الإنشائية والمعمارية المرفقة بوثائق المشروع.','اضغط على أي عنصر لعرض مقطعه أو قياسه.','الجهة الجنوبية بين المحورين C وA مفتوحة على السقيفة القائمة.','اختر الطابق من الأزرار أعلى المشهد لرؤية غرف المبنى الإداري.']
  }
});
setTimeout(()=>BAQV.ready(),400);}
boot();
})();
