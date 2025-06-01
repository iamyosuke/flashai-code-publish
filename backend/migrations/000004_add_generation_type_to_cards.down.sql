-- Remove index
DROP INDEX IF EXISTS idx_cards_generation_type;

-- Remove column
ALTER TABLE cards DROP COLUMN generation_type;
