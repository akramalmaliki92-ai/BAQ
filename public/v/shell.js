(function(){
"use strict";
var LAYERS=[["arch","المعماري","#d9cfbf"],["furn","الأثاث","#a0784f"],["struct","الإنشائي","#6f7a80"],["ac","التبريد","#2f8fd0"],["water","الماء","#19a7a2"],["drain","المجاري","#8b5a2b"],["elec","الكهرباء","#d9a400"],["light","الإنارة","#f2b84b"],["fire","السلامة من الحريق","#d23c2c"],["green","الزراعة","#5d7a43"]];
var VIEWS=[["over","منظور عام"],["top","من الأعلى"],["front","الواجهة"],["inside","من الداخل"],["tour","جولة"]];
var SIMS=[["sun","الشمس والظل"],["night","الإنارة الليلية"],["occ","الإشغال"],["move","حركة الناس والموظفين"],["walk","التجوّل"]];
var NA="غير مشمول في هذا المشروع";
function $(s,r){return (r||document).querySelector(s);}
function el(t,a,h){var e=document.createElement(t);if(a)for(var k in a){if(k==="class")e.className=a[k];else e.setAttribute(k,a[k]);}if(h!=null)e.innerHTML=h;return e;}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");}
var spec=null,insideIdx=0,curView="over";
var api={
 register:function(s){spec=s;build();},
 hud:function(h){var e=$("#bq-hud");if(!e)return;if(!h){e.hidden=true;return;}e.hidden=false;e.innerHTML=h;},
 ready:function(){var l=$("#bq-load");if(l){l.style.opacity="0";setTimeout(function(){l.remove();},450);}},
 setView:function(id){markView(id);},
 refresh:function(){syncLayers();syncSims();}
};
window.BAQV=api;
function tabs(){
 var t=document.querySelectorAll(".bq-tab");
 t.forEach(function(b){b.addEventListener("click",function(){t.forEach(function(x){x.setAttribute("aria-selected",x===b);});document.querySelectorAll(".bq-pane").forEach(function(p){p.hidden=p.id!=="bq-p-"+b.dataset.t;});});});
}
function build(){
 var info=spec.info||{};
 // project pane
 var P=$("#bq-p-proj");P.innerHTML="";
 if(info.facts&&info.facts.length){var s=el("section",{class:"bq-sec"},"<h3>عن المشروع</h3>");info.facts.forEach(function(f){s.appendChild(el("div",{class:"bq-kv"},"<span>"+esc(f[0])+"</span><b>"+esc(f[1])+"</b>"));});P.appendChild(s);}
 if(info.spaces&&info.spaces.length){var s2=el("section",{class:"bq-sec"},"<h3>الفضاءات</h3>");var tw=el("div",{class:"bq-tw"});var cols=info.spaceCols||[["n","الفضاء"],["a","م²"],["f","الأرضية"],["c","السقف"]];
  tw.innerHTML="<table><tr>"+cols.map(function(c){return "<th>"+esc(c[1])+"</th>";}).join("")+"</tr>"+info.spaces.map(function(r){return "<tr>"+cols.map(function(c){var v=r[c[0]];return "<td"+(typeof v==="number"?" class=n":"")+">"+esc(v==null||v===0&&c[0]==="s"?"—":v)+"</td>";}).join("")+"</tr>";}).join("")+"</table>";s2.appendChild(tw);P.appendChild(s2);}
 if(info.counts&&info.counts.length){var s3=el("section",{class:"bq-sec"},"<h3>المحتويات</h3>");info.counts.forEach(function(f){s3.appendChild(el("div",{class:"bq-kv"},"<span>"+esc(f[0])+"</span><b>"+esc(f[1])+"</b>"));});P.appendChild(s3);}
 (info.nodes||[]).forEach(function(n){var sx=el("section",{class:"bq-sec"},"<h3>"+esc(n.title)+"</h3>");var w=el("div",{class:"bq-tw"});w.appendChild(n.node);n.node.hidden=false;sx.appendChild(w);P.appendChild(sx);});
 if(info.about&&info.about.length){var s4=el("section",{class:"bq-sec"},"<h3>ملاحظات العرض</h3>");s4.appendChild(el("ol",{class:"bq-about"},info.about.map(function(a){return "<li>"+esc(a)+"</li>";}).join("")));P.appendChild(s4);}
 // layers pane
 var L=$("#bq-p-lay");L.innerHTML="";
 var vs=el("section",{class:"bq-sec"+(spec.variants?"":" off"),id:"bq-vars"},"<h3>البدائل التصميمية</h3>");
 if(spec.variants){var vl=el("div",{class:"bq-varlist"});spec.variants.items.forEach(function(it,i){var b=el("button",{type:"button",class:"bq-var","data-i":i,"aria-pressed":String(i===spec.variants.get())},"<i style='background:"+esc(it.sw||"#ccc")+"'></i><span><b>"+esc(it.name)+"</b>"+(it.note?"<small>"+esc(it.note)+"</small>":"")+"</span>");b.addEventListener("click",function(){spec.variants.set(i);setTimeout(syncSims,60);});vl.appendChild(b);});vs.appendChild(vl);}
 else vs.appendChild(el("span",{class:"bq-na"},"تصميم واحد معتمد لهذا المشروع"));
 L.appendChild(vs);
 var sec=el("section",{class:"bq-sec"},"<h3>طبقات المشروع</h3>");var grid=el("div",{class:"bq-layers"});
 LAYERS.forEach(function(d){var has=spec.layers&&spec.layers[d[0]];var b=el("button",{class:"bq-lay",type:"button","data-l":d[0],"aria-pressed":"false",id:"bq-l-"+d[0],title:has?d[1]:NA},"<i style='background:"+d[2]+"'></i>"+esc(d[1]));if(!has)b.disabled=true;
  b.addEventListener("click",function(){var ly=spec.layers[d[0]];ly.set(!ly.get());syncLayers();});grid.appendChild(b);});
 sec.appendChild(grid);sec.appendChild(el("p",{class:"hint",style:"font-size:12px;color:var(--mu);margin:0"},"الطبقات المعطّلة غير مشمولة في نطاق هذا المشروع."));L.appendChild(sec);
 if(spec.options&&spec.options.length){var so=el("section",{class:"bq-sec"},"<h3>خيارات العرض</h3>");var od=el("div",{class:"bq-opts"});spec.options.forEach(function(o){var lab=el("label",{class:"bq-chk"});var cb=el("input",{type:"checkbox",id:"bq-o-"+o.id});cb.checked=!!o.get();cb.addEventListener("change",function(){o.set(cb.checked);});lab.appendChild(cb);lab.appendChild(document.createTextNode(o.label));od.appendChild(lab);});so.appendChild(od);L.appendChild(so);}
 // simulation pane
 var S=$("#bq-p-sim");S.innerHTML="";var sims=spec.sims||{};
 SIMS.forEach(function(d){var sm=sims[d[0]];var s=el("section",{class:"bq-sec"+(sm?"":" off"),id:"bq-s-"+d[0]},"<h3>"+esc(d[1])+"</h3>");
  if(!sm){s.appendChild(el("span",{class:"bq-na"},NA));S.appendChild(s);return;}
  if(sm.node){s.appendChild(sm.node);sm.node.hidden=false;}
  if(d[0]==="night"){var nb=el("button",{class:"bq-btn",type:"button",id:"bq-night","aria-pressed":String(!!sm.get())},"تشغيل إنارة الليل");nb.addEventListener("click",function(){sm.set(!sm.get());syncSims();});s.appendChild(nb);}
  if(d[0]==="walk"){var bw=el("div",{class:"bq-btns"});if(sm.tour){var tb=el("button",{class:"bq-btn pri",type:"button",id:"bq-tour"},"جولة داخل المشروع");tb.addEventListener("click",function(){if(sm.tour.on())sm.tour.stop();else{sm.tour.start();markView("tour");}syncSims();});bw.appendChild(tb);}
   if(sm.walk){var wb=el("button",{class:"bq-btn",type:"button",id:"bq-walk","aria-pressed":"false"},"وضع المشي");wb.addEventListener("click",function(){sm.walk.toggle();syncSims();});bw.appendChild(wb);}
   s.appendChild(bw);s.appendChild(el("p",{style:"font-size:12px;color:var(--mu);margin:0"},"في وضع المشي: اسحب للنظر، والأسهم للحركة، أو أزرار الشاشة على الهاتف."));}
  S.appendChild(s);});
 // views bar
 var V=$("#bq-views");V.innerHTML="";var views=spec.views||{};
 VIEWS.forEach(function(d){var ok=d[0]==="tour"?!!(sims.walk&&sims.walk.tour):d[0]==="inside"?!!(spec.insides&&spec.insides.length):!!views[d[0]];
  var b=el("button",{type:"button","data-v":d[0],"aria-pressed":String(d[0]==="over"),title:ok?d[1]:NA},esc(d[1]));if(!ok)b.disabled=true;
  b.addEventListener("click",function(){go(d[0]);});V.appendChild(b);});
 // floors
 var F=$("#bq-floors");F.innerHTML="";if(spec.floors){spec.floors.items.forEach(function(n,i){var b=el("button",{type:"button","data-f":i,"aria-pressed":String(i===spec.floors.get())},esc(n));b.addEventListener("click",function(){spec.floors.set(i);syncFloors();});F.appendChild(b);});F.hidden=false;}else F.hidden=true;
 // walking pad
 var pad=$("#bq-pad");pad.querySelectorAll("button").forEach(function(b){var k=b.dataset.k;b.addEventListener("pointerdown",function(){if(sims.walk&&sims.walk.walk)sims.walk.walk.key(k,true);});["pointerup","pointerleave"].forEach(function(ev){b.addEventListener(ev,function(){if(sims.walk&&sims.walk.walk)sims.walk.walk.key(k,false);});});});
 syncLayers();syncSims();
 setInterval(syncSims,700);
}
function go(id){var sims=spec.sims||{};
 if(id==="tour"){var t=sims.walk&&sims.walk.tour;if(!t)return;t.start();markView("tour");syncSims();return;}
 if(id==="inside"){var L=spec.insides||[];if(!L.length)return;if(curView==="inside")insideIdx=(insideIdx+1)%L.length;L[insideIdx].go();markView("inside");api.hud("من الداخل: <b>"+esc(L[insideIdx].label)+"</b>");return;}
 var v=spec.views[id];if(v){v();markView(id);}}
function markView(id){curView=id;document.querySelectorAll("#bq-views button").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.v===id));});}
function syncFloors(){if(!spec.floors)return;var c=spec.floors.get();document.querySelectorAll("#bq-floors button").forEach(function(b){b.setAttribute("aria-pressed",String(+b.dataset.f===c));});}
function syncLayers(){if(!spec)return;var lg=$("#bq-legend"),h="";
 LAYERS.forEach(function(d){var ly=spec.layers&&spec.layers[d[0]];var b=$("#bq-l-"+d[0]);if(!b||!ly)return;var on=!!ly.get();b.setAttribute("aria-pressed",String(on));
  if(on&&spec.legends&&spec.legends[d[0]])h+="<b>"+esc(d[1])+"</b>"+spec.legends[d[0]].map(function(x){return "<span><i style='background:"+x[0]+"'></i>"+esc(x[1])+"</span>";}).join("");});
 lg.innerHTML=h;lg.hidden=!h;syncFloors();}
function syncSims(){if(!spec)return;var sims=spec.sims||{};syncFloors();
 if(spec.variants){var cv=spec.variants.get();document.querySelectorAll(".bq-var").forEach(function(b){b.setAttribute("aria-pressed",String(+b.dataset.i===cv));});}
 var n=$("#bq-night");if(n&&sims.night)n.setAttribute("aria-pressed",String(!!sims.night.get()));
 var w=sims.walk;if(w){var t=$("#bq-tour");if(t&&w.tour)t.textContent=w.tour.on()?"إيقاف الجولة":"جولة داخل المشروع";var wb=$("#bq-walk");var on=w.walk&&w.walk.on();if(wb)wb.setAttribute("aria-pressed",String(!!on));$("#bq-pad").hidden=!on;}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",tabs);else tabs();
})();
