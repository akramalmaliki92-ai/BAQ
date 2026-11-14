/* مشروع بناية — جدول كميات IQWQ (BQ-QTN-2026-0033) — مشهد مخصص للعارض الموحّد (public/v/s/iqwq-bldg01.js)
   مولَّد من صورة المخطط المرفقة بجدول الكميات؛ المقياس مضبوط على سقف 265 م² وجدار 24 سم */
(function(){
"use strict";
const DATA={"walls": [{"a": [4.428, 21.322], "b": [7.181, 21.322], "t": 0.24, "kind": "ext", "ops": [{"c": 1.376, "w": 1.6, "s": 0, "h": 2.1, "k": "dExt2"}]}, {"a": [7.181, 21.322], "b": [7.181, 19.812], "t": 0.24, "kind": "ext", "ops": []}, {"a": [7.181, 19.812], "b": [15.014, 19.812], "t": 0.24, "kind": "ext", "ops": [{"c": 5.199, "w": 1.5, "s": 1.0, "h": 2.2, "k": "wSt"}, {"c": 0.637, "w": 0.35, "s": 2.05, "h": 2.4, "k": "vent"}, {"c": 1.927, "w": 0.35, "s": 2.05, "h": 2.4, "k": "vent"}]}, {"a": [15.014, 19.812], "b": [15.014, 1.644], "t": 0.24, "kind": "ext", "ops": [{"c": 2.588, "w": 1.5, "s": 1.0, "h": 2.2, "k": "wSt"}, {"c": 6.52, "w": 1.5, "s": 1.0, "h": 2.2, "k": "wSt"}, {"c": 11.554, "w": 1.5, "s": 1.0, "h": 2.2, "k": "wSt"}, {"c": 15.644, "w": 1.5, "s": 1.0, "h": 2.2, "k": "wSt"}]}, {"a": [15.014, 1.644], "b": [7.181, 1.644], "t": 0.24, "kind": "ext", "ops": [{"c": 2.634, "w": 1.5, "s": 1.0, "h": 2.2, "k": "wSt"}, {"c": 7.196, "w": 0.35, "s": 2.05, "h": 2.4, "k": "vent"}, {"c": 5.906, "w": 0.35, "s": 2.05, "h": 2.4, "k": "vent"}]}, {"a": [7.181, 1.644], "b": [7.181, 0.118], "t": 0.24, "kind": "ext", "ops": []}, {"a": [7.181, 0.118], "b": [4.428, 0.118], "t": 0.24, "kind": "ext", "ops": [{"c": 1.377, "w": 1.6, "s": 0, "h": 2.1, "k": "dExt2"}]}, {"a": [4.428, 0.118], "b": [4.428, 1.644], "t": 0.24, "kind": "ext", "ops": []}, {"a": [4.428, 1.644], "b": [3.461, 1.644], "t": 0.24, "kind": "ext", "ops": []}, {"a": [3.461, 1.644], "b": [1.644, 3.586], "t": 0.24, "kind": "ext", "ops": [{"c": 1.33, "w": 1.0, "s": 1.0, "h": 2.2, "k": "wPvc"}]}, {"a": [1.644, 3.586], "b": [1.644, 5.466], "t": 0.24, "kind": "ext", "ops": [{"c": 0.944, "w": 1.0, "s": 1.0, "h": 2.2, "k": "wPvc"}]}, {"a": [1.644, 5.466], "b": [0.889, 5.466], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.889, 5.466], "b": [0.889, 6.253], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.889, 6.253], "b": [0.118, 6.253], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.118, 6.253], "b": [0.118, 7.708], "t": 0.24, "kind": "ext", "ops": [{"c": 0.655, "w": 1.5, "s": 1.0, "h": 2.2, "k": "wSt"}]}, {"a": [0.118, 7.708], "b": [0.317, 7.749], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.317, 7.749], "b": [0.503, 7.871], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.503, 7.871], "b": [0.663, 8.065], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.663, 8.065], "b": [0.785, 8.317], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.785, 8.317], "b": [0.862, 8.611], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.862, 8.611], "b": [0.889, 8.927], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.889, 8.927], "b": [1.644, 8.927], "t": 0.24, "kind": "ext", "ops": []}, {"a": [1.644, 8.927], "b": [1.644, 12.49], "t": 0.24, "kind": "ext", "ops": [{"c": 1.785, "w": 1.0, "s": 0, "h": 2.1, "k": "dExt1"}]}, {"a": [1.644, 12.49], "b": [0.889, 12.49], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.889, 12.49], "b": [0.862, 12.819], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.862, 12.819], "b": [0.785, 13.127], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.785, 13.127], "b": [0.663, 13.391], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.663, 13.391], "b": [0.503, 13.593], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.503, 13.593], "b": [0.317, 13.72], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.317, 13.72], "b": [0.118, 13.764], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.118, 13.764], "b": [0.118, 15.219], "t": 0.24, "kind": "ext", "ops": [{"c": 0.655, "w": 1.5, "s": 1.0, "h": 2.2, "k": "wSt"}]}, {"a": [0.118, 15.219], "b": [0.889, 15.219], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.889, 15.219], "b": [0.889, 15.974], "t": 0.24, "kind": "ext", "ops": []}, {"a": [0.889, 15.974], "b": [1.644, 15.974], "t": 0.24, "kind": "ext", "ops": []}, {"a": [1.644, 15.974], "b": [1.644, 18.042], "t": 0.24, "kind": "ext", "ops": [{"c": 1.014, "w": 1.0, "s": 1.0, "h": 2.2, "k": "wPvc"}]}, {"a": [1.644, 18.042], "b": [3.461, 19.812], "t": 0.24, "kind": "ext", "ops": [{"c": 1.262, "w": 1.0, "s": 1.0, "h": 2.2, "k": "wPvc"}]}, {"a": [3.461, 19.812], "b": [4.428, 19.812], "t": 0.24, "kind": "ext", "ops": [{"c": 0.267, "w": 0.35, "s": 2.05, "h": 2.4, "k": "vent"}]}, {"a": [4.428, 19.812], "b": [4.428, 21.322], "t": 0.24, "kind": "ext", "ops": []}, {"a": [4.428, 19.812], "b": [4.428, 12.49], "t": 0.24, "kind": "int", "ops": []}, {"a": [1.644, 15.974], "b": [4.428, 15.974], "t": 0.24, "kind": "int", "ops": [{"c": 1.927, "w": 0.9, "s": 0, "h": 2.1, "k": "dIn"}]}, {"a": [1.644, 12.49], "b": [4.428, 12.49], "t": 0.24, "kind": "int", "ops": [{"c": 1.612, "w": 1.6, "s": 0, "h": 2.1, "k": "dIn"}]}, {"a": [7.204, 19.812], "b": [7.204, 15.769], "t": 0.24, "kind": "int", "ops": []}, {"a": [7.204, 15.769], "b": [9.745, 15.769], "t": 0.24, "kind": "int", "ops": [{"c": 0.865, "w": 0.9, "s": 0, "h": 2.1, "k": "dIn"}]}, {"a": [9.745, 19.812], "b": [9.745, 1.644], "t": 0.24, "kind": "int", "ops": [{"c": 7.904, "w": 1.6, "s": 0, "h": 2.1, "k": "dIn"}, {"c": 10.28, "w": 1.6, "s": 0, "h": 2.1, "k": "dIn"}]}, {"a": [9.745, 10.736], "b": [15.014, 10.736], "t": 0.24, "kind": "int", "ops": []}, {"a": [1.644, 8.927], "b": [7.204, 8.927], "t": 0.24, "kind": "int", "ops": []}, {"a": [7.204, 8.927], "b": [7.204, 1.644], "t": 0.24, "kind": "int", "ops": [{"c": 0.905, "w": 0.95, "s": 0, "h": 2.1, "k": "dIn"}]}, {"a": [7.204, 5.702], "b": [9.745, 5.702], "t": 0.24, "kind": "int", "ops": [{"c": 0.865, "w": 0.9, "s": 0, "h": 2.1, "k": "dIn"}]}, {"a": [4.428, 1.644], "b": [7.181, 1.644], "t": 0.24, "kind": "int", "ops": [{"c": 1.895, "w": 1.1, "s": 0, "h": 2.1, "k": "dIn"}]}, {"a": [3.099, 17.979], "b": [4.428, 17.979], "t": 0.12, "kind": "part", "ops": []}, {"a": [8.463, 19.812], "b": [8.463, 18.105], "t": 0.12, "kind": "part", "ops": []}, {"a": [8.101, 18.105], "b": [8.825, 18.105], "t": 0.12, "kind": "part", "ops": []}, {"a": [8.463, 3.319], "b": [8.463, 1.644], "t": 0.12, "kind": "part", "ops": []}, {"a": [8.101, 3.319], "b": [8.825, 3.319], "t": 0.12, "kind": "part", "ops": []}], "spaces": [{"n": "القاعة الأمامية", "f": "marble", "a": 44.4, "c": [12.38, 15.27], "poly": [[14.894, 19.692], [14.894, 10.856], [9.865, 10.856], [9.865, 19.692]]}, {"n": "القاعة الخلفية", "f": "marble", "a": 44.5, "c": [12.38, 6.19], "poly": [[14.894, 1.764], [9.865, 1.764], [9.865, 10.616], [14.894, 10.616]]}, {"n": "الغرفة الوسطى", "f": "marble", "a": 11.9, "c": [2.46, 14.24], "poly": [[1.644, 12.61], [1.0, 12.61], [0.982, 12.829], [0.981, 12.839], [0.978, 12.848], [0.901, 13.156], [0.899, 13.167], [0.894, 13.177], [0.772, 13.441], [0.772, 13.441], [0.766, 13.454], [0.757, 13.466], [0.757, 13.466], [0.597, 13.668], [0.597, 13.668], [0.586, 13.682], [0.571, 13.692], [0.571, 13.692], [0.385, 13.819], [0.385, 13.819], [0.366, 13.832], [0.343, 13.837], [0.343, 13.837], [0.238, 13.86], [0.238, 15.099], [0.889, 15.099], [1.009, 15.099], [1.009, 15.219], [1.009, 15.854], [1.644, 15.854], [1.764, 15.854], [4.308, 15.854], [4.308, 12.61], [1.764, 12.61]]}, {"n": "الغرفة الأمامية", "f": "marble", "a": 7.7, "c": [3.17, 17.65], "poly": [[1.764, 17.991], [3.51, 19.692], [4.308, 19.692], [4.308, 16.094], [1.764, 16.094]]}, {"n": "الغرفة الخلفية", "f": "marble", "a": 39.5, "c": [4.21, 5.58], "poly": [[7.061, 1.764], [4.548, 1.764], [4.428, 1.764], [3.513, 1.764], [1.764, 3.633], [1.764, 5.466], [1.764, 5.586], [1.644, 5.586], [1.009, 5.586], [1.009, 6.253], [1.009, 6.373], [0.889, 6.373], [0.238, 6.373], [0.238, 7.61], [0.364, 7.636], [0.493, 7.721], [0.569, 7.771], [0.569, 7.771], [0.584, 7.781], [0.596, 7.795], [0.596, 7.795], [0.756, 7.989], [0.756, 7.989], [0.765, 8.0], [0.771, 8.013], [0.771, 8.013], [0.81, 8.093], [0.898, 8.275], [0.981, 8.591], [0.999, 8.807], [1.644, 8.807], [1.764, 8.807], [7.084, 8.807], [7.084, 1.764]]}, {"n": "الممر والاستقبال", "f": "marble", "a": 64.3, "c": [6.4, 12.87], "poly": [[7.061, 21.202], [7.061, 19.812], [7.061, 19.692], [7.084, 19.692], [7.084, 15.769], [7.204, 15.769], [7.204, 15.649], [9.625, 15.649], [9.625, 5.822], [7.324, 5.822], [7.324, 8.927], [7.204, 8.927], [7.204, 9.047], [1.764, 9.047], [1.764, 12.37], [4.428, 12.37], [4.428, 12.49], [4.548, 12.49], [4.548, 19.692], [4.548, 19.812], [4.548, 21.202]]}, {"n": "الصحيات الأمامية", "f": "ceramic", "a": 8.8, "c": [8.47, 17.79], "poly": [[9.625, 19.692], [9.625, 15.889], [7.324, 15.889], [7.324, 19.692]]}, {"n": "الصحيات الخلفية", "f": "ceramic", "a": 8.8, "c": [8.47, 3.67], "poly": [[7.324, 1.764], [7.324, 5.582], [9.625, 5.582], [9.625, 1.764]]}, {"n": "مدخل خلفي", "f": "marble", "a": 3.2, "c": [5.8, 0.88], "poly": [[7.061, 0.238], [4.548, 0.238], [4.548, 1.524], [7.061, 1.524]]}], "foot": [[4.308, 21.442], [7.301, 21.442], [7.301, 19.932], [15.134, 19.932], [15.134, 1.524], [7.301, 1.524], [7.301, -0.002], [4.308, -0.002], [4.308, 1.524], [3.409, 1.524], [1.524, 3.539], [1.524, 5.346], [0.769, 5.346], [0.769, 6.133], [-0.002, 6.133], [-0.002, 7.806], [0.27, 7.862], [0.422, 7.961], [0.561, 8.13], [0.672, 8.359], [0.743, 8.631], [0.779, 9.047], [1.524, 9.047], [1.524, 12.37], [0.778, 12.37], [0.743, 12.799], [0.671, 13.087], [0.56, 13.328], [0.42, 13.504], [0.268, 13.608], [-0.002, 13.668], [-0.002, 15.339], [0.769, 15.339], [0.769, 16.094], [1.524, 16.094], [1.524, 18.093], [3.412, 19.932], [4.308, 19.932]], "pave": [[-0.263, 12.701], [-1.002, 12.865], [-1.002, 16.339], [-0.231, 16.339], [-0.231, 17.094], [0.524, 17.094], [0.524, 18.515], [3.006, 20.932], [3.308, 20.932], [3.308, 22.442], [8.301, 22.442], [8.301, 20.932], [16.134, 20.932], [16.134, 0.524], [8.301, 0.524], [8.301, -1.002], [3.308, -1.002], [3.308, 0.524], [2.975, 0.524], [0.524, 3.144], [0.524, 4.346], [-0.231, 4.346], [-0.231, 5.133], [-1.002, 5.133], [-1.002, 8.621], [-0.253, 8.775], [-0.139, 10.047], [0.524, 10.047], [0.524, 11.37], [-0.143, 11.37]], "bounds": [-0.0, -0.0, 15.13, 21.44], "ext_len": 72.3, "int_len": 61.0};
const FFL=0.45, WH=3.10, SLAB=0.20, PAR=0.95;
const TOP=FFL+WH, ROOF=TOP+SLAB;
const B=DATA.bounds, CX=(B[0]+B[2])/2, CY=(B[1]+B[3])/2;
const SITE={tank:{x0:17.6,x1:19.6,y0:15.6,y1:19.6}, pump:{x0:17.35,x1:19.85,y0:11.6,y1:13.6}};

