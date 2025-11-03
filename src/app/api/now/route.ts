// app/api/now/route.ts
import { NextResponse } from "next/server";
import { getOpenMeteo, getNwsAlerts } from "@/lib/fetchers";
import { toHours, scoreRun, scoreWalk, bestFiveHours, slotLabel1h  } from "@/lib/scoring";

function nowHourStringInTZ(tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  const h = parts.find(p => p.type === "hour")!.value;
  return `${y}-${m}-${d}T${h}:00`;
}

export async function GET() {
  const lat = process.env.LAT!;
  const lon = process.env.LON!;
  const tz  = process.env.TIMEZONE!;

  const meteo = await getOpenMeteo(lat, lon, tz);

  // 현재 인덱스
  const hoursStr: string[] = meteo.hourly.time;
  const nowStr = nowHourStringInTZ(tz);
  let idx = hoursStr.indexOf(nowStr);
  if (idx === -1) {
    idx = hoursStr.findIndex(t => t > nowStr);
    if (idx === -1) idx = hoursStr.length - 1;
  }

  // 현재값 (current 있으면 우선)
  const cur = meteo.current ?? {};
  const current = {
    time: nowStr,
    temp: cur.temperature_2m ?? meteo.hourly.temperature_2m[idx],
    appTemp: cur.apparent_temperature ?? meteo.hourly.apparent_temperature[idx],
    wind: cur.wind_speed_10m ?? meteo.hourly.wind_speed_10m[idx],
    precipProb: meteo.hourly.precipitation_probability[idx],
    precip: cur.precipitation ?? meteo.hourly.precipitation[idx],
    uv: cur.uv_index ?? meteo.hourly.uv_index[idx],
    units: { temp: "°C", wind: "m/s", precip: "mm" },
  };

  // 시간 배열 → 점수 → 1시간 창 Top5
  const hours = toHours(meteo);

  // 도우미: 특정 "HH"의 Hour 찾기
function findHour(hours: any[], hourHH: string) {
  return hours.find(h => h.ts.split("T")[1].slice(0,2) === hourHH);
}
  const runSlots = bestFiveHours(hours, scoreRun, idx);
const walkSlots = bestFiveHours(hours, scoreWalk, idx);

const runTop = runSlots.map(s => {
  const h = findHour(hours, s.hour) || {};
  return { label: `${s.hour}시`, hour: s.hour, score: Math.round(s.score), ppop: h.ppop ?? null, precip: h.precip ?? null };
});
const walkTop = walkSlots.map(s => {
  const h = findHour(hours, s.hour) || {};
  return { label: `${s.hour}시`, hour: s.hour, score: Math.round(s.score), ppop: h.ppop ?? null, precip: h.precip ?? null };
});
 // UV 피크(다음 24h 중 최대)
  const endIndex = Math.min(hours.length, idx + 24);
  let uvMax = -1, uvAt = "";
  for (let i = idx; i < endIndex; i++) {
    if (hours[i].uv > uvMax) { uvMax = hours[i].uv; uvAt = hours[i].ts; }
  }
  const uvPeak = uvMax >= 0 ? { time: uvAt.split("T")[1], uv: uvMax } : null;

  // Alerts
  const alertsData = await getNwsAlerts(lat, lon);
  const alerts = alertsData.features?.map((f: any) => f.properties?.headline).filter(Boolean) ?? [];

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    current,
    runTop,
    walkTop,
    uvPeak,
    alerts,
    hours, // 있어도 되고, 없어도 OK (이제 매칭 불필요)
  });
}
