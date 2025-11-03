// lib/formatters.ts
type BriefInput = {
    city: string;
    generatedAtLocal: string; // "YYYY-MM-DD HH:mm" in America/Denver
    runTop: Array<{ label: string; score: number }>;   // 1시간 단위 Top5
    walkTop: Array<{ label: string; score: number }>;
    uvPeak?: { time: string; uv: number } | null;      // ex: { time: "13:00", uv: 7.2 }
    rainSummary: string;                               // "오전 중 소나기 가능(30% 내외)" 등
    alerts: string[];                                  // NWS headline 배열
  };
  
  export function formatKTime(ts: string) {
    // "13:00" -> "13시" (SNS 텍스트 단순화)
    return ts.replace(":00", "시");
  }
  
  function topNToLine(prefixEmoji: string, top: Array<{ label: string; score: number }>, n=2) {
    if (!top?.length) return `${prefixEmoji} 추천 없음`;
    const list = top.slice(0, n).map((s, i) => `${i+1}. ${s.label} (${s.score}점)`);
    return `${prefixEmoji} ${list.join(" | ")}`;
  }
  
  export function makeBriefText(input: BriefInput) {
    const { city, generatedAtLocal, runTop, walkTop, uvPeak, rainSummary, alerts } = input;
  
    const runLine  = topNToLine("🏃 러닝", runTop, 5);
    const walkLine = topNToLine("🚶 산책", walkTop, 5);
  
    const uvLine = uvPeak
      ? `🌞 UV 피크: ${formatKTime(uvPeak.time)} (지수 ${uvPeak.uv.toFixed(1)})`
      : `🌞 UV: 보통`;
  
    const alertLine = alerts?.length
      ? `🚨 경보: ${alerts[0]}`
      : `🚨 경보: 없음`;
  
    // 강수 요약은 입력 그대로 표시
    const rainLine = `☔ 강수: ${rainSummary}`;
  
    return [
      `[${city} 오늘 아웃도어 브리핑] (${generatedAtLocal})`,
      runLine,
      walkLine,
      rainLine,
      uvLine,
      alertLine,
      `자세한 실시간: <여기에_웹앱_URL>` // 런칭 때 실제 링크로 교체
    ].join("\n");
  }
  