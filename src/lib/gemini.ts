type GeminiTextResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          data?: string;
          mimeType?: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class GeminiRequestError extends Error {
  status: number;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = "GeminiRequestError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "";
}

function extractRetryAfterSeconds(message: string) {
  const match = message.match(/retry in ([\d.]+)s/i);
  return match?.[1] ? Math.ceil(Number(match[1])) : undefined;
}

function extractText(data: GeminiTextResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim() || ""
  );
}

function extractInlineAudio(data: GeminiTextResponse) {
  const inlineData = data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;

  return {
    data: inlineData?.data || "",
    mimeType: inlineData?.mimeType || "",
  };
}

async function callGeminiGenerateContent({
  apiKey,
  model,
  body,
}: {
  apiKey: string;
  model: string;
  body: unknown;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    },
  );
  const data = (await response.json()) as GeminiTextResponse;

  if (!response.ok) {
    const message = data.error?.message || response.statusText;
    console.error("Erro na API Gemini:", message);
    throw new GeminiRequestError(message, response.status, extractRetryAfterSeconds(message));
  }

  return data;
}

export async function generateGeminiText({
  apiKey,
  prompt,
  message,
}: {
  apiKey: string;
  prompt: string;
  message: string;
}) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const data = await callGeminiGenerateContent({
    apiKey,
    model,
    body: {
      systemInstruction: {
        parts: [{ text: prompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 160,
        temperature: 0.7,
      },
    },
  });
  const text = extractText(data);

  if (!text) {
    throw new Error("GEMINI_EMPTY_TEXT");
  }

  return text;
}

export async function transcribeGeminiAudio({
  apiKey,
  audioBase64,
  mimeType,
  language,
}: {
  apiKey: string;
  audioBase64: string;
  mimeType: string;
  language: string;
}) {
  const model = process.env.GEMINI_AUDIO_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const data = await callGeminiGenerateContent({
    apiKey,
    model,
    body: {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Transcreva o audio para texto. Retorne apenas o texto falado pela crianca. Idioma esperado: ${language}.`,
            },
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 120,
        temperature: 0.2,
      },
    },
  });
  const transcript = extractText(data);

  if (!transcript) {
    throw new Error("GEMINI_EMPTY_TRANSCRIPT");
  }

  return transcript;
}

export async function synthesizeGeminiSpeech({
  apiKey,
  text,
}: {
  apiKey: string;
  text: string;
}) {
  const model = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
  const data = await callGeminiGenerateContent({
    apiKey,
    model,
    body: {
      contents: [
        {
          role: "user",
          parts: [{ text: `Leia com voz alegre e carinhosa para uma crianca: ${text}` }],
        },
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: process.env.GEMINI_TTS_VOICE || "Kore",
            },
          },
        },
      },
    },
  });
  const audio = extractInlineAudio(data);

  if (!audio.data) {
    throw new Error("GEMINI_EMPTY_AUDIO");
  }

  return audio;
}
