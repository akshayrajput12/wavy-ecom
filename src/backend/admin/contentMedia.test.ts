import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./_shared", () => ({ db: vi.fn() }));
const { droppedPaths, mediaPaths } = await import("./contentMedia");

const B = "https://x.supabase.co/storage/v1/object/public/content-media/";

describe("content-media paths", () => {
  it("finds images nested anywhere in a config", () => {
    const cfg = { slides: [{ image: `${B}home/a.webp?v=1` }, { image: "/images/hero/placeholder.png" }], promo: { image: `${B}home/b%20c.webp` } };
    expect([...mediaPaths(cfg, new Set(), B)]).toEqual(["home/a.webp", "home/b c.webp"]);
  });

  it("only drops images the edit removed or replaced, never external or kept ones", () => {
    const before = { slides: [{ image: `${B}old.webp` }, { image: `${B}kept.webp` }, { image: "https://cdn.example.com/x.webp" }] };
    const after = { slides: [{ image: `${B}new.webp` }, { image: `${B}kept.webp` }] };
    expect(droppedPaths(before, after, B)).toEqual(["old.webp"]);
  });
});
