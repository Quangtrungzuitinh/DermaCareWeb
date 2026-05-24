CREATE TABLE IF NOT EXISTS "chat_session" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "role" TEXT NOT NULL DEFAULT 'PATIENT',
  "context" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chat_session_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chat_session_userId_idx"
  ON "chat_session"("userId");

CREATE TABLE IF NOT EXISTS "chat_message" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "toolCalls" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chat_message_sessionId_createdAt_idx"
  ON "chat_message"("sessionId", "createdAt");

ALTER TABLE "chat_message"
  ADD CONSTRAINT "chat_message_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "chat_session"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
