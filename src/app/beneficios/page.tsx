"use client";

import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getBenefitLabel, type BenefitType as BenefitLabelType } from "@/lib/benefits";
import { getSession } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type BenefitType = "SOCIOEDUCATIVA" | "MERITO_BIMESTRAL" | "PROVA_DESAFIO";

type BenefitResponse = {
  message?: string;
  benefitRequest?: {
    id: string;
  };
};

type BenefitRequestItem = {
  id: string;
  type: BenefitLabelType;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  discountPercentage: number;
  submittedAt: string;
  reviewedAt: string | null;
  expiresAt: string | null;
  adminNotes: string | null;
};

type BenefitsListResponse = {
  message?: string;
  benefitRequests?: BenefitRequestItem[];
};

const statusLabels = {
  PENDING: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  EXPIRED: "Expirado",
};

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default function BenefitsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [declaredIncome, setDeclaredIncome] = useState("");
  const [schoolAverage, setSchoolAverage] = useState("");
  const [challengeGrade, setChallengeGrade] = useState("");
  const [loadingType, setLoadingType] = useState<BenefitType | "">("");
  const [benefitRequests, setBenefitRequests] = useState<BenefitRequestItem[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();

    if (!session.userId || !session.childId) {
      router.replace("/login");
      return;
    }

    setUserId(session.userId);
    setChildId(session.childId);
    void loadBenefitRequests(session.childId);
  }, [router]);

  async function loadBenefitRequests(currentChildId: string) {
    setIsRequestsLoading(true);

    try {
      const response = await fetch(`/api/benefits?childId=${encodeURIComponent(currentChildId)}`);
      const data = (await response.json()) as BenefitsListResponse;

      if (!response.ok) {
        setError(data.message || "Não foi possível carregar suas solicitações.");
        return;
      }

      setBenefitRequests(data.benefitRequests || []);
    } catch {
      setError("Não foi possível conectar ao Livoz agora.");
    } finally {
      setIsRequestsLoading(false);
    }
  }

  async function requestBenefit(type: BenefitType) {
    setSuccess("");
    setError("");

    if (!userId || !childId) {
      router.push("/login");
      return;
    }

    const parsedSchoolAverage = Number(schoolAverage);
    const parsedChallengeGrade = Number(challengeGrade);

    if (type === "MERITO_BIMESTRAL" && (Number.isNaN(parsedSchoolAverage) || parsedSchoolAverage < 0 || parsedSchoolAverage > 10)) {
      setError("Informe uma média escolar entre 0 e 10.");
      return;
    }

    if (type === "PROVA_DESAFIO" && (Number.isNaN(parsedChallengeGrade) || parsedChallengeGrade < 0 || parsedChallengeGrade > 10)) {
      setError("Informe uma nota da Prova Desafio entre 0 e 10.");
      return;
    }

    const payload = {
      userId,
      childId,
      type,
      declaredIncome: type === "SOCIOEDUCATIVA" && declaredIncome ? Number(declaredIncome) : null,
      schoolAverage: type === "MERITO_BIMESTRAL" ? parsedSchoolAverage : null,
      challengeGrade: type === "PROVA_DESAFIO" ? parsedChallengeGrade : null,
    };

    setLoadingType(type);

    try {
      const response = await fetch("/api/benefits/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as BenefitResponse;

      if (!response.ok || !data.benefitRequest) {
        setError(data.message || "Não foi possível enviar a solicitação agora.");
        return;
      }

      setSuccess("Solicitação enviada! Agora ela ficará em análise.");
      await loadBenefitRequests(childId);
    } catch {
      setError("Não foi possível conectar ao Livoz agora. Tente novamente em instantes.");
    } finally {
      setLoadingType("");
    }
  }

  function handleSubmit(type: BenefitType) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void requestBenefit(type);
    };
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-[32px] bg-livoz-soft p-6">
          <h1 className="font-title text-3xl font-extrabold text-livoz-navy">Benefícios</h1>
          <p className="mt-2 leading-7 text-slate-600">Escolha uma forma de acesso e envie a solicitação para análise.</p>
        </section>

        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card">
          <h2 className="font-title text-2xl font-extrabold text-livoz-navy">Minhas solicitações</h2>
          {isRequestsLoading ? (
            <p className="mt-3 text-sm font-bold text-slate-500">Carregando solicitações...</p>
          ) : benefitRequests.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-slate-500">Você ainda não enviou solicitações de benefício.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {benefitRequests.map((request) => (
                <article key={request.id} className="rounded-[22px] border border-slate-100 bg-livoz-soft p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{getBenefitLabel(request.type)}</h3>
                      <p className="mt-1 text-sm text-slate-500">Enviado em {formatDate(request.submittedAt)}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-livoz-blue">
                      {statusLabels[request.status]}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600">
                    <p><strong className="text-slate-900">Desconto calculado:</strong> {request.discountPercentage}%</p>
                    <p><strong className="text-slate-900">Validade:</strong> {formatDate(request.expiresAt)}</p>
                    {request.adminNotes ? (
                      <p><strong className="text-slate-900">Observação:</strong> {request.adminNotes}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
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

        <div className="mt-5 grid gap-4">
          <form onSubmit={handleSubmit("SOCIOEDUCATIVA")} className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-card">
            <div className="flex gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-cyan-50 text-2xl">💚</span>
              <div>
                <h2 className="font-bold">Bolsa Socioeducativa</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Gratuidade total para famílias que precisam de apoio educacional, mediante análise.
                </p>
              </div>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
              Renda declarada
              <input
                type="number"
                min="0"
                step="0.01"
                value={declaredIncome}
                onChange={(event) => setDeclaredIncome(event.target.value)}
                className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Ex.: 1200"
              />
            </label>
            <button
              type="submit"
              disabled={loadingType === "SOCIOEDUCATIVA"}
              className="mt-4 w-full rounded-[18px] bg-livoz-blue px-4 py-3 font-extrabold text-white transition hover:bg-livoz-navy disabled:opacity-60"
            >
              {loadingType === "SOCIOEDUCATIVA" ? "Enviando..." : "Solicitar Bolsa Socioeducativa"}
            </button>
          </form>

          <form onSubmit={handleSubmit("MERITO_BIMESTRAL")} className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-card">
            <div className="flex gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-blue-50 text-2xl">🎓</span>
              <div>
                <h2 className="font-bold">Mérito Bimestral</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Desconto ou gratuidade com base na média geral do boletim escolar.
                </p>
              </div>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
              Média escolar
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={schoolAverage}
                onChange={(event) => setSchoolAverage(event.target.value)}
                className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Ex.: 8.5"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loadingType === "MERITO_BIMESTRAL"}
              className="mt-4 w-full rounded-[18px] bg-livoz-blue px-4 py-3 font-extrabold text-white transition hover:bg-livoz-navy disabled:opacity-60"
            >
              {loadingType === "MERITO_BIMESTRAL" ? "Enviando..." : "Solicitar Mérito Bimestral"}
            </button>
          </form>

          <form onSubmit={handleSubmit("PROVA_DESAFIO")} className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-card">
            <div className="flex gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-yellow-50 text-2xl">🏅</span>
              <div>
                <h2 className="font-bold">Prova Desafio</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Desconto ou gratuidade por uma nota de prova, trabalho ou atividade escolar do mês.
                </p>
              </div>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
              Nota da atividade
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={challengeGrade}
                onChange={(event) => setChallengeGrade(event.target.value)}
                className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Ex.: 9.0"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loadingType === "PROVA_DESAFIO"}
              className="mt-4 w-full rounded-[18px] bg-livoz-blue px-4 py-3 font-extrabold text-white transition hover:bg-livoz-navy disabled:opacity-60"
            >
              {loadingType === "PROVA_DESAFIO" ? "Enviando..." : "Solicitar Prova Desafio"}
            </button>
          </form>

          <article className="flex gap-4 rounded-[26px] border border-slate-100 bg-white p-5 shadow-card">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-orange-50 text-2xl">🔓</span>
            <div>
              <h2 className="font-bold">Modo Gratuito</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Acesso limitado para começar a aprender.</p>
            </div>
          </article>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
