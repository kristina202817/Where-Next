import type { HTMLAttributes } from "react";

export default function GlassPanel({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`glass ${className}`} {...rest} />;
}
