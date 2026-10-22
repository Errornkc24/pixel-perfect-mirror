import { describe, expect, it } from "vitest";
import { razorpaySignature, safeEqual, toPaise } from "./razorpay-signature";

describe("razorpay", () => {
  it("converts rupees to paise", () => {
    expect(toPaise(1078)).toBe(107800);
    expect(toPaise(79.5)).toBe(7950);
  });
  it("signature verifies only with the right secret", async () => {
    const a = await razorpaySignature("order_1", "pay_1", "s1");
    expect(safeEqual(a, await razorpaySignature("order_1", "pay_1", "s1"))).toBe(true);
    expect(safeEqual(a, await razorpaySignature("order_1", "pay_1", "s2"))).toBe(false);
  });
});
