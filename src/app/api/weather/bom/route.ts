import { NextResponse } from "next/server";
import type { WeatherSignal } from "@/domain/weather";

const feedUrl = "https://www.bom.gov.au/fwo/IDZ00054.warnings_nsw.xml";
const officialWarningsUrl = "https://www.bom.gov.au/australia/warnings/";
const relevantPattern = /flood|severe weather|severe thunderstorm|tropical cyclone/i;

function decode(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function tag(item: string, name: string) {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decode(match[1]) : undefined;
}

export async function GET() {
  try {
    const response = await fetch(feedUrl, { next: { revalidate: 300 }, headers: { "User-Agent": "Emergency-Mesh-demo/0.1 (awareness-only)" } });
    if (!response.ok) throw new Error(`BOM feed returned ${response.status}`);
    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(match => match[1]);
    const warning = items.find(item => relevantPattern.test(tag(item, "title") ?? ""));
    const now = new Date().toISOString();
    if (!warning) return NextResponse.json<WeatherSignal>({ mode: "LIVE", relevant: false, sourceUrl: officialWarningsUrl, sourceFreshness: `Checked ${now}`, attribution: "Source: Bureau of Meteorology RSS feed. Open the official warning for full content." });
    const title = tag(warning, "title") ?? "Bureau warning";
    const description = tag(warning, "description");
    return NextResponse.json<WeatherSignal>({ mode: "LIVE", relevant: true, warningType: title, area: description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 220) || "See official warning for geographic area.", issuedAt: tag(warning, "pubDate"), updatedAt: tag(warning, "pubDate"), sourceUrl: tag(warning, "link") ?? officialWarningsUrl, sourceFreshness: `Checked ${now}`, attribution: "Source: Bureau of Meteorology RSS feed. Open the official warning for full content.", detail: "External awareness signal only. It can prompt a capability review; it does not initiate operational activity." });
  } catch {
    return NextResponse.json<WeatherSignal>({ mode: "LIVE", relevant: false, sourceUrl: officialWarningsUrl, sourceFreshness: "Live feed unavailable — check the official source.", attribution: "Source: Bureau of Meteorology RSS feed. Open the official warning for full content." });
  }
}
