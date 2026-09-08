import { NextRequest, NextResponse } from "next/server";

type NagerHoliday = {
  date: string;
  name: string;
  countryCode: string;
  subdivisionCodes: string[] | null;
  nationalHoliday: boolean;
  holidayTypes: string[];
};

const PROVIDER_URL = "https://nagerholidays.com/api/v4/Holidays";
const CACHE_SECONDS = 60 * 60 * 6;

export async function GET(request: NextRequest) {
  const country = (request.nextUrl.searchParams.get("country") || "NZ").trim().toUpperCase();
  const currentYear = new Date().getFullYear();
  const year = Number(request.nextUrl.searchParams.get("year") || currentYear);

  if (!/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json({ error: "Use a valid two-letter country code." }, { status: 400 });
  }

  if (!Number.isInteger(year) || year < currentYear - 2 || year > currentYear + 2) {
    return NextResponse.json({ error: `Choose a year between ${currentYear - 2} and ${currentYear + 2}.` }, { status: 400 });
  }

  try {
    const response = await fetch(`${PROVIDER_URL}/${country}/${year}`, {
      next: { revalidate: CACHE_SECONDS },
      headers: { Accept: "application/json", "User-Agent": "WebfitNews/1.0" },
    });

    if (!response.ok) {
      const status = response.status === 404 ? 404 : 502;
      return NextResponse.json(
        { error: response.status === 404 ? "Holiday data is not available for that country and year." : "The holiday provider is temporarily unavailable." },
        { status },
      );
    }

    const data = (await response.json()) as NagerHoliday[];
    const holidays = data
      .filter((item) => Array.isArray(item.holidayTypes) && item.holidayTypes.includes("Public"))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(
      {
        countryCode: country,
        year,
        holidays,
        lastUpdated: new Date().toISOString(),
        refreshHours: 6,
        provider: "Nager.Holidays",
        providerUrl: "https://nagerholidays.com/api",
      },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400` } },
    );
  } catch {
    return NextResponse.json({ error: "Holiday data could not be loaded right now." }, { status: 502 });
  }
}
