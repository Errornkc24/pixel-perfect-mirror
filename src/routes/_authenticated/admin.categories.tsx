import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery } from "@/lib/queries";
import { slugify, useRoles } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/admin/categories")({ head: () => pageHead("Manage categories", "Organize candle categories for the store.", true), component: Categories });

function Categories() {
  const qc = useQueryClient();
  const { data: roles } = useRoles();
  const isOwner = !!roles?.includes("owner");
  const { data: cats = [] } = useQuery(categoriesQuery);
  const [name, setName] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  async function add() {
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name), sort: cats.length });
    if (error) return toast.error(error.message.includes("slug") ? "That category already exists" : error.message);
    setName(""); refresh();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-3xl">Categories</h2>
      {!isOwner && <p className="text-sm text-muted-foreground">Only the owner can change categories.</p>}
      {isOwner && (
        <div className="flex gap-2"><Input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" /><Button onClick={add}>Add</Button></div>
      )}
      <ul className="divide-y divide-border rounded-2xl border bg-card/60">
        {cats.map((c) => <Row key={c.id} id={c.id} name={c.name} editable={isOwner} onChange={refresh} />)}
      </ul>
    </div>
  );
}

function Row({ id, name, editable, onChange }: { id: string; name: string; editable: boolean; onChange: () => void }) {
  const [v, setV] = useState(name);
  return (
    <li className="flex items-center gap-2 p-3">
      {editable ? <Input value={v} onChange={(e) => setV(e.target.value)} className="max-w-xs" /> : <span>{name}</span>}
      {editable && (
        <>
          <Button size="sm" variant="outline" disabled={v === name || !v.trim()} onClick={async () => { const { error } = await supabase.from("categories").update({ name: v.trim() }).eq("id", id); if (error) toast.error(error.message); else { toast.success("Renamed"); onChange(); } }}>Save</Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { if (!confirm(`Delete "${name}"? Candles in it will become uncategorised.`)) return; const { error } = await supabase.from("categories").delete().eq("id", id); if (error) toast.error(error.message); else onChange(); }}>Delete</Button>
        </>
      )}
    </li>
  );
}
