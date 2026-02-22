
-- Table to store app settings like report email
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access app_settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default
INSERT INTO public.app_settings (key, value) VALUES ('weekly_report_email', '');
INSERT INTO public.app_settings (key, value) VALUES ('weekly_report_enabled', 'false');
