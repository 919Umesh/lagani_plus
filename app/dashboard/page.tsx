"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import type { MainWallet, TradingWallet, PortfolioItem, Order, Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageLoader, ErrorState, EmptyState, Spinner } from "@/components/ui/spinner";
import { formatNPR, formatNumber, formatDate } from "@/lib/utils";
import {
  Wallet,
  Briefcase,
  ArrowUpDown,
  TrendingUp,
  Plus,
  ArrowRightLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#10b981", "#059669", "#34d399", "#6ee7b7", "#a7f3d0", "#047857", "#065f46", "#0d9488"];

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [mainWallet, setMainWallet] = useState<MainWallet | null>(null);
  const [tradingWallet, setTradingWallet] = useState<TradingWallet | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Map<string, Company>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wallet actions
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmt, setTopupAmt] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupMsg, setTopupMsg] = useState("");

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmt, setTransferAmt] = useState("");
  const [transferDir, setTransferDir] = useState<"main_to_trading" | "trading_to_main">("main_to_trading");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [wRes, pRes, oRes, cRes] = await Promise.all([
          api.getAllWallets(token),
          api.getPortfolio(token),
          api.getMyOrders(token),
          api.listCompanies(200),
        ]);
        setMainWallet(wRes.main_wallet);
        setTradingWallet(wRes.trading_wallet);
        setPortfolio(pRes.portfolio ?? []);
        setRecentOrders((oRes.orders ?? []).slice(0, 5));
        const map = new Map<string, Company>();
        (cRes.data ?? []).forEach((c) => map.set(c.id, c));
        setCompanies(map);
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleTopup = async () => {
    if (!token) return;
    setTopupLoading(true);
    setTopupMsg("");
    try {
      const res = await api.topUpWallet(topupAmt, token);
      setMainWallet(res.wallet);
      setTopupMsg("Top-up successful!");
      setTopupAmt("");
    } catch (err) {
      setTopupMsg(err instanceof api.ApiError ? err.message : "Top-up failed");
    } finally {
      setTopupLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!token) return;
    setTransferLoading(true);
    setTransferMsg("");
    try {
      const res = await api.transferWallet(transferAmt, transferDir, token);
      setMainWallet(res.main_wallet);
      setTradingWallet(res.trading_wallet);
      setTransferMsg("Transfer successful!");
      setTransferAmt("");
    } catch (err) {
      setTransferMsg(err instanceof api.ApiError ? err.message : "Transfer failed");
    } finally {
      setTransferLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <p className="text-zinc-400 mb-4">Please login to access your dashboard</p>
          <Link href="/login"><Button>Login</Button></Link>
        </Card>
      </div>
    );
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} />;

  const portfolioValue = portfolio.reduce((sum, p) => {
    const comp = companies.get(p.company_id);
    return sum + p.quantity * (comp?.current_price ?? p.avg_buy_price);
  }, 0);

  const portfolioChartData = portfolio.map((p) => {
    const comp = companies.get(p.company_id);
    return {
      name: comp?.symbol ?? p.company_id.slice(0, 6),
      value: p.quantity * (comp?.current_price ?? p.avg_buy_price),
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {user.full_name?.split(" ")[0]}</h1>
        <p className="text-sm text-zinc-500">Your trading dashboard overview</p>
      </div>

      {/* Wallet Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-950/40 to-zinc-900 border-emerald-900/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400/70 font-medium uppercase">Main Wallet</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatNPR(mainWallet?.balance ?? 0)}</p>
              </div>
              <Wallet className="h-8 w-8 text-emerald-400/40" />
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => setShowTopup(true)} className="gap-1">
                <Plus className="h-3 w-3" /> Top Up
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowTransfer(true)} className="gap-1">
                <ArrowRightLeft className="h-3 w-3" /> Transfer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Trading Wallet</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatNPR(tradingWallet?.balance ?? 0)}</p>
                <p className="text-xs text-zinc-500 mt-1">Locked: {formatNPR(tradingWallet?.locked_balance ?? 0)}</p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-zinc-700" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase">Portfolio Value</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatNPR(portfolioValue)}</p>
                <p className="text-xs text-zinc-500 mt-1">{portfolio.length} holdings</p>
              </div>
              <Briefcase className="h-8 w-8 text-zinc-700" />
            </div>
            <div className="mt-3">
              <Link href="/portfolio">
                <Button variant="ghost" size="sm" className="gap-1">View Portfolio <ChevronRight className="h-3 w-3" /></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio allocation + Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-400" /> Portfolio Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioChartData.length === 0 ? (
              <EmptyState message="No holdings yet. Start trading!" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={portfolioChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {portfolioChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8 }} formatter={(val) => formatNPR(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" /> Recent Orders
            </CardTitle>
            <Link href="/orders">
              <Button variant="ghost" size="sm">View All <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <EmptyState message="No orders yet" />
            ) : (
              <div className="space-y-3">
                {recentOrders.map((o) => {
                  const comp = companies.get(o.company_id);
                  return (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-zinc-800 p-3">
                      <div>
                        <div className="flex items-center gap-2 font-medium text-gray-200">
                          {comp?.symbol ?? o.company_id.slice(0, 8)}
                          <Badge variant={o.side === "buy" ? "success" : "danger"}>{o.side}</Badge>
                        </div>
                        <p className="text-xs text-zinc-500">{o.quantity} units @ {formatNPR(o.price)}</p>
                      </div>
                      <Badge variant="outline">{o.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top-up Dialog */}
      <Dialog open={showTopup} onOpenChange={setShowTopup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Main Wallet</DialogTitle>
            <DialogDescription>Add funds to your main wallet (simulated)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {topupMsg && (
              <div className={`rounded-lg p-3 text-sm ${topupMsg.includes("success") ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-400" : "bg-red-950/30 border border-red-900/40 text-red-400"}`}>
                {topupMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label>Amount (NPR)</Label>
              <Input type="number" step="0.01" min={1} value={topupAmt} onChange={(e) => setTopupAmt(e.target.value)} placeholder="10000" />
            </div>
            <div className="flex gap-2">
              {["1000", "5000", "10000", "50000", "100000"].map((v) => (
                <Button key={v} variant="outline" size="sm" onClick={() => setTopupAmt(v)}>
                  {formatNumber(parseInt(v))}
                </Button>
              ))}
            </div>
            <Button className="w-full" disabled={!topupAmt || topupLoading} onClick={handleTopup}>
              {topupLoading ? <Spinner className="h-4 w-4" /> : `Top Up ${topupAmt ? formatNPR(parseFloat(topupAmt)) : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Between Wallets</DialogTitle>
            <DialogDescription>Move funds between your main and trading wallets</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {transferMsg && (
              <div className={`rounded-lg p-3 text-sm ${transferMsg.includes("success") ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-400" : "bg-red-950/30 border border-red-900/40 text-red-400"}`}>
                {transferMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={transferDir} onValueChange={(v) => setTransferDir(v as "main_to_trading" | "trading_to_main")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main_to_trading">Main → Trading</SelectItem>
                  <SelectItem value="trading_to_main">Trading → Main</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (NPR)</Label>
              <Input type="number" step="0.01" min={1} value={transferAmt} onChange={(e) => setTransferAmt(e.target.value)} placeholder="5000" />
            </div>
            <Button className="w-full" disabled={!transferAmt || transferLoading} onClick={handleTransfer}>
              {transferLoading ? <Spinner className="h-4 w-4" /> : "Transfer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
