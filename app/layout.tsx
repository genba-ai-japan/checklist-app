import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "2026年度 業務ダッシュボード",
  description: "年間計画・目標管理・ルーティン・改善台帳ダッシュボード",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-gray-50">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
