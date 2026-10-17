import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { productsQuery } from "./queries";
import { clampQty, shippingFor, type Product } from "./shop";

type Line = { productId: string; quantity: number };
export type CartLine = Line & { product: Product };

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  bump: number;
  add: (p: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clearLocal: () => void;
};

const KEY = "tc-guest-cart";
const Ctx = createContext<CartCtx | null>(null);

function readLocal(): Line[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Line[]).filter((l) => l.productId && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { data: products = [] } = useQuery(productsQuery);
  const [raw, setRaw] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const syncedFor = useRef<string | null>(null);

  // Load guest cart on mount
  useEffect(() => {
    setRaw(readLocal());
  }, []);

  // When a user signs in: merge guest cart into saved cart (nothing is lost)
  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (syncedFor.current) {
        syncedFor.current = null;
        setRaw(readLocal());
      }
      return;
    }
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    (async () => {
      const guest = readLocal();
      const { data } = await supabase.from("cart_items").select("product_id, quantity").eq("user_id", user.id);
      const merged = new Map<string, number>();
      (data ?? []).forEach((r) => merged.set(r.product_id, r.quantity));
      guest.forEach((g) => merged.set(g.productId, (merged.get(g.productId) ?? 0) + g.quantity));
      const lines = [...merged].map(([productId, quantity]) => ({ productId, quantity: Math.min(quantity, 50) }));
      if (guest.length) {
        await supabase
          .from("cart_items")
          .upsert(lines.map((l) => ({ user_id: user.id, product_id: l.productId, quantity: l.quantity })));
        localStorage.removeItem(KEY);
      }
      setRaw(lines);
    })();
  }, [user, loading]);

  const persist = useCallback(
    async (next: Line[], changed: Line) => {
      setRaw(next);
      if (!user) {
        localStorage.setItem(KEY, JSON.stringify(next));
        return;
      }
      if (changed.quantity <= 0) {
        await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", changed.productId);
      } else {
        await supabase
          .from("cart_items")
          .upsert({ user_id: user.id, product_id: changed.productId, quantity: changed.quantity, updated_at: new Date().toISOString() });
      }
    },
    [user],
  );

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const lines = useMemo<CartLine[]>(
    () =>
      raw
        .map((l) => {
          const product = byId.get(l.productId);
          if (!product) return null;
          return { ...l, quantity: Math.max(0, Math.min(l.quantity, product.stock)), product };
        })
        .filter((l): l is CartLine => !!l),
    [raw, byId],
  );

  const add = useCallback(
    (p: Product, qty = 1) => {
      const current = raw.find((l) => l.productId === p.id)?.quantity ?? 0;
      const target = clampQty(current + qty, p.stock);
      if (target <= current) {
        toast.error(p.stock <= 0 ? `${p.name} is out of stock` : `Only ${p.stock} available`);
        return;
      }
      const changed = { productId: p.id, quantity: target };
      const next = raw.some((l) => l.productId === p.id)
        ? raw.map((l) => (l.productId === p.id ? changed : l))
        : [...raw, changed];
      persist(next, changed);
      setBump((b) => b + 1);
      toast.success(`${p.name} added to your cart`, { action: { label: "View cart", onClick: () => setOpen(true) } });
    },
    [raw, persist],
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      const p = byId.get(productId);
      if (!p) return;
      const q = clampQty(qty, p.stock);
      if (qty > p.stock) toast.message(`Only ${p.stock} in stock`);
      const changed = { productId, quantity: q };
      const next = q <= 0 ? raw.filter((l) => l.productId !== productId) : raw.map((l) => (l.productId === productId ? changed : l));
      persist(next, changed);
    },
    [raw, byId, persist],
  );

  const remove = useCallback(
    (productId: string) => {
      persist(raw.filter((l) => l.productId !== productId), { productId, quantity: 0 });
    },
    [raw, persist],
  );

  const clearLocal = useCallback(() => {
    setRaw([]);
    localStorage.removeItem(KEY);
  }, []);

  const valid = lines.filter((l) => l.quantity > 0);
  const subtotal = valid.reduce((s, l) => s + Number(l.product.price) * l.quantity, 0);
  const shipping = shippingFor(subtotal);

  return (
    <Ctx.Provider
      value={{
        lines,
        count: valid.reduce((s, l) => s + l.quantity, 0),
        subtotal,
        shipping,
        total: subtotal + shipping,
        open,
        setOpen,
        bump,
        add,
        setQty,
        remove,
        clearLocal,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}
