"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LoadingSpinner from "./LoadingSpinner";

interface SlideBulletsTabProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  onSubmitPrompt: () => void;
  loading: boolean;
  bullets?: string;
  copied: boolean;
  exporting: boolean;
  onCopy: () => void;
  onExport: () => void;
}

export default function SlideBulletsTab({
  prompt,
  onPromptChange,
  onSubmitPrompt,
  loading,
  bullets,
  copied,
  exporting,
  onCopy,
  onExport,
}: SlideBulletsTabProps) {
  return (
    <div className="flex flex-col h-full min-h-0 animate-fadeIn">
      {!bullets && (
        <div className="mb-5">
          <div className="mb-2 text-sm font-semibold">
            What should the slides focus on?
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-muted bg-background text-foreground"
            placeholder="e.g. 'Key risks and recommendations', or leave blank for default"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) onSubmitPrompt();
            }}
          />
          <button
            onClick={onSubmitPrompt}
            disabled={loading}
            className="mt-2 bg-blue-700 text-background px-5 py-2 rounded-xl font-semibold"
          >
            {loading ? "Generating..." : "Generate Bullets"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner text="Generating slide bullets..." />
        </div>
      ) : bullets ? (
        <>
          <div className="flex-1 overflow-y-auto rounded-2xl border border-muted bg-background text-foreground p-7 prose prose-invert max-w-none shadow-lg">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
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
                  <li
                    style={{
                      color: "var(--muted)",
                      fontSize: "1rem",
                      marginBottom: "0.35em",
                    }}
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong style={{ color: "var(--foreground)" }} {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p
                    style={{
                      color: "var(--foreground)",
                      fontSize: "1rem",
                      marginBottom: "0.35em",
                    }}
                    {...props}
                  />
                ),
              }}
            >
              {bullets}
            </ReactMarkdown>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onCopy}
              className="bg-accent text-background px-5 py-2 rounded-xl font-semibold transition"
              disabled={copied}
            >
              {copied ? "Copied!" : "Copy Bullets"}
            </button>
            <button
              onClick={onExport}
              className="bg-card text-foreground px-5 py-2 rounded-xl border border-muted font-semibold transition"
              disabled={exporting}
            >
              {exporting ? "Exporting…" : "Export as PDF"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
