"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const steps = [
  {
    title: "1. Upload Your Document",
    description:
      "Drop in a market report, 10-K, pitch deck, or research PDF. No formatting needed — Thrust handles dense, unstructured content out of the box.",
  },
  {
    title: "2. Get Executive-Grade Output",
    description:
      "Thrust generates a polished executive summary and slide bullets, structured like a senior consultant would write them. You can edit, copy, or export.",
  },
  {
    title: "3. Edit and Export",
    description:
      "Use our AI chat feture to refine outputs, then, export results as a PDF. Everything is editable, private, and optimized for fast delivery to clients or teams.",
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
      className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-10"
      initial="hidden"
      animate={controls}
      variants={{ visible: { transition: { staggerChildren: 0.2 } }, hidden: {} }}
    >
      {steps.map((step, idx) => (
        <motion.div
          key={idx}
          className="bg-card border border-muted rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-transform transform hover:scale-[1.03]"
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-xl font-bold text-accent mb-2">{step.title}</h3>
          <p className="text-[15px] text-muted-strong leading-relaxed">
            {step.description}
          </p>
        </motion.div>
      ))}
    </motion.section>
  );
}
