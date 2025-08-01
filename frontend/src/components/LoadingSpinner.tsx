export default function LoadingSpinner({ text }: { text?: string }) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="animate-spin inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full mb-2" />
        {text?.split("\n").map((line, i) => (
          <span key={i} className="text-base text-muted text-center">
            {line}
          </span>
        ))}
      </div>
    );
  }
  