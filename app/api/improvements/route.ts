import { NextRequest, NextResponse } from "next/server";
import {
  getAllImprovements,
  getLastModified,
  createImprovement,
} from "@/lib/serverStorage";

export const dynamic = "force-dynamic";

export function GET() {
  const items = getAllImprovements();
  const lastModified = getLastModified();
  return NextResponse.json({ items, lastModified });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const item = createImprovement(data);
  return NextResponse.json(item, { status: 201 });
}
