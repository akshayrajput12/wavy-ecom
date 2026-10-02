import { describe, expect, it } from "vitest";
import { EDGE_DONE, FRAME_H, FRAME_W, edgeShapes, scrollProgress, stages, tearLine, viewBox } from "./tearGeometry";

describe("tearGeometry", () => {
  it("maps the pinned scroll to 0..1", () => {
    expect(scrollProgress(100, 2000, 800)).toBe(0);
    expect(scrollProgress(-600, 2000, 800)).toBe(0.5);
    expect(scrollProgress(-5000, 2000, 800)).toBe(1);
    expect(scrollProgress(-1, 800, 800)).toBe(1); // no runway: already through
  });

  it("starts whole and ends fully torn", () => {
    expect(stages(0)).toMatchObject({ crack: 0, open: 0, rise: 0, pop: 0, shake: 0 });
    expect(stages(1)).toMatchObject({ crack: 1, open: 1, rise: 1, pop: 1, shake: 0 });
  });

  it("grows the frame about its centre, keeping the aspect", () => {
    const [x, y, w, h] = viewBox(1.25).split(" ").map(Number);
    const [x0, y0] = viewBox().split(" ").map(Number);
    expect(w / h).toBeCloseTo(FRAME_W / FRAME_H);
    expect(x + w / 2).toBeCloseTo(x0 + FRAME_W / 2);
    expect(y + h / 2).toBeCloseTo(y0 + FRAME_H / 2);
  });

  it("stops reshaping the torn edge once it is open enough", () => {
    const line = tearLine();
    expect(edgeShapes("top", line, 1)).toEqual(edgeShapes("top", line, EDGE_DONE));
    expect(edgeShapes("bottom", line, 0.1)).not.toEqual(edgeShapes("bottom", line, EDGE_DONE));
  });
});
