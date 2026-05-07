"use client";

import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getProfile } from "@/lib/apiClient";
import { getChild, getSession, saveChild, saveUser } from "@/lib/localStorage";
import type { Child } from "@/types/user";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [child, setChild] = useState<Child | null>(null);

  useEffect(() => {
    const localChild = getChild();
    const session = getSession();
    setChild(localChild);

    if (!session?.userId) return;

    getProfile(session.userId).then((result) => {
      if (!result.ok) return;
      saveUser(result.data.user);
      if (result.data.child) {
        saveChild(result.data.child);
        setChild(result.data.child);
      }
    });
  }, []);

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-[32px] bg-gradient-to-br from-livoz-blue to-livoz-cyan p-6 text-white">
          <div className="inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-bold">
            Olá, {child?.name || "explorador"}!
          </div>
          <h1 className="mt-5 max-w-[320px] font-title text-3xl font-extrabold leading-tight">
            Hoje é dia de explorar {child?.targetLanguage || "um novo idioma"}.
          </h1>
          <p className="mt-3 leading-7 text-white/90">Missões leves, conversa simulada e progresso para acompanhar em família.</p>
          <div className="mt-5 grid h-24 w-24 place-items-center rounded-[28px] bg-livoz-yellow text-5xl shadow-lg">
            {child?.avatar || "⭐"}
          </div>
        </section>

        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-title text-xl font-extrabold">Progresso semanal</h2>
              <p className="text-sm text-slate-500">Avanço de desafios</p>
            </div>
            <strong className="text-2xl text-livoz-navy">62%</strong>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full w-[62%] rounded-full bg-gradient-to-r from-livoz-blue to-livoz-cyan" />
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-title text-xl font-extrabold">Missões de hoje</h2>
              <p className="text-sm text-slate-500">Escolha uma atividade divertida.</p>
            </div>
            <Link href="/missoes" className="text-sm font-extrabold text-livoz-blue">
              Ver tudo
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["🎙️", "Falar comigo", "Converse em inglês."],
              ["🧩", "Palavras novas", "Aprenda 5 palavras."],
              ["📚", "História curta", "Leia e responda."],
              ["🏆", "Desafio rápido", "Ganhe estrelas."],
            ].map(([icon, title, text]) => (
              <article key={title} className="min-h-36 rounded-[24px] border border-slate-100 bg-white p-4 shadow-card">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-[16px] bg-livoz-soft text-xl">{icon}</div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}
