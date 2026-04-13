"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/gantt", label: "年間", icon: "📅" },
  { href: "/goals", label: "目標", icon: "🎯" },
  { href: "/routine", label: "チェック", icon: "✅" },
  { href: "/improvements", label: "改善", icon: "💡" },
  { href: "/mindmap", label: "マップ", icon: "🗺️" },
];

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
const STORAGE_KEY = "dismissed_build_id";

export default function BottomNav() {
  const pathname = usePathname();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prev = localStorage.getItem(STORAGE_KEY);
    if (prev !== null && prev !== BUILD_ID) {
      setHasUpdate(true);
      // slight delay so it slides in after page load
      setTimeout(() => setVisible(true), 800);
    } else {
      localStorage.setItem(STORAGE_KEY, BUILD_ID);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, BUILD_ID);
    setVisible(false);
    setTimeout(() => setHasUpdate(false), 300);
  }

  function reload() {
    localStorage.setItem(STORAGE_KEY, BUILD_ID);
    window.location.reload();
  }

  return (
    <>
      {/* アップデート通知トースト */}
      {hasUpdate && (
        <div
          className={`fixed bottom-16 left-3 right-3 z-50 transition-all duration-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
            <span className="text-xl shrink-0">🎉</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">アップデートがあります</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">リロードして最新版に更新</p>
            </div>
            <button
              onClick={reload}
              className="bg-lime-400 text-gray-900 font-bold text-xs px-3 py-1.5 rounded-xl shrink-0 active:opacity-70"
            >
              更新
            </button>
            <button onClick={dismiss} className="text-gray-400 text-lg leading-none p-1 shrink-0">✕</button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                  active ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <span className="text-xl leading-tight relative">
                  {icon}
                  {hasUpdate && href === "/" && (
                    <span className="absolute -top-0.5 -right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </span>
                <span className={`text-[10px] font-medium ${active ? "text-blue-600" : "text-gray-400"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
