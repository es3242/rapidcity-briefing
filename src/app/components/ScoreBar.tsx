// app/components/ScoreBar.tsx
export default function ScoreBar({ score }: { score: number }) {
    const pct = Math.max(0, Math.min(100, score));
    return (
      <div className="h-2 w-40 bg-gray-200/80 rounded-full overflow-hidden inline-block align-middle">
        <div
          className="h-full bg-green-500"
          style={{ width: `${pct}%` }}
          aria-label={`점수 ${pct}점`}
        />
      </div>
    );
  }
  