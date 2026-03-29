-- RPC Functions to match frontend Supabase API calls

-- Generate transaction reference
CREATE OR REPLACE FUNCTION generate_tx_reference()
RETURNS TEXT AS $$
DECLARE
    ref TEXT;
BEGIN
    ref := 'TX' || to_char(now(), 'YYYYMMDDHH24MISS') || lpad(floor(random() * 10000)::text, 4, '0');
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Format KES amount
CREATE OR REPLACE FUNCTION format_kes(p_amount DECIMAL)
RETURNS TEXT AS $$
BEGIN
    RETURN 'KES ' || to_char(p_amount, 'FM999,999,999.00');
END;
$$ LANGUAGE plpgsql;

-- Format demo timestamp
CREATE OR REPLACE FUNCTION format_demo_timestamp(p_timestamp TIMESTAMP)
RETURNS TEXT AS $$
BEGIN
    RETURN to_char(p_timestamp, 'DD Mon YYYY HH12:MI AM');
END;
$$ LANGUAGE plpgsql;

-- Assert actor (for authorization)
CREATE OR REPLACE FUNCTION assert_actor(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- This would typically check session context
    -- For now, we'll just ensure the user exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Check if user has role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN profiles p ON ur.user_id = p.user_id 
        WHERE p.user_id = _user_id AND ur.role = _role
    );
END;
$$ LANGUAGE plpgsql;

