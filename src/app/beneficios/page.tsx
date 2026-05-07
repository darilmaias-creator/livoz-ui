"use client";

import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const benefits = [
  ["💚", "Bolsa Socioeducativa", "Gratuidade total para famílias de baixa renda comprovada.", "bg-cyan-50"],
  ["🎓", "Mérito Bimestral", "Desconto ou gratuidade pela média geral do boletim.", "bg-blue-50"],
  ["🏅", "Prova Desafio", "Benefício mensal pela nota de prova ou atividade específica.", "bg-yellow-50"],
  ["🔓", "Modo Gratuito", "Acesso limitado enquanto a análise está pendente ou sem comprovação.", "bg-orange-50"],
];

export default function BenefitsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-[32px] bg-livoz-soft p-6">
          <h1 className="font-title text-3xl font-extrabold text-livoz-navy">Benefícios</h1>
          <p className="mt-2 leading-7 text-slate-600">Tela informativa, sem análise ou upload nesta etapa.</p>
        </section>

        <div className="mt-5 grid gap-4">
          {benefits.map(([icon, title, text, color]) => (
            <article key={title} className="flex gap-4 rounded-[26px] border border-slate-100 bg-white p-5 shadow-card">
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-[18px] text-2xl ${color}`}>{icon}</span>
              <div>
                <h2 className="font-bold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
