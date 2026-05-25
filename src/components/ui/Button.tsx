import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-court-accent text-white hover:bg-blue-700",
  secondary: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  success: "bg-court-green text-white hover:bg-green-700",
};

export function Button({
  className,
  variant = "secondary",
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
