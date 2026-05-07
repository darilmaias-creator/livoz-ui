import type { ReactNode } from "react";
import Link from "next/link";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <section className="mx-auto w-full max-w-[440px] px-5 py-6">
      <Link href="/login" className="mb-5 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-gradient-to-br from-livoz-blue to-livoz-cyan text-2xl font-extrabold text-white shadow-lg">
          L
        </span>
        <span>
          <span className="block font-title text-xl font-extrabold text-slate-900">Livoz</span>
          <span className="text-sm text-slate-500">Cada palavra, uma nova descoberta.</span>
        </span>
      </Link>

      <div className="rounded-[28px] bg-white p-6 shadow-card">
        <div className="mb-5">
          <h1 className="font-title text-2xl font-extrabold text-slate-900">{title}</h1>
          <p className="mt-2 leading-6 text-slate-500">{description}</p>
        </div>
        {children}
        {footer ? <div className="mt-5 text-sm text-slate-500">{footer}</div> : null}
      </div>
    </section>
  );
}
