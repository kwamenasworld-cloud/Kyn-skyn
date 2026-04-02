-- Create product_ratings table for community votes
CREATE TABLE IF NOT EXISTS public.product_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id uuid NOT NULL,
  product_key text NOT NULL,
  vote text NOT NULL CHECK (vote IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(device_id, product_key)
);

CREATE INDEX IF NOT EXISTS idx_product_ratings_product_key ON public.product_ratings (product_key);

ALTER TABLE public.product_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ratings" ON public.product_ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ratings" ON public.product_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own ratings" ON public.product_ratings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete own ratings" ON public.product_ratings FOR DELETE USING (true);

-- Aggregated view for fast lookups
CREATE OR REPLACE VIEW public.product_rating_counts AS
SELECT
  product_key,
  COUNT(*) FILTER (WHERE vote = 'up') AS upvotes,
  COUNT(*) FILTER (WHERE vote = 'down') AS downvotes,
  COUNT(*) AS total_votes
FROM public.product_ratings
GROUP BY product_key;
