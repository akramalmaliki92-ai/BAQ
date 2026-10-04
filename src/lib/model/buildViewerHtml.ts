import { VIEWER_HEAD } from "./viewerHead";

// يبني صفحة العارض الكاملة: واجهة القالب + بيانات المشروع (model_js) + المحرك العام.
// تُخدَم هذه الصفحة دائماً مع ترويسة CSP «sandbox allow-scripts» فتعمل بأصل معزول (opaque origin)
// لا يصل إلى جلسة الموقع ولا إلى ملفات تعريف الارتباط، حتى لو فُتحت في تبويب مستقل.
export const ENGINE_VERSION = "65e92f499c";

export function buildViewerHtml(modelJs: string, clientView: boolean): string {
  const safeJs = modelJs.replace(/<\/script/gi, "<\\/script");
  return (
    '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    "<style>body{margin:0}</style></head><body>" +
    VIEWER_HEAD +
    "\n<script>\n" +
    safeJs +
    "\n</script>\n<script>PROJECT.clientView=" +
    (clientView ? "true" : "false") +
    ";</script>\n" +
    `<script src="/model/engine.js?v=${ENGINE_VERSION}"></script>\n</body></html>`
  );
}

export const VIEWER_HEADERS: Record<string, string> = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": "sandbox allow-scripts allow-downloads",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
};
