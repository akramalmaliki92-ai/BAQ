// إدارة الجلسات على مستوى الخادم بالكامل: التوكن يُخزَّن في كووكي HttpOnly، ويُتحقق من صلاحيته
// وصلاحية المستخدم من جدول sessions/users في كل طلب — وليس بإخفاء عناصر الواجهة فقط.
import { cookies } from "next/headers";
import { db, uid, nowIso } from "@/lib/db/client";
import type { SessionUser, Role } from "./types";

const COOKIE_NAME = "baq_session";
const SESSION_DAYS = 7;

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  active: number;
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  return (await db
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email)) as unknown as UserRow | undefined;
}

export async function createSession(userId: string): Promise<void> {
  const id = uid("sess_");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    id,
    userId,
    expires
  );
  const jar = await cookies();
  jar.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
  }
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const row = (await db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.active, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .get(token)) as
    | { id: string; name: string; email: string; role: Role; active: number; expires_at: string }
    | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
    return null;
  }
  if (!row.active) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: !!row.active,
  };
}

export function touchNow(): string {
  return nowIso();
}
