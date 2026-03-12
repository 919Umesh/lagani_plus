"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as api from "@/lib/api";
import type { IPO, Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageLoader, ErrorState, EmptyState } from "@/components/ui/spinner";
import { formatNPR, formatNumber, formatDate, formatDateTime } from "@/lib/utils";
import { Landmark, ChevronRight, Clock } from "lucide-react";

export default function IPOListPage() {
  const [ipos, setIPOs] = useState<IPO[]>([]);
  const [companies, setCompanies] = useState<Map<string, Company>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [ipoRes, compRes] = await Promise.all([api.listIPOs(), api.listCompanies(200)]);
        setIPOs(ipoRes.ipos ?? []);
        const map = new Map<string, Company>();
        (compRes.data ?? []).forEach((c) => map.set(c.id, c));
        setCompanies(map);
      } catch {
        setError("Failed to load IPOs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} />;

  const openIPOs = ipos.filter((i) => i.status === "open");
  const pendingIPOs = ipos.filter((i) => i.status === "pending");
  const closedIPOs = ipos.filter((i) => i.status === "closed" || i.status === "allocated");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Landmark className="h-6 w-6 text-emerald-400" /> IPO Center
        </h1>
        <p className="text-sm text-zinc-500">Apply for new Initial Public Offerings on NEPSE simulator</p>
      </div>

      {/* Open IPOs */}
      {openIPOs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Open for Applications</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {openIPOs.map((ipo) => (
              <IPOCard key={ipo.id} ipo={ipo} company={companies.get(ipo.company_id)} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming IPOs */}
      {pendingIPOs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Upcoming IPOs</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingIPOs.map((ipo) => (
              <IPOCard key={ipo.id} ipo={ipo} company={companies.get(ipo.company_id)} />
            ))}
          </div>
        </div>
      )}

      {/* Closed/Allocated */}
      {closedIPOs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Closed / Allocated</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {closedIPOs.map((ipo) => (
              <IPOCard key={ipo.id} ipo={ipo} company={companies.get(ipo.company_id)} />
            ))}
          </div>
        </div>
      )}

      {ipos.length === 0 && <EmptyState message="No IPOs available" />}
    </div>
  );
}

function IPOCard({ ipo, company }: { ipo: IPO; company?: Company }) {
  const allocated = ipo.total_shares > 0 ? (ipo.allocated_shares / ipo.total_shares) * 100 : 0;

  return (
    <Link href={`/ipo/${ipo.id}`}>
      <Card className="h-full transition-colors hover:border-emerald-600/40 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {company?.symbol ?? "Unknown"} - {company?.name ?? "IPO"}
            </CardTitle>
            <Badge variant={ipo.status === "open" ? "success" : ipo.status === "pending" ? "warning" : "outline"}>
              {ipo.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Price per Share</p>
              <p className="font-semibold text-white">{formatNPR(ipo.price_per_share)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Shares</p>
              <p className="font-semibold text-white">{formatNumber(ipo.total_shares)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Max per Applicant</p>
              <p className="font-semibold text-white">{formatNumber(ipo.max_per_applicant)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Sector</p>
              <p className="font-semibold text-white">{company?.sector ?? "—"}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Subscription</span>
              <span>{allocated.toFixed(1)}%</span>
            </div>
            <Progress value={allocated} />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="h-3 w-3" />
            {formatDateTime(ipo.open_at)} — {formatDateTime(ipo.close_at)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
