-- DB-side UUID: PostgreSQL generates the UUID via DEFAULT gen_random_uuid()
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Client-side UUID: application generates the UUID before INSERT
CREATE TABLE session_logs (
    id UUID PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
