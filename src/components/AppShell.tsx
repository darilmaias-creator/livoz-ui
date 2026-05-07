"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Início" },
  { href: "/conversa", icon: "💬", label: "Conversa" },
  { href: "/missoes", icon: "🎯", label: "Missões" },
  { href: "/perfil", icon: "👤", label: "Perfil" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto min-h-screen max-w-[440px] bg-white shadow-soft">
      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-gradient-to-br from-livoz-blue to-livoz-cyan text-2xl font-extrabold text-white">
            L
          </span>
          <span>
            <span className="block font-title text-xl font-extrabold">Livoz</span>
            <span className="text-xs text-slate-500">Cada palavra, uma nova descoberta.</span>
          </span>
        </Link>
      </header>
      <main className="px-5 pb-28">{children}</main>
      <nav className="fixed bottom-4 left-1/2 grid w-[min(420px,calc(100%-32px))] -translate-x-1/2 grid-cols-4 gap-2 rounded-[32px] bg-white/95 p-3 shadow-[0_18px_40px_rgba(23,32,51,0.12)] backdrop-blur">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`grid place-items-center gap-1 rounded-[20px] px-2 py-2 text-center text-xs font-bold ${
                active ? "bg-blue-50 text-livoz-navy" : "text-slate-500"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
