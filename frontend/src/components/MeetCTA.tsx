"use client";

export default function MeetCTA() {
  return (
    <section className="max-w-4xl mx-auto text-center px-6 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
        Want to see it in action?
      </h2>
      <p className="text-muted-strong mb-6">
        Book a 1:1 walkthrough or reach out directly to explore how Thrust can fit your team’s process.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="https://calendly.com/trusten-lehmannkarp/thrust-demo"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-accent text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
        >
          Book a Demo
        </a>
        <a
          href="mailto:trusten.lehmannkarp@gmail.com"
          className="text-accent border border-accent px-6 py-3 rounded-lg font-medium hover:bg-accent/10 transition"
        >
          Meet the Founder
        </a>
      </div>
    </section>
  );
}
