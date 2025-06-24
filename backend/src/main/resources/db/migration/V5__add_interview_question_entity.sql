CREATE TABLE if not exists interview_questions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    context TEXT,
    asked BOOLEAN NOT NULL DEFAULT FALSE,  -- Flag to indicate if the question has been asked
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);