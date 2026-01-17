-- Create storage bucket for habit photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('habit-photos', 'habit-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for habit-photos bucket

-- Allow authenticated users to upload photos to their own folder
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'habit-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'habit-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'habit-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (photos are public)
CREATE POLICY "Anyone can view habit photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'habit-photos');
