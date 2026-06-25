import { forwardRef } from "react";

const baseFieldClasses =
  "w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[13px] text-text-hi placeholder:text-text-lo/60 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/40";

export const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className = "", ...props }, ref) {
  return (
    <input ref={ref} className={`${baseFieldClasses} ${className}`} {...props} />
  );
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`${baseFieldClasses} resize-none ${className}`}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className = "", ...props }, ref) {
  return (
    <select ref={ref} className={`${baseFieldClasses} ${className}`} {...props} />
  );
});

export function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[12px] font-medium text-text-lo">
      {children}
    </label>
  );
}
