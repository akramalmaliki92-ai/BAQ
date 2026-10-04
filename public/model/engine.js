/* ===== BAQ MODEL ENGINE v1 — generic; needs PROJECT, GROUND, UPPER, DEF, STRUCT, CHANGES, makeProposal, ... from project.js ===== */
const clone = o => JSON.parse(JSON.stringify(o));
function migrate(o){
  if(o && o.floors && o.floors.length>=5){ if(!o.floors[0].doors) o.floors[0].doors=clone(DEF.floors[0].doors); if(o.floorsP && !o.floorsP[0].doors) o.floorsP[0].doors=clone(DEF.floorsP[0].doors); if(!o.notes) o.notes=clone(DEF.notes); if(!o.floorsP) o.floorsP=makeProposal(clone(o.floors)); if(!o.variant) o.variant="p"; return o; }
  return null;
}
DEF.floorsP = makeProposal(clone(DEF.floors));
let S = clone(DEF);
try{ const s = localStorage.getItem(PROJECT.storageKey); if(s){ const o = migrate(JSON.parse(s)); if(o) S = o; } }catch(e){}
function persist(){ try{ localStorage.setItem(PROJECT.storageKey, JSON.stringify(S)); }catch(e){} }
let sel = null, tab = "gen", mode = "3d";
const FL = () => S.variant==="p" ? S.floorsP : S.floors;
const F = () => FL()[S.cur];
const elev = i => FL().slice(0,i).reduce((a,f)=>a+(+f.H||0),0);

function parseOps(str, H){
  const out=[];
  String(str||"").split(/[,،]/).forEach(p=>{
    p=p.trim(); if(!p) return;
    const m = p.match(/^([\d.]+)\s*-\s*([\d.]+)(?:\s*@\s*([\d.]+)(?:\s*:\s*([\d.]+))?)?$/);
    if(!m) return;
    let a=+m[1], b=+m[2], z0=0, z1=S.D;
    if(m[3]!==undefined && m[4]!==undefined){ z0=+m[3]; z1=+m[4]; }
    else if(m[3]!==undefined){ z1=+m[3]; }
    if(b>a) out.push([a,b,z0,Math.min(z1,H)]);
  });
  return out.sort((x,y)=>x[0]-y[0]);
}
function wallPieces(w, H){
  const L = Math.hypot(w.b[0]-w.a[0], w.b[1]-w.a[1]);
  const ops = parseOps(w.o, H).filter(o=>o[0]>=0 && o[1]<=L);
  const pieces=[]; let s=0;
  ops.forEach(([a,b,z0,z1])=>{
    if(a>s) pieces.push([s,a,0,H]);
    if(z1<H) pieces.push([a,b,z1,H]);
    if(z0>0) pieces.push([a,b,0,Math.min(z0,H)]);
    s=Math.max(s,b);
  });
  if(L>s) pieces.push([s,L,0,H]);
  return {L, ops, pieces};
}

/* ---------- 3D ---------- */
const host = document.getElementById("three");
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40,1,0.1,500);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI/2 - 0.02;
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f86, 0.75));
const sun = new THREE.DirectionalLight(0xffffff, 0.75);
sun.position.set(40,60,35); sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:180});
sun.target.position.set(12.5,0,-15); scene.add(sun); scene.add(sun.target);
const root = new THREE.Group(); scene.add(root);
const P = (x,y,z=0) => new THREE.Vector3(x, z, -y);
let labelEls = [];

