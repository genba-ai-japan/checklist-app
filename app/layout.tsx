import type { Metadata, Viewport } from "next";
import "./globals.css";
import UpdateBanner from "@/components/UpdateBanner";

export const metadata: Metadata = {
  title: "マイノート",
  description: "プライベート記録アプリ",
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