/* ================= المشهد ================= */
const host=document.getElementById("three");
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement); renderer.domElement.style.display="block";
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xe7e1d6); scene.fog=new THREE.Fog(0xe7e1d6,70,170);
const camera=new THREE.PerspectiveCamera(40,1,0.05,600);
const controls=new THREE.OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.maxPolarAngle=Math.PI/2-0.02;
scene.add(new THREE.HemisphereLight(0xffffff,0x9c8b72,0.72));scene.add(new THREE.AmbientLight(0xfff6ea,0.12));
const P=(x,y,z=0)=>new THREE.Vector3(x,z,-y);
const sun=new THREE.DirectionalLight(0xfff2dc,0.85);
sun.position.copy(P(CX-22,CY-26,34)); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:120}); sun.shadow.bias=-0.0006;
sun.target.position.copy(P(CX,CY,0)); scene.add(sun,sun.target);

const L={}; ["roof","walls","open","floor","zone","fdn","drain","water","base","plain"].forEach(k=>{L[k]=new THREE.Group();scene.add(L[k]);});
const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0},o));
function tex(draw,w=256,h=256,rx=1,ry=1){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=8;return t;}
const tiles=(base,line,n)=>tex((c,w,h)=>{c.fillStyle=base;c.fillRect(0,0,w,h);c.strokeStyle=line;c.lineWidth=2;for(let i=0;i<=n;i++){c.beginPath();c.moveTo(i*w/n,0);c.lineTo(i*w/n,h);c.stroke();c.beginPath();c.moveTo(0,i*h/n);c.lineTo(w,i*h/n);c.stroke();}});
const mat={
 wallOut:M(0xefe6d6), wallIn:M(0xf6f2ea), part:M(0xe6e0d4), plinth:M(0xb9ad98), slab:M(0xd8d2c6), par:M(0xece3d2),
 steel:M(0x5f6a70,{metalness:.5,roughness:.45}), wood:M(0x8a5a33,{roughness:.6}), frame:M(0x3f4549,{metalness:.4,roughness:.5}),
 pvc:M(0xf4f4f2,{roughness:.5}), glass:new THREE.MeshStandardMaterial({color:0x9cc3cf,transparent:true,opacity:.45,roughness:.1,metalness:.2,side:THREE.DoubleSide,depthWrite:false}),
 grill:M(0x2e3438,{metalness:.5,roughness:.5}), vent:M(0xcfd3d4,{metalness:.4}), conc:M(0xbdb6a8), fdn:M(0xa59d8e), brick:M(0xb07a5a),
 pipeW:M(0x2f8fd0), pipeD:M(0x8b5a2b), tank:M(0x2c3e66,{roughness:.5}), pump:M(0x2f7d4f,{roughness:.5}), kspan:M(0xf2f2f0,{metalness:.35,roughness:.4,side:THREE.DoubleSide}),
 drainCap:M(0x9aa1a4,{metalness:.6,roughness:.4})
};
mat.marble=M(0xe9e1d2,{roughness:.35}); mat.marble.map=tiles("#ebe3d4","rgba(150,130,100,.35)",4); mat.marble.map.repeat.set(0.82,0.82);
mat.ceramic=M(0xdfe6e8,{roughness:.4}); mat.ceramic.map=tiles("#e2e9ea","rgba(90,110,120,.35)",8); mat.ceramic.map.repeat.set(0.82,0.82);
mat.roofTile=M(0xd9c9ad,{roughness:.7}); mat.roofTile.map=tiles("#dccbb0","rgba(120,95,60,.35)",4); mat.roofTile.map.repeat.set(1.6,1.6);
const ZCOL={"القاعة الأمامية":0xe9c99a,"القاعة الخلفية":0xe3b98a,"الغرفة الوسطى":0xb9d3c2,"الغرفة الأمامية":0xc8d8a8,"الغرفة الخلفية":0xc9bfe0,"الممر والاستقبال":0xefe0c2,"الصحيات الأمامية":0x9fc9de,"الصحيات الخلفية":0x9fc9de,"مدخل خلفي":0xe8d6b8};

