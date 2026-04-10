"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, isSyncEnabled } from "@/lib/supabase";
import { getDeviceId, pullAllFromCloud } from "@/lib/sync";

type SyncState = "idle" | "syncing" | "updated";

export default function SyncProvider() {
  const [state, setState] = useState<SyncState>("idle");
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSyncEnabled || !supabase) return;

    // ── 初回ロード: クラウドから最新データを取得 ──────────────
    (async () => {
      setState("syncing");
      await pullAllFromCloud();
      setState("idle");
      // 他の端末データで localStorage が更新されたのでページリロード
      // （初回のみ。すでに表示済みのコンポーネントに反映させるため）
      window.location.reload();
    })();

    // ── リアルタイム購読 ────────────────────────────────────
    const channel = supabase
      .channel("sync_data_changes")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "sync_data" },
        (payload: {
          new: { key: string; data: unknown; device_id: string };
        }) => {
          const row = payload.new;
          if (!row || !row.key) return;
          // 自分の端末からの書き込みは無視
          if (row.device_id === getDeviceId()) return;

          // ローカルストレージを更新
          localStorage.setItem(row.key, JSON.stringify(row.data));

          // バナーを表示 + 5秒後に自動リロード
          setState("updated");
          if (reloadTimer.current) clearTimeout(reloadTimer.current);
          reloadTimer.current = setTimeout(() => {
            window.location.reload();
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
    };
  }, []);

  // ── 同期中インジケーター ────────────────────────────────────
  if (state === "syncing") {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 pointer-events-none">
        <div className="bg-gray-800/90 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2">
          <span className="animate-spin inline-block">⟳</span>
          クラウドと同期中...
        </div>
      </div>
    );
  }

  // ── 別端末から更新バナー ────────────────────────────────────
  if (state === "updated") {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-2">
        <div className="bg-blue-600 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl flex-shrink-0">🔄</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">別の端末からデータが更新されました</p>
            <p className="text-xs text-blue-200">5秒後に自動反映します</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-blue-600 font-bold text-sm px-3 py-2 rounded-xl flex-shrink-0 active:bg-blue-50"
          >
            今すぐ反映
          </button>
        </div>
      </div>
    );
  }

  return null;
}
