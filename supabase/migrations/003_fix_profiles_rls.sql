-- Fix profiles RLS policies for partnerships

-- Drop existing select policy
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Allow users to view their own profile AND profiles of users they have partnerships with
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM partnerships p
      WHERE p.status = 'active'
      AND (
        (p.requester_id = auth.uid() AND p.partner_id = profiles.id)
        OR
        (p.partner_id = auth.uid() AND p.requester_id = profiles.id)
      )
    )
    OR
    -- Also allow viewing profiles for pending partnership requests (to show who invited you)
    EXISTS (
      SELECT 1 FROM partnerships p
      WHERE p.status = 'pending'
      AND (
        (p.requester_id = profiles.id AND p.partner_id = auth.uid())
        OR
        (p.partner_id = profiles.id AND p.requester_id = auth.uid())
      )
    )
  );

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name'),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Manually create profiles for any existing auth users that don't have one
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
