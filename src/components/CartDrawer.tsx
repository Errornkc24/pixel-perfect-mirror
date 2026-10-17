import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD, formatINR } from "@/lib/shop";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";

export function QtyStepper({ value, max, onChange, label }: { value: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-full border" role="group" aria-label={`Quantity for ${label}`}>
      <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent" onClick={() => onChange(value - 1)} aria-label="Decrease">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button
        className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CartLines({ compact = false }: { compact?: boolean }) {
  const { lines, setQty, remove } = useCart();
  return (
    <ul className="divide-y">
      {lines.map((l) => (
        <li key={l.productId} className="flex gap-4 py-4">
          <img src={l.product.images[0]} alt={l.product.name} className={compact ? "h-20 w-20 rounded-lg object-cover" : "h-24 w-24 rounded-xl object-cover"} loading="lazy" />
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex justify-between gap-2">
              <span className="font-display text-lg leading-tight">{l.product.name}</span>
              <span className="text-sm text-primary">{formatINR(Number(l.product.price) * l.quantity)}</span>
            </div>
            {l.product.stock <= 0 ? (
              <span className="text-xs text-destructive">Now out of stock — please remove</span>
            ) : (
              <span className="text-xs text-muted-foreground">{formatINR(Number(l.product.price))} each</span>
            )}
            <div className="mt-auto flex items-center justify-between">
              <QtyStepper value={l.quantity} max={l.product.stock} onChange={(n) => setQty(l.productId, n)} label={l.product.name} />
              <button onClick={() => remove(l.productId)} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${l.product.name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CartTotals() {
  const { subtotal, shipping, total } = useCart();
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
      <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd></div>
      {subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
        <p className="text-xs text-bloom">Add {formatINR(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping ✨</p>
      )}
      <div className="gold-divider my-3" />
      <div className="flex justify-between text-base"><dt>Total</dt><dd className="font-brand text-primary">{formatINR(total)}</dd></div>
    </dl>
  );
}

export function CartDrawer() {
  const { open, setOpen, lines, count } = useCart();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col border-l bg-background sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your Cart ({count})</SheetTitle>
        </SheetHeader>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-12 w-12 text-primary/60" />
            <p className="font-display text-xl">Your cart is waiting for a little glow</p>
            <Button asChild onClick={() => setOpen(false)}><Link to="/shop">Browse candles</Link></Button>
          </div>
        ) : (
          <>
            <div className="-mx-6 flex-1 overflow-y-auto px-6"><CartLines compact /></div>
            <div className="space-y-4 border-t pt-4">
              <CartTotals />
              <div className="grid gap-2">
                <Button asChild size="lg" onClick={() => setOpen(false)}><Link to="/checkout">Checkout</Link></Button>
                <Button asChild variant="outline" onClick={() => setOpen(false)}><Link to="/cart">View full cart</Link></Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
