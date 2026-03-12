"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as api from "@/lib/api";
import type { LiveTradingData, Company, SectorPerformance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageLoader, EmptyState, ErrorState } from "@/components/ui/spinner";
import { formatNPR, formatPercent, formatNumber, changeColor, abbreviateNumber } from "@/lib/utils";
import { Search, TrendingUp, TrendingDown, Activity, BarChart3, Layers } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function MarketPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MarketPageInner />
    </Suspense>
  );
}

function MarketPageInner() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "all";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [liveData, setLiveData] = useState<LiveTradingData[]>([]);
  const [gainers, setGainers] = useState<LiveTradingData[]>([]);
  const [losers, setLosers] = useState<LiveTradingData[]>([]);
  const [active, setActive] = useState<LiveTradingData[]>([]);
  const [sectors, setSectors] = useState<SectorPerformance[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [cRes, lRes, gRes, loRes, aRes, sRes] = await Promise.all([
          api.listCompanies(100),
          api.getLiveTrading(),
          api.getTopGainers(20),
          api.getTopLosers(20),
          api.getMostActive(20),
          api.getSectorPerformance(),
        ]);
        setCompanies(cRes.data ?? []);
        setLiveData(lRes.data ?? []);
        setGainers(gRes.data ?? []);
        setLosers(loRes.data ?? []);
        setActive(aRes.data ?? []);
        setSectors(sRes.data ?? []);
      } catch {
        setError("Failed to load market data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} />;

  const filteredLive = liveData.filter(
    (d) =>
      d.symbol?.toLowerCase().includes(search.toLowerCase()) ||
      d.company_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredCompanies = companies.filter(
    (c) =>
      c.symbol?.toLowerCase().includes(search.toLowerCase()) ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.sector?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Overview</h1>
          <p className="text-sm text-zinc-500">Browse NEPSE-simulated stocks, sectors, and market movers</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search by symbol or name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all"><BarChart3 className="mr-1 h-3.5 w-3.5" /> All Stocks</TabsTrigger>
          <TabsTrigger value="live"><Activity className="mr-1 h-3.5 w-3.5" /> Live</TabsTrigger>
          <TabsTrigger value="gainers"><TrendingUp className="mr-1 h-3.5 w-3.5" /> Gainers</TabsTrigger>
          <TabsTrigger value="losers"><TrendingDown className="mr-1 h-3.5 w-3.5" /> Losers</TabsTrigger>
          <TabsTrigger value="active"><Activity className="mr-1 h-3.5 w-3.5" /> Active</TabsTrigger>
          <TabsTrigger value="sectors"><Layers className="mr-1 h-3.5 w-3.5" /> Sectors</TabsTrigger>
        </TabsList>

        {/* All Companies */}
        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              {filteredCompanies.length === 0 ? (
                <EmptyState message="No companies found" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Market Cap</TableHead>
                      <TableHead className="text-right">P/E</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Link href={`/companies/${c.id}`} className="font-medium text-emerald-400 hover:underline">
                            {c.symbol}
                          </Link>
                        </TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell><Badge variant="outline">{c.sector}</Badge></TableCell>
                        <TableCell className="text-right">{formatNPR(Number(c.current_price))}</TableCell>
                        <TableCell className="text-right">{abbreviateNumber(Number(c.market_cap ?? 0))}</TableCell>
                        <TableCell className="text-right">{c.pe_ratio !== undefined && Number.isFinite(Number(c.pe_ratio)) ? Number(c.pe_ratio).toFixed(2) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Trading */}
        <TabsContent value="live">
          <Card>
            <CardContent className="p-0">
              {filteredLive.length === 0 ? (
                <EmptyState message="No live data" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>LTP</TableHead>
                      <TableHead>Change %</TableHead>
                      <TableHead className="text-right">High</TableHead>
                      <TableHead className="text-right">Low</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Turnover</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLive.map((d) => (
                      <TableRow key={d.company_id}>
                        <TableCell>
                          <Link href={`/companies/${d.company_id}`} className="font-medium text-emerald-400 hover:underline">
                            {d.symbol}
                          </Link>
                        </TableCell>
                        <TableCell>{formatNPR(Number(d.ltp))}</TableCell>
                        <TableCell className={changeColor(Number(d.change_percent))}>{formatPercent(Number(d.change_percent))}</TableCell>
                        <TableCell className="text-right">{formatNPR(Number(d.high))}</TableCell>
                        <TableCell className="text-right">{formatNPR(Number(d.low))}</TableCell>
                        <TableCell className="text-right">{formatNumber(Number(d.volume))}</TableCell>
                        <TableCell className="text-right">{abbreviateNumber(Number(d.turnover ?? 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Gainers */}
        <TabsContent value="gainers">
          <LiveTable data={gainers} title="Top Gainers" />
        </TabsContent>

        {/* Top Losers */}
        <TabsContent value="losers">
          <LiveTable data={losers} title="Top Losers" />
        </TabsContent>

        {/* Most Active */}
        <TabsContent value="active">
          <LiveTable data={active} title="Most Active" />
        </TabsContent>

        {/* Sectors */}
        <TabsContent value="sectors">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sector Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {sectors.length === 0 ? (
                  <EmptyState message="No sector data" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sectors.map((s) => ({ name: s.sector, change: s.avg_change_percent }))}>
                      <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8 }} />
                      <Bar dataKey="change" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-right">Companies</TableHead>
                      <TableHead className="text-right">Avg Change</TableHead>
                      <TableHead className="text-right">Total Volume</TableHead>
                      <TableHead className="text-right">Total Turnover</TableHead>
                      <TableHead className="text-right">Market Cap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectors.map((s) => (
                      <TableRow key={s.sector}>
                        <TableCell>
                          <Link href={`/market/sectors/${encodeURIComponent(s.sector)}`} className="font-medium text-emerald-400 hover:underline">
                            {s.sector}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">{s.company_count}</TableCell>
                        <TableCell className={`text-right ${changeColor(Number(s.avg_change_percent))}`}>{formatPercent(Number(s.avg_change_percent))}</TableCell>
                        <TableCell className="text-right">{formatNumber(Number(s.total_volume))}</TableCell>
                        <TableCell className="text-right">{abbreviateNumber(Number(s.total_turnover))}</TableCell>
                        <TableCell className="text-right">{abbreviateNumber(Number(s.total_market_cap))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LiveTable({ data, title }: { data: LiveTradingData[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <EmptyState message={`No ${title.toLowerCase()} data`} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">LTP</TableHead>
                <TableHead className="text-right">Change %</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Turnover</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.company_id}>
                  <TableCell>
                    <Link href={`/companies/${d.company_id}`} className="font-medium text-emerald-400 hover:underline">
                      {d.symbol}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">{d.company_name}</TableCell>
                  <TableCell className="text-right">{formatNPR(Number(d.ltp))}</TableCell>
                  <TableCell className={`text-right ${changeColor(Number(d.change_percent))}`}>{formatPercent(Number(d.change_percent))}</TableCell>
                  <TableCell className="text-right">{formatNumber(Number(d.volume))}</TableCell>
                  <TableCell className="text-right">{abbreviateNumber(Number(d.turnover ?? 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