function box(g,x0,x1,y0,y1,z0,z1,m,sh=true){const me=new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1-x0),Math.abs(z1-z0),Math.abs(y1-y0)),m);
  me.position.copy(P((x0+x1)/2,(y0+y1)/2,(z0+z1)/2));me.castShadow=sh;me.receiveShadow=true;g.add(me);return me;}
function beam(g,a,b,w,h,m){const pa=P(...a),pb=P(...b),len=pa.distanceTo(pb);const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,len),m);
  me.position.copy(pa.clone().add(pb).multiplyScalar(.5));me.lookAt(pb);me.castShadow=true;me.receiveShadow=true;g.add(me);return me;}
function slabPoly(g,pts,z0,z1,m,sh=true){const s=new THREE.Shape(pts.map(p=>new THREE.Vector2(p[0],p[1])));
  const geo=new THREE.ExtrudeGeometry(s,{depth:z1-z0,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,z0,0);
  const me=new THREE.Mesh(geo,m);me.castShadow=sh;me.receiveShadow=true;g.add(me);return me;}
// قطعة جدار مائلة: من u0 إلى u1 على امتداد الجدار، بين منسوبين
function piece(g,w,u0,u1,z0,z1,th,m,off=0){if(u1-u0<0.005||z1-z0<0.005)return;
  const ax=w.a[0],ay=w.a[1],dx=w.b[0]-ax,dy=w.b[1]-ay,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,um=(u0+u1)/2;
  const me=new THREE.Mesh(new THREE.BoxGeometry(u1-u0,z1-z0,th),m);
  me.position.copy(P(ax+ux*um-uy*off,ay+uy*um+ux*off,(z0+z1)/2));me.rotation.y=Math.atan2(uy,ux);
  me.castShadow=true;me.receiveShadow=true;g.add(me);return me;}
const wlen=w=>Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);