function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function applySceneBg(){ scene.background = new THREE.Color(cssVar("--scene") || "#e6ebe9"); }
const matCache = {};
function mat(hex, extra){ const k = hex+(extra?JSON.stringify(extra):""); if(!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial(Object.assign({color:hex, roughness:.9, metalness:0}, extra||{})); return matCache[k]; }
function addBox(x0,y0,z0,x1,y1,z1,color){
  const g = new THREE.BoxGeometry(Math.abs(x1-x0), Math.abs(z1-z0), Math.abs(y1-y0));
  const m = new THREE.Mesh(g, mat(color));
  m.position.copy(P((x0+x1)/2,(y0+y1)/2,(z0+z1)/2));
  m.castShadow = m.receiveShadow = true; root.add(m); return m;
}
const G = 0.28;
function flight(O,d,w,W,n,zbN,top,R,e,color){
  const zb = zbN*R, pts=[[0,zb],[0,zb+R]];
  for(let i=1;i<n;i++){ pts.push([i*G,zb+i*R],[i*G,zb+(i+1)*R]); }
  const se=(n-1)*G+(top?G:0), zt=zb+n*R, soff=.25;
  if(top) pts.push([se,zt]);
  pts.push([se,zt-soff]);
  pts.push([Math.max(.05, se-(zt-soff-zb)/(R/G)), zb]);
  const shape = new THREE.Shape(pts.map(p=>new THREE.Vector2(p[0],p[1])));
  const geo = new THREE.ExtrudeGeometry(shape,{depth:W,bevelEnabled:false});
  const m = new THREE.Mesh(geo, mat(color,{side:THREE.DoubleSide}));
  const M4 = new THREE.Matrix4().makeBasis(new THREE.Vector3(d[0],0,-d[1]), new THREE.Vector3(0,1,0), new THREE.Vector3(w[0],0,-w[1]));
  M4.setPosition(O[0],e,-O[1]);
  m.matrixAutoUpdate=false; m.matrix.copy(M4); m.castShadow=m.receiveShadow=true; root.add(m);
}
/* [origin, direction, width-direction, width, risers, start (in risers), top tread] */
function planterPts(p,n=24){ const [cx,cy,rx,ry,a0,a1]=p; const pts=[[cx,cy]]; for(let i=0;i<=n;i++){ const a=(a0+(a1-a0)*i/n)*Math.PI/180; pts.push([cx+rx*Math.cos(a), cy+ry*Math.sin(a)]); } return pts; }


/* doors: gate = sectional steel gate, single = steel door with vision glass, louver = double louvred door (ventilation) */
function doorLeaf(w,h,col,k){
  const g=new THREE.Group(), t=.05;
  const leaf=new THREE.Mesh(new THREE.BoxGeometry(w,h,t), mat(col)); leaf.position.set(w/2,h/2,0); leaf.castShadow=true; g.add(leaf);
  if(k==="single"){
    const gl=new THREE.Mesh(new THREE.BoxGeometry(w*.42,h*.38,t+.01), mat("#9cc3d5",{transparent:true,opacity:.55})); gl.position.set(w/2,h*.68,0); g.add(gl);
    const hd=new THREE.Mesh(new THREE.BoxGeometry(.03,.25,.08), mat("#c9c9c4")); hd.position.set(w-.1,1.05,0); g.add(hd);
  }
  if(k==="louver"){
    [[.15,.85],[h-.9,h-.15]].forEach(([z0,z1])=>{ for(let z=z0;z<z1;z+=.1){ const s=new THREE.Mesh(new THREE.BoxGeometry(w-.16,.03,t+.04), mat("#4b5257")); s.position.set(w/2,z,0); s.rotation.x=.5; g.add(s);} });
    const hd=new THREE.Mesh(new THREE.BoxGeometry(.03,.25,.08), mat("#c9c9c4")); hd.position.set(w-.08,1.05,0); g.add(hd);
  }
  return g;
}
function buildDoors(Fl,e){
  (Fl.doors||[]).forEach(d=>{
    const w=d.x1-d.x0, open=S.doorsOpen;
    if(d.k==="gate"){
      const g=new THREE.Group(), t=.06, col="#4d565c";
      const p=new THREE.Mesh(new THREE.BoxGeometry(w,d.h,t), mat(col)); p.position.set(w/2,d.h/2,0); p.castShadow=true; g.add(p);
      for(let z=.45; z<d.h; z+=.48){ const s=new THREE.Mesh(new THREE.BoxGeometry(w-.04,.03,t+.03), mat("#2f3539")); s.position.set(w/2,z,0); g.add(s); }
      if(open){ g.rotation.x=-Math.PI/2; g.position.copy(P(d.x0,d.y+.1,e+d.h)); }
      else g.position.copy(P(d.x0,d.y,e));
      g.traverse(m=>m.userData.door=d.n); root.add(g); return;
    }
    if(d.k==="single"){
      const lf=doorLeaf(w-.02,d.h-.02,"#3f3a35","single");
      lf.position.copy(P(d.x0+.01,d.y,e)); if(open) lf.rotation.y=Math.PI/2*.9; root.add(lf); return;
    }
    if(d.k==="louver"){
      const hw=(w-.03)/2;
      const a=doorLeaf(hw,d.h-.02,"#6b7378","louver"); a.position.copy(P(d.x0+.01,d.y,e)); if(open) a.rotation.y=-Math.PI/2*.9; root.add(a);
      const b=doorLeaf(hw,d.h-.02,"#6b7378","louver"); b.position.copy(P(d.x1-.01,d.y,e)); b.rotation.y=Math.PI; if(open) b.rotation.y=Math.PI+Math.PI/2*.9; root.add(b);
    }
  });
}

/* ---------- structural layer (preliminary) ---------- */
const inb=(x,y,b)=>x>=b[0]-1e-6&&x<=b[2]+1e-6&&y>=b[1]-1e-6&&y<=b[3]+1e-6;
function storeyCols(fi){ return Object.entries(STRUCT.cols).filter(([n,c])=> fi<4 || c[2]).map(([n,c])=>({n,x:c[0],y:c[1],s:c[3][Math.min(fi,c[3].length-1)]/1000})); }
const MEPSYS={ac:["ac"],water:["water","hot","ro"],drain:["drain"],elec:["elec","light"]};
function mepOn(sys){ return S.variant==="p" && !S.structView && S.mep && S.mep[sys]; }
function buildMep(fi,e){
  const fl=MEP[fi]; if(!fl) return;
  Object.entries(MEPSYS).forEach(([sys,keys])=>{ if(!mepOn(sys)) return;
    keys.forEach(k=>(fl[k]||[]).forEach(it=>{
      if(it.t==="b"){ const r=it.r, m=addBox(r[0],r[1],e+r[2],r[3],r[4],e+r[5],it.c); m.castShadow=false; }
      else { const d=it.d||.05; for(let i=0;i<it.p.length-1;i++){ const a=it.p[i], b=it.p[i+1];
        const x0=Math.min(a[0],b[0])-d/2, x1=Math.max(a[0],b[0])+d/2, y0=Math.min(a[1],b[1])-d/2, y1=Math.max(a[1],b[1])+d/2, z0=Math.min(a[2],b[2])-d/2, z1=Math.max(a[2],b[2])+d/2;
        const m=addBox(x0,y0,e+z0,x1,y1,e+z1,it.c); m.castShadow=false; } }
    })); });
}
function mepPlanSvg(fi,X,Y){
  const fl=MEP[fi]; if(!fl) return ""; let s="";
  Object.entries(MEPSYS).forEach(([sys,keys])=>{ if(!mepOn(sys)) return;
    keys.forEach(k=>(fl[k]||[]).forEach(it=>{
      if(it.t==="b"){ const r=it.r; if(k==="light"){ s+=`<circle cx="${X((r[0]+r[3])/2)}" cy="${Y((r[1]+r[4])/2)}" r=".14" fill="${it.c}" stroke="#a88a00" stroke-width=".03"/>`; return; }
        s+=`<rect x="${X(Math.min(r[0],r[3]))}" y="${Y(Math.max(r[1],r[4]))}" width="${X(Math.abs(r[3]-r[0]))}" height="${X(Math.abs(r[4]-r[1]))}" fill="${it.c}" stroke="#333" stroke-width=".02"/>`;
        if(it.n) s+=`<text x="${X((r[0]+r[3])/2)}" y="${Y(Math.max(r[1],r[4]))-0.08}" font-size=".26" text-anchor="middle" fill="#333" font-family="IBM Plex Sans Arabic, sans-serif">${esc(it.n)}</text>`; }
      else s+=`<polyline points="${it.p.map(p=>X(p[0])+","+Y(p[1])).join(" ")}" fill="none" stroke="${it.c}" stroke-width="${Math.max(.06,(it.d||.05)*1.4)}" stroke-linejoin="round" ${k==="hot"?'stroke-dasharray=".25 .12"':""}/>`;
    })); });
  return s;
}
const MAT_CONC="#a3abb0", MAT_CRIT="#d9822b";
function buildStructFloor(fi,e,H){
  const conc=mat(MAT_CONC), crit=mat(MAT_CRIT), slabM=mat("#c9d2d6",{transparent:true,opacity:.28,depthWrite:false});
  if(fi===0){ const r=addBox(0,0,-STRUCT.fnd.raft_h/1000,S.site.w,S.site.d,0,"#7d8589"); }
  storeyCols(fi).forEach(c=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(c.s,H,c.s),conc); m.position.copy(P(c.x,c.y,e+H/2)); m.castShadow=true; root.add(m); });
  SCORES.forEach(b=>{ const t=.3;
    [[b[0],b[1],b[2],b[1]+t],[b[0],b[3]-t,b[2],b[3]],[b[0],b[1],b[0]+t,b[3]],[b[2]-t,b[1],b[2],b[3]]].forEach(r=>addBox(r[0],r[1],e,r[2],r[3],e+H,"#8c959a")); });
  const L=fi+1;
  if(L<=5){
    const top=e+H;
    levelBeams(L).forEach(bm=>{
      const len=Math.hypot(bm.x1-bm.x0,bm.y1-bm.y0), along=bm.y0===bm.y1;
      const g=new THREE.BoxGeometry(along?len:bm.b, bm.h, along?bm.b:len);
      const m=new THREE.Mesh(g, bm.kind==="b"?conc:crit); m.position.copy(P((bm.x0+bm.x1)/2,(bm.y0+bm.y1)/2,top-bm.h/2)); m.castShadow=true; root.add(m);
    });
    // slab of level L (transparent)
    const t = L===4?.2:.15;
    const y0 = (L===1||L===2)?7.39:0;
    if(L<5){
      const sh=new THREE.Shape([new THREE.Vector2(0,y0),new THREE.Vector2(S.site.w,y0),new THREE.Vector2(S.site.w,S.site.d),new THREE.Vector2(0,S.site.d)]);
      HOLES.forEach(h=>sh.holes.push(new THREE.Path([new THREE.Vector2(h[0],h[1]),new THREE.Vector2(h[0],h[3]),new THREE.Vector2(h[2],h[3]),new THREE.Vector2(h[2],h[1])])));
      const geo=new THREE.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false}); geo.rotateX(-Math.PI/2);
      const m=new THREE.Mesh(geo,slabM); m.position.y=top-t; root.add(m);
    } else ROOMS5.forEach(b=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(b[2]-b[0],.15,b[3]-b[1]),slabM); m.position.copy(P((b[0]+b[2])/2,(b[1]+b[3])/2,top-.075)); root.add(m); });
  }
  if(Fl_stairs(fi)){ const R=H/18; FLIGHTS.forEach(f=> flight(...f, R, e, "#b8b2a8")); LANDINGS.forEach(l=> addBox(l[0],l[1],e+R*l[4]-.25,l[2],l[3],e+R*l[4],"#b8b2a8")); }
}
function Fl_stairs(fi){ return FL()[fi].stairs!==false; }
function structLabels(){
  const e=elev(S.cur), H=+F().H, out=[];
  if(S.cur===0) out.push(["لبشة "+(STRUCT.fnd.raft_h/10)+" سم",12.5,2,-.4]);
  const L=S.cur+1;
  if(L===1||L===2) out.push(["كابولي "+STRUCT.cant[String(L)].b/10+"×"+STRUCT.cant[String(L)].h/10,12.5,8.4,H]);
  if(L===3||L===4){ const a=STRUCT.girders[`9.75_${L}`], b=STRUCT.girders[`15.25_${L}`]; out.push(["جسر ناقل "+a.b/10+"×"+a.h/10,9.75,5,H],["جسر ناقل "+b.b/10+"×"+b.h/10,15.25,3,H]); }
  out.push(["نواة خرسانية",12.5,12.5,H*.6],["نواة خرسانية",12.5,27.5,H*.6]);
  return out.map(([t,x,y,z])=>[t,P(x,y,e+z)]);
}
function buildFloor(fi){
  const Fl = FL()[fi], e = elev(fi), H = +Fl.H, C = S.colors, isCur = fi===S.cur;
  if(S.structView){ buildStructFloor(fi,e,H); return; }
  if(isCur) buildMep(fi,e);
  const Hv = (isCur && S.cut) ? Math.min(1.2,H) : H;
  if(fi===0){ addBox(0,0,-.2,S.site.w,S.site.d,0,C.floor); }
  else {
    const y0 = +Fl.slabY0 || 0;
    const sh = new THREE.Shape([new THREE.Vector2(0,y0),new THREE.Vector2(S.site.w,y0),new THREE.Vector2(S.site.w,S.site.d),new THREE.Vector2(0,S.site.d)]);
    HOLES.forEach(h=>sh.holes.push(new THREE.Path([new THREE.Vector2(h[0],h[1]),new THREE.Vector2(h[0],h[3]),new THREE.Vector2(h[2],h[3]),new THREE.Vector2(h[2],h[1])])));
    const geo = new THREE.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:false}); geo.rotateX(-Math.PI/2);
    const m = new THREE.Mesh(geo, mat(C.floor)); m.position.y = e-.2; m.castShadow=m.receiveShadow=true; root.add(m);
  }
  Fl.walls.forEach((w,i)=>{
    if(S.hideExt && w.k==="ext") return;
    const wh = Math.min(+w.h || H, H), {pieces} = wallPieces(w, wh);
    const ang = Math.atan2(w.b[1]-w.a[1], w.b[0]-w.a[0]), ux=Math.cos(ang), uy=Math.sin(ang);
    const selected = isCur && sel===i;
    pieces.forEach(([s0,s1,z0,z1])=>{
      const zz1 = Math.min(z1,Hv); if(z0>=zz1) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(s1-s0, zz1-z0, w.t), selected ? mat(cssVar("--accent")||"#1f6680") : mat(w.k==="ext"?C.ext:C.int));
      const sm=(s0+s1)/2;
      m.position.copy(P(w.a[0]+ux*sm, w.a[1]+uy*sm, e+(z0+zz1)/2));
      m.rotation.y = ang; m.castShadow = m.receiveShadow = true;
      if(isCur) m.userData.wall = i;
      root.add(m);
    });
  });
  const cs = S.colSize/2;
  Fl.cols.forEach(([x,y])=> addBox(x-cs,y-cs,e,x+cs,y+cs,e+Hv,C.col));
  const R = H/18;
  if(Fl.stairs!==false){
    FLIGHTS.forEach(f=> flight(...f, R, e, C.stair));
    LANDINGS.forEach(l=> addBox(l[0],l[1],e+R*l[4]-.25,l[2],l[3],e+R*l[4],C.stair));
  }
  (Fl.boxes||[]).forEach(b=>{ if(b[7]==="booth" && false) return; addBox(b[0],b[1],e+b[2],b[3],b[4],e+b[5],b[6]); });
  (Fl.lines||[]).forEach(l=>{
    const L=Math.hypot(l[2]-l[0],l[3]-l[1]), ang=Math.atan2(l[3]-l[1],l[2]-l[0]);
    const m=new THREE.Mesh(new THREE.BoxGeometry(L,.012,.1), mat("#f6f6f0"));
    m.position.copy(P((l[0]+l[2])/2,(l[1]+l[3])/2,e+.006)); m.rotation.y=ang; m.receiveShadow=true; root.add(m);
  });
  buildDoors(Fl,e);
  if(isCur && S.showZones!==false) (Fl.zones||[]).forEach(z=>z.r.forEach(r=>{ const m=addBox(r[0],r[1],e+.004,r[2],r[3],e+.02,z.c); m.castShadow=false; }));
  if(Fl.garden){
    (Fl.planters||PLANTERS).forEach(p=>{
      const shape = new THREE.Shape(planterPts(p).map(q=>new THREE.Vector2(q[0],q[1])));
      const geo = new THREE.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:false}); geo.rotateX(-Math.PI/2);
      const m = new THREE.Mesh(geo,[mat(C.grass),mat("#9c978f")]); m.position.y=e; m.castShadow=m.receiveShadow=true; root.add(m);
    });
    if(S.showTrees) (Fl.trees||TREES).forEach(([x,y,s])=>{
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(.07*s,.11*s,1.9*s,8), mat("#69502f"));
      tr.position.copy(P(x,y,e+.45+.95*s)); tr.castShadow=true; root.add(tr);
      const cn = new THREE.Mesh(new THREE.SphereGeometry(.9*s,14,10), mat("#4a8040"));
      cn.scale.y=.95; cn.position.copy(P(x,y,e+.45+2.4*s)); cn.castShadow=true; root.add(cn);
    });
  }
}
function disposeTree(o){ o.traverse(c=>{ if(c.geometry) c.geometry.dispose(); }); }
function build3D(){
  disposeTree(root); root.clear();
  for(let i=0;i<=S.cur;i++) buildFloor(i);
  buildLabels(); renderStats();
}
function renderZoneLegend(){
  const el=document.getElementById("zlegend"); if(!el) return;
  const zs=(S.showZones!==false && !S.structView)?(F().zones||[]):[];
  if(S.showZones===false || S.structView){ el.hidden=true; return; }
  el.hidden=false;
  if(!zs.length){ el.innerHTML=`<span class="zh">${S.variant!=="p"?"ألوان الوحدات في النسخة «المقترحة»":"لا وحدات ملوّنة في هذا الطابق. اختر الأول أو الثاني أو الثالث"}</span>`; return; }
  el.innerHTML=zs.map(z=>`<span class="zi"><i style="background:${z.c}"></i>${esc(z.n)}</span>`).join("");
}
function buildLabels(){
  renderZoneLegend();
  const box = document.getElementById("labels"); box.innerHTML=""; labelEls=[];
  if(!S.showLabels || mode!=="3d") return;
  const e = elev(S.cur);
  if(S.structView){ structLabels().forEach(([t,p])=>{ const d=document.createElement("div"); d.className="lb"; d.textContent=t; box.appendChild(d); labelEls.push([d,p]); }); return; }
  if(S.showZones!==false) (F().zones||[]).forEach(z=>{ const r=z.r.reduce((a,b)=>(b[2]-b[0])*(b[3]-b[1])>(a[2]-a[0])*(a[3]-a[1])?b:a); const d=document.createElement("div"); d.className="lb zlb"; d.style.background=z.c; d.textContent=z.n; box.appendChild(d); labelEls.push([d,P((r[0]+r[2])/2,(r[1]+r[3])/2,e+(S.cut?2.6:3.4))]); });
  F().labels.forEach(([t,x,y])=>{ if(t==="نقطة تفتيش" && SIM.on && SIM.sc==="B" && S.cur===0) return; const d=document.createElement("div"); d.className="lb"; d.textContent=t; box.appendChild(d); labelEls.push([d,P(x,y,e+(S.cut?1.4:.6))]); });
}
function setView(v){
  const cx=S.site.w/2, cy=S.site.d/2, e=elev(S.cur), tz=e/2+1;
  controls.target.copy(P(cx,cy,tz));
  if(v==="top") camera.position.copy(P(cx,cy-0.01,e+58));
  else if(v==="front") camera.position.copy(P(cx,-30-e*.6,tz+4));
  else camera.position.copy(P(cx+28+e*.5,-18-e*.5,tz+30+e*.4));
  controls.update();
  document.querySelectorAll("#views button").forEach(b=>b.setAttribute("aria-pressed", b.dataset.v===v));
}
function resize(){
  const r = host.getBoundingClientRect(); if(!r.width||!r.height) return;
  renderer.setSize(r.width,r.height); camera.aspect=r.width/r.height; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
const v3 = new THREE.Vector3();

/* ---------- parking simulation ----------
   Paths were computed offline with a hybrid A* planner: car 4.85 x 1.85 m, wheelbase 2.8 m,
   turning radius at rear axle 5.0 m (4.3 m = full lock), 30 cm clearance kept from every wall,
   column, curb and the other three parked cars. Poses: [x, y, heading, direction(+1 fwd / -1 rev)]. */
const CARD = {wb:2.8, fo:.95, ro:1.1, W:1.85};
const SIM = {on:false, sc:"B", bay:null, leg:null, t:0, dist:0, cum:null, group:new THREE.Group(), car:null, pause:0};
scene.add(SIM.group);
function simLevel(e,k){
  const v=e[k]; if(!v.ok) return ["لم أجد مساراً","bad"];
  if(e.R<5 && k==="in") return ["ممكن بأقصى انعطاف · "+v.rev+" تغيير اتجاه","warn"];
  if(v.rev<=1) return ["مريح · "+(v.rev?"رجوع مرة واحدة":"بلا رجوع"),"good"];
  if(v.rev<=3) return ["بمناورة · "+v.rev+" تغيير اتجاه","warn"];
  return ["صعب · "+v.rev+" تغيير اتجاه","bad"];
}
function carMesh(col){
  const g=new THREE.Group(), L=CARD.wb+CARD.fo+CARD.ro, cx=(CARD.wb+CARD.fo-CARD.ro)/2;
  const body=new THREE.Mesh(new THREE.BoxGeometry(L,.75,CARD.W), mat(col)); body.position.set(cx,.55,0); body.castShadow=true; g.add(body);
  const cab=new THREE.Mesh(new THREE.BoxGeometry(2.3,.5,1.65), mat("#2c3a44")); cab.position.set(cx-.15,1.17,0); cab.castShadow=true; g.add(cab);
  const fr=new THREE.Mesh(new THREE.BoxGeometry(.06,.18,1.5), mat("#f2e6a0")); fr.position.set(CARD.wb+CARD.fo+.01,.6,0); g.add(fr);
  return g;
}
function placeCar(m,x,y,th){ m.position.copy(P(x,y,0)); m.rotation.y=th; }
function simClear(){ disposeTree(SIM.group); SIM.group.clear(); SIM.car=null; }
function simBuild(){
  simClear(); if(!SIM.on || !SIM.bay) return;
  const e=SIMDATA[SIM.sc][SIM.bay];
  Object.keys(PARKED).forEach(b=>{ if(b===SIM.bay) return; const c=carMesh("#8b9399"); placeCar(c,...PARKED[b]); SIM.group.add(c); });
  const v=e[SIM.leg]; if(!v.ok) return;
  const fwd=[], rev=[];
  for(let i=1;i<v.poses.length;i++){ const a=v.poses[i-1], b=v.poses[i]; (b[3]<0?rev:fwd).push(P(a[0],a[1],.04),P(b[0],b[1],.04)); }
  const acc=cssVar("--accent")||"#1f6680";
  if(fwd.length) SIM.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(fwd), new THREE.LineBasicMaterial({color:acc})));
  if(rev.length) SIM.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rev), new THREE.LineBasicMaterial({color:"#d9822b"})));
  v.poses.forEach((p,i)=>{ if(i%3) return;
    const c=Math.cos(p[2]), s=Math.sin(p[2]), f=CARD.wb+CARD.fo, r=-CARD.ro, h=CARD.W/2;
    const pts=[[f,h],[f,-h],[r,-h],[r,h],[f,h]].map(([a,b])=>P(p[0]+c*a-s*b, p[1]+s*a+c*b, .03));
    SIM.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:p[3]<0?"#d9822b":acc, transparent:true, opacity:.25})));
  });
  SIM.car=carMesh("#b5443a"); SIM.group.add(SIM.car);
  SIM.cum=[0]; for(let i=1;i<v.poses.length;i++){ const a=v.poses[i-1], b=v.poses[i]; SIM.cum.push(SIM.cum[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1])); }
  SIM.dist=0; SIM.pause=0; placeCar(SIM.car, v.poses[0][0], v.poses[0][1], v.poses[0][2]);
}
let simLast=0;
function simStep(now){
  const dt=Math.min(.05,(now-simLast)/1000||0); simLast=now;
  if(!SIM.on || !SIM.car) return;
  const v=SIMDATA[SIM.sc][SIM.bay][SIM.leg], ps=v.poses, cum=SIM.cum, total=cum[cum.length-1];
  if(SIM.pause>0){ SIM.pause-=dt; return; }
  const prevIdx = cum.findIndex(c=>c>SIM.dist);
  SIM.dist += dt*2.2;
  if(SIM.dist>=total){ SIM.dist=total; const p=ps[ps.length-1]; placeCar(SIM.car,p[0],p[1],p[2]); SIM.pause=1.2; SIM.dist=0; return; }
  let i=cum.findIndex(c=>c>SIM.dist); if(i<1) i=1;
  if(prevIdx>0 && i>prevIdx && ps[i][3]!==ps[prevIdx][3]) SIM.pause=.5;
  const a=ps[i-1], b=ps[i], u=(SIM.dist-cum[i-1])/Math.max(1e-6,cum[i]-cum[i-1]);
  let dth=b[2]-a[2]; dth=Math.atan2(Math.sin(dth),Math.cos(dth));
  placeCar(SIM.car, a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u, a[2]+dth*u);
}
function simPlay(bay,leg){
  SIM.on=true; SIM.bay=bay; SIM.leg=leg;
  S.variant="p"; S.cur=0; S.showLabels=S.showLabels; renderVariant();
  if(mode!=="3d") document.getElementById("m3d").click();
  update(true); simBuild();
  controls.target.copy(P(12.5,13,0)); camera.position.copy(P(12.5,-9,24)); controls.update();
}
function simStop(){ SIM.on=false; SIM.bay=null; simClear(); update(true); }
function simPlanSvg(X,Y){
  if(!SIM.on || !SIM.bay || S.cur!==0) return "";
  const e=SIMDATA[SIM.sc][SIM.bay], v=e[SIM.leg]; let s="";
  const rect=(x,y,th,st)=>{ const c=Math.cos(th), sn=Math.sin(th), f=CARD.wb+CARD.fo, r=-CARD.ro, h=CARD.W/2;
    return `<polygon points="${[[f,h],[f,-h],[r,-h],[r,h]].map(([a,b])=>X(x+c*a-sn*b)+","+Y(y+sn*a+c*b)).join(" ")}" ${st}/>`; };
  Object.keys(PARKED).forEach(b=>{ if(b!==SIM.bay) s+=rect(...PARKED[b],`fill="#8b9399" fill-opacity=".6"`); });
  if(v.ok){
    v.poses.forEach((p,i)=>{ if(i%3===0) s+=rect(p[0],p[1],p[2],`fill="none" stroke="${p[3]<0?"#d9822b":cssVar("--accent")}" stroke-opacity=".35" stroke-width=".03"`); });
    const last=v.poses[v.poses.length-1]; s+=rect(last[0],last[1],last[2],`fill="#b5443a" fill-opacity=".8"`);
  }
  return s;
}
function loop(now){
  requestAnimationFrame(loop);
  simStep(now||0);
  if(mode!=="3d") return;
  controls.update(); renderer.render(scene,camera);
  const w = host.clientWidth, h = host.clientHeight;
  labelEls.forEach(([el,p])=>{
    v3.copy(p).project(camera);
    if(v3.z>1||v3.z<-1){ el.hidden=true; return; }
    el.hidden=false; el.style.left=((v3.x+1)/2*w)+"px"; el.style.top=((1-v3.y)/2*h)+"px";
  });
}
const ray = new THREE.Raycaster(); let downAt=null;
renderer.domElement.addEventListener("pointerdown",e=>downAt=[e.clientX,e.clientY]);
renderer.domElement.addEventListener("pointerup",e=>{
  if(!downAt || Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>5) return;
  const r = renderer.domElement.getBoundingClientRect();
  ray.setFromCamera({x:(e.clientX-r.left)/r.width*2-1, y:-(e.clientY-r.top)/r.height*2+1}, camera);
  const hits = ray.intersectObjects(root.children,false);
  const hit = hits.length && hits[0].object.userData.wall!==undefined ? hits[0] : null;
  selectWall(hit ? hit.object.userData.wall : null, true);
});

