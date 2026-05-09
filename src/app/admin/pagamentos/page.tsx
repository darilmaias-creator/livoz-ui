"use client";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatCurrencyBRL } from "@/lib/pricing";
import { useEffect, useState } from "react";

type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED" | "REFUNDED";

type AdminPayment = {
  id: string;
  provider: string;
  providerPaymentId: string | null;
  providerStatus: string | null;
  amount: string;
  discountPercentage: number;
  finalAmount: string;
  status: PaymentStatus;
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
};

type AdminPaymentsResponse = {
  message?: string;
  payments?: AdminPayment[];
};

const statusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const statusOptions: Array<{ value: PaymentStatus | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "PENDING" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "REJECTED", label: "REJECTED" },
  { value: "CANCELED", label: "CANCELED" },
  { value: "REFUNDED", label: "REFUNDED" },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPayments(currentStatus = statusFilter) {
    setIsLoading(true);
    setError("");

    try {
      const query = currentStatus ? `?status=${currentStatus}` : "";
      const response = await fetch(`/api/admin/payments${query}`);
      const data = (await response.json()) as AdminPaymentsResponse;

      if (!response.ok || !data.payments) {
        setError(data.message || "Não foi possível carregar os pagamentos.");
        return;
      }

      setPayments(data.payments);
    } catch {
      setError("Não foi possível conectar ao Livoz agora.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments(statusFilter);
  }, [statusFilter]);

  return (
    <AdminProtectedRoute>
      <AdminLayout
        title="Pagamentos"
        description="Acompanhe tentativas e confirmações de pagamento."
      >
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-title text-xl font-extrabold text-livoz-navy">Histórico de pagamentos</h2>
              <p className="mt-1 text-sm text-slate-500">Visualização dos registros recebidos pelo checkout.</p>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PaymentStatus | "")}
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
            <div className="p-6 text-center text-sm font-bold text-slate-500">Carregando pagamentos...</div>
          ) : error ? (
            <div className="p-6 text-center text-sm font-bold text-orange-700">{error}</div>
          ) : payments.length === 0 ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Nenhum pagamento encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Criança</th>
                    <th className="px-4 py-3">Plano</th>
                    <th className="px-4 py-3">Valor base</th>
                    <th className="px-4 py-3">Desconto</th>
                    <th className="px-4 py-3">Valor final</th>
                    <th className="px-4 py-3">Provedor</th>
                    <th className="px-4 py-3">Status provedor</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-livoz-navy">
                          {statusLabels[payment.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{payment.user.name}</p>
                        <p className="text-xs text-slate-500">{payment.user.email}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{payment.child.name}</td>
                      <td className="px-4 py-4 text-slate-600">{payment.plan.name}</td>
                      <td className="px-4 py-4 text-slate-600">{formatCurrencyBRL(Number(payment.amount))}</td>
                      <td className="px-4 py-4 text-slate-600">{payment.discountPercentage}%</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{formatCurrencyBRL(Number(payment.finalAmount))}</td>
                      <td className="px-4 py-4 text-slate-600">{payment.provider}</td>
                      <td className="px-4 py-4 text-slate-600">{payment.providerStatus || "-"}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(payment.createdAt)}</td>
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
