import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTypeahead, normaliseQuery, type TypeaheadState } from "./typeahead";

type Call = { query: string; signal: AbortSignal; resolve: (v: string) => void; reject: (e: unknown) => void };

function setup() {
  const calls: Call[] = [];
  const states: TypeaheadState<string>[] = [];
  const fetcher = (query: string, signal: AbortSignal) =>
    new Promise<string>((resolve, reject) => { calls.push({ query, signal, resolve, reject }); });
  const ta = createTypeahead({ fetcher, onChange: (s) => states.push(s), debounceMs: 200, loadingDelayMs: 150 });
  return { ta, calls, states, last: () => states.at(-1) };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("normaliseQuery", () => {
  it("trims, collapses whitespace, lowercases and caps", () => {
    expect(normaliseQuery("  Black \n  TEE ")).toBe("black tee");
    expect(normaliseQuery("x".repeat(100))).toHaveLength(60);
  });
});

describe("createTypeahead", () => {
  it("debounces keystrokes into one request for the final query", async () => {
    const { ta, calls } = setup();
    ta.set("sh"); ta.set("shi"); ta.set("shirt");
    await vi.advanceTimersByTimeAsync(199);
    expect(calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls.map((c) => c.query)).toEqual(["shirt"]);
  });

  it("stays idle under the minimum length and never fetches", async () => {
    const { ta, calls, last } = setup();
    ta.set(" a ");
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toHaveLength(0);
    expect(last()?.status).toBe("idle");
  });

  it("aborts the in-flight request and ignores its late answer", async () => {
    const { ta, calls, last } = setup();
    ta.set("tee");
    await vi.advanceTimersByTimeAsync(200);
    ta.set("teal");
    expect(calls[0].signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(200);
    calls[1].resolve("teal-results");
    calls[0].resolve("tee-results"); // stale, arrives last
    await vi.runAllTimersAsync();
    expect(last()).toEqual({ status: "ready", query: "teal", data: "teal-results" });
  });

  it("shows loading only after the delay, keeping the previous answer", async () => {
    const { ta, calls, states } = setup();
    ta.set("tee");
    await vi.advanceTimersByTimeAsync(200);
    calls[0].resolve("A");
    await vi.advanceTimersByTimeAsync(0);
    ta.set("teal");
    await vi.advanceTimersByTimeAsync(200 + 149);
    expect(states.at(-1)?.status).toBe("ready");
    await vi.advanceTimersByTimeAsync(1);
    expect(states.at(-1)).toEqual({ status: "loading", query: "teal", data: "A" });
  });

  it("never flashes loading on a fast answer", async () => {
    const { ta, calls, states } = setup();
    ta.set("tee");
    await vi.advanceTimersByTimeAsync(200);
    calls[0].resolve("A");
    await vi.runAllTimersAsync();
    expect(states.map((s) => s.status)).toEqual(["ready"]);
  });

  it("serves a repeated query from the cache instantly", async () => {
    const { ta, calls, last } = setup();
    ta.set("tee");
    await vi.advanceTimersByTimeAsync(200);
    calls[0].resolve("A");
    await vi.advanceTimersByTimeAsync(0);
    ta.set("teal");
    ta.set("  TEE ");
    expect(last()).toEqual({ status: "ready", query: "tee", data: "A" });
    await vi.runAllTimersAsync();
    expect(calls).toHaveLength(1);
  });

  it("reports errors for the current query and can retry", async () => {
    const { ta, calls, last } = setup();
    ta.set("tee");
    await vi.advanceTimersByTimeAsync(200);
    calls[0].reject(new Error("500"));
    await vi.advanceTimersByTimeAsync(0);
    expect(last()?.status).toBe("error");
    ta.retry();
    calls[1].resolve("B");
    await vi.advanceTimersByTimeAsync(0);
    expect(last()).toEqual({ status: "ready", query: "tee", data: "B" });
  });
});