/* ---------- Plan ---------- */
function buildPlan(){
  const Fl=F(), W=S.site.w, D=S.site.d, Y=y=>(D-y).toFixed(3), X=x=>(+x).toFixed(3);
  const ink=cssVar("--ink"), muted=cssVar("--muted"), acc=cssVar("--accent"), line=cssVar("--line"), grass=S.colors.grass;
  let s=`<svg viewBox="-2 -2.2 ${W+4} ${D+4.4}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="مخطط علوي - ${Fl.n}">`;
  s+=`<rect x="0" y="0" width="${W}" height="${D}" fill="${cssVar("--panel")}" stroke="${line}" stroke-width=".04"/>`;
  if(Fl.garden){
    (Fl.planters||PLANTERS).forEach(p=>{ s+=`<polygon points="${planterPts(p).map(q=>X(q[0])+","+Y(q[1])).join(" ")}" fill="${grass}" fill-opacity=".35" stroke="${grass}" stroke-width=".05"/>`; });
    (Fl.trees||TREES).forEach(([x,y,k])=>{ s+=`<circle cx="${X(x)}" cy="${Y(y)}" r="${(.8*k).toFixed(2)}" fill="none" stroke="${grass}" stroke-width=".05"/>`; });
  }
  if(S.showZones!==false) (Fl.zones||[]).forEach(z=>z.r.forEach(r=>{ s+=`<rect x="${X(r[0])}" y="${Y(r[3])}" width="${X(r[2]-r[0])}" height="${X(r[3]-r[1])}" fill="${z.c}" fill-opacity=".55"/>`; }));
  if(Fl.slabY0) s+=`<rect x="0" y="${Y(Fl.slabY0)}" width="${W}" height="${X(Fl.slabY0)}" fill="${acc}" fill-opacity=".08" stroke="${acc}" stroke-width=".04" stroke-dasharray=".3 .2"/>`;
  (Fl.lines||[]).forEach(l=>{ s+=`<line x1="${X(l[0])}" y1="${Y(l[1])}" x2="${X(l[2])}" y2="${Y(l[3])}" stroke="${muted}" stroke-width=".05"/>`; });
  (Fl.boxes||[]).forEach(b=>{ s+=`<rect x="${X(b[0])}" y="${Y(b[4])}" width="${X(b[3]-b[0])}" height="${X(b[4]-b[1])}" fill="${muted}" fill-opacity=".3" stroke="${muted}" stroke-width=".03"/>`; });
  if(Fl.stairs!==false) FLIGHTS.forEach(([O,d,w,Wd,n,zb,top])=>{
    const len=(n-1)*G+(top?G:0), c=(s1,t)=>[O[0]+d[0]*s1+w[0]*t, O[1]+d[1]*s1+w[1]*t];
    const q=[c(0,0),c(len,0),c(len,Wd),c(0,Wd)];
    s+=`<polygon points="${q.map(p=>X(p[0])+","+Y(p[1])).join(" ")}" fill="none" stroke="${muted}" stroke-width=".04"/>`;
    for(let i=1;i<n;i++){ const a=c(i*G,0), b=c(i*G,Wd); s+=`<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="${muted}" stroke-width=".025"/>`; }
  });
  if(Fl.stairs!==false) LANDINGS.forEach(l=>{ s+=`<rect x="${X(l[0])}" y="${Y(l[3])}" width="${X(l[2]-l[0])}" height="${X(l[3]-l[1])}" fill="none" stroke="${muted}" stroke-width=".04"/>`; });
  Fl.walls.forEach((w,i)=>{
    const wh = Math.min(+w.h || +Fl.H, +Fl.H), {pieces, ops} = wallPieces(w, wh);
    const ang=Math.atan2(w.b[1]-w.a[1],w.b[0]-w.a[0]), ux=Math.cos(ang), uy=Math.sin(ang), nx=-uy*w.t/2, ny=ux*w.t/2;
    const col = sel===i ? acc : ink, low = wh < +Fl.H;
    pieces.filter(p=>p[2]===0 && p[3]>=wh-1e-6).forEach(([a,b])=>{
      const p1=[w.a[0]+ux*a,w.a[1]+uy*a], p2=[w.a[0]+ux*b,w.a[1]+uy*b];
      const pts=[[p1[0]+nx,p1[1]+ny],[p2[0]+nx,p2[1]+ny],[p2[0]-nx,p2[1]-ny],[p1[0]-nx,p1[1]-ny]];
      s+=`<polygon data-wall="${i}" points="${pts.map(p=>X(p[0])+","+Y(p[1])).join(" ")}" fill="${low?"none":col}" stroke="${col}" stroke-width="${low?".04":".01"}" style="cursor:pointer"/>`;
    });
    ops.forEach(([a,b,z0])=>{
      const p1=[w.a[0]+ux*a,w.a[1]+uy*a], p2=[w.a[0]+ux*b,w.a[1]+uy*b];
      if(z0>0) s+=`<line x1="${X(p1[0])}" y1="${Y(p1[1])}" x2="${X(p2[0])}" y2="${Y(p2[1])}" stroke="${col}" stroke-width="${(w.t*.35).toFixed(3)}"/>`;
      else s+=`<line x1="${X(p1[0])}" y1="${Y(p1[1])}" x2="${X(p2[0])}" y2="${Y(p2[1])}" stroke="${acc}" stroke-width=".03" stroke-dasharray=".12 .1"/>`;
    });
  });
  (Fl.doors||[]).forEach(d=>{
    const w=d.x1-d.x0, y=d.y;
    if(d.k==="gate") s+=`<rect x="${X(d.x0)}" y="${Y(y+.05)}" width="${X(w)}" height=".1" fill="${acc}"/><text x="${X(d.x0+w/2)}" y="${Y(y-.55)}" font-size=".38" text-anchor="middle" fill="${acc}" font-family="IBM Plex Sans Arabic, sans-serif">${esc(d.n)}</text>`;
    else if(d.k==="single") s+=`<line x1="${X(d.x0)}" y1="${Y(y)}" x2="${X(d.x0)}" y2="${Y(y+w)}" stroke="${acc}" stroke-width=".05"/><path d="M ${X(d.x0)} ${Y(y+w)} A ${w} ${w} 0 0 1 ${X(d.x1)} ${Y(y)}" fill="none" stroke="${acc}" stroke-width=".03"/>`;
    else { const h=w/2; s+=`<line x1="${X(d.x0)}" y1="${Y(y)}" x2="${X(d.x0)}" y2="${Y(y-h)}" stroke="${acc}" stroke-width=".05"/><path d="M ${X(d.x0)} ${Y(y-h)} A ${h} ${h} 0 0 0 ${X(d.x0+h)} ${Y(y)}" fill="none" stroke="${acc}" stroke-width=".03"/><line x1="${X(d.x1)}" y1="${Y(y)}" x2="${X(d.x1)}" y2="${Y(y-h)}" stroke="${acc}" stroke-width=".05"/><path d="M ${X(d.x1)} ${Y(y-h)} A ${h} ${h} 0 0 1 ${X(d.x1-h)} ${Y(y)}" fill="none" stroke="${acc}" stroke-width=".03"/>`; }
  });
  s+=simPlanSvg(X,Y);
  s+=mepPlanSvg(S.cur,X,Y);
  const cs=S.colSize/2;
  Fl.cols.forEach(([x,y])=>{ s+=`<rect x="${X(x-cs)}" y="${Y(y+cs)}" width="${S.colSize}" height="${S.colSize}" fill="${ink}"/>`; });
  if(S.showLabels) Fl.labels.forEach(([t,x,y])=>{ s+=`<text x="${X(x)}" y="${Y(y)}" font-size=".42" text-anchor="middle" dominant-baseline="middle" fill="${muted}" font-family="IBM Plex Sans Arabic, sans-serif">${t}</text>`; });
  if(S.showZones!==false) (Fl.zones||[]).forEach(z=>{ const r=z.r.reduce((a,b)=>(b[2]-b[0])*(b[3]-b[1])>(a[2]-a[0])*(a[3]-a[1])?b:a), cx=(r[0]+r[2])/2, cy=(r[1]+r[3])/2+1.1; s+=`<text x="${X(cx)}" y="${Y(cy)}" font-size=".95" font-weight="800" text-anchor="middle" dominant-baseline="middle" fill="#1b1b1b" stroke="#fff" stroke-width=".22" paint-order="stroke" font-family="IBM Plex Sans Arabic, sans-serif">${esc(z.n)}</text>`; });
  s+=`<line x1="0" y1="-1" x2="${W}" y2="-1" stroke="${muted}" stroke-width=".03"/><text x="${W/2}" y="-1.25" font-size=".55" text-anchor="middle" fill="${ink}" font-family="IBM Plex Mono, monospace">${(+W).toFixed(2)}</text>`;
  s+=`<line x1="${W+1}" y1="0" x2="${W+1}" y2="${D}" stroke="${muted}" stroke-width=".03"/><text x="${W+1.4}" y="${D/2}" font-size=".55" text-anchor="middle" fill="${ink}" font-family="IBM Plex Mono, monospace" transform="rotate(90 ${W+1.4} ${D/2})">${(+D).toFixed(2)}</text>`;
  s+=`<text x="${W/2}" y="${D+1.3}" font-size=".5" text-anchor="middle" fill="${muted}" font-family="IBM Plex Sans Arabic, sans-serif">${Fl.n} · الواجهة الأمامية من هذه الجهة</text></svg>`;
  const pl=document.getElementById("plan"); pl.innerHTML=s;
  pl.querySelectorAll("[data-wall]").forEach(el=>el.addEventListener("click",()=>selectWall(+el.dataset.wall,true)));
}

