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
    router.push("/records");
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
        <Link href="/records" className="text-blue-500 underline">一覧に戻る</Link>
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3 gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-500 active:bg-gray-100 rounded-xl"
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
        {record.photoUrl ? (
          <div className="bg-black">
            <Image
              src={record.photoUrl}
              alt="設定写真"
              width={800}
              height={500}
              className="object-contain w-full max-h-72"
            />
          </div>
        ) : (
          <div className="bg-gray-100 flex items-center justify-center h-40">
            <span className="text-5xl">📷</span>
          </div>
        )}

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
              {record.machineNumber && (
                <span className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                  機械 {record.machineNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">{dateStr}</p>
          </div>

          {/* 設定値メモ */}
          {record.settingsMemo && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-500">⚙️ 設定値メモ</h3>
              </div>
              <div className="px-4 py-3">
                <p className="text-base text-gray-900 whitespace-pre-wrap">{record.settingsMemo}</p>
              </div>
            </div>
          )}
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
