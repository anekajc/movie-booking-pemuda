"use client";

import { useFormStatus } from "react-dom";

// Submit button that asks for confirmation before submitting its parent form.
export function ConfirmButton({
  message,
  children,
  className,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className={`${className ?? ""} disabled:opacity-50`}
    >
      {pending ? "…" : children}
    </button>
  );
}
