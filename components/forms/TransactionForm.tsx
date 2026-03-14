"use client";

import { useState } from "react";
import { getCategories, getAccounts, addTransaction } from "@/lib/storage";
import { generateId, todayString } from "@/lib/utils";
import { TransactionType } from "@/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  defaultDate?: string;
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

  const filteredCats = categories.filter(c => c.type === type);

  function handleSave() {
    const amt = parseInt(amount.replace(/,/g, ""), 10);
    if (!amt || amt <= 0) return;
    if (!categoryId) return;
    if (!accountId) return;

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
    onSaved();
  }

  function handleAmountInput(val: string) {
    // 数字のみ受け付け
    const clean = val.replace(/[^0-9]/g, "");
    setAmount(clean ? Number(clean).toLocaleString() : "");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end max-w-md mx-auto">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* フォーム */}
      <div className="relative bg-white rounded-t-3xl px-4 pb-8 pt-4 shadow-xl">
        {/* ハンドル */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* 収入/支出切り替え */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => { setType("expense"); setCategoryId(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              type === "expense" ? "bg-white shadow text-red-500" : "text-gray-400"
            }`}
          >
            支出
          </button>
          <button
            onClick={() => { setType("income"); setCategoryId(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              type === "income" ? "bg-white shadow text-green-600" : "text-gray-400"
            }`}
          >
            収入
          </button>
        </div>

        {/* 金額 */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium">金額</label>
          <div className="flex items-center border-b-2 border-blue-500 mt-1 pb-1">
            <span className="text-2xl text-gray-400 mr-2">¥</span>
            <input
              type="tel"
              inputMode="numeric"
              value={amount}
              onChange={e => handleAmountInput(e.target.value)}
              placeholder="0"
              autoFocus
              className="flex-1 text-3xl font-bold text-gray-900 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* カテゴリ */}
        <div className="mb-4">
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

        {/* 口座 */}
        <div className="mb-4">
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
        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium">日付</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* メモ */}
        <div className="mb-5">
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
          disabled={!amount || !categoryId || !accountId}
          className="w-full py-4 rounded-2xl bg-blue-600 active:bg-blue-700 text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          保存する
        </button>
      </div>
    </div>
  );
}
