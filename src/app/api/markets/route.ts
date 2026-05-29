import { NextResponse } from "next/server";

export const revalidate = 30;

type Quote = {
  symbol: string;
  label: string;
  price: number;
  changePct: number; // percentage
  currency: "KRW" | "USD" | "PT";
};

async function yahooQuote(symbol: string, label: string, currency: "KRW" | "USD" | "PT"): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`,
      { next: { revalidate: 30 }, headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!res.ok) return null;
    const j = await res.json();
    const meta = j?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? meta.previousClose;
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    const changePct = prev ? ((price - prev) / prev) * 100 : 0;
    return { symbol, label, price, changePct, currency };
  } catch {
    return null;
  }
}

async function upbitQuote(market: string, label: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://api.upbit.com/v1/ticker?markets=${market}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return null;
    const j = await res.json();
    const item = j?.[0];
    if (!item) return null;
    return {
      symbol: market,
      label,
      price: item.trade_price,
      changePct: item.signed_change_rate * 100,
      currency: "KRW",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const [kospi, kosdaq, nasdaq, sp500, btc, eth, doge, sol] = await Promise.all([
    yahooQuote("^KS11", "KOSPI", "PT"),
    yahooQuote("^KQ11", "KOSDAQ", "PT"),
    yahooQuote("^IXIC", "NASDAQ", "PT"),
    yahooQuote("^GSPC", "S&P500", "PT"),
    upbitQuote("KRW-BTC", "BTC"),
    upbitQuote("KRW-ETH", "ETH"),
    upbitQuote("KRW-DOGE", "DOGE"),
    upbitQuote("KRW-SOL", "SOL"),
  ]);

  const quotes = [kospi, kosdaq, nasdaq, sp500, btc, eth, doge, sol].filter(
    (q): q is Quote => !!q,
  );

  return NextResponse.json({ quotes, updatedAt: new Date().toISOString() });
}
