import Link from "next/link";

export default function PaymentFailurePage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-[440px] place-items-center bg-white px-5 py-10 shadow-soft">
      <section className="w-full rounded-[32px] bg-orange-50 p-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-white text-4xl">
          💳
        </div>
        <h1 className="mt-6 font-title text-3xl font-extrabold leading-tight text-livoz-navy">
          Não conseguimos concluir o pagamento.
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Você pode tentar novamente escolhendo um plano no Livoz.
        </p>
        <Link
          href="/planos"
          className="mt-6 inline-flex w-full justify-center rounded-[20px] bg-livoz-blue px-4 py-3 font-extrabold text-white transition hover:bg-livoz-navy"
        >
          Tentar novamente
        </Link>
      </section>
    </main>
  );
}
