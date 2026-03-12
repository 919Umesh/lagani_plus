"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import type { UpdateKYCPayload, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Users, CheckCircle, Search } from "lucide-react";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userId, setUserId] = useState("");
  const [kycStatus, setKycStatus] = useState<"pending" | "verified" | "rejected" | "under_review">("verified");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await api.getAllUsers(token);
        setUsers(res.users ?? []);
      } catch (e) {
        console.error("Failed to fetch users", e);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [token]);

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.id.includes(search)
  );

  const handleUpdateKYC = async () => {
    if (!token || !userId) return;
    setUpdating(true);
    setMessage("");
    try {
      await api.updateUserKYC(userId, { kyc_status: kycStatus, role }, token);
      setMessage(`KYC status updated to "${kycStatus}" successfully`);
      const updatedUsers = await api.getAllUsers(token);
      setUsers(updatedUsers.users ?? []);
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to update KYC");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="px-4 py-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-emerald-400" /> User Management
        </h1>
        <p className="text-sm text-zinc-500">Update KYC verification status for users</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" /> Update KYC Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select User</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by name, email or ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              value={userId}
              onChange={(e) => {
                const id = e.target.value;
                setUserId(id);
                const u = users.find((user) => user.id === id);
                if (u) {
                  setKycStatus(u.kyc_status);
                  setRole(u.role);
                }
              }}
            >
              <option value="">-- Select a User --</option>
              {loadingUsers ? (
                <option disabled>Loading users...</option>
              ) : (
                filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email}) - {u.kyc_status}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>KYC Status</Label>
              <select
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                value={kycStatus}
                onChange={(e) => setKycStatus(e.target.value as any)}
              >
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value as "user" | "admin")}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {message && (
            <p className={`text-sm ${message.includes("success") ? "text-emerald-400" : "text-red-400"}`}>
              {message}
            </p>
          )}
          <Button onClick={handleUpdateKYC} disabled={updating || !userId} className="w-full">
            {updating ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Update KYC Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
