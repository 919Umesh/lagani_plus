import Link from "next/link";
import { TrendingUp } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Lagani<span className="text-emerald-400">+</span>
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              Nepal&apos;s premier stock market simulator. Practice trading NEPSE stocks risk-free.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-300">Market</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/market" className="hover:text-emerald-400 transition-colors">All Companies</Link></li>
              <li><Link href="/market?tab=gainers" className="hover:text-emerald-400 transition-colors">Top Gainers</Link></li>
              <li><Link href="/market?tab=losers" className="hover:text-emerald-400 transition-colors">Top Losers</Link></li>
              <li><Link href="/market?tab=sectors" className="hover:text-emerald-400 transition-colors">Sectors</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-300">Trading</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/ipo" className="hover:text-emerald-400 transition-colors">IPO Applications</Link></li>
              <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Dashboard</Link></li>
              <li><Link href="/portfolio" className="hover:text-emerald-400 transition-colors">Portfolio</Link></li>
              <li><Link href="/orders" className="hover:text-emerald-400 transition-colors">My Orders</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-300">Account</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Login</Link></li>
              <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Register</Link></li>
              <li><Link href="/profile" className="hover:text-emerald-400 transition-colors">Profile</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} Lagani+. A stock market learning simulator for Nepal. Not real trading.
        </div>
      </div>
    </footer>
  );
}
