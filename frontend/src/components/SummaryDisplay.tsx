"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  summary: string;
  executiveSummary: string;
  onCopy: () => void;
  onExport: () => void;
  onGenerateBullets: () => void;
  copied?: boolean;
  exporting?: boolean;
  generatingBullets?: boolean;
}

export default function SummaryDisplay({
  summary,
  executiveSummary,
  onCopy,
  onExport,
  onGenerateBullets,
  copied = false,
  exporting = false,
  generatingBullets = false,
}: Props) {
  const fullContent = `# Executive Summary

${executiveSummary}

---

${summary}`;

  return (
    <div className="flex flex-col h-full min-h-0 animate-fadeIn">
      {/* Scrollable summary */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl border border-muted bg-background text-foreground
        p-7 prose prose-invert max-w-none shadow-lg"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
          minHeight: 0,
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => (
              <h1
                style={{
                  color: "var(--accent)",
                  fontSize: "1.6rem",
                  marginTop: "0.7em",
                  marginBottom: "0.3em",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                style={{
                  color: "var(--accent)",
                  fontSize: "1.08rem",
                  marginTop: "0.7em",
                  marginBottom: "0.3em",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
                {...props}
              />
            ),
            li: ({ node, ...props }) => (
              <li style={{ color: "var(--muted)", fontSize: "1rem", marginBottom: "0.35em" }} {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong style={{ color: "var(--foreground)" }} {...props} />
            ),
            p: ({ node, ...props }) => (
              <p style={{ color: "var(--foreground)", fontSize: "1rem", marginBottom: "0.35em" }} {...props} />
            ),
          }}
        >
          {fullContent}
        </ReactMarkdown>
      </div>
      {/* Button bar always visible below summary */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onCopy}
          className="bg-accent text-background px-5 py-2 rounded-xl font-semibold transition"
          disabled={copied}
        >
          {copied ? "Copied!" : "Copy Summary"}
        </button>
        <button
          onClick={onExport}
          className="bg-card text-foreground px-5 py-2 rounded-xl border border-muted font-semibold transition"
          disabled={exporting}
        >
          {exporting ? "Exporting…" : "Export as PDF"}
        </button>
        <button
          onClick={onGenerateBullets}
          className="bg-blue-700 text-background px-5 py-2 rounded-xl font-semibold transition hover:bg-blue-800 disabled:bg-blue-900"
          disabled={generatingBullets}
        >
          {generatingBullets ? (
            <span className="inline-block w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin align-middle mr-2" />
          ) : null}
          {generatingBullets ? "Generating..." : "Generate Slide Bullets"}
        </button>
      </div>
    </div>
  );
}
