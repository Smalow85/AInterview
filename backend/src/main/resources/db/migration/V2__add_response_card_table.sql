CREATE TABLE IF NOT EXISTS response_card (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    sender TEXT,
    header TEXT,
    data TEXT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);