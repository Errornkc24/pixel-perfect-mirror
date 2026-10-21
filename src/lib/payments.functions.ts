import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { razorpaySignature, safeEqual, toPaise } from "./razorpay-signature";

function keys() {
  const id = process.env["RAZORPAY_KEY_ID"];
  const secret = process.env["RAZORPAY_KEY_SECRET"];
  if (!id || !secret) throw new Error("Online payments aren't set up yet. Please choose Cash on Delivery.");
  return { id, secret };
}

async function loadPayableOrder(supabase: any, orderId: string, userId: string) {
  const { data: o } = await supabase.from("orders").select("id, user_id, order_number, total, status, payment_status, contact").eq("id", orderId).maybeSingle();
  if (!o || o.user_id !== userId) throw new Error("Order not found");
  if (o.status === "cancelled") throw new Error("This order was cancelled");
  if (o.payment_status === "paid") throw new Error("This order is already paid");
  return o;
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { id, secret } = keys();
    const o = await loadPayableOrder(context.supabase, data.orderId, context.userId);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${btoa(`${id}:${secret}`)}` },
      body: JSON.stringify({ amount: toPaise(Number(o.total)), currency: "INR", receipt: o.order_number, notes: { order_id: o.id } }),
    });
    if (!res.ok) {
      console.error("Razorpay order failed", res.status, await res.text());
      throw new Error("Couldn't start the payment. Please try again.");
    }
    const rp = (await res.json()) as { id: string; amount: number };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("orders").update({ razorpay_order_id: rp.id }).eq("id", o.id);
    const c = (o.contact ?? {}) as { first_name?: string; last_name?: string; email?: string; phone?: string };
    return {
      keyId: id,
      razorpayOrderId: rp.id,
      amount: rp.amount,
      orderNumber: o.order_number as string,
      prefill: { name: [c.first_name, c.last_name].filter(Boolean).join(" "), email: c.email ?? "", contact: c.phone ?? "" },
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ orderId: z.string().uuid(), razorpay_order_id: z.string().min(1).max(100), razorpay_payment_id: z.string().min(1).max(100), razorpay_signature: z.string().min(1).max(200) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { secret } = keys();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin.from("orders").select("id, user_id, razorpay_order_id, payment_status").eq("id", data.orderId).maybeSingle();
    if (!o || o.user_id !== context.userId) throw new Error("Order not found");
    if (o.payment_status === "paid") return { ok: true };
    if (o.razorpay_order_id !== data.razorpay_order_id) throw new Error("Payment doesn't match this order");
    const expected = await razorpaySignature(data.razorpay_order_id, data.razorpay_payment_id, secret);
    if (!safeEqual(expected, data.razorpay_signature)) throw new Error("Payment could not be verified");
    await supabaseAdmin
      .from("orders")
      .update({ payment_method: "online", payment_status: "paid", razorpay_payment_id: data.razorpay_payment_id, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", o.id);
    return { ok: true };
  });
