import { NextRequest, NextResponse } from "next/server";
import {
  getImprovement,
  updateImprovement,
  deleteImprovement,
} from "@/lib/serverStorage";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  const { id } = await params;
  const item = getImprovement(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const data = await req.json();
  updateImprovement({ ...data, id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { id } = await params;
  deleteImprovement(id);
  return NextResponse.json({ ok: true });
}
