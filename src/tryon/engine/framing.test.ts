import { describe, expect, it } from "vitest";
import { coverRect, framingHint } from "./framing";
import type { Landmark } from "./garmentFit";

const FULL = { x0: 0, y0: 0, w: 1, h: 1 };

/** Build a 33-point pose; shoulders at sx±half, hips/knees/ankles below. */
function pose(cx: number, half: number, opts: { hips?: boolean; legs?: boolean } = {}): Landmark[] {
  const lms: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
  const v = (on = true) => (on ? 0.95 : 0.1);
  lms[11] = { x: cx + half, y: 0.3, visibility: 0.95 };
  lms[12] = { x: cx - half, y: 0.3, visibility: 0.95 };
  lms[23] = { x: cx + half * 0.6, y: 0.6, visibility: v(opts.hips ?? true) };
  lms[24] = { x: cx - half * 0.6, y: 0.6, visibility: v(opts.hips ?? true) };
  for (const i of [25, 26, 27, 28]) lms[i] = { x: cx, y: 0.85, visibility: v(opts.legs ?? true) };
  return lms;
}

describe("coverRect", () => {
  it("crops the sides of a landscape video shown in a portrait box", () => {
    const r = coverRect(1280, 720, 300, 400);
    expect(r.h).toBe(1);
    expect(r.w).toBeCloseTo(0.4219, 3);
    expect(r.x0).toBeCloseTo((1 - r.w) / 2, 6);
  });
  it("falls back to the full frame before metadata loads", () => {
    expect(coverRect(0, 0, 300, 400)).toEqual(FULL);
  });
});

describe("framingHint (top)", () => {
  it("asks for a person when nobody is tracked", () => {
    expect(framingHint(null, "top", FULL)).toBe("no_person");
  });
  it("aligned when centred at a good distance", () => {
    expect(framingHint(pose(0.5, 0.2), "top", FULL)).toBe("aligned");
  });
  it("step back / move closer by shoulder span", () => {
    expect(framingHint(pose(0.5, 0.4), "top", FULL)).toBe("step_back");
    expect(framingHint(pose(0.5, 0.08), "top", FULL)).toBe("move_closer");
  });
  it("needs hips in view", () => {
    expect(framingHint(pose(0.5, 0.2, { hips: false }), "top", FULL)).toBe("show_hips");
  });
  it("direction hints account for the mirrored preview", () => {
    // raw x 0.25 → shown on the right of the mirrored stage → user should move left
    expect(framingHint(pose(0.25, 0.2), "top", FULL)).toBe("move_left");
    expect(framingHint(pose(0.75, 0.2), "top", FULL)).toBe("move_right");
  });
  it("span is measured against the visible crop, not the whole frame", () => {
    const view = coverRect(1280, 720, 300, 400); // ~42% of width visible
    expect(framingHint(pose(0.5, 0.1), "top", view)).toBe("aligned");
  });
});

describe("framingHint (bottom)", () => {
  it("needs legs in view", () => {
    expect(framingHint(pose(0.5, 0.15, { legs: false }), "bottom", FULL)).toBe("show_legs");
  });
  it("aligned when hips are centred and at distance", () => {
    expect(framingHint(pose(0.5, 0.15), "bottom", FULL)).toBe("aligned");
  });
});
