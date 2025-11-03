// lib/types.ts
export type Hour = {
    ts: string;            // "YYYY-MM-DDTHH:00" (America/Denver)
    app: number;           // apparent_temperature (°C)
    wind: number;          // wind_speed_10m (m/s)
    ppop: number;          // precipitation_probability (%)
    precip: number;        // precipitation (mm)
    rh: number;            // relative_humidity_2m (%)
    cloud: number;         // cloudcover (%)
    uv: number;            // uv_index
  };
  