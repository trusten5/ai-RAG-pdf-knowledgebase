import LandingHero from "@/components/LandingHero";
import FeatureGrid from "@/components/FeatureGrid";
import MeetCTA from "@/components/MeetCTA";

export default function Home() {
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
