alter table response_card ADD COLUMN IF NOT EXISTS tags jsonb;
alter table response_card ADD COLUMN IF NOT EXISTS summary TEXT;