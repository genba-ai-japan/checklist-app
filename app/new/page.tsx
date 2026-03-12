"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createRecord } from "@/lib/storage";

type FormData = {
  productName: string;
  contentVolume: string;
  packType: string;
  machineNumber: string;
  settingsMemo: string;
  photoUrl: string;
};

const initialForm: FormData = {
  productName: "",
  contentVolume: "",
  packType: "",
  machineNumber: "",
  settingsMemo: "",
  photoUrl: "",
};

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました"));
    };
    img.src = objectUrl;
  });
}

export default function NewPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    setCompressing(true);
    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      set("photoUrl", dataUrl);
    } catch {
      setPhotoError("写真の読み込みに失敗しました。別の写真をお試しください。");
    } finally {
      setCompressing(false);
    }
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!form.productName.trim()) newErrors.productName = "製品名は必須です";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSaveError("");
    try {
      const record = await createRecord(form);
      router.push(`/item/${record.id}`);
    } catch {
      setSaveError("登録に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center px-4 py-3 gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-500 active:bg-gray-100 rounded-xl"
          >
            ‹ 戻る
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">新規登録</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-4 py-4 pb-32 space-y-4">

        {/* 写真 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 mb-3">📷 写真</h2>
          <div
            onClick={() => !compressing && fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer active:bg-gray-50 flex items-center justify-center min-h-40"
          >
            {compressing ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">圧縮中...</p>
              </div>
            ) : preview ? (
              <Image
                src={preview}
                alt="プレビュー"
                width={400}
                height={300}
                className="object-contain max-h-60 w-full"
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-5xl mb-2">📸</p>
                <p className="text-gray-400 text-sm">タップして写真を選択・撮影</p>
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
          {photoError && <p className="mt-2 text-xs text-red-500">{photoError}</p>}
          {preview && !compressing && (
            <button
              type="button"
              onClick={() => { setPreview(""); set("photoUrl", ""); setPhotoError(""); }}
              className="mt-2 text-xs text-red-500 underline"
            >
              写真を削除
            </button>
          )}
        </section>

        {/* 入力フォーム */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-500">📋 基本情報</h2>

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

          <Field label="機械番号">
            <input
              type="text"
              value={form.machineNumber}
              onChange={(e) => set("machineNumber", e.target.value)}
              placeholder="例：A-1"
              className={inputClass(false)}
            />
          </Field>

          <Field label="設定値メモ">
            <textarea
              value={form.settingsMemo}
              onChange={(e) => set("settingsMemo", e.target.value)}
              placeholder="例：シール温度180℃、充填速度30個/分"
              rows={4}
              className={inputClass(false)}
            />
          </Field>
        </section>
      </form>

      {/* 登録ボタン（固定） */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
        {saveError && (
          <p className="text-center text-sm text-red-500 mb-2">{saveError}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving || compressing}
          className="w-full bg-blue-600 active:bg-blue-800 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-lg shadow-lg"
        >
          {saving ? "保存中..." : "✓ 登録する"}
        </button>
      </div>
    </div>
  );
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
  return `w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${
    hasError ? "border-red-300 bg-red-50" : "border-gray-200"
  }`;
}
