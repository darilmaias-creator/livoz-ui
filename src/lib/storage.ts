export type LocalSession = {
  userId: string | null;
  childId: string | null;
  userName: string | null;
  childName: string | null;
  planName: string | null;
};

const SESSION_KEYS: Array<keyof LocalSession> = [
  "userId",
  "childId",
  "userName",
  "childName",
  "planName",
];

export function getStorageItem(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function setStorageItem(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

export function removeStorageItem(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function clearStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.clear();
}

export function saveSession(session: Partial<LocalSession>) {
  if (typeof window === "undefined") return;

  for (const key of SESSION_KEYS) {
    const value = session[key];

    if (value) {
      window.localStorage.setItem(key, value);
    } else if (key in session) {
      window.localStorage.removeItem(key);
    }
  }

  window.localStorage.removeItem("userEmail");
}

export function getSession(): LocalSession {
  return {
    userId: getStorageItem("userId"),
    childId: getStorageItem("childId"),
    userName: getStorageItem("userName"),
    childName: getStorageItem("childName"),
    planName: getStorageItem("planName"),
  };
}

export function clearSession() {
  if (typeof window === "undefined") return;

  for (const key of SESSION_KEYS) {
    window.localStorage.removeItem(key);
  }

  window.localStorage.removeItem("userEmail");
}

export const getSimpleSession = getSession;
