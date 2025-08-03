"use client";

import { useState } from "react";
import posthog from "@/app/instrumentation-client";
import { supabase } from "@/lib/supabase";

const REASONS = ["Vague", "Inaccurate", "Too Short", "Too Long", "Missing Key Info"];

export default function FeedbackButtons({
  userId,
  briefId,
  sectionType, // e.g. "summary", "bullets"
}: {
  userId: string;
  briefId: string;
  sectionType: string;
}) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function saveFeedback(thumbs: "up" | "down", reasonArr: string[] = []) {
    setSubmitting(true);
    await supabase.from("feedback").upsert({
      user_id: userId,
      brief_id: briefId,
      section_type: sectionType,
      thumbs,
      reasons: reasonArr,
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  // Thumbs up: immediate submit
  const handleThumb = async (val: "up" | "down") => {
    setFeedback(val);
    posthog.capture("feedback_given", {
      user_id: userId,
      brief_id: briefId,
      section_type: sectionType,
      thumbs: val,
    });
    if (val === "up") {
      await saveFeedback(val, []);
    }
    // For "down", do nothing yet; wait for user to pick reasons and submit.
  };

  // Toggle reason selection
  const toggleReason = (reason: string) => {
    if (reasons.includes(reason)) {
      setReasons(reasons.filter((r) => r !== reason));
    } else {
      setReasons([...reasons, reason]);
    }
    posthog.capture("feedback_reason_selected", {
      user_id: userId,
      brief_id: briefId,
      section_type: sectionType,
      reason,
    });
  };

  // Submit reasons
  const handleSubmitReasons = async () => {
    if (feedback === "down") {
      await saveFeedback("down", reasons);
    }
  };

  if (submitted) {
    return <div className="text-sm text-green-600 mt-2">Thanks for your feedback!</div>;
  }

  return (
    <div className="mt-4">
      {feedback === null ? (
        <div className="flex gap-3 items-center">
          <span className="text-sm text-muted-strong">Was this helpful?</span>
          <button onClick={() => handleThumb("up")} className="hover:text-green-500" disabled={submitting}>👍</button>
          <button onClick={() => handleThumb("down")} className="hover:text-red-500" disabled={submitting}>👎</button>
        </div>
      ) : feedback === "down" ? (
        <div className="mt-2">
          <span className="text-sm text-muted-strong">What was the issue?</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => toggleReason(r)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  reasons.includes(r)
                    ? "bg-red-100 border-red-500 text-red-600"
                    : "bg-muted border-muted text-foreground hover:bg-muted-strong"
                }`}
                disabled={submitting}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmitReasons}
            disabled={submitting || reasons.length === 0}
            className="mt-3 px-4 py-1 rounded bg-accent text-background font-medium disabled:opacity-70"
          >
            Submit
          </button>
        </div>
      ) : (
        <div className="text-sm text-green-600 mt-2">Thanks for your feedback!</div>
      )}
    </div>
  );
}
