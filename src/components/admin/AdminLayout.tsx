"use client";

import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/usuarios", label: "Usuários", icon: "👥" },
  { href: "/admin/criancas", label: "Crianças", icon: "🧒" },
  { href: "/admin/beneficios", label: "Benefícios", icon: "🎓" },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: "💳" },
  { href: "/admin/assinaturas", label: "Assinaturas", icon: "🧾" },
  { href: "/admin/planos", label: "Planos", icon: "⭐" },
  { href: "/admin/missoes", label: "Missões", icon: "🎯" },
  { href: "/admin/conversas", label: "Conversas", icon: "💬" },
  { href: "/admin/privacidade", label: "Privacidade", icon: "🔐" },
  { href: "/dashboard", label: "Área infantil", icon: "🏠" },
];

export function AdminLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <Link href="/admin/dashboard" className="block px-2">
          <BrandLogo className="max-w-[220px]" />
          <span className="mt-2 block text-xs font-bold text-slate-500">Gestão da plataforma</span>
        </Link>

        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-blue-50 text-livoz-navy"
                    : "text-slate-600 hover:bg-slate-50 hover:text-livoz-navy"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <h1 className="font-title text-2xl font-extrabold text-livoz-navy">{title}</h1>
              {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
            </div>
            <Link
              href="/dashboard"
              className="hidden rounded-[16px] bg-livoz-blue px-4 py-2 text-sm font-extrabold text-white transition hover:bg-livoz-navy sm:inline-flex"
            >
              Área infantil
            </Link>
          </div>
        </header>

        <nav className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-[16px] px-3 py-2 text-xs font-extrabold ${
                    active ? "bg-blue-50 text-livoz-navy" : "bg-slate-50 text-slate-600"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
