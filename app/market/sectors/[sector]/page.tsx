"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as api from "@/lib/api";
import type { LiveTradingData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PageLoader, EmptyState, ErrorState } from "@/components/ui/spinner";
import { formatNPR, formatPercent, formatNumber, changeColor, abbreviateNumber } from "@/lib/utils";

export default function SectorCompaniesPage() {
  const params = useParams();
  const sector = decodeURIComponent(params.sector as string);
  const [data, setData] = useState<LiveTradingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getCompaniesBySector(sector);
        setData(res.data ?? []);
      } catch {
        setError("Failed to load sector data");
      } finally {
        setLoading(false);
      }
    })();
  }, [sector]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{sector} Sector</h1>
        <p className="text-sm text-zinc-500">Companies in the {sector} sector</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {data.length === 0 ? (
            <EmptyState message="No companies in this sector" />
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
                    <TableCell className="text-right">{formatNPR(d.ltp)}</TableCell>
                    <TableCell className={`text-right ${changeColor(d.change_percent)}`}>{formatPercent(d.change_percent)}</TableCell>
                    <TableCell className="text-right">{formatNumber(d.volume)}</TableCell>
                    <TableCell className="text-right">{abbreviateNumber(d.turnover ?? 0)}</TableCell>
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
