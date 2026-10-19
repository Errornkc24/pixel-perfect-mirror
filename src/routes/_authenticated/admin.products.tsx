import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminProductsQuery, isLowStock, slugify } from "@/lib/admin";
import { categoriesQuery } from "@/lib/queries";
import { formatINR } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: Products });

type P = Awaited<ReturnType<NonNullable<typeof adminProductsQuery.queryFn>>>[number];

function Products() {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery(adminProductsQuery);
  const [editing, setEditing] = useState<P | "new" | null>(null);
  const [adjusting, setAdjusting] = useState<P | null>(null);
  const [q, setQ] = useState("");
  const shown = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin"] }); qc.invalidateQueries({ queryKey: ["products"] }); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-3xl">Products</h2>
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-48" />
        <Button onClick={() => setEditing("new")}><Plus /> New candle</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card/60">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="p-3">Candle</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-border">
            {shown.map((p) => (
              <tr key={p.id}>
                <td className="p-3"><div className="flex items-center gap-3">{p.images[0] && <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />}<span>{p.name}<span className="block text-xs text-muted-foreground">{p.categories?.name ?? "No category"}</span></span></div></td>
                <td className="p-3">{formatINR(Number(p.price))}</td>
                <td className="p-3"><span className={p.stock === 0 ? "text-destructive" : isLowStock(p) ? "text-primary" : ""}>{p.stock}</span></td>
                <td className="p-3">{p.archived ? <span className="text-muted-foreground">Hidden</span> : "Live"}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => setAdjusting(p)}>Stock</Button>{" "}
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing === "new" ? "New candle" : "Edit candle"}</DialogTitle></DialogHeader>
          {editing && <ProductForm product={editing === "new" ? null : editing} onDone={() => { setEditing(null); refresh(); }} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!adjusting} onOpenChange={(o) => !o && setAdjusting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust stock · {adjusting?.name}</DialogTitle></DialogHeader>
          {adjusting && <StockForm product={adjusting} onDone={() => { setAdjusting(null); refresh(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({ product, onDone }: { product: P | null; onDone: () => void }) {
  const { data: cats = [] } = useQuery(categoriesQuery);
  const [f, setF] = useState({
    name: product?.name ?? "", slug: product?.slug ?? "", short_description: product?.short_description ?? "",
    description: product?.description ?? "", scent_notes: product?.scent_notes.join(", ") ?? "",
    burn_time: product?.burn_time ?? "", size: product?.size ?? "", price: String(product?.price ?? ""),
    category_id: product?.category_id ?? "", images: product?.images.join("\n") ?? "",
    stock: "0", low_stock_threshold: String(product?.low_stock_threshold ?? 5),
    featured: product?.featured ?? false, bestseller: product?.bestseller ?? false, archived: product?.archived ?? false,
  });
  const [saving, setSaving] = useState(false);
  const t = (k: keyof typeof f) => ({ value: f[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }) });

  async function save() {
    const price = Number(f.price);
    if (!f.name.trim()) return toast.error("Enter a name");
    if (!(price >= 0) || f.price === "") return toast.error("Enter a valid price");
    const row = {
      name: f.name.trim(), slug: slugify(f.slug || f.name), short_description: f.short_description || null,
      description: f.description || null, scent_notes: f.scent_notes.split(",").map((s) => s.trim()).filter(Boolean),
      burn_time: f.burn_time || null, size: f.size || null, price, category_id: f.category_id || null,
      images: f.images.split("\n").map((s) => s.trim()).filter(Boolean),
      low_stock_threshold: Math.max(0, Math.floor(Number(f.low_stock_threshold) || 0)),
      featured: f.featured, bestseller: f.bestseller, archived: f.archived,
    };
    setSaving(true);
    if (product) {
      const { error } = await supabase.from("products").update(row).eq("id", product.id);
      setSaving(false);
      if (error) return toast.error(error.message.includes("slug") ? "That web name is already used" : error.message);
    } else {
      const { data, error } = await supabase.from("products").insert(row).select("id").single();
      if (error) { setSaving(false); return toast.error(error.message.includes("slug") ? "That web name is already used" : error.message); }
      const qty = Math.floor(Number(f.stock) || 0);
      if (qty > 0) await supabase.rpc("admin_adjust_stock", { _product_id: data.id, _change: qty, _reason: "initial" });
      setSaving(false);
    }
    toast.success("Saved");
    onDone();
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name"><Input {...t("name")} /></Field>
      <Field label="Web name (optional)"><Input {...t("slug")} placeholder={slugify(f.name)} /></Field>
      <Field label="Price (₹)"><Input inputMode="decimal" {...t("price")} /></Field>
      <Field label="Category">
        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
          <option value="">None</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Size"><Input {...t("size")} placeholder="200g" /></Field>
      <Field label="Burn time"><Input {...t("burn_time")} placeholder="40 hours" /></Field>
      {!product && <Field label="Starting stock"><Input inputMode="numeric" {...t("stock")} /></Field>}
      <Field label="Low stock alert at"><Input inputMode="numeric" {...t("low_stock_threshold")} /></Field>
      <div className="sm:col-span-2"><Field label="Scent notes (comma separated)"><Input {...t("scent_notes")} /></Field></div>
      <div className="sm:col-span-2"><Field label="Short description"><Input {...t("short_description")} /></Field></div>
      <div className="sm:col-span-2"><Field label="Full description"><Textarea rows={4} {...t("description")} /></Field></div>
      <div className="sm:col-span-2"><Field label="Photo links (one per line)"><Textarea rows={3} {...t("images")} placeholder="https://…" /></Field></div>
      <div className="flex flex-wrap gap-6 sm:col-span-2">
        {(["featured", "bestseller", "archived"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm"><Switch checked={f[k]} onCheckedChange={(v) => setF({ ...f, [k]: v })} />{k === "archived" ? "Hide from shop" : k === "featured" ? "Featured" : "Bestseller"}</label>
        ))}
      </div>
      <Button className="sm:col-span-2" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</Button>
    </div>
  );
}

function StockForm({ product, onDone }: { product: P; onDone: () => void }) {
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    const n = Math.floor(Number(qty));
    if (!(n > 0)) return toast.error("Enter a quantity");
    setBusy(true);
    const { error } = await supabase.rpc("admin_adjust_stock", { _product_id: product.id, _change: mode === "add" ? n : -n, _reason: reason, _note: note || undefined });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Stock updated");
    onDone();
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Current stock: <span className="text-foreground">{product.stock}</span></p>
      <div className="flex gap-2">
        <Button variant={mode === "add" ? "default" : "outline"} onClick={() => { setMode("add"); setReason("restock"); }}>Add</Button>
        <Button variant={mode === "remove" ? "default" : "outline"} onClick={() => { setMode("remove"); setReason("damaged"); }}>Remove</Button>
      </div>
      <Field label="Quantity"><Input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      <Field label="Reason">
        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>
          {(mode === "add" ? ["restock", "returned", "correction"] : ["damaged", "lost", "gifted", "correction"]).map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="Note (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <Button className="w-full" disabled={busy} onClick={save}>Update stock</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
