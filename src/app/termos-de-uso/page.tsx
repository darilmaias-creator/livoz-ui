import Link from "next/link";

const sections = [
  {
    title: "O que é o Livoz",
    content:
      "O Livoz é uma plataforma infantil de aprendizagem de idiomas com recursos digitais, missões educativas e apoio de inteligência artificial para prática textual e, quando disponível, por voz.",
  },
  {
    title: "Quem pode criar conta",
    content:
      "A conta deve ser criada e gerenciada por pai, mãe ou responsável legal. Crianças usam o app dentro do perfil criado pelo responsável.",
  },
  {
    title: "Uso adequado da plataforma",
    content:
      "O responsável deve orientar a criança a usar o Livoz com respeito, sem enviar dados pessoais sensíveis no chat e sem tentar burlar recursos ou acessar áreas restritas.",
  },
  {
    title: "Assinaturas e benefícios",
    content:
      "O Livoz pode oferecer planos pagos, Modo Gratuito e benefícios educacionais. Benefícios podem depender de análise manual e podem ter prazo de validade. Pagamentos são confirmados por provedores externos antes da liberação do plano pago.",
  },
  {
    title: "Modo Gratuito",
    content:
      "O Modo Gratuito permite acesso limitado a recursos do app. A disponibilidade e os limites podem ser ajustados para manter a plataforma funcionando de forma sustentável.",
  },
  {
    title: "Limitação de responsabilidade",
    content:
      "O Livoz é uma ferramenta de apoio educacional. Ele não substitui escola, professor, acompanhamento familiar ou orientação profissional. Podemos corrigir, melhorar ou limitar recursos conforme necessário.",
  },
  {
    title: "Contato",
    content:
      "Dúvidas sobre estes termos podem ser enviadas pelos canais oficiais de atendimento do Livoz. Este texto é um rascunho inicial e poderá ser revisado por profissional jurídico.",
  },
];

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-livoz-soft px-5 py-8">
      <article className="mx-auto max-w-3xl rounded-[32px] bg-white p-6 shadow-card">
        <Link href="/login" className="text-sm font-extrabold text-livoz-blue">
          Voltar
        </Link>
        <h1 className="mt-5 font-title text-4xl font-extrabold text-livoz-navy">Termos de Uso</h1>
        <p className="mt-3 leading-7 text-slate-600">
          Este documento explica, em linguagem simples, as regras iniciais de uso do Livoz. Ele é um rascunho para futura revisão profissional.
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
