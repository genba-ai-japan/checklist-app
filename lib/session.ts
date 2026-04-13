const SESSION_KEY = "app_session_v2";
const SESSION_HOURS = 12;

interface SessionData {
  accountId: string;
  expires: number;
}

export function createSession(accountId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ accountId, expires: Date.now() + SESSION_HOURS * 3_600_000 })
  );
}

export function getSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionData;
    if (Date.now() > data.expires) { sessionStorage.removeItem(SESSION_KEY); return null; }
    return data;
  } catch { return null; }
}

export function getCurrentAccountId(): string {
  return getSession()?.accountId ?? "default";
}

export function logout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}
