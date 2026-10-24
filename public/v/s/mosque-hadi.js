/* جامع الإمام علي الهادي (ع) — مشهد مخصص للعارض الموحّد (public/v/s/mosque-hadi.js)
   تصميم المهندس المعماري على هيكل واقع الحال (ملف DWG ‏Project144 دون تعديل)، مع واقع الحال بديلاً للمقارنة.
   المحاكاة: الشمس والظل لموقع البصرة، والإنارة الليلية (كشافات الواجهات والقبة والمئذنة وأعمدة الرصيف)، والجولة. */
(function(){
"use strict";
const BASE="/v/s/mosque-hadi/";
const VER=(document.currentScript&&(document.currentScript.src.split("?v=")[1]||""))||"1";
function loadScript(f){return new Promise((ok,no)=>{const s=document.createElement("script");s.src=BASE+f+"?v="+VER;s.onload=ok;s.onerror=()=>no(new Error(f));document.head.appendChild(s);});}

/* ================= المشهد ================= */
const host=document.getElementById("three");
const R=new THREE.WebGLRenderer({antialias:true});
R.setPixelRatio(Math.min(devicePixelRatio,2));R.outputEncoding=THREE.sRGBEncoding;
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
host.appendChild(R.domElement);R.domElement.style.display="block";
const S=new THREE.Scene();S.background=new THREE.Color(0xdfe6ea);
const C=new THREE.PerspectiveCamera(40,1,0.1,1000);
const ctl=new THREE.OrbitControls(C,R.domElement);ctl.enableDamping=true;ctl.maxPolarAngle=Math.PI*0.495;
const hemi=new THREE.HemisphereLight(0xeaf2ff,0x9a8c74,0.72);S.add(hemi);
const sun=new THREE.DirectionalLight(0xfff3e0,0.8);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:20,far:170});
sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0005;sun.target.position.set(0,4,0);S.add(sun,sun.target);
// إحداثيات ملف DWG بالأمتار: س شرقاً، ص شمالاً، ع للأعلى. المجموعة W تتوسط المبنى في المشهد.
const OX=15.55,OZ=7.85;
const W=new THREE.Group();W.position.set(OX,0,OZ);S.add(W);
const V=(x,y,z)=>new THREE.Vector3(x,z,-y);        // DWG → إحداثيات W المحلية
const Lc=(x,h,z)=>new THREE.Vector3(x,h,z);          // إحداثيات W المحلية مباشرة (س، ارتفاع، -ص)
const road=new THREE.Mesh(new THREE.PlaneGeometry(140,140),new THREE.MeshLambertMaterial({color:0x9a9284}));
road.rotation.x=-Math.PI/2;road.position.y=-0.79;road.receiveShadow=true;S.add(road);

/* ================= تصميم المهندس (glTF) ================= */
const DESIGN=new THREE.Group();W.add(DESIGN);
const GLOW=[];      // مواد تتوهج ليلاً (زجاج دافئ، إنارة خلفية للمشربيات والرقبة)
const PALMS=[];     // النخيل وأحواضه
function loadDesign(){
 return new Promise((ok,no)=>{
  new THREE.GLTFLoader().parse(window.MOSQUE_P6,"",g=>{
   g.scene.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
    const ms=Array.isArray(o.material)?o.material:[o.material];
    ms.forEach(m=>{m.side=THREE.DoubleSide;
     if(m.map&&(m.transparent||m.alphaTest>0||/Jali|Letters|Mashrabiya|Girih|Lattice|Palm|WoodScreen|Medal|NamePlate|Salawat/.test(m.name))){m.transparent=false;m.alphaTest=0.5;}
     if(m.map)m.map.anisotropy=4;
     if(m.map&&/Girih|Mashrabiya|Jali|Lattice|WoodScreen/.test(m.name)){m.map.minFilter=THREE.LinearFilter;m.map.generateMipmaps=false;m.map.needsUpdate=true;}
     if(/Glass|Backlight|SlotGlow|NicheRim|Lantern|LED|Orosi/.test(m.name)){m.emissiveIntensity=0.55;if(GLOW.indexOf(m)<0)GLOW.push(m);}
    });
    if(/^(frond|trunk|planter)/.test(o.name))PALMS.push(o);
   });
   // نوافذ المئذنة: مادة خاصة تتوهج ليلاً
   const minGlass=new THREE.MeshStandardMaterial({color:0x2a2620,emissive:0xffc77a,emissiveIntensity:0.05,roughness:0.4});
   g.scene.traverse(o=>{if(o.isMesh&&/^min_window/.test(o.name))o.material=minGlass;});GLOW.push(minGlass);
   DESIGN.add(g.scene);ok();
  },e=>no(e));
 });
}

