"use client";

interface EmptyStateProps {
  onStart: () => void;
}

export default function EmptyState({ onStart }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-background/90 rounded-2xl border border-card mx-10 shadow-lg">
      <div className="max-w-xl mx-auto text-center space-y-5 px-6 py-12">
        <h2 className="text-2xl font-extrabold text-foreground mb-2">
          Welcome to Thrust
        </h2>
        <p className="text-lg text-muted-strong">
          Quickly transform client docs into executive-grade summaries and insights.
        </p>
        <button
          onClick={onStart}
          className="bg-accent text-background font-semibold px-7 py-3 mt-3 rounded-xl hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent ring-offset-2 transition"
        >
          + Start New Brief
        </button>
        <p className="text-xs mt-4 text-muted">
          Each “Brief” is a dedicated workspace for one document, summary, or analysis.
        </p>
      </div>
    </div>
  );
}
