import type { Child, LoginSession, User } from "@/types/user";

const USER_KEY = "livoz:user";
const CHILD_KEY = "livoz:child";
const SESSION_KEY = "livoz:session";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function saveUser(user: User) {
  writeJson(USER_KEY, user);
}

export function getUser() {
  return readJson<User>(USER_KEY);
}

export function saveChild(child: Child) {
  writeJson(CHILD_KEY, child);
}

export function getChild() {
  return readJson<Child>(CHILD_KEY);
}

export function setSession(userId: string) {
  writeJson<LoginSession>(SESSION_KEY, {
    userId,
    loggedInAt: new Date().toISOString(),
  });
}

export function getSession() {
  return readJson<LoginSession>(SESSION_KEY);
}

export function clearSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function clearLivozData() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(CHILD_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}
