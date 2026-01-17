-- Nudges table for partner reminders
CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partnership_id UUID NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  message TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

-- Users can view nudges they sent or received
CREATE POLICY "Users can view their nudges"
  ON nudges FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can send nudges to their partners
CREATE POLICY "Users can send nudges"
  ON nudges FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id
    AND EXISTS (
      SELECT 1 FROM partnerships
      WHERE partnerships.id = nudges.partnership_id
      AND partnerships.status = 'active'
      AND (
        (partnerships.requester_id = auth.uid() AND partnerships.partner_id = nudges.to_user_id)
        OR (partnerships.partner_id = auth.uid() AND partnerships.requester_id = nudges.to_user_id)
      )
    )
  );

-- Users can update (mark as read) nudges they received
CREATE POLICY "Users can mark nudges as read"
  ON nudges FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Index for quick lookups
CREATE INDEX idx_nudges_to_user ON nudges(to_user_id, read_at);
CREATE INDEX idx_nudges_created ON nudges(created_at DESC);
