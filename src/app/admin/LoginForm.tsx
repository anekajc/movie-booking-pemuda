"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});

  return (
    <main className="mx-auto grid min-h-dvh max-w-sm place-items-center px-4">
      <form action={action} className="w-full rounded-2xl border border-line bg-surface p-6">
        <h1 className="text-xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-muted">Masukkan password untuk melanjutkan.</p>
        <input
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          className="mt-5 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        {state.error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-xl bg-accent py-3 font-bold text-accent-ink disabled:opacity-60"
        >
          {pending ? "Memeriksa…" : "Masuk"}
        </button>
      </form>
    </main>
  );
}
