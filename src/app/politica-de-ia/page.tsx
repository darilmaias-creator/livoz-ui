import Link from "next/link";

const sections = [
  {
    title: "Uso de inteligência artificial",
    content:
      "A Livoz usa inteligência artificial para apoiar conversas, práticas de idioma e respostas educativas curtas dentro da plataforma.",
  },
  {
    title: "Limitações da IA",
    content:
      "As respostas da IA podem conter erros, imprecisões ou interpretações incompletas. Elas não substituem professor, escola, responsável legal ou orientação profissional.",
  },
  {
    title: "Voz gerada por IA",
    content:
      "Quando houver resposta em áudio, a voz da Livoz é gerada por inteligência artificial. O app não clona voz de criança real.",
  },
  {
    title: "Dados pessoais no chat",
    content:
      "A criança não deve informar endereço, telefone, escola, documentos, senhas, localização ou outros dados pessoais no chat.",
  },
  {
    title: "Acompanhamento do responsável",
    content:
      "O responsável pode acompanhar o uso geral da criança no app, como progresso, plano, benefícios e registros necessários para funcionamento da plataforma.",
  },
  {
    title: "Conversas adequadas à idade",
    content:
      "O Livoz aplica instruções e medidas para manter as interações adequadas à faixa etária infantil, com linguagem curta, educativa e cuidadosa.",
  },
  {
    title: "Revisão futura",
    content:
      "Esta política é um rascunho inicial e poderá ser atualizada conforme novos recursos de IA forem implementados e revisados.",
  },
];

export default function AiPolicyPage() {
  return (
    <main className="min-h-screen bg-livoz-soft px-5 py-8">
      <article className="mx-auto max-w-3xl rounded-[32px] bg-white p-6 shadow-card">
        <Link href="/login" className="text-sm font-extrabold text-livoz-blue">
          Voltar
        </Link>
        <h1 className="mt-5 font-title text-4xl font-extrabold text-livoz-navy">Política de IA</h1>
        <p className="mt-3 leading-7 text-slate-600">
          Esta página explica como recursos de inteligência artificial são usados no Livoz de forma educativa e cuidadosa.
        </p>

        <div className="mt-8 grid gap-5">
          {sections.map((section) => (
            <section key={section.title} className="rounded-[24px] bg-slate-50 p-5">
              <h2 className="font-title text-xl font-extrabold text-livoz-navy">{section.title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{section.content}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
