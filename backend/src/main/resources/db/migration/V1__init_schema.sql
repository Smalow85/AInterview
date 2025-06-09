CREATE TABLE chat_message (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    sender TEXT,
    message TEXT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);