import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useAdminOrder } from "./admin.orders.$id";
import { addressOf, contactOf, fmtDate } from "@/lib/admin";
import { formatINR } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/admin/slip/$id")({ head: () => pageHead("Packing slip", "Print the packing slip for a candle order.", true), component: Slip });

function Slip() {
  const { id } = Route.useParams();
  const { data: o } = useAdminOrder(id);
  if (!o) return <p className="text-muted-foreground">Loading…</p>;
  const a = addressOf(o);
  const c = contactOf(o);
  return (
    <div>
      <div className="mb-4 flex gap-3 print:hidden">
        <Link to="/admin/orders/$id" params={{ id }} className="text-sm text-muted-foreground">← Back to order</Link>
        <Button size="sm" className="ml-auto" onClick={() => window.print()}><Printer /> Print</Button>
      </div>
      <div className="mx-auto max-w-2xl rounded-xl bg-card p-8 text-sm text-foreground print:bg-transparent print:p-0 print:text-black">
        <div className="flex justify-between border-b pb-4">
          <div><p className="font-brand text-2xl">TANVISHA'S CANDLES</p><p className="text-xs">Light up your moments</p></div>
          <div className="text-right"><p className="text-lg font-semibold">{o.order_number}</p><p>{fmtDate(o.created_at)}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-6 py-4">
          <div><p className="text-xs uppercase tracking-widest">Ship to</p><p className="mt-1 font-medium">{a.full_name}</p><p>{a.line1}{a.landmark ? `, near ${a.landmark}` : ""}</p><p>{a.city}, {a.state} – {a.pincode}</p><p>Ph: {a.phone}</p></div>
          <div><p className="text-xs uppercase tracking-widest">Customer</p><p className="mt-1">{c.first_name} {c.last_name}</p><p>{c.phone}</p><p>{c.email}</p></div>
        </div>
        <table className="w-full border-t">
          <thead><tr className="text-left"><th className="py-2">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Amount</th><th className="py-2 text-center">✓</th></tr></thead>
          <tbody>
            {o.order_items.map((i) => <tr key={i.id} className="border-t"><td className="py-2">{i.name}</td><td className="py-2 text-center">{i.quantity}</td><td className="py-2 text-right">{formatINR(Number(i.price) * i.quantity)}</td><td className="py-2 text-center">☐</td></tr>)}
          </tbody>
        </table>
        <div className="mt-4 border-t pt-3 text-right text-base font-semibold">Cash to collect: {formatINR(Number(o.total))}</div>
        <p className="mt-8 text-center font-script text-2xl">Thank you for shopping with us</p>
      </div>
    </div>
  );
}
