"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";

type State = {
  ok: boolean;
  formError?: string;
  successMessage?: string;
  fieldErrors?: Partial<
    Record<
      "email" | "firstName" | "lastName" | "address" | "markets" | "password" | "confirmPassword",
      string
    >
  >;
};

export function SignupForm({
  action,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, fieldErrors: {} });
  const fe = state.fieldErrors ?? {};

  if (state.ok && state.successMessage) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm">
          {state.successMessage}
        </div>
        <p className="text-sm">
          <a className="underline" href="/login">
            Back to sign in
          </a>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.formError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email (username)</Label>
        <Input id="email" name="email" type="email" required aria-invalid={Boolean(fe.email)} />
        {fe.email ? <p className="text-sm text-destructive">{fe.email}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" required aria-invalid={Boolean(fe.firstName)} />
          {fe.firstName ? <p className="text-sm text-destructive">{fe.firstName}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required aria-invalid={Boolean(fe.lastName)} />
          {fe.lastName ? <p className="text-sm text-destructive">{fe.lastName}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          placeholder="Street, City, State ZIP"
          required
          aria-invalid={Boolean(fe.address)}
        />
        {fe.address ? <p className="text-sm text-destructive">{fe.address}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="markets">Markets</Label>
        <Input
          id="markets"
          name="markets"
          placeholder="Comma-separated (e.g. Hartford, New Haven, Stamford)"
          aria-invalid={Boolean(fe.markets)}
        />
        {fe.markets ? <p className="text-sm text-destructive">{fe.markets}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            minLength={8}
            required
            aria-invalid={Boolean(fe.password)}
          />
          {fe.password ? <p className="text-sm text-destructive">{fe.password}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            minLength={8}
            required
            aria-invalid={Boolean(fe.confirmPassword)}
          />
          {fe.confirmPassword ? <p className="text-sm text-destructive">{fe.confirmPassword}</p> : null}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
      <p className="text-sm">
        <a className="underline" href="/login">
          Already have an account? Sign in
        </a>
      </p>
    </form>
  );
}