/* ================= واقع الحال (من ملف DWG) — يُحمَّل عند الطلب ================= */
const ASIS=new THREE.Group();ASIS.visible=false;W.add(ASIS);
let asisReady=null;
function buildAsis(){
 const D=window.MOSQUE_ASIS;const loader=new THREE.TextureLoader();
 const TX={};for(const k in D.tex){const t=loader.load(D.tex[k]);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;TX[k]=t;}
 const rep=n=>{const t=loader.load(D.tex[n]);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;};
 const REAL={stone:{map:rep("stone")},block:{map:rep("block")},plaster:{map:rep("plaster")},marble:{color:0xeee9e0},slab:{color:0xd8d0c2},roof:{color:0xa39a8c},granite:{color:0x26292d},paving:{color:0x8a857c}};
 for(const k in D.geo){const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(D.geo[k].p,3));
  g.setAttribute("uv",new THREE.Float32BufferAttribute(D.geo[k].uv,2));g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial(Object.assign({side:THREE.DoubleSide},REAL[k]||{color:0xcccccc})));m.castShadow=m.receiveShadow=true;ASIS.add(m);}
 function panel(ax,ay,bx,by,z1,z2,mat){const g=new THREE.BufferGeometry();
  g.setFromPoints([V(ax,ay,z1),V(bx,by,z1),V(bx,by,z2),V(ax,ay,z2)]);g.setIndex([0,1,2,0,2,3]);
  g.setAttribute("uv",new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat);m.receiveShadow=true;ASIS.add(m);return m;}
 const tm=(n,o)=>new THREE.MeshLambertMaterial(Object.assign({map:TX[n],side:THREE.DoubleSide},o||{}));
 const xw=-25.69;
 [[6.91,8.77],[10.92,12.73],[14.94,16.75]].forEach(([a,b])=>{panel(xw,b,xw,a,0.07,2.13,tm("door"));panel(xw,b,xw,a,3.97,6.03,tm("win_grille"));panel(xw,b,xw,a,7.37,9.43,tm("win_up"));});
 panel(xw,1.95,xw,0.53,1.12,6.3,tm("bigwin"));panel(xw,2.02,xw,0.64,7.11,9.17,tm("win_up"));
 const xo=-25.85;
 [["round1",16.75,14.94],["round2",12.73,10.92],["round3",8.77,6.91]].forEach(([n,a,b])=>panel(xo,a+0.05,xo,b-0.05,2.33,3.77,tm(n)));
 panel(xo,5.25,xo,2.55,2.40,3.90,tm("round4"));
 const blue=new THREE.MeshLambertMaterial({color:0x22306e,side:THREE.DoubleSide});
 const fz=()=>tm("frieze",{map:rep("frieze")});const mz=()=>new THREE.MeshLambertMaterial({map:rep("meander"),side:THREE.DoubleSide});
 panel(xo,18.15,xo,2.0,6.22,6.58,fz());panel(xo,18.15,xo,2.0,6.10,6.22,mz());panel(xo,2.35,xo,2.0,3.6,6.22,blue);
 const ys=-1.47,yo=-1.63;
 panel(-23.63,ys,-21.88,ys,1.16,6.3,tm("bigwin"));panel(-20.19,ys,-16.37,ys,2.69,5.85,tm("bigwin"));
 const dark=new THREE.MeshLambertMaterial({color:0x1d2320,side:THREE.DoubleSide}),green=new THREE.MeshLambertMaterial({color:0x1f5a3a,side:THREE.DoubleSide});
 [[-15.94,-12.6],[-12.3,-8.32]].forEach(([a,b])=>panel(a,ys,b,ys,2.69,3.13,dark));
 [[-15.32,-14.3],[-6.82,-5.8]].forEach(([a,b])=>panel(a,ys,b,ys,0.2,2.24,green));
 panel(-7.8,ys,-7.19,ys,1.02,2.24,tm("win_grille"));
 [[-15.01,-13.79],[-11.86,-10.64]].forEach(([a,b])=>panel(a,ys,b,ys,4.27,5.69,tm("win_grille")));
 panel(-9.25,ys,-8.92,ys,4.88,5.69,dark);[[-7.6,-7.1],[-6.5,-6.0]].forEach(([a,b])=>panel(a,ys,b,ys,5.39,5.89,dark));
 panel(-23.3,ys,-21.87,ys,7.53,9.23,tm("win_up"));
 const yp=-2.31;[[-16.54,-15.93,7.92,9.14],[-14.8,-13.78,7.91,9.19],[-11.66,-10.64,7.91,9.19]].forEach(([a,b,z1,z2])=>panel(a,yp,b,yp,z1,z2,tm("win_up")));
 panel(-21.8,yo,-5.6,yo,6.22,6.58,fz());panel(-21.8,yo,-5.6,yo,6.10,6.22,mz());
 panel(-21.8,yo,-21.45,yo,3.6,6.22,blue);panel(-5.95,yo,-5.6,yo,3.6,6.22,blue);
 const ga=[-25.62,0.47],gb=[-23.73,-1.42];
 panel(...ga,...gb,0,4.2,tm("gate"));panel(...ga,...gb,4.2,6.3,tm("win_grille"));
 // القبة والمئذنة الحديدية في واقع الحال (أبعاد تقديرية من الصور)
 const R0=9.95,put=(m,x,y,z)=>{m.position.copy(V(x,y,z));m.castShadow=m.receiveShadow=true;ASIS.add(m);return m;};
 const dc=[-21.0,3.8];
 put(new THREE.Mesh(new THREE.CylinderGeometry(3.35,3.35,0.35,8),new THREE.MeshLambertMaterial({color:0xcfc6b8})),...dc,R0+0.175).rotation.y=Math.PI/8;
 const dt=rep("drum");dt.repeat.set(8,1);
 put(new THREE.Mesh(new THREE.CylinderGeometry(3.15,3.15,1.6,8,1,true),new THREE.MeshLambertMaterial({map:dt,side:THREE.DoubleSide})),...dc,R0+1.15).rotation.y=Math.PI/8;
 const gt=rep("gold");gt.repeat.set(6,2);
 const gold=new THREE.MeshPhongMaterial({color:0xf2c14e,map:gt,specular:0xfff0b0,shininess:70,emissive:0x2a1a00});
 put(new THREE.Mesh(new THREE.SphereGeometry(2.95,48,24,0,Math.PI*2,0,Math.PI/2),gold),...dc,R0+1.95).scale.y=1.08;
 const rust=new THREE.MeshLambertMaterial({color:0x6b4a32});const mc=[-23.6,9.0];
 [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,b])=>put(new THREE.Mesh(new THREE.BoxGeometry(0.1,1.8,0.1),rust),mc[0]+a,mc[1]+b,R0+0.9));
 put(new THREE.Mesh(new THREE.BoxGeometry(2.3,0.12,2.3),rust),...mc,R0+1.8);
 const cage=new THREE.Group();for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const b=new THREE.Mesh(new THREE.BoxGeometry(0.05,2.8,0.05),rust);b.position.set(Math.cos(a)*0.85,1.4,Math.sin(a)*0.85);cage.add(b);}
 [0.05,0.9,1.8,2.75].forEach(h=>{const r=new THREE.Mesh(new THREE.TorusGeometry(0.85,0.04,6,32),rust);r.rotation.x=Math.PI/2;r.position.y=h;cage.add(r);});
 cage.position.copy(V(...mc,R0+1.86));cage.traverse(o=>o.castShadow=true);ASIS.add(cage);
}
function ensureAsis(){if(!asisReady)asisReady=loadScript("asis.js").then(buildAsis);return asisReady;}