/* ---------- الأرض والرصيف والدكة ---------- */
const groundMat=M(0xb59a74,{transparent:true,opacity:1});
groundMat.map=tex((c,w,h)=>{c.fillStyle="#b39874";c.fillRect(0,0,w,h);for(let i=0;i<2400;i++){c.fillStyle=`rgba(${80+Math.random()*60|0},${60+Math.random()*40|0},35,.22)`;c.fillRect(Math.random()*w,Math.random()*h,2,2);}},256,256,40,40);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(220,220),groundMat);ground.rotation.x=-Math.PI/2;ground.position.copy(P(CX,CY,-0.002));ground.receiveShadow=true;L.base.add(ground);
const paveMat=M(0xd6ccba);paveMat.map=tiles("#d6ccba","rgba(110,95,70,.3)",4);paveMat.map.repeat.set(1,1);
slabPoly(L.base,DATA.pave,0,0.12,paveMat,false);
slabPoly(L.base,DATA.foot,0.12,FFL-0.02,mat.plinth,false);

/* ---------- الأرضيات ---------- */
DATA.spaces.forEach(s=>{slabPoly(L.floor,s.poly,FFL-0.03,FFL,mat[s.f],false);
  slabPoly(L.zone,s.poly,FFL-0.025,FFL+0.004,M(ZCOL[s.n]||0xdddddd,{roughness:.6}),false);});

