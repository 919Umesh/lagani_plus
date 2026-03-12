"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import type { Order, Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader, ErrorState, EmptyState, Spinner } from "@/components/ui/spinner";
import { formatNPR, formatNumber, formatDateTime } from "@/lib/utils";
import { FileText } from "lucide-react";

export default function OrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Map<string, Company>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [oRes, cRes] = await Promise.all([api.getMyOrders(token), api.listCompanies(200)]);
        setOrders(oRes.orders ?? []);
        const map = new Map<string, Company>();
        (cRes.data ?? []).forEach((c) => map.set(c.id, c));
        setCompanies(map);
      } catch {
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleCancel = async (orderId: string) => {
    if (!token) return;
    setCancellingId(orderId);
    try {
      await api.cancelOrder(orderId, token);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)));
    } catch {
      // ignore
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <p className="text-zinc-400 mb-4">Please login to view your orders</p>
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
          <FileText className="h-6 w-6 text-emerald-400" /> My Orders
        </h1>
        <p className="text-sm text-zinc-500">Track and manage your buy/sell orders</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <EmptyState message="No orders yet. Go to a company page to place an order." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Filled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const comp = companies.get(o.company_id);
                  const canCancel = o.status === "open" || o.status === "partially_filled";
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link href={`/companies/${o.company_id}`} className="font-medium text-emerald-400 hover:underline">
                          {comp?.symbol ?? o.company_id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.side === "buy" ? "success" : "danger"}>{o.side}</Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400">{o.order_type}</TableCell>
                      <TableCell className="text-right">{formatNPR(o.price)}</TableCell>
                      <TableCell className="text-right">{formatNumber(o.quantity)}</TableCell>
                      <TableCell className="text-right">{formatNumber(o.filled_qty)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            o.status === "filled" ? "success" : o.status === "cancelled" ? "danger" : "warning"
                          }
                        >
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-sm">{formatDateTime(o.created_at)}</TableCell>
                      <TableCell>
                        {canCancel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            disabled={cancellingId === o.id}
                            onClick={() => handleCancel(o.id)}
                          >
                            {cancellingId === o.id ? <Spinner className="h-3 w-3" /> : "Cancel"}
                          </Button>
                        )}
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
  );
}
