"use client";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getBenefitLabel, type BenefitType } from "@/lib/benefits";
import { formatCurrencyBRL } from "@/lib/pricing";
import { useEffect, useState } from "react";

type AdminDashboardResponse = {
  message?: string;
  totalUsers: number;
  totalChildren: number;
  activeSubscriptions: number;
  pendingBenefitRequests: number;
  approvedPayments: number;
  pendingPayments: number;
  estimatedRevenue: number;
  latestBenefitRequests: Array<{
    id: string;
    type: BenefitType;
    status: string;
    discountPercentage: number;
    submittedAt: string;
    user: {
      name: string;
      email: string;
    };
    child: {
      name: string;
    };
  }>;
  latestPayments: Array<{
    id: string;
    provider: string;
    providerStatus: string | null;
    amount: string;
    discountPercentage: number;
    finalAmount: string;
    status: string;
    createdAt: string;
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
  }>;
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
  EXPIRED: "Expirado",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/admin/dashboard");
        const payload = (await response.json()) as AdminDashboardResponse;

        if (!response.ok) {
          setError(payload.message || "Não foi possível carregar o painel admin.");
          return;
        }

        setData(payload);
      } catch {
        setError("Não foi possível conectar ao Livoz agora.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const cards = data
    ? [
        { label: "Responsáveis", value: data.totalUsers, tone: "bg-blue-50 text-livoz-navy" },
        { label: "Crianças", value: data.totalChildren, tone: "bg-cyan-50 text-livoz-navy" },
        { label: "Assinaturas ativas", value: data.activeSubscriptions, tone: "bg-green-50 text-green-700" },
        { label: "Benefícios pendentes", value: data.pendingBenefitRequests, tone: "bg-yellow-50 text-yellow-700" },
        { label: "Pagamentos aprovados", value: data.approvedPayments, tone: "bg-emerald-50 text-emerald-700" },
        { label: "Pagamentos pendentes", value: data.pendingPayments, tone: "bg-orange-50 text-orange-700" },
        { label: "Receita estimada", value: formatCurrencyBRL(data.estimatedRevenue), tone: "bg-slate-100 text-slate-900" },
      ]
    : [];

  return (
    <AdminProtectedRoute>
      <AdminLayout
        title="Dashboard Admin"
        description="Visão geral da operação do Livoz."
      >
        {isLoading ? (
          <section className="rounded-[24px] bg-white p-6 text-center shadow-card">
            <h2 className="font-title text-2xl font-extrabold text-livoz-navy">Carregando métricas...</h2>
            <p className="mt-2 text-sm text-slate-500">Buscando os dados administrativos.</p>
          </section>
        ) : error ? (
          <section className="rounded-[24px] bg-orange-50 p-6 text-center text-orange-700 shadow-card">
            <h2 className="font-title text-2xl font-extrabold">Ops!</h2>
            <p className="mt-2 text-sm font-bold">{error}</p>
          </section>
        ) : data ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <article key={card.label} className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-card">
                  <p className="text-sm font-bold text-slate-500">{card.label}</p>
                  <div className={`mt-4 inline-flex rounded-[18px] px-4 py-3 text-2xl font-extrabold ${card.tone}`}>
                    {card.value}
                  </div>
                </article>
              ))}
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-2">
              <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-title text-xl font-extrabold text-livoz-navy">Últimas solicitações</h2>
                    <p className="text-sm text-slate-500">Benefícios enviados recentemente.</p>
                  </div>
                </div>

                {data.latestBenefitRequests.length === 0 ? (
                  <p className="mt-5 text-sm text-slate-500">Nenhuma solicitação encontrada.</p>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {data.latestBenefitRequests.map((request) => (
                      <div key={request.id} className="rounded-[18px] bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-slate-900">{getBenefitLabel(request.type)}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {request.user.name} · {request.child.name}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-livoz-blue">
                            {statusLabels[request.status] || request.status}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          Desconto: {request.discountPercentage}% · Enviado em {formatDate(request.submittedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
                <div>
                  <h2 className="font-title text-xl font-extrabold text-livoz-navy">Últimos pagamentos</h2>
                  <p className="text-sm text-slate-500">Tentativas e aprovações recentes.</p>
                </div>

                {data.latestPayments.length === 0 ? (
                  <p className="mt-5 text-sm text-slate-500">Nenhum pagamento encontrado.</p>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {data.latestPayments.map((payment) => (
                      <div key={payment.id} className="rounded-[18px] bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-slate-900">{payment.plan.name}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {payment.user.name} · {payment.child.name}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-livoz-blue">
                            {statusLabels[payment.status] || payment.status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-1 text-sm text-slate-600">
                          <p>Valor final: {formatCurrencyBRL(Number(payment.finalAmount))}</p>
                          <p>Desconto: {payment.discountPercentage}% · {formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>
          </>
        ) : null}
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
