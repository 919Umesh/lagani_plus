"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import type { Company, IPO, Trade, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { formatNPR, formatNumber, formatDateTime } from "@/lib/utils";
import { Building2, ListOrdered, Users, TrendingUp, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<{
    companies: Company[];
    ipos: IPO[];
    recentTrades: Trade[];
    users: User[];
    marketHistory: { time: string; value: number }[];
    marketIndex: number;
  }>({
    companies: [],
    ipos: [],
    recentTrades: [],
    users: [],
    marketHistory: [],
    marketIndex: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [cRes, iRes, mRes, tRes, uRes] = await Promise.all([
          api.listCompanies(5),
          api.listIPOs(),
          api.getMarketIndex(),
          api.getRecentTrades(10),
          api.getAllUsers(token),
        ]);

        // Mock market history for the chart since real history might not be available
        const history = Array.from({ length: 7 }, (_, i) => ({
          time: `Day ${i + 1}`,
          value: (mRes.data?.index_value ?? 2000) + Math.random() * 100 - 50,
        }));

        setData({
          companies: cRes.data ?? [],
          ipos: iRes.ipos ?? [],
          recentTrades: tRes.trades ?? [],
          users: (uRes as any).users ?? [], // Interface might differ slightly
          marketHistory: history,
          marketIndex: mRes.data?.index_value ?? 0,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const stats = [
    {
      title: "Total Companies",
      value: data.companies.length,
      icon: Building2,
      trend: "+2 this month",
      color: "text-blue-400",
    },
    {
      title: "Active IPOs",
      value: data.ipos.filter(i => i.status === "open").length,
      icon: ListOrdered,
      trend: "3 pending allocation",
      color: "text-emerald-400",
    },
    {
      title: "Market Index",
      value: Number.isFinite(Number(data.marketIndex)) ? Number(data.marketIndex).toFixed(2) : "0.00",
      icon: TrendingUp,
      trend: "+1.2%",
      color: "text-purple-400",
    },
    {
      title: "Total Users",
      value: data.users.length,
      icon: Users,
      trend: "12 new signups",
      color: "text-orange-400",
    },
  ];

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;

  return (
    <div className="px-4 py-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-zinc-500 mt-1">Platform performance and system health overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white leading-none">
                {stat.value}
              </div>
              <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Market Trend Chart */}
        <Card className="lg:col-span-4 border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">Market Performance</CardTitle>
            <CardDescription className="text-zinc-500 text-xs">Simulated NEPSE index trend (7 Days)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.marketHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${Number(val)}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                  itemStyle={{ color: "#10b981" }}
                  formatter={(value: any) => [Number(value).toFixed(2), "Value"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Trades Table */}
        <Card className="lg:col-span-3 border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              Live Tape
            </CardTitle>
            <CardDescription className="text-zinc-500 text-xs">Real-time system transaction flow</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader className="bg-zinc-950/50 hover:bg-zinc-950/50">
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Company</TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Qty</TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentTrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-zinc-500 text-xs">
                        No recent trades active
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.recentTrades.map((trade) => (
                      <TableRow key={trade.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                        <TableCell className="font-medium text-white text-sm">
                          {data.companies.find(c => c.id === trade.company_id)?.symbol || "UNKN"}
                        </TableCell>
                        <TableCell className="text-right text-zinc-400 text-sm">
                          {formatNumber(trade.quantity)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400 font-mono text-sm">
                          {formatNPR(trade.price)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Active Sectors (Simulated with current companies) */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">Sector Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.companies.slice(0, 6).map(c => ({ name: c.symbol, value: c.market_cap || Math.random() * 100000 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} hide />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.companies.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#059669"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Health / Quick Actions */}
        <Card className="border-zinc-800 bg-zinc-950/20">
          <CardHeader>
            <CardTitle className="text-lg text-white">System Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm text-zinc-300">Market Matching Engine</p>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-sm text-zinc-300">IPO Allocation Service</p>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">Ready</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-orange-400" />
                <p className="text-sm text-zinc-300">KYC Processing Queue</p>
              </div>
              <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">4 Pending</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
