"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";

interface AIChatPanelProps {
  chatHistory: { role: string; content: string }[];
  onSendMessage: (msg: { role: string; content: string }) => void;
  summary?: string;
  onEditProposal?: (
    edit: { type: "executive" | "section" | "slide-bullets"; content: string }
  ) => void;
  summaryId?: string;
  pendingEdit?: { type: string; content: string } | null;
  onAcceptEdit?: () => void;
  onUndoEdit?: () => void;
  accepting?: boolean;
  tabType: "summary" | "bullets";
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const promptSuggestions = [
  "Make it punchier",
  "Extract key metrics",
  "Provide actionable recommendations",
  "Simplify language",
  "Explain ...",
];

// Updated parse to handle both summary and slide bullets edit proposals
function parseLLMResponse(
  raw: string,
  tabType: "summary" | "bullets"
): {
  type: "edit-executive" | "edit-summary" | "edit-slide-bullets" | "question" | "other";
  content: string;
} {
  if (tabType === "summary") {
    if (/^Edit, Executive Summary:\s*/i.test(raw)) {
      return {
        type: "edit-executive",
        content: raw.replace(/^Edit, Executive Summary:\s*/i, "").trim(),
      };
    }
    if (/^Edit, Overall Summary:\s*/i.test(raw)) {
      return {
        type: "edit-summary",
        content: raw.replace(/^Edit, Overall Summary:\s*/i, "").trim(),
      };
    }
  }
  if (tabType === "bullets") {
    // Heuristic: if response starts with ## it's probably a new bullets section in markdown
    if (/^##\s+/m.test(raw.trim())) {
      return { type: "edit-slide-bullets", content: raw.trim() };
    }
  }
  if (/^Question:\s*/i.test(raw)) {
    return {
      type: "question",
      content: raw.replace(/^Question:\s*/i, "").trim(),
    };
  }
  return { type: "other", content: raw };
}

export default function AIChatPanel({
  chatHistory,
  onSendMessage,
  summary,
  onEditProposal,
  summaryId,
  pendingEdit,
  onAcceptEdit,
  onUndoEdit,
  accepting = false,
  tabType,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    onSendMessage({ role: "user", content: input });

    try {
      let endpoint: string;
      let payload: Record<string, unknown>;
      if (tabType === "bullets") {
        endpoint = `${apiBase}/api/chat_on_slide_bullets/`;
        payload = {
          slide_bullets: summary,
          message: input,
          history: chatHistory,
        };
      } else {
        endpoint = `${apiBase}/api/chat/`;
        payload = {
          message: input,
          summary,
          history: chatHistory,
          summary_id: summaryId || null,
        };
      }

      const { data } = await axios.post(endpoint, payload);

      // Handle OpenAI backend differences: some return `message`, some `response`
      const rawResponse = data.response || data.message;
      const parsed = parseLLMResponse(rawResponse, tabType);

      if (parsed.type === "question" || parsed.type === "other") {
        onSendMessage({ role: "assistant", content: parsed.content });
      }
      if (onEditProposal) {
        if (parsed.type === "edit-executive") {
          onEditProposal({ type: "executive", content: parsed.content });
        } else if (parsed.type === "edit-summary") {
          onEditProposal({ type: "section", content: parsed.content });
        } else if (parsed.type === "edit-slide-bullets") {
          onEditProposal({ type: "slide-bullets", content: parsed.content });
        }
      }
    } catch {
      onSendMessage({
        role: "assistant",
        content: "Sorry, there was an error with the AI assistant.",
      });
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleSend();
    }
  };

  const handleClear = () => setInput("");
  const handlePromptChip = (prompt: string) => setInput(prompt);

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-[1.07rem] font-semibold mb-2 text-accent uppercase tracking-wide">
        AI Assistant
      </h3>

      {/* Prompt chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {promptSuggestions.map((prompt) => (
          <button
            key={prompt}
            className="bg-card text-foreground px-3 py-1 rounded-full border border-muted text-xs hover:bg-accent hover:text-background transition"
            onClick={() => handlePromptChip(prompt)}
            disabled={loading}
            tabIndex={0}
            aria-label={`Use suggestion: ${prompt}`}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1">
        {chatHistory.length === 0 && (
          <div className="text-muted-strong text-sm opacity-90 bg-background border border-muted rounded-lg px-4 py-4 mb-2">
            {tabType === "bullets"
              ? "Ask a question about these slide bullets, or request a rewrite/section edit.\nExample: 'Rewrite the Opportunities section to focus on US market.'"
              : "Ask a question about this summary, or request a rewrite/new bullet point.\nExample: 'Clarify the key drivers of revenue growth.'"}
          </div>
        )}
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`
              px-3 py-2 rounded-xl max-w-[88%] break-words text-[15px] shadow-sm
              ${msg.role === "user"
                ? "bg-accent text-background ml-auto"
                : "bg-card text-foreground"}
            `}
            style={{
              backgroundColor:
                msg.role === "user" ? "var(--accent)" : "var(--card)",
              color:
                msg.role === "user" ? "var(--background)" : "var(--foreground)",
              fontFamily: "inherit",
              whiteSpace: "pre-wrap",
              border: msg.role === "user" ? "1px solid var(--accent)" : "1px solid var(--card)",
            }}
          >
            {msg.content}
          </div>
        ))}
        {/* Typing/Loading spinner */}
        {loading && (
          <div className="flex items-center gap-2 text-muted text-xs pl-1 py-2 animate-pulse">
            <svg
              className="animate-spin h-4 w-4 text-accent"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            AI is typing…
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* AI Edit Proposal Message Card */}
      {pendingEdit && (
  <div className="border-2 border-accent bg-background rounded-2xl p-4 mb-4 shadow-md">
    <div className="font-semibold text-accent mb-2">
      Pending Edit
    </div>
    <div className="text-muted text-xs mb-3">
      Preview the proposed changes in the main display.
    </div>
    <div className="flex gap-3">
      <button
        className="px-4 py-1 rounded-lg bg-accent text-background font-semibold shadow"
        onClick={onAcceptEdit}
        disabled={accepting}
      >
        {accepting ? "Accepting…" : "Accept"}
      </button>
      <button
        className="px-4 py-1 rounded-lg bg-red-600 text-background font-semibold"
        onClick={onUndoEdit}
        disabled={accepting}
      >
        Undo
      </button>
    </div>
  </div>
)}



      {/* Input & Send controls */}
      <div className="flex gap-2 mt-auto pt-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          className="flex-1 px-3 py-2 rounded-lg border border-muted bg-background text-foreground"
          placeholder={
            tabType === "bullets"
              ? "Ask about these bullets, or request an edit…"
              : "Ask about this summary, or request an edit…"
          }
          style={{
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
            borderColor: "var(--muted)",
            fontFamily: "inherit",
          }}
          disabled={loading}
          aria-label="AI chat input"
        />
        {input && !loading && (
          <button
            onClick={handleClear}
            className="bg-card text-foreground px-2 rounded-lg border border-muted text-xs"
            tabIndex={0}
            aria-label="Clear input"
          >
            Clear
          </button>
        )}
        <button
          onClick={handleSend}
          className="bg-accent text-background px-4 py-2 rounded-lg font-semibold"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--background)",
            fontFamily: "inherit",
          }}
          disabled={loading}
          aria-label="Send"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
