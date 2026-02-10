"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldErrors = Partial<
  Record<
    "firstName" | "lastName" | "address" | "markets" | "password" | "confirmPassword",
    string
  >
>;

type State = {
  ok: boolean;
  formError?: string;
  fieldErrors?: FieldErrors;
};

const initialState: State = { ok: false, fieldErrors: {} };

export function OnboardingForm({
  email,
  action,
}: {
  email: string;
  action: (prevState: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.formError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email (username)</Label>
        <Input id="email" name="email" value={email} disabled />
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
          {fe.confirmPassword ? (
            <p className="text-sm text-destructive">{fe.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}

