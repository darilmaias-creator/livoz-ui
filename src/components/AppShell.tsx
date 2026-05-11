"use client";

import { ParentPinModal } from "@/components/ParentPinModal";
import { deactivateKidMode, isKidModeActive, releaseKidModeWakeLock } from "@/lib/kidMode";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Início" },
  { href: "/conversa", icon: "💬", label: "Conversa" },
  { href: "/missoes", icon: "🎯", label: "Missões" },
  { href: "/perfil", icon: "👤", label: "Perfil" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [kidModeActive, setKidModeActive] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);

  useEffect(() => {
    function syncKidMode() {
      setKidModeActive(isKidModeActive());
    }

    syncKidMode();
    window.addEventListener("kid-mode-change", syncKidMode);
    window.addEventListener("storage", syncKidMode);

    return () => {
      window.removeEventListener("kid-mode-change", syncKidMode);
      window.removeEventListener("storage", syncKidMode);
    };
  }, []);

  async function exitKidMode() {
    deactivateKidMode();
    setKidModeActive(false);
    setExitModalOpen(false);

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Fullscreen can fail silently depending on browser permissions.
      }
    }

    await releaseKidModeWakeLock();
  }

  const visibleNavItems = kidModeActive
    ? navItems.filter((item) => item.href !== "/perfil")
    : navItems;

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
      {kidModeActive ? (
        <section className="mx-5 mb-4 rounded-[24px] bg-livoz-soft px-4 py-3">
          <p className="font-title text-lg font-extrabold text-livoz-navy">
            Você está no Espaço Infantil da Livoz
          </p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
            Aqui você pode aprender, completar missões e conversar com a Livoz.
          </p>
          <button
            type="button"
            onClick={() => setExitModalOpen(true)}
            className="mt-3 rounded-[16px] bg-white px-4 py-2 text-xs font-extrabold text-livoz-blue shadow-card"
          >
            Sair do Modo Infantil
          </button>
        </section>
      ) : null}
      <main className="px-5 pb-28">{children}</main>
      <nav
        className={`fixed bottom-4 left-1/2 grid w-[min(420px,calc(100%-32px))] -translate-x-1/2 gap-2 rounded-[32px] bg-white/95 p-3 shadow-[0_18px_40px_rgba(23,32,51,0.12)] backdrop-blur ${
          kidModeActive ? "grid-cols-3" : "grid-cols-4"
        }`}
      >
        {visibleNavItems.map((item) => {
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
      <ParentPinModal
        open={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
        onSuccess={() => void exitKidMode()}
        title="Sair do Modo Infantil"
        description="Digite o PIN do responsável para liberar a navegação normal do Livoz."
      />
    </div>
  );
}
