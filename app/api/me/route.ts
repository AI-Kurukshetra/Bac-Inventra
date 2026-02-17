import { NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ data: { role: auth.role, userId: auth.userId } });
}
