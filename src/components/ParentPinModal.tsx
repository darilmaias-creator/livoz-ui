"use client";

import { getSession } from "@/lib/storage";
import { FormEvent, useEffect, useState } from "react";

type VerifyPinResponse = {
  message?: string;
  valid?: boolean;
};

export function ParentPinModal({
  open,
  onClose,
  onSuccess,
  title = "PIN parental",
  description = "Digite o PIN do responsável para continuar.",
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPin("");
      setError("");
      setIsLoading(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const session = getSession();

    if (!session.userId) {
      setError("Não foi possível identificar o responsável.");
      return;
    }

    if (!/^\d{4}$|^\d{6}$/.test(pin)) {
      setError("Digite um PIN de 4 ou 6 números.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/parent-pin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.userId,
          pin,
        }),
      });
      const data = (await response.json()) as VerifyPinResponse;

      if (!response.ok || !data.valid) {
        setError(data.message || "PIN incorreto. Tente novamente.");
        return;
      }

      onSuccess();
      setPin("");
    } catch {
      setError("Não foi possível validar o PIN agora.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-5 backdrop-blur-sm">
      <section className="w-full max-w-[380px] rounded-[28px] bg-white p-5 shadow-card">
        <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-livoz-soft text-2xl">
          🔒
        </div>
        <h2 className="mt-4 font-title text-2xl font-extrabold text-livoz-navy">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="min-h-12 rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-center text-2xl font-extrabold tracking-[0.25em] outline-none focus:ring-4 focus:ring-blue-100"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••"
            type="password"
            required
          />

          {error ? (
            <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
              {error}
            </p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-600 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-[18px] bg-livoz-blue px-4 py-3 text-sm font-extrabold text-white transition hover:bg-livoz-navy disabled:opacity-60"
            >
              {isLoading ? "Validando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
