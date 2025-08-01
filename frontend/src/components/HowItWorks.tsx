"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const steps = [
  {
    title: "1. Upload Your Document",
    description:
      "Drop in a market report, 10-K, pitch deck, or research PDF. No formatting needed — Thrust handles dense, unstructured content from the start.",
  },
  {
    title: "2. Get Executive-Grade Output",
    description:
      "Thrust generates a polished summary and slide bullets, structured like a seasoned consultant would write them. All content is editable and exportable.",
  },
  {
    title: "3. Export or Request a Deck",
    description:
      "Export results as a PDF or generate slides (coming soon). Outputs are clean, fast, and ready to drop into your next deliverable.",
  },
];

export default function HowItWorks() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  useEffect(() => {
    if (inView) controls.start("visible");
  }, [controls, inView]);

  return (
    <motion.section
      ref={ref}
      className="max-w-7xl mx-auto px-6 py-24 text-center"
      initial="hidden"
      animate={controls}
      variants={{
        visible: { transition: { staggerChildren: 0.2 } },
        hidden: {},
      }}
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-4">How Thrust Works</h2>
      <p className="text-accent max-w-2xl mx-auto mb-16 text-[15px] leading-relaxed">
        Designed for consultants who need fast, structured outputs — not chatbot clutter.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            className="bg-card border border-muted rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-transform transform hover:scale-[1.03]"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl font-bold text-accent mb-2">{step.title}</h3>
            <p className="text-[15px] text-muted-strong leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>

      <p className="mt-20 text-[14px] text-accent max-w-xl mx-auto">
        Thrust never uses your documents to train models.
      </p>
    </motion.section>
  );
}
