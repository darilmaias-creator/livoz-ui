"use client";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";

type AdminLesson = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  level: string;
  type: string;
  active: boolean;
  createdAt: string;
};

type AdminLessonsResponse = {
  message?: string;
  lessons?: AdminLesson[];
};

const levelOptions = ["INICIANTE", "BASICO", "INTERMEDIARIO"];
const typeOptions = [
  "VOCABULARY",
  "LISTENING",
  "SPEAKING",
  "READING",
  "CHAT",
  "PRONUNCIATION",
  "STORY",
  "REVIEW",
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

function languageLabel(language: string) {
  if (language === "english") return "Inglês";
  if (language === "spanish") return "Espanhol";
  if (language === "french") return "Francês";
  return language;
}

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("");
  const [type, setType] = useState("");
  const [active, setActive] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLessons() {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (language.trim()) params.set("language", language.trim());
      if (level) params.set("level", level);
      if (type) params.set("type", type);
      if (active) params.set("active", active);

      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`/api/admin/lessons${query}`);
      const data = (await response.json()) as AdminLessonsResponse;

      if (!response.ok || !data.lessons) {
        setError(data.message || "Não foi possível carregar as missões.");
        return;
      }

      setLessons(data.lessons);
    } catch {
      setError("Não foi possível conectar ao Livoz agora.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadLessons();
  }, [language, level, type, active]);

  return (
    <AdminProtectedRoute>
      <AdminLayout
        title="Missões"
        description="Visualize missões cadastradas para as crianças."
      >
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="min-h-11 rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="Idioma, ex.: english"
            />
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="min-h-11 rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Todos os níveis</option>
              {levelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="min-h-11 rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Todos os tipos</option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={active}
              onChange={(event) => setActive(event.target.value)}
              className="min-h-11 rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Ativas e inativas</option>
              <option value="true">Ativas</option>
              <option value="false">Inativas</option>
            </select>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-slate-100 bg-white shadow-card">
          {isLoading ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Carregando missões...</div>
          ) : error ? (
            <div className="p-6 text-center text-sm font-bold text-orange-700">{error}</div>
          ) : lessons.length === 0 ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Nenhuma missão encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Título</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Idioma</th>
                    <th className="px-4 py-3">Nível</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Ativo</th>
                    <th className="px-4 py-3">Criação</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-4 font-bold text-slate-900">{lesson.title}</td>
                      <td className="max-w-xs px-4 py-4 text-slate-600">{lesson.description || "-"}</td>
                      <td className="px-4 py-4 text-slate-600">{languageLabel(lesson.language)}</td>
                      <td className="px-4 py-4 text-slate-600">{lesson.level}</td>
                      <td className="px-4 py-4 text-slate-600">{lesson.type}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                            lesson.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {lesson.active ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(lesson.createdAt)}</td>
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
