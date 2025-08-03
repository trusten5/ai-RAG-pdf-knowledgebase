"use client";

import { useEffect } from "react";
import LandingHero from "@/components/LandingHero";
import FeatureGrid from "@/components/FeatureGrid";
import MeetCTA from "@/components/MeetCTA";
import posthog from "@/app/instrumentation-client";

export default function Home() {
  useEffect(() => {
    posthog.capture("landing_page_view");
  }, []);

  return (
    <div className="bg-background">
      <LandingHero />
      <div className="w-20 h-1 bg-accent rounded-full mx-auto" />
      <FeatureGrid />
      <div className="w-20 h-1 bg-accent rounded-full mx-auto my-10" />
      <MeetCTA />
    </div>
  );
}
