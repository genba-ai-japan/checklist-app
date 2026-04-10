import type { NextConfig } from "next";

const BUILD_TIME = new Date().toISOString();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIME: BUILD_TIME,
  },
  images: {
    // ローカルのBase64データURLを許可
    dangerouslyAllowSVG: false,
    remotePatterns: [],
    // 将来Supabaseに切り替える際はここにSupabaseのURLを追加
    // remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
};

export default nextConfig;
