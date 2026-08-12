import React from "react";

export type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right" | "fade";
};

export function Reveal({ children, className = "" }: RevealProps) {
  return <div className={className}>{children}</div>;
}
