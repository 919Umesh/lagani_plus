"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import type { IPO, Company, LaunchIPOPayload, IPOApplication, IPOAllocationResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner, EmptyState } from "@/components/ui/spinner";
import { formatNPR, formatDateTime, formatNumber } from "@/lib/utils";
import { Plus, Shuffle, Eye, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminIPOsPage() {
  const { token } = useAuth();
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesMap, setCompaniesMap] = useState<Map<string, Company>>(new Map());
  const [view, setView] = useState<"list" | "applications">("list");
  const [loading, setLoading] = useState(true);

  // Launch IPO form
  const [launchOpen, setLaunchOpen] = useState(false);
  const [launchForm, setLaunchForm] = useState<LaunchIPOPayload>({
    company_id: "",
    price_per_share: "0",
    total_shares: 0,
    max_per_applicant: 100,
    open_at: "",
    close_at: "",
  });
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState("");

  // Allocate
  const [allocateId, setAllocateId] = useState<string | null>(null);
  const [allocating, setAllocating] = useState(false);
  const [allocResult, setAllocResult] = useState<IPOAllocationResult | null>(null);

  // Applications
  const [appIpoId, setAppIpoId] = useState<string | null>(null);
  const [applications, setApplications] = useState<IPOApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const fetchData = async () => {
    try {
      const [iRes, cRes] = await Promise.all([api.listIPOs(), api.listCompanies(200)]);
      setIpos(iRes.ipos ?? []);
      const cl = cRes.data ?? [];
      setCompanies(cl);
      const m = new Map<string, Company>();
      cl.forEach((c) => m.set(c.id, c));
      setCompaniesMap(m);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLaunch = async () => {
    if (!token) return;
    setLaunching(true);
    setLaunchError("");
    try {
      // Ensure datetime-local values are converted to RFC3339 (ISO) before sending
      const toRFC3339 = (dt: string) => {
        if (!dt) return "";
        const d = new Date(dt);
        if (Number.isNaN(d.getTime())) return "";
        return d.toISOString();
      };

      if (!launchForm.open_at || !launchForm.close_at) {
        setLaunchError("Open and close dates are required");
        setLaunching(false);
        return;
      }

      const openISO = toRFC3339(launchForm.open_at);
      const closeISO = toRFC3339(launchForm.close_at);
      if (!openISO || !closeISO) {
        setLaunchError("Invalid date format (use the picker)");
        setLaunching(false);
        return;
      }

      if (new Date(openISO) >= new Date(closeISO)) {
        setLaunchError("Open date must be before close date");
        setLaunching(false);
        return;
      }

      const payload: LaunchIPOPayload = {
        ...launchForm,
        open_at: openISO,
        close_at: closeISO,
      };

      await api.launchIPO(payload, token);
      setLaunchOpen(false);
      setLoading(true);
      await fetchData();
    } catch (e: unknown) {
      setLaunchError(e instanceof Error ? e.message : "Failed to launch IPO");
    } finally {
      setLaunching(false);
    }
  };

  const handleAllocate = async (ipoId: string) => {
    if (!token) return;
    setAllocateId(ipoId);
    setAllocating(true);
    setAllocResult(null);
    try {
      const res = await api.allocateIPO(ipoId, token);
      setAllocResult(res.result ?? res);
      await fetchData();
    } catch {
      // ignore
    } finally {
      setAllocating(false);
    }
  };

  const handleViewApps = async (ipoId: string) => {
    if (!token) return;
    setAppIpoId(ipoId);
    setLoadingApps(true);
    setView("applications");

    try {
      const res = await api.getIPOApplicationsAdmin(ipoId, token);
      setApplications(res.applications ?? []);
    } catch {
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;

  // Find companies that don't already have IPOs (for launch dropdown)
  const ipoCompanyIds = new Set(ipos.map((i) => i.company_id));

  return (
    <div className="px-4 py-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {view === "applications" ? (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setView("list")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-8">
                <div>
                  <h1 className="text-2xl font-bold text-white">IPO Applications</h1>
                  <p className="text-sm text-zinc-500">
                    Viewing applications for {companiesMap.get(ipos.find((i) => i.id === appIpoId)?.company_id ?? "")?.symbol ?? "IPO"}
                  </p>
                </div>
                {(() => {
                  const currentIpo = ipos.find((i) => i.id === appIpoId);
                  // Show if status is closed OR if there's at least one pending application
                  const hasPending = applications.some(a => a.status === "pending");
                  
                  if (currentIpo?.status === "closed" || (currentIpo?.status === "open" && hasPending)) {
                    return (
                      <Button
                        onClick={() => appIpoId && handleAllocate(appIpoId)}
                        disabled={allocating && allocateId === appIpoId}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {allocating && allocateId === appIpoId ? (
                          <Spinner className="h-4 w-4 mr-2" />
                        ) : (
                          <Shuffle className="h-4 w-4 mr-2" />
                        )}
                        Run Random Allocation
                      </Button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white">IPO Management</h1>
              <p className="text-sm text-zinc-500">Launch, allocate, and manage IPOs</p>
            </>
          )}
        </div>
        {view === "list" && (
          <Dialog open={launchOpen} onOpenChange={setLaunchOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Launch IPO</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Launch IPO</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <select
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    value={launchForm.company_id}
                    onChange={(e) => setLaunchForm((p) => ({ ...p, company_id: e.target.value }))}
                  >
                    <option value="">Select a company...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.symbol} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price per Share (NPR)</Label>
                    <Input type="number" value={launchForm.price_per_share || ""} onChange={(e) => setLaunchForm((p) => ({ ...p, price_per_share: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Shares</Label>
                    <Input type="number" value={launchForm.total_shares || ""} onChange={(e) => setLaunchForm((p) => ({ ...p, total_shares: +e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max per Applicant</Label>
                  <Input type="number" value={launchForm.max_per_applicant || ""} onChange={(e) => setLaunchForm((p) => ({ ...p, max_per_applicant: +e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Open Date</Label>
                    <Input type="datetime-local" value={launchForm.open_at} onChange={(e) => setLaunchForm((p) => ({ ...p, open_at: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Close Date</Label>
                    <Input type="datetime-local" value={launchForm.close_at} onChange={(e) => setLaunchForm((p) => ({ ...p, close_at: e.target.value }))} />
                  </div>
                </div>
                {launchError && <p className="text-sm text-red-400">{launchError}</p>}
                <Button onClick={handleLaunch} disabled={launching || !launchForm.company_id} className="w-full">
                  {launching ? <Spinner className="h-4 w-4 mr-2" /> : null}
                  Launch IPO
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {view === "list" ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              {ipos.length === 0 ? (
                <EmptyState message="No IPOs yet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Close Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipos.map((ipo) => {
                      const comp = companiesMap.get(ipo.company_id);
                      return (
                        <TableRow key={ipo.id}>
                          <TableCell className="font-medium text-emerald-400">{comp?.symbol ?? ipo.company_id.slice(0, 8)}</TableCell>
                          <TableCell className="text-right">{formatNPR(ipo.price_per_share)}</TableCell>
                          <TableCell className="text-right">{formatNumber(ipo.total_shares)}</TableCell>
                          <TableCell>
                            <Badge variant={ipo.status === "open" ? "success" : ipo.status === "closed" ? "danger" : ipo.status === "allocated" ? "outline" : "warning"}>
                              {ipo.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-500 text-sm">{formatDateTime(ipo.close_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewApps(ipo.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" /> Apps
                              </Button>
                              {(ipo.status === "closed") && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleAllocate(ipo.id)}
                                  disabled={allocating && allocateId === ipo.id}
                                >
                                  {allocating && allocateId === ipo.id ? (
                                    <Spinner className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Shuffle className="h-3 w-3 mr-1" />
                                  )}
                                  Allocate Shares
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {allocResult && (
            <Card className="border-emerald-500/50 bg-emerald-500/5">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                  <Shuffle className="h-5 w-5" /> Allocation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase">Applications</p>
                  <p className="text-xl font-bold text-white">{allocResult.total_applications}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase">Allocated</p>
                  <p className="text-xl font-bold text-emerald-400">{formatNumber(allocResult.total_shares_allocated)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase">Not Allocated</p>
                  <p className="text-xl font-bold text-red-400">{formatNumber(allocResult.total_shares_not_allocated)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 uppercase">Refunds</p>
                  <p className="text-xl font-bold text-blue-400">{allocResult.refunds_processed}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {loadingApps ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          <EmptyState message="No applications for this IPO" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      applications.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-zinc-400 text-xs font-mono">{a.user_id}</TableCell>
                          <TableCell className="text-right">{a.shares_requested}</TableCell>
                          <TableCell>
                            <Badge variant={a.status === "allocated" ? "success" : a.status === "not_allocated" ? "danger" : "warning"}>
                              {a.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-500 text-sm">{formatDateTime(a.created_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
