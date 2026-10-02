import { describe, expect, it } from "vitest";
import { IMAGE_ACCEPT, formatList, planPicks, skippedMessage } from "./imagePicks";

const MB = 1024 * 1024;
const f = (name: string, type: string, mb = 1) => ({ name, type, size: mb * MB });
const opts = (max: number) => ({ max, maxSizeMb: 8, accept: IMAGE_ACCEPT });

describe("planPicks", () => {
  it("max=1 replaces the existing image instead of rejecting the new one", () => {
    const r = planPicks([f("new.jpg", "image/jpeg")], 1, opts(1));
    expect(r.replace).toBe(true);
    expect(r.accepted.map((x) => x.name)).toEqual(["new.jpg"]);
    expect(r.skipped).toEqual([]);
  });

  it("max=1 keeps the first valid file and says why the rest were skipped", () => {
    const r = planPicks([f("bad.txt", "text/plain"), f("a.png", "image/png"), f("b.png", "image/png")], 1, opts(1));
    expect(r.accepted.map((x) => x.name)).toEqual(["a.png"]);
    expect(r.skipped).toEqual([{ name: "bad.txt", reason: "notImage" }, { name: "b.png", reason: "count" }]);
  });

  it("max>1 fills only the remaining slots and appends", () => {
    const r = planPicks([f("a.webp", "image/webp"), f("b.avif", "image/avif"), f("c.jpg", "image/jpeg")], 3, opts(5));
    expect(r.replace).toBe(false);
    expect(r.accepted.map((x) => x.name)).toEqual(["a.webp", "b.avif"]);
    expect(r.skipped).toEqual([{ name: "c.jpg", reason: "count" }]);
  });

  it("gives a per-file reason: HEIC (with or without a MIME type), unsupported format, size", () => {
    const r = planPicks([f("IMG_1.HEIC", ""), f("x.heif", "image/heif"), f("y.gif", "image/gif"), f("big.png", "image/png", 9)], 0, opts(12));
    expect(r.accepted).toEqual([]);
    expect(r.skipped.map((s) => s.reason)).toEqual(["heic", "heic", "format", "size"]);
  });

  it("an empty pick changes nothing", () => {
    expect(planPicks([], 1, opts(1))).toEqual({ accepted: [], skipped: [], replace: false });
  });
});

describe("skippedMessage", () => {
  it("names each file and its reason", () => {
    const msg = skippedMessage([{ name: "a.heic", reason: "heic" }, { name: "b.png", reason: "size" }, { name: "c.jpg", reason: "count" }], opts(3));
    expect(msg).toBe("3 files skipped: a.heic (HEIC isn't supported, export it as JPEG or PNG), b.png (over 8 MB), c.jpg (only 3 allowed).");
    expect(skippedMessage([], opts(1))).toBeNull();
  });

  it("lists the accepted formats", () => {
    expect(formatList(IMAGE_ACCEPT)).toBe("JPEG, PNG, WebP or AVIF");
  });
});
