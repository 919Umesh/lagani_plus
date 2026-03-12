"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatNPR } from "@/lib/utils";
import { DollarSign, Wallet } from "lucide-react";

export default function AdminWalletsPage() {
  const { token } = useAuth();
  const [mainWallet, setMainWallet] = useState<{ balance: number } | null>(null);
  const [tradingWallet, setTradingWallet] = useState<{ balance: number; locked_balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [mRes, tRes] = await Promise.all([
          api.getMainWallet(token),
          api.getTradingWallet(token),
        ]);
        setMainWallet(mRes.wallet ?? mRes);
        setTradingWallet(tRes.wallet ?? tRes);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="px-4 py-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-emerald-400" /> Wallets Overview
        </h1>
        <p className="text-sm text-zinc-500">System wallet balances</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Main Wallet</CardTitle>
              <Wallet className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{formatNPR(mainWallet?.balance ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Trading Wallet</CardTitle>
              <Wallet className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{formatNPR(tradingWallet?.balance ?? 0)}</p>
              <p className="text-xs text-zinc-500 mt-1">Locked: {formatNPR(tradingWallet?.locked_balance ?? 0)}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
