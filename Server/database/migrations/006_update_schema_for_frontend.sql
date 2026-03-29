-- Update existing tables to match frontend expectations

-- Update wallets table to match frontend schema
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS wallet_name VARCHAR(100) DEFAULT 'InstantAid Wallet';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'KES';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_demo_funded BOOLEAN DEFAULT false;

-- Update users table to use auth.users compatibility (for Supabase compatibility)
ALTER TABLE users RENAME TO legacy_users;

-- Create new profiles table to match frontend
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    account_type VARCHAR(20) DEFAULT 'personal' CHECK (account_type IN ('personal', 'business')),
    business_name VARCHAR(100),
    is_verified BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user', 'business')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update transactions table to match frontend schema
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(user_id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_wallet_id UUID REFERENCES wallets(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receiver_wallet_id UUID REFERENCES wallets(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paybill_number VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS till_number VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mpesa_receipt VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference VARCHAR(100);

-- Update transaction types to match frontend enums
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('wallet_transfer', 'mpesa_paybill', 'mpesa_send_money', 'mpesa_buy_goods', 'deposit', 'withdrawal', 'payment_request'));

-- Update transaction status to match frontend enums
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_link VARCHAR(500),
    qr_code_data TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sender_wallet ON transactions(sender_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver_wallet ON transactions(receiver_wallet_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
