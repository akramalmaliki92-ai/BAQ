// خانة توقيع وختم الطرف الأول في عرض السعر والعقد. عند التصدير الموقّع تُطبع صورة الختم وفوقها
// صورة التوقيع داخل الخانة نفسها؛ وفي التصدير العادي تبقى الخانة فارغة للتوقيع اليدوي كما كانت.
export interface SealImages {
  signature: string | null;
  stamp: string | null;
}

export const SEAL_CSS = `
  .seal { position: relative; height: 92px; margin: 4px auto 2px; width: 210px; }
  .seal img { position: absolute; object-fit: contain; mix-blend-mode: multiply; }
  .seal .stamp { width: 92px; height: 92px; top: 0; left: 50%; transform: translateX(-62%) rotate(-8deg); opacity: .9; }
  .seal .sig { width: 150px; height: 66px; bottom: 0; left: 50%; transform: translateX(-30%); }
`;

// تقبل فقط صور data URL من الأنواع المسموحة (تُخزَّن من صفحة الإعدادات) — لا روابط خارجية.
function safeImg(src: string | null): string | null {
  return src && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src) ? src : null;
}

export function sealHtml(seal?: SealImages): string {
  if (!seal) return "<br><br>";
  const stamp = safeImg(seal.stamp);
  const sig = safeImg(seal.signature);
  if (!stamp && !sig) return "<br><br>";
  return `<div class="seal">${stamp ? `<img class="stamp" src="${stamp}" alt="">` : ""}${sig ? `<img class="sig" src="${sig}" alt="">` : ""}</div>`;
}
