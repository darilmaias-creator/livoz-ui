const KID_MODE_KEY = "kidModeActive";

const allowedKidRoutes = [
  "/dashboard",
  "/missoes",
  "/conversa",
  "/progresso",
  "/conquistas",
];

type WakeLockSentinelLike = {
  release: () => Promise<void>;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

let wakeLock: WakeLockSentinelLike | null = null;

export function activateKidMode() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KID_MODE_KEY, "true");
  window.dispatchEvent(new Event("kid-mode-change"));
}

export function deactivateKidMode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KID_MODE_KEY);
  window.dispatchEvent(new Event("kid-mode-change"));
}

export function isKidModeActive() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KID_MODE_KEY) === "true";
}

export function getAllowedKidRoutes() {
  return [...allowedKidRoutes];
}

export function isRouteAllowedInKidMode(pathname: string) {
  return allowedKidRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function requestKidModeWakeLock() {
  if (typeof navigator === "undefined") return;

  try {
    wakeLock = await (navigator as WakeLockNavigator).wakeLock?.request("screen") ?? null;
  } catch {
    wakeLock = null;
  }
}

export async function releaseKidModeWakeLock() {
  if (!wakeLock) return;

  try {
    await wakeLock.release();
  } catch {
    // Wake Lock can already be released by the browser.
  } finally {
    wakeLock = null;
  }
}
