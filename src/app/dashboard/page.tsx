"use client";

import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getBenefitLabel, type BenefitType } from "@/lib/benefits";
import { getSession, saveSession } from "@/lib/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DashboardChild = {
  id: string;
  name: string;
  targetLanguage: string;
  avatar: string | null;
  subscriptions: Array<{
    status: string;
    benefitType: BenefitType;
    discountPercentage: number;
    endsAt: string | null;
    plan: {
      name: string;
      slug?: string;
    };
  }>;
  progress?: Array<{
    completed: boolean;
    score: number;
    stars: number;
  }>;
};

type UserProfileResponse = {
  message?: string;
  user?: {
    id: string;
    name: string;
    children: DashboardChild[];
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [child, setChild] = useState<DashboardChild | null>(null);
  const [planName, setPlanName] = useState("Modo Gratuito");
  const [planSlug, setPlanSlug] = useState("modo-gratuito");
  const [subscriptionStatus, setSubscriptionStatus] = useState("ACTIVE");
  const [benefitType, setBenefitType] = useState<BenefitType>("MODO_GRATUITO");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [benefitEndsAt, setBenefitEndsAt] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    const userId = session.userId;
    const childId = session.childId;

    if (!userId) {
      router.replace("/login");
      return;
    }

    async function loadDashboard() {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = (await response.json()) as UserProfileResponse;

        if (!response.ok || !data.user) {
          setError(data.message || "Não foi possível carregar seu dashboard agora.");
          return;
        }

        const currentChild =
          data.user.children.find((item) => item.id === childId) ||
          data.user.children[0] ||
          null;

        if (!currentChild) {
          router.replace("/cadastro-crianca");
          return;
        }

        const activeSubscription =
          currentChild.subscriptions.find((subscription) => subscription.status === "ACTIVE") ||
          currentChild.subscriptions[0];

        const completedCount = currentChild.progress?.filter((item) => item.completed).length ?? 0;
        const totalProgress = currentChild.progress?.length ?? 0;

        setChild(currentChild);
        setPlanName(activeSubscription?.plan.name || "Modo Gratuito");
        setPlanSlug(activeSubscription?.plan.slug || "modo-gratuito");
        setSubscriptionStatus(activeSubscription?.status || "ACTIVE");
        setBenefitType(activeSubscription?.benefitType || "MODO_GRATUITO");
        setDiscountPercentage(activeSubscription?.discountPercentage || 0);
        setBenefitEndsAt(activeSubscription?.endsAt || null);
        setProgressPercent(totalProgress > 0 ? Math.round((completedCount / totalProgress) * 100) : 0);

        saveSession({
          userId,
          childId: currentChild.id,
          userName: data.user.name,
          childName: currentChild.name,
          planName: activeSubscription?.plan.name || "Modo Gratuito",
        });
      } catch {
        setError("Não foi possível conectar ao Livoz agora.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const languageLabel = useMemo(() => {
    if (!child?.targetLanguage) return "um novo idioma";
    if (child.targetLanguage === "english") return "inglês";
    if (child.targetLanguage === "spanish") return "espanhol";
    if (child.targetLanguage === "french") return "francês";
    return child.targetLanguage;
  }, [child?.targetLanguage]);

  const benefitSummary = useMemo(() => {
    if (planSlug === "modo-gratuito" || benefitType === "MODO_GRATUITO") {
      return {
        title: "Você está no Modo Gratuito",
        benefit: "Modo Gratuito — acesso limitado",
        discount: "Sem desconto ativo",
        validity: "",
        button: "Conhecer planos",
      };
    }

    return {
      title: `Plano atual: ${planName}`,
      benefit: `Benefício ativo: ${getBenefitLabel(benefitType)}`,
      discount: discountPercentage > 0 ? `Desconto: ${discountPercentage}%` : "Sem desconto ativo",
      validity: benefitEndsAt ? `Válido até: ${new Intl.DateTimeFormat("pt-BR").format(new Date(benefitEndsAt))}` : "",
      button: "Ver planos",
    };
  }, [benefitEndsAt, benefitType, discountPercentage, planName, planSlug]);

  const subscriptionStatusLabel = useMemo(() => {
    if (subscriptionStatus === "ACTIVE") return "Ativa";
    if (subscriptionStatus === "PENDING") return "Pendente";
    if (subscriptionStatus === "INACTIVE") return "Inativa";
    if (subscriptionStatus === "EXPIRED") return "Expirada";
    if (subscriptionStatus === "CANCELED") return "Cancelada";
    return subscriptionStatus;
  }, [subscriptionStatus]);

  return (
    <ProtectedRoute>
      <AppShell>
        {isLoading ? (
          <section className="rounded-[32px] bg-livoz-soft p-6 text-center">
            <h1 className="font-title text-2xl font-extrabold text-livoz-navy">Carregando dashboard...</h1>
            <p className="mt-2 text-slate-600">Estamos preparando as missões da criança.</p>
          </section>
        ) : error ? (
          <section className="rounded-[32px] bg-orange-50 p-6 text-center text-orange-700">
            <h1 className="font-title text-2xl font-extrabold">Ops!</h1>
            <p className="mt-2 font-bold">{error}</p>
          </section>
        ) : (
          <>
            <section className="rounded-[32px] bg-gradient-to-br from-livoz-blue to-livoz-cyan p-6 text-white">
              <div className="inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-bold">
                Olá, {child?.name || "explorador"}!
              </div>
              <h1 className="mt-5 max-w-[320px] font-title text-3xl font-extrabold leading-tight">
                Hoje é dia de explorar {languageLabel}.
              </h1>
              <p className="mt-3 leading-7 text-white/90">Plano atual: {planName}</p>
              <div className="mt-5 grid h-24 w-24 place-items-center rounded-[28px] bg-livoz-yellow text-5xl shadow-lg">
                {child?.avatar || "⭐"}
              </div>
            </section>

            <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card">
              <h2 className="font-title text-xl font-extrabold text-livoz-navy">Plano e pagamento</h2>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <p><strong className="text-slate-900">Plano atual:</strong> {planName}</p>
                <p><strong className="text-slate-900">Status da assinatura:</strong> {subscriptionStatusLabel}</p>
                <p><strong className="text-slate-900">{benefitSummary.title}</strong></p>
                <p>{benefitSummary.benefit}</p>
                <p>{benefitSummary.discount}</p>
                {benefitSummary.validity ? <p>{benefitSummary.validity}</p> : null}
              </div>
              <Link
                href="/planos"
                className="mt-5 inline-flex w-full justify-center rounded-[20px] bg-livoz-blue px-4 py-3 font-extrabold text-white transition hover:bg-livoz-navy"
              >
                {benefitSummary.button}
              </Link>
            </section>

            <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-title text-xl font-extrabold">Progresso inicial</h2>
                  <p className="text-sm text-slate-500">
                    {progressPercent > 0 ? "Missões concluídas até agora" : "Comece uma missão para ver o progresso"}
                  </p>
                </div>
                <strong className="text-2xl text-livoz-navy">{progressPercent}%</strong>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-livoz-blue to-livoz-cyan"
                  style={{ width: `${progressPercent}%` }}
                />
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
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
