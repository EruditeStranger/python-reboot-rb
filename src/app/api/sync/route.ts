import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

function key(syncCode: string) {
  return `progress:${syncCode.toLowerCase().trim()}`;
}

// GET /api/sync?code=abc123 — load progress
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const data = await redis.get(key(code));
  if (!data) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, data });
}

// POST /api/sync — save progress
export async function POST(req: NextRequest) {
  const { code, data } = await req.json();
  if (!code || !data) return NextResponse.json({ error: "Missing code or data" }, { status: 400 });

  await redis.set(key(code), data);
  return NextResponse.json({ ok: true });
}
