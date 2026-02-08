import { addMinutes, isAfter } from "date-fns";

export type Slot = {
  staffUserId: string;
  startAt: Date;
  endAt: Date;
};

export function generateSlotsFromBlock(args: {
  staffUserId: string;
  blockStartAt: Date;
  blockEndAt: Date;
  durationMinutes: number;
  stepMinutes?: number;
}) {
  const stepMinutes = args.stepMinutes ?? 30;
  const slots: Slot[] = [];

  let cursor = new Date(args.blockStartAt);
  while (true) {
    const endAt = addMinutes(cursor, args.durationMinutes);
    if (isAfter(endAt, args.blockEndAt)) break;
    slots.push({ staffUserId: args.staffUserId, startAt: new Date(cursor), endAt });
    cursor = addMinutes(cursor, stepMinutes);
  }

  return slots;
}

