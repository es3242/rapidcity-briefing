import { ImageResponse } from "next/og";
import { getOpenMeteo } from "@/lib/fetchers";
import { toHours, scoreRun, scoreWalk, bestFiveHours, slotLabel1h } from "@/lib/scoring";
import { localMorningHourISO, localNowISO } from "@/lib/time";
import { makeRainSummary } from "@/lib/summary";

export const runtime = "edge";

export async function GET() {
  const tz = process.env.TIMEZONE!, lat = process.env.LAT!, lon = process.env.LON!;
  const meteo = await getOpenMeteo(lat, lon, tz);
  const basis = localMorningHourISO(tz, 6);
  const hours = toHours(meteo);
  const idx = Math.max(0, meteo.hourly.time.indexOf(basis));

  const run  = bestFiveHours(hours, scoreRun,  idx).slice(0,2).map(s => `${slotLabel1h(s)} (${Math.round(s.score)}점)`);
  const walk = bestFiveHours(hours, scoreWalk, idx).slice(0,2).map(s => `${slotLabel1h(s)} (${Math.round(s.score)}점)`);
  const rain = makeRainSummary(hours, idx);
  const now  = localNowISO(tz);

  return new ImageResponse(
    (
      <div style={{
        width:1080, height:1080, display:"flex",
        flexDirection:"column", padding:48, background:"#f6f7f9", color:"#111"
      }}>
        <div style={{ display:"flex", fontSize:64, fontWeight:800 }}>Rapid City 오늘 브리핑</div>
        <div style={{ display:"flex", fontSize:32, color:"#666" }}>업데이트: {now}</div>
        <div style={{ display:"flex", fontSize:44 }}>🏃 {run.join(" | ")}</div>
        <div style={{ display:"flex", fontSize:44 }}>🚶 {walk.join(" | ")}</div>
        <div style={{ display:"flex", fontSize:36 }}>☔ {rain}</div>
        <div style={{ display:"flex", fontSize:28, color:"#888", marginTop:24 }}>
          실시간: yourdomain.vercel.app
        </div>
      </div>
    ),
    { width:1080, height:1080 }
  );
}
