export type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "EXPIRED" | "CANCELED";

export type BenefitType = "SOCIOEDUCATIVA" | "MERITO_BIMESTRAL" | "PROVA_DESAFIO" | "MODO_GRATUITO";

export type Plan = {
  id: string;
  name: string;
  slug: string;
  price: string;
  description: string | null;
  active: boolean;
};

export type Subscription = {
  id: string;
  userId: string;
  childId: string;
  planId: string;
  status: SubscriptionStatus;
  benefitType: BenefitType;
  discountPercentage: number;
  startsAt: string;
  endsAt: string | null;
  plan?: Plan;
};
