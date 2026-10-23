import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowLeft, ArrowRight, RefreshCw, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { adminSalesQuery } from "@/lib/sales-query";
import { indiaDate, previousRange, salesCsv, salesRange, summarizeSales, type Granularity } from "@/lib/sales";
import { formatINR, STATUS_LABEL } from "@/lib/shop";
import { pageHead } from "@/lib/page-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const Route = createFileRoute("/_authenticated/admin/sales")({
  head: () => pageHead("Sales reports", "Daily, monthly and yearly candle sales, payments and product performance.", true),
  component: Sales,
});

const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
const periodLabel = (value: string) => value.length === 4 ? value : new Date(`${value.length === 7 ? value + "-01" : value}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", ...(value.length === 10 ? { day: "numeric" as const } : {}), month: "short", year: "numeric" });
const chartConfig = { revenue: { label: "Order sales", color: "var(--chart-1)" }, collected: { label: "Collected", color: "var(--success)" } };
function download(rows: (string | number)[][], name: string) {
  const url = URL.createObjectURL(new Blob([salesCsv(rows)], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
function Sales() {
  const { data: orders = [], isPending, isError, isFetching, refetch, dataUpdatedAt } = useQuery(adminSalesQuery);
  const [today] = useState(() => indiaDate(new Date()));
  const [preset, setPreset] = useState("month");
  const [custom, setCustom] = useState(salesRange("month", today));
  const [group, setGroup] = useState<Granularity>("day");
  const [page, setPage] = useState(0);
  const earliest = orders.length ? indiaDate(orders[orders.length - 1].created_at) : today;
  const range = preset === "custom" ? custom : salesRange(preset, today, earliest);
  const invalid = !range.from || !range.to || range.from > range.to;
  const report = useMemo(() => summarizeSales(orders, invalid ? today : range.from, invalid ? today : range.to, group), [orders, range.from, range.to, group, invalid, today]);
  const previous = previousRange(invalid ? today : range.from, invalid ? today : range.to);
  const prior = useMemo(() => summarizeSales(orders, previous.from, previous.to, "month"), [orders, previous.from, previous.to]);
  const growth = prior.revenue ? ((report.revenue - prior.revenue) / prior.revenue) * 100 : null;
  const statuses = Object.entries(STATUS_LABEL).map(([status, label]) => ({ label, count: report.selected.filter(o => o.status === status).length }));
  const payments = [
    { label: "Online", method: "online" }, { label: "Cash on Delivery", method: "cod" },
    ...(report.live.some(o => !["online", "cod"].includes(o.payment_method)) ? [{ label: "Other", method: "other" }] : []),
  ].map(p => {
    const rows = report.live.filter(o => p.method === "other" ? !["online", "cod"].includes(o.payment_method) : o.payment_method === p.method);
    const value = rows.reduce((n, o) => n + Number(o.total), 0);
    const paid = rows.filter(o => o.payment_status === "paid").reduce((n, o) => n + Number(o.total), 0);
    return { ...p, count: rows.length, value, paid, pending: value - paid };
  });
  function exportReport() {
    download([
      ["Tanvisha's Candles — Sales report"], ["From (India)", range.from, "To (India)", range.to],
      ["Basis", "Order placement date; cancelled orders excluded from sales; sales include shipping"],
      ["Order sales INR", report.revenue], ["Collected INR", report.collected], ["Outstanding INR", report.outstanding],
      ["Product sales INR", report.subtotal], ["Shipping INR", report.shipping], ["Orders", report.live.length], ["Units", report.units],
      ["Cancelled orders", report.cancelled], ["Cancelled value INR", report.cancelledValue], ["Paid cancelled value INR (refunds untracked)", report.cancelledPaid], [],
      ["Period", "Orders", "Sales INR", "Collected INR", "Outstanding INR", "Cancelled orders"],
      ...report.periods.map(p => [p.period, p.orders, p.revenue, p.collected, p.revenue - p.collected, p.cancelled]), [],
      ["Product", "Units", "Product sales INR"], ...report.products.map(p => [p.name, p.units, p.revenue]), [],
      ["Payment method", "Orders", "Sales INR", "Collected INR", "Outstanding INR"], ...payments.map(p => [p.label, p.count, p.value, p.paid, p.pending]), [],
      ["Order", "India date", "Status", "Payment method", "Payment status", "Subtotal INR", "Shipping INR", "Total INR"],
      ...report.selected.map(o => [o.order_number, indiaDate(o.created_at), STATUS_LABEL[o.status], o.payment_method, o.payment_status, o.subtotal, o.shipping, o.total]),
    ], `tanvisha-sales-${range.from}-${range.to}.csv`);
  }
  function drill(period: string) {
    if (group === "day") return;
    const from = period.length === 4 ? `${period}-01-01` : `${period}-01`;
    const d = new Date(`${from}T00:00:00Z`);
    if (period.length === 4) d.setUTCFullYear(d.getUTCFullYear() + 1); else d.setUTCMonth(d.getUTCMonth() + 1);
    d.setUTCDate(d.getUTCDate() - 1);
    setCustom({ from: from < range.from ? range.from : from, to: d.toISOString().slice(0, 10) > range.to ? range.to : d.toISOString().slice(0, 10) });
    setPreset("custom"); setGroup(group === "year" ? "month" : "day"); setPage(0);
  }
  const shownPage = Math.min(page, Math.max(0, Math.ceil(report.selected.length / 20) - 1));
  if (isPending) return <p role="status" className="py-16 text-center text-muted-foreground">Loading sales reports…</p>;
  if (isError) return <div role="alert" className="space-y-3 py-12"><p>Sales couldn’t be loaded.</p><Button variant="outline" onClick={() => refetch()}><RefreshCw />Try again</Button></div>;
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-3xl">Sales</h2><p className="mt-1 text-sm text-muted-foreground">{periodLabel(range.from || today)} — {periodLabel(range.to || today)} · India time</p></div>
        <div className="flex gap-2"><Button variant="ghost" size="icon" aria-label="Refresh sales" title="Refresh sales" disabled={isFetching} onClick={() => refetch()}><RefreshCw className={isFetching ? "animate-spin motion-reduce:animate-none" : ""} /></Button><Button variant="outline" disabled={invalid} onClick={exportReport}><ArrowDownToLine />Export CSV</Button></div>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-y py-4">
        <div className="w-44 space-y-2"><Label>Reporting period</Label><Select value={preset} onValueChange={v => { setPreset(v); setPage(0); if (v === "year") setGroup("month"); if (v === "all") setGroup("year"); if (["today", "week", "month"].includes(v)) setGroup("day"); }}><SelectTrigger aria-label="Reporting period"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">Last 7 days</SelectItem><SelectItem value="month">This month</SelectItem><SelectItem value="year">This year</SelectItem><SelectItem value="all">All time</SelectItem><SelectItem value="custom">Custom dates</SelectItem></SelectContent></Select></div>
        {preset === "custom" && <><div className="w-40 space-y-2"><Label htmlFor="sales-from">From</Label><Input id="sales-from" type="date" value={custom.from} onChange={e => { setCustom({ ...custom, from: e.target.value }); setPage(0); }} /></div><div className="w-40 space-y-2"><Label htmlFor="sales-to">To</Label><Input id="sales-to" type="date" value={custom.to} onChange={e => { setCustom({ ...custom, to: e.target.value }); setPage(0); }} /></div></>}
        <Tabs value={group} onValueChange={v => setGroup(v as Granularity)} className="sm:ml-auto"><TabsList aria-label="Group sales by"><TabsTrigger value="day">Daily</TabsTrigger><TabsTrigger value="month">Monthly</TabsTrigger><TabsTrigger value="year">Yearly</TabsTrigger></TabsList></Tabs>
      </div>
      {invalid ? <p role="alert" className="text-destructive">Choose a valid date range with the end on or after the start.</p> : <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Order sales", value: money(report.revenue), detail: growth === null ? (report.revenue ? "No sales in preceding period" : "No change from preceding period") : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% vs preceding period`, color: "text-primary" },
            { label: "Collected", value: money(report.collected), detail: "Orders marked paid", color: "text-success" },
            { label: "Outstanding", value: money(report.outstanding), detail: "Payment not yet received", color: "text-bloom" },
            { label: "Orders", value: report.live.length.toLocaleString("en-IN"), detail: `${report.units} units · ${report.cancelled} cancelled`, color: "text-foreground" },
          ].map(s => <div key={s.label} className="min-w-0 rounded-lg border bg-card/60 p-4"><p className="text-sm text-muted-foreground">{s.label}</p><p className={`mt-2 break-words text-2xl font-medium tabular-nums ${s.color}`}>{s.value}</p><p className="mt-2 text-xs text-muted-foreground">{s.detail}</p></div>)}
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 border-b pb-4 text-sm"><span>Product sales <strong className="ml-2 font-medium">{money(report.subtotal)}</strong></span><span>Shipping <strong className="ml-2 font-medium">{money(report.shipping)}</strong></span><span>Average order <strong className="ml-2 font-medium">{money(report.average)}</strong></span></div>
        <section aria-label="Sales trend" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-2xl">Sales trend</h3><div className="flex gap-4 text-xs"><span className="flex items-center gap-2"><span className="h-2 w-2 bg-chart-1" />Order sales</span><span className="flex items-center gap-2"><span className="h-2 w-2 bg-success" />Collected</span></div></div>
          {report.selected.length === 0 ? <div className="flex h-60 flex-col items-center justify-center gap-3 border-y text-muted-foreground"><TrendingUp className="h-8 w-8 text-primary" /><p>No orders in this period.</p></div> : <ChartContainer config={chartConfig} className="h-72 w-full aspect-auto"><BarChart data={report.periods} accessibilityLayer><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="period" tickFormatter={periodLabel} tickLine={false} axisLine={false} minTickGap={35} /><YAxis width={64} tickFormatter={v => Number(v) >= 1000 ? `₹${Number(v) / 1000}k` : `₹${v}`} tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent labelFormatter={(_label, payload) => periodLabel(String(payload[0]?.payload.period ?? ""))} formatter={(value, name) => <span>{name === "revenue" ? "Order sales" : "Collected"} · <strong>{money(Number(value))}</strong></span>} />} /><Bar dataKey="revenue" fill="var(--color-revenue)" radius={[3, 3, 0, 0]} isAnimationActive={false} /><Bar dataKey="collected" fill="var(--color-collected)" radius={[3, 3, 0, 0]} isAnimationActive={false} /></BarChart></ChartContainer>}
          <p className="text-xs text-muted-foreground">Sales include shipping and exclude cancelled orders. Collected totals use the payment status of orders placed in this period.</p>
        </section>
        <section className="space-y-3"><h3 className="text-2xl">{group === "day" ? "Daily" : group === "month" ? "Monthly" : "Yearly"} breakdown</h3><div className="max-h-96 overflow-auto border-y"><table className="w-full min-w-[650px] text-right text-sm"><thead className="sticky top-0 bg-background text-xs text-muted-foreground"><tr><th className="p-3 text-left">Period</th><th className="p-3">Orders</th><th className="p-3">Sales</th><th className="p-3">Collected</th><th className="p-3">Outstanding</th><th className="p-3">Cancelled</th></tr></thead><tbody className="divide-y">{[...report.periods].reverse().map(p => <tr key={p.period}><td className="p-3 text-left">{group === "day" ? periodLabel(p.period) : <Button variant="link" className="h-auto p-0 tracking-normal" onClick={() => drill(p.period)}>{periodLabel(p.period)}<ArrowRight /></Button>}</td><td className="p-3 tabular-nums">{p.orders}</td><td className="p-3 tabular-nums text-primary">{money(p.revenue)}</td><td className="p-3 tabular-nums">{money(p.collected)}</td><td className="p-3 tabular-nums">{money(p.revenue - p.collected)}</td><td className="p-3 tabular-nums">{p.cancelled}</td></tr>)}</tbody></table></div></section>
        <div className="grid gap-7 xl:grid-cols-2">
          <section className="min-w-0 space-y-3"><h3 className="text-2xl">Product performance</h3><div className="max-h-80 overflow-auto border-y"><table className="w-full text-sm"><thead className="bg-background text-left text-xs text-muted-foreground"><tr><th className="p-3">Candle</th><th className="p-3 text-right">Units</th><th className="p-3 text-right">Sales</th></tr></thead><tbody className="divide-y">{report.products.map((p, i) => <tr key={`${p.name}-${i}`}><td className="p-3">{p.name}</td><td className="p-3 text-right tabular-nums">{p.units}</td><td className="p-3 text-right tabular-nums text-primary">{money(p.revenue)}</td></tr>)}{report.products.length === 0 && <tr><td colSpan={3} className="p-6 text-muted-foreground">No candle sales in this period.</td></tr>}</tbody></table></div></section>
          <section className="min-w-0 space-y-3"><h3 className="text-2xl">Payments</h3><div className="overflow-auto border-y"><table className="w-full min-w-[430px] text-right text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-3 text-left">Method</th><th className="p-3">Orders</th><th className="p-3">Collected</th><th className="p-3">Outstanding</th></tr></thead><tbody className="divide-y">{payments.map(p => <tr key={p.method}><td className="p-3 text-left">{p.label}</td><td className="p-3">{p.count}</td><td className="p-3 text-success">{money(p.paid)}</td><td className="p-3">{money(p.pending)}</td></tr>)}</tbody></table></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">{statuses.map(s => <span key={s.label}>{s.label} <strong className="ml-1 text-foreground">{s.count}</strong></span>)}</div><p className="text-xs text-muted-foreground">Cancelled value: {money(report.cancelledValue)}.{report.cancelledPaid > 0 && ` Paid cancelled orders: ${money(report.cancelledPaid)}; refund status is not tracked.`}</p></section>
        </div>
        <section className="space-y-3"><div className="flex items-center justify-between gap-3"><h3 className="text-2xl">Orders in this period</h3><span className="text-xs text-muted-foreground">{report.selected.length} total</span></div><div className="overflow-auto border-y"><table className="w-full min-w-[600px] text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="p-3">Order</th><th className="p-3">India date</th><th className="p-3">Status</th><th className="p-3">Payment</th><th className="p-3 text-right">Total</th></tr></thead><tbody className="divide-y">{report.selected.slice(shownPage * 20, shownPage * 20 + 20).map(o => <tr key={o.id}><td className="p-3"><Link to="/admin/orders/$id" params={{ id: o.id }} className="text-primary">{o.order_number}</Link></td><td className="p-3">periodLabelPlaceholder{periodLabel(indiaDate(o.created_at))}</td><td className="p-3">{STATUS_LABEL[o.status]}</td><td className="p-3">{o.payment_status === "paid" ? "Paid" : "Unpaid"} · {o.payment_method === "online" ? "Online" : "COD"}</td><td className="p-3 text-right tabular-nums">{money(Number(o.total))}</td></tr>)}{!report.selected.length && <tr><td colSpan={5} className="p-6 text-muted-foreground">No orders in this period.</td></tr>}</tbody></table></div>{report.selected.length > 20 && <div className="flex items-center justify-end gap-3"><Button variant="ghost" size="icon" aria-label="Previous orders" disabled={shownPage === 0} onClick={() => setPage(shownPage - 1)}><ArrowLeft /></Button><span className="text-sm">{shownPage + 1} / {Math.ceil(report.selected.length / 20)}</span><Button variant="ghost" size="icon" aria-label="Next orders" disabled={(shownPage + 1) * 20 >= report.selected.length} onClick={() => setPage(shownPage + 1)}><ArrowRight /></Button></div>}</section>
        <p className="text-xs text-muted-foreground">Updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "—"} IST · Previous period: {periodLabel(previous.from)} — {periodLabel(previous.to)}</p>
      </>}
    </div>
  );
}