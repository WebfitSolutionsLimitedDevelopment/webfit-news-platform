import { NextRequest, NextResponse } from "next/server";

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Weather service is not configured yet." },
      { status: 503 },
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Enter a city or place name." }, { status: 400 });
  }

  try {
    const geoRes = await fetch(`${GEO_URL}?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`, {
      next: { revalidate: 86400 },
    });
    if (!geoRes.ok) throw new Error("Geocoding request failed");
    const locations = await geoRes.json();
    const location = locations?.[0];
    if (!location) {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }

    const common = `lat=${location.lat}&lon=${location.lon}&units=metric&appid=${apiKey}`;
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${CURRENT_URL}?${common}`, { next: { revalidate: 600 } }),
      fetch(`${FORECAST_URL}?${common}`, { next: { revalidate: 1800 } }),
    ]);

    if (!currentRes.ok || !forecastRes.ok) throw new Error("Weather request failed");

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    const dailyMap = new Map<string, any[]>();
    for (const item of forecast.list ?? []) {
      const key = item.dt_txt?.slice(0, 10);
      if (!key) continue;
      const group = dailyMap.get(key) ?? [];
      group.push(item);
      dailyMap.set(key, group);
    }

    const daily = Array.from(dailyMap.entries()).slice(0, 5).map(([date, items]) => {
      const temps = items.map((item) => Number(item.main?.temp)).filter(Number.isFinite);
      const rain = items.map((item) => Number(item.pop ?? 0)).filter(Number.isFinite);
      const representative = items.find((item) => item.dt_txt?.includes("12:00:00")) ?? items[Math.floor(items.length / 2)];
      return {
        date,
        min: Math.round(Math.min(...temps)),
        max: Math.round(Math.max(...temps)),
        rainChance: Math.round(Math.max(...rain, 0) * 100),
        description: representative?.weather?.[0]?.description ?? "",
        icon: representative?.weather?.[0]?.icon ?? "",
      };
    });

    return NextResponse.json({
      location: {
        name: location.name,
        country: location.country,
        state: location.state ?? null,
        lat: location.lat,
        lon: location.lon,
      },
      current: {
        temperature: Math.round(current.main?.temp),
        feelsLike: Math.round(current.main?.feels_like),
        humidity: current.main?.humidity,
        windKph: Math.round((current.wind?.speed ?? 0) * 3.6),
        description: current.weather?.[0]?.description ?? "",
        icon: current.weather?.[0]?.icon ?? "",
        observedAt: new Date((current.dt ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      },
      daily,
      provider: "OpenWeather",
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("World weather error", error);
    return NextResponse.json(
      { error: "Live weather is temporarily unavailable. Please try again shortly." },
      { status: 502 },
    );
  }
}
