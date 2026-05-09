import { PrismaPg } from "@prisma/adapter-pg";
import { ChildLevel, LessonType, PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL nao configurada. Defina a URL do PostgreSQL antes de rodar o seed.");
}

const adapter = new PrismaPg({
  connectionString: removePgSslParams(connectionString),
  ssl: {
    rejectUnauthorized: false,
  },
});
const prisma = new PrismaClient({ adapter });

function removePgSslParams(urlValue: string) {
  const url = new URL(urlValue);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslaccept");
  return url.toString();
}

async function main() {
  console.log("Iniciando seed do Livoz...");

  const plans = [
    {
      name: "Modo Gratuito",
      slug: "modo-gratuito",
      price: 0,
      description: "Acesso limitado para comecar a aprender com o Livoz.",
      limitsJson: {
        dailyMissions: 1,
        dailyVoiceMinutes: 5,
        aiTextMessages: 10,
        feedback: "basic",
        benefits: ["Modo Gratuito"],
      },
    },
    {
      name: "Livoz Plus",
      slug: "livoz-plus",
      price: "39.90",
      description: "Acesso completo para uma crianca aprender idiomas com mais missoes, voz e feedback.",
      limitsJson: {
        dailyMissions: 10,
        dailyVoiceMinutes: 30,
        aiTextMessages: 100,
        feedback: "complete",
        benefits: ["Missoes completas", "Conversa por IA", "Feedback avancado"],
      },
    },
    {
      name: "Livoz Familia",
      slug: "livoz-familia",
      price: "69.90",
      description: "Plano para familias com mais de uma crianca usando o Livoz.",
      limitsJson: {
        dailyMissions: 20,
        dailyVoiceMinutes: 60,
        aiTextMessages: 200,
        feedback: "complete",
        benefits: ["Mais de uma crianca", "Relatorio familiar", "Missoes completas"],
      },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        price: plan.price,
        description: plan.description,
        limitsJson: plan.limitsJson,
        active: true,
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        price: plan.price,
        description: plan.description,
        limitsJson: plan.limitsJson,
        active: true,
      },
    });
  }

  const lessons = [
    {
      title: "Primeiras palavras",
      slug: "primeiras-palavras-ingles-iniciante",
      description: "Aprenda palavras simples em ingles.",
      language: "english",
      level: ChildLevel.INICIANTE,
      type: LessonType.VOCABULARY,
      contentJson: {
        words: [
          { pt: "ola", en: "hello", audioText: "hello" },
          { pt: "tchau", en: "bye", audioText: "bye" },
          { pt: "sim", en: "yes", audioText: "yes" },
          { pt: "nao", en: "no", audioText: "no" },
          { pt: "obrigado", en: "thank you", audioText: "thank you" },
        ],
        instruction: "Toque em cada palavra, ouca e repita em voz alta.",
      },
    },
    {
      title: "Meu nome e...",
      slug: "meu-nome-e-ingles-iniciante",
      description: "Pratique como se apresentar em ingles.",
      language: "english",
      level: ChildLevel.INICIANTE,
      type: LessonType.SPEAKING,
      contentJson: {
        phrase: "Hello, my name is Ana.",
        translation: "Ola, meu nome e Ana.",
        instruction: "Repita a frase com calma e tente falar seu proprio nome.",
        examples: [
          "Hello, my name is Pedro.",
          "Hello, my name is Maria.",
          "Hello, my name is Lucas.",
        ],
      },
    },
    {
      title: "Cores basicas",
      slug: "cores-basicas-ingles-iniciante",
      description: "Descubra algumas cores em ingles.",
      language: "english",
      level: ChildLevel.INICIANTE,
      type: LessonType.VOCABULARY,
      contentJson: {
        words: [
          { pt: "azul", en: "blue", color: "#1E73F8" },
          { pt: "vermelho", en: "red", color: "#FF4F5E" },
          { pt: "amarelo", en: "yellow", color: "#FFC928" },
          { pt: "verde", en: "green", color: "#22C76A" },
          { pt: "laranja", en: "orange", color: "#FF861C" },
        ],
        instruction: "Veja a cor, escute a palavra e tente repetir.",
      },
    },
    {
      title: "Animais amigos",
      slug: "animais-amigos-ingles-iniciante",
      description: "Aprenda nomes de animais em ingles.",
      language: "english",
      level: ChildLevel.INICIANTE,
      type: LessonType.VOCABULARY,
      contentJson: {
        words: [
          { pt: "gato", en: "cat", emoji: "cat" },
          { pt: "cachorro", en: "dog", emoji: "dog" },
          { pt: "passaro", en: "bird", emoji: "bird" },
          { pt: "peixe", en: "fish", emoji: "fish" },
          { pt: "coelho", en: "rabbit", emoji: "rabbit" },
        ],
        instruction: "Escolha um animal e diga o nome dele em ingles.",
      },
    },
    {
      title: "Numeros de 1 a 10",
      slug: "numeros-1-a-10-ingles-iniciante",
      description: "Conte de 1 a 10 em ingles.",
      language: "english",
      level: ChildLevel.INICIANTE,
      type: LessonType.LISTENING,
      contentJson: {
        numbers: [
          { number: 1, en: "one" },
          { number: 2, en: "two" },
          { number: 3, en: "three" },
          { number: 4, en: "four" },
          { number: 5, en: "five" },
          { number: 6, en: "six" },
          { number: 7, en: "seven" },
          { number: 8, en: "eight" },
          { number: 9, en: "nine" },
          { number: 10, en: "ten" },
        ],
        instruction: "Ouca os numeros e tente repetir.",
      },
    },
    {
      title: "Saudacoes",
      slug: "saudacoes-ingles-iniciante",
      description: "Aprenda formas simples de cumprimentar alguem.",
      language: "english",
      level: ChildLevel.INICIANTE,
      type: LessonType.SPEAKING,
      contentJson: {
        phrases: [
          { pt: "Bom dia", en: "Good morning" },
          { pt: "Boa tarde", en: "Good afternoon" },
          { pt: "Boa noite", en: "Good night" },
          { pt: "Como voce esta?", en: "How are you?" },
          { pt: "Estou bem", en: "I am fine" },
        ],
        instruction: "Pratique uma saudacao com a Livoz.",
      },
    },
    {
      title: "Minha familia",
      slug: "minha-familia-ingles-iniciante",
      description: "Aprenda palavras sobre familia em ingles.",
      language: "english",
      level: ChildLevel.INICIANTE,
      type: LessonType.VOCABULARY,
      contentJson: {
        words: [
          { pt: "mae", en: "mother" },
          { pt: "pai", en: "father" },
          { pt: "irmao", en: "brother" },
          { pt: "irma", en: "sister" },
          { pt: "familia", en: "family" },
        ],
        instruction: "Aprenda palavras sobre sua familia.",
      },
    },
    {
      title: "Objetos da escola",
      slug: "objetos-da-escola-ingles-iniciante",
      description: "Aprenda palavras usadas na escola.",
      language: "english",
      level: ChildLevel.INICIANTE,
      type: LessonType.REVIEW,
      contentJson: {
        words: [
          { pt: "livro", en: "book", emoji: "book" },
          { pt: "lapis", en: "pencil", emoji: "pencil" },
          { pt: "mochila", en: "backpack", emoji: "backpack" },
          { pt: "mesa", en: "desk", emoji: "desk" },
          { pt: "professor", en: "teacher", emoji: "teacher" },
        ],
        instruction: "Revise palavras que voce pode usar na escola.",
      },
    },
  ];

  for (const lesson of lessons) {
    await prisma.lesson.upsert({
      where: {
        title_language_level: {
          title: lesson.title,
          language: lesson.language,
          level: lesson.level,
        },
      },
      update: {
        description: lesson.description,
        type: lesson.type,
        contentJson: lesson.contentJson,
        active: true,
      },
      create: {
        title: lesson.title,
        description: lesson.description,
        language: lesson.language,
        level: lesson.level,
        type: lesson.type,
        contentJson: lesson.contentJson,
        active: true,
      },
    });
  }

  await prisma.lesson.updateMany({
    where: {
      language: {
        in: ["english", "Inglês"],
      },
      level: ChildLevel.INICIANTE,
      title: {
        notIn: lessons.map((lesson) => lesson.title),
      },
    },
    data: {
      active: false,
    },
  });

  console.log("Seed do Livoz finalizado com sucesso!");
}

main()
  .catch((error) => {
    console.error("Erro ao rodar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
