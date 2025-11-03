// lib/fetchers.ts
// weather info fetcher
export async function getOpenMeteo(lat: string, lon: string, timezone: string) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,relative_humidity_2m,cloudcover,uv_index` +
    `&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,relative_humidity_2m,cloudcover,uv_index` +
    /*
    `&temperature_unit=fahrenheit` +
    `&wind_speed_unit=mph` +
    `&precipitation_unit=inch` +
    */
    `&temperature_unit=celsius` +         // ✅ 섭씨
    `&wind_speed_unit=ms` +               // ✅ m/s
    `&precipitation_unit=mm` +            // ✅ 밀리미터
    `&timezone=${encodeURIComponent(timezone)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "rapidcity-briefing (you@example.com)" },
    next: { revalidate: 1800 }, // 30분 캐시
  });
  if (!res.ok) throw new Error("Open-Meteo fetch failed");
  return res.json();
}

export async function getNwsAlerts(lat: string, lon: string) {
  const url = `https://api.weather.gov/alerts/active?point=${lat},${lon}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "rapidcity-briefing (you@example.com)" },
    next: { revalidate: 300 }, // 5분
  });
  if (!res.ok) throw new Error("NWS Alerts fetch failed");
  return res.json();
}
