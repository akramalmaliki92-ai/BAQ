import { db, uid, nowIso } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@/lib/auth/types";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: number;
  is_demo: number;
  created_at: string;
}

export async function listUsers(): Promise<UserRow[]> {
  return (await db
    .prepare("SELECT id, name, email, role, active, is_demo, created_at FROM users ORDER BY created_at")
    .all()) as unknown as UserRow[];
}

export async function getUser(id: string): Promise<UserRow | undefined> {
  return (await db
    .prepare("SELECT id, name, email, role, active, is_demo, created_at FROM users WHERE id = ?")
    .get(id)) as unknown as UserRow | undefined;
}

export async function createUser(
  input: { name: string; email: string; password: string; role: Role },
  isDemo = false
): Promise<UserRow> {
  const id = uid("usr_");
  const hash = await hashPassword(input.password);
  await db.prepare(
    "INSERT INTO users (id, name, email, password_hash, role, is_demo) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, input.name, input.email.toLowerCase(), hash, input.role, isDemo ? 1 : 0);
  return (await getUser(id))!;
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  await db.prepare("UPDATE users SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
}

export async function updateUserRole(id: string, role: Role): Promise<void> {
  await db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword);
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, id);
}

export function touch(): string {
  return nowIso();
}
