import { NextResponse } from "next/server";
import { getOpenMeteo, getNwsAlerts } from "@/lib/fetchers";
import { toHours, scoreRun, scoreWalk, bestFiveHours, slotLabel1h } from "@/lib/scoring";
import { localNowISO, localMorningHourISO } from "@/lib/time";
import { makeRainSummary } from "@/lib/summary";
import { makeBriefText } from "@/lib/formatters";

function indexFor(hours: string[], target: string) {
  let idx = hours.indexOf(target);
  if (idx === -1) {
    idx = hours.findIndex(t => t > target);
    if (idx === -1) idx = hours.length - 1;
  }
  return idx;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  // ?hour=6 처럼 브리핑 기준 시간을 바꿔볼 수 있게 옵션 제공(기본 6시)
  const targetHour = parseInt(url.searchParams.get("hour") ?? "6", 10);

  const lat = process.env.LAT!;
  const lon = process.env.LON!;
  const tz  = process.env.TIMEZONE!;

  const meteo = await getOpenMeteo(lat, lon, tz);

  // 스냅샷 기준 시각(덴버 로컬 06:00 기본)
  const target = localMorningHourISO(tz, targetHour);
  const idx = indexFor(meteo.hourly.time, target);

  // 시간 배열 준비
  const hours = toHours(meteo);

  // Top5에서 SNS는 2개만 쓸 예정 (문구 간결성)
  const runTop5  = bestFiveHours(hours, scoreRun,  idx);
  const walkTop5 = bestFiveHours(hours, scoreWalk, idx);

  const runTop = runTop5.map(s => ({ label: slotLabel1h(s), score: s.score }));
  const walkTop = walkTop5.map(s => ({ label: slotLabel1h(s), score: s.score }));

  // UV 피크
  const end = Math.min(hours.length, idx + 24);
  let uvMax = -1, uvAt = "";
  for (let i = idx; i < end; i++) {
    if (hours[i].uv > uvMax) { uvMax = hours[i].uv; uvAt = hours[i].ts; }
  }
  const uvPeak = uvMax >= 0 ? { time: uvAt.split("T")[1], uv: uvMax } : null;

  // 강수 요약
  const rainSummary = makeRainSummary(hours, idx);

  // Alerts
  const alertsData = await getNwsAlerts(lat, lon);
  const alerts = alertsData.features?.map((f: any) => f.properties?.headline).filter(Boolean) ?? [];

  // 로컬 표기 시각
  const generatedAtLocal = localNowISO(tz);

  // SNS 텍스트
  const text = makeBriefText({
    city: "Rapid City",
    generatedAtLocal,
    runTop, walkTop, uvPeak, rainSummary, alerts
  });

  return NextResponse.json({
    generatedAtUTC: new Date().toISOString(),
    generatedAtLocal,
    basisHour: target,     // "YYYY-MM-DDTHH:00" (덴버 06:00 기준)
    runTop5: runTop5,      // 디버그/웹앱용
    walkTop5: walkTop5,    // 디버그/웹앱용
    uvPeak,
    rainSummary,
    alerts,
    snsText: text          // ✅ SNS에 바로 붙여넣을 문구
  });
}
