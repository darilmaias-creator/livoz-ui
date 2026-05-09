"use client";

import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getSession } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  author: "bot" | "user";
  text: string;
};

type ChatResponse = {
  message?: string;
  reply?: string;
  conversationId?: string;
};

type ConversationsResponse = {
  message?: string;
  conversations?: Array<{
    id: string;
    userMessage: string;
    aiResponse: string;
  }>;
};

type VoiceResponse = {
  message?: string;
  transcript?: string;
  reply?: string;
  audioBase64?: string;
  audioMimeType?: string;
  conversationId?: string;
};

const initialMessages: Message[] = [
  {
    id: "welcome",
    author: "bot",
    text: "Oi! Eu sou a Livoz. Escreva uma frase em ingles para praticarmos juntos.",
  },
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [childId, setChildId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceReply, setVoiceReply] = useState("");
  const [voiceAudioUrl, setVoiceAudioUrl] = useState("");
  const [voiceAudioError, setVoiceAudioError] = useState("");
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  function getPreferredAudioMimeType() {
    const preferredTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];

    return preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  useEffect(() => {
    const session = getSession();

    if (!session.childId) {
      router.replace("/login");
      return;
    }

    setChildId(session.childId);

    async function loadHistory() {
      try {
        const response = await fetch(`/api/ai/conversations?childId=${encodeURIComponent(session.childId || "")}`);
        const data = (await response.json()) as ConversationsResponse;

        if (!response.ok) {
          setError(data.message || "Não foi possível carregar o histórico da conversa.");
          return;
        }

        const historyMessages =
          data.conversations?.flatMap((conversation) => [
            {
              id: `${conversation.id}-user`,
              author: "user" as const,
              text: conversation.userMessage,
            },
            {
              id: `${conversation.id}-bot`,
              author: "bot" as const,
              text: conversation.aiResponse,
            },
          ]) || [];

        if (historyMessages.length > 0) {
          setMessages(historyMessages);
        }
      } catch {
        setError("Não foi possível conectar ao histórico do chat agora.");
      } finally {
        setIsHistoryLoading(false);
      }
    }

    loadHistory();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanText = text.trim();

    if (!cleanText || isLoading) {
      return;
    }

    if (!childId) {
      router.push("/login");
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      author: "user",
      text: cleanText,
    };

    setMessages((current) => [...current, userMessage]);
    setText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId,
          message: cleanText,
          language: "english",
          level: "INICIANTE",
        }),
      });
      const data = (await response.json()) as ChatResponse;

      if (!response.ok || !data.reply) {
        setError(data.message || "A Livoz não conseguiu responder agora. Tente de novo em instantes.");
        return;
      }

      const reply = data.reply;

      setMessages((current) => [
        ...current,
        {
          id: data.conversationId || crypto.randomUUID(),
          author: "bot",
          text: reply,
        },
      ]);
    } catch {
      setError("Não foi possível conectar ao chat agora. Tente novamente em instantes.");
    } finally {
      setIsLoading(false);
    }
  }

  async function startRecording() {
    setError("");
    setVoiceTranscript("");
    setVoiceReply("");
    setVoiceAudioUrl("");
    setVoiceAudioError("");

    if (!childId) {
      router.push("/login");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador ainda não suporta gravação de áudio.");
      return;
    }

    try {
      stopMicrophoneTracks();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      const mimeType = getPreferredAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      audioChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        stopMicrophoneTracks();

        if (audioBlob.size < 1200) {
          audioChunksRef.current = [];
          setError("Não consegui captar sua voz. Tente gravar por alguns segundos e fale perto do microfone.");
          return;
        }

        void sendVoiceAudio(audioBlob);
      };

      recorder.start(250);
      setIsRecording(true);
    } catch {
      setError("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
      setIsRecording(false);
      stopMicrophoneTracks();
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
    }
  }

  function stopMicrophoneTracks() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
  }

  async function sendVoiceAudio(audioBlob: Blob) {
    if (!childId) {
      router.push("/login");
      return;
    }

    setIsVoiceLoading(true);
    setError("");
    setVoiceAudioError("");

    try {
      const formData = new FormData();
      formData.append("childId", childId);
      formData.append("language", "english");
      formData.append("level", "INICIANTE");
      formData.append("audio", audioBlob, "livoz-voice.webm");

      const response = await fetch("/api/ai/voice-chat", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as VoiceResponse;

      if (!response.ok || !data.reply) {
        setError(data.message || "A Livoz não conseguiu responder por voz agora.");
        return;
      }

      setVoiceTranscript(data.transcript || "");
      setVoiceReply(data.reply);
      setVoiceAudioUrl(
        data.audioBase64 && data.audioMimeType
          ? `data:${data.audioMimeType};base64,${data.audioBase64}`
          : "",
      );

      if (data.transcript) {
        setMessages((current) => [
          ...current,
          {
            id: `${data.conversationId || crypto.randomUUID()}-voice-user`,
            author: "user",
            text: data.transcript || "",
          },
        ]);
      }

      setMessages((current) => [
        ...current,
        {
          id: data.conversationId || crypto.randomUUID(),
          author: "bot",
          text: data.reply || "",
        },
      ]);

    } catch {
      setError("Não foi possível enviar o áudio agora. Tente novamente em instantes.");
    } finally {
      setIsVoiceLoading(false);
      audioChunksRef.current = [];
    }
  }

  async function playVoiceReply() {
    if (!voiceAudioUrl) {
      setVoiceAudioError("Ainda não há áudio para tocar nesta resposta.");
      return;
    }

    setVoiceAudioError("");

    try {
      const audio = new Audio(voiceAudioUrl);
      await audio.play();
    } catch {
      setVoiceAudioError("Não foi possível tocar o áudio agora. Você ainda pode ler a resposta em texto.");
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="rounded-[32px] bg-gradient-to-br from-livoz-navy to-slate-800 p-6 text-white">
          <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Conversa textual com IA</span>
          <h1 className="mt-5 font-title text-3xl font-extrabold">Pratique com a Livoz</h1>
          <p className="mt-2 leading-7 text-white/80">
            Escreva uma mensagem e receba uma resposta curta, educativa e carinhosa.
          </p>
        </section>

        <section className="mt-5 rounded-[28px] bg-white p-4 shadow-card">
          <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1">
            {isHistoryLoading ? (
              <div className="justify-self-start rounded-[24px] bg-blue-50 px-4 py-3 text-sm font-bold text-livoz-blue">
                Carregando conversa...
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[82%] rounded-[24px] px-4 py-3 leading-7 ${
                  message.author === "user"
                    ? "justify-self-end bg-cyan-100 text-slate-900"
                    : "justify-self-start bg-blue-50 text-slate-800"
                }`}
              >
                {message.text}
              </div>
            ))}

            {isLoading ? (
              <div className="max-w-[82%] justify-self-start rounded-[24px] bg-blue-50 px-4 py-3 text-sm font-bold text-livoz-blue">
                Livoz está pensando...
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
              {error}
            </p>
          ) : null}

          <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-w-0 flex-1 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="Escreva sua mensagem..."
              disabled={isLoading || isHistoryLoading}
              required
            />
            <button
              className="rounded-[18px] bg-livoz-blue px-4 py-3 font-bold text-white transition hover:bg-livoz-navy disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isLoading || isHistoryLoading || !text.trim()}
            >
              {isLoading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </section>

        <section className="mt-5 rounded-[28px] bg-livoz-soft p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-livoz-blue">
                Conversa por voz
              </span>
              <h2 className="mt-4 font-title text-2xl font-extrabold text-livoz-navy">
                Fale com a Livoz
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Grave uma frase curta. A Livoz escuta, responde por texto e toca o áudio quando estiver disponível.
              </p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                Dica: fale perto do microfone por 2 ou 3 segundos, em um lugar mais silencioso.
              </p>
              <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-500">
                A voz da Livoz é gerada por inteligência artificial.
              </p>
            </div>
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-white text-3xl shadow-card">
              🎙️
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={startRecording}
              disabled={isRecording || isVoiceLoading}
              className="rounded-[18px] bg-livoz-blue px-4 py-3 font-extrabold text-white transition hover:bg-livoz-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              Começar gravação
            </button>
            <button
              type="button"
              onClick={stopRecording}
              disabled={!isRecording}
              className="rounded-[18px] bg-livoz-orange px-4 py-3 font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Parar gravação
            </button>
          </div>

          {isRecording ? (
            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-livoz-orange">
              Gravando...
            </p>
          ) : null}

          {isVoiceLoading ? (
            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-livoz-blue">
              Enviando áudio para a Livoz...
            </p>
          ) : null}

          {voiceTranscript ? (
            <div className="mt-4 rounded-2xl bg-white px-4 py-3">
              <p className="text-sm leading-6 text-slate-700">
                <strong>Você disse:</strong> {voiceTranscript}
              </p>
            </div>
          ) : null}

          {voiceTranscript ? (
            <div className="mt-3 rounded-2xl bg-yellow-50 px-4 py-3">
              <p className="text-sm leading-6 text-slate-700">
                Eu entendi que você disse: <strong>{voiceTranscript}</strong>
              </p>
              <p className="mt-2 text-sm font-extrabold text-livoz-orange">
                Ótima tentativa! Continue praticando.
              </p>
            </div>
          ) : null}

          {voiceReply ? (
            <div className="mt-3 rounded-2xl bg-white px-4 py-3">
              <p className="text-sm leading-6 text-slate-700">
                <strong>Livoz respondeu:</strong> {voiceReply}
              </p>
              {voiceAudioUrl ? (
                <button
                  type="button"
                  onClick={playVoiceReply}
                  className="mt-3 rounded-[16px] bg-livoz-blue px-4 py-2 text-sm font-extrabold text-white transition hover:bg-livoz-navy"
                >
                  Ouvir resposta
                </button>
              ) : null}
              {voiceAudioError ? (
                <p className="mt-3 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                  {voiceAudioError}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}
