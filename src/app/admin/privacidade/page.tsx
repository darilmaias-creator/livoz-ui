"use client";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";

type PrivacyRequestType = "DATA_CORRECTION" | "ACCOUNT_DELETION" | "CHILD_DATA_DELETION";
type PrivacyRequestStatus = "PENDING" | "IN_REVIEW" | "COMPLETED" | "REJECTED";

type AdminPrivacyRequest = {
  id: string;
  type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  message: string | null;
  createdAt: string;
  reviewedAt: string | null;
  adminNotes: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  child: {
    id: string;
    name: string;
    age: number;
    schoolYear: string;
  } | null;
};

type AdminPrivacyRequestsResponse = {
  message?: string;
  privacyRequests?: AdminPrivacyRequest[];
};

const typeLabels: Record<PrivacyRequestType, string> = {
  DATA_CORRECTION: "Correção de dados",
  ACCOUNT_DELETION: "Exclusão da conta",
  CHILD_DATA_DELETION: "Exclusão dos dados da criança",
};

const statusLabels: Record<PrivacyRequestStatus, string> = {
  PENDING: "Pendente",
  IN_REVIEW: "Em análise",
  COMPLETED: "Concluída",
  REJECTED: "Recusada",
};

const statusOptions: Array<{ value: PrivacyRequestStatus | ""; label: string }> = [
  { value: "PENDING", label: "Pendentes" },
  { value: "IN_REVIEW", label: "Em análise" },
  { value: "COMPLETED", label: "Concluídas" },
  { value: "REJECTED", label: "Recusadas" },
  { value: "", label: "Todas" },
];

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default function AdminPrivacyPage() {
  const [requests, setRequests] = useState<AdminPrivacyRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<PrivacyRequestStatus | "">("PENDING");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequests(currentStatus = statusFilter) {
    setIsLoading(true);
    setError("");

    try {
      const query = currentStatus ? `?status=${currentStatus}` : "";
      const response = await fetch(`/api/admin/privacy-requests${query}`);
      const data = (await response.json()) as AdminPrivacyRequestsResponse;

      if (!response.ok || !data.privacyRequests) {
        setError(data.message || "Não foi possível carregar as solicitações de privacidade.");
        return;
      }

      setRequests(data.privacyRequests);
    } catch {
      setError("Não foi possível conectar ao Livoz agora.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests(statusFilter);
  }, [statusFilter]);

  return (
    <AdminProtectedRoute>
      <AdminLayout
        title="Privacidade"
        description="Acompanhe solicitações de correção e exclusão de dados."
      >
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-title text-xl font-extrabold text-livoz-navy">Solicitações de privacidade</h2>
              <p className="mt-1 text-sm text-slate-500">
                No MVP, a análise e execução das solicitações é manual.
              </p>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PrivacyRequestStatus | "")}
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
            <div className="p-6 text-center text-sm font-bold text-slate-500">
              Carregando solicitações...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm font-bold text-orange-700">{error}</div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">
              Nenhuma solicitação encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Criança</th>
                    <th className="px-4 py-3">Mensagem</th>
                    <th className="px-4 py-3">Criada em</th>
                    <th className="px-4 py-3">Revisada em</th>
                    <th className="px-4 py-3">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-4 font-bold text-slate-900">{typeLabels[request.type]}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-livoz-navy">
                          {statusLabels[request.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        <strong className="block text-slate-900">{request.user.name}</strong>
                        {request.user.email}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {request.child ? (
                          <>
                            <strong className="block text-slate-900">{request.child.name}</strong>
                            {request.child.age} anos, {request.child.schoolYear}
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{request.message || "-"}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(request.createdAt)}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(request.reviewedAt)}</td>
                      <td className="px-4 py-4 text-slate-600">{request.adminNotes || "-"}</td>
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
