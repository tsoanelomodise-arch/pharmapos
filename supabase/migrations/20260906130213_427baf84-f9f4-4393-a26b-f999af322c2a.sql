BEGIN;

-- Allow authenticated restock/admin/owner users to upload documents
CREATE POLICY "Restock users can upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'restock-documents'
    AND (
      public.has_role(auth.uid(), 'restock')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'owner')
    )
  );

-- Allow authenticated users to view/download documents linked to restock records
CREATE POLICY "Authenticated users can view documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'restock-documents'
  );

-- Only admins/owners can delete documents
CREATE POLICY "Management can delete documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'restock-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'owner')
    )
  );

COMMIT;