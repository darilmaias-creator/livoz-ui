import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-[440px] place-items-center bg-white px-5 py-10 shadow-soft">
      <section className="w-full rounded-[32px] bg-livoz-soft p-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-gradient-to-br from-livoz-blue to-livoz-cyan text-4xl">
          ⭐
        </div>
        <h1 className="mt-6 font-title text-3xl font-extrabold leading-tight text-livoz-navy">
          Pagamento recebido! Estamos ativando seu plano.
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          A ativação real acontece após a confirmação do pagamento pela Stripe. Isso pode levar alguns instantes.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex w-full justify-center rounded-[20px] bg-livoz-blue px-4 py-3 font-extrabold text-white transition hover:bg-livoz-navy"
        >
          Voltar para o dashboard
        </Link>
      </section>
    </main>
  );
}
