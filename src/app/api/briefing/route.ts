// app/api/briefing/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    title: "Rapid City 오늘 아웃도어 브리핑",
    updatedLocal: new Date().toLocaleString("en-US", { timeZone: "America/Denver" }),
    lines: [
      "🏃 러닝: ① 07–09 ② 18–20",
      "🚶 산책: ① 17–19 ② 10–12",
      "☔ 다음 2시간: 08:30 소나기 가능 → 우산 권장",
      "🌞 UV: 12–14 ‘높음’",
      "🚨 경보: (없음)",
    ],
  });
}
