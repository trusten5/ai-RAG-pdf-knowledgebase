"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import PromptBar from "@/components/PromptBar";
import EmptyState from "@/components/EmptyState";
import AIChatPanel from "@/components/AIChatPanel";
import LoadingSpinner from "@/components/LoadingSpinner";
import Tabs from "@/components/Tabs";
import SummaryTab from "@/components/SummaryTab";
import SlideBulletsTab from "@/components/SlideBulletsTab";
import AskThrustPanel, { AskThrustPanelHandle } from "@/components/AskThrustPanel";

import {
  replaceSection,
  replaceBulletsSection,
} from "@/utils/textHelpers";
import {
  exportSummaryPDF,
  exportBulletsPDF,
} from "@/utils/pdfExport";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Brief {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  summary: string;
  executive_summary: string;
  created_at: string;
  summaryChat?: { role: string; content: string }[];
  slideBullets?: string;
  slideBulletsChat?: { role: string; content: string }[];
  pendingEdit?: PendingEdit;
  previewSummary?: string;
  previewExecutiveSummary?: string;
  previewSlideBullets?: string;
}

type PendingEdit =
  | { type: "section"; content: string }
  | { type: "executive"; content: string }
  | { type: "slide-bullets"; content: string }
  | null;

export default function ProjectDashboard() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const [user, setUser] = useState<User | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [activeBriefId, setActiveBriefId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [accepting, setAccepting] = useState(false);


  const [activeTab, setActiveTab] = useState<"summary" | "bullets">("summary");
  const [bulletsPrompt, setBulletsPrompt] = useState("");
  const [bulletsLoading, setBulletsLoading] = useState(false);
  const [bulletsCopied, setBulletsCopied] = useState(false);
  const [bulletsExporting, setBulletsExporting] = useState(false);

  // Ask Thrust project-wide chat state
  const [askThrustActive, setAskThrustActive] = useState(false);
  // AskThrustPanel refresh ref
  const askThrustPanelRef = useRef<AskThrustPanelHandle>(null);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        window.location.href = "/login";
      } else {
        setUser(user);
        await fetchBriefs(user.id, projectId);
        setIsLoading(false);
      }
    });
  }, [projectId]);

  async function fetchBriefs(userId: string, projectId: string) {
    const { data, error } = await supabase
      .from("briefs")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Dashboard] Error fetching briefs:", error);
    }
    setBriefs(
      (data || []).map((b) => ({
        ...b,
        slideBullets: b.slide_bullets,
        summaryChat: [],
        slideBulletsChat: [],
        pendingEdit: null,
        previewSummary: undefined,
        previewExecutiveSummary: undefined,
        previewSlideBullets: undefined,
      }))
    );
    setActiveBriefId((data && data[0]?.id) || "");
  }

  // Refresh Ask Thrust if active
  const refreshAskThrustIfActive = () => {
    if (askThrustActive) askThrustPanelRef.current?.refresh();
  };

  const createNewBrief = async () => {
    if (!projectId || !user) return;

    const { data, error } = await supabase
      .from("briefs")
      .insert([
        {
          id: uuidv4(),
          project_id: projectId,
          user_id: user.id,
          title: "New Brief",
          summary: "",
          executive_summary: "",
        },
      ])
      .select()
      .single();

    if (error) {
      alert("Error creating brief: " + error.message);
    }
    if (data) {
      setBriefs((prev) => [
        {
          ...data,
          summaryChat: [],
          pendingEdit: null,
          slideBullets: undefined,
          slideBulletsChat: [],
        },
        ...prev,
      ]);
      setActiveBriefId(data.id);
      setActiveTab("summary");
      refreshAskThrustIfActive();
    }
  };

  const deleteBrief = async (id: string) => {
    await supabase.from("briefs").delete().eq("id", id);
    setBriefs((prev) => prev.filter((b) => b.id !== id));
    if (id === activeBriefId) setActiveBriefId(briefs[0]?.id || "");
    setActiveTab("summary");
    refreshAskThrustIfActive();
  };

  const updateBrief = async (id: string, patch: Partial<Brief>) => {
    const { data, error } = await supabase
      .from("briefs")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error && Object.keys(error).length > 0) {
      console.error("[Dashboard] Supabase error updating brief:", error);
    }
    if (data) {
      setBriefs((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
      );
      refreshAskThrustIfActive();
    }
  };

  const isDashboardEmpty = briefs.length === 0;
  const activeBrief = briefs.find((b) => b.id === activeBriefId);

  // UX: Preview edits immediately
  const handleEditProposal = (edit: PendingEdit) => {
    setBriefs((prev) =>
      prev.map((b) => {
        if (b.id !== activeBriefId) return b;
        if (!edit) {
          return {
            ...b,
            pendingEdit: null,
            previewSummary: undefined,
            previewExecutiveSummary: undefined,
            previewSlideBullets: undefined,
          };
        }
        if (edit.type === "executive") {
          return {
            ...b,
            pendingEdit: edit,
            previewExecutiveSummary: edit.content,
          };
        }
        if (edit.type === "section") {
          return {
            ...b,
            pendingEdit: edit,
            previewSummary: replaceSection(b.summary || "", edit.content),
          };
        }
        if (edit.type === "slide-bullets") {
          return {
            ...b,
            pendingEdit: edit,
            previewSlideBullets: replaceBulletsSection(
              b.slideBullets || "",
              edit.content
            ),
          };
        }
        return b;
      })
    );
  };

  const handleAcceptEdit = async () => {
    if (!activeBrief || !activeBrief.pendingEdit) return;
    setAccepting(true);

    const updatedBrief: Brief = { ...activeBrief, pendingEdit: null };

    if (activeBrief.pendingEdit.type === "executive") {
      updatedBrief.executive_summary = activeBrief.previewExecutiveSummary || activeBrief.executive_summary;
      await updateBrief(activeBrief.id, { executive_summary: updatedBrief.executive_summary });
      updatedBrief.previewExecutiveSummary = undefined;
    } else if (activeBrief.pendingEdit.type === "section") {
      updatedBrief.summary = activeBrief.previewSummary || activeBrief.summary;
      await updateBrief(activeBrief.id, { summary: updatedBrief.summary });
      updatedBrief.previewSummary = undefined;
    } else if (activeBrief.pendingEdit.type === "slide-bullets") {
      updatedBrief.slideBullets = activeBrief.previewSlideBullets || activeBrief.slideBullets;
      await updateBrief(
        activeBrief.id,
        { slideBullets: updatedBrief.previewSlideBullets || activeBrief.slideBullets }
      );
      updatedBrief.previewSlideBullets = undefined;
    }

    setBriefs((prev) =>
      prev.map((b) => (b.id === activeBrief.id ? updatedBrief : b))
    );
    setAccepting(false);
    refreshAskThrustIfActive();
  };

  const handleUndoEdit = () => {
    setBriefs((prev) =>
      prev.map((b) =>
        b.id === activeBriefId
          ? {
              ...b,
              pendingEdit: null,
              previewSummary: undefined,
              previewExecutiveSummary: undefined,
              previewSlideBullets: undefined,
            }
          : b
      )
    );
  };

  const handleSummaryStart = () => {
    setIsLoading(true);
    setBriefs((prev) =>
      prev.map((b) =>
        b.id === activeBriefId
          ? {
              ...b,
              summary: "",
              executive_summary: "",
              summaryChat: [],
              pendingEdit: null,
              slideBullets: undefined,
              slideBulletsChat: [],
              previewSummary: undefined,
              previewExecutiveSummary: undefined,
              previewSlideBullets: undefined,
            }
          : b
      )
    );
    setActiveTab("summary");
  };

  const handleSummaryResult = (
    summaryVal: string,
    execSummaryVal: string
  ) => {
    setBriefs((prev) =>
      prev.map((b) =>
        b.id === activeBriefId
          ? {
              ...b,
              summary: summaryVal,
              executive_summary: execSummaryVal,
              summaryChat: [],
              pendingEdit: null,
              previewSummary: undefined,
              previewExecutiveSummary: undefined,
            }
          : b
      )
    );
    if (activeBriefId) {
      updateBrief(activeBriefId, {
        summary: summaryVal,
        executive_summary: execSummaryVal,
      });
    }
    setIsLoading(false);
    refreshAskThrustIfActive();
  };

  const handleGenerateBullets = () => {
    setActiveTab("bullets");
    setBulletsPrompt("");
    setBulletsCopied(false);
    setBulletsExporting(false);
  };

  const submitBulletsPrompt = async () => {
    if (!activeBrief || !bulletsPrompt.trim()) return;
    setBulletsLoading(true);
    setBulletsCopied(false);
    setBulletsExporting(false);
    try {
      const { data } = await axios.post(`${apiBase}/api/generate_slide_bullets/`, {
        brief_id: activeBrief.id,
        summary: activeBrief.summary,
        prompt: bulletsPrompt,
      });
      setBriefs((prev) =>
        prev.map((b) =>
          b.id === activeBriefId ? { ...b, slideBullets: data.bullets_markdown } : b
        )
      );
      await updateBrief(activeBrief.id, { slideBullets: data.bullets_markdown });
    } catch {
      setBriefs((prev) =>
        prev.map((b) =>
          b.id === activeBriefId
            ? { ...b, slideBullets: "## Issue with LLM output, try again later" }
            : b
        )
      );
    } finally {
      setBulletsLoading(false);
      refreshAskThrustIfActive();
    }
  };

  const handleSummaryChat = (msg: { role: string; content: string }) => {
    if (!activeBrief) return;
    const field = activeTab === "bullets" ? "slideBulletsChat" : "summaryChat";
    setBriefs((prev) =>
      prev.map((b) =>
        b.id === activeBriefId
          ? { ...b, [field]: [...(b[field] || []), msg] }
          : b
      )
    );
  };

  const handleCopySummary = () => {
    if (!activeBrief) return;
    const lines: string[] = [];

    if (activeBrief.executive_summary) {
      lines.push("Executive Summary");
      lines.push("");
      lines.push(activeBrief.executive_summary.trim());
      lines.push("");
    }

    if (activeBrief.summary) {
      const summaryLines = activeBrief.summary
        .split("\n")
        .map((line) => {
          if (line.startsWith("##")) {
            return `\n${line.replace(/^##+/, "").trim()}\n`;
          } else if (line.startsWith("-") || line.startsWith("*")) {
            return `• ${line.replace(/^[-*]\s*/, "")}`;
          }
          return line;
        });

      lines.push("Summary");
      lines.push("");
      lines.push(...summaryLines);
    }

    navigator.clipboard.writeText(lines.join("\n").trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  const handleCopyBullets = () => {
    if (!activeBrief?.slideBullets) return;

    const lines: string[] = [];
    lines.push("Slide Bullets");
    lines.push("");

    const bulletLines = activeBrief.slideBullets
      .split("\n")
      .map((line) => {
        if (line.startsWith("##")) {
          return `\n${line.replace(/^##+/, "").trim()}\n`;
        } else if (line.startsWith("-") || line.startsWith("*")) {
          return `• ${line.replace(/^[-*]\s*/, "")}`;
        }
        return line.trim();
      });

    lines.push(...bulletLines);

    navigator.clipboard.writeText(lines.join("\n").trim());
    setBulletsCopied(true);
    setTimeout(() => setBulletsCopied(false), 1300);
  };

  const handleExportPDF = () => {
    if (!activeBrief) return;
    setExporting(true);
    setTimeout(() => setExporting(false), 1200);
    exportSummaryPDF(activeBrief.summary, activeBrief.executive_summary);
  };

  const handleExportBullets = () => {
    if (!activeBrief?.slideBullets) return;
    setBulletsExporting(true);
    setTimeout(() => setBulletsExporting(false), 1200);
    exportBulletsPDF(activeBrief.slideBullets);
  };

  // Always prefer preview if present
  const getSummaryToDisplay = (brief: Brief) => brief.previewSummary || brief.summary;
  const getExecutiveToDisplay = (brief: Brief) => brief.previewExecutiveSummary || brief.executive_summary;
  const getBulletsToDisplay = (brief: Brief) => brief.previewSlideBullets || brief.slideBullets;

  // Sidebar handlers for Ask Thrust integration
  const handleSidebarSelectChat = (id: string) => {
    setAskThrustActive(false);
    setActiveBriefId(id);
  };
  const handleSidebarAskThrust = () => {
    setAskThrustActive(true);
    setActiveBriefId(""); // No brief active while in Ask Thrust mode
  };



  return (
    <div className="flex h-[calc(100vh-55px)] bg-background text-foreground my-16 ">
      <Sidebar
        chats={briefs.map((b) => ({
          id: b.id,
          title: b.title,
        }))}
        activeId={activeBriefId}
        onSelectChat={handleSidebarSelectChat}
        onNewChat={createNewBrief}
        onDeleteChat={deleteBrief}
        onAskThrust={handleSidebarAskThrust}
        askThrustActive={askThrustActive}
      />
      <main className="flex-1 flex flex-col h-[calc(100vh-55px)] min-h-0 overflow-hidden">
        {askThrustActive && typeof projectId === "string" && projectId.length > 0 ? (
          <AskThrustPanel
            ref={askThrustPanelRef}
            projectId={projectId}
            mode="project"
          />
        ) : (
          <>
            {isDashboardEmpty && <EmptyState onStart={createNewBrief} />}

            {!isDashboardEmpty && isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <LoadingSpinner text="Processing your document, could take 2-3 min..." />
              </div>
            ) : !isDashboardEmpty && activeBrief && (activeBrief.summary || "").length > 0 ? (
              <div className="flex flex-1 h-full animate-fadeIn min-h-0">
                <div className="flex-1 flex flex-col px-8 py-7 border-r border-muted min-w-0 min_h-0 bg-background rounded-l-2xl">
                  <div className="mb-6">
                    <div className="text-[15px] font-semibold text-muted tracking-wide uppercase opacity-80 mb-1">
                      Current Brief
                    </div>
                    <div className="text-xl font-bold text-foreground truncate">
                      {activeBrief.title}
                    </div>
                  </div>
                  <Tabs
                    activeTab={activeTab}
                    onTabChange={(key) => setActiveTab(key as "summary" | "bullets")}
                    tabs={[
                      { key: "summary", label: "Summary" },
                      { key: "bullets", label: "Slide Bullets", disabled: !activeBrief.slideBullets },
                    ]}
                  />

                  {activeTab === "summary" && (
                    <SummaryTab
                      summary={getSummaryToDisplay(activeBrief)}
                      executiveSummary={getExecutiveToDisplay(activeBrief)}
                      onExport={handleExportPDF}
                      onCopy={handleCopySummary}
                      copied={copied}
                      exporting={exporting}
                      onGenerateBullets={handleGenerateBullets}
                      generatingBullets={bulletsLoading}
                    />
                  )}

                  {activeTab === "bullets" && (
                    <SlideBulletsTab
                      prompt={bulletsPrompt}
                      onPromptChange={setBulletsPrompt}
                      onSubmitPrompt={submitBulletsPrompt}
                      loading={bulletsLoading}
                      bullets={getBulletsToDisplay(activeBrief)}
                      copied={bulletsCopied}
                      exporting={bulletsExporting}
                      onCopy={handleCopyBullets}
                      onExport={handleExportBullets}
                    />
                  )}
                </div>
                <div className="w-[320px] bg-[#192236] px-4 py-7 flex flex-col border-l border-muted rounded-r-2xl shadow-lg">
                  <AIChatPanel
                    chatHistory={
                      activeTab === "bullets"
                        ? activeBrief?.slideBulletsChat || []
                        : activeBrief?.summaryChat || []
                    }
                    onSendMessage={handleSummaryChat}
                    summary={activeTab === "bullets"
                      ? getBulletsToDisplay(activeBrief)
                      : getSummaryToDisplay(activeBrief)
                    }
                    summaryId={activeBrief?.id}
                    onEditProposal={handleEditProposal}
                    pendingEdit={activeBrief?.pendingEdit}
                    onAcceptEdit={handleAcceptEdit}
                    onUndoEdit={handleUndoEdit}
                    accepting={accepting}
                    tabType={activeTab}
                  />
                </div>
              </div>
            ) : !isDashboardEmpty && (
              <div className="flex-1 flex flex-col">
                <ChatWindow
                  messages={[]} // Only for local chat, not persisted
                  hasActiveChat={!!activeBrief}
                />
                {activeBrief && user?.id && projectId && (
                  <PromptBar
                    key={`${user.id}_${projectId}_${activeBrief.id}`}
                    onSubmitUser={() => {}}
                    onResult={() => {}}
                    onSummaryStart={handleSummaryStart}
                    onSummaryResult={handleSummaryResult}
                    projectId={projectId}
                    userId={user.id}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
