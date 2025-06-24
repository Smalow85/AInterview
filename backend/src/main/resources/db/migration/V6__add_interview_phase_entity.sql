CREATE TABLE if not exists interview_phase (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE if not exists interview_phase_question (
    id SERIAL PRIMARY KEY,
    phase_id BIGINT NOT NULL,
    text TEXT NOT NULL,
    type VARCHAR(100),
    difficulty VARCHAR(100),
    expected_keywords jsonb,
    evaluation_criteria jsonb,
    FOREIGN KEY (phase_id) REFERENCES interview_phase(id) ON DELETE CASCADE
);