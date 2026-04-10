import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase クライアント。環境変数が未設定の場合は null（ローカルのみ動作）。
 *
 * 設定方法:
 *   1. https://supabase.com でプロジェクトを作成
 *   2. 以下の SQL を Supabase の SQL エディタで実行:
 *
 *   CREATE TABLE sync_data (
 *     key TEXT PRIMARY KEY,
 *     data JSONB NOT NULL,
 *     device_id TEXT NOT NULL DEFAULT '',
 *     updated_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *   ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "public_access" ON sync_data
 *     FOR ALL USING (true) WITH CHECK (true);
 *   ALTER PUBLICATION supabase_realtime ADD TABLE sync_data;
 *
 *   3. Vercel の環境変数に以下を追加:
 *      NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *      NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const isSyncEnabled = !!supabase;
