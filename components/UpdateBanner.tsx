"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5分ごとにチェック
const CLIENT_BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";

export default function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data: { buildTime: string } = await res.json();
        if (data.buildTime && data.buildTime !== CLIENT_BUILD_TIME) {
          setUpdateAvailable(true);
        }
      } catch {
        // ネットワークエラーは無視
      }
    }

    // 初回チェック（マウント直後ではなく少し待ってから）
    const initialTimer = setTimeout(checkVersion, 10_000);
    const interval = setInterval(checkVersion, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-blue-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">🔄</span>
        <span className="font-medium">新しいバージョンがあります</span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="flex-shrink-0 bg-white text-blue-600 font-bold text-sm px-4 py-1.5 rounded-xl active:bg-blue-50"
      >
        更新する
      </button>
    </div>
  );
}