/* ================= الإنارة الليلية ================= */
// مواقع توضيحية: كشافات أرضية مدفونة في الرصيف تغسل الواجهات، وكشافات على السطح للقبة، وإنارة المئذنة، وأعمدة رصيف.
const LIGHTS=new THREE.Group();W.add(LIGHTS);
const FIX=new THREE.Group();W.add(FIX);           // أجسام وحدات الإنارة (طبقة الإنارة)
const NIGHT=[];                                   // [ضوء، الشدة الكاملة]
const housing=new THREE.MeshStandardMaterial({color:0x3a3d40,metalness:0.6,roughness:0.45});
const lens=new THREE.MeshStandardMaterial({color:0x222222,emissive:0xffd9a0,emissiveIntensity:0});GLOW.push(lens);
function spot(p,t,I,dist,ang,col){const s=new THREE.SpotLight(col||0xffd7a0,0,dist,ang,0.65,1.4);s.position.copy(p);s.target.position.copy(t);LIGHTS.add(s,s.target);NIGHT.push([s,I]);return s;}
function upl(x,z,tx,ty,tz,I){spot(Lc(x,0.06,z),Lc(tx,ty,tz),I,17,0.42);
 const f=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.05,16),housing);f.position.copy(Lc(x,0.025,z));FIX.add(f);
 const l=new THREE.Mesh(new THREE.CircleGeometry(0.12,16),lens);l.rotation.x=-Math.PI/2;l.position.copy(Lc(x,0.052,z));FIX.add(l);}
