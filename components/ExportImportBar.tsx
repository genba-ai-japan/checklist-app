"use client";

import { useRef, useState } from "react";

interface Props {
  onExport: () => void;
  onImport: (text: string) => { count: number; errors: string[] };
  onImported?: () => void;
}

export default function ExportImportBar({ onExport, onImport, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ count: number; errors: string[] } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const r = onImport(text);
      setResult(r);
      if (r.errors.length === 0) onImported?.();
      setTimeout(() => setResult(null), 4000);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg active:bg-gray-200"
        >
          📤 書き出し
        </button>
        <button
          onClick={() => { setResult(null); fileRef.current?.click(); }}
          className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg active:bg-gray-200"
        >
          📥 取り込み
        </button>
        <span className="text-[10px] text-gray-400">書き出し: HTMLドキュメント　取り込み: CSV</span>
      </div>
      <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      {result && (
        <div className={`mt-1.5 rounded-lg px-3 py-1.5 text-xs ${result.errors.length > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700 font-medium"}`}>
          {result.errors.length > 0 ? result.errors.join(" / ") : `✅ ${result.count}件取り込みました`}
        </div>
      )}
    </div>
  );
}
