import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo } from "react";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Sort = "newest" | "price-asc" | "price-desc";
type ShopSearch = { q?: string; category?: string; sort?: Sort };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    q: typeof s.q === "string" && s.q ? s.q.slice(0, 80) : undefined,
    category: typeof s.category === "string" && s.category ? s.category : undefined,
    sort: s.sort === "price-asc" || s.sort === "price-desc" || s.sort === "newest" ? s.sort : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Scented Candles — Tanvisha's Candles" },
      { name: "description", content: "Browse hand-poured soy candles: floral, woody, fresh and sweet scents." },
      { property: "og:title", content: "Shop Scented Candles — Tanvisha's Candles" },
      { property: "og:description", content: "Browse hand-poured soy candles by scent family." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products, isLoading, error } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const sort = search.sort ?? "newest";

  const list = useMemo(() => {
    let l = products ?? [];
    const cat = categories.find((c) => c.slug === search.category);
    if (cat) l = l.filter((p) => p.category_id === cat.id);
    if (search.q) {
      const q = search.q.toLowerCase();
      l = l.filter((p) => [p.name, p.short_description, ...p.scent_notes].join(" ").toLowerCase().includes(q));
    }
    const s = [...l];
    if (sort === "price-asc") s.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price-desc") s.sort((a, b) => Number(b.price) - Number(a.price));
    else s.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return s;
  }, [products, categories, search, sort]);

  const set = (patch: Partial<ShopSearch>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <span className="font-brand text-xs tracking-[0.4em] text-primary">THE COLLECTION</span>
        <h1 className="mt-2 text-5xl">Shop Candles</h1>
      </div>

      <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            defaultValue={search.q}
            onChange={(e) => set({ q: e.target.value || undefined })}
            placeholder="Search scents, notes…"
            aria-label="Search candles"
            className="h-11 rounded-full bg-card/60 pl-10"
          />
        </div>
        <Select value={sort} onValueChange={(v) => set({ sort: v as Sort })}>
          <SelectTrigger className="h-11 rounded-full bg-card/60 md:w-52" aria-label="Sort by"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="price-asc">Price: low to high</SelectItem>
            <SelectItem value="price-desc">Price: high to low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Categories">
        {[{ slug: undefined, name: "All" }, ...categories.map((c) => ({ slug: c.slug, name: c.name }))].map((c) => (
          <button
            key={c.name}
            role="tab"
            aria-selected={search.category === c.slug}
            onClick={() => set({ category: c.slug })}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
              search.category === c.slug ? "border-primary bg-primary/15 text-primary" : "text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {error ? (
          <p className="py-20 text-center text-muted-foreground">We couldn't load candles right now. Please refresh.</p>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl">No candles match that search</p>
            <button onClick={() => set({ q: undefined, category: undefined })} className="mt-3 text-sm text-primary underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </div>
    </div>
  );
}
