import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-emerald-400", className)} />;
}

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

export function ErrorState({ message = "Something went wrong" }: { message?: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-red-900/30 bg-red-950/20">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}
