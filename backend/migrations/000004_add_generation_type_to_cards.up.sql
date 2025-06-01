ALTER TABLE cards ADD COLUMN generation_type VARCHAR(20) DEFAULT 'manual';

-- Update existing cards to have 'text' generation type if they were created via AI
UPDATE cards SET generation_type = 'text' WHERE generation_type = 'manual';

-- Add index for better query performance
CREATE INDEX idx_cards_generation_type ON cards(generation_type);
