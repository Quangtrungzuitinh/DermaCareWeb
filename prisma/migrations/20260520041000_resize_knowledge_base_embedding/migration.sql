DROP INDEX IF EXISTS "knowledge_base_embedding_idx";

ALTER TABLE "knowledge_base"
  DROP COLUMN IF EXISTS "embedding";

ALTER TABLE "knowledge_base"
  ADD COLUMN "embedding" vector(1024);

CREATE INDEX IF NOT EXISTS "knowledge_base_embedding_idx"
  ON "knowledge_base"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100)
  WHERE "embedding" IS NOT NULL;
