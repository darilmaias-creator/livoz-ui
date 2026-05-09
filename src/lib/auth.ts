import { getSession } from "@/lib/storage";

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function isAuthenticated() {
  const session = getSession();
  return Boolean(session.userId);
}

export function hasCompleteProfile() {
  const session = getSession();
  return Boolean(isAuthenticated() && session.childId);
}

export function loginWithMockCredentials(email: string, password: string) {
  if (!email || !password) {
    return { ok: false, message: "Preencha e-mail e senha para entrar." };
  }

  return { ok: false, message: "Use o login conectado ao banco de dados." };
}
