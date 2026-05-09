"use client";

import { AppShell } from "@/components/AppShell";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getBenefitLabel, type BenefitType } from "@/lib/benefits";
import { clearSession, getSession, saveSession } from "@/lib/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ProfileChild = {
  id: string;
  name: string;
  age: number;
  schoolYear: string;
  targetLanguage: string;
  level: string;
  goal: string | null;
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
};

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  children: ProfileChild[];
};

type ProfileResponse = {
  message?: string;
  user?: ProfileUser;
};

function languageLabel(language?: string) {
  if (language === "english") return "Inglês";
  if (language === "spanish") return "Espanhol";
  if (language === "french") return "Francês";
  return language || "-";
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [child, setChild] = useState<ProfileChild | null>(null);
  const [planName, setPlanName] = useState("Modo Gratuito");
  const [planSlug, setPlanSlug] = useState("modo-gratuito");
  const [subscriptionStatus, setSubscriptionStatus] = useState("ACTIVE");
  const [benefitType, setBenefitType] = useState<BenefitType>("MODO_GRATUITO");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [benefitEndsAt, setBenefitEndsAt] = useState<string | null>(null);
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

    async function loadProfile() {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = (await response.json()) as ProfileResponse;

        if (!response.ok || !data.user) {
          setError(data.message || "Não foi possível carregar o perfil agora.");
          return;
        }

        const currentChild =
          data.user.children.find((item) => item.id === childId) ||
          data.user.children[0] ||
          null;

        const currentSubscription =
          currentChild?.subscriptions.find((subscription) => subscription.status === "ACTIVE") ||
          currentChild?.subscriptions[0] ||
          null;

        setUser(data.user);
        setChild(currentChild);
        setPlanName(currentSubscription?.plan.name || "Modo Gratuito");
        setPlanSlug(currentSubscription?.plan.slug || "modo-gratuito");
        setSubscriptionStatus(currentSubscription?.status || "ACTIVE");
        setBenefitType(currentSubscription?.benefitType || "MODO_GRATUITO");
        setDiscountPercentage(currentSubscription?.discountPercentage || 0);
        setBenefitEndsAt(currentSubscription?.endsAt || null);

        if (currentChild) {
          saveSession({
            userId,
            childId: currentChild.id,
            userName: data.user.name,
            childName: currentChild.name,
            planName: currentSubscription?.plan.name || "Modo Gratuito",
          });
        } else {
          saveSession({
            userId,
            userName: data.user.name,
            childId: null,
            childName: null,
            planName: null,
          });
        }
      } catch {
        setError("Não foi possível conectar ao Livoz agora.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const formattedLevel = useMemo(() => {
    if (!child?.level) return "-";
    return child.level.toLowerCase();
  }, [child?.level]);

  const benefitSummary = useMemo(() => {
    if (planSlug === "modo-gratuito" || benefitType === "MODO_GRATUITO") {
      return {
        title: "Você está no Modo Gratuito",
        label: "Modo Gratuito — acesso limitado",
        discount: "Sem desconto ativo",
        validity: "",
        button: "Conhecer planos",
      };
    }

    return {
      title: `Plano atual: ${planName}`,
      label: getBenefitLabel(benefitType),
      discount: discountPercentage > 0 ? `${discountPercentage}%` : "Sem desconto ativo",
      validity: benefitEndsAt ? new Intl.DateTimeFormat("pt-BR").format(new Date(benefitEndsAt)) : "",
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

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-[32px] bg-livoz-soft p-6">
          <h1 className="font-title text-3xl font-extrabold text-livoz-navy">Perfil</h1>
          <p className="mt-2 leading-7 text-slate-600">Dados básicos da conta familiar no Livoz.</p>
        </section>

        {isLoading ? (
          <section className="mt-5 rounded-[28px] bg-white p-5 text-center shadow-card">
            <h2 className="font-title text-xl font-extrabold">Carregando perfil...</h2>
            <p className="mt-2 text-sm text-slate-500">Buscando os dados reais da família.</p>
          </section>
        ) : error ? (
          <section className="mt-5 rounded-[28px] bg-orange-50 p-5 text-center text-orange-700 shadow-card">
            <h2 className="font-title text-xl font-extrabold">Ops!</h2>
            <p className="mt-2 text-sm font-bold">{error}</p>
          </section>
        ) : (
          <>
            <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card">
              <h2 className="font-title text-xl font-extrabold">Responsável</h2>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <p><strong className="text-slate-900">Nome:</strong> {user?.name || "-"}</p>
                <p><strong className="text-slate-900">E-mail:</strong> {user?.email || "-"}</p>
                <p><strong className="text-slate-900">Telefone:</strong> {user?.phone || "-"}</p>
              </div>
            </section>

            <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card">
              <h2 className="font-title text-xl font-extrabold">Criança</h2>
              <div className="mt-4 flex items-start gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-livoz-yellow text-3xl">{child?.avatar || "⭐"}</div>
                <div className="grid gap-2 text-sm text-slate-600">
                  <p><strong className="text-slate-900">Nome:</strong> {child?.name || "-"}</p>
                  <p><strong className="text-slate-900">Idade:</strong> {child?.age || "-"}</p>
                  <p><strong className="text-slate-900">Ano escolar:</strong> {child?.schoolYear || "-"}</p>
                  <p><strong className="text-slate-900">Idioma:</strong> {languageLabel(child?.targetLanguage)}</p>
                  <p><strong className="text-slate-900">Nível:</strong> {formattedLevel}</p>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card">
              <h2 className="font-title text-xl font-extrabold">Plano e pagamento</h2>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <p><strong className="text-slate-900">Plano atual:</strong> {planName}</p>
                <p><strong className="text-slate-900">Status da assinatura:</strong> {subscriptionStatusLabel}</p>
                <p><strong className="text-slate-900">{benefitSummary.title}</strong></p>
                <p><strong className="text-slate-900">Benefício ativo:</strong> {benefitSummary.label}</p>
                <p><strong className="text-slate-900">Desconto:</strong> {benefitSummary.discount}</p>
                {benefitSummary.validity ? (
                  <p><strong className="text-slate-900">Válido até:</strong> {benefitSummary.validity}</p>
                ) : null}
              </div>
              <Link
                href="/planos"
                className="mt-5 inline-flex w-full justify-center rounded-[20px] bg-livoz-blue px-4 py-3 font-extrabold text-white transition hover:bg-livoz-navy"
              >
                {benefitSummary.button}
              </Link>
            </section>
          </>
        )}

        <PrimaryButton type="button" onClick={handleLogout} className="mt-6 w-full bg-livoz-orange">
          Sair
        </PrimaryButton>
      </AppShell>
    </ProtectedRoute>
  );
}
