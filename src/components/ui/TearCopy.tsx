import { CX } from "./tearGeometry";

/** The poster's tagline + word, in viewBox units (draw inside an svg with `viewBox()`). Shared with the admin preview. */
export function TearCopy({ word, tagline }: { word: string; tagline?: string }) {
  return (
    <>
      {tagline && (
        <text x={CX} y={150} textAnchor="middle"
          style={{ fill: "var(--ink-soft)", fontFamily: "var(--font-ui)", fontSize: 30, fontWeight: 600, letterSpacing: "0.42em" }}>
          {tagline}
        </text>
      )}
      {/* stretched to a fixed width so any face fits (54 units clear of each frame edge); short words (404) are not ballooned */}
      <text x={CX} y={404} textAnchor="middle" textLength={Math.min(820, word.length * 150)} lengthAdjust="spacingAndGlyphs"
        style={{ fill: "var(--ink)", fontFamily: "var(--font-editorial)", fontSize: 250, fontWeight: 600, letterSpacing: 0 }}>
        {word}
      </text>
    </>
  );
}
