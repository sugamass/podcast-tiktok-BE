CREATE TABLE audio (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    padding INT,
    description VARCHAR,
    script JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by VARCHAR,
    reference []VARCHAR,
    tts VARCHAR,
    voices []VARCHAR,
    speakers []VARCHAR,
    m3u8_path VARCHAR
);
