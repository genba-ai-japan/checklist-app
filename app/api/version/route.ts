export const dynamic = "force-dynamic";

export function GET() {
  // VERCEL_DEPLOYMENT_ID はデプロイごとに Vercel が自動設定する
  const version =
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ??
    "development";

  return Response.json({ version });
}