/* ---------- Panel ---------- */
const pane = document.getElementById("pane");
const esc = v => String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const num = (path,label,val,step=.05) => `<label class="f">${label}<input type="number" step="${step}" data-path="${path}" id="f-${path.replace(/\W/g,'-')}" value="${+(+val).toFixed(3)}"></label>`;
const colr = (path,label,val) => `<label class="f">${label}<input type="color" data-path="${path}" id="f-${path.replace(/\W/g,'-')}" value="${val}"></label>`;
function renderFloors(){
  const box=document.getElementById("floors");
  box.innerHTML = FL().map((f,i)=>`<button aria-pressed="${i===S.cur}" data-fl="${i}" id="fl-${i}">${esc(f.n)}</button>`).join("");
  document.getElementById("ttl").textContent = "البناية · " + F().n;
}
function renderPanel(){
  renderFloors();
  document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected", t.dataset.tab===tab));
  const Fl = F();
  if(tab==="gen"){
    pane.innerHTML = `
    <fieldset><legend>${esc(Fl.n)}</legend><div class="grid2">
      <label class="f">اسم الطابق<input type="text" data-fpath="n" id="fl-name" value="${esc(Fl.n)}"></label>
      <label class="f">ارتفاع الطابق<input type="number" step=".05" data-fpath="H" id="fl-H" value="${Fl.H}"></label></div>
      <p class="hint">منسوب أرضية هذا الطابق <b dir="ltr">+${elev(S.cur).toFixed(2)}</b> م</p></fieldset>
    <fieldset><legend>للبناية كلها</legend><div class="grid2">
      ${num("D","ارتفاع الأبواب",S.D)}${num("colSize","مقطع العمود",S.colSize)}
      ${num("site.w","العرض (س)",S.site.w,.1)}${num("site.d","العمق (ص)",S.site.d,.1)}</div></fieldset>
    <fieldset><legend>الألوان</legend><div class="grid3">
      ${colr("colors.ext","جدران خارجية",S.colors.ext)}${colr("colors.int","جدران داخلية",S.colors.int)}${colr("colors.floor","الأرضيات",S.colors.floor)}
      ${colr("colors.col","الأعمدة",S.colors.col)}${colr("colors.stair","الدرج",S.colors.stair)}${colr("colors.grass","الحديقة",S.colors.grass)}</div></fieldset>
    <fieldset><legend>العرض</legend>
      <label class="check"><input type="checkbox" id="g-labels" ${S.showLabels?"checked":""}> أسماء الغرف</label>
      <label class="check"><input type="checkbox" id="g-trees" ${S.showTrees?"checked":""}> الأشجار</label>
    </fieldset>`;
  } else if(tab==="walls"){
    pane.innerHTML = `<p class="hint">جدران ${esc(Fl.n)}. الفتحات تُكتب بالمتر من بداية الجدار: <span dir="ltr">1.5-2.9</span> باب بالارتفاع الافتراضي، و<span dir="ltr">10-15@2.9</span> فتحة بارتفاع 2.9، و<span dir="ltr">2-3.5@0.9:2.1</span> شباك جلسته 0.9 وأعلاه 2.1. افصل بين الفتحات بفاصلة. حقل «الارتفاع» فارغ يعني ارتفاع الطابق كاملاً.</p>
    <div class="btns"><button class="btn pri" id="addWall">إضافة جدار</button></div>` +
    Fl.walls.map((w,i)=>{
      const L=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);
      return `<div class="row${sel===i?" sel":""}" data-i="${i}" id="row-${i}">
      <div class="rh"><span class="num">${i+1}</span><input type="text" data-f="n" id="w${i}-n" value="${esc(w.n)}" aria-label="اسم الجدار">
      <button class="btn sm danger" data-del="${i}">حذف</button></div>
      <div class="grid3">
        <label class="f">بداية س<input type="number" step=".05" data-f="ax" id="w${i}-ax" value="${w.a[0]}"></label>
        <label class="f">بداية ص<input type="number" step=".05" data-f="ay" id="w${i}-ay" value="${w.a[1]}"></label>
        <label class="f">السماكة<input type="number" step=".05" data-f="t" id="w${i}-t" value="${w.t}"></label>
        <label class="f">نهاية س<input type="number" step=".05" data-f="bx" id="w${i}-bx" value="${w.b[0]}"></label>
        <label class="f">نهاية ص<input type="number" step=".05" data-f="by" id="w${i}-by" value="${w.b[1]}"></label>
        <label class="f">النوع<select data-f="k" id="w${i}-k"><option value="ext"${w.k==="ext"?" selected":""}>خارجي</option><option value="int"${w.k==="int"?" selected":""}>داخلي</option></select></label>
      </div>
      <div class="grid3" style="grid-template-columns:2fr 1fr">
        <label class="f">الفتحات · طول الجدار ${L.toFixed(2)} م<input type="text" dir="ltr" data-f="o" id="w${i}-o" value="${esc(w.o)}" placeholder="1.5-2.9"></label>
        <label class="f">الارتفاع<input type="number" step=".05" data-f="h" id="w${i}-h" value="${w.h||""}" placeholder="${Fl.H}"></label>
      </div></div>`;}).join("");
  } else if(tab==="struct"){ projStructTab(pane);
  } else if(tab==="mep"){ projMepTab(pane);
  } else if(tab==="sim"){
    const D=SIMDATA[SIM.sc];
    const chip=([t,c])=>`<span class="chip ${c}">${t}</span>`;
    pane.innerHTML = `<p class="hint">سيارة بطول 4.85 م وعرض 1.85 م تدخل من البوابة وتصطف في كل موقف ثم تخرج، والمواقف الثلاثة الأخرى مشغولة. اشترطتُ أن تبقى السيارة 30 سم على الأقل بعيداً عن كل جدار وعمود ورصيف وسيارة، وأن يكون نصف قطر الدوران عند المحور الخلفي 5 م، وهو دوران مريح دون أقصى انعطاف للمقود.</p>
    ${["B1","B2","B3","B4"].map(b=>{ const e=D[b]; return `<div class="row${SIM.bay===b?" sel":""}" style="cursor:default">
      <div class="rh"><b style="flex:1">${BAYNAME[b]}</b><span class="hint">${e.mode==="rev"?"اصطفاف بالرجوع":"اصطفاف بالأمام"}</span></div>
      <div class="simrow"><span>الدخول</span>${chip(simLevel(e,"in"))}${e.in.ok?`<span class="mono">${e.in.len} م · خلوص ${e.in.clear} م</span><button class="btn sm" data-play="${b}:in" id="pl-${b}-in">تشغيل</button>`:""}</div>
      <div class="simrow"><span>الخروج</span>${chip(simLevel(e,"out"))}${e.out.ok?`<span class="mono">${e.out.len} م · خلوص ${e.out.clear} م</span><button class="btn sm" data-play="${b}:out" id="pl-${b}-out">تشغيل</button>`:""}</div></div>`; }).join("")}
    ${SIM.on?`<div class="btns"><button class="btn danger" id="simstop">إيقاف المحاكاة</button></div>`:""}
    <p class="hint">الخط الأزرق تقدّم والبرتقالي رجوع. «لم أجد مساراً» تعني أن المخطِّط لم يجد مساراً يحفظ مسافة 30 سم، لا أن الدخول مستحيل بحذر شديد.</p>`;
  } else if(tab==="notes"){
    const open=S.notes.filter(x=>!x.done).length;
    pane.innerHTML = (S.variant==="p" ? `<fieldset><legend>ما تغيّر في النسخة المقترحة</legend>${CHANGES.map((c,i)=>`<div class="row" style="flex-direction:row;gap:10px;cursor:default"><span class="num">${i+1}</span><span style="flex:1;min-width:0">${esc(c)}</span></div>`).join("")}</fieldset>` : "") + `<p class="hint">ما لاحظته في المخططات ولم أصححه. رسمت كل شيء كما هو، وهذه البنود هي مرحلة التحسين: علّم البند بعد أن نعالجه. المتبقي <b>${open}</b> من ${S.notes.length}.</p>` +
      S.notes.map((x,i)=>`<label class="row note${x.done?" done":""}" for="nt-${i}" style="flex-direction:row;align-items:flex-start;gap:10px"><input type="checkbox" id="nt-${i}" data-note="${i}" ${x.done?"checked":""} style="margin-top:4px"><span class="num">${i+1}</span><span style="flex:1;min-width:0">${esc(x.t)}</span></label>`).join("");
  } else if(tab==="cols"){
    pane.innerHTML = `<p class="hint">أعمدة ${esc(Fl.n)}: موقع مركز كل عمود بالمتر. المقطع يُعدَّل من تبويب «عام».</p>
    <div class="btns"><button class="btn pri" id="addCol">إضافة عمود</button></div>` +
    Fl.cols.map((c,i)=>`<div class="row" data-ci="${i}"><div class="rh"><span class="num">${i+1}</span>
      <div class="grid2" style="flex:1"><label class="f">س<input type="number" step=".05" data-c="0" id="c${i}-x" value="${c[0]}"></label><label class="f">ص<input type="number" step=".05" data-c="1" id="c${i}-y" value="${c[1]}"></label></div>
      <button class="btn sm danger" data-cdel="${i}">حذف</button></div></div>`).join("");
  } else {
    pane.innerHTML = `<fieldset><legend>حفظ ومشاركة التصميم</legend>
      <p class="hint">تعديلاتك محفوظة في هذا المتصفح فقط. لأبني منها نسخة SketchUp أو الطابق التالي، انسخ البيانات والصقها لي في المحادثة.</p>
      <textarea id="json" aria-label="بيانات التصميم"></textarea>
      <div class="btns"><button class="btn pri" id="copy">نسخ بيانات التصميم</button><button class="btn" id="apply">تطبيق الملصوق</button><button class="btn danger" id="reset">إرجاع المخطط الأصلي</button></div>
      <div class="msg" id="msg" role="status"></div></fieldset>`;
    document.getElementById("json").value = JSON.stringify(S);
  }
}
function setPath(p,v){ const k=p.split("."); let o=S; for(let i=0;i<k.length-1;i++) o=o[k[i]]; o[k[k.length-1]]=v; }
function update(rePanel){ persist(); build3D(); if(mode==="plan") buildPlan(); if(rePanel) renderPanel(); }
function selectWall(i, fromView){ if(CLIENT) return;
  sel = (i===sel && !fromView) ? null : i;
  if(sel!==null && tab!=="walls"){ tab="walls"; renderPanel(); }
  else document.querySelectorAll(".row[data-i]").forEach(r=>r.classList.toggle("sel", +r.dataset.i===sel));
  build3D(); if(mode==="plan") buildPlan();
  if(fromView && sel!==null){ const r=document.getElementById("row-"+sel); if(r) r.scrollIntoView({block:"nearest",behavior:"smooth"}); }
}
document.getElementById("floors").addEventListener("click",e=>{
  const b=e.target.closest("button[data-fl]"); if(!b) return;
  S.cur=+b.dataset.fl; sel=null; persist(); renderPanel(); build3D(); if(mode==="plan") buildPlan(); setView("persp");
});
pane.addEventListener("change",e=>{
  const t=e.target, Fl=F();
  if(t.dataset.note!==undefined){ S.notes[+t.dataset.note].done=t.checked; persist(); renderPanel(); return; }
  if(t.id==="g-labels"){ S.showLabels=t.checked; update(); return; }
  if(t.id==="g-trees"){ S.showTrees=t.checked; update(); return; }
  if(t.dataset.fpath){ Fl[t.dataset.fpath] = t.type==="number" ? Math.max(1,+t.value||3.2) : t.value; update(); renderFloors(); return; }
  if(t.dataset.path){ setPath(t.dataset.path, t.type==="number" ? (+t.value||0) : t.value); update(); return; }
  const row=t.closest(".row");
  if(row && row.dataset.i!==undefined && t.dataset.f){
    const w=Fl.walls[+row.dataset.i], f=t.dataset.f, v=t.value;
    if(f==="ax") w.a[0]=+v||0; else if(f==="ay") w.a[1]=+v||0; else if(f==="bx") w.b[0]=+v||0; else if(f==="by") w.b[1]=+v||0;
    else if(f==="t") w.t=Math.max(.05,+v||.2);
    else if(f==="h"){ if(v==="") delete w.h; else w.h=Math.max(.1,+v); }
    else w[f]=v;
    sel=+row.dataset.i; update();
    return;
  }
  if(row && row.dataset.ci!==undefined && t.dataset.c!==undefined){ Fl.cols[+row.dataset.ci][+t.dataset.c]=+t.value||0; update(); }
});
pane.addEventListener("input",e=>{ const t=e.target; if(t.type==="color"&&t.dataset.path){ setPath(t.dataset.path,t.value); persist(); build3D(); if(mode==="plan") buildPlan(); }});
let resetArmed=false;
pane.addEventListener("click",e=>{
  const Fl=F(), row=e.target.closest(".row[data-i]"), b=e.target.closest("button");
  if(!b){ if(row && !e.target.closest("input,select")) selectWall(+row.dataset.i,false); return; }
  if(b.dataset.play){ const [bay,leg]=b.dataset.play.split(":"); simPlay(bay,leg); return; }
  if(b.dataset.sc){ SIM.sc=b.dataset.sc; if(SIM.on) simPlay(SIM.bay,SIM.leg); else renderPanel(); return; }
  if(b.id==="simstop"){ simStop(); return; }
  if(b.dataset.del!==undefined){ Fl.walls.splice(+b.dataset.del,1); sel=null; update(true); return; }
  if(b.dataset.cdel!==undefined){ Fl.cols.splice(+b.dataset.cdel,1); update(true); return; }
  if(b.id==="addWall"){ Fl.walls.push({n:"جدار جديد",k:"int",a:[5,17],b:[9,17],t:.2,o:""}); sel=Fl.walls.length-1; update(true);
    const r=document.getElementById("row-"+sel); if(r) r.scrollIntoView({block:"nearest"}); return; }
  if(b.id==="addCol"){ Fl.cols.push([12.5,20]); update(true); pane.scrollTop=pane.scrollHeight; return; }
  const msg=document.getElementById("msg");
  if(b.id==="copy"){ const ta=document.getElementById("json"); ta.value=JSON.stringify(S);
    const manual=()=>{ ta.focus(); ta.select(); msg.textContent="النص محدد، انسخه يدوياً."; };
    try{ navigator.clipboard.writeText(ta.value).then(()=>msg.textContent="تم النسخ. الصقه في المحادثة.", manual); }catch(err){ manual(); }
    return; }
  if(b.id==="apply"){ try{ const o=migrate(JSON.parse(document.getElementById("json").value)); if(!o) throw 0; S=o; if(S.cur>=FL().length) S.cur=0; sel=null; update(true); document.getElementById("msg").textContent="تم تطبيق التصميم."; }catch(err){ msg.textContent="البيانات غير صالحة. انسخها كاملة من زر النسخ."; } return; }
  if(b.id==="reset"){
    if(!resetArmed){ resetArmed=true; b.textContent="اضغط مرة ثانية للتأكيد"; msg.textContent="سيُحذف كل تعديل في جميع الطوابق وتعود قياسات المخططات الأصلية."; setTimeout(()=>{resetArmed=false; if(b.isConnected) b.textContent="إرجاع المخطط الأصلي";},4000); return; }
    S=clone(DEF); sel=null; resetArmed=false; update(true); document.getElementById("msg").textContent="عادت المخططات الأصلية."; }
});
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{ tab=t.dataset.tab; renderPanel(); }));
document.querySelectorAll("#mode button").forEach(b=>b.addEventListener("click",()=>{
  mode=b.dataset.mode;
  document.querySelectorAll("#mode button").forEach(x=>x.setAttribute("aria-pressed", x===b));
  const is3=mode==="3d";
  document.getElementById("three").hidden=!is3; document.getElementById("labels").hidden=!is3; document.getElementById("plan").hidden=is3;
  document.getElementById("views").hidden=!is3;
  document.getElementById("legend").textContent = is3 ? "اسحب للتدوير · عجلة للتقريب · اضغط على جدار لتحديده" : "اضغط على جدار لتحديده · الخط المتقطع باب أو فتحة";
  if(is3){ resize(); buildLabels(); } else buildPlan();
}));
document.querySelectorAll("#views button").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.v)));
function renderVariant(){ document.querySelectorAll("#variant button").forEach(b=>b.setAttribute("aria-pressed", b.dataset.var===S.variant)); }
document.querySelectorAll("#variant button").forEach(b=>b.addEventListener("click",()=>{ S.variant=b.dataset.var; sel=null; renderVariant(); update(true); }));
renderVariant();
const qCut=document.getElementById("q-cut"), qExt=document.getElementById("q-ext");
qCut.checked=S.cut; qExt.checked=S.hideExt;
qCut.addEventListener("change",()=>{ S.cut=qCut.checked; update(); });
qExt.addEventListener("change",()=>{ S.hideExt=qExt.checked; update(); });
const qStr=document.getElementById("q-struct"); qStr.checked=!!S.structView;
qStr.addEventListener("change",()=>{ S.structView=qStr.checked; if(S.structView){ S.variant="p"; renderVariant(); } update(true); });
const qZone=document.getElementById("q-zone"); qZone.checked=S.showZones!==false;
qZone.addEventListener("change",()=>{ S.showZones=qZone.checked; update(); renderZoneLegend(); });
["ac","water","drain","elec"].forEach(k=>{ const el=document.getElementById("q-mep-"+k); if(!el) return; S.mep=S.mep||{}; el.checked=!!S.mep[k]; el.addEventListener("change",()=>{ S.mep=S.mep||{}; S.mep[k]=el.checked; if(el.checked && S.variant!=="p"){ S.variant="p"; renderVariant(); } update(true); }); });
const qDoor=document.getElementById("q-door"); qDoor.checked=!!S.doorsOpen;
qDoor.addEventListener("change",()=>{ S.doorsOpen=qDoor.checked; update(); });

