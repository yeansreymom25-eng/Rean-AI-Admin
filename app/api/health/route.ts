import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.BACKEND_INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL);
  return NextResponse.json({ status: configured ? "healthy" : "degraded", service: "rean-ai-admin", api_configured: configured });
}
