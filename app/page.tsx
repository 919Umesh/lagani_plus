"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import type { MarketIndex, LiveTradingData, IPO, CompanyEvent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader, ErrorState, EmptyState } from "@/components/ui/spinner";
import { formatNPR, formatPercent, formatNumber, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10b981", "#059669", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5", "#047857", "#065f46"];

export default function HomePage() {
  const [index, setIndex] = useState<MarketIndex | null>(null);
  const [gainers, setGainers] = useState<LiveTradingData[]>([]);
  const [losers, setLosers] = useState<LiveTradingData[]>([]);
  const [active, setActive] = useState<LiveTradingData[]>([]);
  const [turnover, setTurnover] = useState<LiveTradingData[]>([]);
  const [ipos, setIPOs] = useState<IPO[]>([]);
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [idxRes, gRes, lRes, aRes, tRes, ipoRes, evtRes] = await Promise.all([
          api.getMarketIndex(),
          api.getTopGainers(5),
          api.getTopLosers(5),
          api.getMostActive(5),
          api.getTopTurnover(5),
          api.listIPOs(),
          api.getUpcomingEvents(5),
        ]);
        setIndex(idxRes.data);
        setGainers(gRes.data);
        setLosers(lRes.data);
        setActive(aRes.data);
        setTurnover(tRes.data);
        setIPOs(ipoRes.ipos?.filter((i) => i.status === "open" || i.status === "pending").slice(0, 4) ?? []);
        setEvents(evtRes.events ?? []);
      } catch {
        setError("Failed to load market data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} />;

  const indexUp = (index?.change ?? 0) >= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      {/* Hero / Market Index */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">NEPSE Index</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-4xl font-bold text-white">
                {index && Number.isFinite(Number(index.index_value)) ? Number(index.index_value).toFixed(2) : "—"}
              </span>
              <span className={`flex items-center gap-1 text-lg font-semibold ${indexUp ? "text-emerald-400" : "text-red-400"}`}>
                {indexUp ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                {index && Number.isFinite(Number(index.change)) ? Number(index.change).toFixed(2) : "—"} ({formatPercent(Number(index?.change_percent))})
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Previous close: {index && Number.isFinite(Number(index.previous_close)) ? Number(index.previous_close).toFixed(2) : "—"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MiniStat label="Total Turnover" value={formatNPR(Number(index?.total_turnover ?? 0))} />
            <MiniStat label="Total Volume" value={formatNumber(Number(index?.total_volume ?? 0))} />
            <MiniStat label="Advances" value={String(index?.advances ?? 0)} color="text-emerald-400" />
            <MiniStat label="Declines" value={String(index?.declines ?? 0)} color="text-red-400" />
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <QuickCard href="/market" icon={BarChart3} label="Market Overview" desc="Browse all companies" />
        <QuickCard href="/ipo" icon={Landmark} label="IPO Center" desc="Apply for new IPOs" />
        <QuickCard href="/market?tab=sectors" icon={Activity} label="Sector Analysis" desc="Performance by sector" />
        <QuickCard href="/events" icon={CalendarDays} label="Events Calendar" desc="Upcoming dividends & AGMs" />
      </div>

      {/* Gainers and Losers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" /> Top Gainers
            </CardTitle>
            <Link href="/market?tab=gainers">
              <Button variant="ghost" size="sm">View All <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {gainers.length === 0 ? (
              <EmptyState message="No gainers data" />
            ) : (
              <div className="space-y-3">
                {gainers.map((s) => (
                  <Link key={s.company_id} href={`/companies/${s.company_id}`} className="flex items-center justify-between rounded-lg p-2 hover:bg-zinc-800/50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-100">{s.symbol}</p>
                      <p className="text-xs text-zinc-500">{s.company_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-100">{formatNPR(Number(s.ltp))}</p>
                      <p className="text-sm text-emerald-400">{formatPercent(Number(s.change_percent))}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-400" /> Top Losers
            </CardTitle>
            <Link href="/market?tab=losers">
              <Button variant="ghost" size="sm">View All <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {losers.length === 0 ? (
              <EmptyState message="No losers data" />
            ) : (
              <div className="space-y-3">
                {losers.map((s) => (
                  <Link key={s.company_id} href={`/companies/${s.company_id}`} className="flex items-center justify-between rounded-lg p-2 hover:bg-zinc-800/50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-100">{s.symbol}</p>
                      <p className="text-xs text-zinc-500">{s.company_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-100">{formatNPR(Number(s.ltp))}</p>
                      <p className="text-sm text-red-400">{formatPercent(Number(s.change_percent))}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Active + Top Turnover charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" /> Most Active (by Volume)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {active.length === 0 ? (
              <EmptyState message="No market activity recorded" />
            ) : (
              <div className="flex flex-col gap-4">
                {/* List View - Always clean and visible */}
                <div className="space-y-2">
                  {active.map((a) => (
                    <div key={a.company_id} className="flex items-center justify-between rounded-lg bg-zinc-900/40 p-3 border border-zinc-800/50 hover:border-emerald-500/30 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-emerald-400">{a.symbol}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-tight">{a.sector}</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[10px] text-zinc-500 font-medium uppercase">Vol:</span>
                          <span className="text-sm font-semibold text-zinc-200">{formatNumber(Number(a.volume))}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">LTP: {formatNPR(Number(a.ltp))}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Visual Chart - Only show if there's actual volume to plot */}
                {active.some(a => Number(a.volume) > 0) && (
                  <div className="pt-2 border-t border-zinc-900">
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={active.map((a) => ({ name: a.symbol, volume: Number(a.volume) || 0 }))}>
                        <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8 }} 
                          labelStyle={{ color: "#f9fafb" }} 
                        />
                        <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" /> Top Turnover
            </CardTitle>
          </CardHeader>
          <CardContent>
            {turnover.length === 0 ? (
              <EmptyState message="No turnover data available" />
            ) : (
              <div className="flex flex-col gap-4">
                {/* Visual Chart - Only show if there's actual positive turnover to plot */}
                {turnover.some(t => Number(t.turnover) > 0) && (
                  <div className="pb-4 border-b border-zinc-900/50">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={turnover.filter(t => Number(t.turnover) > 0).map((t) => ({ name: t.symbol, value: Number(t.turnover) || 0 }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          labelLine={false}
                        >
                          {turnover.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* Data List - Always clean and visible */}
                <div className="space-y-1">
                  {turnover.map((t) => (
                    <div key={t.company_id} className="group flex items-center justify-between rounded-md p-2 hover:bg-zinc-800/30 transition-colors">
                       <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[turnover.indexOf(t) % COLORS.length] }} />
                         <span className="font-bold text-sm text-emerald-400">{t.symbol}</span>
                       </div>
                       <span className="text-[11px] text-zinc-500 hidden md:block">{t.company_name}</span>
                       <span className="font-mono text-xs text-zinc-300 font-medium">{formatNPR(Number(t.turnover))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* IPOs and Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-400" /> Open/Upcoming IPOs
            </CardTitle>
            <Link href="/ipo">
              <Button variant="ghost" size="sm">View All <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ipos.length === 0 ? (
              <EmptyState message="No open IPOs right now" />
            ) : (
              <div className="space-y-3">
                {ipos.map((ipo) => (
                  <Link key={ipo.id} href={`/ipo/${ipo.id}`} className="flex items-center justify-between rounded-lg border border-zinc-800 p-3 hover:bg-zinc-800/50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-100">IPO #{ipo.id.slice(0, 8)}</p>
                      <p className="text-xs text-zinc-500">
                        {formatNPR(ipo.price_per_share)} per share · {formatNumber(ipo.total_shares)} shares
                      </p>
                    </div>
                    <Badge variant={ipo.status === "open" ? "success" : "warning"}>
                      {ipo.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-400" /> Upcoming Events
            </CardTitle>
            <Link href="/events">
              <Button variant="ghost" size="sm">View All <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <EmptyState message="No upcoming events" />
            ) : (
              <div className="space-y-3">
                {events.map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between rounded-lg border border-zinc-800 p-3">
                    <div>
                      <p className="font-medium text-gray-100">{evt.title}</p>
                      <p className="text-xs text-zinc-500">{formatDate(evt.event_date)}</p>
                    </div>
                    <Badge variant="outline">{evt.event_type.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${color ?? "text-gray-100"}`}>{value}</p>
    </div>
  );
}

function QuickCard({ href, icon: Icon, label, desc }: { href: string; icon: React.ElementType; label: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="h-full cursor-pointer transition-colors hover:border-emerald-600/40 hover:bg-zinc-800/30">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10">
            <Icon className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-gray-100">{label}</p>
            <p className="text-xs text-zinc-500">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}