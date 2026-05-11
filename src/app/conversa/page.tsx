"use client";

import { AppShell } from "@/components/AppShell";
import { LiveVoiceConversation } from "@/components/LiveVoiceConversation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getSession, getStorageItem, setStorageItem } from "@/lib/storage";
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
  correction?: string | null;
  newWord?: {
    pt: string;
    en: string;
  } | null;
  challenge?: string | null;
  stars?: number;
  nextQuestion?: string | null;
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
  correction?: string | null;
  newWord?: {
    pt: string;
    en: string;
  } | null;
  challenge?: string | null;
  stars?: number;
  nextQuestion?: string | null;
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

const AI_NOTICE_STORAGE_KEY = "livozAiConversationNoticeAccepted";

const topics = [
  { label: "Cumprimentos", value: "greetings", icon: "👋" },
  { label: "Animais", value: "animals", icon: "🐾" },
  { label: "Cores", value: "colors", icon: "🎨" },
  { label: "Escola", value: "school", icon: "🎒" },
  { label: "Família", value: "family", icon: "🏠" },
  { label: "Comida", value: "food", icon: "🍎" },
  { label: "Números", value: "numbers", icon: "🔢" },
  { label: "Brinquedos", value: "toys", icon: "🧸" },
];

const modes = [
  { label: "Conversa livre", value: "FREE_PRACTICE" },
  { label: "Aula guiada", value: "GUIDED_LESSON" },
  { label: "Jogo de palavras", value: "WORD_GAME" },
  { label: "Faz de conta", value: "ROLEPLAY" },
  { label: "Desafio do dia", value: "DAILY_CHALLENGE" },
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(topics[0]);
  const [conversationMode, setConversationMode] = useState(modes[0].value);
  const [lastPrompt, setLastPrompt] = useState("");
  const [lastChallenge, setLastChallenge] = useState<string | null>(null);
  const [lastNewWord, setLastNewWord] = useState<{ pt: string; en: string } | null>(null);
  const [lastStars, setLastStars] = useState<number | null>(null);
  const [lastNextQuestion, setLastNextQuestion] = useState<string | null>(null);
  const [lastCorrection, setLastCorrection] = useState<string | null>(null);
  const [sessionChildMessages, setSessionChildMessages] = useState(0);
  const [showPracticePause, setShowPracticePause] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceReply, setVoiceReply] = useState("");
  const [voiceAudioUrl, setVoiceAudioUrl] = useState("");
  const [voiceAudioError, setVoiceAudioError] = useState("");
  const [showAiNotice, setShowAiNotice] = useState(false);
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
    setShowAiNotice(getStorageItem(AI_NOTICE_STORAGE_KEY) !== "true");

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

  function acceptAiNotice() {
    setStorageItem(AI_NOTICE_STORAGE_KEY, "true");
    setShowAiNotice(false);
  }

  function applyStructuredResponse(data: ChatResponse) {
    setLastChallenge(data.challenge || null);
    setLastNewWord(data.newWord || null);
    setLastStars(typeof data.stars === "number" ? data.stars : null);
    setLastNextQuestion(data.nextQuestion || null);
    setLastCorrection(data.correction || null);
  }

  function chooseNewTheme() {
    const currentIndex = topics.findIndex((topic) => topic.value === selectedTopic.value);
    const nextTopic = topics[(currentIndex + 1) % topics.length];
    setSelectedTopic(nextTopic);
    setLastChallenge(null);
    setLastNewWord(null);
    setLastStars(null);
    setLastNextQuestion(null);
    setLastCorrection(null);
  }

  function tryAgain() {
    const retryText = lastNextQuestion || lastChallenge || lastPrompt || "";
    setText(retryText);
  }

  function registerChildMessageInSession() {
    setSessionChildMessages((current) => {
      const nextCount = current + 1;

      if (nextCount % 10 === 0) {
        setShowPracticePause(true);
      }

      return nextCount;
    });
  }

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

    registerChildMessageInSession();
    setLastPrompt(cleanText);
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
          conversationMode,
          topic: selectedTopic.value,
        }),
      });
      const data = (await response.json()) as ChatResponse;

      if (!response.ok || !data.reply) {
        setError(data.message || "A Livoz não conseguiu responder agora. Tente de novo em instantes.");
        return;
      }

      const reply = data.reply;
      applyStructuredResponse(data);

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
      formData.append("conversationMode", conversationMode);
      formData.append("topic", selectedTopic.value);
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
      applyStructuredResponse(data);
      setVoiceAudioUrl(
        data.audioBase64 && data.audioMimeType
          ? `data:${data.audioMimeType};base64,${data.audioBase64}`
          : "",
      );

      if (data.transcript) {
        registerChildMessageInSession();
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
          <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Você está praticando inglês</span>
          <h1 className="mt-5 font-title text-3xl font-extrabold">Fale com a Livoz</h1>
          <p className="mt-2 leading-7 text-white/80">
            Tema atual: {selectedTopic.icon} {selectedTopic.label}
          </p>
        </section>

        {showAiNotice ? (
          <section className="mt-5 rounded-[28px] border border-blue-100 bg-white p-5 shadow-card">
            <span className="rounded-full bg-livoz-soft px-4 py-2 text-xs font-extrabold text-livoz-blue">
              Antes de começar
            </span>
            <h2 className="mt-4 font-title text-2xl font-extrabold text-livoz-navy">
              Como a Livoz ajuda
            </h2>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600">
              <p>A inteligência artificial ajuda a praticar frases, palavras e pequenas conversas.</p>
              <p>Ela pode cometer erros, então um responsável deve acompanhar o uso quando precisar.</p>
              <p>Nunca envie endereço, telefone, documentos ou dados pessoais na conversa.</p>
            </div>
            <button
              type="button"
              onClick={acceptAiNotice}
              className="mt-5 rounded-[18px] bg-livoz-blue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-livoz-navy"
            >
              Entendi
            </button>
          </section>
        ) : null}

        <div className="mt-5">
          <LiveVoiceConversation
            topic={selectedTopic.value}
            language="english"
            level="INICIANTE"
            onFallbackText={() => setError("Use a conversa por texto abaixo enquanto a conversa ao vivo não conecta.")}
            onFallbackVoice={() => void startRecording()}
          />
        </div>

        <section className="mt-5 rounded-[28px] bg-white p-4 shadow-card">
          <div className="mb-4">
            <h2 className="font-title text-xl font-extrabold text-livoz-navy">Escolha um tema</h2>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {topics.map((topic) => (
                <button
                  key={topic.value}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`shrink-0 rounded-[18px] px-4 py-3 text-sm font-extrabold transition ${
                    selectedTopic.value === topic.value
                      ? "bg-livoz-blue text-white"
                      : "bg-livoz-soft text-livoz-navy"
                  }`}
                >
                  {topic.icon} {topic.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-title text-xl font-extrabold text-livoz-navy">Modo de prática</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {modes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setConversationMode(mode.value)}
                  className={`rounded-[18px] px-3 py-3 text-xs font-extrabold transition ${
                    conversationMode === mode.value
                      ? "bg-livoz-orange text-white"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mb-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-livoz-blue">
            A Livoz usa inteligência artificial para ajudar no aprendizado.
          </p>
          <p className="mb-4 rounded-2xl bg-yellow-50 px-4 py-3 text-xs font-bold leading-5 text-livoz-navy">
            Nunca envie endereço, telefone, documentos ou dados pessoais.
          </p>
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

          {(lastChallenge || lastNewWord || lastStars !== null || lastCorrection || lastNextQuestion) ? (
            <div className="mt-4 grid gap-3">
              {lastStars !== null ? (
                <div className="rounded-[22px] bg-yellow-50 px-4 py-3 text-sm font-extrabold text-livoz-navy">
                  Você ganhou {lastStars} estrela{lastStars === 1 ? "" : "s"}! {"⭐".repeat(Math.max(0, lastStars))}
                </div>
              ) : null}

              {lastNewWord ? (
                <div className="rounded-[22px] bg-cyan-50 px-4 py-3">
                  <p className="text-xs font-extrabold uppercase text-livoz-blue">Palavra Nova</p>
                  <p className="mt-1 text-lg font-extrabold text-livoz-navy">
                    {lastNewWord.pt} <span className="text-slate-400">→</span> {lastNewWord.en}
                  </p>
                </div>
              ) : null}

              {lastChallenge ? (
                <div className="rounded-[22px] bg-orange-50 px-4 py-3">
                  <p className="text-xs font-extrabold uppercase text-orange-700">Mini Desafio</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-700">{lastChallenge}</p>
                </div>
              ) : null}

              {lastCorrection ? (
                <div className="rounded-[22px] bg-blue-50 px-4 py-3">
                  <p className="text-xs font-extrabold uppercase text-livoz-blue">Correção carinhosa</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-700">{lastCorrection}</p>
                </div>
              ) : null}

              {lastNextQuestion ? (
                <div className="rounded-[22px] bg-livoz-soft px-4 py-3">
                  <p className="text-xs font-extrabold uppercase text-livoz-navy">Próxima pergunta</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-700">{lastNextQuestion}</p>
                </div>
              ) : null}
            </div>
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

          {showPracticePause ? (
            <div className="mt-4 rounded-[24px] bg-yellow-50 p-4">
              <h3 className="font-title text-xl font-extrabold text-livoz-navy">
                Você completou uma prática!
              </h3>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                Quer continuar ou fazer uma missão?
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowPracticePause(false)}
                  className="rounded-[18px] bg-livoz-blue px-4 py-3 text-sm font-extrabold text-white transition hover:bg-livoz-navy"
                >
                  Continuar conversando
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/missoes")}
                  className="rounded-[18px] bg-livoz-orange px-4 py-3 text-sm font-extrabold text-white transition"
                >
                  Fazer missão
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={startRecording}
              disabled={isRecording || isVoiceLoading}
              className="rounded-[16px] bg-livoz-cyan px-3 py-3 text-xs font-extrabold text-white transition disabled:opacity-60"
            >
              Falar
            </button>
            <button
              type="button"
              onClick={tryAgain}
              className="rounded-[16px] bg-slate-50 px-3 py-3 text-xs font-extrabold text-slate-600"
            >
              Tentar de novo
            </button>
            <button
              type="button"
              onClick={chooseNewTheme}
              className="rounded-[16px] bg-livoz-yellow px-3 py-3 text-xs font-extrabold text-livoz-navy"
            >
              Novo tema
            </button>
          </div>
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
                A voz da Livoz é gerada por inteligência artificial, não por uma pessoa real.
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
