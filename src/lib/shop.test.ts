import { describe, expect, it } from "vitest";
import { canCustomerCancel, clampQty, shippingFor, stockState } from "./shop";

describe("stock display", () => {
  it("shows out of stock at 0", () => expect(stockState(0)).toEqual({ kind: "out" }));
  it("shows only X left from 1 to 5", () => {
    expect(stockState(1)).toEqual({ kind: "low", left: 1 });
    expect(stockState(5)).toEqual({ kind: "low", left: 5 });
  });
  it("hides the number above 5", () => expect(stockState(6)).toEqual({ kind: "available" }));
});

describe("cart quantity", () => {
  it("never exceeds stock", () => expect(clampQty(9, 4)).toBe(4));
});

describe("shipping", () => {
  it("is free from 999", () => expect(shippingFor(999)).toBe(0));
  it("costs 79 below 999", () => expect(shippingFor(998)).toBe(79));
});

describe("cancellation", () => {
  it("allowed before packed", () => {
    expect(canCustomerCancel("placed")).toBe(true);
    expect(canCustomerCancel("confirmed")).toBe(true);
  });
  it("blocked once packed", () => expect(canCustomerCancel("packed")).toBe(false));
});
