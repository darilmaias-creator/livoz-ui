"use client";

import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const missions = [
  {
    icon: "🎙️",
    title: "Conversa divertida",
    text: "Pratique frases simples e ganhe estrelas.",
    action: "Iniciar",
    color: "bg-blue-50",
  },
  {
    icon: "🧠",
    title: "Jogo de palavras",
    text: "Monte pares e aprenda vocabulário novo.",
    action: "Jogar",
    color: "bg-cyan-50",
  },
  {
    icon: "📖",
    title: "Minhistória",
    text: "Leia e responda perguntas simples.",
    action: "Ouvir",
    color: "bg-yellow-50",
  },
  {
    icon: "🏅",
    title: "Desafio rápido",
    text: "Complete em 5 minutos e conquiste medalhas.",
    action: "Começar",
    color: "bg-orange-50",
  },
];

export default function MissionsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-[32px] bg-livoz-soft p-6">
          <h1 className="font-title text-3xl font-extrabold text-livoz-navy">Missões</h1>
          <p className="mt-2 leading-7 text-slate-600">Atividades simuladas para a criança explorar o idioma.</p>
        </section>

        <div className="mt-5 grid gap-4">
          {missions.map((mission) => (
            <article key={mission.title} className={`flex items-center justify-between gap-4 rounded-[26px] p-5 shadow-card ${mission.color}`}>
              <div className="flex gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-white text-2xl">{mission.icon}</span>
                <div>
                  <h2 className="font-bold text-slate-900">{mission.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{mission.text}</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-livoz-blue">{mission.action}</span>
            </article>
          ))}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
