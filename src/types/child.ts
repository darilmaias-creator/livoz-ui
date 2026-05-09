export type ChildLevel = "INICIANTE" | "BASICO" | "INTERMEDIARIO";

export type Child = {
  id: string;
  userId: string;
  name: string;
  age: number;
  schoolYear: string;
  targetLanguage: string;
  level: ChildLevel;
  goal: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt?: string;
};
