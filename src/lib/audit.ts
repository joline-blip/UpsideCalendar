import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

type JsonFieldInput = Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;

function toJson(value: unknown): JsonFieldInput {
  if (value === null) return Prisma.JsonNull;
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return { value: String(value) } as unknown as Prisma.InputJsonValue;
  }
}

export async function writeAuditLog(args: {
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
}) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const userAgent = h.get("user-agent") ?? undefined;

  await prisma.auditLog.create({
    data: {
      actorUserId: args.actorUserId ?? null,
      entityType: args.entityType,
      entityId: args.entityId,
      action: args.action,
      beforeJson: args.before === undefined ? undefined : toJson(args.before),
      afterJson: args.after === undefined ? undefined : toJson(args.after),
      ip,
      userAgent,
    },
  });
}

