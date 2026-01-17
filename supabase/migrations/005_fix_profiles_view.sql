-- Simpler profiles policy - allow all authenticated users to view basic profile info
-- This is safe since profiles only contain display_name, username, avatar_url

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Allow all authenticated users to view profiles
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Keep the existing insert/update policies (users can only modify their own)
