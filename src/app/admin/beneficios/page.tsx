"use client";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getBenefitLabel, type BenefitType } from "@/lib/benefits";
import { formatCurrencyBRL } from "@/lib/pricing";
import { useEffect, useState } from "react";

type BenefitStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

type AdminBenefitRequest = {
  id: string;
  type: BenefitType;
  status: BenefitStatus;
  declaredIncome: string | null;
  schoolAverage: string | null;
  challengeGrade: string | null;
  discountPercentage: number;
  submittedAt: string;
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
  };
};

type AdminBenefitsResponse = {
  message?: string;
  benefitRequests?: AdminBenefitRequest[];
};

type ReviewResponse = {
  message?: string;
  benefitRequest?: {
    id: string;
  };
};

const statusLabels: Record<BenefitStatus, string> = {
  PENDING: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  EXPIRED: "Expirado",
};

const statusOptions: Array<{ value: BenefitStatus | ""; label: string }> = [
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovadas" },
  { value: "REJECTED", label: "Recusadas" },
  { value: "EXPIRED", label: "Expiradas" },
  { value: "", label: "Todas" },
];

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

function formatDecimal(value: string | null) {
  if (!value) return "-";
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function AdminBenefitsPage() {
  const [requests, setRequests] = useState<AdminBenefitRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<BenefitStatus | "">("PENDING");
  const [notesByRequest, setNotesByRequest] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadRequests(currentStatus = statusFilter) {
    setIsLoading(true);
    setError("");

    try {
      const query = currentStatus ? `?status=${currentStatus}` : "";
      const response = await fetch(`/api/admin/benefits${query}`);
      const data = (await response.json()) as AdminBenefitsResponse;

      if (!response.ok) {
        setError(data.message || "Não foi possível carregar as solicitações.");
        return;
      }

      setRequests(data.benefitRequests || []);
    } catch {
      setError("Não foi possível conectar ao Livoz agora.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests(statusFilter);
  }, [statusFilter]);

  async function reviewRequest(requestId: string, status: "APPROVED" | "REJECTED") {
    setReviewingId(requestId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/benefits/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminNotes: notesByRequest[requestId] || "",
        }),
      });
      const data = (await response.json()) as ReviewResponse;

      if (!response.ok || !data.benefitRequest) {
        setError(data.message || "Não foi possível revisar a solicitação.");
        return;
      }

      setSuccess(status === "APPROVED" ? "Solicitação aprovada." : "Solicitação recusada.");
      await loadRequests(statusFilter);
    } catch {
      setError("Não foi possível conectar ao Livoz agora.");
    } finally {
      setReviewingId("");
    }
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout
        title="Benefícios"
        description="Analise solicitações e aplique benefícios às assinaturas."
      >
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-title text-xl font-extrabold text-livoz-navy">Solicitações</h2>
              <p className="mt-1 text-sm text-slate-500">Filtre por status e revise pedidos pendentes.</p>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as BenefitStatus | "")}
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

        {success ? (
          <p className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm font-extrabold text-green-700">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-extrabold text-orange-700">
            {error}
          </p>
        ) : null}

        <section className="mt-6 grid gap-4">
          {isLoading ? (
            <article className="rounded-[24px] bg-white p-5 text-slate-600 shadow-card">Carregando solicitações...</article>
          ) : requests.length === 0 ? (
            <article className="rounded-[24px] bg-white p-5 text-slate-600 shadow-card">Nenhuma solicitação encontrada.</article>
          ) : (
            requests.map((request) => (
              <article key={request.id} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-title text-2xl font-extrabold text-livoz-navy">{getBenefitLabel(request.type)}</h2>
                    <p className="mt-1 text-sm font-bold text-livoz-blue">{statusLabels[request.status]}</p>
                  </div>
                  <span className="rounded-full bg-livoz-soft px-4 py-2 text-sm font-extrabold text-livoz-navy">
                    {request.discountPercentage}% de desconto
                  </span>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-600 lg:grid-cols-3">
                  <p><strong className="text-slate-900">Responsável:</strong> {request.user.name}</p>
                  <p><strong className="text-slate-900">E-mail:</strong> {request.user.email}</p>
                  <p><strong className="text-slate-900">Criança:</strong> {request.child.name}</p>
                  <p><strong className="text-slate-900">Idade:</strong> {request.child.age}</p>
                  <p><strong className="text-slate-900">Ano escolar:</strong> {request.child.schoolYear}</p>
                  <p><strong className="text-slate-900">Data de envio:</strong> {formatDate(request.submittedAt)}</p>
                  <p><strong className="text-slate-900">Data de revisão:</strong> {formatDate(request.reviewedAt)}</p>
                  <p><strong className="text-slate-900">Renda declarada:</strong> {request.declaredIncome ? formatCurrencyBRL(Number(request.declaredIncome)) : "-"}</p>
                  <p><strong className="text-slate-900">Média escolar:</strong> {formatDecimal(request.schoolAverage)}</p>
                  <p><strong className="text-slate-900">Nota Prova Desafio:</strong> {formatDecimal(request.challengeGrade)}</p>
                  <p><strong className="text-slate-900">Desconto calculado:</strong> {request.discountPercentage}%</p>
                  <p><strong className="text-slate-900">Observação:</strong> {request.adminNotes || "-"}</p>
                </div>

                {request.status === "PENDING" ? (
                  <>
                    <label className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
                      Observação do admin
                      <textarea
                        value={notesByRequest[request.id] || ""}
                        onChange={(event) =>
                          setNotesByRequest((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                        className="min-h-24 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
                        placeholder="Ex.: Aprovado para teste MVP."
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void reviewRequest(request.id, "APPROVED")}
                        disabled={reviewingId === request.id}
                        className="rounded-[18px] bg-green-600 px-5 py-3 font-extrabold text-white transition hover:bg-green-700 disabled:opacity-60"
                      >
                        {reviewingId === request.id ? "Revisando..." : "Aprovar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void reviewRequest(request.id, "REJECTED")}
                        disabled={reviewingId === request.id}
                        className="rounded-[18px] bg-livoz-orange px-5 py-3 font-extrabold text-white transition disabled:opacity-60"
                      >
                        {reviewingId === request.id ? "Revisando..." : "Recusar"}
                      </button>
                    </div>
                  </>
                ) : null}
              </article>
            ))
          )}
        </section>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
