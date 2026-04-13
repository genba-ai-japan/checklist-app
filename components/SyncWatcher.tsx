"use client";

import { useEffect, useRef, useState } from "react";
import { getCurrentAccountId } from "@/lib/session";

const POLL_MS = 5_000;
const SESSION_KEY = "sync_last_version";

type SyncResult =
  | { changed: false; version: number }
  | { changed: true; version: number; data: Record<string, unknown> };

async function fetchSync(accountId: string, since: number): Promise<SyncResult> {
  try {
    const res = await fetch(
      `/api/sync?accountId=${encodeURIComponent(accountId)}&since=${since}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { changed: false, version: since };
    return (await res.json()) as SyncResult;
  } catch {
    return { changed: false, version: since };
  }
}

function applyToLocalStorage(data: Record<string, unknown>) {
  for (const [key, value] of Object.entries(data)) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* ignore */ }
  }
}

export default function SyncWatcher() {
  const [hasRemoteUpdate, setHasRemoteUpdate] = useState(false);
  const [visible, setVisible] = useState(false);
  const lastVersionRef = useRef(0);
  const isFirstSyncRef = useRef(true);
  const pendingVersionRef = useRef(0);

  useEffect(() => {
    const accountId = getCurrentAccountId();
    // Restore version from previous page load (sessionStorage survives reloads)
    const stored = Number(sessionStorage.getItem(SESSION_KEY) ?? "0");
    lastVersionRef.current = stored;
    isFirstSyncRef.current = stored === 0;

    async function poll() {
      const result = await fetchSync(accountId, lastVersionRef.current);
      if (!result.changed) return;

      applyToLocalStorage(result.data);
      pendingVersionRef.current = result.version;

      if (isFirstSyncRef.current) {
        // Silent auto-reload on first ever load — user gets fresh data seamlessly
        sessionStorage.setItem(SESSION_KEY, result.version.toString());
        window.location.reload();
        return;
      }

      lastVersionRef.current = result.version;
      sessionStorage.setItem(SESSION_KEY, result.version.toString());
      setHasRemoteUpdate(true);
      setTimeout(() => setVisible(true), 100);
    }

    // Run immediately, then on interval
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, []);

  function handleReload() {
    sessionStorage.setItem(SESSION_KEY, pendingVersionRef.current.toString());
    setVisible(false);
    setTimeout(() => window.location.reload(), 150);
  }

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => setHasRemoteUpdate(false), 300);
  }

  if (!hasRemoteUpdate) return null;

  return (
    <div
      className={`fixed top-4 left-3 right-3 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
      }`}
    >
      <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
        <span className="text-xl shrink-0 animate-pulse">🔄</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">他の端末で更新がありました</p>
          <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">最新データを読み込みます</p>
        </div>
        <button
          onClick={handleReload}
          className="bg-lime-400 text-gray-900 font-bold text-xs px-3 py-1.5 rounded-xl shrink-0 active:opacity-70"
        >
          再読み込み
        </button>
        <button onClick={handleDismiss} className="text-gray-400 text-lg leading-none p-1 shrink-0">
          ✕
        </button>
      </div>
    </div>
  );
}
