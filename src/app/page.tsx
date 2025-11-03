"use client";
import { useEffect, useState } from "react";
import ScoreBar from "./components/ScoreBar";

type TopItem = { label: string; score: number; hour: string };
type HourItem = {
  ts: string; app: number; wind: number; ppop: number; precip: number;
  rh: number; cloud: number; uv: number;
};

function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{text}</span>;
}

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [brief, setBrief] = useState<any>(null);
  useEffect(() => {
    fetch("/api/briefing/snapshot").then(r=>r.json()).then(setBrief).catch(console.error);
  }, []);
  
  // ✅ 30분마다 자동 새로고침(옵션)
  useEffect(() => {
    const fetchNow = () => fetch("/api/now").then((r) => r.json()).then(setData).catch(console.error);
    fetchNow();
    const t = setInterval(fetchNow, 30 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );

  // 신뢰도 계산을 위해 해당 hour의 HourItem 찾기
  const byHour = (hour: string): HourItem | undefined => {
    if (!data?.hours) return undefined;
    return data.hours.find((h: HourItem) => h.ts.split("T")[1].slice(0,2) === hour);
  };

  function reliabilityByVals(ppop?: number|null, precip?: number|null) {
    const p = ppop ?? 0;
    const r = precip ?? 0;
    if (p < 20 && r <= 0.2) return { label: "안정", color: "bg-emerald-100 text-emerald-800" };
    if ((p >= 20 && p < 40) || (r > 0.2 && r <= 0.5)) return { label: "보통", color: "bg-amber-100 text-amber-800" };
    return { label: "변동", color: "bg-red-100 text-red-800" };
  }

  const renderTop = (items: any[]) => (
    <ul className="space-y-2">
      {items.slice(0,5).map((s, i) => {
        const rel = reliabilityByVals(s.ppop, s.precip);
        return (
          <li key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 text-gray-500">{["①","②","③","④","⑤"][i]}</span>
              <span className="font-medium">{s.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${rel.color}`}>{rel.label}</span>
              {/* (선택) 세부값 툴팁 */}
              <span className="text-xs text-gray-400">({s.ppop ?? "-"}% / {s.precip ?? "-"}mm)</span>
            </div>
            <div className="flex items-center gap-2">
              <ScoreBar score={s.score} />
              <span className="text-xs text-gray-500 w-10 text-right">{Math.round(s.score)}점</span>
            </div>
          </li>
        );
      })}
    </ul>
  );


  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Rapid City 오늘 아웃도어 브리핑</h1>
          <p className="text-sm text-gray-500">
            업데이트: {data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString("ko-KR") : "불러오는 중..."}
            <span className="ml-2 text-gray-400">(30분마다 자동 새로고침)</span>
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <Card title="🏃 러닝 최적 시간 (Top 5)">
            {data?.runTop?.length ? renderTop(data.runTop) : <p>추천 없음</p>}
          </Card>

          <Card title="🚶 산책 최적 시간 (Top 5)">
            {data?.walkTop?.length ? renderTop(data.walkTop) : <p>추천 없음</p>}
          </Card>

          <Card title="☔ 현재 날씨">
            {data ? (
              <p>
                체감 {data.current.appTemp}{data.current.units.temp}, 강수확률 {data.current.precipProb}%,
                바람 {data.current.wind}{data.current.units.wind}
              </p>
            ) : <p>불러오는 중...</p>}
          </Card>

          <Card title="🌞 UV 알림">
            {data?.uvPeak ? (
              <p>피크 {data.uvPeak.time.replace(":00","시")} (지수 {data.uvPeak.uv.toFixed(1)})</p>
            ) : <p>데이터 없음</p>}
          </Card>

          <Card title="🚨 날씨 경보/특보">
            {data?.alerts?.length ? (
              <ul className="list-disc pl-5">
                {data.alerts.map((a: string, i: number) => <li key={i}>{a}</li>)}
              </ul>
            ) : <p>경보 없음</p>}
          </Card>
          <Card title="📰 아침 브리핑 (SNS 텍스트)">
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => navigator.clipboard.writeText(brief?.snsText ?? "")}
                className="px-3 py-1.5 rounded-lg bg-black text-white text-sm"
              >복사</button>
              <span className="text-xs text-gray-500">* 실제 자동 스냅샷은 06:30에 생성</span>
            </div>
            <pre className="whitespace-pre-wrap text-sm">{brief?.snsText ?? "로딩 중..."}</pre>
          </Card>
          
        </div>

        <footer className="mt-6 text-xs text-gray-500">
          * 실시간 변동 가능 — 세부 레이더/분단위 강수는 Day 7 이후 보강 예정
        </footer>
      </div>
    </main>
  );
}

