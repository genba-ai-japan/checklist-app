"use client";

import { TabName } from "@/app/page";

const TABS: { id: TabName; icon: string; label: string }[] = [
  { id: "home", icon: "🏠", label: "ホーム" },
  { id: "assets", icon: "💳", label: "資産" },
  { id: "calendar", icon: "📅", label: "カレンダー" },
  { id: "analytics", icon: "📊", label: "分析" },
  { id: "settings", icon: "⚙️", label: "設定" },
];

interface Props {
  active: TabName;
  onChange: (tab: TabName) => void;
  onAddPress: () => void;
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
              active === tab.id ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
