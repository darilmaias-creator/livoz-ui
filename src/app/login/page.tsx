"use client";

import { AuthCard } from "@/components/AuthCard";
import { FormInput } from "@/components/FormInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { saveSession } from "@/lib/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Preencha e-mail e senha para entrar.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        user?: {
          id: string;
          name: string;
        };
        children?: Array<{
          id: string;
          name: string;
          currentPlan?: string;
          subscriptions?: Array<{
            planName?: string;
            plan?: {
              name?: string;
            };
          }>;
        }>;
        session?: {
          userId?: string;
          childId?: string | null;
          userName?: string;
          childName?: string | null;
          planName?: string;
        };
      };

      if (!response.ok || !data.user) {
        setError(data.message || "Não foi possível entrar agora.");
        return;
      }

      const firstChild = data.children?.[0] ?? null;
      const planName =
        data.session?.planName ||
        firstChild?.subscriptions?.[0]?.planName ||
        firstChild?.subscriptions?.[0]?.plan?.name ||
        firstChild?.currentPlan ||
        "Modo Gratuito";

      if (!firstChild) {
        saveSession({
          userId: data.user.id,
          userName: data.user.name,
          childId: null,
          childName: null,
          planName: null,
        });
        router.push("/cadastro-crianca");
        return;
      }

      saveSession({
        userId: data.user.id,
        childId: firstChild.id,
        userName: data.user.name,
        childName: firstChild.name,
        planName,
      });

      router.push("/dashboard");
    } catch {
      setError("Não foi possível conectar ao Livoz agora. Tente novamente em instantes.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      title="Entrar no Livoz"
      description="Acesse como responsável para acompanhar a jornada da criança."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link className="font-bold text-livoz-blue" href="/cadastro-responsavel">
            Cadastre-se
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormInput
          label="E-mail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          disabled={isLoading}
          required
        />
        <FormInput
          label="Senha"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Digite sua senha"
          disabled={isLoading}
          required
        />
        {error ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">{error}</p> : null}
        <PrimaryButton type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
