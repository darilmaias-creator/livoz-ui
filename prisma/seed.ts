import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada. Defina a URL do PostgreSQL antes de rodar o seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.plan.upsert({
    where: { slug: "modo-gratuito" },
    update: {
      active: true,
    },
    create: {
      name: "Modo Gratuito",
      slug: "modo-gratuito",
      description: "Acesso inicial limitado para começar a aprender no Livoz.",
      price: 0,
      limitsJson: {
        lessonsPerWeek: 3,
        conversationsPerWeek: 2,
      },
    },
  });

  await prisma.plan.upsert({
    where: { slug: "livoz-plus" },
    update: {
      active: true,
    },
    create: {
      name: "Livoz Plus",
      slug: "livoz-plus",
      description: "Plano preparado para assinatura futura com mais missões e acompanhamento.",
      price: 29.9,
      limitsJson: {
        lessonsPerWeek: 30,
        conversationsPerWeek: 30,
      },
    },
  });

  const lessons = [
    {
      title: "Conversa divertida",
      description: "Pratique frases simples em uma conversa textual simulada.",
      type: "CHAT" as const,
      language: "Inglês",
      level: "INICIANTE" as const,
      contentJson: {
        prompt: "Hello, my name is Ana.",
        rewardStars: 2,
      },
    },
    {
      title: "Palavras novas",
      description: "Aprenda cinco palavras novas brincando.",
      type: "VOCABULARY" as const,
      language: "Inglês",
      level: "INICIANTE" as const,
      contentJson: {
        words: ["apple", "book", "blue", "hello", "friend"],
        rewardStars: 2,
      },
    },
    {
      title: "História curta",
      description: "Leia uma minihistória e responda perguntas simples.",
      type: "STORY" as const,
      language: "Inglês",
      level: "BASICO" as const,
      contentJson: {
        title: "A sunny day",
        rewardStars: 3,
      },
    },
    {
      title: "Desafio rápido",
      description: "Complete uma atividade curta para conquistar estrelas.",
      type: "REVIEW" as const,
      language: "Inglês",
      level: "INICIANTE" as const,
      contentJson: {
        minutes: 5,
        rewardStars: 3,
      },
    },
  ];

  for (const lesson of lessons) {
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        title: lesson.title,
        language: lesson.language,
        level: lesson.level,
      },
    });

    if (existingLesson) {
      await prisma.lesson.update({
        where: { id: existingLesson.id },
        data: lesson,
      });
      continue;
    }

    await prisma.lesson.create({
      data: lesson,
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
