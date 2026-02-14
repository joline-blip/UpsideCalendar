-- Add staff approval + BA signup mode config

-- Enum for signup mode
DO $$ BEGIN
  CREATE TYPE "BaSignupMode" AS ENUM ('OPEN', 'ADMIN_APPROVAL', 'DISABLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add approval fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approvedByAdminId" TEXT;

-- Ensure existing admins remain usable
UPDATE "User"
SET "approvedAt" = COALESCE("approvedAt", NOW())
WHERE "role" = 'ADMIN';

-- AppConfig singleton
CREATE TABLE IF NOT EXISTS "AppConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "baSignupMode" "BaSignupMode" NOT NULL DEFAULT 'ADMIN_APPROVAL',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AppConfig" ("id", "baSignupMode", "updatedAt")
VALUES ('default', 'ADMIN_APPROVAL', NOW())
ON CONFLICT ("id") DO NOTHING;

