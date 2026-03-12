"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MachineRecord, ProductSummary } from "@/types";
import {
  getAllRecords,
  searchRecords,
  filterRecords,
  getUniqueValues,
  getProductSummaries,
} from "@/lib/storage";
import RecordCard from "@/components/RecordCard";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";

type ViewMode = "records" | "products";

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("records");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ productName: "", machineName: "", packType: "" });
  const [records, setRecords] = useState<MachineRecord[]>([]);
  const [productSummaries, setProductSummaries] = useState<ProductSummary[]>([]);
  const [options, setOptions] = useState({
    productNames: [] as string[],
    machineNames: [] as string[],
    packTypes: [] as string[],
  });
  const [loading, setLoading] = useState(true);

  // フィルターオプション取得
  useEffect(() => {
    Promise.all([
      getUniqueValues("productName"),
      getUniqueValues("machineName"),
      getUniqueValues("packType"),
    ]).then(([productNames, machineNames, packTypes]) => {
      setOptions({ productNames, machineNames, packTypes });
    });
  }, []);

  // データ取得（検索・フィルター）
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === "products") {
        const summaries = await getProductSummaries(searchQuery || undefined);
        setProductSummaries(summaries);
      } else {
        const hasFilter = filters.productName || filters.machineName || filters.packType;
        let data: MachineRecord[];
        if (searchQuery) {
          data = await searchRecords(searchQuery);
          if (hasFilter) {
            data = data.filter((r) => {
              if (filters.productName && r.productName !== filters.productName) return false;
              if (filters.machineName && r.machineName !== filters.machineName) return false;
              if (filters.packType && r.packType !== filters.packType) return false;
              return true;
            });
          }
        } else if (hasFilter) {
          data = await filterRecords(filters);
        } else {
          data = await getAllRecords();
        }
        setRecords(data);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">🏭 機械設定台帳</h1>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {viewMode === "records" ? `${records.length}件` : `${productSummaries.length}品目`}
            </span>
          </div>

          {/* 検索バー */}
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          {/* ビュー切り替え */}
          <div className="flex mt-3 bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("records")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === "records"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              📋 登録一覧
            </button>
            <button
              onClick={() => setViewMode("products")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === "products"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              📦 製品検索
            </button>
          </div>

          {/* フィルター（登録一覧のみ） */}
          {viewMode === "records" && (
            <div className="mt-2">
              <FilterBar filters={filters} options={options} onChange={setFilters} />
            </div>
          )}
        </div>
      </header>

      {/* コンテンツ */}
      <main className="px-4 py-4 pb-28 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">読み込み中...</div>
        ) : viewMode === "records" ? (
          records.length === 0 ? (
            <EmptyState query={searchQuery} />
          ) : (
            records.map((r) => <RecordCard key={r.id} record={r} />)
          )
        ) : productSummaries.length === 0 ? (
          <EmptyState query={searchQuery} />
        ) : (
          productSummaries.map((s) => <ProductCard key={s.productName} summary={s} />)
        )}
      </main>

      {/* 新規登録ボタン（固定） */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
        <Link href="/new">
          <button className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transition-colors">
            ＋ 新規登録
          </button>
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-gray-500 font-medium">
        {query ? `「${query}」に一致するデータがありません` : "データがありません"}
      </p>
      <p className="text-sm text-gray-400 mt-1">新規登録ボタンから追加してください</p>
    </div>
  );
}
