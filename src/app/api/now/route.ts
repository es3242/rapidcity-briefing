// app/api/now/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Day 1: 더미 응답 (Day 2~부터 실제 데이터)
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    runTop: ["07-09", "18-20"],
    walkTop: ["17-19", "10-12"],
    rainNext2h: "08:30 약한 소나기 가능",
    uvPeak: "12-14 높음",
    alerts: [],
  });
}
