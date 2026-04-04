"use client";

import { useState, useEffect, useCallback } from "react";
import { verifyPin, createSession, isSessionValid, logout, setPin, isPinSet } from "@/lib/auth";
import { AuthProvider } from "@/lib/auth-context";

export default function LoginGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pin, setInputPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setAuthed(isSessionValid());
    setChecked(true);
  }, []);

  const handleLogin = useCallback(() => {
    if (verifyPin(pin)) {
      createSession();
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setShake(true);
      setInputPin("");
      setTimeout(() => setShake(false), 500);
    }
  }, [pin]);

  useEffect(() => {
    if (pin.length === 4) handleLogin();
  }, [pin, handleLogin]);

  function pressDigit(d: string) {
    if (pin.length < 4) setInputPin((p) => p + d);
  }

  function pressBack() {
    setInputPin((p) => p.slice(0, -1));
    setError(false);
  }

  if (!checked) return null;

  if (!authed) {
    const firstTime = !isPinSet();
    return (
      <div className="fixed inset-0 bg-green-800 flex flex-col items-center justify-center z-[100] select-none">
        <div className="text-center mb-10">
          <p className="text-5xl mb-3">🏭</p>
          <h1 className="text-2xl font-bold text-white">業務ダッシュボード</h1>
          <p className="text-green-300 text-sm mt-1">2026年度</p>
        </div>

        <div className={`flex gap-5 mb-8 transition-transform ${shake ? "translate-x-3" : ""}`}
          style={shake ? { animation: "shake 0.4s ease" } : {}}>
          {[0,1,2,3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              i < pin.length ? "bg-white border-white" : "bg-transparent border-white/50"
            }`} />
          ))}
        </div>

        {error && <p className="text-red-300 text-sm mb-4 -mt-4">PINが違います</p>}

        <div className="grid grid-cols-3 gap-4 mb-6">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (key === "⌫") pressBack();
                else if (key) pressDigit(key);
              }}
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

        {firstTime && (
          <p className="text-green-300 text-xs mt-2">初回デフォルトPIN: <span className="font-bold">1234</span></p>
        )}
      </div>
    );
  }

  return (
    <AuthProvider onOpenSettings={() => setShowSettings(true)}>
      {children}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onLogout={() => { logout(); setAuthed(false); setInputPin(""); }}
        />
      )}
    </AuthProvider>
  );
}

// ─── 設定モーダル ──────────────────────────────────────────────────────────────
function SettingsModal({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const [step, setStep] = useState<"menu" | "cur" | "new" | "confirm">("menu");
  const [curPin, setCurPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [success, setSuccess] = useState(false);

  function active() {
    if (step === "cur") return curPin;
    if (step === "new") return newPin;
    return confirmPin;
  }

  function pressDigit(d: string) {
    const set = step === "cur" ? setCurPin : step === "new" ? setNewPin : setConfirmPin;
    const cur = active();
    if (cur.length < 4) set((p) => p + d);
  }

  function pressBack() {
    const set = step === "cur" ? setCurPin : step === "new" ? setNewPin : setConfirmPin;
    set((p) => p.slice(0, -1));
    setPinError("");
  }

  useEffect(() => {
    if (step === "cur" && curPin.length === 4) {
      if (verifyPin(curPin)) { setStep("new"); setPinError(""); }
      else { setPinError("現在のPINが違います"); setCurPin(""); }
    }
  }, [curPin, step]);

  useEffect(() => {
    if (step === "new" && newPin.length === 4) setStep("confirm");
  }, [newPin, step]);

  useEffect(() => {
    if (step === "confirm" && confirmPin.length === 4) {
      if (confirmPin === newPin) {
        setPin(newPin);
        setSuccess(true);
        setTimeout(onClose, 1200);
      } else {
        setPinError("PINが一致しません");
        setConfirmPin("");
        setNewPin("");
        setStep("new");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin, newPin, step]);

  const label = step === "cur" ? "現在のPINを入力" : step === "new" ? "新しいPINを入力（4桁）" : "新しいPINを再入力";

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">⚙️ 設定</h3>
          <button onClick={onClose} className="text-gray-400 text-xl p-1">✕</button>
        </div>

        {step === "menu" && (
          <div className="p-4 space-y-3">
            <button
              onClick={() => { setStep("cur"); setPinError(""); setSuccess(false); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left active:bg-gray-100"
            >
              <p className="font-medium text-gray-800">🔐 PINを変更</p>
              <p className="text-xs text-gray-400 mt-0.5">4桁のPINを変更します（現在のPINが必要）</p>
            </button>
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 text-left active:bg-red-100"
            >
              <p className="font-medium text-red-600">🚪 ログアウト</p>
              <p className="text-xs text-red-400 mt-0.5">次回アクセス時にPINが必要になります</p>
            </button>
          </div>
        )}

        {step !== "menu" && (
          <div className="p-4 flex flex-col items-center">
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
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                      i < active().length ? "bg-gray-800 border-gray-800" : "bg-transparent border-gray-300"
                    }`} />
                  ))}
                </div>
                {pinError && <p className="text-red-500 text-sm mb-3">{pinError}</p>}
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => (
                    <button
                      key={idx}
                      onClick={() => { if (key === "⌫") pressBack(); else if (key) pressDigit(key); }}
                      disabled={!key}
                      className={`w-16 h-16 rounded-full text-xl font-semibold transition-all active:scale-95 ${
                        !key ? "invisible" :
                        key === "⌫" ? "bg-gray-100 text-gray-600 active:bg-gray-200" :
                        "bg-gray-100 text-gray-800 active:bg-gray-200"
                      }`}
                    >
                      {key}
                    </button>
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
