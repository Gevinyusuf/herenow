-- Create waiting_list table for storing email addresses
CREATE TABLE IF NOT EXISTS public.waiting_list (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON public.waiting_list(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert emails (for waiting list)
CREATE POLICY "Anyone can insert to waiting_list" ON public.waiting_list
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy to allow anyone to check if email exists
CREATE POLICY "Anyone can view waiting_list" ON public.waiting_list
  FOR SELECT
  TO public
  USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON TABLE public.waiting_list TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.waiting_list_id_seq TO anon;
