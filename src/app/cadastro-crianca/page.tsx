"use client";

import { AuthCard } from "@/components/AuthCard";
import { AvatarPicker } from "@/components/AvatarPicker";
import { FormInput, FormSelect } from "@/components/FormInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { getSession, saveSession } from "@/lib/storage";
import type { Child } from "@/types/user";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type ChildForm = {
  name: string;
  age: string;
  schoolYear: string;
  targetLanguage: string;
  level: "" | Child["level"];
  goal: string;
  avatar: string;
};

const initialForm: ChildForm = {
  name: "",
  age: "",
  schoolYear: "",
  targetLanguage: "",
  level: "",
  goal: "",
  avatar: "",
};

export default function ChildSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!getSession().userId) {
      router.replace("/cadastro-responsavel");
    }
  }, [router]);

  function updateField<T extends keyof ChildForm>(field: T, value: ChildForm[T]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate() {
    if (!form.name || !form.age || !form.schoolYear || !form.targetLanguage || !form.level || !form.goal || !form.avatar) {
      return "Preencha todos os campos da criança para finalizar.";
    }

    const age = Number(form.age);
    if (Number.isNaN(age) || age < 6 || age > 14) {
      return "A idade precisa estar entre 6 e 14 anos.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const session = getSession();
    const userId = session.userId;
    const userName = session.userName || "";

    if (!userId) {
      router.push("/cadastro-responsavel");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name: form.name.trim(),
          age: Number(form.age),
          schoolYear: form.schoolYear,
          targetLanguage: form.targetLanguage,
          level: form.level,
          goal: form.goal,
          avatar: form.avatar,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        child?: {
          id: string;
          name: string;
          subscriptions?: Array<{
            plan?: {
              name?: string;
            };
          }>;
        };
      };

      if (!response.ok || !data.child) {
        setError(data.message || "Não foi possível cadastrar a criança agora.");
        return;
      }

      const planName = data.child.subscriptions?.[0]?.plan?.name || "Modo Gratuito";

      saveSession({
        userId,
        childId: data.child.id,
        userName,
        childName: data.child.name,
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
    <AuthCard title="Cadastro da criança" description="Monte um perfil simples e divertido para começar a aprender.">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormInput label="Nome da criança" value={form.name} onChange={(event) => updateField("name", event.target.value)} disabled={isLoading} required />
        <FormInput label="Idade" type="number" min={6} max={14} value={form.age} onChange={(event) => updateField("age", event.target.value)} disabled={isLoading} required />
        <FormSelect
          label="Ano escolar"
          value={form.schoolYear}
          onChange={(event) => updateField("schoolYear", event.target.value)}
          options={["1º ano", "2º ano", "3º ano", "4º ano", "5º ano", "6º ano", "7º ano", "8º ano", "9º ano"]}
          disabled={isLoading}
          required
        />
        <FormSelect
          label="Idioma que deseja aprender"
          value={form.targetLanguage}
          onChange={(event) => updateField("targetLanguage", event.target.value)}
          options={["english", "spanish", "french"]}
          disabled={isLoading}
          required
        />
        <FormSelect
          label="Nível inicial"
          value={form.level}
          onChange={(event) => updateField("level", event.target.value as ChildForm["level"])}
          options={["INICIANTE", "BASICO", "INTERMEDIARIO"]}
          disabled={isLoading}
          required
        />
        <FormSelect
          label="Objetivo de aprendizagem"
          value={form.goal}
          onChange={(event) => updateField("goal", event.target.value)}
          options={["Conversar melhor", "Aprender palavras novas", "Acompanhar a escola", "Viajar com a família"]}
          disabled={isLoading}
          required
        />
        <AvatarPicker value={form.avatar} onChange={(avatar) => updateField("avatar", avatar)} />

        {error ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">{error}</p> : null}
        <PrimaryButton type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Criando perfil..." : "Finalizar cadastro"}
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
