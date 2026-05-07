"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function PrimaryButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: PrimaryButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-livoz-blue text-white shadow-[0_18px_28px_rgba(30,115,248,0.18)]"
      : "bg-white text-livoz-navy border border-blue-100";

  return (
    <button
      className={`rounded-[18px] px-5 py-4 font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