/* ---------- الجدران والفتحات ---------- */
DATA.walls.forEach(w=>{
  const len=wlen(w), ext=w.t/2, isExt=w.kind==="ext";
  const m=isExt?mat.wallOut:(w.kind==="part"?mat.part:mat.wallIn);
  const zTop=w.kind==="part"&&w.t<0.2?FFL+2.1:TOP; // قواطع المرافق بارتفاع 2.10
  const ops=w.ops.slice().sort((p,q)=>p.c-q.c);let s=-ext;
  ops.forEach(o=>{const u0=o.c-o.w/2,u1=o.c+o.w/2;piece(L.walls,w,s,u0,FFL,zTop,w.t,m);
    piece(L.walls,w,u0,u1,FFL,FFL+o.s,w.t,m); piece(L.walls,w,u0,u1,FFL+o.h,zTop,w.t,m); s=u1; opening(w,o);});
  piece(L.walls,w,s,len+ext,FFL,zTop,w.t,m);
  if(isExt){ // الستارة فوق السقف
    piece(L.roof,w,-ext,len+ext,ROOF,ROOF+0.25,w.t,mat.par); piece(L.roof,w,-ext,len+ext,ROOF+0.25,ROOF+PAR,w.t,mat.par);
    piece(L.roof,w,-ext-0.03,len+ext+0.03,ROOF+PAR,ROOF+PAR+0.04,w.t+0.06,mat.conc);}
});
function opening(w,o){
  const g=L.open,t=w.t,u0=o.c-o.w/2,u1=o.c+o.w/2,z0=FFL+o.s,z1=FFL+o.h,f=0.06;
  if(o.k.startsWith("d")){
    const leaf=o.k==="dIn"?mat.wood:mat.steel;
    piece(g,w,u0,u0+f,z0,z1,t+0.02,mat.frame);piece(g,w,u1-f,u1,z0,z1,t+0.02,mat.frame);piece(g,w,u0,u1,z1-f,z1,t+0.02,mat.frame);
    if(o.k==="dExt2"){piece(g,w,u0+f,o.c-0.005,z0,z1-f,0.05,leaf);piece(g,w,o.c+0.005,u1-f,z0,z1-f,0.05,leaf);}
    else piece(g,w,u0+f,u1-f,z0,z1-f,0.05,leaf);
    return;}
  if(o.k==="vent"){piece(g,w,u0,u1,z0,z1,t+0.02,mat.vent);return;}
  const fm=o.k==="wPvc"?mat.pvc:mat.frame;
  piece(g,w,u0,u1,z0+f,z1-f,0.02,mat.glass);
  [[u0,u0+f],[u1-f,u1],[o.c-0.025,o.c+0.025]].forEach(([a,b])=>piece(g,w,a,b,z0,z1,0.1,fm));
  piece(g,w,u0,u1,z0,z0+f,0.1,fm);piece(g,w,u0,u1,z1-f,z1,0.1,fm);
  // حماية خارجية (مشبك)
  const out=w.kind==="ext"?1:0;
  if(out){for(let i=1;i<6;i++){const u=u0+(u1-u0)*i/6;pieceOff(g,w,u-0.008,u+0.008,z0,z1,0.016,mat.grill);}
    [0.33,0.66].forEach(k=>{const z=z0+(z1-z0)*k;pieceOff(g,w,u0,u1,z-0.008,z+0.008,0.016,mat.grill);});}
}
// الوجه الخارجي يحدده اتجاه الجدار نسبةً لمركز البناية
function pieceOff(g,w,u0,u1,z0,z1,th,m){const dx=w.b[0]-w.a[0],dy=w.b[1]-w.a[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
  const mx=(w.a[0]+w.b[0])/2,my=(w.a[1]+w.b[1])/2;const sgn=((mx+nx-CX)**2+(my+ny-CY)**2)>((mx-nx-CX)**2+(my-ny-CY)**2)?1:-1;
  return piece(g,w,u0,u1,z0,z1,th,m,sgn*(w.t/2+0.04));}
// العتبات والرباط فوق الفتحات (ظاهر ضمن الجدار)
/* ---------- السقف ---------- */
slabPoly(L.roof,DATA.foot,TOP,ROOF-0.02,mat.slab);
slabPoly(L.roof,DATA.foot,ROOF-0.02,ROOF,mat.roofTile,false);

/* ---------- الأسس (شريطية 80×50 سم تحت كل الجدران + جدار طابوق متدرج + رباط) ---------- */
DATA.walls.filter(w=>w.kind!=="part").forEach(w=>{const len=wlen(w),e=w.t/2;
  piece(L.fdn,w,-0.4,len+0.4,-1.05,-0.95,1.0,mat.conc);       // خرسانة نظافة
  piece(L.fdn,w,-0.4,len+0.4,-0.95,-0.45,0.8,mat.fdn);        // الأساس الشريطي
  piece(L.fdn,w,-e,len+e,-0.45,-0.28,0.48,mat.brick);piece(L.fdn,w,-e,len+e,-0.28,-0.11,0.36,mat.brick);piece(L.fdn,w,-e,len+e,-0.11,0.15,0.24,mat.brick);
  piece(L.fdn,w,-e,len+e,0.15,FFL,0.24,mat.conc);              // رباط تحت الجدران
});

/* ---------- الماء: خزان ومضخة ومظلة ---------- */
const T=SITE.tank,Pm=SITE.pump;
box(L.water,T.x0,T.x1,T.y0,T.y1,0,0.2,mat.conc);
[[T.x0,T.x0+0.24,T.y0,T.y1],[T.x1-0.24,T.x1,T.y0,T.y1],[T.x0,T.x1,T.y0,T.y0+0.24],[T.x0,T.x1,T.y1-0.24,T.y1]].forEach(r=>box(L.water,r[0],r[1],r[2],r[3],0.2,1.7,mat.wallOut));
box(L.water,T.x0,T.x1,T.y0,T.y1,1.7,1.9,mat.conc);
const tk=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.6,1.25,28),mat.tank);tk.position.copy(P((T.x0+T.x1)/2,(T.y0+T.y1)/2,1.9+0.63));tk.castShadow=true;L.water.add(tk);
box(L.water,Pm.x0,Pm.x1,Pm.y0,Pm.y1,0,0.25,mat.conc);
box(L.water,18.2,18.9,12.35,12.85,0.25,0.62,mat.pump);
[[Pm.x0+0.1,Pm.y0+0.1],[Pm.x1-0.1,Pm.y0+0.1],[Pm.x0+0.1,Pm.y1-0.1],[Pm.x1-0.1,Pm.y1-0.1]].forEach(([x,y])=>box(L.water,x-0.05,x+0.05,y-0.05,y+0.05,0.25,2.45,mat.steel));
// مظلة كي سبان مقوّسة فوق المضخة (2.5×2 م)
(function(){const n=10,R=1.6,y0=Pm.y0+0.1,y1=Pm.y1-0.1,xm=(Pm.x0+Pm.x1)/2,half=(Pm.x1-Pm.x0)/2,zc=2.45-Math.sqrt(R*R-half*half);
  for(let i=0;i<n;i++){const a0=-half+2*half*i/n,a1=-half+2*half*(i+1)/n,z0=zc+Math.sqrt(R*R-a0*a0),z1=zc+Math.sqrt(R*R-a1*a1);
    const p0=P(xm+a0,(y0+y1)/2,z0),p1=P(xm+a1,(y0+y1)/2,z1),len=p0.distanceTo(p1);
    const me=new THREE.Mesh(new THREE.BoxGeometry(len+0.01,0.02,y1-y0+0.3),mat.kspan);me.position.copy(p0.clone().add(p1).multiplyScalar(.5));
    me.rotation.z=Math.atan2(p1.y-p0.y,p1.x-p0.x);me.castShadow=true;L.water.add(me);}})();
