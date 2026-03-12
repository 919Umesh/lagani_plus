"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { IPO, Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PageLoader, ErrorState, Spinner } from "@/components/ui/spinner";
import { formatNPR, formatNumber, formatDateTime } from "@/lib/utils";
import { Landmark, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function IPODetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();

  const [ipo, setIPO] = useState<IPO | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shares, setShares] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const ipoRes = await api.getIPODetail(id);
        setIPO(ipoRes.ipo);
        if (ipoRes.ipo.company_id) {
          const compRes = await api.getCompanyDetail(ipoRes.ipo.company_id).catch(() => null);
          if (compRes) setCompany(compRes.data);
        }
      } catch {
        setError("Failed to load IPO details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleApply = async () => {
    if (!token || !id) return;
    setApplyLoading(true);
    setApplyMsg("");
    try {
      await api.applyForIPO(id, parseInt(shares), token);
      setApplyMsg("Application submitted successfully! Your wallet has been charged.");
      setShares("");
    } catch (err) {
      setApplyMsg(err instanceof api.ApiError ? err.message : "Application failed");
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error || !ipo) return <ErrorState message={error || "IPO not found"} />;

  const allocated = ipo.total_shares > 0 ? (ipo.allocated_shares / ipo.total_shares) * 100 : 0;
  const totalCost = shares ? parseInt(shares) * (ipo.price_per_share || 0) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6 space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Landmark className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">
            {company?.symbol ?? "IPO"} - {company?.name ?? "Initial Public Offering"}
          </h1>
          <Badge variant={ipo.status === "open" ? "success" : ipo.status === "pending" ? "warning" : "outline"}>
            {ipo.status}
          </Badge>
        </div>
        {company && (
          <Link href={`/companies/${company.id}`} className="mt-1 text-sm text-emerald-400 hover:underline flex items-center gap-1">
            View Company Detail <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>IPO Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Price per Share</p>
              <p className="text-lg font-bold text-white">{formatNPR(ipo.price_per_share)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total Shares Offered</p>
              <p className="text-lg font-bold text-white">{formatNumber(ipo.total_shares)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Max per Applicant</p>
              <p className="text-lg font-bold text-white">{formatNumber(ipo.max_per_applicant)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Allocated So Far</p>
              <p className="text-lg font-bold text-white">{formatNumber(ipo.allocated_shares)}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Subscription Progress</span>
              <span>{allocated.toFixed(1)}%</span>
            </div>
            <Progress value={allocated} />
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock className="h-4 w-4" />
            Open: {formatDateTime(ipo.open_at)} — Close: {formatDateTime(ipo.close_at)}
          </div>
        </CardContent>
      </Card>

      {/* Apply Form */}
      {ipo.status === "open" && (
        <Card>
          <CardHeader>
            <CardTitle>Apply for IPO</CardTitle>
            <CardDescription>
              {user ? "Enter the number of shares you want to apply for" : "Please login to apply for this IPO"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user ? (
              <Link href="/login">
                <Button className="w-full">Login to Apply</Button>
              </Link>
            ) : (
              <div className="space-y-4">
                {applyMsg && (
                  <div className={`rounded-lg p-3 text-sm ${applyMsg.includes("success") ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-400" : "bg-red-950/30 border border-red-900/40 text-red-400"}`}>
                    {applyMsg}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Shares to Apply (max: {formatNumber(ipo.max_per_applicant)})</Label>
                  <Input
                    type="number"
                    min={1}
                    max={ipo.max_per_applicant}
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder={`Max ${ipo.max_per_applicant}`}
                  />
                </div>
                {totalCost > 0 && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Total Cost</span>
                      <span className="font-bold text-white">{formatNPR(totalCost)}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">Amount will be deducted from your main wallet</p>
                  </div>
                )}
                <Button className="w-full" disabled={!shares || parseInt(shares) < 1 || applyLoading} onClick={handleApply}>
                  {applyLoading ? <Spinner className="h-4 w-4" /> : "Submit Application"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
