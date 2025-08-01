"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatWindowProps {
  messages: { role: string; content: string }[];
  hasActiveChat: boolean;
}

export default function ChatWindow({ messages, hasActiveChat }: ChatWindowProps) {
  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-background text-foreground relative">
      {hasActiveChat && hasMessages ? (
        messages.map((msg, idx) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={idx}
              className={`animate-fadeIn rounded-xl px-5 py-4 max-w-3xl text-sm shadow-sm break-words ${
                isUser
                  ? "bg-accent text-white self-end ml-auto"
                  : "bg-[#1d222b] text-[#e2e8f0] border border-[#3c4455] self-start mr-auto"
              }`}
            >
              <div
                className={`prose prose-invert prose-p:my-2 prose-h2:text-lg prose-h2:font-semibold prose-ul:pl-5 prose-li:my-1 ${
                  isUser ? "text-white" : "text-[#e2e8f0]"
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          );
        })
      ) : (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <h2 className="text-2xl font-semibold text-muted-strong">
            Welcome to Thrust
          </h2>
          <p className="text-muted mt-2">
            {hasActiveChat
              ? "Start typing or upload a document to begin."
              : "No briefs created. Click '+' to start a new one."}
          </p>
        </div>
      )}
    </div>
  );
}
