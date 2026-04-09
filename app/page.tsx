"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { MachineRecord } from "@/types";
import { getAllRecords, searchRecords } from "@/lib/storage";

export default function HomePage() {
  const [records, setRecords] = useState<MachineRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = searchQuery
        ? await searchRecords(searchQuery)
        : await getAllRecords();
      setRecords(data);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">🏭 機械設定台帳</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{records.length}件</span>
              <Link href="/analysis">
                <button className="text-xs bg-orange-50 text-orange-600 font-bold px-3 py-1.5 rounded-xl active:bg-orange-100">
                  📊 分析
                </button>
              </Link>
            </div>
          </div>
          {/* 検索 */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="製品名で検索..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 一覧 */}
      <main className="px-4 py-4 pb-28 space-y-3">
        {loading ? (
          <p className="text-center py-12 text-gray-400">読み込み中...</p>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-gray-500">
              {searchQuery ? `「${searchQuery}」の結果なし` : "データがありません"}
            </p>
          </div>
        ) : (
          records.map((r) => <RecordCard key={r.id} record={r} />)
        )}
      </main>

      {/* 新規登録ボタン */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
        <Link href="/new">
          <button className="w-full bg-blue-600 active:bg-blue-800 text-white font-bold py-4 rounded-2xl text-lg shadow-lg">
            ＋ 新規登録
          </button>
        </Link>
      </div>
    </div>
  );
}

function RecordCard({ record }: { record: MachineRecord }) {
  const dateStr = new Date(record.registeredAt).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link href={`/item/${record.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:bg-gray-50">
        <div className="flex gap-3 p-3">
          {/* サムネイル */}
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
            {record.photoUrl ? (
              <Image
                src={record.photoUrl}
                alt="設定写真"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-3xl">📷</span>
            )}
          </div>
          {/* テキスト */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base truncate">{record.productName}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {record.contentVolume && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {record.contentVolume}
                </span>
              )}
              {record.packType && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {record.packType}
                </span>
              )}
              {record.machineNumber && (
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                  機械 {record.machineNumber}
                </span>
              )}
            </div>
            {record.settingsMemo && (
              <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{record.settingsMemo}</p>
            )}
            <p className="text-xs text-gray-300 mt-1">{dateStr}</p>
          </div>
          <span className="text-gray-300 self-center">›</span>
        </div>
      </div>
    </Link>
  );
}
