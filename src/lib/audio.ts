export const MAX_VOICE_AUDIO_BYTES = 8 * 1024 * 1024;

const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
]);

export function isSupportedAudioType(contentType: string) {
  const normalized = contentType.trim().toLowerCase();
  return SUPPORTED_AUDIO_TYPES.has(normalized) || normalized.startsWith("audio/webm");
}

export function validateAudioFile(file: File) {
  if (!file || file.size === 0) {
    return "Envie um áudio para a Livoz escutar.";
  }

  if (file.size > MAX_VOICE_AUDIO_BYTES) {
    return "O áudio ficou grande demais. Grave uma mensagem mais curtinha.";
  }

  if (!isSupportedAudioType(file.type)) {
    return "Formato de áudio não suportado agora.";
  }

  return "";
}

export async function fileToArrayBuffer(file: File) {
  return file.arrayBuffer();
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

export function base64ToDataUrl(base64: string, mimeType: string) {
  return `data:${mimeType};base64,${base64}`;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function pcm16Base64ToWavBase64(base64Pcm: string, sampleRate = 24000) {
  const pcmBuffer = Buffer.from(base64Pcm, "base64");
  const wavBuffer = new ArrayBuffer(44 + pcmBuffer.length);
  const view = new DataView(wavBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcmBuffer.length, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, pcmBuffer.length, true);

  new Uint8Array(wavBuffer, 44).set(pcmBuffer);

  return Buffer.from(wavBuffer).toString("base64");
}
