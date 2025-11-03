import { NextResponse } from "next/server";
import { getOpenMeteo, getNwsAlerts } from "@/lib/fetchers";
import { toHours, scoreRun, scoreWalk, bestFiveHours, slotLabel1h } from "@/lib/scoring";
import { localMorningHourISO, localNowISO } from "@/lib/time";
import { makeRainSummary } from "@/lib/summary";
import { makeBriefText } from "@/lib/formatters";

// 덴버 로컬이 정확히 "06:30" 근처인지 검사 (크론은 0/30분마다 호출)
function isMorningSnapshotNow(tz: string) {
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date());
  const hh = nowParts.find(p => p.type === "hour")!.value;
  const mm = nowParts.find(p => p.type === "minute")!.value;
  return hh === "06" && (mm === "30" || mm === "31" || mm === "29"); // ±1분 허용
}

function indexFor(hours: string[], target: string) {
  let idx = hours.indexOf(target);
  if (idx === -1) {
    idx = hours.findIndex(t => t > target);
    if (idx === -1) idx = hours.length - 1;
  }
  return idx;
}

export async function GET() {
  const lat = process.env.LAT!; const lon = process.env.LON!; const tz = process.env.TIMEZONE!;
  const meteo = await getOpenMeteo(lat, lon, tz);

  // 06:00 기준 스냅샷을 만든다
  const basis = localMorningHourISO(tz, 6);
  const idx = indexFor(meteo.hourly.time, basis);
  const hours = toHours(meteo);

  const run5  = bestFiveHours(hours, scoreRun,  idx);
  const walk5 = bestFiveHours(hours, scoreWalk, idx);
  const runTop  = run5.map(s => ({ label: slotLabel1h(s), score: Math.round(s.score) }));
  const walkTop = walk5.map(s => ({ label: slotLabel1h(s), score: Math.round(s.score) }));

  // UV 피크
  const end = Math.min(hours.length, idx + 24);
  let uvMax = -1, uvAt = "";
  for (let i = idx; i < end; i++) if (hours[i].uv > uvMax) { uvMax = hours[i].uv; uvAt = hours[i].ts; }
  const uvPeak = uvMax >= 0 ? { time: uvAt.split("T")[1], uv: uvMax } : null;

  const rainSummary = makeRainSummary(hours, idx);
  const alertsData = await getNwsAlerts(lat, lon);
  const alerts = alertsData.features?.map((f: any) => f.properties?.headline).filter(Boolean) ?? [];
  const generatedAtLocal = localNowISO(tz);

  const snsText = makeBriefText({
    city: "Rapid City", generatedAtLocal,
    runTop, walkTop, uvPeak, rainSummary, alerts
  });

  // 👉 여기서 DB/시트에 저장하거나, 웹훅 호출로 외부에 전달해도 됨 (MVP는 반환만)
  const payload = {
    ok: true,
    reason: isMorningSnapshotNow(tz) ? "snapshot" : "manual/test",
    generatedAtLocal, basisHour: basis,
    runTop, walkTop, uvPeak, rainSummary, alerts, snsText
  };

  // ✅ 06:30 근처 + WEBHOOK_URL 있을 때만 전송 (리턴 전에!)
  const url = process.env.WEBHOOK_URL;
  if (url && payload.reason === "snapshot") {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: payload.snsText }),
        // (슬랙/텔레그램 등 서비스에 맞게 payload 구조를 바꿔주세요)
      });
    } catch (e) {
      console.error("Webhook send failed:", e);
    }
  }
  
  return NextResponse.json(payload);
  
}
