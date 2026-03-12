"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MachineRecord } from "@/types";
import { getRecord, deleteRecord } from "@/lib/storage";

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<MachineRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getRecord(id).then((r) => {
      setRecord(r);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    await deleteRecord(id);
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">データが見つかりません</p>
        <Link href="/" className="text-blue-500 underline">一覧に戻る</Link>
      </div>
    );
  }

  const dateStr = new Date(record.registeredAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
          <h1 className="text-lg font-bold text-gray-900 flex-1 truncate">{record.productName}</h1>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-red-400 text-sm px-3 py-1.5 rounded-lg active:bg-red-50"
          >
            削除
          </button>
        </div>
      </header>

      <div className="pb-8">
        {/* 写真 */}
        {record.photoUrl && (
          <div className="bg-black">
            <Image
              src={record.photoUrl}
              alt="設定写真"
              width={800}
              height={500}
              className="object-contain w-full max-h-72"
            />
          </div>
        )}
        {!record.photoUrl && (
          <div className="bg-gray-100 flex items-center justify-center h-40">
            <span className="text-5xl">📷</span>
          </div>
        )}

        {/* 基本情報 */}
        <div className="px-4 py-4 space-y-4">
          {/* ヘッドライン */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">{record.productName}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {record.contentVolume && (
                <span className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
                  {record.contentVolume}
                </span>
              )}
              {record.packType && (
                <span className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-full">
                  {record.packType}
                </span>
              )}
              {record.machineName && (
                <span className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                  {record.machineName}
                </span>
              )}
            </div>
            {record.lineName && (
              <p className="text-sm text-gray-500 mt-2">{record.lineName}</p>
            )}
            <p className="text-xs text-gray-400 mt-3">
              {dateStr}　登録者：{record.registeredBy}
            </p>
          </div>

          {/* 設定値 */}
          <InfoSection title="⚙️ 設定値">
            <InfoRow label="シール温度" value={record.sealTemp} />
            <InfoRow label="充填温度" value={record.fillTemp} />
            <InfoRow label="スピード" value={record.speed} />
            <InfoRow label="印字設定" value={record.printSettings} />
            <InfoRow label="その他設定値" value={record.otherSettings} />
          </InfoSection>

          {/* 注意・備考 */}
          {(record.notes || record.remarks) && (
            <InfoSection title="📝 注意点・備考">
              {record.notes && <InfoRow label="注意点" value={record.notes} highlight />}
              {record.remarks && <InfoRow label="備考" value={record.remarks} />}
            </InfoSection>
          )}

          {/* 製品履歴リンク */}
          <Link href={`/product/${encodeURIComponent(record.productName)}`}>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between active:bg-blue-100 transition-colors">
              <div>
                <p className="text-blue-700 font-medium">「{record.productName}」の製品履歴</p>
                <p className="text-blue-500 text-sm">過去の設定値・変更履歴を見る</p>
              </div>
              <span className="text-blue-400 text-xl">›</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">この記録を削除しますか？</h3>
            <p className="text-sm text-gray-500">
              「{record.productName}」の設定記録を削除します。この操作は取り消せません。
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full bg-gray-100 text-gray-700 font-medium py-4 rounded-2xl"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-500">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={`px-4 py-3 ${highlight ? "bg-amber-50" : ""}`}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-base font-medium ${highlight ? "text-amber-800" : "text-gray-900"} whitespace-pre-wrap`}>
        {value}
      </p>
    </div>
  );
}
