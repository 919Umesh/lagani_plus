"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Company, OrderBook, CandlestickData, CompanyTransaction, PricePrediction, CompanyEvent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableRow, TableHead, TableCell, TableHeader } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PageLoader, ErrorState, EmptyState, Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CandleChart } from "@/components/candle-chart";
import { formatNPR, formatPercent, formatNumber, formatDate, formatDateTime, changeColor, abbreviateNumber } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  BarChart3,
  BookOpen,
  Clock,
  Target,
  CalendarDays,
  Brain,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

const StatCard = ({ label, value }: { label: string; value: string | number }) => {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-200">{value}</p>
    </div>
  );
};

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [trades, setTrades] = useState<CompanyTransaction[]>([]);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Trading form
  const [showTrade, setShowTrade] = useState(false);
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [tradeQty, setTradeQty] = useState("");
  const [tradePrice, setTradePrice] = useState("");
  const [tradeType, setTradeType] = useState<"limit" | "market">("limit");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMsg, setTradeMsg] = useState("");

  // Trigger form
  const [showTrigger, setShowTrigger] = useState(false);
  const [triggerPrice, setTriggerPrice] = useState("");
  const [triggerQty, setTriggerQty] = useState("");
  const [triggerDir, setTriggerDir] = useState<"above" | "below">("above");
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [cRes, obRes, trRes, pRes, evRes] = await Promise.all([
          api.getCompanyDetail(id),
          api.getOrderBook(id, token ?? undefined).catch(() => ({ order_book: { symbol: "", company_id: id, bids: [], asks: [], last_updated: new Date().toISOString() } })),
          api.getCompanyTradeHistory(id).catch(() => ({ transactions: [] })),
          api.getPricePrediction(id).catch(() => null),
          api.getCompanyEvents(id).catch(() => ({ events: [] })),
        ]);
        setCompany(cRes.data);
        setOrderBook(obRes.order_book);
        setTrades(trRes.transactions ?? []);
        if (pRes) setPrediction(pRes.data);
        setEvents(evRes.events ?? []);
        if (cRes.data?.symbol) {
          const candleRes = await api.getCandlestick(cRes.data.symbol);
          setCandles(candleRes.data ?? []);
        }
      } catch (err) {
        console.error("Failed to load company detail:", err);
        setError("Failed to load company data");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePlaceOrder = async () => {
    if (!token || !id) return;
    setTradeLoading(true);
    setTradeMsg("");
    try {
      const payload = { company_id: id, quantity: parseInt(tradeQty), price: tradePrice };
      if (tradeSide === "buy") {
        await api.placeBuyOrder({ ...payload, order_type: tradeType }, token);
      } else {
        await api.placeSellOrder(payload, token);
      }
      setTradeMsg(`${tradeSide === "buy" ? "Buy" : "Sell"} order placed successfully!`);
      setTradeQty("");
      setTradePrice("");
    } catch (err) {
      setTradeMsg(err instanceof api.ApiError ? err.message : "Order failed");
    } finally {
      setTradeLoading(false);
    }
  };

  const handleCreateTrigger = async () => {
    if (!token || !id) return;
    setTriggerLoading(true);
    setTriggerMsg("");
    try {
      await api.createTrigger(
        { company_id: id, trigger_price: parseFloat(triggerPrice), shares_qty: parseInt(triggerQty), direction: triggerDir },
        token,
      );
      setTriggerMsg("Price trigger created!");
      setTriggerPrice("");
      setTriggerQty("");
    } catch (err) {
      setTriggerMsg(err instanceof api.ApiError ? err.message : "Failed to create trigger");
    } finally {
      setTriggerLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error || !company) return <ErrorState message={error || "Company not found"} />;

  const priceUp = (prediction?.expected_change ?? 0) >= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      {/* Company header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{company.symbol}</h1>
            <Badge variant="outline">{company.sector}</Badge>
            {company.is_active && <Badge variant="success">Active</Badge>}
          </div>
          <p className="mt-1 text-lg text-zinc-400">{company.name}</p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">{formatNPR(Number(company.current_price))}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {user && (
            <>
              <Button onClick={() => { setTradeSide("buy"); setShowTrade(true); setTradePrice(String(Number(company.current_price) || "")); }}>
                Buy
              </Button>
              <Button variant="destructive" onClick={() => { setTradeSide("sell"); setShowTrade(true); setTradePrice(String(Number(company.current_price) || "")); }}>
                Sell
              </Button>
              <Button variant="outline" onClick={() => { setShowTrigger(true); setTriggerPrice(String(Number(company.current_price) || "")); }}>
                <Target className="mr-1 h-4 w-4" /> Set Alert
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <StatCard label="Market Cap" value={abbreviateNumber(Number(company.market_cap) ?? 0)} />
        <StatCard label="EPS" value={formatNPR(Number(company.eps))} />
        <StatCard
          label="P/E Ratio"
          value={Number.isFinite(Number(company.pe_ratio)) ? Number(company.pe_ratio).toFixed(2) : "—"}
        />
        <StatCard label="Book Value" value={formatNPR(Number(company.book_value))} />
        <StatCard label="52W High" value={formatNPR(Number(company.week_52_high))} />
        <StatCard label="52W Low" value={formatNPR(Number(company.week_52_low))} />
        <StatCard label="120D Avg" value={formatNPR(Number(company.avg_120_day))} />
        <StatCard label="1Y Yield" value={formatPercent(Number(company.yield_1_year))} />
        <StatCard
          label="P/BV"
          value={Number.isFinite(Number(company.pbv)) ? Number(company.pbv).toFixed(2) : "—"}
        />
        <StatCard label="Total Supply" value={formatNumber(Number(company.total_supply))} />
        <StatCard label="Outstanding" value={formatNumber(Number(company.shares_outstanding))} />
        <StatCard label="Listed" value={formatDate(company.listed_date)} />
      </div>

      {/* Prediction */}
      {prediction && (
        <Card className="border-emerald-900/30 bg-emerald-950/10">
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Price Prediction (WMA)</p>
                <p className="text-xs text-zinc-500">Based on last {prediction.sample_count} trades · Confidence: {(prediction.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-zinc-500">Predicted</p>
                <p className="text-lg font-bold text-white">{formatNPR(Number(prediction.predicted_price))}</p>
              </div>
              <div className={`flex items-center gap-1 ${priceUp ? "text-emerald-400" : "text-red-400"}`}>
                {priceUp ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                <span className="font-semibold">{formatPercent(Number(prediction.expected_change))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart & Order Book */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-400" /> Price Chart (1D)</CardTitle>
            </CardHeader>
            <CardContent>
              {candles.length === 0 ? (
                <EmptyState message="No chart data available" />
              ) : (
                <div className="h-[400px]">
                  <CandleChart data={candles} />
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard label="Open" value={formatNPR(Number(company.open_price || company.current_price))} />
                <StatCard label="High" value={formatNPR(Number(company.high_price || company.current_price))} />
                <StatCard label="Low" value={formatNPR(Number(company.low_price || company.current_price))} />
                <StatCard label="Volume" value={formatNumber(Number(company.volume || 0))} />
              </div>
            </CardContent>
          </Card>

          {/* Volume chart */}
          {candles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={candles}>
                    <XAxis dataKey="timestamp" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8 }} />
                    <Bar dataKey="volume" fill="#059669" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Book */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-emerald-400" /> Order Book</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-emerald-400">Bids (Buy)</p>
                  {orderBook?.bids?.length ? (
                    <div className="space-y-1">
                      {orderBook.bids.slice(0, 8).map((b, i) => {
                        const price = Number(b.price ?? (b as any).price);
                        const qty = Number(b.quantity ?? (b as any).quantity);
                        const ordersCount = (b as any).orders_count ?? (b as any).orders ?? 0;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setTradeSide("sell");
                              setTradePrice(String(price || ""));
                              setTradeQty(String(qty || ""));
                              setShowTrade(true);
                            }}
                            className="w-full text-left flex justify-between rounded px-2 py-1 text-sm bg-emerald-950/20 hover:bg-emerald-950/30"
                          >
                            <span className="text-emerald-400 font-medium">{formatNPR(price)}</span>
                            <span className="text-zinc-200">{formatNumber(qty)}</span>
                            <span className="text-zinc-500 text-xs">{ordersCount}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-xs text-zinc-600">No active bids</p>
                  )}
                </div>
                <div className="border-t border-zinc-800/50" />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-red-500">Asks (Sell)</p>
                  {orderBook?.asks?.length ? (
                    <div className="space-y-1">
                      {orderBook.asks.slice(0, 8).map((a, i) => {
                        const price = Number(a.price ?? (a as any).price);
                        const qty = Number(a.quantity ?? (a as any).quantity);
                        const ordersCount = (a as any).orders_count ?? (a as any).orders ?? 0;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setTradeSide("buy");
                              setTradePrice(String(price || ""));
                              setTradeQty(String(qty || ""));
                              setShowTrade(true);
                            }}
                            className="w-full text-left flex justify-between rounded px-2 py-1 text-sm bg-red-950/10 hover:bg-red-950/20"
                          >
                            <span className="text-red-400 font-medium">{formatNPR(price)}</span>
                            <span className="text-zinc-200">{formatNumber(qty)}</span>
                            <span className="text-zinc-500 text-xs">{ordersCount}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-xs text-zinc-600">No active asks</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Trades Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-emerald-400" /> Recent Trades</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {trades.length === 0 ? (
                <EmptyState message="No recent trades" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.slice(0, 10).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs text-zinc-500">{formatDateTime(t.created_at)}</TableCell>
                        <TableCell className="font-medium text-gray-200">{formatNPR(Number(t.price))}</TableCell>
                        <TableCell className="text-right text-zinc-400">{formatNumber(Number(t.shares || t.quantity))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Events and History */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Events column */}
        <div className="lg:col-span-1">
          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-emerald-400" /> Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 5).map((e) => (
                    <div key={e.id} className="rounded-lg border border-zinc-800 p-3 bg-zinc-900/30">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-200">{e.title}</p>
                        <Badge variant="outline" className="text-[10px] uppercase">{e.event_type}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{formatDate(e.event_date)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Trade History column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-emerald-400" /> Trade Book</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {trades.length === 0 ? (
                <EmptyState message="No trade history" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.slice(0, 20).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Badge variant={t.type === "buy" ? "success" : "danger"}>{t.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNPR(Number(t.price))}</TableCell>
                        <TableCell className="text-right">{formatNumber(Number(t.shares || t.quantity))}</TableCell>
                        <TableCell className="text-right text-xs text-zinc-500">{formatDateTime(t.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trade Dialog */}
      <Dialog open={showTrade} onOpenChange={setShowTrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tradeSide === "buy" ? "Buy" : "Sell"} {company.symbol}</DialogTitle>
            <DialogDescription>Place a {tradeSide} order for {company.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {tradeMsg && (
              <div className={`rounded-lg p-3 text-sm ${tradeMsg.includes("success") ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-400" : "bg-red-950/30 border border-red-900/40 text-red-400"}`}>
                {tradeMsg}
              </div>
            )}
            {tradeSide === "buy" && (
              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select value={tradeType} onValueChange={(v) => setTradeType(v as "limit" | "market")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limit">Limit Order</SelectItem>
                    <SelectItem value="market">Market Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Quantity (units)</Label>
              <Input type="number" min={1} value={tradeQty} onChange={(e) => setTradeQty(e.target.value)} placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label>Price per share (NPR)</Label>
              <Input type="number" step="0.01" value={tradePrice} onChange={(e) => setTradePrice(e.target.value)} placeholder="150.00" />
            </div>
            {tradeQty && tradePrice && (
              <p className="text-sm text-zinc-400">
                Total: <span className="font-semibold text-white">{formatNPR(parseFloat(tradeQty) * parseFloat(tradePrice))}</span>
              </p>
            )}
            <Button
              className="w-full"
              variant={tradeSide === "buy" ? "default" : "destructive"}
              disabled={!tradeQty || !tradePrice || tradeLoading}
              onClick={handlePlaceOrder}
            >
              {tradeLoading ? <Spinner className="h-4 w-4" /> : `${tradeSide === "buy" ? "Buy" : "Sell"} ${company.symbol}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trigger Dialog */}
      <Dialog open={showTrigger} onOpenChange={setShowTrigger}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price Alert for {company.symbol}</DialogTitle>
            <DialogDescription>Get notified when the price crosses your target</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {triggerMsg && (
              <div className={`rounded-lg p-3 text-sm ${triggerMsg.includes("created") ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-400" : "bg-red-950/30 border border-red-900/40 text-red-400"}`}>
                {triggerMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={triggerDir} onValueChange={(v) => setTriggerDir(v as "above" | "below")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Price goes Above</SelectItem>
                  <SelectItem value="below">Price goes Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trigger Price (NPR)</Label>
              <Input type="number" step="0.01" value={triggerPrice} onChange={(e) => setTriggerPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={triggerQty} onChange={(e) => setTriggerQty(e.target.value)} />
            </div>
            <Button className="w-full" disabled={!triggerPrice || !triggerQty || triggerLoading} onClick={handleCreateTrigger}>
              {triggerLoading ? <Spinner className="h-4 w-4" /> : "Create Price Alert"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// StatCard utility component
