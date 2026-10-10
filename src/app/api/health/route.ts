import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  let dbStatus = "disconnected";
  try {
    await db.$queryRaw`SELECT 1`;
    dbStatus = "healthy";
  } catch {
    dbStatus = "unreachable";
  }

  const aiMode = process.env.TYPESAFE_API_KEY && process.env.MOCK_JEV !== "true"
    ? "live-jev"
    : "local-mock";

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    aiMode,
    database: dbStatus,
  });
}
