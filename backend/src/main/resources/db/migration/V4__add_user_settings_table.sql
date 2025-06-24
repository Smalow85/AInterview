CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    active_session_id VARCHAR(255) NOT NULL,
    past_session_ids jsonb,
    system_instruction TEXT,
    language TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO user_settings (
    first_name,
    last_name,
    email,
    active_session_id,
    past_session_ids,
    language
) VALUES (
    'John',
    'Doe',
    'john.doe@example.com',
    'session_abc123',
    null,
    'ru'
);