// أنابيب الماء 2″ من المضخة إلى الخزان ثم إلى كتلتي الصحيات (فوق الأرض، مسارات توضيحية)
const wp=(pts)=>{for(let i=0;i<pts.length-1;i++)beam(L.water,pts[i],pts[i+1],0.07,0.07,mat.pipeW);};
wp([[18.55,12.6,0.45],[18.55,15.6,0.45],[18.55,15.6,2.6]]);
wp([[17.6,17.0,2.2],[15.6,17.0,2.2],[15.6,17.0,ROOF+0.3],[8.9,17.0,ROOF+0.3],[8.9,17.0,TOP-0.3],[8.0,17.0,TOP-0.3]]);
wp([[15.6,17.0,ROOF+0.3],[15.6,4.0,ROOF+0.3],[8.9,4.0,ROOF+0.3],[8.9,4.0,TOP-0.3],[8.0,4.0,TOP-0.3]]);

/* ---------- المجاري: بالوعات أرضية وأنابيب 4″ تحت الأرض ---------- */
const FD=[[8.2,19.0],[9.4,19.0],[8.2,16.6],[9.4,16.6],[8.2,2.5],[9.4,2.5],[8.2,0.9],[9.4,0.9],[5.6,11.0],[9.7,11.0],[3.4,7.2],[5.3,20.6]];
FD.forEach(([x,y])=>{const d=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.012,16),mat.drainCap);d.position.copy(P(x,y,FFL+0.006));L.drain.add(d);});
const dp=(pts)=>{for(let i=0;i<pts.length-1;i++)beam(L.drain,pts[i],pts[i+1],0.11,0.11,mat.pipeD);};
dp([[8.8,19.0,-0.3],[8.8,16.6,-0.3],[8.8,14.0,-0.4],[17.0,14.0,-0.6]]);
dp([[8.8,0.9,-0.3],[8.8,2.5,-0.3],[8.8,5.0,-0.4],[17.0,5.0,-0.6],[17.0,14.0,-0.6],[17.0,21.5,-0.7]]);
[[8.8,14.0],[17.0,14.0],[8.8,5.0],[17.0,5.0]].forEach(([x,y])=>box(L.drain,x-0.2,x+0.2,y-0.2,y+0.2,y>15?0.12:-0.55,FFL-0.3>0?0.13:0.13,mat.conc,false));

/* ---------- التسميات ---------- */
const LBL=[];
function addLabel(html,pos,cls=""){const el=document.createElement("div");el.className="lb "+cls;el.innerHTML=html;document.getElementById("labels").appendChild(el);LBL.push({el,pos});}
DATA.spaces.forEach(s=>addLabel(`${s.n}<small>${s.a} م²</small>`,P(s.c[0],s.c[1],FFL+1.2),s.a<6?"sm":""));
addLabel("الخزان",P((T.x0+T.x1)/2,(T.y0+T.y1)/2,3.6),"sm");addLabel("المضخة والمظلة",P((Pm.x0+Pm.x1)/2,(Pm.y0+Pm.y1)/2,3.3),"sm");
addLabel("المدخل الرئيسي",P(5.83,22.4,1.2),"sm");

