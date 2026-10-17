import { stockState } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  const s = stockState(stock);
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider backdrop-blur";
  if (s.kind === "out") return <span className={cn(base, "bg-destructive/85 text-destructive-foreground", className)}>Out of Stock</span>;
  if (s.kind === "low")
    return <span className={cn(base, "bg-warning/90 text-primary-foreground", className)}>Only {s.left} left</span>;
  return (
    <span className={cn(base, "bg-background/60 text-success", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-success" /> In stock
    </span>
  );
}
