export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  role: "responsavel";
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  confirmedResponsible: boolean;
  createdAt: string;
};

export type Child = {
  id: string;
  userId: string;
  name: string;
  age: number;
  schoolYear: string;
  targetLanguage: string;
  level: "iniciante" | "basico" | "intermediario";
  goal: string;
  avatar: string;
  createdAt: string;
};

export type LoginSession = {
  userId: string;
  loggedInAt: string;
};
