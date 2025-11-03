// lib/summary.ts
import type { Hour } from "./types";

export function makeRainSummary(hours: Hour[], startIndex: number) {
  const end = Math.min(hours.length, startIndex + 24);
  let high: string[] = [];
  let mid: string[] = [];

  for (let i = startIndex; i < end; i++) {
    const hh = hours[i].ts.split("T")[1]; // "HH:00"
    if (hours[i].ppop >= 50 || hours[i].precip > 1.0) {
      high.push(hh);
    } else if (hours[i].ppop >= 20) {
      mid.push(hh);
    }
  }
  const toK = (arr: string[]) => arr.slice(0, 3).map(x => x.replace(":00","시")).join(", ");

  if (high.length) return `소나기/비 가능성 높음: ${toK(high)} (일부 시간대)`;
  if (mid.length)  return `소나기 가능성 있음: ${toK(mid)}`;
  return `특이 사항 없음`;
}
