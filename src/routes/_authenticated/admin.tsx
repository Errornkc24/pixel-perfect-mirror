import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Bell, Boxes, History, LayoutDashboard, Package, Tags, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminProductsQuery, isAdminRole, isLowStock, useRoles } from "@/lib/admin";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Tanvisha's Candles" },
      { name: "description", content: "Manage candles, stock and orders." },
      { property: "og:title", content: "Admin — Tanvisha's Candles" },
      { property: "og:description", content: "Manage candles, stock and orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { data: roles, isLoading } = useRoles();
  if (isLoading) return <div className="py-32 text-center text-muted-foreground">Loading…</div>;
  if (!isAdminRole(roles)) return <NoAccess />;
  return <AdminShell isOwner={!!roles?.includes("owner")} />;
}

function NoAccess() {
  const qc = useQueryClient();
  const { data: hasOwner } = useQuery({
    queryKey: ["store_has_owner"],
    queryFn: async () => (await supabase.rpc("store_has_owner")).data ?? true,
  });
  return (
    <div className="mx-auto max-w-md py-32 text-center">
      <h1 className="text-4xl">Store admin</h1>
      {hasOwner === false ? (
        <>
          <p className="mt-3 text-muted-foreground">No owner has been set up yet. Claim this store to become its owner.</p>
          <Button
            className="mt-6"
            onClick={async () => {
              const { error } = await supabase.rpc("claim_owner");
              if (error) return void toast.error(error.message);
              toast.success("You're now the store owner");
              qc.invalidateQueries();
            }}
          >
            Claim ownership
          </Button>
        </>
      ) : (
        <p className="mt-3 text-muted-foreground">This area is for the store team only.</p>
      )}
    </div>
  );
}

function AdminShell({ isOwner }: { isOwner: boolean }) {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery(adminProductsQuery);
  const low = products.filter(isLowStock);

  useEffect(() => {
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p) => {
        toast.success(`New order ${(p.new as { order_number?: string }).order_number ?? ""}`);
        qc.invalidateQueries({ queryKey: ["admin"] });
      })
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [qc]);

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/orders", label: "Orders", icon: Package },
    { to: "/admin/products", label: "Products", icon: Boxes },
    { to: "/admin/categories", label: "Categories", icon: Tags },
    { to: "/admin/stock", label: "Stock history", icon: History },
    ...(isOwner ? [{ to: "/admin/team", label: "Team", icon: Users }] : []),
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-4xl">Store admin</h1>
        <Popover>
          <PopoverTrigger className="relative grid h-10 w-10 place-items-center rounded-full border hover:bg-accent/60" aria-label={`Low stock alerts, ${low.length}`}>
            <Bell className="h-5 w-5" />
            {low.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] text-destructive-foreground">{low.length}</span>}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <p className="mb-2 font-medium">Low stock</p>
            {low.length === 0 ? <p className="text-sm text-muted-foreground">All candles are well stocked.</p> : (
              <ul className="space-y-1 text-sm">
                {low.map((p) => <li key={p.id} className="flex justify-between"><span className="truncate">{p.name}</span><span className={p.stock === 0 ? "text-destructive" : "text-primary"}>{p.stock} left</span></li>)}
              </ul>
            )}
            <Link to="/admin/products" className="mt-3 block text-sm text-primary">Manage stock →</Link>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col print:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: "exact" in l }} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 data-[status=active]:bg-primary/15 data-[status=active]:text-primary">
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
