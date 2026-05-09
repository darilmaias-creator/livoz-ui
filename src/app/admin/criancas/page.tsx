"use client";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getBenefitLabel, type BenefitType } from "@/lib/benefits";
import { useEffect, useMemo, useState } from "react";

type AdminChild = {
  id: string;
  name: string;
  age: number;
  schoolYear: string;
  targetLanguage: string;
  level: string;
  avatar: string | null;
  createdAt: string;
  responsible: {
    id: string;
    name: string;
    email: string;
  };
  activeSubscription: {
    status: string;
    benefitType: BenefitType;
    discountPercentage: number;
    plan: {
      name: string;
    };
  } | null;
};

type AdminChildrenResponse = {
  message?: string;
  children?: AdminChild[];
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

function languageLabel(language: string) {
  if (language === "english") return "Inglês";
  if (language === "spanish") return "Espanhol";
  if (language === "french") return "Francês";
  return language;
}

export default function AdminChildrenPage() {
  const [children, setChildren] = useState<AdminChild[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChildren() {
      try {
        const response = await fetch("/api/admin/children");
        const data = (await response.json()) as AdminChildrenResponse;

        if (!response.ok || !data.children) {
          setError(data.message || "Não foi possível carregar as crianças.");
          return;
        }

        setChildren(data.children);
      } catch {
        setError("Não foi possível conectar ao Livoz agora.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadChildren();
  }, []);

  const filteredChildren = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return children;
    }

    return children.filter((child) => {
      return [
        child.name,
        child.schoolYear,
        child.targetLanguage,
        child.level,
        child.responsible.name,
        child.responsible.email,
        child.activeSubscription?.plan.name || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [children, search]);

  return (
    <AdminProtectedRoute>
      <AdminLayout
        title="Crianças"
        description="Acompanhe crianças cadastradas e seus planos atuais."
      >
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            placeholder="Buscar por criança, responsável, idioma, nível ou plano"
          />
        </section>

        <section className="mt-5 rounded-[24px] border border-slate-100 bg-white shadow-card">
          {isLoading ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Carregando crianças...</div>
          ) : error ? (
            <div className="p-6 text-center text-sm font-bold text-orange-700">{error}</div>
          ) : filteredChildren.length === 0 ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Nenhuma criança encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Criança</th>
                    <th className="px-4 py-3">Idade</th>
                    <th className="px-4 py-3">Ano escolar</th>
                    <th className="px-4 py-3">Idioma</th>
                    <th className="px-4 py-3">Nível</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Plano atual</th>
                    <th className="px-4 py-3">Benefício ativo</th>
                    <th className="px-4 py-3">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChildren.map((child) => (
                    <tr key={child.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-livoz-soft text-xl">
                            {child.avatar || "⭐"}
                          </span>
                          <span className="font-bold text-slate-900">{child.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{child.age}</td>
                      <td className="px-4 py-4 text-slate-600">{child.schoolYear}</td>
                      <td className="px-4 py-4 text-slate-600">{languageLabel(child.targetLanguage)}</td>
                      <td className="px-4 py-4 text-slate-600">{child.level.toLowerCase()}</td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{child.responsible.name}</p>
                        <p className="text-xs text-slate-500">{child.responsible.email}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{child.activeSubscription?.plan.name || "-"}</td>
                      <td className="px-4 py-4">
                        {child.activeSubscription ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-livoz-navy">
                            {getBenefitLabel(child.activeSubscription.benefitType)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(child.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
