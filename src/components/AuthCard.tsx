import { BrandLogo } from "@/components/BrandLogo";
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
      <Link href="/login" className="mb-5 flex w-full items-center justify-center overflow-visible">
        <BrandLogo className="max-w-[380px]" />
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
