"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export default function FounderBio() {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <section ref={ref} className="max-w-5xl mx-auto px-6 py-24 text-center">
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-foreground mb-4"
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.6 }}
      >
        Meet the Builder
      </motion.h2>

      <motion.p
        className="bg-card rounded-xl px-6 py-8 text-muted-strong shadow max-w-2xl mx-auto mb-8 text-[15px] leading-relaxed"
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        I&apos;m an engineer building Thrust to eliminate the repetitive tasks consultants face daily — rewriting decks, summarizing PDFs, pulling insights from reports.
        <br /><br />
        With experience in AI automation and startup product workflows, I’m focused on delivering tools that cut through noise. No distractions, no hallucinated fluff — just clean, structured output you can actually use.
      </motion.p>

      <motion.div
        className="flex justify-center gap-4"
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <a
          href="mailto:trusten.lehmannkarp@gmail.com"
          className="text-accent border border-accent px-6 py-2 rounded-lg font-medium hover:bg-accent/10 transition"
        >
          Get in Touch
        </a>
        <a
          href="https://calendly.com/trusten-lehmannkarp/thrust-demo"
          className="bg-accent text-background px-6 py-2 rounded-lg font-medium hover:bg-accent-hover transition"
        >
          Book a Demo
        </a>
      </motion.div>
    </section>
  );
}
