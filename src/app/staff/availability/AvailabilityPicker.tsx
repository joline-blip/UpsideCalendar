"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateInputValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function roundUpToNextHalfHour(d: Date) {
  const x = new Date(d);
  x.setSeconds(0, 0);
  const m = x.getMinutes();
  const add = m % 30 === 0 ? 0 : 30 - (m % 30);
  x.setMinutes(m + add);
  return x;
}

function buildTimeOptions() {
  const opts: { minutes: number; label: string }[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const h24 = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    opts.push({ minutes, label: `${h12}:${pad2(m)} ${ampm}` });
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();

export function AvailabilityPicker({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const now = useMemo(() => new Date(), []);
  const minStart = useMemo(() => roundUpToNextHalfHour(now), [now]);

  const [startDate, setStartDate] = useState(() => toDateInputValue(minStart));
  const [startMinutes, setStartMinutes] = useState(() => minStart.getHours() * 60 + minStart.getMinutes());
  const [endDate, setEndDate] = useState(() => toDateInputValue(minStart));
  const [endMinutes, setEndMinutes] = useState(() => startMinutes + 30);

  // Ensure end is always after start by at least 30 mins.
  useEffect(() => {
    const startMs = toMs(startDate, startMinutes);
    const endMs = toMs(endDate, endMinutes);
    if (endMs <= startMs) {
      const next = new Date(startMs + 30 * 60 * 1000);
      setEndDate(toDateInputValue(next));
      setEndMinutes(next.getHours() * 60 + next.getMinutes());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, startMinutes]);

  const startMs = useMemo(() => toMs(startDate, startMinutes), [startDate, startMinutes]);
  const endMs = useMemo(() => toMs(endDate, endMinutes), [endDate, endMinutes]);

  const minDateStr = toDateInputValue(new Date());
  const startIsToday = startDate === minDateStr;

  const filteredStartTimes = useMemo(() => {
    if (!startIsToday) return TIME_OPTIONS;
    const cutoff = roundUpToNextHalfHour(new Date()).getHours() * 60 + roundUpToNextHalfHour(new Date()).getMinutes();
    return TIME_OPTIONS.filter((t) => t.minutes >= cutoff);
  }, [startIsToday]);

  const startTimeValueOk = filteredStartTimes.some((t) => t.minutes === startMinutes);
  useEffect(() => {
    if (!startTimeValueOk && filteredStartTimes.length) {
      setStartMinutes(filteredStartTimes[0].minutes);
    }
  }, [startTimeValueOk, filteredStartTimes]);

  const disabled = endMs <= startMs || isNaN(startMs) || isNaN(endMs) || startMs < Date.now();

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <input type="hidden" name="startAtMs" value={String(startMs)} />
      <input type="hidden" name="endAtMs" value={String(endMs)} />

      <div className="space-y-2">
        <Label>Start</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            type="date"
            value={startDate}
            min={minDateStr}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Select value={String(startMinutes)} onValueChange={(v) => setStartMinutes(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              {filteredStartTimes.map((t) => (
                <SelectItem key={t.minutes} value={String(t.minutes)}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>End</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          <Select value={String(endMinutes)} onValueChange={(v) => setEndMinutes(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t.minutes} value={String(t.minutes)}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={disabled}>
        Add
      </Button>

      <p className="sm:col-span-3 text-sm text-muted-foreground">
        30-minute increments only. Start time cannot be in the past.
      </p>
    </form>
  );
}

function toMs(dateStr: string, minutes: number) {
  // dateStr is YYYY-MM-DD
  const [y, m, d] = dateStr.split("-").map((x) => Number(x));
  if (!y || !m || !d) return NaN;
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  // Construct in the user's local timezone.
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

