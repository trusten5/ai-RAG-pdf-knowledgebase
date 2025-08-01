"use client";

import { motion } from "framer-motion";
import { TrashIcon, BoltIcon } from "@heroicons/react/24/outline";

interface Chat {
  id: string;
  title?: string;
  messages?: { role: string; content: string }[];
}

interface SidebarProps {
  chats: Chat[];
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  activeId: string;
  onAskThrust: () => void;
  askThrustActive: boolean;
}

function generateTitle(chat: Chat): string {
  if (chat.title && chat.title.trim().length > 0) return chat.title;
  const firstMsg = chat.messages?.find((m) => m.role === "user")?.content;
  if (!firstMsg) return "Untitled Brief";
  const cleaned = firstMsg.replace(/[\n\r]/g, " ").slice(0, 40).trim();
  return cleaned.length > 0 ? cleaned + "..." : "Untitled Brief";
}

export default function Sidebar({
  chats,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  activeId,
  onAskThrust,
  askThrustActive,
}: SidebarProps) {
  return (
    <motion.aside
      className="hidden md:block w-72 bg-[#14181f] border-r border-muted px-6 py-6 overflow-y-auto"
      initial={{ x: -40 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col gap-4 mb-6">
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium tracking-wide uppercase transition ${
            askThrustActive
              ? "bg-accent text-background shadow"
              : "text-accent hover:bg-accent/10"
          }`}
          onClick={onAskThrust}
          aria-label="Ask Thrust (project-wide AI chat)"
        >
          <BoltIcon className="w-5 h-5" />
          Ask Thrust
        </button>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-wide text-white uppercase opacity-80">
            Your Briefs
          </h2>
          <button
            onClick={onNewChat}
            className="rounded-full w-8 h-8 flex items-center justify-center border border-accent text-accent hover:bg-accent/10"
            title="New Brief"
            aria-label="Create New Brief"
          >
            +
          </button>
        </div>
      </div>

      {chats.length === 0 ? (
        <p className="text-muted text-xs italic mt-8">
          No briefs created. Click + to begin.
        </p>
      ) : (
        <ul className="space-y-1 text-sm">
          {chats.map((chat) => (
            <li key={chat.id} className="flex items-center justify-between">
              <button
                onClick={() => onSelectChat(chat.id)}
                className={`flex-1 text-left px-3 py-2 rounded-lg truncate transition-all ${
                  chat.id === activeId
                    ? "bg-accent/30 text-white font-medium"
                    : "text-muted hover:bg-muted/10 hover:text-white"
                }`}
              >
                {generateTitle(chat)}
              </button>
              <button
                onClick={() => onDeleteChat(chat.id)}
                className="ml-2 text-muted hover:text-red-400"
                title="Delete"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.aside>
  );
}
