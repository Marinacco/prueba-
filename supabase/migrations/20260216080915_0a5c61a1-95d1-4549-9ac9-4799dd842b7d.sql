
ALTER TABLE public.cases ADD COLUMN payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.cases ADD COLUMN priority text NOT NULL DEFAULT 'medium';
