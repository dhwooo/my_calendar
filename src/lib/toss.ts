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
/**
 * GET /v1/accounts — 본인 계좌 목록.
 * client credentials만으로 호출 가능. account 헤더 불필요.
 */
async function fetchAccountList(creds: Creds): Promise<string[]> {
  const candidates = ["/v1/accounts", "/v1/account"];
  let raw: unknown = null;
  let lastErr: Error | null = null;
  for (const p of candidates) {
    try {
      raw = await tossFetch<unknown>(p, creds, { needsAccount: false });
      break;
    } catch (err) {
      lastErr = err as Error;
    }
  }
  if (raw == null) throw lastErr ?? new Error("계좌 목록 조회 실패");

  const obj = raw as Record<string, unknown>;
  const list = (obj.accounts ??
    obj.items ??
    obj.data ??
    (Array.isArray(raw) ? raw : [])) as Record<string, unknown>[];
  return list
    .map(
      (a) =>
        (a.accountNumber ?? a.number ?? a.id ?? a.accountId) as
          | string
          | undefined,
    )
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

async function fetchOneAccountPortfolio(
  creds: Creds,
): Promise<{ summary: TossAccountSummary; holdings: TossHolding[] }> {
  // /asset#getholdings 기반
  const candidates = ["/v1/holdings", "/v1/assets/holdings", "/v1/accounts/holdings"];
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

/**
 * 여러 계좌 (CSV로 저장된 accountNumber)를 모두 조회해서 합산.
 * 보유 종목은 같은 심볼끼리 수량/평가금액 합치고 평단은 가중평균.
 */
export async function fetchTossPortfolio(creds: Creds): Promise<{
  summary: TossAccountSummary;
  holdings: TossHolding[];
  accounts: string[];
}> {
  // 계좌번호 미입력이면 /accounts 자동 조회. 입력 시(CSV) 그대로 사용.
  let accounts = (creds.accountNumber ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (accounts.length === 0) {
    accounts = await fetchAccountList(creds);
  }
  if (accounts.length === 0) {
    throw new Error("연결된 계좌가 없어요.");
  }

  const results = await Promise.all(
    accounts.map((acct) =>
      fetchOneAccountPortfolio({ ...creds, accountNumber: acct }),
    ),
  );

  // 합산
  const summary: TossAccountSummary = {
    totalAsset: 0,
    cashBalance: 0,
    evalAmount: 0,
    totalProfit: 0,
  };
  const bySymbol = new Map<string, TossHolding>();
  for (const r of results) {
    summary.totalAsset = (summary.totalAsset ?? 0) + (r.summary.totalAsset ?? 0);
    summary.cashBalance = (summary.cashBalance ?? 0) + (r.summary.cashBalance ?? 0);
    summary.evalAmount = (summary.evalAmount ?? 0) + (r.summary.evalAmount ?? 0);
    summary.totalProfit = (summary.totalProfit ?? 0) + (r.summary.totalProfit ?? 0);
    for (const h of r.holdings) {
      const ex = bySymbol.get(h.symbol);
      if (!ex) {
        bySymbol.set(h.symbol, { ...h });
      } else {
        const qty = ex.quantity + h.quantity;
        const avg =
          ex.averagePrice != null && h.averagePrice != null && qty > 0
            ? (ex.averagePrice * ex.quantity + h.averagePrice * h.quantity) / qty
            : (ex.averagePrice ?? h.averagePrice);
        bySymbol.set(h.symbol, {
          ...ex,
          quantity: qty,
          averagePrice: avg,
          evalAmount: (ex.evalAmount ?? 0) + (h.evalAmount ?? 0),
          profit: (ex.profit ?? 0) + (h.profit ?? 0),
        });
      }
    }
  }
  if (summary.evalAmount && summary.totalProfit != null) {
    summary.totalProfitRate =
      summary.evalAmount > 0
        ? (summary.totalProfit / (summary.evalAmount - summary.totalProfit)) * 100
        : 0;
  }
  return { summary, holdings: Array.from(bySymbol.values()), accounts };
}
