import { VIEWER_HEAD } from "./viewerHead";
import { ENGINE_VERSION } from "./buildViewerHtml";

// العارض الموحّد لروابط الزبائن: نفس الواجهة والشعار والهوية والأزرار لكل مشروع.
// المشهد إما نموذج المحرك العام (engine) أو مشهد مخصص في public/v/s/<scene>.js.
export const SHELL_VERSION = "20261005a";

export interface ShellMeta {
  projectName: string;
  clientName?: string;
  location?: string;
  phone?: string;
  website?: string;
  companyName?: string;
}

const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// واجهة المحرك الأصلية تُحمَّل مخفية حتى يعمل المحرك كما هو، والعارض الموحّد يتحكم بها
function engineNativeMarkup(): string {
  return VIEWER_HEAD.replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace('<div id="three"></div>', "")
    .replace('<div id="labels"></div>', "")
    .replace('<div id="plan" hidden></div>', "");
}

export function buildShellHtml(meta: ShellMeta, scene: string, modelJs?: string): string {
  const sub = [meta.clientName, meta.location].filter(Boolean).join(" · ");
  const co = [meta.phone, meta.website].filter(Boolean).map((x) => `<b>${esc(x)}</b>`).join(" · ");
  const v = SHELL_VERSION;
  let sceneTags: string;
  if (scene === "engine") {
    const safeJs = (modelJs || "").replace(/<\/script/gi, "<\\/script");
    sceneTags =
      `<div id="bq-native">${engineNativeMarkup()}</div>\n` +
      `<script>\n${safeJs}\n</script>\n<script>PROJECT.clientView=true;</script>\n` +
      `<script src="/model/engine.js?v=${ENGINE_VERSION}"></script>\n` +
      `<script src="/v/s/engine-link.js?v=${v}"></script>`;
  } else {
    const safe = /^[a-z0-9-]+$/.test(scene) ? scene : "missing";
    sceneTags = `<div id="bq-native"></div>\n<script src="/v/s/${safe}.js?v=${v}"></script>`;
  }
  return (
    '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    `<title>${esc(meta.projectName)} — ${esc(meta.companyName || "بيت القصيد")}</title>` +
    '<link rel="icon" href="/logo.png">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Montserrat:wght@500;600&display=swap">' +
    `<link rel="stylesheet" href="/v/shell.css?v=${v}">` +
    "</head><body>" +
    '<div class="bq" dir="rtl">' +
    '<header class="bq-top"><img class="bq-logo" src="/logo.png" alt="بيت القصيد"><span class="bq-sep"></span>' +
    `<div class="bq-ttl"><h1>${esc(meta.projectName)}</h1>${sub ? `<p>${esc(sub)}</p>` : ""}</div>` +
    (co ? `<div class="bq-co">${co}</div>` : "") +
    "</header>" +
    '<div class="bq-main"><aside class="bq-side">' +
    '<nav class="bq-tabs" role="tablist">' +
    '<button class="bq-tab" role="tab" data-t="lay" aria-selected="true">الطبقات</button>' +
    '<button class="bq-tab" role="tab" data-t="sim" aria-selected="false">المحاكاة</button>' +
    '<button class="bq-tab" role="tab" data-t="proj" aria-selected="false">المشروع</button>' +
    "</nav>" +
    '<div class="bq-pane" id="bq-p-lay"></div><div class="bq-pane" id="bq-p-sim" hidden></div><div class="bq-pane" id="bq-p-proj" hidden></div>' +
    `<footer class="bq-foot"><span>© ${esc(meta.companyName || "شركة بيت القصيد للمقاولات والتجارة العامة")}</span>${meta.website ? `<span>${esc(meta.website)}</span>` : ""}</footer>` +
    "</aside>" +
    '<section class="bq-stage" id="bq-stage"><div id="three"></div><div id="labels"></div><div id="plan" hidden></div>' +
    '<div class="bq-floors" id="bq-floors" hidden></div><div class="bq-legend" id="bq-legend" hidden></div><div class="bq-hud" id="bq-hud" hidden></div>' +
    '<div class="bq-pad" id="bq-pad" hidden><span></span><button type="button" data-k="f" aria-label="للأمام">▲</button><span></span><button type="button" data-k="l" aria-label="يسار">◀</button><button type="button" data-k="b" aria-label="للخلف">▼</button><button type="button" data-k="r" aria-label="يمين">▶</button></div>' +
    '<div class="bq-views" id="bq-views"></div>' +
    '<div class="bq-load" id="bq-load"><img src="/logo.png" alt=""></div>' +
    "</section></div></div>\n" +
    `<script src="/v/core.js?v=${v}"></script>\n<script src="/v/shell.js?v=${v}"></script>\n` +
    sceneTags +
    "\n</body></html>"
  );
}
