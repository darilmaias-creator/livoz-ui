function normalizeTranscript(transcript: string) {
  return transcript
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSlowRepeatRequest(transcript: string): boolean {
  const normalized = normalizeTranscript(transcript);

  if (!normalized) {
    return false;
  }

  const patterns = [
    "fala mais devagar",
    "fale mais devagar",
    "mais devagar",
    "mais lento",
    "fala lento",
    "repete",
    "repita",
    "repete devagar",
    "repita devagar",
    "fala de novo",
    "fale de novo",
    "de novo",
    "nao entendi",
    "nao ouvi",
    "nao escutei",
    "o que voce falou",
  ];

  return patterns.some((pattern) => normalized.includes(pattern));
}
