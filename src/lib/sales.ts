import type { Database } from "@/integrations/supabase/types";

export type SalesOrder = Pick<Database["public"]["Tables"]["orders"]["Row"], "id" | "order_number" | "created_at" | "status" | "payment_status" | "payment_method" | "subtotal" | "shipping" | "total"> & {
  order_items: Pick<Database["public"]["Tables"]["order_items"]["Row"], "name" | "product_id" | "price" | "quantity">[];
};
export type Granularity = "day" | "month" | "year";
export const indiaDate = (value: string | Date) => {
  const d = new Date(new Date(value).getTime() + 330 * 60_000);
  return d.toISOString().slice(0, 10);
};
export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
export function previousRange(from: string, to: string) {
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
  return { from: shiftDate(from, -days), to: shiftDate(from, -1) };
}
export function salesRange(preset: string, today: string, earliest = today) {
  const from = preset === "today" ? today : preset === "week" ? shiftDate(today, -6) : preset === "year" ? `${today.slice(0, 4)}-01-01` : preset === "all" ? earliest : `${today.slice(0, 7)}-01`;
  return { from, to: today };
}
export function summarizeSales(orders: SalesOrder[], from: string, to: string, group: Granularity) {
  const selected = orders.filter(o => { const date = indiaDate(o.created_at); return date >= from && date <= to; });
  const live = selected.filter(o => o.status !== "cancelled");
  const cancelled = selected.filter(o => o.status === "cancelled");
  const revenue = live.reduce((n, o) => n + Number(o.total), 0);
  const collected = live.filter(o => o.payment_status === "paid").reduce((n, o) => n + Number(o.total), 0);
  const subtotal = live.reduce((n, o) => n + Number(o.subtotal), 0);
  const shipping = live.reduce((n, o) => n + Number(o.shipping), 0);
  const length = group === "day" ? 10 : group === "month" ? 7 : 4;
  const buckets = new Map<string, { period: string; orders: number; revenue: number; collected: number; cancelled: number }>();
  for (let day = from; day <= to;) {
    const period = day.slice(0, length);
    buckets.set(period, { period, orders: 0, revenue: 0, collected: 0, cancelled: 0 });
    if (group === "year") day = `${Number(day.slice(0, 4)) + 1}-01-01`;
    else if (group === "month") { const d = new Date(`${day.slice(0, 7)}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1); day = d.toISOString().slice(0, 10); }
    else day = shiftDate(day, 1);
  }
  for (const o of selected) {
    const bucket = buckets.get(indiaDate(o.created_at).slice(0, length));
    if (!bucket) continue;
    if (o.status === "cancelled") { bucket.cancelled++; continue; }
    bucket.orders++; bucket.revenue += Number(o.total);
    if (o.payment_status === "paid") bucket.collected += Number(o.total);
  }
  const products = new Map<string, { name: string; units: number; revenue: number }>();
  for (const o of live) for (const item of o.order_items) {
    const key = item.product_id ?? item.name;
    const p = products.get(key) ?? { name: item.name, units: 0, revenue: 0 };
    p.units += item.quantity; p.revenue += Number(item.price) * item.quantity; products.set(key, p);
  }
  return { selected, live, revenue, collected, outstanding: revenue - collected, subtotal, shipping, cancelled: cancelled.length,
    cancelledValue: cancelled.reduce((n, o) => n + Number(o.total), 0),
    cancelledPaid: cancelled.filter(o => o.payment_status === "paid").reduce((n, o) => n + Number(o.total), 0),
    average: live.length ? revenue / live.length : 0,
    units: [...products.values()].reduce((n, p) => n + p.units, 0),
    products: [...products.values()].sort((a, b) => b.revenue - a.revenue), periods: [...buckets.values()] };
}
export function salesCsv(rows: (string | number)[][]) {
  return "\uFEFF" + rows.map(row => row.map(value => {
    let text = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
}