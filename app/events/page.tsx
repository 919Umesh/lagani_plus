"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { CompanyEvent, EventType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageLoader, ErrorState, EmptyState } from "@/components/ui/spinner";
import { formatDate, formatDateTime } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "dividend", label: "Dividend" },
  { value: "bonus_share", label: "Bonus Share" },
  { value: "right_share", label: "Right Share" },
  { value: "agm", label: "AGM" },
  { value: "quarterly_report", label: "Reports" },
  { value: "ipo_announcement", label: "IPO" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let res;
        if (tab === "all") {
          res = await api.getAllEvents(100);
        } else if (tab === "upcoming") {
          res = await api.getUpcomingEvents(100);
        } else {
          res = await api.getEventsByType(tab, 100);
        }
        setEvents(res.events ?? []);
      } catch {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    })();
  }, [tab]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-emerald-400" /> Events & Announcements
        </h1>
        <p className="text-sm text-zinc-500">Stay updated with corporate actions, AGMs, dividends, and more</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          {EVENT_TYPES.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} />
      ) : events.length === 0 ? (
        <EmptyState message="No events found" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((evt) => (
            <Card key={evt.id} className="transition-colors hover:border-zinc-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">{evt.event_type.replace(/_/g, " ")}</Badge>
                  <Badge
                    variant={
                      evt.status === "upcoming" ? "warning" : evt.status === "completed" ? "success" : evt.status === "cancelled" ? "danger" : "outline"
                    }
                  >
                    {evt.status}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-base">{evt.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-zinc-400">{evt.description}</p>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Event Date: {formatDate(evt.event_date)}</span>
                  {evt.fiscal_year && <span>FY: {evt.fiscal_year}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
