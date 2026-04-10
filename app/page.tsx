"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Improvement } from "@/types";
import { PROCESS_STEPS, getAllImprovements } from "@/lib/analysisStorage";

const POLL_INTERVAL_MS = 30_000;

export default function HomePage() {
  const [improvementsByStep, setImprovementsByStep] = useState<Record<string, Improvement[]>>({});
  const [loading, setLoading] = useState(true);
  const lastModifiedRef = useRef<string>("");

  const loadData = useCallback(async () => {
    try {
      const { items, lastModified } = await getAllImprovements();
      lastModifiedRef.current = lastModified;
      const map: Record<string, Improvement[]> = {};
      for (const step of PROCESS_STEPS) {
        map[step.id] = items.filter((i) => i.stepId === step.id);
      }
      setImprovementsByStep(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    async function checkUpdates() {
      try {
        const res = await fetch("/api/improvements/meta", { cache: "no-store" });
        const { lastModified } = await res.json();
        if (lastModified !== lastModifiedRef.current) {
          await loadData();
        }
      } catch {
        // ネットワークエラーは無視
      }
    }

    const interval = setInterval(checkUpdates, POLL_INTERVAL_MS);

    // 画面フォーカス時にも即チェック
    const onVisibility = () => { if (!document.hidden) checkUpdates(); };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadData]);

  const totalImprovements = Object.values(improvementsByStep).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">🏭 工場フロー分析</h1>
          {!loading && totalImprovements > 0 && (
            <span className="text-sm text-gray-400">{totalImprovements}件</span>
          )}
        </div>
      </header>

      {/* 説明 */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-gray-400 text-center">
          上流から順に工程を確認し、各工程の改善点を記録・管理できます
        </p>
      </div>

      {loading ? (
        <p className="text-center py-16 text-gray-400">読み込み中...</p>
      ) : (
        <main className="px-4 py-2 pb-16 space-y-0">
          {PROCESS_STEPS.map((step, idx) => {
            const improvements = improvementsByStep[step.id] || [];
            return (
              <div key={step.id}>
                {/* ステップカード */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* ステップヘッダー */}
                  <div className="bg-blue-50 px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">{step.icon}</span>
                    <div className="flex-1">
                      <span className="text-xs text-blue-400 font-medium">STEP {step.order}</span>
                      <h2 className="text-base font-bold text-gray-900 leading-tight">{step.name}</h2>
                    </div>
                    {improvements.length > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-1 rounded-full">
                        {improvements.length}件
                      </span>
                    )}
                  </div>

                  {/* 改善点リスト */}
                  <div className="divide-y divide-gray-50">
                    {improvements.map((imp) => (
                      <Link key={imp.id} href={`/analysis/improvement/${imp.id}`}>
                        <div className="px-4 py-3 active:bg-gray-50 flex items-center gap-3">
                          <span className="text-orange-400 text-lg">⚡</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{imp.title}</p>
                            {imp.metrics.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {imp.metrics[0].label}:{" "}
                                <span className="text-gray-600">
                                  {imp.metrics[0].currentValue}{imp.metrics[0].unit}
                                </span>
                                {" → "}
                                <span className="text-green-600 font-medium">
                                  {imp.metrics[0].targetValue}{imp.metrics[0].unit}
                                </span>
                              </p>
                            )}
                            {imp.products.length > 0 && (
                              <p className="text-xs text-blue-400 mt-0.5">
                                製品・機械: {imp.products.length}件
                              </p>
                            )}
                          </div>
                          <span className="text-gray-300">›</span>
                        </div>
                      </Link>
                    ))}

                    {/* 改善点追加ボタン */}
                    <Link href={`/analysis/improvement/new?stepId=${step.id}`}>
                      <div className="px-4 py-3 active:bg-blue-50 flex items-center gap-2 text-blue-600">
                        <span className="text-lg font-bold">＋</span>
                        <span className="text-sm font-medium">改善点を追加</span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* ステップ間の矢印 */}
                {idx < PROCESS_STEPS.length - 1 && (
                  <div className="flex flex-col items-center py-1">
                    <div className="w-0.5 h-3 bg-gray-200" />
                    <span className="text-gray-300 text-base leading-none">▼</span>
                  </div>
                )}
              </div>
            );
          })}
        </main>
      )}
    </div>
  );
}
