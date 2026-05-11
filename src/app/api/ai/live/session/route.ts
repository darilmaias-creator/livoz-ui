import { buildLivozLiveVoicePrompt } from "@/lib/aiPrompt";
import { getGeminiApiKey } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";

type LiveSessionBody = {
  userId?: string;
  childId?: string;
  language?: string;
  level?: string;
  topic?: string;
};

const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-2.5-flash-native-audio-preview-12-2025";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LiveSessionBody;
    const userId = body.userId?.trim();
    const childId = body.childId?.trim();
    const language = body.language?.trim() || "english";
    const level = body.level?.trim().toUpperCase() || "INICIANTE";
    const topic = body.topic?.trim() || "tema livre adequado ao nível";

    if (!userId) {
      return NextResponse.json(
        { message: "Informe o responsável para iniciar a conversa ao vivo." },
        { status: 400 },
      );
    }

    if (!childId) {
      return NextResponse.json(
        { message: "Informe a criança para iniciar a conversa ao vivo." },
        { status: 400 },
      );
    }

    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId,
      },
      select: {
        id: true,
        name: true,
        age: true,
        targetLanguage: true,
        level: true,
      },
    });

    if (!child) {
      return NextResponse.json(
        { message: "Criança não encontrada para este responsável." },
        { status: 404 },
      );
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { message: "Conversa ao vivo ainda não configurada no servidor." },
        { status: 500 },
      );
    }

    const prompt = buildLivozLiveVoicePrompt({
      childName: child.name,
      childAge: child.age,
      language: language || child.targetLanguage,
      level: level || child.level,
      topic,
    });
    const client = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1alpha" },
    });
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: prompt,
            temperature: 0.7,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
              },
            },
          },
        },
        lockAdditionalFields: [],
      },
    });

    if (!token.name) {
      return NextResponse.json(
        { message: "Não foi possível criar uma sessão segura da conversa ao vivo." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        token: token.name,
        model: LIVE_MODEL,
        language,
        level,
        topic,
        child: {
          id: child.id,
          name: child.name,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao criar sessão Gemini Live:", error);

    return NextResponse.json(
      { message: "Não consegui iniciar a conversa ao vivo agora." },
      { status: 500 },
    );
  }
}
