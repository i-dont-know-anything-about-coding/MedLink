import { forwardRef } from "react";

type Variant =
  | "primary"
  | "outline"
  | "ghost"
  | "approve"
  | "reject"
  | "cancel";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent/90 disabled:bg-accent/40",
  outline:
    "border border-border text-text-hi hover:bg-panel-hover disabled:opacity-50",
  ghost: "text-text-lo hover:text-text-hi hover:bg-panel-hover",
  approve:
    "bg-safe/15 text-safe border border-safe/30 hover:bg-safe/25 disabled:opacity-50",
  reject:
    "bg-critical/15 text-critical border border-critical/30 hover:bg-critical/25 disabled:opacity-50",
  cancel:
    "border border-border text-text-lo hover:text-text-hi hover:bg-panel-hover",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
