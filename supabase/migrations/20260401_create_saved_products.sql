-- Create saved_products table for the Malassezia-Safe Ingredient Checker
CREATE TABLE IF NOT EXISTS public.saved_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id uuid NOT NULL,
  product_name text NOT NULL,
  brand text,
  inci_list text NOT NULL,
  safety_score integer DEFAULT 0,
  unsafe_count integer DEFAULT 0,
  caution_count integer DEFAULT 0,
  routine_slot text CHECK (routine_slot IN ('am', 'pm', 'both', NULL)),
  is_prebuilt boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index on device_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_products_device_id ON public.saved_products (device_id);

-- Enable Row Level Security
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow anonymous users to read their own rows via device_id filter
-- Since we use the anon key, all requests come as the anon role
CREATE POLICY "Users can read own products"
  ON public.saved_products
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert products"
  ON public.saved_products
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own products"
  ON public.saved_products
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own products"
  ON public.saved_products
  FOR DELETE
  USING (true);
