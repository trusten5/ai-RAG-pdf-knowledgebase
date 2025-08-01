import HowItWorks from "@/components/HowItWorks";
import FounderBio from "@/components/FounderBio";

export default function AboutPage() {
  return (
    <main className="bg-background text-foreground">
      <HowItWorks />
      <div className="w-20 h-1 bg-accent rounded-full mx-auto" />
      <FounderBio />
    </main>
  );
}
