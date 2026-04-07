"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAccounts, createAccount, verifyAccountPin, updateAccountPin, deleteAccount, Account } from "@/lib/accounts";
import { createSession, getSession, logout } from "@/lib/session";
import { AuthProvider } from "@/lib/auth-context";

type Screen = "account_list" | "pin_entry" | "create_account" | "app";

export default function LoginGuard({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [shake, setShake] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

  useEffect(() => {
    const session = getSession();
    const accs = getAccounts();
    setAccounts(accs);
    if (session) {
      const acc = accs.find((a) => a.id === session.accountId);
      if (acc) { setCurrentAccount(acc); setScreen("app"); return; }
    }
    setScreen(accs.length === 0 ? "create_account" : "account_list");
  }, []);

  const tryLogin = useCallback((pinInput: string) => {
    if (!selectedAccount) return;
    if (verifyAccountPin(selectedAccount.id, pinInput)) {
      createSession(selectedAccount.id);
      setCurrentAccount(selectedAccount);
      setScreen("app");
      setPinError(false);
    } else {
      setPinError(true);
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 400);
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (pin.length === 4 && screen === "pin_entry") tryLogin(pin);
  }, [pin, screen, tryLogin]);

  function pressDigit(d: string) { if (pin.length < 4) setPin((p) => p + d); }
  function pressBack() { setPin((p) => p.slice(0, -1)); setPinError(false); }

  function handleLogout() {
    logout();
    setCurrentAccount(null);
    setPin("");
    setSelectedAccount(null);
    setAccounts(getAccounts());
    setScreen(getAccounts().length === 0 ? "create_account" : "account_list");
    setShowSettings(false);
  }

  if (screen === null) return null;

  if (screen === "app" && currentAccount) {
    return (
      <AuthProvider
        onOpenSettings={() => setShowSettings(true)}
        accountId={currentAccount.id}
        username={currentAccount.username}
      >
        {children}
        {showSettings && (
          <SettingsModal
            account={currentAccount}
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
            onAccountUpdated={() => setAccounts(getAccounts())}
          />
        )}
      </AuthProvider>
    );
  }

  // ── アカウント選択画面 ──────────────────────────────────────────────────────
  if (screen === "account_list") {
    return (
      <div className="fixed inset-0 bg-blue-700 flex flex-col z-[100]">
        {/* ヘッダー */}
        <div className="flex flex-col items-center pt-16 pb-8 px-6">
          <p className="text-5xl mb-3">🏭</p>
          <h1 className="text-2xl font-bold text-white">業務ダッシュボード</h1>
          <p className="text-blue-200 text-sm mt-1">2026年度</p>
        </div>

        {/* ログインセクション */}
        <div className="flex-1 overflow-y-auto px-6">
          <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-3">ログイン</p>
          <div className="space-y-3">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => { setSelectedAccount(acc); setPin(""); setPinError(false); setScreen("pin_entry"); }}
                className="w-full bg-white/20 active:bg-white/30 rounded-2xl p-4 flex items-center gap-4 text-left"
              >
                <span className="text-3xl">{acc.avatar}</span>
                <div className="flex-1">
                  <p className="font-bold text-white text-lg">{acc.username}</p>
                  <p className="text-blue-200 text-xs">タップしてPIN入力</p>
                </div>
                <span className="text-blue-200 text-lg">›</span>
              </button>
            ))}
          </div>

          {/* 区切り */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-blue-300 text-xs">または</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* 新規登録 */}
          <button
            onClick={() => setScreen("create_account")}
            className="w-full bg-white text-blue-700 font-bold py-4 rounded-2xl text-base active:bg-blue-50 mb-8"
          >
            ＋ 新規登録
          </button>
        </div>
      </div>
    );
  }

  // ── PIN入力画面 ──────────────────────────────────────────────────────────────
  if (screen === "pin_entry" && selectedAccount) {
    return (
      <div className="fixed inset-0 bg-blue-700 flex flex-col items-center justify-center z-[100] select-none">
        <button
          onClick={() => { setScreen("account_list"); setPin(""); setPinError(false); }}
          className="absolute top-12 left-6 text-blue-200 text-sm"
        >
          ← 戻る
        </button>
        <div className="text-center mb-8">
          <p className="text-5xl mb-2">{selectedAccount.avatar}</p>
          <p className="text-xl font-bold text-white">{selectedAccount.username}</p>
          <p className="text-blue-200 text-sm mt-1">PINを入力してください</p>
        </div>
        <div className={`flex gap-5 mb-6 transition-transform duration-100 ${shake ? "scale-110" : ""}`}>
          {[0,1,2,3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? "bg-white border-white" : "bg-transparent border-white/40"}`} />
          ))}
        </div>
        {pinError && <p className="text-red-300 text-sm mb-4 -mt-2">PINが違います</p>}
        <Keypad onDigit={pressDigit} onBack={pressBack} />
      </div>
    );
  }

  // ── アカウント作成画面 ────────────────────────────────────────────────────────
  if (screen === "create_account") {
    return <CreateAccountScreen
      isFirst={accounts.length === 0}
      onCreated={(acc) => {
        setAccounts(getAccounts());
        setCurrentAccount(acc);
        createSession(acc.id);
        setScreen("app");
      }}
      onBack={accounts.length > 0 ? () => setScreen("account_list") : undefined}
    />;
  }

  return null;
}

// ── アカウント作成フォーム ────────────────────────────────────────────────────────
function CreateAccountScreen({
  isFirst,
  onCreated,
  onBack,
}: {
  isFirst: boolean;
  onCreated: (acc: Account) => void;
  onBack?: () => void;
}) {
  const [step, setStep] = useState<"name" | "pin" | "confirm">("name");
  const [username, setUsername] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");

  const active = step === "pin" ? newPin : confirmPin;

  function pressDigit(d: string) {
    if (step === "pin" && newPin.length < 4) setNewPin((p) => p + d);
    if (step === "confirm" && confirmPin.length < 4) setConfirmPin((p) => p + d);
  }
  function pressBack() {
    if (step === "pin") setNewPin((p) => p.slice(0, -1));
    if (step === "confirm") setConfirmPin((p) => p.slice(0, -1));
    setPinError("");
  }

  useEffect(() => {
    if (step === "pin" && newPin.length === 4) setStep("confirm");
  }, [newPin, step]);

  useEffect(() => {
    if (step === "confirm" && confirmPin.length === 4) {
      if (confirmPin === newPin) {
        const acc = createAccount(username, newPin);
        onCreated(acc);
      } else {
        setPinError("PINが一致しません。もう一度");
        setConfirmPin("");
        setNewPin("");
        setStep("pin");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin]);

  return (
    <div className="fixed inset-0 bg-blue-700 flex flex-col items-center justify-center z-[100] px-6 select-none">
      {onBack && (
        <button onClick={onBack} className="absolute top-12 left-6 text-blue-200 text-sm">← 戻る</button>
      )}
      <div className="text-center mb-8">
        <p className="text-5xl mb-3">🏭</p>
        <h1 className="text-2xl font-bold text-white">{isFirst ? "ようこそ！" : "新しいアカウント"}</h1>
        <p className="text-blue-200 text-sm mt-1">{isFirst ? "まず、アカウントを作成してください" : "アカウントを追加します"}</p>
      </div>

      {step === "name" && (
        <div className="w-full max-w-xs space-y-4">
          <div>
            <label className="block text-lime-300 text-sm mb-2">名前を入力</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名"
              className="w-full bg-white/20 text-white placeholder-white/40 rounded-2xl px-4 py-4 text-lg text-center focus:outline-none focus:ring-2 focus:ring-white/50"
              autoFocus
              maxLength={20}
            />
          </div>
          <button
            onClick={() => { if (username.trim()) setStep("pin"); }}
            disabled={!username.trim()}
            className="w-full bg-white text-blue-700 font-bold py-4 rounded-2xl text-lg disabled:opacity-40"
          >
            次へ →
          </button>
        </div>
      )}

      {(step === "pin" || step === "confirm") && (
        <>
          <p className="text-white font-medium mb-6">
            {step === "pin" ? "PINを設定（4桁）" : "PINをもう一度入力"}
          </p>
          <div className="flex gap-5 mb-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < active.length ? "bg-white border-white" : "bg-transparent border-white/40"}`} />
            ))}
          </div>
          {pinError && <p className="text-red-300 text-sm mb-3">{pinError}</p>}
          <Keypad onDigit={pressDigit} onBack={pressBack} />
        </>
      )}
    </div>
  );
}

