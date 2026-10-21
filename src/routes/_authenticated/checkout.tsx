import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Banknote, Check, CreditCard } from "lucide-react";
import { useRazorpay } from "@/lib/use-razorpay";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { addressesQuery, profileQuery } from "@/lib/account";
import { AddressForm } from "@/components/AddressForm";
import { CartTotals } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Tanvisha's Candles" },
      { name: "description", content: "Complete your candle order." },
      { property: "og:title", content: "Checkout — Tanvisha's Candles" },
      { property: "og:description", content: "Complete your candle order." },
    ],
  }),
  component: Checkout,
});

const contactSchema = z.object({
  first_name: z.string().trim().min(1, "Enter your first name").max(60),
  last_name: z.string().trim().min(1, "Enter your last name").max(60),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  instagram: z.string().trim().max(60).optional().default(""),
});

function Checkout() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { lines, clearLocal, total } = useCart();
  const { data: profile } = useQuery(profileQuery(uid));
  const { data: addresses = [], isLoading: addrLoading } = useQuery(addressesQuery(uid));
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [method, setMethod] = useState<"online" | "cod">("online");
  const pay = useRazorpay();
  const [c, setC] = useState({ first_name: "", last_name: "", email: "", phone: "", instagram: "" });

  useEffect(() => {
    if (profile) setC({ first_name: profile.first_name ?? "", last_name: profile.last_name ?? "", email: profile.email ?? user?.email ?? "", phone: profile.phone ?? "", instagram: profile.instagram ?? "" });
  }, [profile, user]);
  useEffect(() => {
    if (!selected && addresses.length) setSelected(addresses[0].id);
  }, [addresses, selected]);

  const valid = lines.filter((l) => l.quantity > 0);

  if (valid.length === 0)
    return (
      <div className="py-32 text-center">
        <h1 className="text-4xl">Nothing to check out yet</h1>
        <Button asChild className="mt-6"><Link to="/shop">Shop candles</Link></Button>
      </div>
    );

  async function place() {
    const cr = contactSchema.safeParse(c);
    if (!cr.success) return toast.error(cr.error.issues[0].message);
    const addr = addresses.find((a) => a.id === selected);
    if (!addr) return toast.error("Please add a delivery address");
    setPlacing(true);
    await supabase.from("profiles").update({ ...cr.data, updated_at: new Date().toISOString() }).eq("id", uid);
    const { full_name, phone, line1, landmark, city, state, pincode } = addr;
    const { data, error } = await supabase.rpc("place_order", {
      _items: valid.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
      _address: { full_name, phone, line1, landmark, city, state, pincode },
      _contact: cr.data,
    });
    if (error) {
      setPlacing(false);
      toast.error(error.message || "We couldn't place your order. Please try again.");
      qc.invalidateQueries({ queryKey: ["products"] });
      return;
    }
    const res = data as { id: string; order_number: string };
    clearLocal();
    qc.invalidateQueries();
    if (method === "online") {
      try {
        const r = await pay(res.id);
        if (r === "paid") toast.success("Payment received — thank you!");
        else toast.message("Payment not completed. You can pay from your order page or pay cash on delivery.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Payment failed");
      }
    }
    setPlacing(false);
    navigate({ to: "/orders/$id", params: { id: res.id }, search: { placed: true } });
  }

  const set = (k: keyof typeof c) => ({ value: c[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value }) });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="rounded-2xl border bg-card/60 p-6">
            <h2 className="text-2xl">Your details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="c-fn">First name</Label><Input id="c-fn" {...set("first_name")} autoComplete="given-name" /></div>
              <div className="space-y-2"><Label htmlFor="c-ln">Last name</Label><Input id="c-ln" {...set("last_name")} autoComplete="family-name" /></div>
              <div className="space-y-2"><Label htmlFor="c-em">Email</Label><Input id="c-em" type="email" {...set("email")} autoComplete="email" /></div>
              <div className="space-y-2"><Label htmlFor="c-ph">Mobile number</Label><Input id="c-ph" inputMode="numeric" {...set("phone")} autoComplete="tel-national" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="c-ig">Instagram ID <span className="text-muted-foreground">(optional)</span></Label><Input id="c-ig" placeholder="@yourhandle" {...set("instagram")} /></div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card/60 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">Delivery address</h2>
              {addresses.length > 0 && !adding && <Button variant="outline" size="sm" onClick={() => setAdding(true)}>Add new</Button>}
            </div>
            <div className="mt-5 space-y-3">
              {!addrLoading && addresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a.id)}
                  className={cn("flex w-full items-start gap-3 rounded-xl border p-4 text-left transition", selected === a.id ? "border-primary bg-primary/10" : "hover:border-primary/40")}
                  aria-pressed={selected === a.id}
                >
                  <span className={cn("mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border", selected === a.id && "border-primary bg-primary text-primary-foreground")}>{selected === a.id && <Check className="h-3 w-3" />}</span>
                  <span className="text-sm">
                    <span className="block font-medium">{a.full_name} · {a.phone}</span>
                    <span className="block text-muted-foreground">{a.line1}{a.landmark ? `, near ${a.landmark}` : ""}, {a.city}, {a.state} – {a.pincode}</span>
                  </span>
                </button>
              ))}
              {(adding || (!addrLoading && addresses.length === 0)) && (
                <AddressForm
                  initial={{ full_name: [c.first_name, c.last_name].filter(Boolean).join(" "), phone: c.phone }}
                  submitLabel="Use this address"
                  onCancel={addresses.length ? () => setAdding(false) : undefined}
                  onSubmit={async (a) => {
                    const { data, error } = await supabase.from("addresses").insert({ ...a, user_id: uid, is_default: addresses.length === 0 }).select().single();
                    if (error) return void toast.error("Couldn't save the address");
                    await qc.invalidateQueries({ queryKey: ["addresses", uid] });
                    setSelected(data.id);
                    setAdding(false);
                  }}
                />
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-card/60 p-6">
            <h2 className="text-2xl">Payment</h2>
            <div className="mt-4 grid gap-3">
              {([
                { k: "online", icon: CreditCard, t: "Pay online", d: "UPI, cards, netbanking & wallets via Razorpay." },
                { k: "cod", icon: Banknote, t: "Cash on Delivery", d: "Pay when your candles arrive." },
              ] as const).map((m) => (
                <button key={m.k} type="button" onClick={() => setMethod(m.k)} aria-pressed={method === m.k}
                  className={cn("flex items-center gap-3 rounded-xl border p-4 text-left transition", method === m.k ? "border-primary bg-primary/10" : "hover:border-primary/40")}>
                  <m.icon className="h-6 w-6 text-primary" />
                  <div><p className="font-medium">{m.t}</p><p className="text-sm text-muted-foreground">{m.d}</p></div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border bg-card-gradient p-6 lg:sticky lg:top-28">
          <h2 className="text-2xl">Order summary</h2>
          <ul className="my-4 space-y-3">
            {valid.map((l) => (
              <li key={l.productId} className="flex items-center gap-3 text-sm">
                <img src={l.product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <span className="flex-1">{l.product.name} × {l.quantity}</span>
                <span>{formatINR(Number(l.product.price) * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <CartTotals />
          <Button size="lg" className="mt-6 w-full" disabled={placing || !selected} onClick={place}>
            {placing ? "Placing order…" : `Place order · ${formatINR(total)}`}
          </Button>
        </aside>
      </div>
    </div>
  );
}
