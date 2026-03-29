-- Insert a demo user (PIN: 1234 hashed with bcrypt – you need to replace with actual bcrypt hash)
INSERT INTO users (id, full_name, username, pin_hash, phone_number, status) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Demo User', 'demo', '$2b$10$9fFcVjZk5qR3X7pR3X7pR3X7pR3X7pR3X7pR3X7pR3X7pR3X7pR3X7pR3', '254700000000', 'active')
ON CONFLICT (username) DO NOTHING;

INSERT INTO wallets (id, user_id, balance, daily_limit, monthly_limit) 
VALUES (uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 1000, 5000, 50000);