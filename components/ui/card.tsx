import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(24,39,31,0.035)] ${className}`}
      {...props}
    />
  );
}
