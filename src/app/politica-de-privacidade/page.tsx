import Link from "next/link";

const sections = [
  {
    title: "Dados do responsável",
    content:
      "Podemos coletar nome, e-mail, telefone, CPF, dados relacionados a pagamentos e informações enviadas em solicitações de benefício.",
  },
  {
    title: "Dados da criança",
    content:
      "Podemos coletar nome, idade, ano escolar, idioma escolhido, nível inicial, progresso nas missões, conversas textuais e transcrições de voz usadas para atividades educativas.",
  },
  {
    title: "Finalidades de uso",
    content:
      "Usamos os dados para criar e manter a conta, personalizar a aprendizagem, registrar progresso, processar pagamentos, analisar benefícios e melhorar a segurança e qualidade do app.",
  },
  {
    title: "Proteção infantil",
    content:
      "O tratamento de dados da criança deve respeitar o melhor interesse infantil. O Livoz é pensado para uso acompanhado por responsável legal.",
  },
  {
    title: "Compartilhamento necessário",
    content:
      "Podemos compartilhar dados com provedores necessários para funcionamento do serviço, como hospedagem, banco de dados, Stripe para pagamentos e provedor de IA para recursos de conversação.",
  },
  {
    title: "Retenção",
    content:
      "Os dados são mantidos enquanto forem necessários para operação da conta, obrigações legais, segurança, suporte e registro do histórico educacional e financeiro.",
  },
  {
    title: "Direitos do responsável",
    content:
      "O responsável pode solicitar acesso, correção ou exclusão de dados quando aplicável. Algumas informações podem precisar ser mantidas por obrigação legal ou segurança.",
  },
  {
    title: "Exclusão, correção e contato",
    content:
      "Pedidos de correção, exclusão ou dúvidas de privacidade devem ser enviados pelos canais oficiais do Livoz. Este texto é um rascunho inicial para revisão jurídica futura.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-livoz-soft px-5 py-8">
      <article className="mx-auto max-w-3xl rounded-[32px] bg-white p-6 shadow-card">
        <Link href="/login" className="text-sm font-extrabold text-livoz-blue">
          Voltar
        </Link>
        <h1 className="mt-5 font-title text-4xl font-extrabold text-livoz-navy">Política de Privacidade</h1>
        <p className="mt-3 leading-7 text-slate-600">
          Esta política resume quais dados podem ser tratados pelo Livoz e por quê, com foco em transparência para responsáveis.
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
