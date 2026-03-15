"use client";

import { useState } from "react";
import { getCategories, getAccounts, addTransaction } from "@/lib/storage";
import { generateId, todayString } from "@/lib/utils";
import { TransactionType, Category } from "@/types";

interface SplitItem {
  id: string;
  categoryId: string;
  amount: string;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
  defaultDate?: string;
}

function parseAmt(val: string) {
  return parseInt(val.replace(/,/g, ""), 10) || 0;
}
function fmtAmt(val: string) {
  const clean = val.replace(/[^0-9]/g, "");
  if (!clean) return "";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function TransactionForm({ onClose, onSaved, defaultDate }: Props) {
  const categories = getCategories();
  const accounts = getAccounts();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate ?? todayString());
  const [memo, setMemo] = useState("");

  // 振り分けモード
  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState<SplitItem[]>([
    { id: generateId(), categoryId: "", amount: "" },
  ]);

  const filteredCats = categories.filter(c => c.type === type);
  const totalAmt = parseAmt(amount);
  const splitTotal = splits.reduce((s, row) => s + parseAmt(row.amount), 0);
  const remaining = totalAmt - splitTotal;

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setCategoryId("");
    setSplits(splits.map(s => ({ ...s, categoryId: "" })));
  }

  function handleSave() {
    if (!accountId) return;

    if (splitMode) {
      // 振り分けモード: 各行ごとに保存
      const validSplits = splits.filter(s => parseAmt(s.amount) > 0 && s.categoryId);
      if (validSplits.length === 0) return;
      for (const split of validSplits) {
        addTransaction({
          id: generateId(),
          type,
          amount: parseAmt(split.amount),
          categoryId: split.categoryId,
          accountId,
          date,
          memo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      const amt = parseAmt(amount);
      if (!amt || amt <= 0) return;
      if (!categoryId) return;
      addTransaction({
        id: generateId(),
        type,
        amount: amt,
        categoryId,
        accountId,
        date,
        memo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    onSaved();
  }

  function addSplitRow() {
    setSplits(prev => [...prev, { id: generateId(), categoryId: "", amount: "" }]);
  }

  function removeSplitRow(id: string) {
    setSplits(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  }

  function updateSplit(id: string, field: "categoryId" | "amount", value: string) {
    setSplits(prev => prev.map(s =>
      s.id === id
        ? { ...s, [field]: field === "amount" ? fmtAmt(value) : value }
        : s
    ));
  }

  // 残り金額を最後の空行に自動入力
  function fillRemaining(id: string) {
    if (remaining > 0) {
      setSplits(prev => prev.map(s =>
        s.id === id ? { ...s, amount: remaining.toLocaleString() } : s
      ));
    }
  }

  const canSave = splitMode
    ? splits.some(s => parseAmt(s.amount) > 0 && s.categoryId)
    : !!(parseAmt(amount) > 0 && categoryId && accountId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end max-w-md mx-auto">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* フォーム */}
      <div className="relative bg-white rounded-t-3xl shadow-xl flex flex-col max-h-[90vh]">
        {/* ハンドル・閉じる */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg leading-none"
          >×</button>
        </div>

        <div className="overflow-y-auto px-4 pb-8 space-y-4">
          {/* 収入/支出切り替え */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => handleTypeChange("expense")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === "expense" ? "bg-white shadow text-red-500" : "text-gray-400"
              }`}
            >支出</button>
            <button
              onClick={() => handleTypeChange("income")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === "income" ? "bg-white shadow text-green-600" : "text-gray-400"
              }`}
            >収入</button>
          </div>

          {/* 金額 */}
          <div>
            <label className="text-xs text-gray-500 font-medium">
              {splitMode ? "合計金額（任意）" : "金額"}
            </label>
            <div className="flex items-center border-b-2 border-blue-500 mt-1 pb-1">
              <span className="text-2xl text-gray-400 mr-2">¥</span>
              <input
                type="tel"
                inputMode="numeric"
                value={amount}
                onChange={e => setAmount(fmtAmt(e.target.value))}
                placeholder="0"
                autoFocus={!splitMode}
                className="flex-1 text-3xl font-bold text-gray-900 outline-none bg-transparent"
              />
            </div>
          </div>

          {/* 振り分けトグル（支出のみ） */}
          {type === "expense" && (
            <button
              onClick={() => setSplitMode(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                splitMode
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🗂️</span>
                <span>カテゴリに振り分ける</span>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${splitMode ? "bg-blue-500" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${splitMode ? "left-5" : "left-0.5"}`} />
              </div>
            </button>
          )}

          {/* === 通常モード: カテゴリ === */}
          {!splitMode && (
            <div>
              <label className="text-xs text-gray-500 font-medium">カテゴリ</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {filteredCats.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      categoryId === cat.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* === 振り分けモード === */}
          {splitMode && (
            <div className="space-y-3">
              {/* 残り表示 */}
              {totalAmt > 0 && (
                <div className={`flex items-center justify-between text-sm px-3 py-2 rounded-xl ${
                  remaining === 0 ? "bg-green-50 text-green-700" :
                  remaining < 0 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"
                }`}>
                  <span className="font-medium">
                    {remaining === 0 ? "✓ 振り分け完了" : remaining > 0 ? "残り" : "超過"}
                  </span>
                  <span className="font-bold">
                    ¥{Math.abs(remaining).toLocaleString()}
                  </span>
                </div>
              )}

              {/* 振り分け行 */}
              {splits.map((split, idx) => (
                <SplitRow
                  key={split.id}
                  split={split}
                  cats={filteredCats}
                  canRemove={splits.length > 1}
                  remaining={remaining}
                  onCategoryChange={id => updateSplit(split.id, "categoryId", id)}
                  onAmountChange={v => updateSplit(split.id, "amount", v)}
                  onRemove={() => removeSplitRow(split.id)}
                  onFillRemaining={() => fillRemaining(split.id)}
                />
              ))}

              {/* 行追加 */}
              <button
                onClick={addSplitRow}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 font-medium hover:border-blue-300 hover:text-blue-500 transition-colors"
              >
                ＋ 振り分けを追加
              </button>
            </div>
          )}

          {/* 口座 */}
          <div>
            <label className="text-xs text-gray-500 font-medium">口座</label>
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setAccountId(acc.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    accountId === acc.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>

          {/* 日付 */}
          <div>
            <label className="text-xs text-gray-500 font-medium">日付</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="text-xs text-gray-500 font-medium">メモ（任意）</label>
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="例：スーパーで買い物"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-4 rounded-2xl bg-blue-600 active:bg-blue-700 text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {splitMode ? `${splits.filter(s => s.categoryId && parseAmt(s.amount) > 0).length}件まとめて保存` : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 振り分け行コンポーネント
function SplitRow({
  split,
  cats,
  canRemove,
  remaining,
  onCategoryChange,
  onAmountChange,
  onRemove,
  onFillRemaining,
}: {
  split: SplitItem;
  cats: Category[];
  canRemove: boolean;
  remaining: number;
  onCategoryChange: (id: string) => void;
  onAmountChange: (v: string) => void;
  onRemove: () => void;
  onFillRemaining: () => void;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3 space-y-2">
      {/* カテゴリ選択 */}
      <div className="flex flex-wrap gap-1.5">
        {cats.map(cat => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              split.categoryId === cat.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 金額行 */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">¥</span>
        <input
          type="tel"
          inputMode="numeric"
          value={split.amount}
          onChange={e => onAmountChange(e.target.value)}
          placeholder="金額を入力"
          className="flex-1 text-lg font-bold text-gray-900 outline-none bg-transparent border-b border-gray-200 pb-0.5"
        />
        {/* 残り自動入力 */}
        {remaining > 0 && !split.amount && (
          <button
            onClick={onFillRemaining}
            className="text-xs text-blue-500 font-medium whitespace-nowrap border border-blue-200 px-2 py-0.5 rounded-full"
          >
            残り¥{remaining.toLocaleString()}
          </button>
        )}
        {canRemove && (
          <button onClick={onRemove} className="text-gray-300 text-lg leading-none ml-1">×</button>
        )}
      </div>
    </div>
  );
}
