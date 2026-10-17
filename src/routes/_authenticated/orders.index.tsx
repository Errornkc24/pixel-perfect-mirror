import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_LABEL, formatINR } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/orders/")({
  head: () => ({
    meta: [
      { title: "My Orders — Tanvisha's Candles" },
      { name: "description", content: "Track your candle orders." },
      { property: "og:title", content: "My Orders — Tanvisha's Candles" },
      { property: "og:description", content: "Track your candle orders." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["orders", user!.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(name, image, quantity)").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl">My Orders</h1>
      <div className="mt-8 space-y-4">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl bg-muted" />) : !data?.length ? (
          <div className="py-20 text-center">
            <Package className="mx-auto h-12 w-12 text-primary/60" />
            <p className="mt-4 font-display text-2xl">No orders yet</p>
            <Button asChild className="mt-6"><Link to="/shop">Find your first candle</Link></Button>
          </div>
        ) : (
          data.map((o) => (
            <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center gap-4 rounded-2xl border bg-card/60 p-4 transition hover:border-primary/50 sm:p-5">
              <div className="flex -space-x-3">
                {o.order_items.slice(0, 3).map((it, i) => <img key={i} src={it.image ?? ""} alt="" className="h-14 w-14 rounded-full border-2 border-background object-cover" />)}
              </div>
              <div className="flex-1">
                <p className="font-brand text-sm text-primary">#{o.order_number}</p>
                <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {o.order_items.reduce((s, i) => s + i.quantity, 0)} items</p>
              </div>
              <div className="text-right">
                <p>{formatINR(Number(o.total))}</p>
                <span className={cn("mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs", o.status === "cancelled" ? "bg-destructive/20 text-destructive" : o.status === "delivered" ? "bg-success/20 text-success" : "bg-primary/15 text-primary")}>{STATUS_LABEL[o.status]}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
