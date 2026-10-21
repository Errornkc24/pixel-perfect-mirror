import { useServerFn } from "@tanstack/react-start";
import { createRazorpayOrder, verifyRazorpayPayment } from "./payments.functions";

declare global {
  interface Window { Razorpay?: any }
}

function loadScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Razorpay for an existing order. Resolves "paid", "dismissed", or throws. */
export function useRazorpay() {
  const create = useServerFn(createRazorpayOrder);
  const verify = useServerFn(verifyRazorpayPayment);
  return async (orderId: string): Promise<"paid" | "dismissed"> => {
    if (!(await loadScript())) throw new Error("Couldn't load the payment window. Check your connection.");
    const rp = await create({ data: { orderId } });
    return new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: rp.keyId,
        order_id: rp.razorpayOrderId,
        amount: rp.amount,
        currency: "INR",
        name: "Tanvisha's Candles",
        description: `Order #${rp.orderNumber}`,
        image: `${window.location.origin}/images/logo.webp`,
        prefill: rp.prefill,
        theme: { color: "#d4a24c" },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verify({ data: { orderId, ...r } });
            resolve("paid");
          } catch (e) {
            reject(e);
          }
        },
        modal: { ondismiss: () => resolve("dismissed") },
      });
      checkout.on("payment.failed", () => {});
      checkout.open();
    });
  };
}
