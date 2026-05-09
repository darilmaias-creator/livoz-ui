"use client";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getBenefitLabel, type BenefitType } from "@/lib/benefits";
import { useEffect, useState } from "react";

type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "EXPIRED" | "CANCELED";

type AdminSubscription = {
  id: string;
  status: SubscriptionStatus;
  benefitType: BenefitType;
  discountPercentage: number;
  startsAt: string;
  endsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  user: {
    name: string;
    email: string;
  };
  child: {
    name: string;
  };
  plan: {
    name: string;
  };
};

type AdminSubscriptionsResponse = {
  message?: string;
  subscriptions?: AdminSubscription[];
};

const statusLabels: Record<SubscriptionStatus, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  PENDING: "Pendente",
  EXPIRED: "Expirada",
  CANCELED: "Cancelada",
};

const statusOptions: Array<{ value: SubscriptionStatus | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "INACTIVE", label: "INACTIVE" },
  { value: "PENDING", label: "PENDING" },
  { value: "EXPIRED", label: "EXPIRED" },
  { value: "CANCELED", label: "CANCELED" },
];

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

function shorten(value: string | null) {
  if (!value) return "-";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSubscriptions(currentStatus = statusFilter) {
    setIsLoading(true);
    setError("");

    try {
      const query = currentStatus ? `?status=${currentStatus}` : "";
      const response = await fetch(`/api/admin/subscriptions${query}`);
      const data = (await response.json()) as AdminSubscriptionsResponse;

      if (!response.ok || !data.subscriptions) {
        setError(data.message || "Não foi possível carregar as assinaturas.");
        return;
      }

      setSubscriptions(data.subscriptions);
    } catch {
      setError("Não foi possível conectar ao Livoz agora.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSubscriptions(statusFilter);
  }, [statusFilter]);

  return (
    <AdminProtectedRoute>
      <AdminLayout
        title="Assinaturas"
        description="Visualize planos, benefícios e vínculos Stripe das crianças."
      >
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-title text-xl font-extrabold text-livoz-navy">Lista de assinaturas</h2>
              <p className="mt-1 text-sm text-slate-500">Acompanhamento operacional, sem cancelamento manual nesta etapa.</p>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as SubscriptionStatus | "")}
              className="min-h-11 rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
            >
              {statusOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-slate-100 bg-white shadow-card">
          {isLoading ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Carregando assinaturas...</div>
          ) : error ? (
            <div className="p-6 text-center text-sm font-bold text-orange-700">{error}</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Nenhuma assinatura encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Criança</th>
                    <th className="px-4 py-3">Plano</th>
                    <th className="px-4 py-3">Benefício</th>
                    <th className="px-4 py-3">Desconto</th>
                    <th className="px-4 py-3">Início</th>
                    <th className="px-4 py-3">Validade/Fim</th>
                    <th className="px-4 py-3">Stripe Customer</th>
                    <th className="px-4 py-3">Stripe Subscription</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-livoz-navy">
                          {statusLabels[subscription.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{subscription.user.name}</p>
                        <p className="text-xs text-slate-500">{subscription.user.email}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{subscription.child.name}</td>
                      <td className="px-4 py-4 text-slate-600">{subscription.plan.name}</td>
                      <td className="px-4 py-4 text-slate-600">{getBenefitLabel(subscription.benefitType)}</td>
                      <td className="px-4 py-4 text-slate-600">{subscription.discountPercentage}%</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(subscription.startsAt)}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(subscription.endsAt)}</td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600" title={subscription.stripeCustomerId || ""}>
                        {shorten(subscription.stripeCustomerId)}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600" title={subscription.stripeSubscriptionId || ""}>
                        {shorten(subscription.stripeSubscriptionId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
