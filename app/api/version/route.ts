import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? "" });
}
