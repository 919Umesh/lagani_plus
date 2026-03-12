"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui/spinner";
import { Building2, ListOrdered, Users, LayoutDashboard, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/ipos", label: "IPOs", icon: ListOrdered },
  { href: "/admin/users", label: "Users / KYC", icon: Users },
  { href: "/admin/wallets", label: "Wallets", icon: DollarSign },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <PageLoader />;
  if (!user || user.role !== "admin") return <PageLoader />;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-zinc-800 bg-zinc-950/50 px-3 py-6">
        <p className="px-3 mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Admin Panel</p>
        <nav className="space-y-1">
          {adminLinks.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 flex">
        {adminLinks.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-2 text-[10px]",
                active ? "text-emerald-400" : "text-zinc-500"
              )}
            >
              <l.icon className="h-4 w-4 mb-0.5" />
              {l.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">{children}</main>
    </div>
  );
}
