import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR, type Product } from "@/lib/shop";
import { StockBadge } from "./StockBadge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const out = product.stock <= 0;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card-gradient shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="relative block aspect-square overflow-hidden">
        <img
          src={product.images[0]}
          alt={`${product.name} scented candle`}
          loading="lazy"
          width={600}
          height={600}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <StockBadge stock={product.stock} className="absolute left-3 top-3" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3 className="text-xl leading-tight transition-colors group-hover:text-primary sm:text-2xl">{product.name}</h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-brand text-lg text-primary">{formatINR(Number(product.price))}</span>
          <Button size="sm" variant={out ? "secondary" : "outline"} disabled={out} onClick={() => add(product)} aria-label={`Add ${product.name} to cart`}>
            <ShoppingBag /> {out ? "Sold out" : "Add"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="aspect-square w-full rounded-none bg-muted" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-6 w-2/3 bg-muted" />
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-8 w-full bg-muted" />
      </div>
    </div>
  );
}
