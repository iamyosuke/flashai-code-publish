CREATE TABLE card_previews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    deck_title VARCHAR(255) NOT NULL,
    deck_description TEXT,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    generation_type VARCHAR(50) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    original_prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_card_previews_session_id ON card_previews(session_id);
CREATE INDEX idx_card_previews_expires_at ON card_previews(expires_at);
CREATE INDEX idx_card_previews_user_id ON card_previews(user_id);