
DROP POLICY IF EXISTS "Authenticated update publisher documents" ON public.publisher_documents;
DROP POLICY IF EXISTS "Authenticated delete publisher documents" ON public.publisher_documents;

CREATE POLICY "AMs and management update publisher documents"
  ON public.publisher_documents FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'affiliate_manager'::app_role) OR has_role(auth.uid(), 'management'::app_role))
  WITH CHECK (has_role(auth.uid(), 'affiliate_manager'::app_role) OR has_role(auth.uid(), 'management'::app_role));

CREATE POLICY "AMs and management delete publisher documents"
  ON public.publisher_documents FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'affiliate_manager'::app_role) OR has_role(auth.uid(), 'management'::app_role));
