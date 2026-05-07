import { clamp } from "@/lib/utils";

export function ScoreRing({ value, size = 128 }: { value: number; size?: number }) {
  const v = clamp(value, 0, 100);
  const r = 45;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--color-surface-container-highest)"
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-h2 text-h2 text-on-surface">
        {Math.round(v)}
      </span>
    </div>
  );
}
