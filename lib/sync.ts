"use client";

import { supabase } from "./supabase";

// ── デバイス識別子 ─────────────────────────────────────────────
// localStorage に永続保存（タブ間で共有、デバイス固有）
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("_sync_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("_sync_device_id", id);
  }
  return id;
}

// ── クラウドへ書き込み ─────────────────────────────────────────
// storage.ts の save() から fire-and-forget で呼ばれる
export function pushToCloud(key: string, data: unknown): void {
  if (!supabase || typeof window === "undefined") return;
  supabase
    .from("sync_data")
    .upsert(
      {
        key,
        data,
        device_id: getDeviceId(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    )
    .then(({ error }) => {
      if (error) console.warn("[sync] push failed:", error.message);
    });
}

// ── クラウドから全データ取得 ───────────────────────────────────
// 初回ロード時にクラウドの最新データで localStorage を上書き
export async function pullAllFromCloud(): Promise<void> {
  if (!supabase || typeof window === "undefined") return;
  try {
    const { data: rows, error } = await supabase
      .from("sync_data")
      .select("key, data");
    if (error) throw error;
    for (const row of rows ?? []) {
      if (row.data != null) {
        localStorage.setItem(row.key, JSON.stringify(row.data));
      }
    }
  } catch (e) {
    console.warn("[sync] pull failed:", e);
  }
}
