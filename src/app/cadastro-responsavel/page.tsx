"use client";

import { AuthCard } from "@/components/AuthCard";
import { FormInput } from "@/components/FormInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { saveSession } from "@/lib/storage";
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
  const [isLoading, setIsLoading] = useState(false);

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
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register-responsible", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          cpf: form.cpf.trim(),
          password: form.password,
          acceptedTerms: form.acceptedTerms,
          acceptedPrivacy: form.acceptedPrivacy,
          confirmedResponsible: form.confirmedResponsible,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        user?: {
          id: string;
          name: string;
          email: string;
        };
      };

      if (!response.ok || !data.user) {
        setError(data.message || "Não foi possível criar sua conta agora.");
        return;
      }

      saveSession({
        userId: data.user.id,
        userName: data.user.name,
        childId: null,
        childName: null,
        planName: null,
      });

      router.push("/cadastro-crianca");
    } catch {
      setError("Não foi possível conectar ao Livoz agora. Tente novamente em instantes.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      title="Cadastro do responsável"
      description="Crie a conta familiar para preparar a experiência da criança."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormInput label="Nome completo" value={form.name} onChange={(event) => updateField("name", event.target.value)} disabled={isLoading} required />
        <FormInput label="E-mail" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} disabled={isLoading} required />
        <FormInput label="Telefone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="(11) 9 9999-9999" disabled={isLoading} required />
        <FormInput label="CPF" value={form.cpf} onChange={(event) => updateField("cpf", event.target.value)} placeholder="000.000.000-00" disabled={isLoading} required />
        <FormInput label="Senha" type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} disabled={isLoading} required />
        <FormInput label="Confirmação de senha" type="password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} disabled={isLoading} required />

        <div className="grid gap-3 rounded-[22px] bg-livoz-soft p-4 text-sm text-slate-700">
          <label className="flex gap-3">
            <input type="checkbox" checked={form.acceptedTerms} onChange={(event) => updateField("acceptedTerms", event.target.checked)} disabled={isLoading} />
            <span>Aceito os Termos de Uso.</span>
          </label>
          <label className="flex gap-3">
            <input type="checkbox" checked={form.acceptedPrivacy} onChange={(event) => updateField("acceptedPrivacy", event.target.checked)} disabled={isLoading} />
            <span>Aceito a Política de Privacidade.</span>
          </label>
          <label className="flex gap-3">
            <input type="checkbox" checked={form.confirmedResponsible} onChange={(event) => updateField("confirmedResponsible", event.target.checked)} disabled={isLoading} />
            <span>Confirmo que sou pai, mãe ou responsável legal pela criança.</span>
          </label>
        </div>

        {error ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">{error}</p> : null}
        <PrimaryButton type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Criando conta..." : "Continuar"}
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}
