
-- Create junction table for multiple lawyers per case
CREATE TABLE public.case_lawyers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL DEFAULT 'percentage',
  commission_percentage NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  commission_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(case_id, lawyer_id)
);

-- Enable RLS
ALTER TABLE public.case_lawyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access case_lawyers"
  ON public.case_lawyers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Migrate existing case-lawyer assignments
INSERT INTO public.case_lawyers (case_id, lawyer_id, commission_percentage, commission_amount, commission_paid)
SELECT c.id, c.lawyer_id,
  COALESCE(ls.commission_percentage, 0),
  c.commission_amount,
  c.commission_paid
FROM public.cases c
LEFT JOIN public.legal_services ls ON c.service_id = ls.id
WHERE c.lawyer_id IS NOT NULL;
