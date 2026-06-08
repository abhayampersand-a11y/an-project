"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full h-11 text-base font-semibold tracking-wide"
      disabled={pending}
    >
      {pending ? "Signing in…" : "Sign In"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* logo / brand */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <span className="text-2xl font-black tracking-tight">OC</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Om Casting
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin Portal — sign in to continue
          </p>
        </div>

        {/* card */}
        <div className="rounded-2xl border bg-card p-8 shadow-xl">
          <form action={formAction} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter your username"
                autoComplete="username"
                className="h-11"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                className="h-11"
                required
              />
            </div>

            {state.error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            ) : null}

            <SubmitButton />
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Om Casting. All rights reserved.
        </p>
      </div>
    </main>
  );
}
