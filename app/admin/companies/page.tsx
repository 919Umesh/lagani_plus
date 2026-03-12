"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import type { Company, CreateCompanyPayload } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner, ErrorState } from "@/components/ui/spinner";
import { formatNPR, formatNumber } from "@/lib/utils";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const sectors = [
  "Commercial Bank",
  "Development Bank",
  "Finance",
  "Microfinance",
  "Insurance",
  "Hydropower",
  "Manufacturing",
  "Hotel & Tourism",
  "Trading",
  "Investment",
  "Others",
];

const emptyForm: CreateCompanyPayload = {
  name: "",
  symbol: "",
  sector: "Commercial Bank",
  total_supply: 0,
};

export default function AdminCompaniesPage() {
  const { token } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CreateCompanyPayload>({ ...emptyForm });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [open, setOpen] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await api.listCompanies(200);
      setCompanies(res.data ?? []);
    } catch {
      setError("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreate = async () => {
    if (!token) return;
    setCreating(true);
    setCreateError("");
    try {
      await api.createCompany(form, token);
      setForm({ ...emptyForm });
      setOpen(false);
      setLoading(true);
      await fetchCompanies();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to create company");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="px-4 py-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-sm text-zinc-500">Manage listed companies</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Company</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nepal Bank Ltd" />
                </div>
                <div className="space-y-2">
                  <Label>Symbol</Label>
                  <Input value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))} placeholder="NBL" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <select
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  value={form.sector}
                  onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
                >
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Total Supply (shares)</Label>
                <Input type="number" value={form.total_supply || ""} onChange={(e) => setForm((p) => ({ ...p, total_supply: +e.target.value }))} />
              </div>
              {createError && <p className="text-sm text-red-400">{createError}</p>}
              <Button onClick={handleCreate} disabled={creating || !form.name || !form.symbol} className="w-full">
                {creating ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Create Company
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Shares</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-emerald-400">{c.symbol}</TableCell>
                  <TableCell className="text-zinc-300">{c.name}</TableCell>
                  <TableCell className="text-zinc-400">{c.sector}</TableCell>
                  <TableCell className="text-right">{formatNPR(c.current_price)}</TableCell>
                  <TableCell className="text-right">{formatNumber(c.total_supply)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
