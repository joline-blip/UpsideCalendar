import { prisma } from "@/lib/prisma";
import type { BaSignupMode } from "@/generated/prisma";

const CONFIG_ID = "default";

export async function getAppConfig() {
  // Ensure the singleton exists
  return prisma.appConfig.upsert({
    where: { id: CONFIG_ID },
    update: {},
    create: { id: CONFIG_ID, baSignupMode: "ADMIN_APPROVAL" },
  });
}

export async function setBaSignupMode(mode: BaSignupMode) {
  return prisma.appConfig.upsert({
    where: { id: CONFIG_ID },
    update: { baSignupMode: mode },
    create: { id: CONFIG_ID, baSignupMode: mode },
  });
}

