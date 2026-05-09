export type BenefitType = "SOCIOEDUCATIVA" | "MERITO_BIMESTRAL" | "PROVA_DESAFIO" | "MODO_GRATUITO";

export function calculateMeritoBimestralDiscount(schoolAverage: number) {
  if (schoolAverage >= 8.5 && schoolAverage <= 10) return 100;
  if (schoolAverage >= 8.0 && schoolAverage < 8.5) return 70;
  if (schoolAverage >= 7.0 && schoolAverage < 8.0) return 50;
  if (schoolAverage >= 6.0 && schoolAverage < 7.0) return 30;
  return 0;
}

export function calculateProvaDesafioDiscount(challengeGrade: number) {
  if (challengeGrade >= 9.0 && challengeGrade <= 10) return 100;
  if (challengeGrade >= 8.0 && challengeGrade < 9.0) return 70;
  if (challengeGrade >= 7.0 && challengeGrade < 8.0) return 50;
  if (challengeGrade >= 6.0 && challengeGrade < 7.0) return 30;
  return 0;
}

export function getBenefitValidity(type: BenefitType) {
  if (type === "SOCIOEDUCATIVA") return 180;
  if (type === "MERITO_BIMESTRAL") return 60;
  if (type === "PROVA_DESAFIO") return 30;
  return null;
}

export function getBenefitLabel(type: BenefitType) {
  if (type === "SOCIOEDUCATIVA") return "Bolsa Socioeducativa";
  if (type === "MERITO_BIMESTRAL") return "Mérito Bimestral";
  if (type === "PROVA_DESAFIO") return "Prova Desafio";
  return "Modo Gratuito";
}
