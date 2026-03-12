"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createRecord } from "@/lib/storage";
import { MachineRecord } from "@/types";

type FormData = Omit<MachineRecord, "id" | "registeredAt">;

const initialForm: FormData = {
  productName: "",
  contentVolume: "",
  packType: "",
  machineName: "",
  lineName: "",
  photoUrl: "",
  sealTemp: "",
  fillTemp: "",
  speed: "",
  printSettings: "",
  otherSettings: "",
  notes: "",
  remarks: "",
  registeredBy: "",
};

export default function NewPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [preview, setPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  // 写真選択（Base64でローカル保存）
  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
      set("photoUrl", dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!form.productName.trim()) newErrors.productName = "製品名は必須です";
    if (!form.machineName.trim()) newErrors.machineName = "機械名は必須です";
    if (!form.registeredBy.trim()) newErrors.registeredBy = "登録者は必須です";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const record = await createRecord(form);
      router.push(`/item/${record.id}`);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center px-4 py-3 gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl text-gray-500 active:bg-gray-100"
          >
            ‹ 戻る
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">新規登録</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-4 py-4 pb-32 space-y-4">

        {/* 写真 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <SectionTitle>📷 写真</SectionTitle>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer active:bg-gray-50 flex flex-col items-center justify-center min-h-40"
          >
            {preview ? (
              <Image src={preview} alt="プレビュー" width={400} height={300} className="object-contain max-h-60 w-full" />
            ) : (
              <div className="text-center py-8">
                <p className="text-5xl mb-2">📸</p>
                <p className="text-gray-400 text-sm">タップして写真を選択</p>
                <p className="text-gray-300 text-xs mt-1">機械の設定画面を撮影してください</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />
          {preview && (
            <button
              type="button"
              onClick={() => { setPreview(""); set("photoUrl", ""); }}
              className="mt-2 text-xs text-red-500 underline"
            >
              写真を削除
            </button>
          )}
        </section>

        {/* 基本情報 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <SectionTitle>📦 基本情報</SectionTitle>
          <Field label="製品名" required error={errors.productName}>
            <input
              type="text"
              value={form.productName}
              onChange={(e) => set("productName", e.target.value)}
              placeholder="例：豆腐ハンバーグ"
              className={inputClass(!!errors.productName)}
            />
          </Field>
          <Field label="内容量">
            <input
              type="text"
              value={form.contentVolume}
              onChange={(e) => set("contentVolume", e.target.value)}
              placeholder="例：150g"
              className={inputClass(false)}
            />
          </Field>
          <Field label="パック形態">
            <select
              value={form.packType}
              onChange={(e) => set("packType", e.target.value)}
              className={inputClass(false)}
            >
              <option value="">選択してください</option>
              <option>トレーパック</option>
              <option>袋詰め</option>
              <option>弁当容器</option>
              <option>カップ</option>
              <option>その他</option>
            </select>
          </Field>
          <Field label="機械名" required error={errors.machineName}>
            <input
              type="text"
              value={form.machineName}
              onChange={(e) => set("machineName", e.target.value)}
              placeholder="例：充填機A-1"
              className={inputClass(!!errors.machineName)}
            />
          </Field>
          <Field label="ライン名">
            <input
              type="text"
              value={form.lineName}
              onChange={(e) => set("lineName", e.target.value)}
              placeholder="例：1号ライン"
              className={inputClass(false)}
            />
          </Field>
        </section>

        {/* 設定値 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <SectionTitle>⚙️ 設定値</SectionTitle>
          <Field label="シール温度">
            <input
              type="text"
              value={form.sealTemp}
              onChange={(e) => set("sealTemp", e.target.value)}
              placeholder="例：180℃"
              className={inputClass(false)}
            />
          </Field>
          <Field label="充填温度">
            <input
              type="text"
              value={form.fillTemp}
              onChange={(e) => set("fillTemp", e.target.value)}
              placeholder="例：65℃"
              className={inputClass(false)}
            />
          </Field>
          <Field label="スピード">
            <input
              type="text"
              value={form.speed}
              onChange={(e) => set("speed", e.target.value)}
              placeholder="例：30個/分"
              className={inputClass(false)}
            />
          </Field>
          <Field label="印字設定">
            <textarea
              value={form.printSettings}
              onChange={(e) => set("printSettings", e.target.value)}
              placeholder="例：賞味期限3日後・ロットNo.自動"
              rows={2}
              className={inputClass(false)}
            />
          </Field>
          <Field label="その他設定値">
            <textarea
              value={form.otherSettings}
              onChange={(e) => set("otherSettings", e.target.value)}
              placeholder="例：窒素ガス充填 70%"
              rows={2}
              className={inputClass(false)}
            />
          </Field>
        </section>

        {/* 注意・備考 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <SectionTitle>📝 注意点・備考</SectionTitle>
          <Field label="注意点">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="作業時の注意点"
              rows={3}
              className={inputClass(false)}
            />
          </Field>
          <Field label="備考">
            <textarea
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="その他メモ"
              rows={2}
              className={inputClass(false)}
            />
          </Field>
          <Field label="登録者" required error={errors.registeredBy}>
            <input
              type="text"
              value={form.registeredBy}
              onChange={(e) => set("registeredBy", e.target.value)}
              placeholder="例：田中 一郎"
              className={inputClass(!!errors.registeredBy)}
            />
          </Field>
        </section>
      </form>

      {/* 登録ボタン（固定） */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transition-colors"
        >
          {saving ? "登録中..." : "✓ 登録する"}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{children}</h2>;
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${
    hasError ? "border-red-300 bg-red-50" : "border-gray-200"
  }`;
}
