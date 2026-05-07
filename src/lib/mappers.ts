import type { Child as PrismaChild, User as PrismaUser } from "@prisma/client";
import type { Child, User } from "@/types/user";

export function toUser(user: PrismaUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    cpf: user.cpf || "",
    role: "responsavel",
    acceptedTerms: user.acceptedTerms,
    acceptedPrivacy: user.acceptedPrivacy,
    confirmedResponsible: user.confirmedResponsible,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toChild(child: PrismaChild): Child {
  return {
    id: child.id,
    userId: child.userId,
    name: child.name,
    age: child.age,
    schoolYear: child.schoolYear,
    targetLanguage: child.targetLanguage,
    level: child.level.toLowerCase() as Child["level"],
    goal: child.goal || "",
    avatar: child.avatar || "",
    createdAt: child.createdAt.toISOString(),
  };
}

export function toPrismaLevel(level: Child["level"]) {
  return level.toUpperCase() as "INICIANTE" | "BASICO" | "INTERMEDIARIO";
}
