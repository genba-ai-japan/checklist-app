"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5分ごとにチェック

export default function UpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [reloading, setReloading] = useState(false);
  const currentVersion = useRef<string | null>(null);

  useEffect(() => {
    // 初回: 現在のバージョンを記録
    const fetchVersion = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const data = await res.json();
        const incoming = data.version as string;

        if (currentVersion.current === null) {
          // 初回取得 → 基準として保存
          currentVersion.current = incoming;
        } else if (currentVersion.current !== incoming) {
          // バージョンが変わった → バナー表示
          setHasUpdate(true);
        }
      } catch {
        // ネットワークエラーは無視
      }
    };

    fetchVersion();
    const timer = setInterval(fetchVersion, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // ページにフォーカスが戻ったときもチェック
  useEffect(() => {
    const onFocus = async () => {
      if (!currentVersion.current) return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const data = await res.json();
        if (data.version !== currentVersion.current) setHasUpdate(true);
      } catch {
        // ignore
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!hasUpdate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-2">
      <div className="bg-gray-900 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl">🆕</span>
        <div className="flex-1">
          <p className="font-bold text-sm">新しいバージョンがあります</p>
          <p className="text-xs text-gray-400">タップして最新版に更新できます</p>
        </div>
        <button
          onClick={() => {
            setReloading(true);
            window.location.reload();
          }}
          className="bg-white text-gray-900 font-bold text-sm px-4 py-2 rounded-xl active:bg-gray-100 flex-shrink-0"
        >
          {reloading ? "更新中..." : "今すぐ更新"}
        </button>
      </div>
    </div>
  );
}
