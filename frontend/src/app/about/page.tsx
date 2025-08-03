"use client";

import { useEffect } from "react";
import HowItWorks from "@/components/HowItWorks";
import FounderBio from "@/components/FounderBio";
import posthog from "@/app/instrumentation-client";

export default function AboutPage() {
  useEffect(() => {
    posthog.capture("about_page_view");
  }, []);

  return (
    <main className="bg-background text-foreground">
      <HowItWorks />
      <div className="w-20 h-1 bg-accent rounded-full mx-auto" />
      <FounderBio />
    </main>
  );
}
