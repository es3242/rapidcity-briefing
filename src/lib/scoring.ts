// lib/scoring.ts
import { Hour } from "./types";

const clamp01 = (x: number) => Math.max(0, Math.min(100, x));

function tempBandScore(val: number, low: number, high: number, full = 35, slope = 3) {
  if (val >= low && val <= high) return full;
  const d = val < low ? (low - val) : (val - high);
  return Math.max(0, full - d * slope);
}

export function scoreRun(h: Hour) {
  let s = 0;
  // 체감온도 9~18°C 최적
  s += tempBandScore(h.app, 9, 18, 35, 3);

  // 바람 (m/s)
  if (h.wind >= 1 && h.wind <= 4) s += 20;
  else if (h.wind <= 7) s += 10;
  else s -= 15;

  // 습도
  if (h.rh >= 30 && h.rh <= 70) s += 10;
  else if (h.rh > 80) s -= 10;

  // 공통 패널티
  if (h.ppop > 30) s -= 25;
  if (h.precip > 0.5) s -= 20;
  if (h.app < -4 || h.app > 32) s -= 30;

  return clamp01(s);
}

export function scoreWalk(h: Hour) {
  let s = 0;
  // 체감온도 13~24°C
  s += tempBandScore(h.app, 13, 24, 30, 2.5);

  // 바람
  if (h.wind <= 9) s += 10; else s -= 15;

  // 구름 보너스
  if (h.cloud >= 20 && h.cloud <= 80) s += 5;

  // 공통 패널티
  if (h.ppop > 30) s -= 25;
  if (h.precip > 0.5) s -= 20;
  if (h.app < -4 || h.app > 32) s -= 30;

  return clamp01(s);
}

export function toHours(meteo: any): Hour[] {
  const t: string[] = meteo.hourly.time;
  const ap: number[] = meteo.hourly.apparent_temperature;
  const ws: number[] = meteo.hourly.wind_speed_10m;
  const pp: number[] = meteo.hourly.precipitation_probability;
  const pr: number[] = meteo.hourly.precipitation;
  const rh: number[] = meteo.hourly.relative_humidity_2m;
  const cc: number[] = meteo.hourly.cloudcover;
  const uv: number[] = meteo.hourly.uv_index;

  return t.map((ts, i) => ({
    ts,
    app: ap[i],
    wind: ws[i],
    ppop: pp[i],
    precip: pr[i],
    rh: rh[i],
    cloud: cc[i],
    uv: uv[i],
  }));
}

// "YYYY-MM-DDTHH:00" → "HH"만 뽑아 한국식 라벨 "07–09시" 만들 때 사용
function hh(ts: string) { return ts.split("T")[1].slice(0, 2); }

export type Slot = { hour: string; score: number };

export function bestFiveHours(
  hours: Hour[],
  scorer: (h: Hour) => number,
  startIndex = 0
): Slot[] {
  const endIndex = Math.min(hours.length, startIndex + 24);
  const all: Slot[] = [];
  const day: Slot[] = [];

  for (let i = startIndex; i < endIndex; i++) {
    const h = hours[i];
    const hh = parseInt(h.ts.split("T")[1].slice(0, 2), 10);

    const score = scorer(h);
    const slot: Slot = { hour: hh.toString().padStart(2, "0"), score };

    all.push(slot);
    if (hh >= 5 && hh <= 22) {   // ✅ 활동 시간대만 허용
      // 비 게이트
      if (!(h.ppop >= 30 || h.precip > 0.5)) {
        day.push(slot);
      }
    }
  }

  const pool = day.length ? day : all;
  pool.sort((a, b) => b.score - a.score);

  return pool.slice(0, 5); // 상위 5개만
}

export function slotLabel1h(s: Slot) {
  return `${s.hour}시`;
}


