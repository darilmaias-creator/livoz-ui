export type VoiceConversationMode = "VOICE";

export type VoiceChatRequest = {
  childId: string;
  language: string;
  level: string;
  audio: File;
};

export type VoiceChatResponse = {
  transcript: string;
  reply: string;
  audioBase64: string;
  audioMimeType: string;
  conversationId: string;
};

export type VoiceApiError = {
  message: string;
};

export type VoiceRecordingState = "idle" | "recording" | "processing" | "playing" | "error";