// الواجهة الغربية (وجهها عند س≈-26.6): خمسة كشافات أرضية
[-17.2,-13.8,-9.8,-5.8,-2.6].forEach(z=>upl(-27.35,z,-26.6,9.2,z,1.5));
// الواجهة الجنوبية (وجهها عند ع≈+2.5)
[-21.6,-17.8,-14.0,-10.2,-6.4].forEach(x=>upl(x,3.0,x,9.2,2.5,1.5));
// البوابة الركنية
upl(-26.9,2.9,-25.1,10.5,1.1,2.0);
// القبة: كشافان على السطح من الجنوب الغربي والجنوب الشرقي
[[-24.2,-0.6],[-13.4,-0.9],[-13.6,-11.5]].forEach(([x,z])=>{spot(Lc(x,11.35,z),Lc(-18.83,15.2,-5.82),1.6,16,0.5,0xffe2b0);
 const f=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.25,0.3),housing);f.position.copy(Lc(x,11.32,z));FIX.add(f);});
// المئذنة: إنارة الشرفتين وكشاف يغسل الجذع
const minP=new THREE.PointLight(0xffd59a,0,7,1.6);minP.position.copy(Lc(-23.4,15.9,-6.59));LIGHTS.add(minP);NIGHT.push([minP,1.3]);
const minP2=new THREE.PointLight(0xffd59a,0,5,1.6);minP2.position.copy(Lc(-23.4,18.6,-6.59));LIGHTS.add(minP2);NIGHT.push([minP2,1.0]);
spot(Lc(-21.4,11.3,-4.6),Lc(-23.4,19,-6.59),1.2,13,0.32,0xfff0d0);
// أعمدة إنارة الرصيف (ارتفاع 6 م)
const poleM=new THREE.MeshStandardMaterial({color:0x4a4f52,metalness:0.55,roughness:0.5});
const lampM=new THREE.MeshStandardMaterial({color:0xf3eee4,emissive:0xffe0a8,emissiveIntensity:0.05});GLOW.push(lampM);
[[-31.4,-17.3],[-31.4,-9.25],[-14.25,4.05],[-6.0,4.05]].forEach(([x,z])=>{
 const b=-0.28,h=6;const p=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.09,h,10),poleM);p.position.copy(Lc(x,b+h/2,z));p.castShadow=true;FIX.add(p);
 const head=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.2,0.18,16),poleM);head.position.copy(Lc(x,b+h+0.05,z));FIX.add(head);
 const glow=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.04,16),lampM);glow.position.copy(Lc(x,b+h-0.05,z));FIX.add(glow);
 const pl=new THREE.PointLight(0xffe2b0,0,16,1.8);pl.position.copy(Lc(x,b+h-0.3,z));LIGHTS.add(pl);NIGHT.push([pl,1.0]);
});
FIX.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});
let nightK=0;
function setNightLevel(k){nightK=k;
 NIGHT.forEach(([l,I])=>l.intensity=I*k);
 GLOW.forEach(m=>{if(m===lens||m===lampM)m.emissiveIntensity=0.05+2.2*k;else m.emissiveIntensity=(m.userData.base==null?(m.userData.base=m.emissiveIntensity):m.userData.base)+1.35*k;});
}

