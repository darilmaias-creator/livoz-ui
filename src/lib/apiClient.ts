import type { Child, User } from "@/types/user";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    const body = (await response.json()) as { message?: string } & T;

    if (!response.ok) {
      return { ok: false, message: body.message || "Não foi possível completar a ação agora." };
    }

    return { ok: true, data: body as T };
  } catch {
    return { ok: false, message: "Banco indisponível. Salvamos localmente para você continuar." };
  }
}

export type RegisterUserPayload = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  confirmedResponsible: boolean;
  authorizedChildUse: boolean;
  acceptedAiPolicy: boolean;
};

export type RegisterChildPayload = Omit<Child, "id" | "createdAt">;

export function registerUser(payload: RegisterUserPayload) {
  return request<{ user: User }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload: { email: string; password: string }) {
  return request<{ user: User; child: Child | null }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerChild(payload: RegisterChildPayload) {
  return request<{ child: Child }>("/api/children", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getProfile(userId: string) {
  return request<{ user: User; child: Child | null; planName: string }>(`/api/me?userId=${encodeURIComponent(userId)}`);
}
