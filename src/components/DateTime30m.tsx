"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
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

function toMs(dateStr: string, minutes: number) {
  const [y, m, d] = dateStr.split("-").map((x) => Number(x));
  if (!y || !m || !d) return NaN;
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

export function DateTime30m({
  nameMs,
  minDateMs,
  defaultMs,
  minDateStr,
}: {
  nameMs: string;
  minDateMs?: number;
  minDateStr?: string;
  defaultMs?: number;
}) {
  const now = useMemo(() => new Date(), []);
  const min = useMemo(() => roundUpToNextHalfHour(new Date(minDateMs ?? now.getTime())), [minDateMs, now]);

  const initial = useMemo(() => {
    const d = defaultMs ? new Date(defaultMs) : min;
    return roundUpToNextHalfHour(d);
  }, [defaultMs, min]);

  const [dateStr, setDateStr] = useState(() => toDateInputValue(initial));
  const [minutes, setMinutes] = useState(() => initial.getHours() * 60 + initial.getMinutes());

  const ms = useMemo(() => toMs(dateStr, minutes), [dateStr, minutes]);
  const minStr = minDateStr ?? toDateInputValue(new Date(minDateMs ?? now.getTime()));

  const isToday = dateStr === minStr;
  const filteredTimes = useMemo(() => {
    if (!isToday) return TIME_OPTIONS;
    const cutoff = roundUpToNextHalfHour(new Date(minDateMs ?? Date.now()));
    const cutoffMinutes = cutoff.getHours() * 60 + cutoff.getMinutes();
    return TIME_OPTIONS.filter((t) => t.minutes >= cutoffMinutes);
  }, [isToday, minDateMs]);

  const valueOk = filteredTimes.some((t) => t.minutes === minutes);
  useEffect(() => {
    if (!valueOk && filteredTimes.length) setMinutes(filteredTimes[0].minutes);
  }, [valueOk, filteredTimes]);

  return (
    <>
      <input type="hidden" name={nameMs} value={String(ms)} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input type="date" value={dateStr} min={minStr} onChange={(e) => setDateStr(e.target.value)} />
        <Select value={String(minutes)} onValueChange={(v) => setMinutes(Number(v))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            {filteredTimes.map((t) => (
              <SelectItem key={t.minutes} value={String(t.minutes)}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

