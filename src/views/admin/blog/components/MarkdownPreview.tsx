import { Fragment, type ReactNode } from "react";

/** Inline: **bold**, *italic*, [text](https://url). Built as elements (no raw HTML). */
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g).map((t, i) => {
    const link = /^\[([^\]]+)\]\((.+)\)$/.exec(t);
    if (link) return <a key={i} href={link[2]} className="underline" target="_blank" rel="noreferrer">{link[1]}</a>;
    if (t.startsWith("**") && t.endsWith("**") && t.length > 4) return <strong key={i}>{t.slice(2, -2)}</strong>;
    if (t.startsWith("*") && t.endsWith("*") && t.length > 2) return <em key={i}>{t.slice(1, -1)}</em>;
    return <Fragment key={i}>{t}</Fragment>;
  });
}

/** Small markdown subset for the editor preview: headings, quotes, bullet lists, paragraphs. */
export function MarkdownPreview({ text }: { text: string }) {
  if (!text.trim()) return <p className="t-meta">Nothing to preview yet.</p>;
  return (
    <div className="space-y-4 text-body text-ink-soft">
      {text.split(/\n{2,}/).map((block, i) => {
        const h = /^(#{1,3}) (.+)/.exec(block);
        if (h) return <h3 key={i} className={h[1].length === 1 ? "t-h2 text-ink" : "t-h3 text-ink"}>{inline(h[2])}</h3>;
        if (block.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-accent pl-4 font-serif text-h3 text-ink">{inline(block.slice(2))}</blockquote>;
        if (/^[-*] /.test(block)) return <ul key={i} className="list-disc pl-5">{block.split("\n").map((l, j) => <li key={j}>{inline(l.replace(/^[-*] /, ""))}</li>)}</ul>;
        return <p key={i}>{inline(block)}</p>;
      })}
    </div>
  );
}
