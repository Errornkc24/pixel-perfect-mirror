// Razorpay signature check: HMAC-SHA256(order_id|payment_id, key_secret) as hex.
export async function razorpaySignature(orderId: string, paymentId: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${orderId}|${paymentId}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Razorpay amounts are in paise.
export const toPaise = (rupees: number) => Math.round(rupees * 100);
