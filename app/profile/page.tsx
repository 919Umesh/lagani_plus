"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import type { PriceTrigger, Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader, ErrorState, Spinner } from "@/components/ui/spinner";
import { formatNPR, formatDateTime } from "@/lib/utils";
import { User, Camera, Bell, X } from "lucide-react";

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [triggers, setTriggers] = useState<PriceTrigger[]>([]);
  const [companies, setCompanies] = useState<Map<string, Company>>(new Map());
  const [loadingTriggers, setLoadingTriggers] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [tRes, cRes] = await Promise.all([api.getUserTriggers(token), api.listCompanies(200)]);
        setTriggers(tRes.data ?? []);
        const map = new Map<string, Company>();
        (cRes.data ?? []).forEach((c) => map.set(c.id, c));
        setCompanies(map);
      } catch {
        // silent
      } finally {
        setLoadingTriggers(false);
      }
    })();
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSaveMessage("");
    try {
      await api.updateProfile({ full_name: fullName, phone }, token);
      await refreshUser();
      setSaveMessage("Profile updated successfully");
    } catch {
      setSaveMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      await api.uploadProfileImage(file, token);
      await refreshUser();
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  const handleCancelTrigger = async (id: string) => {
    if (!token) return;
    setCancellingId(id);
    try {
      await api.cancelTrigger(id, token);
      setTriggers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // silent
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <p className="text-zinc-400 mb-4">Please login to view your profile</p>
          <Link href="/login"><Button>Login</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="h-6 w-6 text-emerald-400" /> Profile
        </h1>
        <p className="text-sm text-zinc-500">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700">
                {user.profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profile_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-zinc-500" />
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50"
              >
                {uploading ? <Spinner className="h-3 w-3" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            <div className="flex flex-col items-start gap-1">
              <p className="text-white font-medium">{user.full_name}</p>
              <p className="text-sm text-zinc-500">{user.email}</p>
              <div className="flex gap-2">
                <Badge variant={user.role === "admin" ? "success" : "default"}>{user.role}</Badge>
                {user.kyc_status && (
                  <Badge variant={user.kyc_status === "verified" ? "success" : "warning"}>
                    KYC: {user.kyc_status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Update Form */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Save Changes
            </Button>
            {saveMessage && (
              <p className={`text-sm ${saveMessage.includes("success") ? "text-emerald-400" : "text-red-400"}`}>
                {saveMessage}
              </p>
            )}
          </div>

          {/* Read-only fields */}
          <div className="border-t border-zinc-800 pt-4 space-y-2 text-sm text-zinc-400">
            <p><span className="text-zinc-500">Email:</span> {user.email}</p>
            <p><span className="text-zinc-500">Role:</span> {user.role}</p>
            <p><span className="text-zinc-500">Joined:</span> {formatDateTime(user.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Price Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-400" /> Price Triggers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingTriggers ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : triggers.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No active price triggers. Set them from company pages.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triggers.map((t) => {
                  const comp = companies.get(t.company_id);
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Link href={`/companies/${t.company_id}`} className="font-medium text-emerald-400 hover:underline">
                          {comp?.symbol ?? t.company_id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-zinc-400">{t.direction}</TableCell>
                      <TableCell className="text-right">{formatNPR(t.trigger_price)}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "triggered" ? "success" : t.status === "cancelled" ? "danger" : "warning"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-sm">{formatDateTime(t.created_at)}</TableCell>
                      <TableCell>
                        {t.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            disabled={cancellingId === t.id}
                            onClick={() => handleCancelTrigger(t.id)}
                          >
                            {cancellingId === t.id ? <Spinner className="h-3 w-3" /> : <X className="h-4 w-4" />}
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
