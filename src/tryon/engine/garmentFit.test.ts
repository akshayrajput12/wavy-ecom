import { describe, expect, it } from "vitest";
import { computeGarmentFit, LM, smoothLandmarks, type Calibration, type Landmark } from "./garmentFit";

const cal: Calibration = { widthScale: 2, lengthScale: 1, offsetY: 0, offsetX: 0 };

function body(over: Partial<Record<number, Landmark>> = {}): Landmark[] {
  const lms: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }));
  // Upright person, un-mirrored frame: right shoulder on image-left.
  lms[LM.rightShoulder] = { x: 0.4, y: 0.3, visibility: 1 };
  lms[LM.leftShoulder] = { x: 0.6, y: 0.3, visibility: 1 };
  lms[LM.rightHip] = { x: 0.42, y: 0.6, visibility: 1 };
  lms[LM.leftHip] = { x: 0.58, y: 0.6, visibility: 1 };
  lms[LM.rightKnee] = { x: 0.42, y: 0.75, visibility: 1 };
  lms[LM.leftKnee] = { x: 0.58, y: 0.75, visibility: 1 };
  lms[LM.rightAnkle] = { x: 0.42, y: 0.95, visibility: 1 };
  lms[LM.leftAnkle] = { x: 0.58, y: 0.95, visibility: 1 };
  Object.assign(lms, over);
  return lms;
}

describe("computeGarmentFit", () => {
  it("anchors a top at shoulder midpoint, scaled to shoulder width, level", () => {
    const fit = computeGarmentFit(body(), "top", cal, 1000, 1000)!;
    expect(fit.x).toBeCloseTo(500);
    expect(fit.y).toBeCloseTo(300);
    expect(fit.width).toBeCloseTo(400); // 200px shoulders * 2
    expect(fit.rotation).toBeCloseTo(0);
    const [a, b, c, d] = fit.matrix;
    expect([a, b, c, d].map((v) => Math.round(v))).toEqual([400, 0, 0, 300]); // torso 300px
  });

  it("follows a tilted shoulder line", () => {
    const fit = computeGarmentFit(body({ [LM.leftShoulder]: { x: 0.6, y: 0.5, visibility: 1 } }), "top", cal, 1000, 1000)!;
    expect(fit.rotation).toBeCloseTo(Math.PI / 4);
  });

  it("applies offsets along body axes", () => {
    const fit = computeGarmentFit(body(), "top", { ...cal, offsetY: -0.1 }, 1000, 1000)!;
    expect(fit.y).toBeCloseTo(270);
  });

  it("fits bottoms hip→ankles or hip→knees", () => {
    const long = computeGarmentFit(body(), "bottom", cal, 1000, 1000)!;
    const short = computeGarmentFit(body(), "bottom", { ...cal, lengthTo: "knees" }, 1000, 1000)!;
    expect(long.y).toBeCloseTo(600);
    expect(long.matrix[3]).toBeCloseTo(350);
    expect(short.matrix[3]).toBeCloseTo(150);
  });

  it("estimates a shirt from visible shoulders when hips are cropped out", () => {
    const fit = computeGarmentFit(body({ [LM.leftHip]: { x: 0.58, y: 0.6, visibility: 0.1 } }), "top", cal, 1000, 1000);
    expect(fit).not.toBeNull();
    expect(fit?.x).toBeCloseTo(500);
    expect(fit?.matrix[3]).toBeCloseTo(280);
  });

  it("returns null when required pose anchors are not visible", () => {
    expect(computeGarmentFit(body({ [LM.leftShoulder]: { x: 0.6, y: 0.3, visibility: 0.1 } }), "top", cal, 1000, 1000)).toBeNull();
    expect(computeGarmentFit(body({ [LM.leftAnkle]: { x: 0.58, y: 0.95, visibility: 0.1 } }), "bottom", cal, 1000, 1000)).toBeNull();
    expect(computeGarmentFit([], "top", cal, 1000, 1000)).toBeNull();
  });
});

describe("smoothLandmarks", () => {
  it("moves part-way toward the new value", () => {
    const out = smoothLandmarks([{ x: 0, y: 0 }], [{ x: 1, y: 1 }], 0.5);
    expect(out[0]).toMatchObject({ x: 0.5, y: 0.5 });
    expect(smoothLandmarks(null, [{ x: 1, y: 1 }], 0.5)[0]).toMatchObject({ x: 1, y: 1 });
  });
});
