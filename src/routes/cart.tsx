import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { CartLines, CartTotals } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Tanvisha's Candles" },
      { name: "description", content: "Review the candles in your cart." },
      { property: "og:title", content: "Your Cart — Tanvisha's Candles" },
      { property: "og:description", content: "Review the candles in your cart." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines } = useCart();
  const { user } = useAuth();
  const hasOut = lines.some((l) => l.quantity <= 0);

  if (lines.length === 0)
    return (
      <div className="flex flex-col items-center py-32 text-center">
        <ShoppingBag className="h-14 w-14 text-primary/60" />
        <h1 className="mt-6 text-4xl">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Find a scent that feels like home.</p>
        <Button asChild size="lg" className="mt-8"><Link to="/shop">Shop candles</Link></Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl">Your Cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border bg-card/60 px-5"><CartLines /></div>
        <aside className="h-fit rounded-2xl border bg-card-gradient p-6 lg:sticky lg:top-28">
          <h2 className="mb-4 text-2xl">Summary</h2>
          <CartTotals />
          <Button asChild size="lg" className="mt-6 w-full" disabled={hasOut}>
            <Link to="/checkout">{user ? "Proceed to checkout" : "Sign in to checkout"}</Link>
          </Button>
          {!user && <p className="mt-3 text-center text-xs text-muted-foreground">Your cart will be saved when you sign in.</p>}
        </aside>
      </div>
    </div>
  );
}
