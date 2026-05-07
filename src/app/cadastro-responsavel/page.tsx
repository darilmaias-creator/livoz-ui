"use client";

import { AuthCard } from "@/components/AuthCard";
import { FormInput } from "@/components/FormInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { registerUser } from "@/lib/apiClient";
import { createId } from "@/lib/auth";
import { saveUser, setSession } from "@/lib/localStorage";
import type { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type ResponsibleForm = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  confirmedResponsible: boolean;
};

const initialForm: ResponsibleForm = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
  acceptedPrivacy: false,
  confirmedResponsible: false,
};

export default function ResponsibleSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  function updateField<T extends keyof ResponsibleForm>(field: T, value: ResponsibleForm[T]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate() {
    if (!form.name || !form.email || !form.phone || !form.cpf || !form.password || !form.confirmPassword) {
      return "Preencha todos os campos para continuar.";
    }

    if (form.password.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (form.password !== form.confirmPassword) {
      return "A confirmação de senha precisa ser igual à senha.";
    }

    if (!form.acceptedTerms || !form.acceptedPrivacy || !form.confirmedResponsible) {
      return "Confirme os aceites obrigatórios para criar a conta.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const apiResult = await registerUser({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      cpf: form.cpf.trim(),
      password: form.password,
      acceptedTerms: form.acceptedTerms,
      acceptedPrivacy: form.acceptedPrivacy,
      confirmedResponsible: form.confirmedResponsible,
    });

    if (apiResult.ok) {
      saveUser(apiResult.data.user);
      setSession(apiResult.data.user.id);
      router.push("/cadastro-crianca");
      return;
    }

    const user: User = {
      id: createId("user"),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      cpf: form.cpf.trim(),
      role: "responsavel",
      acceptedTerms: form.acceptedTerms,
      acceptedPrivacy: form.acceptedPrivacy,
      confirmedResponsible: form.confirmedResponsible,
      createdAt: new Date().toISOString(),
    };

    saveUser(user);
    setSession(user.id);
    setError(apiResult.message);
    router.push("/cadastro-crianca");
  }

  return (
    <AuthCard
      title="Cadastro do responsável"
      description="Crie a conta familiar para preparar a experiência da criança."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormInput label="Nome completo" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
        <FormInput label="E-mail" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
        <FormInput label="Telefone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="(11) 9 9999-9999" required />
        <FormInput label="CPF" value={form.cpf} onChange={(event) => updateField("cpf", event.target.value)} placeholder="000.000.000-00" required />
        <FormInput label="Senha" type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} required />
        <FormInput label="Confirmação de senha" type="password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} required />

        <div className="grid gap-3 rounded-[22px] bg-livoz-soft p-4 text-sm text-slate-700">
          <label className="flex gap-3">
            <input type="checkbox" checked={form.acceptedTerms} onChange={(event) => updateField("acceptedTerms", event.target.checked)} />
            <span>Aceito os Termos de Uso.</span>
          </label>
          <label className="flex gap-3">
            <input type="checkbox" checked={form.acceptedPrivacy} onChange={(event) => updateField("acceptedPrivacy", event.target.checked)} />
            <span>Aceito a Política de Privacidade.</span>
          </label>
          <label className="flex gap-3">
            <input type="checkbox" checked={form.confirmedResponsible} onChange={(event) => updateField("confirmedResponsible", event.target.checked)} />
            <span>Confirmo que sou pai, mãe ou responsável legal pela criança.</span>
          </label>
        </div>

        {error ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">{error}</p> : null}
        <PrimaryButton type="submit" className="w-full">
          Continuar
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
