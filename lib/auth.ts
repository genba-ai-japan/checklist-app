const PIN_KEY = "app_pin_hash";
const SESSION_KEY = "app_session";
const DEFAULT_PIN = "1234";
const SESSION_HOURS = 12; // 12時間でセッション切れ

function simpleHash(pin: string): string {
  // 簡易ハッシュ（XOR + base64 エンコード）
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = ((h << 5) - h + pin.charCodeAt(i)) | 0;
  }
  return `h_${Math.abs(h).toString(36)}_${pin.length}`;
}

export function getStoredPinHash(): string {
  if (typeof window === "undefined") return simpleHash(DEFAULT_PIN);
  return localStorage.getItem(PIN_KEY) || simpleHash(DEFAULT_PIN);
}

export function verifyPin(pin: string): boolean {
  return simpleHash(pin) === getStoredPinHash();
}

export function setPin(newPin: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PIN_KEY, simpleHash(newPin));
}

export function createSession(): void {
  if (typeof window === "undefined") return;
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expires }));
}

export function isSessionValid(): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  try {
    const { expires } = JSON.parse(raw);
    return Date.now() < expires;
  } catch {
    return false;
  }
}

export function logout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function isPinSet(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(PIN_KEY);
}
