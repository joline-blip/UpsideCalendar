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

const PHRASE = "delete bas";

export function PurgeStaffDialog({
  staffCount,
  formAction,
}: {
  staffCount: number;
  formAction: (formData: FormData) => void;
}) {
  const [typed, setTyped] = useState("");
  const ok = useMemo(() => typed.trim().toLowerCase() === PHRASE, [typed]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete all BAs</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete all BAs?</DialogTitle>
          <DialogDescription>
            This will permanently delete <span className="font-medium">{staffCount}</span> BA account(s) and their
            related data (availability, bookings, sessions, audit actions). This can’t be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirmPhrase">
            Type <span className="font-mono font-medium">delete BAs</span> to confirm
          </Label>
          <Input
            id="confirmPhrase"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="delete BAs"
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <form action={formAction}>
            <input type="hidden" name="confirm" value={typed} />
            <Button type="submit" variant="destructive" disabled={!ok}>
              Permanently delete BAs
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

