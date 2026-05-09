"use client";

import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getSession } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  level: string;
  type: string;
};

type LessonsResponse = {
  message?: string;
  lessons?: Lesson[];
};

type ProgressResponse = {
  message?: string;
};

type ProfileResponse = {
  user?: {
    children: Array<{
      id: string;
      targetLanguage: string;
      level: string;
    }>;
  };
};

const typeStyles: Record<string, { icon: string; color: string; label: string; action: string }> = {
  VOCABULARY: {
    icon: "🧩",
    color: "bg-cyan-50",
    label: "Vocabulário",
    action: "Aprender",
  },
  SPEAKING: {
    icon: "🎙️",
    color: "bg-blue-50",
    label: "Fala",
    action: "Praticar",
  },
  LISTENING: {
    icon: "👂",
    color: "bg-yellow-50",
    label: "Escuta",
    action: "Ouvir",
  },
  REVIEW: {
    icon: "🏅",
    color: "bg-orange-50",
    label: "Revisão",
    action: "Revisar",
  },
};

function formatLevel(level: string) {
  return level.toLowerCase();
}

function getTypeStyle(type: string) {
  return (
    typeStyles[type] || {
      icon: "⭐",
      color: "bg-livoz-soft",
      label: type.toLowerCase(),
      action: "Iniciar",
    }
  );
}

export default function MissionsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingLessonId, setSavingLessonId] = useState("");
  const [completedLessons, setCompletedLessons] = useState<Record<string, string>>({});
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    language: "english",
    level: "INICIANTE",
  });

  useEffect(() => {
    async function loadMissions() {
      try {
        const session = getSession();
        const userId = session.userId;
        const childId = session.childId;
        let language = "english";
        let level = "INICIANTE";

        if (userId) {
          const profileResponse = await fetch(`/api/users/${userId}`);
          const profileData = (await profileResponse.json()) as ProfileResponse;
          const currentChild =
            profileData.user?.children.find((child) => child.id === childId) ||
            profileData.user?.children[0];

          if (currentChild) {
            language = currentChild.targetLanguage || language;
            level = currentChild.level || level;
          }
        }

        setFilters({ language, level });

        const params = new URLSearchParams({
          language,
          level,
        });
        const lessonsResponse = await fetch(`/api/lessons?${params.toString()}`);
        const lessonsData = (await lessonsResponse.json()) as LessonsResponse;

        if (!lessonsResponse.ok) {
          setError(lessonsData.message || "Não foi possível carregar as missões agora.");
          return;
        }

        setLessons(lessonsData.lessons || []);
      } catch {
        setError("Não foi possível conectar ao Livoz agora.");
      } finally {
        setIsLoading(false);
      }
    }

    loadMissions();
  }, []);

  const subtitle = useMemo(() => {
    const languageLabel = filters.language === "english" ? "inglês" : filters.language;
    return `Missões reais de ${languageLabel} para nível ${formatLevel(filters.level)}.`;
  }, [filters.language, filters.level]);

  async function handleCompleteMission(lessonId: string) {
    const childId = getSession().childId;

    if (!childId) {
      router.push("/login");
      return;
    }

    setSavingLessonId(lessonId);
    setLessonErrors((current) => ({ ...current, [lessonId]: "" }));

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId,
          lessonId,
          score: 100,
          completed: true,
          stars: 3,
        }),
      });
      const data = (await response.json()) as ProgressResponse;

      if (!response.ok) {
        setLessonErrors((current) => ({
          ...current,
          [lessonId]: data.message || "Não foi possível concluir essa missão agora.",
        }));
        return;
      }

      setCompletedLessons((current) => ({
        ...current,
        [lessonId]: "Missão concluída! Você ganhou 3 estrelas!",
      }));
    } catch {
      setLessonErrors((current) => ({
        ...current,
        [lessonId]: "Não foi possível conectar ao Livoz agora.",
      }));
    } finally {
      setSavingLessonId("");
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-[32px] bg-livoz-soft p-6">
          <h1 className="font-title text-3xl font-extrabold text-livoz-navy">Missões</h1>
          <p className="mt-2 leading-7 text-slate-600">{subtitle}</p>
        </section>

        {isLoading ? (
          <section className="mt-5 rounded-[28px] bg-white p-5 text-center shadow-card">
            <h2 className="font-title text-xl font-extrabold">Carregando missões...</h2>
            <p className="mt-2 text-sm text-slate-500">Estamos buscando as atividades do banco.</p>
          </section>
        ) : error ? (
          <section className="mt-5 rounded-[28px] bg-orange-50 p-5 text-center text-orange-700 shadow-card">
            <h2 className="font-title text-xl font-extrabold">Ops!</h2>
            <p className="mt-2 text-sm font-bold">{error}</p>
          </section>
        ) : lessons.length === 0 ? (
          <section className="mt-5 rounded-[28px] bg-white p-5 text-center shadow-card">
            <h2 className="font-title text-xl font-extrabold text-livoz-navy">Nenhuma missão por aqui ainda.</h2>
            <p className="mt-2 text-sm text-slate-500">
              As próximas atividades vão aparecer assim que forem cadastradas para esse idioma e nível.
            </p>
          </section>
        ) : (
          <div className="mt-5 grid gap-4">
            {lessons.map((lesson) => {
              const style = getTypeStyle(lesson.type);
              const isSaving = savingLessonId === lesson.id;
              const successMessage = completedLessons[lesson.id];
              const lessonError = lessonErrors[lesson.id];

              return (
                <article
                  key={lesson.id}
                  className={`rounded-[26px] p-5 shadow-card ${successMessage ? "bg-green-50 ring-2 ring-green-100" : style.color}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-white text-2xl">
                        {successMessage ? "⭐" : style.icon}
                      </span>
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold uppercase text-livoz-blue">
                            {style.label}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold uppercase text-slate-500">
                            {formatLevel(lesson.level)}
                          </span>
                        </div>
                        <h2 className="mt-2 font-bold text-slate-900">{lesson.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {lesson.description || "Uma missão divertida espera pela criança."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCompleteMission(lesson.id)}
                      disabled={isSaving || Boolean(successMessage)}
                      className="shrink-0 rounded-full bg-livoz-blue px-4 py-2 text-xs font-extrabold text-white transition hover:bg-livoz-navy disabled:cursor-not-allowed disabled:bg-green-500"
                    >
                      {isSaving ? "Salvando..." : successMessage ? "Concluída" : "Concluir missão"}
                    </button>
                  </div>
                  {successMessage ? (
                    <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-green-700">
                      {successMessage}
                    </p>
                  ) : null}
                  {lessonError ? (
                    <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-orange-700">
                      {lessonError}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
