
-- Fix RLS: Allow authenticated users to update any wallet (needed for transfers)
CREATE POLICY "Authenticated users can update wallets for transfers"
ON public.wallets FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix RLS: Allow authenticated users to insert notifications for any user (transfer notifications)
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix RLS: Allow authenticated users to insert transactions for any user (receiver records)
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
CREATE POLICY "Authenticated users can create transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
