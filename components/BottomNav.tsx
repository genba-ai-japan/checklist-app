"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/goals", label: "目標", icon: "🎯" },
  { href: "/routine", label: "チェック", icon: "✅" },
  { href: "/improvements", label: "改善", icon: "💡" },
  { href: "/records", label: "台帳", icon: "📷" },
];

const HIDE_NAV_PATHS = ["/new", "/item/"];

export default function BottomNav() {
  const pathname = usePathname();
  const hidden = HIDE_NAV_PATHS.some((p) => pathname.startsWith(p));
  if (hidden) return null;

  return (
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
              <span className="text-xl leading-tight">{icon}</span>
              <span className={`text-[10px] font-medium ${active ? "text-blue-600" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
