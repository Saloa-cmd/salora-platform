import { NextResponse } from "next/server";
import { getPublishedExperienceConfiguration } from "@/lib/server/experienceConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const configuration = await getPublishedExperienceConfiguration();
  return NextResponse.json({ data: configuration }, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