/* ================= الشمس والظل (موقع البصرة) ================= */
const Wfn=(x,y,z)=>new THREE.Vector3(x+OX,z,-y+OZ);
const ctx=BAQK.Ctx({scene:S,W:Wfn,dom:R.domElement});
const sunSim=new BAQK.Sun(ctx,{light:sun,hemi,lat:30.5,front:180,hour:16.5,maxI:0.85,hemiI:0.72,sky:"#dfe6ea",
 onNight:(isN,u)=>setNightLevel(Math.max(0,Math.min(1,1-u)))});
// اتجاه الشمال ثابت حسب المخطط، فلا يُعرض اختيار اتجاه الواجهة
(function(){const sel=sunSim.node.querySelector('[data-i="front"]');if(sel){const lb=sel.closest("label");if(lb)lb.style.display="none";}})();
BAQK.tick(dt=>sunSim.tick(dt));

/* ================= الحالة والعرض ================= */
const st={variant:0,light:true,palms:true,dust:false};
function apply(){
 DESIGN.visible=st.variant===0;ASIS.visible=st.variant===1;
 FIX.visible=st.light;LIGHTS.visible=true;
 PALMS.forEach(o=>o.visible=st.palms);
 if(st.dust){if(!S.fog)S.fog=new THREE.Fog(0xcdb998,18,110);}else S.fog=null;
}
const T=new THREE.Vector3(0,4.5,0);
const VIEWS={iso:[[-30,14,30],T],west:[[-42,5,0.3],T],south:[[0.5,5,42],T],top:[[0,56,0.01],T],
 street:[[-27,1.7,27],new THREE.Vector3(-8,6.5,2)],door:[[-17.5,1.7,17.5],new THREE.Vector3(-10.5,5.5,10.5)]};
let tourOn=false,tourT=0;
function setView(n){tourOn=false;const v=VIEWS[n];C.position.set(...v[0]);ctl.target.copy(v[1]);ctl.update();}
R.domElement.addEventListener("pointerdown",()=>{tourOn=false;});
BAQK.tick(dt=>{if(!tourOn)return;tourT+=dt;const a=-2.36+tourT*0.16,r=34+4*Math.sin(tourT*0.3),h=7+5*(0.5+0.5*Math.sin(tourT*0.21));
 C.position.set(Math.cos(a)*r,h,-Math.sin(a)*r);ctl.target.set(0,5.5,0);if(tourT>40)tourOn=false;});
