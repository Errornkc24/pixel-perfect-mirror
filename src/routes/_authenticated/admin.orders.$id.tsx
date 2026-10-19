import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { addressOf, contactOf, fmtDate } from "@/lib/admin";
import { formatINR, ORDER_STEPS, STATUS_LABEL, type OrderStatus } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({ component: OrderDetail });

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ["admin", "order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*), order_status_history(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: o, isLoading } = useAdminOrder(id);
  const [status, setStatus] = useState<OrderStatus>("placed");
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (o) { setStatus(o.status); setCourier(o.courier ?? ""); setTracking(o.tracking_number ?? ""); }
  }, [o]);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!o) return <p>Order not found.</p>;
  const c = contactOf(o);
  const a = addressOf(o);
  const locked = o.status === "cancelled" || o.status === "delivered";

  async function update(next: OrderStatus) {
    if (next === "cancelled" && !confirm("Cancel this order? Stock will be returned.")) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_update_order", { _order_id: id, _status: next, _note: note || undefined, _courier: courier || undefined, _tracking: tracking || undefined });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    setNote("");
    qc.invalidateQueries({ queryKey: ["admin"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/admin/orders" className="text-sm text-muted-foreground">← Orders</Link>
        <h2 className="mr-auto text-3xl">{o.order_number}</h2>
        <Button variant="outline" asChild><Link to="/admin/slip/$id" params={{ id }}><Printer /> Packing slip</Link></Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card/60 p-5">
            <h3 className="text-xl">Items</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {o.order_items.map((i) => <li key={i.id} className="flex justify-between gap-3"><span>{i.name} × {i.quantity}</span><span>{formatINR(Number(i.price) * i.quantity)}</span></li>)}
            </ul>
            <div className="mt-3 space-y-1 border-t pt-3 text-sm">
              <p className="flex justify-between"><span>Subtotal</span><span>{formatINR(Number(o.subtotal))}</span></p>
              <p className="flex justify-between"><span>Shipping</span><span>{Number(o.shipping) ? formatINR(Number(o.shipping)) : "Free"}</span></p>
              <p className="flex justify-between font-medium"><span>Total · Cash on Delivery ({o.payment_status})</span><span>{formatINR(Number(o.total))}</span></p>
            </div>
          </section>
          <section className="grid gap-4 rounded-2xl border bg-card/60 p-5 text-sm sm:grid-cols-2">
            <div><h3 className="mb-2 text-xl">Customer</h3><p>{c.first_name} {c.last_name}</p><p>{c.phone}</p><p>{c.email}</p>{c.instagram && <p>IG: {c.instagram}</p>}</div>
            <div><h3 className="mb-2 text-xl">Deliver to</h3><p>{a.full_name} · {a.phone}</p><p>{a.line1}{a.landmark ? `, near ${a.landmark}` : ""}</p><p>{a.city}, {a.state} – {a.pincode}</p></div>
          </section>
          <section className="rounded-2xl border bg-card/60 p-5">
            <h3 className="text-xl">History</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[...o.order_status_history].sort((x, y) => x.created_at.localeCompare(y.created_at)).map((h) => (
                <li key={h.id}><span className="font-medium">{STATUS_LABEL[h.status]}</span> · <span className="text-muted-foreground">{fmtDate(h.created_at)}</span>{h.note && <span className="block text-muted-foreground">{h.note}</span>}</li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border bg-card-gradient p-5">
          <h3 className="text-xl">Update order</h3>
          {locked ? <p className="text-sm text-muted-foreground">This order is {STATUS_LABEL[o.status].toLowerCase()} and can't be changed.</p> : (
            <>
              <div className="space-y-1.5"><Label>Status</Label>
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                  {ORDER_STEPS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label>Courier</Label><Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Delhivery, DTDC…" /></div>
              <div className="space-y-1.5"><Label>Tracking number</Label><Input value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Note for history (optional)</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
              <Button className="w-full" disabled={busy} onClick={() => update(status)}>Save</Button>
              <Button variant="ghost" className="w-full text-destructive" disabled={busy} onClick={() => update("cancelled")}>Cancel order</Button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
