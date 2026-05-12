"use client";

import { detectPersonalDataRisk, getSafetyRedirectMessage } from "@/lib/childSafety";
import { getSession } from "@/lib/storage";
import { useEffect, useRef, useState } from "react";

type LiveSessionResponse = {
  message?: string;
  token?: string;
  model?: string;
  language?: string;
  level?: string;
  topic?: string;
};

type LiveStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "paused" | "error";
type LiveVoiceVariant = "normal" | "kid";

type LiveSessionLike = {
  sendRealtimeInput: (input: unknown) => void;
  close: () => void;
};

type AudioContextConstructor = typeof AudioContext;

type WebkitWindow = Window & {
  webkitAudioContext?: AudioContextConstructor;
};

const MAX_LIVE_TURNS = 10;
const MAX_LIVE_SESSION_MS = 5 * 60 * 1000;

function statusLabel(status: LiveStatus, variant: LiveVoiceVariant) {
  const kidPrefix = variant === "kid";

  if (status === "connecting") return kidPrefix ? "✨ Preparando..." : "Preparando a conversa...";
  if (status === "listening") return kidPrefix ? "👂 Estou ouvindo você..." : "Estou ouvindo...";
  if (status === "thinking") return kidPrefix ? "🧠 A Livoz está pensando..." : "A Livoz está pensando...";
  if (status === "speaking") return kidPrefix ? "🗣️ A Livoz está falando..." : "A Livoz está falando...";
  if (status === "paused") return "Conversa pausada.";
  if (status === "error") return "Não consegui iniciar a conversa ao vivo agora.";
  return "Toque no botão para começar.";
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return window.btoa(binary);
}

function base64ToInt16Array(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Int16Array(bytes.buffer);
}

function downsampleToPcm16(input: Float32Array, inputSampleRate: number, outputSampleRate = 16000) {
  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Int16Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = Math.floor(index * ratio);
    const sample = Math.max(-1, Math.min(1, input[sourceIndex] || 0));
    output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return arrayBufferToBase64(output.buffer);
}

function getAudioSampleRate(mimeType?: string) {
  const match = mimeType?.match(/rate=(\d+)/i);
  return match?.[1] ? Number(match[1]) : 24000;
}

