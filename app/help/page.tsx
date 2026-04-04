"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  exportGoals, importGoals,
  exportImprovements, importImprovements,
  exportRoutine, importRoutine,
  exportGantt, importGantt,
} from "@/lib/export-import";

type ImportResult = { count: number; errors: string[] } | null;

export default function HelpPage() {
  const [importResult, setImportResult] = useState<ImportResult>(null);
  const [importType, setImportType] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<((text: string) => ImportResult) | null>(null);

  function triggerImport(type: string, fn: (text: string) => ImportResult) {
    setImportType(type);
    setPendingImport(() => fn);
    setImportResult(null);
    fileRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !pendingImport) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = pendingImport(text);
      setImportResult(result);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-gray-800 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 text-sm">← ホーム</Link>
          <h1 className="text-xl font-bold flex-1">❓ ヘルプ・データ管理</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-5 max-w-xl mx-auto">

        {/* データ書き出し */}
        <Section title="📤 データを書き出す（エクスポート）">
          <p className="text-sm text-gray-600 mb-3">各データをCSVファイルとしてダウンロードします。Excelやスプレッドシートで開けます。</p>
          <div className="space-y-2">
            {[
              { label: "🎯 目標管理", fn: exportGoals },
              { label: "💡 改善台帳", fn: exportImprovements },
              { label: "✅ ルーティン", fn: exportRoutine },
              { label: "📅 ガントチャート", fn: exportGantt },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-800 active:bg-gray-50 flex items-center justify-between">
                {label}
                <span className="text-gray-400 text-xs">CSVダウンロード →</span>
              </button>
            ))}
          </div>
        </Section>

        {/* データ取り込み */}
        <Section title="📥 データを取り込む（インポート）">
          <p className="text-sm text-gray-600 mb-3">書き出したCSVを編集後、取り込むことができます。<strong>同じ内容は上書き更新、新しいものは追加</strong>されます。</p>
          <div className="space-y-2">
            {[
              { label: "🎯 目標管理", type: "goals", fn: (t: string) => importGoals(t) },
              { label: "💡 改善台帳", type: "improvements", fn: (t: string) => importImprovements(t) },
              { label: "✅ ルーティン", type: "routine", fn: (t: string) => importRoutine(t) },
              { label: "📅 ガントチャート", type: "gantt", fn: (t: string) => importGantt(t) },
            ].map(({ label, type, fn }) => (
              <button key={type} onClick={() => triggerImport(type, fn)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-800 active:bg-gray-50 flex items-center justify-between">
                {label}
                <span className="text-gray-400 text-xs">CSVを選択 →</span>
              </button>
            ))}
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          {importResult && (
            <div className={`mt-3 rounded-xl p-3 ${importResult.errors.length > 0 ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
              {importResult.errors.length > 0 ? (
                <>
                  <p className="text-sm font-bold text-red-700">取り込みエラー</p>
                  {importResult.errors.map((e, i) => <p key={i} className="text-xs text-red-600 mt-1">{e}</p>)}
                </>
              ) : (
                <p className="text-sm font-bold text-green-700">✅ {importType} を {importResult.count} 件取り込みました</p>
              )}
            </div>
          )}
        </Section>

        {/* 書き出し・取り込みの注意点 */}
        <Section title="⚠️ 書き出し・取り込みの注意点">
          <div className="space-y-3 text-sm text-gray-700">
            <NoteItem icon="📄" title="文字コードはUTF-8（BOM付き）">
              ExcelはUTF-8 BOM付きで正しく表示されます。Googleスプレッドシートも同様です。文字化けした場合は「UTF-8」で開き直してください。
            </NoteItem>
            <NoteItem icon="🔄" title="同じ内容は上書き、新規は追加">
              取り込み時、目標なら「目標・施策」、改善台帳なら「改善内容」が一致する行は上書き更新されます。一致しない行は新規追加されます。
            </NoteItem>
            <NoteItem icon="🚫" title="列ヘッダーは変更しないでください">
              CSVの1行目（列名）を変更すると正しく取り込めません。セルの内容だけ編集してください。
            </NoteItem>
            <NoteItem icon="💾" title="取り込み前にバックアップを">
              取り込みは上書き処理のため、必ず先にエクスポートでバックアップを取ってから実行してください。
            </NoteItem>
            <NoteItem icon="🗑️" title="削除はアプリ内で行う">
              CSVから行を削除してインポートしても、アプリのデータは削除されません。削除はアプリ内の削除ボタンから行ってください。
            </NoteItem>
            <NoteItem icon="📊" title="Excelでの注意">
              Excelで保存するときは「CSV UTF-8（コンマ区切り）」を選択してください。「CSV（コンマ区切り）」（SJIS）では文字化けします。
            </NoteItem>
            <NoteItem icon="🌐" title="Googleスプレッドシートの場合">
              ファイル → ダウンロード → 「カンマ区切りの値（.csv）」でダウンロードしてください。
            </NoteItem>
          </div>
        </Section>

        {/* アカウントについて */}
        <Section title="👤 アカウントについて">
          <div className="space-y-3 text-sm text-gray-700">
            <NoteItem icon="🔐" title="PINは4桁の数字">
              初回はデフォルトPIN「1234」でログインできます。ログイン後、ホーム画面右上の⚙️から変更してください。
            </NoteItem>
            <NoteItem icon="🕐" title="セッションは12時間">
              ログイン状態はブラウザを開いている間（最大12時間）維持されます。ブラウザを閉じると次回ログインが必要です。
            </NoteItem>
            <NoteItem icon="👥" title="複数アカウント対応">
              異なるメンバーが同じ端末を使う場合、アカウントを切り替えてそれぞれのデータを管理できます。
            </NoteItem>
            <NoteItem icon="📱" title="データはこの端末に保存">
              データはこの端末のブラウザ（localStorage）に保存されます。他の端末と同期するには、CSVの書き出し・取り込みを使ってください。
            </NoteItem>
          </div>
        </Section>

        {/* アプリの使い方 */}
        <Section title="📱 アプリの使い方">
          <div className="space-y-3 text-sm text-gray-700">
            {[
              { icon: "🏠", label: "ホーム", desc: "全セクションのサマリー。今日のルーティンや進行中の目標を確認できます。右上⚙️から設定・ログアウト。" },
              { icon: "📅", label: "年間", desc: "2026年度のガントチャート。横スクロールでタスクバーを確認。リスト部分をタップして編集できます。" },
              { icon: "🎯", label: "目標", desc: "16件の年間目標を管理。カテゴリフィルター・ステータス変更・追加・編集・削除が可能です。" },
              { icon: "✅", label: "チェック", desc: "今月のルーティンチェックリスト。各項目をタップで完了／未完了を切り替えます。" },
              { icon: "💡", label: "改善", desc: "改善台帳。年間50件目標の進捗を管理。追加・編集・ステータス変更・削除ができます。" },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex gap-3">
                <span className="text-xl shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-gray-800">{label}</p>
                  <p className="text-gray-600 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* バージョン */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">業務ダッシュボード v1.1.0</p>
          <p className="text-xs text-gray-300 mt-1">2026年度版</p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function NoteItem({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="font-medium text-gray-800">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{children}</p>
      </div>
    </div>
  );
}