/* ================= المخطط ثنائي الأبعاد ================= */
function drawPlan(){
  const s=24,ox=80,oy=30,X=x=>ox+x*s,Y=y=>oy+(23.5-y)*s;
  const ink="#3b3026",mut="#7a6b5a",acc="#ef9c3d";
  let o=`<svg viewBox="0 0 700 640" xmlns="http://www.w3.org/2000/svg" font-family="Almarai, sans-serif">`;
  const poly=(pts,f,st="none",sw=0)=>`<polygon points="${pts.map(p=>X(p[0])+","+Y(p[1])).join(" ")}" fill="${f}" stroke="${st}" stroke-width="${sw}"/>`;
  o+=poly(DATA.pave,"#e7dfd0","#c9bba3",1);
  DATA.spaces.forEach(sp=>o+=poly(sp.poly,st.zone?"#"+(ZCOL[sp.n]||0xdddddd).toString(16).padStart(6,"0"):(sp.f==="ceramic"?"#dfe8ea":"#f3ede2")));
  DATA.walls.forEach(w=>{const dx=w.b[0]-w.a[0],dy=w.b[1]-w.a[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,e=w.t/2;
    const seg=(u0,u1,c)=>{const p=[[w.a[0]+ux*u0-uy*e,w.a[1]+uy*u0+ux*e],[w.a[0]+ux*u1-uy*e,w.a[1]+uy*u1+ux*e],[w.a[0]+ux*u1+uy*e,w.a[1]+uy*u1-ux*e],[w.a[0]+ux*u0+uy*e,w.a[1]+uy*u0-ux*e]];o+=poly(p,c);};
    let a=-e;w.ops.slice().sort((p,q)=>p.c-q.c).forEach(op=>{const u0=op.c-op.w/2,u1=op.c+op.w/2;seg(a,u0,ink);
      if(op.k.startsWith("w")||op.k==="vent")seg(u0,u1,op.k==="vent"?"#9aa1a4":"#6aa8bd");a=u1;});seg(a,len+e,w.kind==="part"?"#8c7f6e":ink);});
  DATA.spaces.forEach(sp=>o+=`<text x="${X(sp.c[0])}" y="${Y(sp.c[1])-6}" font-size="${sp.a<12?9:12}" fill="${ink}" font-weight="700" text-anchor="middle">${sp.n}</text><text x="${X(sp.c[0])}" y="${Y(sp.c[1])+9}" font-size="${sp.a<12?8:10}" fill="${mut}" text-anchor="middle">${sp.a} م²</text>`);
  o+=`<rect x="${X(SITE.tank.x0)}" y="${Y(SITE.tank.y1)}" width="${2*s}" height="${4*s}" fill="#cfd6db" stroke="${ink}"/><text x="${X(18.6)}" y="${Y(17.6)}" font-size="9" text-anchor="middle" fill="${ink}">خزان</text>`;
  o+=`<rect x="${X(SITE.pump.x0)}" y="${Y(SITE.pump.y1)}" width="${2.5*s}" height="${2*s}" fill="#d9e6dc" stroke="${ink}" stroke-dasharray="4 3"/><text x="${X(18.6)}" y="${Y(12.6)}" font-size="9" text-anchor="middle" fill="${ink}">مضخة</text>`;
  const dimH=(x0,x1,y,t)=>`<line x1="${X(x0)}" y1="${Y(y)}" x2="${X(x1)}" y2="${Y(y)}" stroke="${acc}" stroke-width="1.2"/><text x="${X((x0+x1)/2)}" y="${Y(y)-5}" font-size="11" fill="${ink}" text-anchor="middle">${t}</text>`;
  o+=dimH(B[0],B[2],-1.4,(B[2]-B[0]).toFixed(2)+" م");
  o+=`<line x1="${X(-1.6)}" y1="${Y(B[1])}" x2="${X(-1.6)}" y2="${Y(B[3])}" stroke="${acc}" stroke-width="1.2"/><text x="${X(-2.1)}" y="${Y(CY)}" font-size="11" fill="${ink}" text-anchor="middle" transform="rotate(-90 ${X(-2.1)} ${Y(CY)})">${(B[3]-B[1]).toFixed(2)} م</text>`;
  o+=`<text x="${X(CX+2)}" y="${Y(-2.6)}" font-size="11" fill="${mut}" text-anchor="middle">مخطط الطابق الأرضي · الأبعاد مستخرجة من صورة المخطط بمقياس مضبوط على كميات الجدول</text></svg>`;
  document.getElementById("plan").innerHTML=o;
}

/* ================= العارض الموحّد ================= */
const st={roof:true,walls:true,fdn:false,drain:false,water:true,zone:false,lbl:true,plan:false};
const planEl=document.getElementById("plan");
function apply(){
  L.roof.visible=st.roof;L.walls.visible=st.walls;L.open.visible=st.walls;L.fdn.visible=st.fdn;L.drain.visible=st.drain;L.water.visible=st.water;
  L.zone.visible=st.zone;L.floor.visible=!st.zone;
  const see=st.fdn||st.drain;groundMat.transparent=see;groundMat.opacity=see?0.3:1;groundMat.depthWrite=!see;
  paveMat.transparent=see;paveMat.opacity=see?0.35:1;mat.plinth.transparent=see;mat.plinth.opacity=see?0.4:1;
    if(planEl){planEl.hidden=!st.plan;if(st.plan)drawPlan();}
}
const VIEWS={over:{pos:[CX+24,CY-22,22],tgt:[CX,CY,1.5]},top:{pos:[CX+1.5,CY-0.01,52],tgt:[CX+1.5,CY,0]},front:{pos:[CX,CY+34,3.2],tgt:[CX,CY,2.2]}};
function setView(v){if(st.plan){st.plan=false;apply();}const c=VIEWS[v];camera.position.copy(P(...c.pos));controls.target.copy(P(...c.tgt));controls.update();}
function inside(px,py,tx,ty){if(st.plan){st.plan=false;apply();}camera.position.copy(P(px,py,FFL+1.6));controls.target.copy(P(tx,ty,FFL+1.3));controls.update();}
function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
if(window.ResizeObserver)new ResizeObserver(resize).observe(host);window.addEventListener("resize",resize);
const v3=new THREE.Vector3();
function loop(){requestAnimationFrame(loop);controls.update();renderer.render(scene,camera);
  const showL=st.lbl&&!st.plan&&(!st.roof||camera.position.y>16);document.getElementById("labels").hidden=!showL;
  if(showL){const r=host.getBoundingClientRect();LBL.forEach(l=>{v3.copy(l.pos).project(camera);
    const vis=v3.z<1&&Math.abs(v3.x)<1.1&&Math.abs(v3.y)<1.1;l.el.style.display=vis?"":"none";
    l.el.style.left=((v3.x+1)/2*r.width)+"px";l.el.style.top=((1-v3.y)/2*r.height)+"px";});}}
setView("over");apply();resize();loop();

const flag=k=>({get:()=>st[k],set:v=>{st[k]=v;apply();}});
const SP=Object.fromEntries(DATA.spaces.map(s=>[s.n,s]));
function boot(){if(!window.BAQV){setTimeout(boot,100);return;}
BAQV.register({
  layers:{arch:{get:()=>st.walls,set:v=>{st.walls=v;apply();}},struct:flag("fdn"),drain:flag("drain"),water:flag("water")},
  legends:{
    arch:[["#efe6d6","جدران طابوق 24 سم ملبّخة ومصبوغة"],["#e9e1d2","أرضيات مرمر"],["#dfe6e8","سيراميك الصحيات"],["#5f6a70","أبواب وشبابيك حديد"],["#8a5a33","أبواب خشب داخلية"]],
    struct:[["#a59d8e","أساس شريطي 80×50 سم"],["#b07a5a","جدار طابوق متدرج 48/36/24 سم"],["#bdb6a8","خرسانة نظافة ورباط"]],
    drain:[["#8b5a2b","أنابيب صرف 4″ تحت الأرض"],["#9aa1a4","بالوعات أرضية (12)"]],
    water:[["#2c3e66","خزان 1 م³"],["#2f7d4f","مضخة نصف حصان"],["#2f8fd0","أنابيب ماء 2″"]]
  },
  options:[
    {id:"roof",label:"السقف والستارة",get:()=>st.roof,set:v=>{st.roof=v;apply();}},
    {id:"zones",label:"ألوان الفضاءات",get:()=>st.zone,set:v=>{st.zone=v;apply();}},
    {id:"labels",label:"أسماء الفضاءات",get:()=>st.lbl,set:v=>{st.lbl=v;apply();}},
    {id:"plan",label:"المخطط ثنائي الأبعاد",get:()=>st.plan,set:v=>{st.plan=v;apply();}}
  ],
  views:{over:()=>setView("over"),top:()=>setView("top"),front:()=>setView("front")},
  insides:[
    {label:"الممر والاستقبال",go:()=>{inside(6.0,20.2,6.6,9.0);}},
    {label:"القاعة الأمامية",go:()=>{inside(14.2,19.0,10.6,11.8);}},
    {label:"القاعة الخلفية",go:()=>{inside(14.2,1.2,10.6,9.4);}},
    {label:"الغرفة الخلفية",go:()=>{inside(7.0,1.4,2.2,7.6);}}
  ],
  info:{
    facts:[["نوع البناية","طابق أرضي واحد بسقف خرساني"],["الموقع","البصرة"],["الأبعاد الكلية","15.13 × 21.44 م"],["مساحة السقف","265 م²"],["المساحة الصافية للفضاءات",DATA.spaces.reduce((a,s)=>a+s.a,0).toFixed(1)+" م²"],["ارتفاع الطابق","3.10 م (صافٍ قبل الثانوي)"],["منسوب الأرضية","+0.45 م"],["الستارة","0.95 م فوق السقف"]],
    spaceCols:[["n","الفضاء"],["a","م²"],["f","الأرضية"]],
    spaces:DATA.spaces.map(s=>({n:s.n,a:s.a,f:s.f==="ceramic"?"سيراميك":"مرمر"})),
    counts:[["أبواب حديد خارجية","3"],["أبواب خشب داخلية","8 ظاهرة في المخطط"],["شبابيك حديد رئيسية","8"],["شبابيك بي في سي","4"],["ساحبات هواء 10″","5"],["مراحيض شرقية","4"],["مغاسل جدارية","5"],["بالوعات أرضية","12"],["خزان ماء 1 م³ ومضخة","1"]],
    about:["النموذج مبني من صورة المخطط المرفقة بجدول الكميات، ومقياسه مضبوط على مساحة السقف (265 م²) وسُمك الجدار (24 سم) الواردين في الجدول.","أسماء الفضاءات عامة لأن الملف لا يحدد استعمال كل غرفة.","مواقع الشبابيك والأبواب الخارجية والخزان والمضخة ومسارات الأنابيب توضيحية، وتُعتمد في المخططات التنفيذية."]
  }
});
setTimeout(()=>BAQV.ready(),400);}
boot();
})();