export function LiveVoiceConversation({
  topic,
  level = "INICIANTE",
  language = "english",
  onFallbackText,
  onFallbackVoice,
  variant = "normal",
}: {
  topic: string;
  level?: string;
  language?: string;
  onFallbackText?: () => void;
  onFallbackVoice?: () => void;
  variant?: LiveVoiceVariant;
}) {
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [replyText, setReplyText] = useState("");
  const [turns, setTurns] = useState(0);
  const [showHealthyPause, setShowHealthyPause] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const sessionRef = useRef<LiveSessionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackTimeRef = useRef(0);
  const lastInputRef = useRef("");
  const currentOutputRef = useRef("");
  const lastAudioPartsRef = useRef<Array<{ data: string; mimeType?: string }>>([]);
  const sessionStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      void closeLiveConversation();
    };
  }, []);

  async function saveTurn(userMessage: string, aiResponse: string) {
    const session = getSession();

    if (!session.childId) return;

    try {
      await fetch("/api/ai/live/turn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId: session.childId,
          userMessage,
          aiResponse,
          language,
          level,
        }),
      });
    } catch {
      // Saving the transcript is best-effort in the live experience.
    }
  }

  function speakSafetyMessage() {
    const safetyMessage = getSafetyRedirectMessage();
    setReplyText(safetyMessage);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(safetyMessage);
      utterance.lang = "pt-BR";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }

  async function startLiveConversation() {
    setStatus("connecting");
    setMessage("");
    setFallbackVisible(false);
    setAudioBlocked(false);

    const localSession = getSession();
    if (!localSession.userId || !localSession.childId) {
      setStatus("error");
      setMessage("Entre novamente para usar a conversa ao vivo.");
      setFallbackVisible(true);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setMessage("Este navegador não permite conversa ao vivo pelo microfone.");
      setFallbackVisible(true);
      return;
    }

    try {
      const response = await fetch("/api/ai/live/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: localSession.userId,
          childId: localSession.childId,
          language,
          level,
          topic,
        }),
      });
      const data = (await response.json()) as LiveSessionResponse;

      if (!response.ok || !data.token || !data.model) {
        setStatus("error");
        setMessage(data.message || "Não consegui iniciar a conversa ao vivo agora.");
        setFallbackVisible(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      const { GoogleGenAI, Modality } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: data.token,
        httpOptions: { apiVersion: "v1alpha" },
      });
      const liveSession = await ai.live.connect({
        model: data.model,
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
            },
          },
        },
        callbacks: {
          onopen: () => {
            setStatus("listening");
            setMessage("");
          },
          onmessage: (event: unknown) => {
            handleLiveMessage(event);
          },
          onerror: () => {
            setStatus("error");
            setMessage("Não consegui iniciar a conversa ao vivo agora.");
            setFallbackVisible(true);
          },
          onclose: () => {
            if (status !== "idle") {
              setStatus("idle");
            }
          },
        },
      });

      sessionRef.current = liveSession as LiveSessionLike;
      streamRef.current = stream;
      sessionStartedAtRef.current = Date.now();
      startStreamingMic(stream, liveSession as LiveSessionLike);
    } catch {
      setStatus("error");
      setMessage("Não consegui iniciar a conversa ao vivo agora.");
      setFallbackVisible(true);
      await closeLiveConversation();
    }
  }

  function startStreamingMic(stream: MediaStream, liveSession: LiveSessionLike) {
    const AudioContextClass = window.AudioContext || (window as WebkitWindow).webkitAudioContext;

    if (!AudioContextClass) {
      setStatus("error");
      setMessage("Este navegador não suporta áudio ao vivo.");
      setFallbackVisible(true);
      return;
    }

    const audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (event) => {
      if (!sessionRef.current || status === "paused") return;

      const input = event.inputBuffer.getChannelData(0);
      const data = downsampleToPcm16(input, audioContext.sampleRate, 16000);

      liveSession.sendRealtimeInput({
        audio: {
          data,
          mimeType: "audio/pcm;rate=16000",
        },
      });
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    audioContextRef.current = audioContext;
    sourceRef.current = source;
    processorRef.current = processor;
  }

  function handleLiveMessage(messageEvent: unknown) {
    const messageData = messageEvent as {
      text?: string;
      data?: string;
      serverContent?: {
        inputTranscription?: { text?: string };
        outputTranscription?: { text?: string };
        modelTurn?: {
          parts?: Array<{
            inlineData?: { data?: string; mimeType?: string };
            inline_data?: { data?: string; mime_type?: string };
            text?: string;
          }>;
        };
        turnComplete?: boolean;
        generationComplete?: boolean;
        waitingForInput?: boolean;
      };
    };
    const serverContent = messageData.serverContent;
    const inputText = serverContent?.inputTranscription?.text;
    const outputText = serverContent?.outputTranscription?.text || messageData.text;

    if (inputText) {
      lastInputRef.current = inputText;
      setTranscript(inputText);
      setStatus("thinking");

      if (detectPersonalDataRisk(inputText)) {
        speakSafetyMessage();
      }
    }

    if (outputText) {
      currentOutputRef.current = `${currentOutputRef.current} ${outputText}`.trim();
      setReplyText(currentOutputRef.current);
    }

    const parts = serverContent?.modelTurn?.parts || [];
    for (const part of parts) {
      const inlineData = part.inlineData || part.inline_data;
      const audioData = inlineData?.data;

      if (audioData) {
        const typedInlineData = inlineData as { mimeType?: string; mime_type?: string };
        const mimeType = typedInlineData.mimeType || typedInlineData.mime_type || "audio/pcm;rate=24000";
        lastAudioPartsRef.current.push({ data: audioData, mimeType });
        setStatus("speaking");
        void playPcmAudio(audioData, mimeType);
      }
    }

    if (serverContent?.turnComplete || serverContent?.generationComplete || serverContent?.waitingForInput) {
      const userMessage = lastInputRef.current;
      const aiResponse = currentOutputRef.current || "Resposta por voz da Livoz.";

      if (userMessage) {
        void saveTurn(userMessage, aiResponse);
        setTurns((current) => {
          const nextTurns = current + 1;
          const timeLimitReached =
            sessionStartedAtRef.current !== null &&
            Date.now() - sessionStartedAtRef.current >= MAX_LIVE_SESSION_MS;

          if (nextTurns % MAX_LIVE_TURNS === 0 || timeLimitReached) {
            setShowHealthyPause(true);
          }

          return nextTurns;
        });
      }

      currentOutputRef.current = "";
      lastInputRef.current = "";
      setStatus("listening");
    }
  }

  async function playPcmAudio(base64Audio: string, mimeType?: string) {
    const AudioContextClass = window.AudioContext || (window as WebkitWindow).webkitAudioContext;

    if (!AudioContextClass) {
      setAudioBlocked(true);
      return;
    }

    const audioContext = audioContextRef.current || new AudioContextClass();
    audioContextRef.current = audioContext;

    try {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const pcm = base64ToInt16Array(base64Audio);
      const sampleRate = getAudioSampleRate(mimeType);
      const audioBuffer = audioContext.createBuffer(1, pcm.length, sampleRate);
      const channel = audioBuffer.getChannelData(0);

      for (let index = 0; index < pcm.length; index += 1) {
        channel[index] = pcm[index] / 32768;
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      const startAt = Math.max(audioContext.currentTime, playbackTimeRef.current);
      source.start(startAt);
      playbackTimeRef.current = startAt + audioBuffer.duration;
    } catch {
      setAudioBlocked(true);
    }
  }

  async function repeatLastReply() {
    if (lastAudioPartsRef.current.length === 0) {
      setAudioBlocked(true);
      return;
    }

    playbackTimeRef.current = audioContextRef.current?.currentTime || 0;

    for (const part of lastAudioPartsRef.current) {
      await playPcmAudio(part.data, part.mimeType);
    }
  }

  function pauseLiveConversation() {
    setStatus((current) => (current === "paused" ? "listening" : "paused"));
  }

  async function closeLiveConversation() {
    sessionRef.current?.close();
    sessionRef.current = null;
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    processorRef.current = null;
    sourceRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      await audioContextRef.current.close();
    }

    audioContextRef.current = null;
    playbackTimeRef.current = 0;
    setStatus("idle");
  }

  const isKidVariant = variant === "kid";

  return (
    <section
      className={`rounded-[30px] bg-gradient-to-br from-livoz-blue to-livoz-cyan text-white shadow-card ${
        isKidVariant ? "p-6" : "p-5"
      }`}
    >
      <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-extrabold">
        {isKidVariant ? "🎙️ Falar com a Livoz" : "Conversa ao Vivo"}
      </span>
      <h2 className={`mt-5 font-title font-extrabold ${isKidVariant ? "text-4xl" : "text-3xl"}`}>
        Fale com a Livoz
      </h2>
      <p className={`mt-2 font-bold leading-6 text-white/85 ${isKidVariant ? "text-base" : "text-sm"}`}>
        {isKidVariant
          ? "Toque, fale e escute a resposta."
          : "Fale naturalmente com a Livoz. Ela vai ouvir e responder por voz."}
      </p>

      <div className="mt-5 rounded-[24px] bg-white/15 p-4 text-center">
        <p className={`font-title font-extrabold ${isKidVariant ? "text-3xl leading-tight" : "text-2xl"}`}>
          {statusLabel(status, variant)}
        </p>
        {transcript && !isKidVariant ? <p className="mt-3 text-sm text-white/85">Você disse: {transcript}</p> : null}
        {replyText ? (
          <p className={`mt-3 font-bold text-white/90 ${isKidVariant ? "text-lg leading-7" : "text-sm"}`}>
            {isKidVariant ? replyText : `Livoz: ${replyText}`}
          </p>
        ) : null}
        {message ? <p className="mt-3 text-sm font-bold text-yellow-100">{message}</p> : null}
      </div>

      {showHealthyPause ? (
        <div className="mt-4 rounded-[22px] bg-white p-4 text-livoz-navy">
          <h3 className="font-title text-xl font-extrabold">Você praticou muito bem!</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            Quer continuar ou fazer uma missão?
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowHealthyPause(false)}
              className="rounded-[18px] bg-livoz-blue px-4 py-3 text-sm font-extrabold text-white"
            >
              Continuar
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/missoes";
              }}
              className="rounded-[18px] bg-livoz-orange px-4 py-3 text-sm font-extrabold text-white"
            >
              Fazer missão
            </button>
          </div>
        </div>
      ) : null}

      {fallbackVisible && !isKidVariant ? (
        <div className="mt-4 rounded-[22px] bg-white p-4 text-livoz-navy">
          <p className="text-sm font-bold leading-6">Não consegui iniciar a conversa ao vivo agora.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onFallbackText}
              className="rounded-[18px] bg-livoz-blue px-4 py-3 text-sm font-extrabold text-white"
            >
              Usar conversa por texto
            </button>
            <button
              type="button"
              onClick={onFallbackVoice}
              className="rounded-[18px] bg-livoz-orange px-4 py-3 text-sm font-extrabold text-white"
            >
              Usar modo de voz simples
            </button>
          </div>
        </div>
      ) : null}

      {audioBlocked ? (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-livoz-navy">
          Se o áudio não tocar sozinho, toque em “Repetir”.
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {status === "idle" || status === "error" ? (
          <button
            type="button"
            onClick={() => void startLiveConversation()}
            className={`rounded-[22px] bg-white px-5 font-extrabold text-livoz-blue shadow-card ${
              isKidVariant ? "min-h-24 text-2xl" : "py-4 text-lg"
            }`}
          >
            🎙️ Conversar com a Livoz
          </button>
        ) : null}

        {status !== "idle" && status !== "error" ? (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => void repeatLastReply()}
              className="rounded-[18px] bg-white/95 px-3 py-3 text-xs font-extrabold text-livoz-blue"
            >
              🔁 Repetir
            </button>
            <button
              type="button"
              onClick={pauseLiveConversation}
              className="rounded-[18px] bg-white/95 px-3 py-3 text-xs font-extrabold text-livoz-navy"
            >
              ⏸️ Pausar
            </button>
            <button
              type="button"
              onClick={() => void closeLiveConversation()}
              className="rounded-[18px] bg-white/95 px-3 py-3 text-xs font-extrabold text-orange-700"
            >
              🚪 Sair
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
