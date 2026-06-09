/**
 * 토스증권 OpenAPI 클라이언트.
 * https://openapi.tossinvest.com
 *
 * 사용자별 client_id / client_secret 으로 OAuth Client Credentials 토큰을 받아 호출.
 * 토큰은 메모리에 짧게 캐시 (만료 직전까지 재사용).
 */

const BASE = "https://openapi.tossinvest.com";

type TokenCache = { token: string; expiresAt: number };
const tokenCache = new Map<string, TokenCache>();

async function getAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const cacheKey = `${clientId}:${clientSecret}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${BASE}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Toss OAuth token failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const j = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };
  const ttlMs = (j.expires_in ?? 3600) * 1000;
  tokenCache.set(cacheKey, {
    token: j.access_token,
    expiresAt: Date.now() + ttlMs,
  });
  return j.access_token;
}

type Creds = {
  clientId: string;
  clientSecret: string;
  accountNumber?: string | null;
};

async function tossFetch<T>(
  path: string,
  creds: Creds,
  options: { needsAccount?: boolean } = {},
): Promise<T> {
  const token = await getAccessToken(creds.clientId, creds.clientSecret);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  };
  if (options.needsAccount) {
    if (!creds.accountNumber) {
      throw new Error("계좌번호가 설정되어 있지 않아요.");
    }
    headers["X-Tossinvest-Account"] = creds.accountNumber;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Toss ${path} ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export type TossHolding = {
  symbol: string;
  name?: string;
  market?: string;
  quantity: number;
  averagePrice?: number;
  currentPrice?: number;
  evalAmount?: number;
  profit?: number;
  profitRate?: number;
  currency?: string;
};

export type TossAccountSummary = {
  totalAsset?: number;
  cashBalance?: number;
  evalAmount?: number;
  totalProfit?: number;
  totalProfitRate?: number;
};

/**
 * 보유 종목 + 계좌 요약을 한 번에 가져오기.
 * 토스증권 API 응답 스키마가 공식 OpenAPI JSON 기준이라
 * 필드 매핑은 첫 실제 응답 후 확정 필요 (스키마 노출 시 보완).
 */
export async function fetchTossPortfolio(creds: Creds): Promise<{
  summary: TossAccountSummary;
  holdings: TossHolding[];
}> {
  // ⚠ 공식 OpenAPI JSON이 SPA에서만 로드되어 정확한 path/필드명을 잡지 못한 상태.
  // 가장 가능성 높은 후보 경로 두 개를 시도 → 첫 200 응답을 사용.
  const candidates = ["/v1/accounts/holdings", "/v1/account/holdings"];

  let raw: unknown = null;
  let lastErr: Error | null = null;
  for (const p of candidates) {
    try {
      raw = await tossFetch<unknown>(p, creds, { needsAccount: true });
      break;
    } catch (err) {
      lastErr = err as Error;
    }
  }
  if (raw == null) throw lastErr ?? new Error("토스 API 응답 없음");

  // 응답 구조 모르므로 안전한 형태로 추출.
  const obj = raw as Record<string, unknown>;
  const list =
    (obj.holdings as unknown[]) ??
    (obj.items as unknown[]) ??
    (obj.data as unknown[]) ??
    [];

  const holdings: TossHolding[] = (list as Record<string, unknown>[]).map(
    (it) => ({
      symbol: String(it.symbol ?? it.code ?? it.ticker ?? ""),
      name: it.name as string | undefined,
      market: it.market as string | undefined,
      quantity: Number(it.quantity ?? it.qty ?? 0),
      averagePrice: it.averagePrice as number | undefined,
      currentPrice: (it.currentPrice ?? it.price) as number | undefined,
      evalAmount: (it.evalAmount ?? it.valuation) as number | undefined,
      profit: (it.profit ?? it.profitLoss) as number | undefined,
      profitRate: (it.profitRate ?? it.profitLossRate) as number | undefined,
      currency: (it.currency as string | undefined) ?? "KRW",
    }),
  );

  const summary: TossAccountSummary = {
    totalAsset: obj.totalAsset as number | undefined,
    cashBalance: obj.cashBalance as number | undefined,
    evalAmount: obj.evalAmount as number | undefined,
    totalProfit: obj.totalProfit as number | undefined,
    totalProfitRate: obj.totalProfitRate as number | undefined,
  };

  return { summary, holdings };
}
