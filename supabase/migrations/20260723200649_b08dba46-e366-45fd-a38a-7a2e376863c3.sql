
CREATE TABLE public.publisher_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id uuid NOT NULL REFERENCES public.publishers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other',
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.publisher_documents TO authenticated;
GRANT ALL ON public.publisher_documents TO service_role;

ALTER TABLE public.publisher_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read publisher documents"
  ON public.publisher_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert publisher documents"
  ON public.publisher_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by OR uploaded_by IS NULL);
CREATE POLICY "Authenticated update publisher documents"
  ON public.publisher_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete publisher documents"
  ON public.publisher_documents FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_publisher_documents_updated_at
BEFORE UPDATE ON public.publisher_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_publisher_documents_publisher ON public.publisher_documents(publisher_id);

-- Storage policies for the private bucket
CREATE POLICY "Auth read publisher-documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'publisher-documents');
CREATE POLICY "Auth upload publisher-documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'publisher-documents');
CREATE POLICY "Auth update publisher-documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'publisher-documents');
CREATE POLICY "Auth delete publisher-documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'publisher-documents');
