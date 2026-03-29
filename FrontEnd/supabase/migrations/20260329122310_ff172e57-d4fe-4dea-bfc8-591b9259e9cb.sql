ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS is_demo_funded boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_user_unique
ON public.wallets (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_unique
ON public.profiles (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
ON public.profiles (lower(username))
WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_user_created_at
ON public.transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
ON public.notifications (user_id, created_at DESC);

DROP POLICY IF EXISTS "Authenticated users can update wallets for transfers" ON public.wallets;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON public.transactions;

CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.format_kes(p_amount numeric)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 'Ksh' || to_char(COALESCE(p_amount, 0), 'FM999999999999990D00');
$$;

CREATE OR REPLACE FUNCTION public.format_demo_timestamp(p_timestamp timestamptz)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT trim(to_char(p_timestamp AT TIME ZONE 'Africa/Nairobi', 'FMDD/FMMM/YY "at" FMHH12:MI AM'));
$$;

CREATE OR REPLACE FUNCTION public.generate_tx_reference()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  chars text := '0123456789ABCDEF';
  candidate text;
  is_unique boolean := false;
BEGIN
  WHILE NOT is_unique LOOP
    candidate := 'TX-';
    FOR i IN 1..10 LOOP
      candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    SELECT NOT EXISTS (
      SELECT 1
      FROM public.transactions
      WHERE reference = candidate
      LIMIT 1
    ) INTO is_unique;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_demo_wallet(
  p_user_id uuid,
  p_full_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_username text DEFAULT NULL,
  p_account_type public.account_type DEFAULT 'personal'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
  v_email text;
  v_name text;
  v_username text;
  v_created_wallet_id uuid;
  v_created_now boolean := false;
  v_funded_now boolean := false;
BEGIN
  v_name := COALESCE(NULLIF(trim(p_full_name), ''), NULLIF(trim(p_username), ''), 'InstantAid User');
  v_username := lower(regexp_replace(COALESCE(NULLIF(trim(p_username), ''), 'user_' || substr(p_user_id::text, 1, 8)), '[^a-zA-Z0-9_]', '', 'g'));
  v_email := COALESCE(NULLIF(trim(p_email), ''), v_username || '@instantaid.demo');

  INSERT INTO public.profiles (user_id, full_name, email, account_type, username)
  VALUES (p_user_id, v_name, v_email, COALESCE(p_account_type, 'personal'), v_username)
  ON CONFLICT (user_id) DO UPDATE
  SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    email = COALESCE(NULLIF(public.profiles.email, ''), EXCLUDED.email),
    username = COALESCE(NULLIF(public.profiles.username, ''), EXCLUDED.username),
    account_type = COALESCE(public.profiles.account_type, EXCLUDED.account_type),
    updated_at = now();

  INSERT INTO public.wallets (user_id, wallet_name, balance, is_demo_funded)
  VALUES (p_user_id, 'Main Wallet', 0, false)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_created_wallet_id;

  IF v_created_wallet_id IS NOT NULL THEN
    v_created_now := true;
    INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
    VALUES (
      'wallet_created',
      'wallet',
      v_created_wallet_id,
      p_user_id,
      jsonb_build_object('wallet_name', 'Main Wallet', 'source', 'ensure_demo_wallet')
    );
  END IF;

  SELECT *
  INTO v_wallet
  FROM public.wallets
  WHERE user_id = p_user_id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet could not be created for user %', p_user_id;
  END IF;

  IF COALESCE(v_wallet.balance, 0) = 0 AND NOT COALESCE(v_wallet.is_demo_funded, false) THEN
    UPDATE public.wallets
    SET
      balance = 10000,
      is_demo_funded = true,
      updated_at = now()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;

    v_funded_now := true;

    INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
    VALUES (
      'demo_funding_applied',
      'wallet',
      v_wallet.id,
      p_user_id,
      jsonb_build_object('amount', 10000, 'source', 'ensure_demo_wallet')
    );
  END IF;

  RETURN jsonb_build_object(
    'wallet', jsonb_build_object(
      'id', v_wallet.id,
      'user_id', v_wallet.user_id,
      'wallet_name', v_wallet.wallet_name,
      'balance', v_wallet.balance,
      'currency', v_wallet.currency,
      'is_active', v_wallet.is_active,
      'is_demo_funded', v_wallet.is_demo_funded,
      'created_at', v_wallet.created_at,
      'updated_at', v_wallet.updated_at
    ),
    'createdNow', v_created_now,
    'fundedNow', v_funded_now,
    'demoMode', true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_deposit(
  p_user_id uuid,
  p_amount numeric,
  p_description text DEFAULT 'Wallet deposit'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
  v_ref text;
  v_timestamp timestamptz := now();
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Amount must be greater than zero');
  END IF;

  PERFORM public.ensure_demo_wallet(p_user_id);

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = p_user_id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Wallet not found');
  END IF;

  v_ref := public.generate_tx_reference();

  UPDATE public.wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.transactions (
    user_id,
    receiver_wallet_id,
    type,
    amount,
    status,
    description,
    reference,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_wallet.id,
    'deposit',
    p_amount,
    'completed',
    COALESCE(NULLIF(trim(p_description), ''), 'Wallet deposit'),
    v_ref,
    v_timestamp,
    v_timestamp
  );

  INSERT INTO public.notifications (user_id, type, title, message, reference, created_at)
  VALUES (
    p_user_id,
    'transaction',
    'Deposit Confirmed',
    v_ref || ' Confirmed. You have deposited ' || public.format_kes(p_amount) || ' into your InstantAid wallet on ' || public.format_demo_timestamp(v_timestamp) || '. New InstantAid balance is ' || public.format_kes(v_wallet.balance) || '.',
    v_ref,
    v_timestamp
  );

  INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'deposit_completed',
    'wallet',
    v_wallet.id,
    p_user_id,
    jsonb_build_object('amount', p_amount, 'reference', v_ref)
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Deposit successful',
    'ref', v_ref,
    'newBalance', v_wallet.balance,
    'walletId', v_wallet.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_user_id uuid,
  p_amount numeric,
  p_phone_number text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
  v_ref text;
  v_timestamp timestamptz := now();
  v_description text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Amount must be greater than zero');
  END IF;

  PERFORM public.ensure_demo_wallet(p_user_id);

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = p_user_id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Wallet not found');
  END IF;

  IF v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Insufficient balance');
  END IF;

  v_ref := public.generate_tx_reference();
  v_description := COALESCE(NULLIF(trim(p_description), ''), CASE WHEN p_phone_number IS NOT NULL THEN 'M-Pesa withdrawal to ' || p_phone_number ELSE 'Wallet withdrawal' END);

  UPDATE public.wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.transactions (
    user_id,
    sender_wallet_id,
    type,
    amount,
    status,
    description,
    reference,
    phone_number,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_wallet.id,
    'withdrawal',
    p_amount,
    'completed',
    v_description,
    v_ref,
    NULLIF(trim(p_phone_number), ''),
    v_timestamp,
    v_timestamp
  );

  INSERT INTO public.notifications (user_id, type, title, message, reference, created_at)
  VALUES (
    p_user_id,
    'transaction',
    'Withdrawal Confirmed',
    v_ref || ' Confirmed. ' || public.format_kes(p_amount) || ' withdrawn from your InstantAid wallet on ' || public.format_demo_timestamp(v_timestamp) || '. New InstantAid balance is ' || public.format_kes(v_wallet.balance) || '. Transaction cost, ' || public.format_kes(0) || '.',
    v_ref,
    v_timestamp
  );

  INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'withdrawal_completed',
    'wallet',
    v_wallet.id,
    p_user_id,
    jsonb_build_object('amount', p_amount, 'reference', v_ref, 'phone_number', p_phone_number)
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Withdrawal successful',
    'ref', v_ref,
    'newBalance', v_wallet.balance,
    'walletId', v_wallet.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_wallet_transfer(
  p_sender_user_id uuid,
  p_receiver_wallet_id uuid,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_wallet public.wallets%ROWTYPE;
  v_receiver_wallet public.wallets%ROWTYPE;
  v_sender_name text;
  v_receiver_name text;
  v_ref text;
  v_timestamp timestamptz := now();
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Amount must be greater than zero');
  END IF;

  PERFORM public.ensure_demo_wallet(p_sender_user_id);

  SELECT * INTO v_sender_wallet
  FROM public.wallets
  WHERE user_id = p_sender_user_id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Sender wallet not found');
  END IF;

  SELECT * INTO v_receiver_wallet
  FROM public.wallets
  WHERE id = p_receiver_wallet_id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Invalid Wallet ID');
  END IF;

  IF v_sender_wallet.id = v_receiver_wallet.id THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Cannot transfer to the same wallet');
  END IF;

  IF v_sender_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Insufficient balance');
  END IF;

  SELECT COALESCE(NULLIF(full_name, ''), NULLIF(username, ''), 'InstantAid User')
  INTO v_sender_name
  FROM public.profiles
  WHERE user_id = p_sender_user_id
  LIMIT 1;

  SELECT COALESCE(NULLIF(full_name, ''), NULLIF(username, ''), 'InstantAid User')
  INTO v_receiver_name
  FROM public.profiles
  WHERE user_id = v_receiver_wallet.user_id
  LIMIT 1;

  v_ref := public.generate_tx_reference();

  UPDATE public.wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE id = v_sender_wallet.id
  RETURNING * INTO v_sender_wallet;

  UPDATE public.wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE id = v_receiver_wallet.id
  RETURNING * INTO v_receiver_wallet;

  INSERT INTO public.transactions (
    user_id,
    sender_wallet_id,
    receiver_wallet_id,
    type,
    amount,
    status,
    description,
    reference,
    created_at,
    updated_at
  ) VALUES
  (
    p_sender_user_id,
    v_sender_wallet.id,
    v_receiver_wallet.id,
    'wallet_transfer',
    p_amount,
    'completed',
    'Transfer to ' || upper(v_receiver_name),
    v_ref,
    v_timestamp,
    v_timestamp
  ),
  (
    v_receiver_wallet.user_id,
    v_sender_wallet.id,
    v_receiver_wallet.id,
    'wallet_transfer',
    p_amount,
    'completed',
    'Received from ' || upper(v_sender_name),
    v_ref,
    v_timestamp,
    v_timestamp
  );

  INSERT INTO public.notifications (user_id, type, title, message, reference, created_at)
  VALUES
  (
    p_sender_user_id,
    'transaction',
    'Transfer Sent',
    v_ref || ' Confirmed. ' || public.format_kes(p_amount) || ' sent to ' || upper(v_receiver_name) || ' on ' || public.format_demo_timestamp(v_timestamp) || '. New InstantAid balance is ' || public.format_kes(v_sender_wallet.balance) || '. Transaction cost, ' || public.format_kes(0) || '.',
    v_ref,
    v_timestamp
  ),
  (
    v_receiver_wallet.user_id,
    'transaction',
    'Transfer Received',
    v_ref || ' Confirmed. You have received ' || public.format_kes(p_amount) || ' from ' || upper(v_sender_name) || ' on ' || public.format_demo_timestamp(v_timestamp) || '. New InstantAid balance is ' || public.format_kes(v_receiver_wallet.balance) || '.',
    v_ref,
    v_timestamp
  );

  INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'transfer_completed',
    'wallet',
    v_sender_wallet.id,
    p_sender_user_id,
    jsonb_build_object(
      'amount', p_amount,
      'reference', v_ref,
      'receiver_wallet_id', v_receiver_wallet.id,
      'receiver_user_id', v_receiver_wallet.user_id
    )
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Transfer successful',
    'ref', v_ref,
    'newBalance', v_sender_wallet.balance,
    'receiverBalance', v_receiver_wallet.balance,
    'receiverWalletId', v_receiver_wallet.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_mpesa_transaction(
  p_user_id uuid,
  p_amount numeric,
  p_type public.transaction_type,
  p_phone_number text DEFAULT NULL,
  p_paybill_number text DEFAULT NULL,
  p_account_number text DEFAULT NULL,
  p_till_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
  v_ref text;
  v_timestamp timestamptz := now();
  v_description text;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Amount must be greater than zero');
  END IF;

  IF p_type NOT IN ('mpesa_paybill', 'mpesa_send_money', 'mpesa_buy_goods') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Unsupported M-Pesa transaction type');
  END IF;

  PERFORM public.ensure_demo_wallet(p_user_id);

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = p_user_id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Wallet not found');
  END IF;

  IF v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Insufficient balance');
  END IF;

  v_ref := public.generate_tx_reference();
  v_description := CASE
    WHEN p_type = 'mpesa_paybill' THEN 'Paybill to ' || COALESCE(NULLIF(trim(p_paybill_number), ''), 'Unknown Paybill') || ' A/C ' || COALESCE(NULLIF(trim(p_account_number), ''), 'N/A')
    WHEN p_type = 'mpesa_send_money' THEN 'M-Pesa send money to ' || COALESCE(NULLIF(trim(p_phone_number), ''), 'recipient number')
    ELSE 'Buy goods via Till ' || COALESCE(NULLIF(trim(p_till_number), ''), 'Unknown Till')
  END;

  UPDATE public.wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.transactions (
    user_id,
    sender_wallet_id,
    type,
    amount,
    status,
    description,
    reference,
    phone_number,
    paybill_number,
    account_number,
    till_number,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_wallet.id,
    p_type,
    p_amount,
    'completed',
    v_description,
    v_ref,
    NULLIF(trim(p_phone_number), ''),
    NULLIF(trim(p_paybill_number), ''),
    NULLIF(trim(p_account_number), ''),
    NULLIF(trim(p_till_number), ''),
    v_timestamp,
    v_timestamp
  );

  INSERT INTO public.notifications (user_id, type, title, message, reference, created_at)
  VALUES (
    p_user_id,
    'transaction',
    'M-Pesa Transaction Confirmed',
    v_ref || ' Confirmed. ' || public.format_kes(p_amount) || ' processed via ' || replace(initcap(replace(p_type::text, '_', ' ')), 'Mpesa', 'M-Pesa') || ' on ' || public.format_demo_timestamp(v_timestamp) || '. New InstantAid balance is ' || public.format_kes(v_wallet.balance) || '. Transaction cost, ' || public.format_kes(0) || '.',
    v_ref,
    v_timestamp
  );

  INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'mpesa_transaction_completed',
    'wallet',
    v_wallet.id,
    p_user_id,
    jsonb_build_object(
      'amount', p_amount,
      'reference', v_ref,
      'type', p_type,
      'phone_number', p_phone_number,
      'paybill_number', p_paybill_number,
      'account_number', p_account_number,
      'till_number', p_till_number
    )
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'M-Pesa transaction successful',
    'ref', v_ref,
    'newBalance', v_wallet.balance,
    'type', p_type
  );
END;
$$;

DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END;
$$;