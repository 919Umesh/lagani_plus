// ============================================================
// TypeScript types derived from the API documentation
// ============================================================

// --- Auth / User ---
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  kyc_status: "pending" | "verified" | "rejected" | "under_review";
  role: "user" | "admin";
  profile_image_url: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
}

// --- Wallet ---
export interface MainWallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface TradingWallet {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransfer {
  id: string;
  user_id: string;
  amount: number;
  direction: "main_to_trading" | "trading_to_main";
  status: string;
  created_at: string;
}

// --- Company ---
export interface Company {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  description: string;
  total_supply: number;
  shares_outstanding: number;
  current_price: number;
  market_cap: number;
  eps: number;
  pe_ratio: number;
  book_value: number;
  pbv: number;
  week_52_high: number;
  week_52_low: number;
  avg_120_day: number;
  yield_1_year: number;
  listed_date: string;
  is_active: boolean;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  volume?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyPayload {
  symbol: string;
  name: string;
  sector: string;
  total_supply: number;
}

// --- IPO ---
export interface IPO {
  id: string;
  company_id: string;
  price_per_share: number;
  total_shares: number;
  allocated_shares: number;
  max_per_applicant: number;
  open_at: string;
  close_at: string;
  status: "pending" | "open" | "closed" | "allocated";
  created_at: string;
  updated_at: string;
}

export interface LaunchIPOPayload {
  company_id: string;
  price_per_share: string;
  total_shares: number;
  max_per_applicant: number;
  open_at: string;
  close_at: string;
}

export interface IPOApplication {
  id: string;
  ipo_id: string;
  user_id: string;
  shares_requested: number;
  shares_allocated: number;
  amount_paid: number;
  amount_refunded: number;
  status: "pending" | "allocated" | "not_allocated" | "refunded";
  created_at: string;
  updated_at: string;
}

export interface IPOAllocationResult {
  ipo_id: string;
  total_applications: number;
  total_shares_allocated: number;
  total_shares_not_allocated: number;
  refunds_processed: number;
  timestamp: string;
}

// --- Orders ---
export interface Order {
  id: string;
  user_id: string;
  company_id: string;
  side: "buy" | "sell";
  order_type: "limit" | "market";
  price: number;
  quantity: number;
  filled_qty: number;
  status: "open" | "partially_filled" | "filled" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface PlaceOrderPayload {
  company_id: string;
  quantity: number;
  price: string;
  order_type?: "limit" | "market";
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  orders_count: number;
}

export interface OrderBook {
  symbol: string;
  company_id: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  last_updated: string;
}

// --- Portfolio ---
export interface PortfolioItem {
  id: string;
  user_id: string;
  company_id: string;
  quantity: number;
  avg_buy_price: number;
  created_at: string;
  updated_at: string;
}

// --- Trade ---
export interface Trade {
  id: string;
  company_id: string;
  buy_order_id: string;
  sell_order_id: string;
  buyer_id: string;
  seller_id: string;
  price: number;
  quantity: number;
  total_amount: number;
  created_at: string;
}

export interface CompanyTransaction {
  id: string;
  type: "buy" | "sell";
  price: number;
  quantity: number;
  shares?: number; // Added for compatibility with some API responses
  created_at: string;
}

// --- Market Data ---
export interface LiveTradingData {
  symbol: string;
  company_id: string;
  company_name: string;
  sector: string;
  ltp: number;
  change_percent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previous_close: number;
  difference: number;
  turnover: number;
  last_updated: string;
}

export interface MarketIndex {
  index_value: number;
  change: number;
  change_percent: number;
  total_turnover: number;
  total_volume: number;
  total_market_cap: number;
  advances: number;
  declines: number;
  unchanged: number;
  total_companies: number;
  previous_close: number;
  timestamp: string;
}

export interface CandlestickData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
  change_percent: number;
}

export interface SectorPerformance {
  sector: string;
  company_count: number;
  avg_change_percent: number;
  total_turnover: number;
  total_volume: number;
  total_market_cap: number;
}

export interface PricePrediction {
  company_id: string;
  current_price: number;
  predicted_price: number;
  expected_change: number;
  algorithm: string;
  confidence: number;
  sample_count: number;
}

// --- Events ---
export type EventType =
  | "agm"
  | "dividend"
  | "bonus_share"
  | "right_share"
  | "quarterly_report"
  | "board_meeting"
  | "financial_results"
  | "stock_split"
  | "merger_acquisition"
  | "ipo_announcement";

export interface CompanyEvent {
  id: string;
  company_id: string;
  event_type: EventType;
  title: string;
  description: string;
  event_date: string;
  fiscal_year: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

// --- Price Triggers ---
export interface PriceTrigger {
  id: string;
  user_id: string;
  company_id: string;
  trigger_price: number;
  shares_qty: number;
  direction: "above" | "below";
  status: "active" | "triggered" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface CreateTriggerPayload {
  company_id: string;
  trigger_price: number;
  shares_qty: number;
  direction: "above" | "below";
}

// --- KYC Admin ---
export interface UpdateKYCPayload {
  kyc_status: "pending" | "verified" | "rejected" | "under_review";
  role: "user" | "admin";
}

// --- SSE Price Stream ---
export interface PriceStreamEvent {
  symbol: string;
  company_id: string;
  company_name: string;
  ltp: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}
