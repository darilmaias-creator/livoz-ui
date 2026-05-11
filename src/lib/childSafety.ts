const personalDataPatterns = [
  /\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/i,
  /\b(?:\d[\s().-]?){10,}\b/,
  /\bmeu\s+endere[cç]o\b/i,
  /\bminha\s+escola\b/i,
  /\bmeu\s+telefone\b/i,
  /\bmeu\s+cpf\b/i,
];

export function detectPersonalDataRisk(message: string) {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    return false;
  }

  return personalDataPatterns.some((pattern) => pattern.test(cleanMessage));
}

export function getSafetyRedirectMessage() {
  return "Por segurança, não compartilhe dados pessoais aqui. Vamos continuar aprendendo? Me diga uma palavra em inglês que você conhece.";
}
