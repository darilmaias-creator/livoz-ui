import { getChild, getSession, getUser, setSession } from "@/lib/localStorage";

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function isAuthenticated() {
  const session = getSession();
  const user = getUser();
  return Boolean(session?.userId && user?.id === session.userId);
}

export function hasCompleteProfile() {
  return Boolean(isAuthenticated() && getChild());
}

export function loginWithMockCredentials(email: string, password: string) {
  const user = getUser();

  if (!email || !password) {
    return { ok: false, message: "Preencha e-mail e senha para entrar." };
  }

  if (!user) {
    return { ok: false, message: "Ainda não encontramos uma conta. Faça o cadastro primeiro." };
  }

  if (user.email.toLowerCase() !== email.toLowerCase()) {
    return { ok: false, message: "Esse e-mail não está cadastrado no Livoz." };
  }

  setSession(user.id);
  return { ok: true, message: "Tudo certo!" };
}
