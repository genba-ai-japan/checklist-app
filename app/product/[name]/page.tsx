"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MachineRecord } from "@/types";
import { getProductHistory } from "@/lib/storage";

export default function ProductHistoryPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const productName = decodeURIComponent(name);
  const [records, setRecords] = useState<MachineRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductHistory(productName).then((r) => {
      setRecords(r);
      setLoading(false);
    });
  }, [productName]);

  // 集計データ
  const contentVolumes = [...new Set(records.map((r) => r.contentVolume).filter(Boolean))];
  const machineNames = [...new Set(records.map((r) => r.machineName).filter(Boolean))];
  const packTypes = [...new Set(records.map((r) => r.packType).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center px-4 py-3 gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl text-gray-500 active:bg-gray-100"
          >
            ‹ 戻る
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{productName}</h1>
            <p className="text-xs text-gray-400">製品履歴 · {records.length}件</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 pb-8 space-y-4">
        {/* 製品サマリー */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-500 mb-3">📊 製品サマリー</h2>

          <SummaryRow
            label="内容量"
            values={contentVolumes}
            color="blue"
          />
          <SummaryRow
            label="製造機械"
            values={machineNames}
            color="green"
          />
          <SummaryRow
            label="パック形態"
            values={packTypes}
            color="gray"
          />
        </div>

        {/* 履歴一覧 */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 mb-3 px-1">📋 設定履歴（新しい順）</h2>
          {records.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">履歴がありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record, index) => (
                <HistoryCard key={record.id} record={record} isLatest={index === 0} />
              ))}
            </div>
          )}
        </div>

        {/* 新規登録ボタン */}
        <Link href="/new">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between active:bg-blue-100">
            <div>
              <p className="text-blue-700 font-medium">この製品の設定を新規登録</p>
              <p className="text-blue-500 text-sm">新しい設定値を追加する</p>
            </div>
            <span className="text-blue-400 text-2xl">＋</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  values,
  color,
}: {
  label: string;
  values: string[];
  color: "blue" | "green" | "gray";
}) {
  const badgeStyles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    gray: "bg-gray-100 text-gray-600",
  };

  if (values.length === 0) return null;

  return (
    <div className="flex gap-2 mb-3 flex-wrap items-start">
      <span className="text-xs text-gray-500 font-medium w-16 flex-shrink-0 pt-1">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className={`text-sm font-medium px-3 py-1 rounded-full ${badgeStyles[color]}`}>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function HistoryCard({ record, isLatest }: { record: MachineRecord; isLatest: boolean }) {
  const dateStr = new Date(record.registeredAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link href={`/item/${record.id}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform">
        <div className="flex">
          {/* サムネイル */}
          <div className="w-20 h-20 flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
            {record.photoUrl ? (
              <Image
                src={record.photoUrl}
                alt="設定写真"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-2xl">📷</span>
            )}
          </div>

          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-center gap-2">
              {isLatest && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  最新
                </span>
              )}
              <span className="text-sm font-medium text-gray-700 truncate">
                {record.contentVolume} · {record.machineName}
              </span>
            </div>

            <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
              {record.sealTemp && <MiniInfo label="シール温度" value={record.sealTemp} />}
              {record.fillTemp && <MiniInfo label="充填温度" value={record.fillTemp} />}
              {record.speed && <MiniInfo label="スピード" value={record.speed} />}
            </div>

            <div className="mt-1.5 text-xs text-gray-400">
              {dateStr} · {record.registeredBy}
            </div>
          </div>
          <div className="flex items-center pr-3 text-gray-300">›</div>
        </div>

        {record.notes && (
          <div className="px-3 py-2 bg-amber-50 border-t border-amber-100">
            <p className="text-xs text-amber-700 line-clamp-2">⚠️ {record.notes}</p>
          </div>
        )}
      </div>
    </Link>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-400">{label}：</span>
      <span className="text-xs font-medium text-gray-700">{value}</span>
    </div>
  );
}
