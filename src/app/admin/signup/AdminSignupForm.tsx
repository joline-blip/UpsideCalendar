"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword", string>>;
};

export function AdminSignupForm({
  action,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, fieldErrors: {} });
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.formError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Admin email</Label>
        <Input id="email" name="email" type="email" required aria-invalid={Boolean(fe.email)} />
        {fe.email ? <p className="text-sm text-destructive">{fe.email}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          aria-invalid={Boolean(fe.password)}
        />
        {fe.password ? <p className="text-sm text-destructive">{fe.password}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          minLength={8}
          required
          aria-invalid={Boolean(fe.confirmPassword)}
        />
        {fe.confirmPassword ? <p className="text-sm text-destructive">{fe.confirmPassword}</p> : null}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Set password"}
      </Button>

      <p className="text-sm">
        <a className="underline" href="/admin/login">
          Back to admin sign in
        </a>
      </p>
    </form>
  );
}

