import { describe, expect, it } from "vitest";
import { indiaDate, previousRange, salesCsv, summarizeSales, type SalesOrder } from "./sales";

const order = (changes: Partial<SalesOrder> = {}): SalesOrder => ({ id: "one", order_number: "TC1", created_at: "2026-10-01T10:00:00Z", status: "placed", payment_status: "pending", payment_method: "cod", subtotal: 500, shipping: 79, total: 579, order_items: [{ name: "Rose", product_id: "rose", price: 250, quantity: 2 }], ...changes });
describe("sales reports", () => {
  it("uses India dates at midnight", () => expect(indiaDate("2026-09-30T18:30:00Z")).toBe("2026-10-01"));
  it("counts daily sales without multiplying totals by item count", () => {
    const report = summarizeSales([order()], "2026-10-01", "2026-10-02", "day");
    expect(report.periods.map(p => p.revenue)).toEqual([579, 0]);
    expect(report.units).toBe(2); expect(report.products[0].revenue).toBe(500);
  });
  it("groups months separately and includes all years", () => {
    const orders = [order(), order({ created_at: "2026-11-01T00:00:00Z" }), order({ created_at: "2027-01-01T00:00:00Z" })];
    expect(summarizeSales(orders, "2026-10-01", "2026-11-30", "month").periods.map(p => p.revenue)).toEqual([579, 579]);
    expect(summarizeSales(orders, "2026-01-01", "2027-12-31", "year").periods.map(p => p.revenue)).toEqual([1158, 579]);
  });
  it("separates cancelled sales and paid cancellations without assuming refunds", () => {
    const report = summarizeSales([order(), order({ status: "cancelled", payment_status: "paid" })], "2026-10-01", "2026-10-31", "day");
    expect(report.revenue).toBe(579); expect(report.cancelled).toBe(1); expect(report.cancelledPaid).toBe(579);
  });
  it("separates received payments from outstanding order values", () => {
    const report = summarizeSales([order(), order({ payment_status: "paid", payment_method: "online" })], "2026-10-01", "2026-10-31", "month");
    expect(report.collected).toBe(579); expect(report.outstanding).toBe(579);
  });
  it("uses an equally long preceding period", () => expect(previousRange("2026-10-01", "2026-10-31")).toEqual({ from: "2026-08-31", to: "2026-09-30" }));
  it("escapes spreadsheet formulas in exported names", () => expect(salesCsv([["=SUM(A1)", 579]])).toContain('"\'=SUM(A1)","579"'));
});