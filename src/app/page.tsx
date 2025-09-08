// app/page.tsx
export default function Home() {
  // Day 1: 아직은 더미 데이터 (Day 2~에 API 연결)
  const updatedAt = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border p-4 shadow-sm bg-white/60">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Rapid City 오늘 아웃도어 브리핑 (MVP)</h1>
          <p className="text-sm text-gray-500">업데이트: {updatedAt} (America/Denver)</p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <Card title="🏃 러닝 최적 시간대">
            <p>① 07–09시 ② 18–20시 <span className="text-gray-400">(샘플)</span></p>
          </Card>

          <Card title="🚶 산책 최적 시간대">
            <p>① 17–19시 ② 10–12시 <span className="text-gray-400">(샘플)</span></p>
          </Card>

          <Card title="☔ 다음 2시간 강수 브리핑">
            <p>08:30 전후 약한 소나기 가능 → 가벼운 우산 권장 <span className="text-gray-400">(샘플)</span></p>
          </Card>

          <Card title="🌞 UV 알림">
            <p>12–14시 ‘높음’ → 모자/선크림 권장 <span className="text-gray-400">(샘플)</span></p>
          </Card>

          <Card title="🚨 날씨 경보/특보">
            <p>경보 없음 <span className="text-gray-400">(샘플)</span></p>
          </Card>
        </div>

        <footer className="mt-6 text-xs text-gray-500">
          * 실시간 변동 가능 — Day 2부터 API 연결 및 자동 갱신 적용 예정
        </footer>
      </div>
    </main>
  );
}
