import { NextResponse } from "next/server";

const GOLD_API = "https://api.gold-api.com/price/XAU";
const FRANKFURTER = "https://api.frankfurter.dev/v2";
const SUPPORTED = new Set(["USD","NZD","INR","AUD","GBP","EUR","CAD","JPY","SGD","AED"]);

function validCurrency(value: string | null) {
  const code = (value || "USD").trim().toUpperCase();
  return SUPPORTED.has(code) ? code : null;
}

type GoldPayload = {
  currency?: string;
  currencySymbol?: string;
  exchangeRate?: number;
  name?: string;
  price?: number;
  symbol?: string;
  updatedAt?: string;
  updatedAtReadable?: string;
};

type FxPayload = {
  date?: string;
  rate?: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = validCurrency(searchParams.get("currency"));

  if (!currency) {
    return NextResponse.json({ error: "Choose a supported currency." }, { status: 400 });
  }

  try {
    const goldResponse = await fetch(GOLD_API, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!goldResponse.ok) {
      return NextResponse.json({ error: "Gold price data is temporarily unavailable." }, { status: 502 });
    }

    const gold = (await goldResponse.json()) as GoldPayload;
    if (typeof gold.price !== "number" || !Number.isFinite(gold.price)) {
      return NextResponse.json({ error: "The gold price provider returned an invalid response." }, { status: 502 });
    }

    let fxRate = 1;
    let fxDate: string | null = null;

    if (currency !== "USD") {
      const fxResponse = await fetch(`${FRANKFURTER}/rate/USD/${currency}?providers=ECB`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });

      if (!fxResponse.ok) {
        return NextResponse.json({ error: "The selected currency conversion is temporarily unavailable." }, { status: 502 });
      }

      const fx = (await fxResponse.json()) as FxPayload;
      if (typeof fx.rate !== "number" || !Number.isFinite(fx.rate)) {
        return NextResponse.json({ error: "The currency provider returned an invalid response." }, { status: 502 });
      }
      fxRate = fx.rate;
      fxDate = fx.date || null;
    }

    const perOz = gold.price * fxRate;
    const perGram24 = perOz / 31.1034768;

    return NextResponse.json({
      symbol: "XAU",
      currency,
      perOz,
      perGram24,
      perGram22: perGram24 * (22 / 24),
      perGram18: perGram24 * (18 / 24),
      perGram14: perGram24 * (14 / 24),
      spotUsdPerOz: gold.price,
      goldUpdatedAt: gold.updatedAt || null,
      fxDate,
      fetchedAt: new Date().toISOString(),
      source: "Gold API spot price; ECB exchange rates via Frankfurter where conversion is required",
    });
  } catch {
    return NextResponse.json({ error: "Gold price data is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
