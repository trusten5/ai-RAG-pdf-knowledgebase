"use client";

import { supabase } from "@/lib/supabase";
import { useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

interface PromptBarProps {
  userId: string;
  projectId: string;
  onResult?: (markdown: string) => void;
  onSubmitUser?: (input: string) => void;
  onSummaryStart?: () => void;
  onSummaryResult?: (
    summaryMarkdown: string,
    executiveSummary: string,
    id?: number
  ) => void;
}

export default function PromptBar({
  userId,
  projectId,
  onSubmitUser,
  onSummaryStart,
  onSummaryResult,
}: PromptBarProps) {
  // LOG AT THE TOP OF THE COMPONENT
  console.log("[PromptBar:mount] userId, projectId:", userId, projectId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  // --- Handle PDF upload (triggers summary mode) ---
  const handleFileUpload = async (file: File) => {
    if (!userId || !projectId) {
      console.error("[PromptBar] BLOCKED: Missing userId/projectId!", { userId, projectId });
      alert("User not detected, please reload.");
      return;
    }
    console.log("[PromptBar] handleFileUpload called with", { userId, projectId, file, input });
    setLoading(true);
    try {
      onSummaryStart?.();

      // 1. Upload PDF to Supabase Storage bucket

      const filePath = `uploads/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

      const { error } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        });

      if (error) {
        console.error("[PromptBar] Supabase upload error:", error);
        throw error;
      }

      setFilename(filePath);
      setUploadedFile(file);

      // 2. Generate a signed URL for backend to access
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 60 * 30); // 30 min

      if (urlError) {
        console.error("[PromptBar] Supabase signedUrl error:", urlError);
        throw urlError;
      }

      // 3. Call summarization endpoint with all required metadata
      const payload: Record<string, unknown> = {
        file_url: signedUrlData?.signedUrl,
        user_id: userId,
        project_id: projectId,
        prompt: input.trim() || "",
      };
      console.log("[PromptBar] Sending payload to /api/summarize/:", payload);

      const { data: summaryData } = await axios.post(
        `${apiBase}/api/summarize/`,
        payload
      );

      console.log("[PromptBar] Response from /api/summarize/:", summaryData);

      onSummaryResult?.(
        summaryData.summary_markdown,
        summaryData.executive_summary,
        summaryData.id
      );

      setInput("");
      setFilename(null);
      setUploadedFile(null);
    } catch (err) {
      console.error("[PromptBar] File upload or summarization error:", err);
      setLoading(false);
    }
  };

  // --- Handle text submit (classic chat, or summary from text prompt) ---
  const handleTextSubmit = async () => {
    if (!userId || !projectId) {
      console.error("[PromptBar] BLOCKED: Missing userId/projectId on text submit!", { userId, projectId });
      alert("User not detected, please reload.");
      return;
    }
    console.log("[PromptBar] handleTextSubmit called with", {
      userId,
      projectId,
      input,
      filename,
      uploadedFile,
    });
    if (!input.trim() && !filename) return;
    if (!uploadedFile && onSubmitUser) {
      onSubmitUser(input.trim());
      setInput("");
      return;
    }
    if (onSummaryStart) onSummaryStart();

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        user_id: userId,
        project_id: projectId,
      };
      if (filename) payload.file_url = filename;
      if (input.trim()) payload.prompt = input.trim();

      console.log("[PromptBar] Sending payload to /api/summarize/ (text):", payload);

      const response = await axios.post(`${apiBase}/api/summarize/`, payload);

      console.log("[PromptBar] Response from /api/summarize/ (text):", response.data);

      onSummaryResult?.(
        response.data.summary_markdown,
        response.data.executive_summary,
        response.data.id
      );
      setInput("");
      setFilename(null);
      setUploadedFile(null);
    } catch (err) {
      console.error("[PromptBar] Summarize error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="border-t border-muted bg-background/80 backdrop-blur-md p-4 flex items-center gap-3 shadow-inner"
      initial={{ y: 30 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`px-4 py-2 rounded-lg border focus:ring-2 focus:ring-accent transition
          ${uploadedFile ? "bg-green-700 text-white border-green-600" : "bg-card text-muted border-muted hover:text-foreground"}
        `}
        disabled={loading}
      >
        {uploadedFile ? `Uploaded: ${uploadedFile.name}` : "Upload"}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        accept=".pdf"
        className="hidden"
      />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          uploadedFile
            ? "Add an instruction (optional) and click Send..."
            : "Upload a document... [Chat context coming soon]"
        }
        className="flex-1 px-4 py-2 bg-[#1d222b] text-white placeholder-muted border border-muted rounded-lg focus:ring-2 focus:ring-accent outline-none"
        disabled={loading}
      />
      <button
        onClick={handleTextSubmit}
        className="flex items-center justify-center px-5 py-2 bg-accent text-background rounded-lg hover:opacity-90 transition focus:ring-2 focus:ring-accent"
        disabled={loading || (!input.trim() && !filename)}
      >
        {loading ? (
          <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          "Send"
        )}
      </button>
    </motion.div>
  );
}
