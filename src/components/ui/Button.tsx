import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  primary:
    "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 disabled:bg-orange-500/50",
  secondary:
    "bg-zinc-800 text-white hover:bg-zinc-700 disabled:bg-zinc-800/50",
  outline:
    "border border-white/15 text-zinc-100 hover:bg-white/5 disabled:opacity-50",
};

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl font-semibold transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
