"use client";

import { useEffect, useState } from "react";

const STORED_VERSION_KEY = "app_known_version";
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5分ごとにチェック

export default function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState("");

  async function checkVersion() {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: { version: string; buildTime: string } = await res.json();
      const serverVersion = data.version;

      const knownVersion = localStorage.getItem(STORED_VERSION_KEY);

      if (!knownVersion) {
        // 初回アクセス：バージョンを記録するだけ
        localStorage.setItem(STORED_VERSION_KEY, serverVersion);
      } else if (knownVersion !== serverVersion) {
        // バージョンが変わっていたら通知
        setNewVersion(serverVersion);
        setUpdateAvailable(true);
      }
    } catch {
      // ネットワークエラーは無視
    }
  }

  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleUpdate() {
    const knownVersion = localStorage.getItem(STORED_VERSION_KEY);
    if (newVersion) localStorage.setItem(STORED_VERSION_KEY, newVersion);
    // サービスワーカーのキャッシュをクリアしてリロード
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
    // 少し待ってからリロード（SWが更新を適用するため）
    setTimeout(() => window.location.reload(), 300);
    void knownVersion;
  }

  function handleDismiss() {
    setUpdateAvailable(false);
  }

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[90] bg-blue-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
      <span className="text-xl shrink-0">🔄</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight">新しいバージョンが利用可能 {newVersion && `(v${newVersion})`}</p>
        <p className="text-xs text-blue-200 mt-0.5">タップして最新版に更新</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleUpdate}
          className="bg-white text-blue-600 font-bold text-xs px-3 py-1.5 rounded-full active:bg-blue-50"
        >
          更新
        </button>
        <button
          onClick={handleDismiss}
          className="text-blue-200 text-lg leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
