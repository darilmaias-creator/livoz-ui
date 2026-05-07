"use client";

import { AuthCard } from "@/components/AuthCard";
import { AvatarPicker } from "@/components/AvatarPicker";
import { FormInput, FormSelect } from "@/components/FormInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { registerChild } from "@/lib/apiClient";
import { createId } from "@/lib/auth";
import { getUser, saveChild } from "@/lib/localStorage";
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

  useEffect(() => {
    if (!getUser()) router.replace("/cadastro-responsavel");
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
    const user = getUser();
    if (!user) {
      router.push("/cadastro-responsavel");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      userId: user.id,
      name: form.name.trim(),
      age: Number(form.age),
      schoolYear: form.schoolYear,
      targetLanguage: form.targetLanguage,
      level: form.level as Child["level"],
      goal: form.goal,
      avatar: form.avatar,
    };

    const apiResult = await registerChild(payload);
    if (apiResult.ok) {
      saveChild(apiResult.data.child);
      router.push("/dashboard");
      return;
    }

    const child: Child = {
      id: createId("child"),
      ...payload,
      createdAt: new Date().toISOString(),
    };

    saveChild(child);
    setError(apiResult.message);
    router.push("/dashboard");
  }

  return (
    <AuthCard title="Cadastro da criança" description="Monte um perfil simples e divertido para começar a aprender.">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormInput label="Nome da criança" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
        <FormInput label="Idade" type="number" min={6} max={14} value={form.age} onChange={(event) => updateField("age", event.target.value)} required />
        <FormSelect
          label="Ano escolar"
          value={form.schoolYear}
          onChange={(event) => updateField("schoolYear", event.target.value)}
          options={["1º ano", "2º ano", "3º ano", "4º ano", "5º ano", "6º ano", "7º ano", "8º ano", "9º ano"]}
          required
        />
        <FormSelect
          label="Idioma que deseja aprender"
          value={form.targetLanguage}
          onChange={(event) => updateField("targetLanguage", event.target.value)}
          options={["Inglês", "Espanhol", "Francês"]}
          required
        />
        <FormSelect
          label="Nível inicial"
          value={form.level}
          onChange={(event) => updateField("level", event.target.value as ChildForm["level"])}
          options={["iniciante", "basico", "intermediario"]}
          required
        />
        <FormSelect
          label="Objetivo de aprendizagem"
          value={form.goal}
          onChange={(event) => updateField("goal", event.target.value)}
          options={["Conversar melhor", "Aprender palavras novas", "Acompanhar a escola", "Viajar com a família"]}
          required
        />
        <AvatarPicker value={form.avatar} onChange={(avatar) => updateField("avatar", avatar)} />

        {error ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">{error}</p> : null}
        <PrimaryButton type="submit" className="w-full">
          Finalizar cadastro
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
