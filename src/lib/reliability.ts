// lib/reliability.ts
import type { Hour } from "./types";

/**
 * 해당 시간대의 강수확률/강수량을 기준으로 신뢰도 라벨을 반환
 * - 안정: ppop < 20% AND precip <= 0.2mm
 * - 보통: 20% <= ppop < 40% OR 0.2 < precip <= 0.5
 * - 변동: ppop >= 40% OR precip > 0.5
 */
export function reliabilityLabel(h: Hour) {
  const p = h.ppop ?? 0;
  const r = h.precip ?? 0;

  if (p < 20 && r <= 0.2) return { label: "안정", color: "bg-emerald-100 text-emerald-800" };
  if ((p >= 20 && p < 40) || (r > 0.2 && r <= 0.5)) return { label: "보통", color: "bg-amber-100 text-amber-800" };
  return { label: "변동", color: "bg-red-100 text-red-800" };
}
