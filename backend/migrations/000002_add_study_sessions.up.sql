-- Add status column to cards table
ALTER TABLE cards ADD COLUMN status VARCHAR(20) DEFAULT 'new';

-- Create answer_records table
CREATE TABLE answer_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    study_time INTEGER NOT NULL DEFAULT 0,
    answer_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_answer_records_user_id ON answer_records(user_id);
CREATE INDEX idx_answer_records_deck_id ON answer_records(deck_id);
CREATE INDEX idx_answer_records_card_id ON answer_records(card_id);
CREATE INDEX idx_answer_records_answer_date ON answer_records(answer_date);
CREATE INDEX idx_cards_status ON cards(status);
