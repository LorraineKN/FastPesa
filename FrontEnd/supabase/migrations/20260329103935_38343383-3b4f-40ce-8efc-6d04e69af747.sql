
-- Allow anyone to look up a profile's email by username (for login)
CREATE POLICY "Anyone can lookup profile by username"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Drop the old restrictive select policies that conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
