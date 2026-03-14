"use client";

interface Props {
  onClose: () => void;
}

const STEPS = [
  {
    step: "01",
    title: "口座を登録する",
    desc: "設定 → 口座タブで、財布・銀行・クレジットカードなど実際に使っている口座を追加しましょう。残高も入力しておくと純資産が正確に表示されます。",
    icon: "💳",
    color: "bg-blue-50 border-blue-100",
    stepColor: "bg-blue-600",
  },
  {
    step: "02",
    title: "毎日の収支を記録する",
    desc: "ホーム右上の「＋」ボタンをタップして支出・収入を入力します。金額・カテゴリ・口座・日付を選んで保存するだけ。30秒で記録完了。",
    icon: "✏️",
    color: "bg-green-50 border-green-100",
    stepColor: "bg-green-600",
  },
  {
    step: "03",
    title: "カレンダーで確認する",
    desc: "カレンダータブで日付ごとの収支をひと目で確認できます。特定の日をタップすると、その日の取引一覧が表示されます。",
    icon: "📅",
    color: "bg-purple-50 border-purple-100",
    stepColor: "bg-purple-600",
  },
  {
    step: "04",
    title: "月末に分析で振り返る",
    desc: "分析タブでカテゴリ別の支出割合・月別収支の推移・純資産グラフを確認できます。投資シミュレーションで将来の資産予測も可能です。",
    icon: "📊",
    color: "bg-orange-50 border-orange-100",
    stepColor: "bg-orange-500",
  },
];

const TABS = [
  { icon: "🏠", name: "ホーム", desc: "今月の収支サマリーと純資産を一目で確認。最近の取引もここに表示されます。" },
  { icon: "💳", name: "資産", desc: "全口座の残高と資産構成グラフを表示。純資産 ＝ 総資産 − 総負債で計算されます。" },
  { icon: "📅", name: "カレンダー", desc: "月間カレンダーで日々の収支を俯瞰。日付をタップするとその日の詳細が見られます。" },
  { icon: "📊", name: "分析", desc: "カテゴリ別支出・月別推移・純資産トレンド・投資シミュレーションを一覧表示。" },
  { icon: "⚙️", name: "設定", desc: "口座・カテゴリの管理やCSVエクスポートができます。" },
];

const TIPS = [
  { icon: "💡", text: "支出は記録した直後に口座残高へ自動反映されます" },
  { icon: "📤", text: "設定 → データ からCSVでバックアップを取ると安心" },
  { icon: "📈", text: "投資口座を登録すると分析タブで将来シミュレーションが使えます" },
  { icon: "🔒", text: "全データはこの端末内にのみ保存されます（クラウド送信なし）" },
];

export default function GuideScreen({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-[#f2f2f7] max-w-md mx-auto flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-4 pt-safe flex items-center gap-3 py-4">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
        >
          ‹
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">使い方ガイド</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* ヒーロー */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white text-center shadow-md">
          <p className="text-4xl mb-2">💰</p>
          <h2 className="text-xl font-bold mb-1">マネミル</h2>
          <p className="text-sm text-blue-100 leading-relaxed">
            毎日の収支をサッと記録して<br />純資産の成長を実感できる家計簿アプリ
          </p>
        </div>

        {/* 基本ステップ */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">基本の使い方</h2>
          <div className="space-y-3">
            {STEPS.map(s => (
              <div key={s.step} className={`rounded-2xl border p-4 ${s.color}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${s.stepColor}`}>
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{s.icon}</span>
                      <p className="text-sm font-bold text-gray-800">{s.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* タブ別ガイド */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">各タブの説明</h2>
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
            {TABS.map(tab => (
              <div key={tab.name} className="flex items-start gap-3 px-4 py-3">
                <span className="text-2xl leading-none mt-0.5">{tab.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{tab.name}</p>
                  <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{tab.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 1ヶ月の流れ */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">1ヶ月の流れ</h2>
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            {[
              { timing: "月初", icon: "🗓️", action: "口座残高を確認・更新する" },
              { timing: "毎日", icon: "✏️", action: "支出・収入をその日のうちに記録" },
              { timing: "週1回", icon: "👀", action: "ホームで今月の収支バランスを確認" },
              { timing: "月末", icon: "📊", action: "分析タブで支出カテゴリを振り返る" },
              { timing: "随時", icon: "📤", action: "CSVエクスポートでデータをバックアップ" },
            ].map(item => (
              <div key={item.timing} className="flex items-center gap-3">
                <div className="w-12 text-center">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.timing}</span>
                </div>
                <span className="text-lg">{item.icon}</span>
                <p className="text-sm text-gray-700 flex-1">{item.action}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Tips</h2>
          <div className="space-y-2">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                <span className="text-lg flex-shrink-0">{tip.icon}</span>
                <p className="text-xs text-gray-600 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="pb-4" />
      </div>
    </div>
  );
}
