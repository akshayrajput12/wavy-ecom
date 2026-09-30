import { describe, expect, it } from "vitest";
import { deliverySteps, type TimelineSource } from "./timeline";

const base: TimelineSource = { status: "paid", placedAt: "2026-09-01T10:00:00Z", history: [] };
const reached = (o: TimelineSource) => deliverySteps(o).filter((s) => s.done).length;

describe("deliverySteps", () => {
  it("starts at placed for a paid order", () => {
    expect(reached(base)).toBe(1);
    expect(deliverySteps(base)[0]).toMatchObject({ key: "placed", current: true, at: base.placedAt });
  });

  it("follows the shipment when the courier has it", () => {
    const shipment = { carrier: "X", awb: "1", status: "out_for_delivery" as const, events: [{ at: "2026-09-03T08:00:00Z", status: "out_for_delivery" as const }] };
    const s = deliverySteps({ ...base, status: "shipped", shipment });
    expect(s.filter((x) => x.done)).toHaveLength(4);
    expect(s[3]).toMatchObject({ current: true, at: "2026-09-03T08:00:00Z" });
  });

  it("completes on delivery (also after a return was requested) and stays at placed when cancelled", () => {
    expect(reached({ ...base, status: "return_requested", deliveredAt: "2026-09-04T00:00:00Z" })).toBe(5);
    expect(reached({ ...base, status: "cancelled" })).toBe(1);
  });
});
