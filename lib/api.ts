// ============================================================
// Central API client – wraps every endpoint from the docs
// ============================================================
import type {
  CandlestickData,
  Company,
  CompanyEvent,
  CompanyTransaction,
  CreateCompanyPayload,
  CreateTriggerPayload,
  IPO,
  IPOAllocationResult,
  IPOApplication,
  LaunchIPOPayload,
  LiveTradingData,
  LoginPayload,
  MainWallet,
  MarketIndex,
  Order,
  OrderBook,
  PlaceOrderPayload,
  PortfolioItem,
  PricePrediction,
  PriceTrigger,
  RegisterPayload,
  SectorPerformance,
  Trade,
  TradingWallet,
  UpdateKYCPayload,
  UpdateProfilePayload,
  User,
  WalletTransfer,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

// --------------- helpers ---------------

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      body.error || body.message || `Request failed (${res.status})`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// --------------- Health ---------------
export const healthCheck = () => request<{ status: string; service: string }>("/health");

// --------------- Auth ---------------
export const register = (data: RegisterPayload) =>
  request<{ message: string; user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const login = (data: LoginPayload) =>
  request<{ message: string; token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getProfile = (token: string) =>
  request<{ user: User }>("/auth/profile", {}, token);

export const updateProfile = (data: UpdateProfilePayload, token: string) =>
  request<{ message: string; user: User }>("/auth/profile/update", {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);

export const uploadProfileImage = async (file: File, token: string) => {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${BASE}/auth/profile/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || body.message || "Upload failed", res.status);
  }
  return res.json() as Promise<{ message: string; user: User }>;
};

// --------------- Admin ---------------
export const getAllUsers = (token: string, limit = 100) =>
  request<{ status: string; count: number; users: User[] }>(`/admin/users?limit=${limit}`, {}, token);

export const updateUserKYC = (userId: string, data: UpdateKYCPayload, token: string) =>
  request<{ message: string; user: User }>(`/admin/users/${userId}/kyc`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);

export const createCompany = (data: CreateCompanyPayload, token: string) =>
  request<{ message: string; company: Company }>("/admin/companies", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);

export const launchIPO = (data: LaunchIPOPayload, token: string) =>
  request<{ message: string; ipo: IPO }>("/admin/ipos", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);

export const allocateIPO = (ipoId: string, token: string) =>
  request<{ message: string; result: IPOAllocationResult }>(`/admin/ipos/${ipoId}/allocate`, {
    method: "POST",
  }, token);

export const getIPOApplicationsAdmin = (ipoId: string, token: string) =>
  request<{ ipo_id: string; count: number; applications: IPOApplication[] }>(
    `/admin/ipos/${ipoId}/applications`,
    {},
    token,
  );

// --------------- Wallet ---------------
export const getAllWallets = (token: string) =>
  request<{ main_wallet: MainWallet; trading_wallet: TradingWallet }>("/wallet/", {}, token);

export const getMainWallet = (token: string) =>
  request<{ wallet: MainWallet }>("/wallet/main", {}, token);

export const getTradingWallet = (token: string) =>
  request<{ wallet: TradingWallet }>("/wallet/trading", {}, token);

export const topUpWallet = (amount: string, token: string) =>
  request<{ message: string; wallet: MainWallet }>("/wallet/topup", {
    method: "POST",
    body: JSON.stringify({ amount }),
  }, token);

export const transferWallet = (amount: string, direction: "main_to_trading" | "trading_to_main", token: string) =>
  request<{ message: string; main_wallet: MainWallet; trading_wallet: TradingWallet }>("/wallet/transfer", {
    method: "POST",
    body: JSON.stringify({ amount, direction }),
  }, token);

export const getTransferHistory = (token: string) =>
  request<{ transfers: WalletTransfer[] }>("/wallet/transfers", {}, token);

// --------------- Orders ---------------
export const placeBuyOrder = (data: PlaceOrderPayload, token: string) =>
  request<{ message: string; order: Order; matches: number }>("/orders/buy", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);

export const placeSellOrder = (data: Omit<PlaceOrderPayload, "order_type">, token: string) =>
  request<{ message: string; order: Order; matches: number }>("/orders/sell", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);

export const cancelOrder = (orderId: string, token: string) =>
  request<{ message: string }>(`/orders/${orderId}/cancel`, { method: "PUT" }, token);

export const getOrderBook = (companyId: string, token?: string) =>
  request<{ order_book: OrderBook }>(`/orders/book/${companyId}`, {}, token);

export const getMyOrders = (token: string) =>
  request<{ orders: Order[] }>("/orders/my-orders", {}, token);

export const getPortfolio = (token: string) =>
  request<{ portfolio: PortfolioItem[] }>("/orders/portfolio", {}, token);

export const getUserTrades = (token: string) =>
  request<{ trades: Trade[] }>("/orders/trades", {}, token);

export const getRecentTrades = (limit = 10) =>
  request<{ trades: Trade[]; count: number }>(`/market/live?limit=${limit}`);

export const getCompanyTradeHistory = (id: string, limit = 50) =>
  request<{ company_id: string; count: number; transactions: CompanyTransaction[] }>(
    `/market/companies/${id}/trades?limit=${limit}`,
  );

// --------------- IPO ---------------
export const listIPOs = () =>
  request<{ ipos: IPO[] }>("/ipo/");

export const getIPODetail = (id: string) =>
  request<{ ipo: IPO }>(`/ipo/${id}`);

export const applyForIPO = (ipoId: string, sharesRequested: number, token: string) =>
  request<{ message: string; application: IPOApplication }>(`/ipo/${ipoId}/apply`, {
    method: "POST",
    body: JSON.stringify({ shares_requested: sharesRequested }),
  }, token);

// --------------- Market Data ---------------
export const listCompanies = (limit = 50, offset = 0) =>
  request<{ data: Company[]; count: number }>(`/market/companies?limit=${limit}&offset=${offset}`);

export const getRecentCompanies = (limit = 10) =>
  request<{ data: Company[]; count: number }>(`/market/companies/new?limit=${limit}`);

export const getOldestCompanies = (limit = 10) =>
  request<{ data: Company[]; count: number }>(`/market/companies/old?limit=${limit}`);

export const getCompanyDetail = (id: string) =>
  request<{ data: Company }>(`/market/companies/${id}`);

export const getPricePrediction = (id: string) =>
  request<{ data: PricePrediction }>(`/market/companies/${id}/prediction`);

export const getLiveTrading = () =>
  request<{ data: LiveTradingData[]; count: number }>("/market/live");

export const getMarketIndex = () =>
  request<{ data: MarketIndex }>("/market/index");

export const getCandlestick = (symbol: string, days = 365) =>
  request<{ data: CandlestickData[]; symbol: string; timeframe: string; count: number }>(
    `/market/candlestick?symbol=${symbol}&days=${days}`,
  );

export const getTopGainers = (limit = 10) =>
  request<{ data: LiveTradingData[]; count: number }>(`/market/top-gainers?limit=${limit}`);

export const getTopLosers = (limit = 10) =>
  request<{ data: LiveTradingData[]; count: number }>(`/market/top-losers?limit=${limit}`);

export const getMostActive = (limit = 10) =>
  request<{ data: LiveTradingData[]; count: number }>(`/market/most-active?limit=${limit}`);

export const getTopTurnover = (limit = 10) =>
  request<{ data: LiveTradingData[]; count: number }>(`/market/top-turnover?limit=${limit}`);

export const getSectorPerformance = () =>
  request<{ data: SectorPerformance[]; count: number }>("/market/sectors");

export const getCompaniesBySector = (sector: string) =>
  request<{ data: LiveTradingData[]; sector: string; count: number }>(
    `/market/sectors/${encodeURIComponent(sector)}/companies`,
  );

// --------------- Events ---------------
export const getAllEvents = (limit = 50, offset = 0) =>
  request<{ events: CompanyEvent[]; count: number }>(
    `/market/events?limit=${limit}&offset=${offset}`,
  );

export const getCompanyEvents = (companyId: string, limit = 50) =>
  request<{ events: CompanyEvent[]; count: number }>(
    `/market/events/company/${companyId}?limit=${limit}`,
  );

export const getUpcomingEvents = (limit = 50) =>
  request<{ events: CompanyEvent[]; count: number }>(
    `/market/events/upcoming?limit=${limit}`,
  );

export const getEventsByType = (eventType: string, limit = 50) =>
  request<{ events: CompanyEvent[]; count: number }>(
    `/market/events/type/${eventType}?limit=${limit}`,
  );

// --------------- Price Triggers ---------------
export const createTrigger = (data: CreateTriggerPayload, token: string) =>
  request<{ data: PriceTrigger }>("/market/triggers", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);

export const getUserTriggers = (token: string) =>
  request<{ data: PriceTrigger[]; count: number }>("/market/triggers", {}, token);

export const cancelTrigger = (triggerId: string, token: string) =>
  request<{ message: string }>(`/market/triggers/${triggerId}/cancel`, {
    method: "PUT",
  }, token);

// --------------- SSE Stream ---------------
export const createPriceStream = () => {
  return new EventSource(`${BASE}/market/stream`);
};
