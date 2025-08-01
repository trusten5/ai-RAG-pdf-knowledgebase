"use client";

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { supabase } from "@/lib/supabase";

type AskThrustPanelMode = "project" | "global";

interface AskThrustPanelProps {
  projectId?: string;
  userId?: string;
  mode?: AskThrustPanelMode;
}

interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface ChatSession {
  chat_id: string;
  title: string;
  created_at: string;
}

export type AskThrustPanelHandle = {
  refresh: () => void;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper: get first user message as title
async function getFirstUserMsg(chat_id: string, mode: AskThrustPanelMode, userId: string, projectId?: string) {
  const tableName = mode === "global" ? "thrust_chats_global" : "thrust_chats";
  let query = supabase
    .from(tableName)
    .select("content")
    .eq("chat_id", chat_id)
    .eq("role", "user")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);
  if (mode === "project" && projectId) {
    query = query.eq("project_id", projectId);
  }
  const { data } = await query;
  return data && data[0] ? data[0].content.slice(0, 30) + (data[0].content.length > 30 ? "..." : "") : "New Chat";
}

const AskThrustPanel = forwardRef<AskThrustPanelHandle, AskThrustPanelProps>(
  function AskThrustPanel({ projectId, userId, mode = "project" }, ref) {
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [chatTitles, setChatTitles] = useState<{ [chat_id: string]: string }>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [insertError, setInsertError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    // Get logged in user
    useEffect(() => {
      (async () => {
        if (userId) {
          setActiveUserId(userId);
        } else {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) setActiveUserId(null);
          else setActiveUserId(user.id);
        }
      })();
    }, [userId]);

    // Load all chat sessions and preview titles
    const loadChats = async (selected?: string) => {
      if (!activeUserId) return;
      const tableName = mode === "global" ? "thrust_chats_global" : "thrust_chats";
      let query = supabase
        .from(tableName)
        .select("chat_id,created_at")
        .eq("user_id", activeUserId)
        .order("created_at", { ascending: true });
      if (mode === "project" && projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query;
      if (!data || error) {
        setChats([]);
        setChatTitles({});
        setActiveChatId(null);
        return;
      }
      // Group by chat_id and get earliest created_at for each chat
      const chatMap: Record<string, ChatSession> = {};
      for (const row of data) {
        if (!chatMap[row.chat_id] || row.created_at < chatMap[row.chat_id].created_at) {
          chatMap[row.chat_id] = {
            chat_id: row.chat_id,
            title: "Loading...",
            created_at: row.created_at,
          };
        }
      }
      const chatList = Object.values(chatMap);
      setChats(chatList);

      // Set preview titles (async)
      chatList.forEach(c => {
        getFirstUserMsg(c.chat_id, mode, activeUserId, projectId).then(title => {
          setChatTitles(prev => ({ ...prev, [c.chat_id]: title }));
        });
      });

      // Pick active chat
      if (selected && chatList.find(c => c.chat_id === selected)) {
        setActiveChatId(selected);
      } else if (chatList.length) {
        setActiveChatId(chatList[chatList.length - 1].chat_id);
      } else {
        setActiveChatId(null);
      }
    };

    useEffect(() => {
      loadChats();
      // eslint-disable-next-line
    }, [activeUserId, projectId, mode]);

    // Load all messages for the selected chat_id
    useEffect(() => {
      if (!activeUserId || !activeChatId) {
        setChatHistory([]);
        return;
      }
      const tableName = mode === "global" ? "thrust_chats_global" : "thrust_chats";
      let query = supabase
        .from(tableName)
        .select("id,chat_id,role,content,created_at")
        .eq("chat_id", activeChatId)
        .eq("user_id", activeUserId)
        .order("created_at", { ascending: true });
      if (mode === "project" && projectId) {
        query = query.eq("project_id", projectId);
      }
      query.then(({ data, error }) => {
        if (!data || error) setChatHistory([]);
        else setChatHistory(data);
      });
    }, [activeUserId, activeChatId, mode, projectId]);

    // Always scroll to bottom
    useEffect(() => {
      if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, loading]);

    // Handlers
    const refresh = () => {
      setInput("");
      setChatHistory([]);
      setInsertError(null);
      loadChats(activeChatId ?? undefined);
    };
    useImperativeHandle(ref, () => ({ refresh }));

    const handleNewChat = () => {
      const newId = uuidv4();
      setActiveChatId(newId);
      setChatHistory([]);
      setChatTitles((prev) => ({ ...prev, [newId]: "New Chat" }));
      setChats(prev =>
        [...prev, { chat_id: newId, title: "New Chat", created_at: new Date().toISOString() }]
      );
    };

    const storeMessage = async (role: "user" | "assistant", content: string) => {
      if (!activeUserId || !activeChatId) {
        setInsertError("User ID or Chat ID missing");
        return;
      }
      const tableName = mode === "global" ? "thrust_chats_global" : "thrust_chats";
      let row: any = {
        id: uuidv4(),
        user_id: activeUserId,
        chat_id: activeChatId,
        role,
        content,
        created_at: new Date().toISOString(),
      };
      if (mode === "project") row.project_id = projectId;
      const { error } = await supabase.from(tableName).insert([row]);
      if (error) setInsertError("Insert error: " + error.message);
      else setInsertError(null);
    };

    const handleSend = async () => {
      if (!input.trim() || loading || !activeChatId) return;
      setLoading(true);
      setInsertError(null);
      const userMsg: Message = {
        id: uuidv4(),
        chat_id: activeChatId,
        role: "user",
        content: input,
      };
      setChatHistory((prev) => [...prev, userMsg]);
      await storeMessage("user", input);

      // If this is the first message, update the chat title preview
      if (!(activeChatId in chatTitles) || chatTitles[activeChatId] === "New Chat") {
        setChatTitles(prev => ({
          ...prev,
          [activeChatId]: input.slice(0, 30) + (input.length > 30 ? "..." : ""),
        }));
      }

      try {
        let apiRoute = mode === "global" ? "/api/ask_thrust_global/" : "/api/ask_thrust/";
        let body: any = { message: input, history: [...chatHistory, userMsg] };
        if (mode === "project") body.project_id = projectId;
        else body.user_id = activeUserId;

        const { data } = await axios.post(`${apiBase}${apiRoute}`, body);
        const assistantMsg: Message = {
          id: uuidv4(),
          chat_id: activeChatId,
          role: "assistant",
          content: data.response,
        };
        setChatHistory((prev) => [...prev, assistantMsg]);
        await storeMessage("assistant", data.response);
      } catch (err: any) {
        const errorMsg = {
          id: uuidv4(),
          chat_id: activeChatId,
          role: "assistant" as const,
          content: "Sorry, there was an error processing your request.",
        };
        setChatHistory((prev) => [...prev, errorMsg]);
        await storeMessage("assistant", errorMsg.content);

        setInsertError("LLM/Backend error: " + (err?.message || "Unknown error"));
      } finally {
        setInput("");
        setLoading(false);
      }
    };

    const handleDeleteChat = async (chat_id: string) => {
      const tableName = mode === "global" ? "thrust_chats_global" : "thrust_chats";
      let query = supabase.from(tableName).delete().eq("chat_id", chat_id).eq("user_id", activeUserId);
      if (mode === "project" && projectId) query = query.eq("project_id", projectId);
      await query;
      const idx = chats.findIndex(c => c.chat_id === chat_id);
      let newActive: string | null = null;
      if (activeChatId === chat_id) {
        if (chats.length > 1) {
          if (idx === 0) newActive = chats[1].chat_id;
          else newActive = chats[idx - 1].chat_id;
        }
      } else {
        newActive = activeChatId;
      }
      loadChats(newActive ?? undefined);
      setChatHistory([]);
    };

    const renderTabTitle = (chat_id: string) =>
      chatTitles[chat_id] || "Loading...";

    // Main UI
    return (
      <div className="flex h-[480px] bg-[#1B2231] rounded-2xl shadow-2xl border border-muted overflow-hidden">
        {/* Tabs */}
        <div className="w-[180px] border-r border-muted flex flex-col items-stretch pt-4 px-2 bg-[#161a23] rounded-l-2xl">
          <button
            className="mb-3 px-2 py-1 rounded-lg border border-accent bg-accent/20 text-accent font-semibold focus:outline-none focus:ring-2 focus:ring-accent transition"
            onClick={handleNewChat}
            type="button"
          >
            + New Chat
          </button>
          <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
            {chats.map(chat => (
              <div key={chat.chat_id} className="flex items-center group">
                <button
                  className={
                    "flex-1 text-left text-xs px-2 py-2 rounded font-semibold transition " +
                    (chat.chat_id === activeChatId
                      ? "bg-accent text-background shadow"
                      : "bg-[#181e2c] text-accent hover:bg-accent/10")
                  }
                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  onClick={() => setActiveChatId(chat.chat_id)}
                  type="button"
                >
                  {renderTabTitle(chat.chat_id)}
                </button>
                <button
                  className="ml-1 p-1 rounded text-muted hover:bg-red-600/20 hover:text-red-600 transition text-base"
                  title="Delete Chat"
                  onClick={() => handleDeleteChat(chat.chat_id)}
                  type="button"
                  tabIndex={0}
                  aria-label="Delete chat"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M6 8V15M10 8V15M14 8V15M4 5V17C4 18.1046 4.89543 19 6 19H14C15.1046 19 16 18.1046 16 17V5M1 5H19M8 2H12C12.5523 2 13 2.44772 13 3V5H7V3C7 2.44772 7.44772 2 8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat window */}
        <div className="flex-1 flex flex-col h-full bg-[#22293b]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-muted pb-3 px-5 pt-5">
            <h3 className="text-lg font-bold text-accent tracking-wide uppercase">
              {mode === "global" ? "Ask Thrust (All Projects)" : "Ask Thrust"}
            </h3>
            <button
              onClick={refresh}
              className="text-xs text-muted-foreground font-medium hover:underline focus:outline-none"
              title="Refresh Knowledgebase"
              tabIndex={0}
              type="button"
            >
              Refresh
            </button>
          </div>

          {/* Error bar */}
          {insertError && (
            <div className="bg-red-700 text-white text-xs font-mono p-2 rounded mb-2 mx-4">
              {insertError}
            </div>
          )}

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ minHeight: 0, maxHeight: 360 }}>
            {chatHistory.length === 0 && (
              <div className="text-muted-strong text-sm opacity-90 bg-background border border-muted rounded-lg px-4 py-6 mb-2">
                {mode === "global"
                  ? <>
                      Ask questions about any brief, summary, slide, or insight across <b>all your projects</b>.<br />
                      Example: <span className="text-accent">"Which projects mention cybersecurity?"</span>
                    </>
                  : <>
                      Ask questions about any brief, executive summary, slide bullet, or insight in this project.<br />
                      Example: <span className="text-accent">"What are the main cost drivers in this project?"</span>
                    </>
                }
              </div>
            )}
            {chatHistory.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    px-4 py-3 rounded-2xl max-w-[75%] whitespace-pre-wrap shadow
                    ${msg.role === "user"
                      ? "bg-accent text-background font-semibold rounded-br-md"
                      : "bg-card text-foreground rounded-bl-md border border-accent/20"}
                    text-[15px]
                  `}
                  style={{
                    fontFamily: "inherit",
                    border: msg.role === "assistant" ? "1.5px solid var(--accent)" : undefined,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted text-xs pl-1 py-2 animate-pulse">
                <svg className="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Thrust is thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-muted bg-[#22293b] px-5 py-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && handleSend()}
              className="flex-1 px-3 py-2 rounded-lg border border-muted bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
              placeholder={mode === "global"
                ? "Ask about anything across all your projects…"
                : "Ask about any brief, section, or trend…"}
              style={{
                backgroundColor: "var(--background)",
                color: "var(--foreground)",
                borderColor: "var(--muted)",
                fontFamily: "inherit",
                fontSize: 16,
              }}
              disabled={loading}
              aria-label="Ask Thrust input"
            />
            <button
              onClick={handleSend}
              className="bg-accent text-background px-5 py-2 rounded-lg font-semibold shadow focus:outline-none focus:ring-2 focus:ring-accent"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                fontFamily: "inherit",
                fontSize: 16,
              }}
              disabled={loading || input.length === 0}
              aria-label="Send"
              type="button"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default AskThrustPanel;
