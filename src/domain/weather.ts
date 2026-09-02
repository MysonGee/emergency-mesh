export type WeatherSignal = {
  mode: "DEMO" | "LIVE";
  relevant: boolean;
  warningType?: string;
  area?: string;
  issuedAt?: string;
  updatedAt?: string;
  sourceUrl: string;
  sourceFreshness: string;
  attribution: string;
  detail?: string;
};

export const demoWeatherSignal: WeatherSignal = {
  mode: "DEMO",
  relevant: true,
  warningType: "Simulated severe weather and flood warning",
  area: "Fictional East Valley catchment",
  issuedAt: "2026-08-27T17:38:00Z",
  updatedAt: "2026-08-27T17:42:00Z",
  sourceUrl: "https://www.bom.gov.au/australia/warnings/",
  sourceFreshness: "Simulated update · 4 min ago",
  attribution: "Fictional replay data — not Bureau of Meteorology content.",
  detail: "Replay signal is configured to prompt a capability review for the Harbour scenario.",
};
