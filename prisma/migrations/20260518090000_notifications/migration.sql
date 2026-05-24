-- Notification system for role broadcasts, direct messages, and automatic appointment/payment alerts.

CREATE TYPE "NotificationType" AS ENUM (
  'SYSTEM',
  'APPOINTMENT',
  'PAYMENT',
  'REMINDER',
  'MANUAL',
  'BROADCAST',
  'ALERT'
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "recipientRole" "Role" NOT NULL,
  "senderId" TEXT,
  "appointmentId" TEXT,
  "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "metadata" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_recipientId_isRead_createdAt_idx" ON "notifications"("recipientId", "isRead", "createdAt");
CREATE INDEX "notifications_recipientRole_createdAt_idx" ON "notifications"("recipientRole", "createdAt");
CREATE INDEX "notifications_appointmentId_idx" ON "notifications"("appointmentId");
CREATE INDEX "notifications_senderId_idx" ON "notifications"("senderId");
CREATE INDEX "notifications_revokedAt_idx" ON "notifications"("revokedAt");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
