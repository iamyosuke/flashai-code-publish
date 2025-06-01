-- Drop indexes
DROP INDEX IF EXISTS idx_cards_status;
DROP INDEX IF EXISTS idx_answer_records_answer_date;
DROP INDEX IF EXISTS idx_answer_records_card_id;
DROP INDEX IF EXISTS idx_answer_records_deck_id;
DROP INDEX IF EXISTS idx_answer_records_user_id;

-- Drop answer_records table
DROP TABLE IF EXISTS answer_records;

-- Remove status column from cards table
ALTER TABLE cards DROP COLUMN IF EXISTS status;