function renderStats(){
  const Fl=F(), len=Fl.walls.reduce((a,w)=>a+Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]),0);
  const doors=Fl.walls.reduce((a,w)=>a+parseOps(w.o, +Fl.H).length,0);
  document.getElementById("stats").innerHTML =
    `<span>الجدران <b>${Fl.walls.length}</b> · <b>${len.toFixed(1)}</b> م</span><span>الفتحات <b>${doors}</b></span><span>الأعمدة <b>${Fl.cols.length}</b></span><span>الارتفاع <b>${(+Fl.H).toFixed(2)}</b> م</span><span>المنسوب <b dir="ltr">+${elev(S.cur).toFixed(2)}</b></span>`;
}
const mq = matchMedia("(prefers-color-scheme: dark)");
const reTheme = ()=>{ applySceneBg(); build3D(); if(mode==="plan") buildPlan(); };
mq.addEventListener && mq.addEventListener("change", reTheme);
new MutationObserver(reTheme).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});

/* client view: proposal only, no editing or internal-notes tabs */
const CLIENT = PROJECT.clientView===true;
if(CLIENT){ S.variant="p"; ["walls","cols","notes","save"].forEach(t=>{ const b=document.getElementById("t-"+t); if(b) b.remove(); });
  const v=document.getElementById("variant"); if(v) v.style.display="none"; if(["walls","cols","notes","save"].includes(tab)) tab="gen"; }
applySceneBg(); renderPanel(); build3D(); setView("persp"); resize(); loop();
