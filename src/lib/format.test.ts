import { describe, expect, it } from "vitest";
import { accentWords, plainText } from "./format";

const plain = (text: string) => ({ text, accent: false });
const accent = (text: string) => ({ text, accent: true });

describe("accentWords", () => {
  it("flags *marked* words, keeps punctuation glued and stray asterisks literal", () => {
    expect(accentWords("Wear your *new heritage*, now")).toEqual([
      [plain("Wear")], [plain("your")], [accent("new")], [accent("heritage"), plain(",")], [plain("now")],
    ]);
    expect(accentWords("  5* hotel ")).toEqual([[plain("5*")], [plain("hotel")]]);
    expect(plainText("Wear *your* heritage")).toBe("Wear your heritage");
  });
});
