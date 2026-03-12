"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import type { PortfolioItem, Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageLoader, ErrorState, EmptyState } from "@/components/ui/spinner";
import { formatNPR, formatPercent, formatNumber, changeColor } from "@/lib/utils";
import { Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const COLORS = ["#10b981", "#059669", "#34d399", "#6ee7b7", "#a7f3d0", "#047857"];

export default function PortfolioPage() {
  const { user, token } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [companies, setCompanies] = useState<Map<string, Company>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([api.getPortfolio(token), api.listCompanies(200)]);
        setPortfolio(pRes.portfolio ?? []);
        const map = new Map<string, Company>();
        (cRes.data ?? []).forEach((c) => map.set(c.id, c));
        setCompanies(map);
      } catch {
        setError("Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <p className="text-zinc-400 mb-4">Please login to view your portfolio</p>
          <Link href="/login"><Button>Login</Button></Link>
        </Card>
      </div>
    );
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} />;

  const enriched = portfolio.map((p) => {
    const comp = companies.get(p.company_id);
    const currentPrice = comp?.current_price ?? p.avg_buy_price;
    const currentValue = p.quantity * currentPrice;
    const investedValue = p.quantity * p.avg_buy_price;
    const pnl = currentValue - investedValue;
    const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
    return { ...p, comp, currentPrice, currentValue, investedValue, pnl, pnlPercent };
  });

  const totalValue = enriched.reduce((s, e) => s + e.currentValue, 0);
  const totalInvested = enriched.reduce((s, e) => s + e.investedValue, 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const allocationData = enriched.map((e) => ({
    name: e.comp?.symbol ?? e.company_id.slice(0, 6),
    value: e.currentValue,
  }));

  const pnlData = enriched.map((e) => ({
    name: e.comp?.symbol ?? e.company_id.slice(0, 6),
    pnl: e.pnl,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-emerald-400" /> My Portfolio
        </h1>
        <p className="text-sm text-zinc-500">Track your stock holdings and profit/loss</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-zinc-500 uppercase">Total Value</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatNPR(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-zinc-500 uppercase">Total Invested</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatNPR(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-zinc-500 uppercase">Overall P&L</p>
            <p className={`mt-1 text-2xl font-bold ${changeColor(totalPnl)}`}>{formatNPR(totalPnl)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-zinc-500 uppercase">Return</p>
            <p className={`mt-1 text-2xl font-bold flex items-center gap-1 ${changeColor(totalPnlPercent)}`}>
              {totalPnlPercent >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {formatPercent(totalPnlPercent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationData.length === 0 ? (
              <EmptyState message="No holdings" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name }) => name}>
                    {allocationData.map((_, i) => (
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
          <CardHeader>
            <CardTitle>Profit / Loss by Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {pnlData.length === 0 ? (
              <EmptyState message="No holdings" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pnlData}>
                  <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8 }} formatter={(val) => formatNPR(Number(val))} />
                  <Bar
                    dataKey="pnl"
                    radius={[4, 4, 0, 0]}
                    fill="#10b981"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {enriched.length === 0 ? (
            <EmptyState message="You don't own any shares yet. Start trading!" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Avg Buy Price</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead className="text-right">Return</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link href={`/companies/${e.company_id}`} className="font-medium text-emerald-400 hover:underline">
                        {e.comp?.symbol ?? e.company_id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(e.quantity)}</TableCell>
                    <TableCell className="text-right">{formatNPR(e.avg_buy_price)}</TableCell>
                    <TableCell className="text-right">{formatNPR(e.currentPrice)}</TableCell>
                    <TableCell className="text-right">{formatNPR(e.investedValue)}</TableCell>
                    <TableCell className="text-right">{formatNPR(e.currentValue)}</TableCell>
                    <TableCell className={`text-right font-medium ${changeColor(e.pnl)}`}>{formatNPR(e.pnl)}</TableCell>
                    <TableCell className={`text-right ${changeColor(e.pnlPercent)}`}>{formatPercent(e.pnlPercent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
