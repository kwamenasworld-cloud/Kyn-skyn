-- Product catalog managed via Supabase dashboard
-- Add/edit/remove products without code changes

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug varchar(50) unique not null,
  name text not null,
  price decimal(10,2) not null,
  addon_price decimal(10,2),
  description text,
  details text,
  category text not null check (category in ('serum','cleanser','moisturizer','spf','treatment','body','bundle')),
  image_url text,
  media_type text not null default 'image' check (media_type in ('image','3d-model','spline','video')),
  is_rx boolean not null default false,
  is_active boolean not null default true,
  available_as_addon boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Anyone can view active products"
  on public.products for select
  using (is_active = true);

-- Seed with Steady Serum
insert into public.products (slug, name, price, addon_price, description, details, category, available_as_addon, sort_order)
values (
  'steady-serum',
  'Steady Serum',
  38.00,
  32.00,
  'MCT oil-based calming serum for Malassezia-prone skin',
  'Formulated with lightweight MCT oil, Steady Serum delivers anti-stress, long-lasting hydration without feeding Malassezia. Unlike coconut, olive, or other common oils that can worsen symptoms, MCT oil is microbiome-safe and skin-soothing.',
  'serum',
  true,
  1
);

-- Create storage bucket for product images
-- Run manually: Go to Supabase Dashboard → Storage → New Bucket → "product-images" → Public
