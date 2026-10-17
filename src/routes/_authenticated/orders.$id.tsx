import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, PartyPopper, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrderTimeline } from "@/components/OrderTimeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { canCustomerCancel, formatINR } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  validateSearch: (s: Record<string, unknown>): { placed?: boolean } => ({ placed: s.placed === true || s.placed === "true" ? true : undefined }),
  head: () => ({
    meta: [
      { title: "Order details — Tanvisha's Candles" },
      { name: "description", content: "Your order status and tracking." },
      { property: "og:title", content: "Order details — Tanvisha's Candles" },
      { property: "og:description", content: "Your order status and tracking." },
    ],
  }),
  component: OrderDetail,
});

type Addr = { full_name: string; phone: string; line1: string; landmark?: string; city: string; state: string; pincode: string };

function OrderDetail() {
  const { id } = Route.useParams();
  const { placed } = Route.useSearch();
  const qc = useQueryClient();
  const [cancelling, setCancelling] = useState(false);
  const { data: o, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*), order_status_history(status, created_at)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Live updates when the shop changes status
  useEffect(() => {
    const ch = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["order", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  if (isLoading) return <div className="mx-auto max-w-4xl space-y-4 px-6 py-10"><Skeleton className="h-12 w-1/2 bg-muted" /><Skeleton className="h-40 bg-muted" /><Skeleton className="h-60 bg-muted" /></div>;
  if (!o) return <div className="py-32 text-center"><h1 className="text-3xl">Order not found</h1><Button asChild className="mt-6"><Link to="/orders">My orders</Link></Button></div>;

  const addr = o.shipping_address as unknown as Addr;

  async function cancel() {
    setCancelling(true);
    const { error } = await supabase.rpc("cancel_order", { _order_id: id });
    setCancelling(false);
    if (error) return toast.error(error.message);
    toast.success("Your order has been cancelled");
    qc.invalidateQueries();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ChevronLeft className="h-4 w-4" /> My orders</Link>

      {placed && (
        <div className="mt-6 rounded-3xl border border-primary/40 bg-card-gradient p-8 text-center shadow-glow">
          <PartyPopper className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 text-4xl">Thank you! Your order is placed</h1>
          <p className="mt-2 text-muted-foreground">We'll start pouring love into your package. Pay {formatINR(Number(o.total))} on delivery.</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-brand text-primary">Order #{o.order_number}</p>
          <p className="text-sm text-muted-foreground">Placed {new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
        </div>
        {canCustomerCancel(o.status) && (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" disabled={cancelling}>Cancel order</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                <AlertDialogDescription>You can only cancel before your order is packed. This can't be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep order</AlertDialogCancel>
                <AlertDialogAction onClick={cancel}>Yes, cancel</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <section className="mt-6 rounded-2xl border bg-card/60 p-6">
        <OrderTimeline status={o.status} history={o.order_status_history} />
        {o.tracking_number && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
            <Truck className="h-5 w-5 text-primary" />
            <span>{o.courier ?? "Courier"} · Tracking no. <span className="font-medium">{o.tracking_number}</span></span>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-card/60 p-6">
          <h2 className="text-2xl">Items</h2>
          <ul className="mt-4 space-y-3">
            {o.order_items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 text-sm">
                <img src={it.image ?? ""} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <span className="flex-1">{it.name} × {it.quantity}</span>
                <span>{formatINR(Number(it.price) * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="gold-divider my-4" />
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINR(Number(o.subtotal))}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{Number(o.shipping) === 0 ? "Free" : formatINR(Number(o.shipping))}</dd></div>
            <div className="flex justify-between text-base"><dt>Total (Cash on Delivery)</dt><dd className="text-primary">{formatINR(Number(o.total))}</dd></div>
          </dl>
        </section>
        <section className="rounded-2xl border bg-card/60 p-6 text-sm">
          <h2 className="text-2xl">Delivering to</h2>
          <p className="mt-4 font-medium">{addr.full_name}</p>
          <p className="text-muted-foreground">{addr.line1}</p>
          {addr.landmark && <p className="text-muted-foreground">Near {addr.landmark}</p>}
          <p className="text-muted-foreground">{addr.city}, {addr.state} – {addr.pincode}</p>
          <p className="mt-2 text-muted-foreground">📞 {addr.phone}</p>
        </section>
      </div>
    </div>
  );
}
