-- Add UPDATE policy for habit_shares so users can update their own shares

CREATE POLICY "Users can update their own habit shares"
  ON habit_shares FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM habits WHERE habits.id = habit_shares.habit_id AND habits.user_id = auth.uid()
    )
  );
