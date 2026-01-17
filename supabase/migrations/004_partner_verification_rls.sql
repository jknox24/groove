-- Add RLS policies for partner verification

-- Allow partners to view habit entries for shared habits
CREATE POLICY "Partners can view shared habit entries"
  ON habit_entries FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM habit_shares hs
      JOIN partnerships p ON hs.partnership_id = p.id
      WHERE hs.habit_id = habit_entries.habit_id
      AND p.status = 'active'
      AND (
        (p.requester_id = auth.uid() AND p.partner_id = habit_entries.user_id)
        OR
        (p.partner_id = auth.uid() AND p.requester_id = habit_entries.user_id)
      )
    )
  );

-- Drop existing select policy if it only allows own entries
DROP POLICY IF EXISTS "Users can view their own entries" ON habit_entries;

-- Allow partners to update verification fields on shared habit entries
CREATE POLICY "Partners can verify shared habit entries"
  ON habit_entries FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM habit_shares hs
      JOIN partnerships p ON hs.partnership_id = p.id
      WHERE hs.habit_id = habit_entries.habit_id
      AND hs.can_verify = true
      AND p.status = 'active'
      AND (
        (p.requester_id = auth.uid() AND p.partner_id = habit_entries.user_id)
        OR
        (p.partner_id = auth.uid() AND p.requester_id = habit_entries.user_id)
      )
    )
  );

-- Drop existing update policy if it only allows own entries
DROP POLICY IF EXISTS "Users can update their own entries" ON habit_entries;

-- Allow partners to view shared habits
CREATE POLICY "Partners can view shared habits"
  ON habits FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM habit_shares hs
      JOIN partnerships p ON hs.partnership_id = p.id
      WHERE hs.habit_id = habits.id
      AND p.status = 'active'
      AND (
        (p.requester_id = auth.uid() AND p.partner_id = habits.user_id)
        OR
        (p.partner_id = auth.uid() AND p.requester_id = habits.user_id)
      )
    )
  );

-- Drop existing select policy for habits
DROP POLICY IF EXISTS "Users can view their own habits" ON habits;
