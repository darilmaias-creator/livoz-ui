"use client";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatCurrencyBRL } from "@/lib/pricing";
import { useEffect, useState } from "react";

type AdminPlan = {
  id: string;
  name: string;
  slug: string;
  price: string;
  description: string | null;
  limitsJson: unknown;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminPlansResponse = {
  message?: string;
  plans?: AdminPlan[];
};

type PlanLimits = {
  dailyMissions?: number;
  dailyVoiceMinutes?: number;
  aiTextMessages?: number;
  feedback?: string;
  benefits?: string[];
};

function getPlanLimits(limitsJson: unknown): string[] {
  if (!limitsJson || typeof limitsJson !== "object") {
    return ["Limites não configurados."];
  }

  const limits = limitsJson as PlanLimits;
  const items: string[] = [];

  if (typeof limits.dailyMissions === "number") {
    items.push(`${limits.dailyMissions} missão${limits.dailyMissions === 1 ? "" : "es"} por dia`);
  }

  if (typeof limits.dailyVoiceMinutes === "number") {
    items.push(`${limits.dailyVoiceMinutes} min de voz por dia`);
  }

  if (typeof limits.aiTextMessages === "number") {
    items.push(`${limits.aiTextMessages} mensagens de IA`);
  }

  if (limits.feedback) {
    items.push(limits.feedback === "complete" ? "Feedback completo" : "Feedback básico");
  }

  if (Array.isArray(limits.benefits)) {
    items.push(...limits.benefits);
  }

  return items.length > 0 ? items : ["Limites não configurados."];
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlans() {
      try {
        const response = await fetch("/api/admin/plans");
        const data = (await response.json()) as AdminPlansResponse;

        if (!response.ok || !data.plans) {
          setError(data.message || "Não foi possível carregar os planos.");
          return;
        }

        setPlans(data.plans);
      } catch {
        setError("Não foi possível conectar ao Livoz agora.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPlans();
  }, []);

  return (
    <AdminProtectedRoute>
      <AdminLayout
        title="Planos"
        description="Visualize planos, preços e limites configurados."
      >
        {isLoading ? (
          <section className="rounded-[24px] bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-card">
            Carregando planos...
          </section>
        ) : error ? (
          <section className="rounded-[24px] bg-orange-50 p-6 text-center text-sm font-bold text-orange-700 shadow-card">
            {error}
          </section>
        ) : plans.length === 0 ? (
          <section className="rounded-[24px] bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-card">
            Nenhum plano encontrado.
          </section>
        ) : (
          <section className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-title text-2xl font-extrabold text-livoz-navy">{plan.name}</h2>
                    <p className="mt-1 font-mono text-xs text-slate-500">{plan.slug}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      plan.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {plan.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <p className="mt-5 text-3xl font-extrabold text-slate-900">
                  {formatCurrencyBRL(Number(plan.price))}
                </p>

                <p className="mt-4 min-h-16 text-sm leading-6 text-slate-600">
                  {plan.description || "Sem descrição configurada."}
                </p>

                <div className="mt-5 rounded-[20px] bg-slate-50 p-4">
                  <h3 className="text-sm font-extrabold text-slate-900">Limites</h3>
                  <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                    {getPlanLimits(plan.limitsJson).map((limit) => (
                      <li key={limit} className="flex gap-2">
                        <span className="font-extrabold text-livoz-cyan">✓</span>
                        <span>{limit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </section>
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
