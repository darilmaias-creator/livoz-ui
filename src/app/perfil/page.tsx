"use client";

import { AppShell } from "@/components/AppShell";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getProfile } from "@/lib/apiClient";
import { clearSession, getChild, getSession, getUser, saveChild, saveUser } from "@/lib/localStorage";
import type { Child, User } from "@/types/user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [planName, setPlanName] = useState("Modo Gratuito");

  useEffect(() => {
    setUser(getUser());
    setChild(getChild());
    const session = getSession();

    if (!session?.userId) return;

    getProfile(session.userId).then((result) => {
      if (!result.ok) return;
      saveUser(result.data.user);
      setUser(result.data.user);
      setPlanName(result.data.planName);

      if (result.data.child) {
        saveChild(result.data.child);
        setChild(result.data.child);
      }
    });
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-[32px] bg-livoz-soft p-6">
          <h1 className="font-title text-3xl font-extrabold text-livoz-navy">Perfil</h1>
          <p className="mt-2 leading-7 text-slate-600">Dados básicos da conta familiar no Livoz.</p>
        </section>

        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card">
          <h2 className="font-title text-xl font-extrabold">Responsável</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <p><strong className="text-slate-900">Nome:</strong> {user?.name || "-"}</p>
            <p><strong className="text-slate-900">E-mail:</strong> {user?.email || "-"}</p>
            <p><strong className="text-slate-900">Telefone:</strong> {user?.phone || "-"}</p>
            <p><strong className="text-slate-900">CPF:</strong> campo preparado para validação futura</p>
          </div>
        </section>

        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card">
          <h2 className="font-title text-xl font-extrabold">Criança</h2>
          <div className="mt-4 flex items-start gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-livoz-yellow text-3xl">{child?.avatar || "⭐"}</div>
            <div className="grid gap-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">Nome:</strong> {child?.name || "-"}</p>
              <p><strong className="text-slate-900">Idioma escolhido:</strong> {child?.targetLanguage || "-"}</p>
              <p><strong className="text-slate-900">Nível inicial:</strong> {child?.level || "-"}</p>
              <p><strong className="text-slate-900">Plano atual:</strong> {planName}</p>
            </div>
          </div>
        </section>

        <PrimaryButton type="button" onClick={handleLogout} className="mt-6 w-full bg-livoz-orange">
          Sair
        </PrimaryButton>
      </AppShell>
    </ProtectedRoute>
  );
}
