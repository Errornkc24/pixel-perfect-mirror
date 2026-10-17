import { Check, X } from "lucide-react";
import { ORDER_STEPS, STATUS_LABEL, type OrderStatus } from "@/lib/shop";
import { cn } from "@/lib/utils";

export function OrderTimeline({ status, history }: { status: OrderStatus; history: { status: OrderStatus; created_at: string }[] }) {
  const when = (s: OrderStatus) => history.find((h) => h.status === s)?.created_at;
  const fmt = (d?: string) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

  if (status === "cancelled") {
    const reached = ORDER_STEPS.filter((s) => when(s));
    return (
      <ol className="space-y-4">
        {reached.map((s) => (
          <li key={s} className="flex items-center gap-3 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary"><Check className="h-4 w-4" /></span>{STATUS_LABEL[s]} <span className="text-muted-foreground">{fmt(when(s))}</span></li>
        ))}
        <li className="flex items-center gap-3 text-sm text-destructive"><span className="grid h-7 w-7 place-items-center rounded-full bg-destructive/20"><X className="h-4 w-4" /></span>Cancelled <span className="text-muted-foreground">{fmt(when("cancelled"))}</span></li>
      </ol>
    );
  }

  const idx = ORDER_STEPS.indexOf(status);
  return (
    <ol className="relative grid gap-0 sm:grid-cols-6" aria-label="Order progress">
      {ORDER_STEPS.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s} className="relative flex gap-3 pb-6 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
            {i < ORDER_STEPS.length - 1 && (
              <span className={cn("absolute left-[13px] top-7 h-full w-0.5 sm:left-1/2 sm:top-[13px] sm:h-0.5 sm:w-full", i < idx ? "bg-primary" : "bg-border")} aria-hidden />
            )}
            <span className={cn("relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-all", done ? "border-primary bg-gold text-primary-foreground shadow-glow" : "border-border bg-background")}>
              {done && <Check className="h-4 w-4" />}
            </span>
            <span className="text-sm sm:mt-2">
              <span className={cn("block", done ? "text-foreground" : "text-muted-foreground")}>{STATUS_LABEL[s]}</span>
              <span className="block text-xs text-muted-foreground">{fmt(when(s))}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
