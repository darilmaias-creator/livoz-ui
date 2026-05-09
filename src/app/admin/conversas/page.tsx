"use client";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";

type AdminConversation = {
  id: string;
  child: {
    name: string;
  };
  responsible: {
    name: string;
    email: string;
  };
  mode: string;
  language: string;
  level: string;
  createdAt: string;
};

type AdminConversationsResponse = {
  message?: string;
  conversations?: AdminConversation[];
};

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function languageLabel(language: string) {
  if (language === "english") return "Inglês";
  if (language === "spanish") return "Espanhol";
  if (language === "french") return "Francês";
  return language;
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("/api/admin/conversations");
        const data = (await response.json()) as AdminConversationsResponse;

        if (!response.ok || !data.conversations) {
          setError(data.message || "Não foi possível carregar as conversas.");
          return;
        }

        setConversations(data.conversations);
      } catch {
        setError("Não foi possível conectar ao Livoz agora.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadConversations();
  }, []);

  return (
    <AdminProtectedRoute>
      <AdminLayout
        title="Conversas"
        description="Acompanhe o uso da IA sem expor conteúdo infantil sensível."
      >
        <section className="rounded-[24px] border border-blue-100 bg-blue-50 p-5 text-sm font-bold leading-6 text-livoz-navy">
          Por segurança e privacidade, o conteúdo das conversas infantis não é exibido nesta versão do painel.
        </section>

        <section className="mt-5 rounded-[24px] border border-slate-100 bg-white shadow-card">
          {isLoading ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Carregando conversas...</div>
          ) : error ? (
            <div className="p-6 text-center text-sm font-bold text-orange-700">{error}</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Nenhuma conversa encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Criança</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Modo</th>
                    <th className="px-4 py-3">Idioma</th>
                    <th className="px-4 py-3">Nível</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conversation) => (
                    <tr key={conversation.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-4 font-bold text-slate-900">{conversation.child.name}</td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{conversation.responsible.name}</p>
                        <p className="text-xs text-slate-500">{conversation.responsible.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-livoz-navy">
                          {conversation.mode}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{languageLabel(conversation.language)}</td>
                      <td className="px-4 py-4 text-slate-600">{conversation.level}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDateTime(conversation.createdAt)}</td>
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
