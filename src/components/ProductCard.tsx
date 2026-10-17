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
    <article className="group flex flex-col rounded-[20px] border border-border bg-card p-2 pb-4 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-[4/5] overflow-hidden rounded-[14px] bg-secondary"
      >
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
      <div className="flex flex-1 flex-col gap-2 px-2 pt-4 text-center sm:px-3">
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3 className="text-2xl font-semibold leading-tight transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
        <div className="mt-auto pt-2">
          <span className="font-display text-2xl font-semibold text-bloom">
            {formatINR(Number(product.price))}
          </span>
          <Button
            className="mt-3 w-full rounded-full uppercase tracking-[0.18em]"
            size="sm"
            variant={out ? "secondary" : "default"}
            disabled={out}
            onClick={() => add(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag /> {out ? "Sold out" : "Add"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-[20px] border bg-card p-2">
      <Skeleton className="aspect-[4/5] w-full rounded-[14px] bg-muted" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-6 w-2/3 bg-muted" />
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-8 w-full bg-muted" />
      </div>
    </div>
  );
}
