"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import type { Trade, WalletTransfer, Company } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader, ErrorState, EmptyState } from "@/components/ui/spinner";
import { formatNPR, formatDateTime } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeftRight, History } from "lucide-react";

export default function TransactionsPage() {
  const { user, token } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
  const [companies, setCompanies] = useState<Map<string, Company>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [tRes, trRes, cRes] = await Promise.all([
          api.getUserTrades(token),
          api.getTransferHistory(token),
          api.listCompanies(200),
        ]);
        setTrades(tRes.trades ?? []);
        setTransfers(trRes.transfers ?? []);
        const map = new Map<string, Company>();
        (cRes.data ?? []).forEach((c) => map.set(c.id, c));
        setCompanies(map);
      } catch {
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <p className="text-zinc-400 mb-4">Please login to view your transactions</p>
          <Link href="/login"><Button>Login</Button></Link>
        </Card>
      </div>
    );
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <History className="h-6 w-6 text-emerald-400" /> Transactions
        </h1>
        <p className="text-sm text-zinc-500">Your trade executions and wallet transfers</p>
      </div>

      <Tabs defaultValue="trades">
        <TabsList>
          <TabsTrigger value="trades">Trade History</TabsTrigger>
          <TabsTrigger value="transfers">Wallet Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="trades">
          <Card>
            <CardContent className="p-0">
              {trades.length === 0 ? (
                <EmptyState message="No trades executed yet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((t, i) => {
                      const comp = companies.get(t.company_id);
                      const total = t.price * t.quantity;
                      return (
                        <TableRow key={`${t.company_id}-${i}`}>
                          <TableCell>
                            <Link href={`/companies/${t.company_id}`} className="font-medium text-emerald-400 hover:underline">
                              {comp?.symbol ?? t.company_id.slice(0, 8)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">Trade</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatNPR(t.price)}</TableCell>
                          <TableCell className="text-right">{t.quantity}</TableCell>
                          <TableCell className="text-right font-medium">{formatNPR(total)}</TableCell>
                          <TableCell className="text-zinc-500 text-sm">{formatDateTime(t.created_at)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardContent className="p-0">
              {transfers.length === 0 ? (
                <EmptyState message="No wallet transfers yet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((tr) => (
                      <TableRow key={tr.id}>
                        <TableCell>
                          <span className="flex items-center gap-2 text-zinc-300">
                            <ArrowLeftRight className="h-4 w-4 text-emerald-400" />
                            {tr.direction === "main_to_trading" ? "Main → Trading" : "Trading → Main"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatNPR(tr.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={tr.status === "completed" ? "success" : "warning"}>{tr.status}</Badge>
                        </TableCell>
                        <TableCell className="text-zinc-500 text-sm">{formatDateTime(tr.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