// ── テンキー共通コンポーネント ────────────────────────────────────────────────────
function Keypad({ onDigit, onBack }: { onDigit: (d: string) => void; onBack: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => (
        <button
          key={idx}
          onClick={() => { if (key === "⌫") onBack(); else if (key) onDigit(key); }}
          disabled={!key}
          className={`w-20 h-20 rounded-full text-white text-2xl font-semibold transition-all active:scale-95 ${
            !key ? "invisible" :
            key === "⌫" ? "bg-white/10 active:bg-white/20" :
            "bg-white/20 active:bg-white/30"
          }`}
        >
          {key}
        </button>
      ))}
    </div>
  );
}

// ── 設定モーダル ──────────────────────────────────────────────────────────────────
function SettingsModal({
  account,
  onClose,
  onLogout,
  onAccountUpdated,
}: {
  account: Account;
  onClose: () => void;
  onLogout: () => void;
  onAccountUpdated: () => void;
}) {
  const [step, setStep] = useState<"menu" | "cur" | "new" | "confirm" | "delete_confirm">("menu");
  const [curPin, setCurPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [success, setSuccess] = useState(false);

  const active = step === "cur" ? curPin : step === "new" ? newPin : confirmPin;

  function pressDigit(d: string) {
    if (step === "cur" && curPin.length < 4) setCurPin((p) => p + d);
    if (step === "new" && newPin.length < 4) setNewPin((p) => p + d);
    if (step === "confirm" && confirmPin.length < 4) setConfirmPin((p) => p + d);
  }
  function pressBack() {
    if (step === "cur") setCurPin((p) => p.slice(0, -1));
    if (step === "new") setNewPin((p) => p.slice(0, -1));
    if (step === "confirm") setConfirmPin((p) => p.slice(0, -1));
    setPinError("");
  }

  useEffect(() => {
    if (step === "cur" && curPin.length === 4) {
      if (verifyAccountPin(account.id, curPin)) { setStep("new"); setPinError(""); }
      else { setPinError("現在のPINが違います"); setCurPin(""); }
    }
  }, [curPin, step, account.id]);

  useEffect(() => {
    if (step === "new" && newPin.length === 4) setStep("confirm");
  }, [newPin, step]);

  useEffect(() => {
    if (step === "confirm" && confirmPin.length === 4) {
      if (confirmPin === newPin) {
        updateAccountPin(account.id, newPin);
        setSuccess(true);
        setTimeout(onClose, 1200);
      } else {
        setPinError("PINが一致しません");
        setConfirmPin(""); setNewPin(""); setStep("new");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin, newPin]);

  const label = step === "cur" ? "現在のPINを入力" : step === "new" ? "新しいPINを入力（4桁）" : "新しいPINを再入力";

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">⚙️ 設定</h3>
          <button onClick={onClose} className="text-gray-400 text-xl p-1">✕</button>
        </div>

        {step === "menu" && (
          <div className="p-4 space-y-3">
            <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3 mb-4">
              <span className="text-3xl">{account.avatar}</span>
              <div>
                <p className="font-bold text-gray-900">{account.username}</p>
                <p className="text-xs text-gray-400">ログイン中</p>
              </div>
            </div>
            <button onClick={() => { setStep("cur"); setSuccess(false); setPinError(""); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left active:bg-gray-100">
              <p className="font-medium text-gray-800">🔐 PINを変更</p>
              <p className="text-xs text-gray-400 mt-0.5">4桁のPINを変更します</p>
            </button>
            <Link href="/help" onClick={onClose}
              className="block w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left active:bg-gray-100">
              <p className="font-medium text-gray-800">❓ ヘルプ・データ管理</p>
              <p className="text-xs text-gray-400 mt-0.5">使い方・書き出し・取り込み</p>
            </Link>
            <button onClick={() => { onLogout(); onClose(); }}
              className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 text-left active:bg-red-100">
              <p className="font-medium text-red-600">🚪 ログアウト</p>
              <p className="text-xs text-red-400 mt-0.5">次回はPIN入力が必要です</p>
            </button>
            <button onClick={() => setStep("delete_confirm")}
              className="w-full border border-red-100 rounded-2xl p-3 text-center active:bg-red-50">
              <p className="text-sm text-red-400">このアカウントを削除</p>
            </button>
          </div>
        )}

        {step === "delete_confirm" && (
          <div className="p-6 space-y-4">
            <p className="font-bold text-gray-900">⚠️ アカウントを削除しますか？</p>
            <p className="text-sm text-gray-500">「{account.username}」のすべてのデータが削除されます。この操作は取り消せません。</p>
            <button onClick={() => { deleteAccount(account.id); onAccountUpdated(); onLogout(); }}
              className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl">削除する</button>
            <button onClick={() => setStep("menu")}
              className="w-full bg-gray-100 text-gray-700 font-medium py-4 rounded-2xl">キャンセル</button>
          </div>
        )}

        {["cur","new","confirm"].includes(step) && (
          <div className="p-4 flex flex-col items-center select-none">
            {success ? (
              <div className="py-12 text-center">
                <p className="text-5xl mb-3">✅</p>
                <p className="font-bold text-green-600">PIN変更完了</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 mb-6 mt-2">{label}</p>
                <div className="flex gap-4 mb-4">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < active.length ? "bg-gray-800 border-gray-800" : "bg-transparent border-gray-300"}`} />
                  ))}
                </div>
                {pinError && <p className="text-red-500 text-sm mb-3">{pinError}</p>}
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => (
                    <button key={idx}
                      onClick={() => { if (key === "⌫") pressBack(); else if (key) pressDigit(key); }}
                      disabled={!key}
                      className={`w-16 h-16 rounded-full text-xl font-semibold transition-all active:scale-95 ${
                        !key ? "invisible" : key === "⌫" ? "bg-gray-100 text-gray-600 active:bg-gray-200" : "bg-gray-100 text-gray-800 active:bg-gray-200"
                      }`}
                    >{key}</button>
                  ))}
                </div>
                <button onClick={() => setStep("menu")} className="mt-4 text-xs text-gray-400 underline">キャンセル</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
