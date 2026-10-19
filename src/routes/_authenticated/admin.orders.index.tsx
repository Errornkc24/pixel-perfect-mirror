import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminOrdersQuery, contactOf, fmtDate } from "@/lib/admin";
import { formatINR, ORDER_STEPS, STATUS_LABEL, type OrderStatus } from "@/lib/shop";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/orders/")({ component: Orders });

function Orders() {
  const { data: orders = [] } = useQuery(adminOrdersQuery);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = orders.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (from && new Date(o.created_at) < new Date(from)) return false;
    if (to && new Date(o.created_at) > new Date(to + "T23:59:59")) return false;
    if (!needle) return true;
    const c = contactOf(o);
    return [o.order_number, c.first_name, c.last_name, c.phone, c.email].some((v) => v?.toLowerCase().includes(needle));
  });
  const tabs: (OrderStatus | "all")[] = ["all", ...ORDER_STEPS, "cancelled"];

  return (
    <div className="space-y-4">
      <h2 className="text-3xl">Orders</h2>
      <div className="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setStatus(t)} className={cn("rounded-full border px-3 py-1 text-xs", status === t ? "border-primary bg-primary/15 text-primary" : "text-muted-foreground")}>
            {t === "all" ? "All" : STATUS_LABEL[t]} ({t === "all" ? orders.length : orders.filter((o) => o.status === t).length})
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Order no., name, phone…" value={q} onChange={(e) => setQ(e.target.value)} className="w-60" />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" aria-label="To date" />
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card/60">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th></tr></thead>
          <tbody className="divide-y divide-border">
            {shown.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No orders match.</td></tr>}
            {shown.map((o) => {
              const c = contactOf(o);
              return (
                <tr key={o.id} className="hover:bg-accent/30">
                  <td className="p-3"><Link to="/admin/orders/$id" params={{ id: o.id }} className="font-medium text-primary">{o.order_number}</Link><span className="block text-xs text-muted-foreground">{fmtDate(o.created_at)}</span></td>
                  <td className="p-3">{c.first_name} {c.last_name}<span className="block text-xs text-muted-foreground">{c.phone}</span></td>
                  <td className="p-3">{formatINR(Number(o.total))}</td>
                  <td className="p-3">{STATUS_LABEL[o.status]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
