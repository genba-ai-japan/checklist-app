import { NextResponse } from "next/server";
import { getLastModified } from "@/lib/serverStorage";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ lastModified: getLastModified() });
}
