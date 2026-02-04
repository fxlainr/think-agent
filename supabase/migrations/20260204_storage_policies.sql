-- ===========================================
-- Migration: Storage policies for solutions bucket
-- Date: 2026-02-04
-- ===========================================

-- Politique: Les utilisateurs authentifiés peuvent uploader dans leur dossier
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'solutions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Les utilisateurs peuvent voir leurs propres fichiers
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'solutions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'solutions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: Pour le MVP sans auth Supabase, on utilise des signed URLs
-- Les policies ci-dessus sont pour une future intégration auth
