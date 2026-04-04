export interface Account {
  id: string;
  username: string;
  pinHash: string;
  createdAt: string;
  avatar: string;
}

const ACCOUNTS_KEY = "app_accounts_v1";
const AVATARS = ["🧑", "👩", "👨", "🏭", "⚙️", "📋", "🌟", "🦊", "🐼", "🚀"];

function simpleHash(pin: string): string {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = ((h << 5) - h + pin.charCodeAt(i)) | 0;
  }
  return `h_${Math.abs(h).toString(36)}_${pin.length}`;
}

export function getAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  return raw ? (JSON.parse(raw) as Account[]) : [];
}

function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function createAccount(username: string, pin: string): Account {
  const accounts = getAccounts();
  const newAccount: Account = {
    id: crypto.randomUUID(),
    username: username.trim(),
    pinHash: simpleHash(pin),
    createdAt: new Date().toISOString(),
    avatar: AVATARS[accounts.length % AVATARS.length],
  };
  saveAccounts([...accounts, newAccount]);
  // 既存データを最初のアカウントへ移行
  if (accounts.length === 0) migrateOldData(newAccount.id);
  return newAccount;
}

function migrateOldData(accountId: string): void {
  ["dashboard_goals_v1", "dashboard_routine_v1", "dashboard_improvements_v1", "dashboard_gantt_v1"].forEach((key) => {
    const old = localStorage.getItem(key);
    if (old) localStorage.setItem(`${key}_${accountId}`, old);
  });
}

export function verifyAccountPin(accountId: string, pin: string): boolean {
  const account = getAccounts().find((a) => a.id === accountId);
  return !!account && simpleHash(pin) === account.pinHash;
}

export function updateAccountPin(accountId: string, newPin: string): void {
  saveAccounts(
    getAccounts().map((a) =>
      a.id === accountId ? { ...a, pinHash: simpleHash(newPin) } : a
    )
  );
}

export function deleteAccount(accountId: string): void {
  saveAccounts(getAccounts().filter((a) => a.id !== accountId));
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.endsWith(`_${accountId}`)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}