-- Get wallet snapshot
CREATE OR REPLACE FUNCTION get_wallet_snapshot(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    wallet_record RECORD;
    result JSON;
BEGIN
    SELECT w.id, w.user_id, w.wallet_name, w.balance, w.currency, w.is_active, w.is_demo_funded, w.created_at, w.updated_at
    INTO wallet_record
    FROM wallets w
    WHERE w.user_id = p_user_id;
    
    IF wallet_record IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Wallet not found');
    END IF;
    
    result := json_build_object(
        'status', 'success',
        'wallet', wallet_record,
        'demoMode', wallet_record.is_demo_funded
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Ensure demo wallet
CREATE OR REPLACE FUNCTION ensure_demo_wallet(
    p_user_id UUID,
    p_full_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_username TEXT DEFAULT NULL,
    p_account_type TEXT DEFAULT 'personal'
)
RETURNS JSON AS $$
DECLARE
    wallet_record RECORD;
    profile_record RECORD;
    created_now BOOLEAN := FALSE;
    funded_now BOOLEAN := FALSE;
BEGIN
    -- Create profile if not exists
    SELECT * INTO profile_record FROM profiles WHERE user_id = p_user_id;
    
    IF profile_record IS NULL THEN
        INSERT INTO profiles (user_id, email, full_name, username, account_type, is_verified)
        VALUES (p_user_id, COALESCE(p_email, p_user_id || '@demo.com'), COALESCE(p_full_name, 'Demo User'), p_username, p_account_type, false)
        RETURNING * INTO profile_record;
        created_now := TRUE;
    END IF;
    
    -- Create wallet if not exists
    SELECT * INTO wallet_record FROM wallets WHERE user_id = p_user_id;
    
    IF wallet_record IS NULL THEN
        INSERT INTO wallets (user_id, wallet_name, balance, currency, is_active, is_demo_funded)
        VALUES (p_user_id, 'InstantAid Wallet', 10000.00, 'KES', true, true)
        RETURNING * INTO wallet_record;
        created_now := TRUE;
        funded_now := TRUE;
    ELSIF NOT wallet_record.is_demo_funded THEN
        UPDATE wallets SET balance = balance + 10000.00, is_demo_funded = true WHERE id = wallet_record.id;
        funded_now := TRUE;
    END IF;
    
    -- Add user role if not exists
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id) THEN
        INSERT INTO user_roles (user_id, role) VALUES (p_user_id, 'user');
    END IF;
    
    RETURN json_build_object(
        'status', 'success',
        'wallet', wallet_record,
        'fundedNow', funded_now,
        'createdNow', created_now,
        'demoMode', true
    );
END;
$$ LANGUAGE plpgsql;

-- Process deposit
CREATE OR REPLACE FUNCTION process_deposit(
    p_user_id UUID,
    p_amount DECIMAL,
    p_description TEXT DEFAULT 'Wallet deposit'
)
RETURNS JSON AS $$
DECLARE
    wallet_record RECORD;
    transaction_ref TEXT;
    transaction_id UUID;
BEGIN
    -- Get wallet
    SELECT * INTO wallet_record FROM wallets WHERE user_id = p_user_id;
    
    IF wallet_record IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Wallet not found');
    END IF;
    
    -- Update wallet balance
    UPDATE wallets SET balance = balance + p_amount WHERE id = wallet_record.id;
    
    -- Create transaction
    transaction_ref := generate_tx_reference();
    INSERT INTO transactions (user_id, wallet_id, type, amount, status, description, reference)
    VALUES (p_user_id, wallet_record.id, 'deposit', p_amount, 'completed', p_description, transaction_ref)
    RETURNING id INTO transaction_id;
    
    RETURN json_build_object(
        'status', 'success',
        'ref', transaction_ref,
        'newBalance', wallet_record.balance + p_amount,
        'walletId', wallet_record.id
    );
END;
$$ LANGUAGE plpgsql;

-- Process withdrawal
CREATE OR REPLACE FUNCTION process_withdrawal(
    p_user_id UUID,
    p_amount DECIMAL,
    p_phone_number TEXT DEFAULT NULL,
    p_description TEXT DEFAULT 'Wallet withdrawal'
)
RETURNS JSON AS $$
DECLARE
    wallet_record RECORD;
    transaction_ref TEXT;
    transaction_id UUID;
BEGIN
    -- Get wallet
    SELECT * INTO wallet_record FROM wallets WHERE user_id = p_user_id;
    
    IF wallet_record IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Wallet not found');
    END IF;
    
    IF wallet_record.balance < p_amount THEN
        RETURN json_build_object('status', 'error', 'message', 'Insufficient balance');
    END IF;
    
    -- Update wallet balance
    UPDATE wallets SET balance = balance - p_amount WHERE id = wallet_record.id;
    
    -- Create transaction
    transaction_ref := generate_tx_reference();
    INSERT INTO transactions (user_id, wallet_id, type, amount, status, description, reference, phone_number)
    VALUES (p_user_id, wallet_record.id, 'withdrawal', p_amount, 'completed', p_description, transaction_ref, p_phone_number)
    RETURNING id INTO transaction_id;
    
    RETURN json_build_object(
        'status', 'success',
        'ref', transaction_ref,
        'newBalance', wallet_record.balance - p_amount,
        'walletId', wallet_record.id
    );
END;
$$ LANGUAGE plpgsql;

-- Process wallet transfer
CREATE OR REPLACE FUNCTION process_wallet_transfer(
    p_sender_user_id UUID,
    p_receiver_wallet_id UUID,
    p_amount DECIMAL
)
RETURNS JSON AS $$
DECLARE
    sender_wallet RECORD;
    receiver_wallet RECORD;
    sender_profile RECORD;
    receiver_profile RECORD;
    transaction_ref TEXT;
    transaction_id UUID;
    sender_name TEXT;
    receiver_name TEXT;
BEGIN
    -- Get sender wallet
    SELECT * INTO sender_wallet FROM wallets WHERE user_id = p_sender_user_id;
    
    IF sender_wallet IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Sender wallet not found');
    END IF;
    
    IF sender_wallet.balance < p_amount THEN
        RETURN json_build_object('status', 'error', 'message', 'Insufficient balance');
    END IF;
    
    -- Get receiver wallet
    SELECT * INTO receiver_wallet FROM wallets WHERE id = p_receiver_wallet_id;
    
    IF receiver_wallet IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Receiver wallet not found');
    END IF;
    
    -- Get user profiles for names
    SELECT full_name INTO sender_name FROM profiles WHERE user_id = p_sender_user_id;
    SELECT full_name INTO receiver_name FROM profiles WHERE user_id = receiver_wallet.user_id;
    
    -- Update balances
    UPDATE wallets SET balance = balance - p_amount WHERE id = sender_wallet.id;
    UPDATE wallets SET balance = balance + p_amount WHERE id = receiver_wallet.id;
    
    -- Create transaction
    transaction_ref := generate_tx_reference();
    INSERT INTO transactions (user_id, sender_wallet_id, receiver_wallet_id, type, amount, status, description, reference)
    VALUES (p_sender_user_id, sender_wallet.id, receiver_wallet.id, 'wallet_transfer', p_amount, 'completed', 
            'Transfer to ' || COALESCE(receiver_name, 'Unknown User'), transaction_ref)
    RETURNING id INTO transaction_id;
    
    -- Create transaction for receiver
    INSERT INTO transactions (user_id, sender_wallet_id, receiver_wallet_id, type, amount, status, description, reference)
    VALUES (receiver_wallet.user_id, sender_wallet.id, receiver_wallet.id, 'wallet_transfer', p_amount, 'completed', 
            'Received from ' || COALESCE(sender_name, 'Unknown User'), transaction_ref);
    
    RETURN json_build_object(
        'status', 'success',
        'ref', transaction_ref,
        'newBalance', sender_wallet.balance - p_amount,
        'receiverBalance', receiver_wallet.balance + p_amount
    );
END;
$$ LANGUAGE plpgsql;

-- Process M-Pesa transaction
CREATE OR REPLACE FUNCTION process_mpesa_transaction(
    p_user_id UUID,
    p_amount DECIMAL,
    p_type TEXT,
    p_phone_number TEXT DEFAULT NULL,
    p_paybill_number TEXT DEFAULT NULL,
    p_account_number TEXT DEFAULT NULL,
    p_till_number TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    wallet_record RECORD;
    transaction_ref TEXT;
    transaction_id UUID;
    mpesa_receipt TEXT;
    description TEXT;
BEGIN
    -- Validate transaction type
    IF p_type NOT IN ('mpesa_paybill', 'mpesa_send_money', 'mpesa_buy_goods') THEN
        RETURN json_build_object('status', 'error', 'message', 'Invalid M-Pesa transaction type');
    END IF;
    
    -- Get wallet
    SELECT * INTO wallet_record FROM wallets WHERE user_id = p_user_id;
    
    IF wallet_record IS NULL THEN
        RETURN json_build_object('status', 'error', 'message', 'Wallet not found');
    END IF;
    
    IF wallet_record.balance < p_amount THEN
        RETURN json_build_object('status', 'error', 'message', 'Insufficient balance');
    END IF;
    
    -- Generate M-Pesa receipt
    mpesa_receipt := 'MJ' || to_char(now(), 'YYMMDD') || lpad(floor(random() * 1000000)::text, 6, '0');
    
    -- Create description based on type
    CASE p_type
        WHEN 'mpesa_paybill' THEN
            description := 'Paybill to ' || p_paybill_number || ' Account: ' || p_account_number;
        WHEN 'mpesa_send_money' THEN
            description := 'Send money to ' || p_phone_number;
        WHEN 'mpesa_buy_goods' THEN
            description := 'Buy goods from Till: ' || p_till_number;
    END CASE;
    
    -- Update wallet balance
    UPDATE wallets SET balance = balance - p_amount WHERE id = wallet_record.id;
    
    -- Create transaction
    transaction_ref := generate_tx_reference();
    INSERT INTO transactions (
        user_id, wallet_id, type, amount, status, description, reference, 
        phone_number, paybill_number, account_number, till_number, mpesa_receipt
    ) VALUES (
        p_user_id, wallet_record.id, p_type, p_amount, 'completed', description, transaction_ref,
        p_phone_number, p_paybill_number, p_account_number, p_till_number, mpesa_receipt
    ) RETURNING id INTO transaction_id;
    
    RETURN json_build_object(
        'status', 'success',
        'refId', transaction_ref,
        'newBalance', wallet_record.balance - p_amount,
        'mpesaReceipt', mpesa_receipt
    );
END;
$$ LANGUAGE plpgsql;
