"use client";

import { isKidModeActive, isRouteAllowedInKidMode } from "@/lib/kidMode";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function KidModeRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isKidModeActive()) {
      return;
    }

    if (!isRouteAllowedInKidMode(pathname)) {
      window.sessionStorage.setItem(
        "kidModeBlockedMessage",
        "Esta área é protegida pelo PIN do responsável.",
      );
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  return null;
}
