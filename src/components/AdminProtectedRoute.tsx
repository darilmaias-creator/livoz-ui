"use client";

import { getSession } from "@/lib/storage";
import { isKidModeActive } from "@/lib/kidMode";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type AdminMeResponse = {
  message?: string;
  isAdmin?: boolean;
};

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [message, setMessage] = useState("Verificando acesso administrativo...");

  useEffect(() => {
    const session = getSession();

    if (isKidModeActive()) {
      window.sessionStorage.setItem(
        "kidModeBlockedMessage",
        "Esta área é protegida pelo PIN do responsável.",
      );
      router.replace("/dashboard");
      return;
    }

    if (!session.userId) {
      router.replace("/login");
      return;
    }

    async function checkAdminAccess(userId: string) {
      try {
        const response = await fetch(`/api/admin/me?userId=${encodeURIComponent(userId)}`);
        const data = (await response.json()) as AdminMeResponse;

        if (!response.ok || !data.isAdmin) {
          setMessage("Acesso restrito ao administrador.");
          setIsAllowed(false);
          return;
        }

        setIsAllowed(true);
      } catch {
        setMessage("Não foi possível verificar o acesso admin agora.");
        setIsAllowed(false);
      } finally {
        setIsChecking(false);
      }
    }

    void checkAdminAccess(session.userId);
  }, [router]);

  if (isChecking) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center text-slate-500">
        <p>{message}</p>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="mx-auto grid min-h-screen max-w-[440px] place-items-center bg-white px-6 text-center shadow-soft">
        <section className="rounded-[28px] bg-orange-50 p-6">
          <h1 className="font-title text-2xl font-extrabold text-livoz-navy">
            Acesso restrito ao administrador.
          </h1>
          <p className="mt-3 text-sm leading-6 text-orange-700">{message}</p>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
