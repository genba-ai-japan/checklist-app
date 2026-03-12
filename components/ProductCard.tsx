"use client";

import Link from "next/link";
import Image from "next/image";
import { ProductSummary } from "@/types";

interface Props {
  summary: ProductSummary;
}

export default function ProductCard({ summary }: Props) {
  const dateStr = new Date(summary.latestDate).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <Link href={`/product/${encodeURIComponent(summary.productName)}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform">
        <div className="flex">
          {/* サムネイル */}
          <div className="w-24 h-24 flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
            {summary.latestPhotoUrl ? (
              <Image
                src={summary.latestPhotoUrl}
                alt="設定写真"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-3xl">📦</span>
            )}
          </div>

          {/* テキスト情報 */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-lg font-bold text-gray-900 leading-tight">{summary.productName}</p>
              <span className="text-xs text-gray-400 flex-shrink-0 bg-gray-50 px-2 py-0.5 rounded-full">
                {summary.count}件
              </span>
            </div>

            {/* 内容量 */}
            <div className="mt-1.5">
              <span className="text-xs text-gray-500 mr-1">内容量：</span>
              <span className="text-xs font-medium text-blue-700">
                {summary.contentVolumes.join(" / ") || "—"}
              </span>
            </div>

            {/* 機械名 */}
            <div className="mt-0.5">
              <span className="text-xs text-gray-500 mr-1">機械：</span>
              <span className="text-xs font-medium text-green-700">
                {summary.machineNames.join(" / ") || "—"}
              </span>
            </div>

            <div className="mt-1.5 text-xs text-gray-400">最終更新：{dateStr}</div>
          </div>
          <div className="flex items-center pr-3 text-gray-300">›</div>
        </div>
      </div>
    </Link>
  );
}
