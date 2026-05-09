"use client";

import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getBenefitLabel, type BenefitType } from "@/lib/benefits";
import { calculateFinalPrice, formatCurrencyBRL } from "@/lib/pricing";
import { getSession, saveSession } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Plan = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  description: string | null;
  limitsJson: unknown;
  active: boolean;
};

type PlansResponse = {
  message?: string;
  plans?: Plan[];
};

type UserProfileResponse = {
  message?: string;
  user?: {
    id: string;
    name: string;
    children: Array<{
      id: string;
      subscriptions: Array<{
        status: string;
        benefitType: BenefitType;
        discountPercentage: number;
        endsAt: string | null;
        plan: {
          id?: string;
          name: string;
          slug?: string;
        };
      }>;
    }>;
  };
};

type CheckoutResponse = {
  message?: string;
  freeAccess?: boolean;
  checkoutUrl?: string;
  finalPrice?: number;
  discountPercentage?: number;
};

type PlanLimits = {
  dailyMissions?: number;
  dailyVoiceMinutes?: number;
  aiTextMessages?: number;
  feedback?: string;
  benefits?: string[];
};

function toNumber(value: number | string) {
  return Number(value);
}

function getPlanLimits(limitsJson: unknown): PlanLimits {
  if (!limitsJson || typeof limitsJson !== "object") {
    return {};
  }

  return limitsJson as PlanLimits;
}

function getLimitItems(plan: Plan) {
  const limits = getPlanLimits(plan.limitsJson);
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

  return items.length > 0 ? items : ["Acesso ao Livoz conforme o plano."];
}

