(function(){
"use strict";
var q=function(id){return document.getElementById(id);};
var tg=function(id){return {get:function(){return q(id).checked;},set:function(on){q(id).checked=on;q(id).dispatchEvent(new Event("change"));}};};
var click=function(id){var b=q(id);if(b)b.click();};
var is3=function(){var b=q("m3d");return !b||b.getAttribute("aria-pressed")==="true";};
var to3=function(){if(!is3())click("m3d");};
var floors=FL().map(function(f){return f.n;});
var hasGarden=FL().some(function(f){return f.garden;});
var fl=FL(), tot=0; fl.forEach(function(f){ tot+=(+f.H||0); });
BAQV.register({
 layers:{
  arch:{get:function(){return !q("q-ext").checked;},set:function(on){tg("q-ext").set(!on);}},
  struct:tg("q-struct"),
  ac:tg("q-mep-ac"), water:tg("q-mep-water"), drain:tg("q-mep-drain"), elec:tg("q-mep-elec"),
  green:hasGarden?{get:function(){return S.showTrees!==false;},set:function(on){S.showTrees=on;update(true);}}:undefined
 },
 legends:{
  ac:[["#f4f4f2","الوحدات الداخلية"],["#9aa3a8","الوحدات الخارجية"],["#c07a3a","أنابيب النحاس"]],
  water:[["#2f7fd1","الماء البارد"],["#d1452f","الماء الحار"],["#2bb3a0","ماء الشرب المفلتر"],["#e8e2d8","الخزانات"]],
  drain:[["#7a5230","خطوط الصرف"],["#6f8f9f","مياه الأمطار"]],
  elec:[["#5d5d5d","اللوحات"],["#e0b000","الكابلات والمسارات"],["#fff3b0","نقاط الإنارة"]],
  struct:[["#9aa3a8","الأعمدة والجسور والسقوف"]]
 },
 options:[
  {id:"zones",label:"ألوان الوحدات",get:function(){return q("q-zone").checked;},set:function(on){tg("q-zone").set(on);}},
  {id:"cut",label:"قصّ الجدران",get:function(){return q("q-cut").checked;},set:function(on){tg("q-cut").set(on);}},
  {id:"doors",label:"فتح الأبواب",get:function(){return q("q-door").checked;},set:function(on){tg("q-door").set(on);}},
  {id:"plan",label:"المخطط ثنائي الأبعاد",get:function(){return !is3();},set:function(on){click(on?"mplan":"m3d");}}
 ],
 views:{over:function(){to3();click("vp");},top:function(){to3();click("vt");},front:function(){to3();click("vf");}},
 floors:{items:floors,get:function(){return S.cur;},set:function(i){click("fl-"+i);}},
 sims:{},
 info:{
  facts:[["عدد الطوابق",String(floors.length)],["أبعاد القطعة",(S.site&&S.site.w?S.site.w+" × "+S.site.d+" م":"—")],["الارتفاع الكلي",tot.toFixed(1)+" م"]],
  spaces:[], about:["الأبعاد بالمتر.","اختر الطابق من القائمة على الشاشة؛ يظهر الطابق المختار مع ما تحته.","طبقات الخدمات توضّح مسارات الأنظمة ومواقعها، والتفاصيل التنفيذية تُعتمد في المخططات الهندسية."]
 }
});
setTimeout(function(){BAQV.ready();},300);
})();
