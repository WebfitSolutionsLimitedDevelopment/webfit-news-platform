import { NextResponse } from "next/server";

const FRANKFURTER = "https://api.frankfurter.dev/v2";
const ECB_CURRENCIES = new Set([
  "EUR","USD","JPY","CZK","DKK","GBP","HUF","PLN","RON","SEK","CHF","ISK","NOK","TRY",
  "AUD","BRL","CAD","CNY","HKD","IDR","ILS","INR","KRW","MXN","MYR","NZD","PHP","SGD","THB","ZAR"
]);

type FrankfurterRate = {
  date?: string;
  base?: string;
  quote?: string;
  rate?: number;
  providers?: string[];
};

function validCode(value: string | null) {
  const code = (value || "").trim().toUpperCase();
  return ECB_CURRENCIES.has(code) ? code : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = validCode(searchParams.get("base"));
  const quote = validCode(searchParams.get("quote"));

  if (!base || !quote) {
    return NextResponse.json({ error: "Choose two supported currencies." }, { status: 400 });
  }

  if (base === quote) {
    return NextResponse.json({
      base,
      quote,
      rate: 1,
      date: new Date().toISOString().slice(0, 10),
      source: "ECB statistics via Frankfurter",
    });
  }

  try {
    const url = `${FRANKFURTER}/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}?providers=ECB`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "A reference rate is not available for this pair right now." }, { status: 502 });
    }

    const data = (await response.json()) as FrankfurterRate;
    if (typeof data.rate !== "number" || !Number.isFinite(data.rate)) {
      return NextResponse.json({ error: "The rate provider returned an invalid response." }, { status: 502 });
    }

    return NextResponse.json({
      base,
      quote,
      rate: data.rate,
      date: data.date || null,
      source: "ECB statistics via Frankfurter",
    });
  } catch {
    return NextResponse.json({ error: "Currency rates are temporarily unavailable. Please try again." }, { status: 503 });
  }
}
