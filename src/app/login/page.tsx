"use client";

import { AuthCard } from "@/components/AuthCard";
import { FormInput } from "@/components/FormInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { loginUser } from "@/lib/apiClient";
import { loginWithMockCredentials } from "@/lib/auth";
import { saveChild, saveUser, setSession } from "@/lib/localStorage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const apiResult = await loginUser({ email, password });
    if (apiResult.ok) {
      saveUser(apiResult.data.user);
      if (apiResult.data.child) saveChild(apiResult.data.child);
      setSession(apiResult.data.user.id);
      router.push("/dashboard");
      return;
    }

    const fallback = loginWithMockCredentials(email, password);
    if (!fallback.ok) {
      setError(apiResult.message || fallback.message);
      return;
    }

    router.push("/dashboard");
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
          required
        />
        <FormInput
          label="Senha"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Digite sua senha"
          required
        />
        {error ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">{error}</p> : null}
        <PrimaryButton type="submit" className="w-full">
          Entrar
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