function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;R.setSize(r.width,r.height);C.aspect=r.width/r.height;C.updateProjectionMatrix();}
if(window.ResizeObserver)new ResizeObserver(resize).observe(host);addEventListener("resize",resize);
function loop(){requestAnimationFrame(loop);if(S.fog)S.fog.color.copy(S.background);ctl.update();R.render(S,C);}
setView("iso");resize();loop();

/* ================= العارض الموحّد ================= */
const flag=k=>({get:()=>st[k],set:v=>{st[k]=v;apply();}});
function register(){
 BAQV.register({
  variants:{items:[{name:"تصميم المهندس المعماري",note:"الواجهات الجديدة على الهيكل الحالي",sw:"#c9a46a"},{name:"واقع الحال",note:"المبنى الحالي من ملف DWG",sw:"#9a9284"}],
   get:()=>st.variant,set:i=>{if(i===1){ensureAsis().then(()=>{st.variant=1;apply();});}else{st.variant=0;apply();}}},
  layers:{arch:{get:()=>true,set:()=>{}},light:flag("light"),green:flag("palms")},
  legends:{arch:[["#d9c9ad","حجر الجفّ"],["#3b3e42","رخام رمادي غامق للقواعد والأحزمة"],["#a8763e","مشربيات معدنية برونزية"],["#f2c14e","القبة الذهبية"]],
   light:[["#ffd9a0","كشافات أرضية لغسل الواجهات والبوابة"],["#ffe2b0","كشافات القبة والمئذنة"],["#4a4f52","أعمدة إنارة الرصيف 6 م"]],
   green:[["#5d7a43","نخيل في أحواض رخامية"]]},
  options:[{id:"dust",label:"أجواء الغبار",get:()=>st.dust,set:v=>{st.dust=v;apply();}}],
  views:{over:()=>setView("iso"),top:()=>setView("top"),front:()=>setView("west")},
  insides:[{label:"الواجهة الجنوبية",go:()=>setView("south")},{label:"من الشارع",go:()=>setView("street")},{label:"أمام البوابة الركنية",go:()=>setView("door")}],
  sims:{sun:{node:sunSim.node},
   night:{get:()=>!!sunSim.isNight,set:v=>sunSim.setNight(v)},
   walk:{tour:{start:()=>{tourOn=true;tourT=0;},stop:()=>{tourOn=false;},on:()=>tourOn}}},
  info:{facts:[["المشروع","إعادة تصميم واجهات الجامع"],["الموقع","البصرة"],["أبعاد المبنى","20.55 × 19.76 م"],["الطوابق","أرضي + أول (+6.60)"],["ارتفاع السطح","+9.95 م"],["الدروة","+11.00 م"],["البوابة الركنية","+12.80 م"],["قمة القبة","+17.15 م"],["المئذنة","نحو +22.0 م"]],
   about:["الجدران والفتحات والبلاطات والمناسيب من ملف واقع الحال بقياساته الحقيقية دون تعديل.","الواجهات الغربية والجنوبية والمدخل الركني منقولة من رسومات المهندس المعماري بمقياس 1:100.","حركة الشمس محسوبة لموقع البصرة، واتجاه الشمال حسب المخطط.","مواقع الكشافات وأعمدة الإنارة توضيحية، وتُعتمد في مخططات الكهرباء التنفيذية.","القبة والمئذنة في واقع الحال مضافة بأبعاد تقديرية من الصور."]}
 });
}
function boot(){if(!window.BAQV){setTimeout(boot,100);return;}
 loadScript("gltf.js").then(()=>loadScript("p6.js")).then(loadDesign).then(()=>{apply();register();sunSim.apply();setTimeout(()=>BAQV.ready(),300);})
 .catch(e=>{console.error(e);BAQV.hud("تعذّر تحميل النموذج، أعد تحميل الصفحة.");BAQV.ready();});
}
boot();
})();
