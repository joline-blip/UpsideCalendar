"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteStaffDialog({
  email,
  userId,
  formAction,
}: {
  email: string;
  userId: string;
  formAction: (formData: FormData) => void;
}) {
  const [typed, setTyped] = useState("");
  const ok = useMemo(() => typed.trim().toLowerCase() === email.trim().toLowerCase(), [typed, email]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete BA
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this BA?</DialogTitle>
          <DialogDescription>
            This will permanently delete <span className="font-medium">{email}</span> and their related data
            (availability, bookings, sessions, audit actions). This can’t be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirmEmail">
            Type the BA email to confirm: <span className="font-mono font-medium">{email}</span>
          </Label>
          <Input
            id="confirmEmail"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={email}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <form action={formAction}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="confirm" value={typed} />
            <Button type="submit" variant="destructive" disabled={!ok}>
              Permanently delete BA
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

