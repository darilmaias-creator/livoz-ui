"use client";

import { isAuthenticated } from "@/lib/auth";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center text-slate-500">
        <p>Preparando seu espaço no Livoz...</p>
      </div>
    );
  }

  return <>{children}</>;
}
