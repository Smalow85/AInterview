alter table response_card ADD COLUMN IF NOT EXISTS tags TEXT[];
alter table response_card ADD COLUMN IF NOT EXISTS summary TEXT;