import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Clock, Scale, ShoppingBag, Sparkles } from "lucide-react";
import { useState } from "react";
import { QtyStepper } from "@/components/CartDrawer";
import { ProductCard } from "@/components/ProductCard";
import { StockBadge } from "@/components/StockBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { productsQuery } from "@/lib/queries";
import { formatINR } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const name = params.slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
    return {
      meta: [
        { title: `${name} Candle — Tanvisha's Candles` },
        { name: "description", content: `${name}: a hand-poured soy scented candle by Tanvisha's Candles.` },
        { property: "og:title", content: `${name} Candle — Tanvisha's Candles` },
        { property: "og:description", content: `Hand-poured ${name} soy candle.` },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products, isLoading } = useQuery(productsQuery);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const product = products?.find((p) => p.slug === slug);

  if (isLoading)
    return (
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-3xl bg-muted" />
        <div className="space-y-4"><Skeleton className="h-12 w-2/3 bg-muted" /><Skeleton className="h-6 w-1/3 bg-muted" /><Skeleton className="h-32 w-full bg-muted" /></div>
      </div>
    );

  if (!product)
    return (
      <div className="py-32 text-center">
        <h1 className="text-3xl">We couldn't find that candle</h1>
        <Button asChild className="mt-6"><Link to="/shop">Back to shop</Link></Button>
      </div>
    );

  const out = product.stock <= 0;
  const related = (products ?? []).filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ChevronLeft className="h-4 w-4" /> All candles</Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-3xl border shadow-soft">
            <img src={product.images[img]} alt={`${product.name} candle`} width={900} height={900} className="aspect-square w-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((src, i) => (
                <button key={src} onClick={() => setImg(i)} aria-label={`Show image ${i + 1}`} className={cn("h-20 w-20 overflow-hidden rounded-xl border-2 transition", i === img ? "border-primary" : "border-transparent opacity-60 hover:opacity-100")}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <StockBadge stock={product.stock} className="self-start" />
          <h1 className="mt-4 text-5xl leading-tight">{product.name}</h1>
          <p className="mt-2 font-display text-xl italic text-bloom">{product.short_description}</p>
          <p className="mt-6 font-brand text-3xl text-primary">{formatINR(Number(product.price))}</p>
          <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-6">
            <p className="flex items-center gap-2 text-sm uppercase tracking-widest text-primary"><Sparkles className="h-4 w-4" /> Scent notes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.scent_notes.map((n) => <span key={n} className="rounded-full border px-3 py-1 text-sm">{n}</span>)}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-xl border bg-card/60 p-3"><Clock className="h-4 w-4 text-primary" /> {product.burn_time ?? "—"} burn</div>
            <div className="flex items-center gap-2 rounded-xl border bg-card/60 p-3"><Scale className="h-4 w-4 text-primary" /> {product.size ?? "—"}</div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            {!out && <QtyStepper value={qty} max={product.stock} onChange={(n) => setQty(Math.max(1, Math.min(n, product.stock)))} label={product.name} />}
            <Button size="lg" className="flex-1" disabled={out} onClick={() => add(product, qty)}>
              <ShoppingBag /> {out ? "Out of Stock" : "Add to cart"}
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Cash on Delivery · Free shipping on orders above ₹999</p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-center text-3xl">You may also love</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}
