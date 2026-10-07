import { getSetting } from "@/lib/repo/designRequests";

// الاتصال بورك فلو n8n «20 - استبيان التصميم: رفع الصور والتنبيه».
// الرابط والمفتاح السري محفوظان في جدول app_settings (المفتاحان n8n_design_url و n8n_design_key)،
// وليسا في الكود لأن المستودع عام.
async function call<T>(body: Record<string, unknown>, timeoutMs = 25000): Promise<T> {
  const [url, key] = await Promise.all([getSetting("n8n_design_url"), getSetting("n8n_design_key")]);
  if (!url || !key) throw new Error("إعدادات ربط n8n غير موجودة");
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-baq-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string };
  if (!res.ok || !data.ok) throw new Error(data.error || `n8n ${res.status}`);
  return data;
}

export function createDriveFolder(name: string) {
  return call<{ folderId: string; link: string }>({ action: "folder", name });
}

export function uploadToDrive(folderId: string, filename: string, mime: string, b64: string) {
  return call<{ fileId: string; link: string }>({ action: "upload", folderId, filename, mime, file_b64: b64 }, 60000);
}

export function notifyTelegram(p: { title: string; name: string; phone: string; governorate: string; lines: string[]; photos: string; url: string }) {
  return call<{ ok: boolean }>({ action: "notify", ...p });
}

export function driveFolderUrl(id: string) {
  return id ? `https://drive.google.com/drive/folders/${id}` : "";
}