export default function PlansPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanName, setCurrentPlanName] = useState("Modo Gratuito");
  const [currentPlanSlug, setCurrentPlanSlug] = useState("modo-gratuito");
  const [benefitType, setBenefitType] = useState<BenefitType>("MODO_GRATUITO");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPlanId, setLoadingPlanId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();

    if (!session.userId || !session.childId) {
      router.replace("/login");
      return;
    }

    setUserId(session.userId);
    setChildId(session.childId);

    async function loadPlansAndProfile() {
      try {
        const [plansResponse, userResponse] = await Promise.all([
          fetch("/api/plans"),
          fetch(`/api/users/${session.userId}`),
        ]);

        const plansData = (await plansResponse.json()) as PlansResponse;
        const userData = (await userResponse.json()) as UserProfileResponse;

        if (!plansResponse.ok || !plansData.plans) {
          setError(plansData.message || "Não foi possível carregar os planos agora.");
          return;
        }

        if (!userResponse.ok || !userData.user) {
          setError(userData.message || "Não foi possível carregar os dados do perfil.");
          return;
        }

        const currentChild = userData.user.children.find((child) => child.id === session.childId);
        const activeSubscription =
          currentChild?.subscriptions.find((subscription) => subscription.status === "ACTIVE") ||
          currentChild?.subscriptions[0];

        setPlans(plansData.plans);
        setCurrentPlanName(activeSubscription?.plan.name || session.planName || "Modo Gratuito");
        setCurrentPlanSlug(activeSubscription?.plan.slug || "modo-gratuito");
        setBenefitType(activeSubscription?.benefitType || "MODO_GRATUITO");
        setDiscountPercentage(activeSubscription?.discountPercentage || 0);
      } catch {
        setError("Não foi possível conectar ao Livoz agora.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPlansAndProfile();
  }, [router]);

  const benefitLabel = useMemo(() => {
    if (benefitType === "MODO_GRATUITO" || discountPercentage === 0) {
      return "Sem desconto ativo";
    }

    return `${getBenefitLabel(benefitType)}: ${discountPercentage}% de desconto`;
  }, [benefitType, discountPercentage]);

  async function handleChoosePlan(plan: Plan) {
    setError("");

    if (!userId || !childId) {
      router.push("/login");
      return;
    }

    setLoadingPlanId(plan.id);

    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          childId,
          planId: plan.id,
        }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok) {
        setError(data.message || "Não foi possível iniciar o pagamento agora.");
        return;
      }

      if (data.freeAccess) {
        saveSession({
          planName: plan.name,
        });
        router.push("/dashboard");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setError("Não foi possível abrir o checkout da Stripe agora.");
    } catch {
      setError("Não foi possível conectar ao Livoz agora. Tente novamente em instantes.");
    } finally {
      setLoadingPlanId("");
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-[32px] bg-gradient-to-br from-livoz-blue to-livoz-cyan p-6 text-white">
          <span className="inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-bold">
            Planos Livoz
          </span>
          <h1 className="mt-5 font-title text-3xl font-extrabold leading-tight">
            Escolha o acesso ideal para continuar aprendendo.
          </h1>
          <p className="mt-3 leading-7 text-white/90">
            Plano atual: {currentPlanName}
          </p>
        </section>

        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card">
          <h2 className="font-title text-xl font-extrabold text-livoz-navy">Desconto ativo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{benefitLabel}</p>
        </section>

        {isLoading ? (
          <section className="mt-5 rounded-[28px] bg-livoz-soft p-6 text-center">
            <h2 className="font-title text-2xl font-extrabold text-livoz-navy">Carregando planos...</h2>
            <p className="mt-2 text-slate-600">Estamos buscando as opções disponíveis.</p>
          </section>
        ) : error ? (
          <p className="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-extrabold text-orange-700">
            {error}
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {plans.map((plan) => {
              const basePrice = toNumber(plan.price);
              const finalPrice =
                plan.slug === "modo-gratuito"
                  ? 0
                  : calculateFinalPrice(basePrice, discountPercentage);
              const isCurrent = currentPlanSlug === plan.slug || currentPlanName === plan.name;
              const isFreePlan = plan.slug === "modo-gratuito";
              const limits = getLimitItems(plan);

              return (
                <article
                  key={plan.id}
                  className={`rounded-[28px] border p-5 shadow-card ${
                    isCurrent ? "border-livoz-blue bg-blue-50/50" : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-title text-2xl font-extrabold text-livoz-navy">{plan.name}</h2>
                      {isCurrent ? (
                        <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold text-livoz-blue">
                          Plano atual
                        </span>
                      ) : null}
                    </div>
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-livoz-yellow text-2xl">
                      {isFreePlan ? "🔓" : plan.slug.includes("familia") ? "👨‍👩‍👧‍👦" : "⭐"}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {plan.description || "Plano para aprender idiomas com o Livoz."}
                  </p>

                  <div className="mt-5 rounded-[22px] bg-white p-4">
                    <div className="grid gap-2 text-sm text-slate-600">
                      <p>
                        <strong className="text-slate-900">Preço base:</strong>{" "}
                        {formatCurrencyBRL(basePrice)}
                      </p>
                      <p>
                        <strong className="text-slate-900">Desconto ativo:</strong>{" "}
                        {isFreePlan ? "Não se aplica" : `${discountPercentage}%`}
                      </p>
                      <p>
                        <strong className="text-slate-900">Preço final:</strong>{" "}
                        <span className="text-lg font-extrabold text-livoz-navy">
                          {formatCurrencyBRL(finalPrice)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <ul className="mt-5 grid gap-2 text-sm text-slate-600">
                    {limits.map((limit) => (
                      <li key={limit} className="flex gap-2">
                        <span className="font-extrabold text-livoz-cyan">✓</span>
                        <span>{limit}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => void handleChoosePlan(plan)}
                    disabled={loadingPlanId === plan.id}
                    className="mt-5 w-full rounded-[20px] bg-livoz-blue px-4 py-3 font-extrabold text-white transition hover:bg-livoz-navy disabled:opacity-60"
                  >
                    {loadingPlanId === plan.id
                      ? "Preparando..."
                      : isFreePlan
                        ? "Continuar no gratuito"
                        : "Assinar plano"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
