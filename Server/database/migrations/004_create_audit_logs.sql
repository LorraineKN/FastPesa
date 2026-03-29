CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    metadata JSONB,
    ip_address INET,
    device_info TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);