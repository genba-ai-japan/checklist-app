"use client";

import { useState } from "react";
import {
  getCategories, saveCategories,
  getAccounts, saveAccounts,
  getTransactions,
  isInitialized,
} from "@/lib/storage";
import { initSampleData } from "@/lib/sampleData";
import { formatCurrency, generateId, ACCOUNT_TYPE_LABELS } from "@/lib/utils";
import { Category, Account, TransactionType, AccountType } from "@/types";

interface Props {
  onDataChange: () => void;
  onShowGuide: () => void;
}

type SettingTab = "category" | "account" | "data";

export default function SettingsScreen({ onDataChange, onShowGuide }: Props) {
  const [tab, setTab] = useState<SettingTab>("account");

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">設定</h1>

      {/* タブ切り替え */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {[
          { id: "account" as const, label: "口座" },
          { id: "category" as const, label: "カテゴリ" },
          { id: "data" as const, label: "データ" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? "bg-white shadow text-blue-600" : "text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "account" && <AccountSettings onDataChange={onDataChange} />}
      {tab === "category" && <CategorySettings onDataChange={onDataChange} />}
      {tab === "data" && <DataSettings onDataChange={onDataChange} />}
    </div>
  );
}

// ----------- 口座管理 -----------
function AccountSettings({ onDataChange }: { onDataChange: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>(() => getAccounts());
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState("#2196F3");

  function openNew() {
    setEditId(null);
    setName(""); setType("bank"); setBalance(""); setColor("#2196F3");
    setShowForm(true);
  }
  function openEdit(acc: Account) {
    setEditId(acc.id);
    setName(acc.name); setType(acc.type);
    setBalance(String(acc.balance)); setColor(acc.color);
    setShowForm(true);
  }
  function handleSave() {
    const bal = Number(balance);
    if (!name.trim()) return;
    const updated = editId
      ? accounts.map(a => a.id === editId ? { ...a, name, type, balance: bal, color } : a)
      : [...accounts, { id: generateId(), name, type, balance: bal, color, sortOrder: accounts.length }];
    setAccounts(updated);
    saveAccounts(updated);
    onDataChange();
    setShowForm(false);
  }
  function handleDelete(id: string) {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    saveAccounts(updated);
    onDataChange();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">口座・資産の管理</p>
        <button onClick={openNew} className="text-sm text-blue-600 font-semibold">+ 追加</button>
      </div>

      {showForm && (
        <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500">口座名</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="例：三菱UFJ銀行"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500">種類</label>
            <select value={type} onChange={e => setType(e.target.value as AccountType)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">残高</label>
            <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
              {editId ? "更新" : "追加"}
            </button>
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold">
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
        {accounts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">口座がありません</p>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="flex items-center px-4 py-3 gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: acc.color }}>
                {acc.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{acc.name}</p>
                <p className="text-xs text-gray-400">{ACCOUNT_TYPE_LABELS[acc.type]}</p>
              </div>
              <p className={`text-sm font-bold mr-2 ${acc.balance < 0 ? "text-red-500" : "text-gray-800"}`}>
                {formatCurrency(acc.balance)}
              </p>
              <button onClick={() => openEdit(acc)} className="text-xs text-blue-500 mr-1">編集</button>
              <button onClick={() => handleDelete(acc.id)} className="text-xs text-red-400">削除</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ----------- カテゴリ管理 -----------
function CategorySettings({ onDataChange }: { onDataChange: () => void }) {
  const [categories, setCategories] = useState<Category[]>(() => getCategories());
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TransactionType>("expense");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");

  function handleAdd() {
    if (!name.trim()) return;
    const newCat: Category = {
      id: generateId(),
      name, type: typeFilter, icon,
      sortOrder: categories.filter(c => c.type === typeFilter).length,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategories(updated);
    onDataChange();
    setName(""); setIcon("📦");
    setShowForm(false);
  }
  function handleDelete(id: string) {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    saveCategories(updated);
    onDataChange();
  }

  const filtered = categories.filter(c => c.type === typeFilter);

  return (
    <div className="space-y-3">
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button onClick={() => setTypeFilter("expense")}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${typeFilter === "expense" ? "bg-white shadow text-red-500" : "text-gray-400"}`}>
          支出
        </button>
        <button onClick={() => setTypeFilter("income")}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${typeFilter === "income" ? "bg-white shadow text-green-600" : "text-gray-400"}`}>
          収入
        </button>
      </div>

      {showForm ? (
        <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="絵文字"
              className="w-14 px-2 py-2 border border-gray-200 rounded-xl text-center text-lg bg-white" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="カテゴリ名"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">追加</button>
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold">キャンセル</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 active:bg-gray-50">
          + カテゴリを追加
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">カテゴリがありません</p>
        ) : (
          filtered.map(cat => (
            <div key={cat.id} className="flex items-center px-4 py-3 gap-3">
              <span className="text-xl">{cat.icon}</span>
              <p className="flex-1 text-sm font-medium text-gray-800">{cat.name}</p>
              <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-400">削除</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ----------- データ管理 -----------
function DataSettings({ onDataChange }: { onDataChange: () => void }) {
  const [confirmed, setConfirmed] = useState(false);

  function handleReset() {
    if (!confirmed) { setConfirmed(true); return; }
    initSampleData();
    onDataChange();
    setConfirmed(false);
    alert("データをリセットしました。");
  }

  function handleExportCSV() {
    const transactions = getTransactions();
    const categories = getCategories();
    const accounts = getAccounts();

    const rows = [
      ["日付", "種別", "金額", "カテゴリ", "口座", "メモ"],
      ...transactions.map(t => [
        t.date,
        t.type === "income" ? "収入" : "支出",
        t.amount,
        categories.find(c => c.id === t.categoryId)?.name ?? "",
        accounts.find(a => a.id === t.accountId)?.name ?? "",
        t.memo,
      ]),
    ];

    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanemiru_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
        <button onClick={handleExportCSV}
          className="w-full flex items-center justify-between px-4 py-4 active:bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-xl">📤</span>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">CSVエクスポート</p>
              <p className="text-xs text-gray-400">全収支データをCSV形式で書き出す</p>
            </div>
          </div>
          <span className="text-gray-300">›</span>
        </button>

        <button
          onClick={handleReset}
          className={`w-full flex items-center justify-between px-4 py-4 active:bg-gray-50 ${confirmed ? "bg-red-50" : ""}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔄</span>
            <div className="text-left">
              <p className={`text-sm font-medium ${confirmed ? "text-red-600" : "text-gray-800"}`}>
                {confirmed ? "本当にリセットしますか？（もう一度タップ）" : "サンプルデータにリセット"}
              </p>
              <p className="text-xs text-gray-400">全データを削除してサンプルデータを再投入</p>
            </div>
          </div>
          <span className="text-gray-300">›</span>
        </button>
      </div>

      {/* 使い方ガイド */}
      <button
        onClick={onShowGuide}
        className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-4 shadow-sm active:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📖</span>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-800">使い方ガイド</p>
            <p className="text-xs text-gray-400">マネミルの基本的な使い方を確認する</p>
          </div>
        </div>
        <span className="text-gray-300">›</span>
      </button>

      <div className="bg-gray-100 rounded-2xl p-4">
        <p className="text-xs text-gray-500 font-semibold mb-1">マネミル について</p>
        <p className="text-xs text-gray-400">毎日の支出をサッと記録。純資産の成長を実感できる家計簿アプリ。</p>
        <p className="text-xs text-gray-300 mt-1">データはすべて端末内に保存されます。</p>
      </div>
    </div>
  );
}
