"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Improvement, ImprovementProduct, ImprovementMetric } from "@/types";
import {
  getImprovement,
  createImprovement,
  updateImprovement,
  deleteImprovement,
  PROCESS_STEPS,
} from "@/lib/analysisStorage";

// ---- デフォルト値 ----
function emptyProduct(): ImprovementProduct {
  return { id: crypto.randomUUID(), name: "", url: "", imageUrl: "" };
}
function emptyMetric(): ImprovementMetric {
  return { id: crypto.randomUUID(), label: "", unit: "", currentValue: 0, targetValue: 0 };
}
function emptyImprovement(stepId: string): Omit<Improvement, "id" | "createdAt"> {
  return { stepId, title: "", description: "", products: [], metrics: [] };
}

// ---- 改善率の計算 ----
function calcImprovement(current: number, target: number) {
  const delta = target - current;
  const pct = current !== 0 ? (delta / Math.abs(current)) * 100 : 0;
  return { delta, pct };
}

export default function ImprovementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isNew = id === "new";
  const stepIdParam = searchParams.get("stepId") ?? PROCESS_STEPS[0].id;

  const [form, setForm] = useState<Omit<Improvement, "id" | "createdAt">>(
    emptyImprovement(stepIdParam)
  );
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 既存データ読み込み
  useEffect(() => {
    if (isNew) return;
    const imp = getImprovement(id);
    if (imp) {
      const { id: _id, createdAt: _c, ...rest } = imp;
      setForm(rest);
    }
    setLoading(false);
  }, [id, isNew]);

  const step = PROCESS_STEPS.find((s) => s.id === form.stepId);

  // ---- フォーム操作ヘルパー ----
  function setTitle(v: string) { setForm((f) => ({ ...f, title: v })); }
  function setDescription(v: string) { setForm((f) => ({ ...f, description: v })); }

  // 製品
  function addProduct() {
    setForm((f) => ({ ...f, products: [...f.products, emptyProduct()] }));
  }
  function updateProduct(idx: number, key: keyof ImprovementProduct, value: string) {
    setForm((f) => {
      const products = [...f.products];
      products[idx] = { ...products[idx], [key]: value };
      return { ...f, products };
    });
  }
  function removeProduct(idx: number) {
    setForm((f) => ({ ...f, products: f.products.filter((_, i) => i !== idx) }));
  }

  // 指標
  function addMetric() {
    setForm((f) => ({ ...f, metrics: [...f.metrics, emptyMetric()] }));
  }
  function updateMetric(idx: number, key: keyof ImprovementMetric, value: string | number) {
    setForm((f) => {
      const metrics = [...f.metrics];
      metrics[idx] = { ...metrics[idx], [key]: value };
      return { ...f, metrics };
    });
  }
  function removeMetric(idx: number) {
    setForm((f) => ({ ...f, metrics: f.metrics.filter((_, i) => i !== idx) }));
  }

  // 保存
  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (isNew) {
        createImprovement(form);
      } else {
        const imp = getImprovement(id);
        if (imp) updateImprovement({ ...imp, ...form });
      }
      router.push("/analysis");
    } finally {
      setSaving(false);
    }
  }

  // 削除
  async function handleDelete() {
    setDeleting(true);
    deleteImprovement(id);
    router.push("/analysis");
  }

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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3 gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-500 active:bg-gray-100 rounded-xl"
          >
            ‹ 戻る
          </button>
          <h1 className="text-base font-bold text-gray-900 flex-1 truncate">
            {step ? `${step.icon} ${step.name}` : "改善点"}
          </h1>
          {!isNew && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-red-400 text-sm px-3 py-1.5 rounded-lg active:bg-red-50"
            >
              削除
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-4 pb-32 space-y-4">

        {/* タイトル */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="text-sm font-bold text-gray-500">⚡ 改善タイトル</h2>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：充填工程の自動化による時間短縮"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={form.description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="改善内容の詳細を記入..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </section>

        {/* 改善数値 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-500">📊 改善数値</h2>
            <button
              onClick={addMetric}
              className="text-xs text-blue-600 font-medium px-3 py-1.5 bg-blue-50 rounded-lg active:bg-blue-100"
            >
              ＋ 追加
            </button>
          </div>

          {form.metrics.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-400 text-sm">指標を追加して改善効果を計算しましょう</p>
              <button
                onClick={addMetric}
                className="mt-2 text-blue-500 text-sm underline"
              >
                指標を追加
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {form.metrics.map((metric, idx) => (
                <MetricEditor
                  key={metric.id}
                  metric={metric}
                  onChange={(key, val) => updateMetric(idx, key, val)}
                  onRemove={() => removeMetric(idx)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 製品・機械情報 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-500">🔗 活用できる製品・機械</h2>
            <button
              onClick={addProduct}
              className="text-xs text-blue-600 font-medium px-3 py-1.5 bg-blue-50 rounded-lg active:bg-blue-100"
            >
              ＋ 追加
            </button>
          </div>

          {form.products.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-400 text-sm">改善に使える製品や機械を追加しましょう</p>
              <button
                onClick={addProduct}
                className="mt-2 text-blue-500 text-sm underline"
              >
                製品・機械を追加
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {form.products.map((product, idx) => (
                <ProductEditor
                  key={product.id}
                  product={product}
                  onChange={(key, val) => updateProduct(idx, key, val)}
                  onRemove={() => removeProduct(idx)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 保存ボタン（固定） */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim()}
          className="w-full bg-blue-600 active:bg-blue-800 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-lg shadow-lg"
        >
          {saving ? "保存中..." : isNew ? "✓ 登録する" : "✓ 更新する"}
        </button>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">この改善点を削除しますか？</h3>
            <p className="text-sm text-gray-500">
              「{form.title}」を削除します。この操作は取り消せません。
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

// ---- 指標エディタ ----
function MetricEditor({
  metric,
  onChange,
  onRemove,
}: {
  metric: ImprovementMetric;
  onChange: (key: keyof ImprovementMetric, value: string | number) => void;
  onRemove: () => void;
}) {
  const { delta, pct } = calcImprovement(metric.currentValue, metric.targetValue);
  const hasValues = metric.currentValue !== 0 || metric.targetValue !== 0;
  const improved = delta !== 0;

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase">指標</span>
        <button onClick={onRemove} className="text-xs text-red-400 px-2 py-1">削除</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={metric.label}
          onChange={(e) => onChange("label", e.target.value)}
          placeholder="例：作業時間"
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={metric.unit}
          onChange={(e) => onChange("unit", e.target.value)}
          placeholder="例：時間/日"
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">現状値</label>
          <input
            type="number"
            value={metric.currentValue === 0 ? "" : metric.currentValue}
            onChange={(e) => onChange("currentValue", parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">目標値</label>
          <input
            type="number"
            value={metric.targetValue === 0 ? "" : metric.targetValue}
            onChange={(e) => onChange("targetValue", parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 改善効果の計算結果 */}
      {hasValues && improved && (
        <div className={`rounded-xl px-4 py-3 ${delta < 0 ? "bg-green-50" : "bg-blue-50"}`}>
          <p className="text-xs font-bold text-gray-500 mb-1">改善効果</p>
          <div className="flex items-baseline gap-3">
            <span className={`text-2xl font-bold ${delta < 0 ? "text-green-600" : "text-blue-600"}`}>
              {delta > 0 ? "+" : ""}{delta.toLocaleString()}{metric.unit}
            </span>
            <span className={`text-sm font-medium ${delta < 0 ? "text-green-500" : "text-blue-500"}`}>
              ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {metric.currentValue}{metric.unit} → {metric.targetValue}{metric.unit}
          </p>
        </div>
      )}
    </div>
  );
}

// ---- 製品エディタ ----
function ProductEditor({
  product,
  onChange,
  onRemove,
}: {
  product: ImprovementProduct;
  onChange: (key: keyof ImprovementProduct, value: string) => void;
  onRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange("imageUrl", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase">製品・機械</span>
        <button onClick={onRemove} className="text-xs text-red-400 px-2 py-1">削除</button>
      </div>

      <input
        type="text"
        value={product.name}
        onChange={(e) => onChange("name", e.target.value)}
        placeholder="製品・機械名（例：自動充填機 XF-200）"
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="url"
        value={product.url}
        onChange={(e) => onChange("url", e.target.value)}
        placeholder="製品ページURL（例：https://...）"
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {product.url && (
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 underline block truncate"
        >
          {product.url}
        </a>
      )}

      {/* 画像 */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer active:bg-gray-50 flex items-center justify-center min-h-28"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name || "製品画像"}
            width={400}
            height={200}
            className="object-contain max-h-48 w-full"
          />
        ) : (
          <div className="text-center py-6">
            <p className="text-3xl mb-1">📷</p>
            <p className="text-gray-400 text-xs">タップして画像を追加</p>
          </div>
        )}
      </div>
      {product.imageUrl && (
        <button
          type="button"
          onClick={() => onChange("imageUrl", "")}
          className="text-xs text-red-500 underline"
        >
          画像を削除
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImage}
        className="hidden"
      />
    </div>
  );
}
