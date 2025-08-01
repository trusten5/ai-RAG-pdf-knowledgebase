"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const samplePrompt = "Analyze the attached 10-K";
const loadingText = "Thrust is thinking...";
const sampleOutput = [
  "• Revenue grew 14% YoY, exceeding market expectations.",
  "• Gross margin improved by 120bps due to supply chain efficiencies.",
  "• Recommendation: Expand investment in Asia-Pacific segment.",
];

export default function LandingHero() {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    if (step === 0) {
      let i = 0;
      const typeChar = () => {
        if (i <= samplePrompt.length) {
          setTyped(samplePrompt.slice(0, i));
          timeouts.push(setTimeout(typeChar, 50));
          i++;
        } else {
          timeouts.push(setTimeout(() => setStep(1), 1000));
        }
      };
      typeChar();
    }

    if (step === 1) {
      timeouts.push(setTimeout(() => setStep(2), 2000));
    }
    if (step === 2) {
      timeouts.push(setTimeout(() => setStep(3), 2500));
    }
    if (step === 3) {
      timeouts.push(setTimeout(() => setStep(4), 2000));
    }

    return () => timeouts.forEach(clearTimeout);
  }, [step]);

  return (
    <section className="relative bg-background overflow-hidden py-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            <span className="text-accent">AI that reads</span> like your best analyst
          </h1>
          <p className="text-lg text-muted max-w-xl">
            Upload dense reports, 10-Ks, or pitch decks — Thrust turns them into concise, executive-grade summaries and slide-ready insights. Built for consultants who value speed, clarity, and control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="https://tally.so/r/nPJ115" target="_blank" rel="noopener noreferrer">
              <button className="bg-accent text-background font-semibold px-6 py-3 rounded-xl hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent ring-offset-2">
                Interested? Join our free pilot!
              </button>
            </a>
            <a href="https://calendly.com/trusten-lehmannkarp/thrust-demo" target="_blank" rel="noopener noreferrer">
              <button className="border border-accent text-accent font-semibold px-6 py-3 rounded-xl hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent ring-offset-2">
                Schedule a Demo
              </button>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card border border-muted rounded-2xl p-6 shadow-2xl backdrop-blur-md min-h-[220px]"
        >
          <h4 className="text-accent text-lg font-semibold mb-4">Preview: What Thrust Delivers</h4>
          <div className="space-y-3 text-[15px] leading-relaxed font-mono text-muted-strong">
            {step === 0 && (
              <p className="bg-background/70 px-4 py-2 rounded-lg whitespace-pre shadow-sm">
                {"> " + typed}
                <span className="text-muted animate-pulse">|</span>
              </p>
            )}
            {step === 1 && (
              <p className="italic text-muted animate-pulse">{loadingText}</p>
            )}
            {step >= 2 && (
              <div className="space-y-2 animate-fadeIn">
                {sampleOutput.map((line, idx) => (
                  <div
                    key={idx}
                    className="bg-background/70 rounded-lg px-4 py-2 shadow-sm"
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
