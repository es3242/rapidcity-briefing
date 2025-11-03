// lib/time.ts
export function localNowISO(tz: string) {
    const f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    }).formatToParts(new Date());
    const get = (t: string) => f.find(p => p.type === t)!.value;
    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
  }
  
  export function localMorningHourISO(tz: string, hour = 6) {
    // 오늘 날짜의 06:00 "YYYY-MM-DDTHH:00"
    const f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const get = (t: string) => f.find(p => p.type === t)!.value;
    const h = String(hour).padStart(2, "0");
    return `${get("year")}-${get("month")}-${get("day")}T${h}:00`;
  }
  