"use client";

import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FormEvent, useState } from "react";

type Message = {
  id: string;
  author: "bot" | "user";
  text: string;
};

const initialMessages: Message[] = [
  { id: "1", author: "bot", text: "Olá! Pronta para aprender uma palavra nova?" },
  { id: "2", author: "user", text: "Sim! Quero aprender agora." },
  { id: "3", author: "bot", text: "Que tal começarmos com apple?" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), author: "user", text: cleanText },
      {
        id: crypto.randomUUID(),
        author: "bot",
        text: `Legal! A Livoz recebeu: "${cleanText}". Vamos praticar outra palavra?`,
      },
    ]);
    setText("");
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-[32px] bg-gradient-to-br from-livoz-navy to-slate-800 p-6 text-white">
          <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Conversa textual simulada</span>
          <h1 className="mt-5 font-title text-3xl font-extrabold">Pratique com a Livoz</h1>
          <p className="mt-2 leading-7 text-white/80">Sem IA real nesta etapa, apenas uma conversa local para testar o fluxo.</p>
        </section>

        <section className="mt-5 rounded-[28px] bg-white p-4 shadow-card">
          <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[82%] rounded-[24px] px-4 py-3 leading-7 ${
                  message.author === "user" ? "justify-self-end bg-cyan-100" : "justify-self-start bg-blue-50"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-w-0 flex-1 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="Escreva sua mensagem..."
              required
            />
            <button className="rounded-[18px] bg-livoz-blue px-4 py-3 font-bold text-white" type="submit">
              Enviar
            </button>
          </form>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}
