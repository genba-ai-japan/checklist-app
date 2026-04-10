import type { Metadata, Viewport } from "next";
import "./globals.css";
import UpdateBanner from "@/components/UpdateBanner";

export const metadata: Metadata = {
  title: "機械設定フォト台帳",
  description: "食品工場向け機械設定値フォト台帳アプリ",
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
      <body className="antialiased min-h-screen">
          <UpdateBanner />
          {children}
        </body>
    </html>
  );
}
