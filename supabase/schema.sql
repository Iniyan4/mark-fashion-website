-- Run in Supabase SQL Editor. Requires Supabase Auth (email/password).
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'customer' check (role in ('customer','admin')),
 created_at timestamptz not null default now()
);
create or replace function public.create_user_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id,role) values(new.id,'customer') on conflict(id) do nothing;return new;end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_user_profile();
insert into public.profiles(id,role) select id,'customer' from auth.users on conflict(id) do nothing;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 category text not null,
 description text not null default '',
 image_url text not null default '',
 price_from numeric(12,2) check(price_from is null or price_from>=0),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.inquiries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 contact_name text not null,
 phone text not null,
 organization text not null default '',
 delivery_location text not null default '',
 notes text not null default '',
 artwork_path text,
 items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items)>0),
 status text not null default 'new' check(status in ('new','reviewing','quoted','completed','cancelled')),
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.inquiries enable row level security;
create policy "read own profile or admin" on public.profiles for select to authenticated using(id=(select auth.uid()) or public.is_admin());
create policy "public sees active products" on public.products for select to anon,authenticated using(active or public.is_admin());
create policy "admins insert products" on public.products for insert to authenticated with check(public.is_admin());
create policy "admins update products" on public.products for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins delete products" on public.products for delete to authenticated using(public.is_admin());
create policy "customers create own inquiries" on public.inquiries for insert to authenticated with check(user_id=(select auth.uid()) and status='new');
create policy "customers read own inquiries or admin all" on public.inquiries for select to authenticated using(user_id=(select auth.uid()) or public.is_admin());
create policy "admins update inquiries" on public.inquiries for update to authenticated using(public.is_admin()) with check(public.is_admin());
insert into public.products(name,category,description,image_url,price_from) values
('Corporate / Store Tee','T-Shirts','Crew-neck branded apparel for teams, stores and events.','/products/corporate.webp',null),
('Branded Polo','Polos','Classic polo collar, button placket and contrast finishing.','/products/branded-polo.webp',null),
('Technical Polo','Polos','Technical polo with graphic treatment and sleeve details.','/products/technical-polo.webp',null),
('Retail / Fashion Polo','Polos','Clean, polished polo construction for branded collections.','/products/fashion-polo.webp',null),
('Football Jersey','Jerseys','Football-style jersey with club and sponsor placement.','/products/football-jersey.webp',null),
('White Sports Jersey','Jerseys','Clean white sports silhouette with club detailing.','/products/white-jersey.webp',null),
('Branded Jersey','Jerseys','Bold contrast custom teamwear for organizations.','/products/branded-jersey.webp',null),
('Custom Front Graphic','Custom Printing','Large-format front graphics for campaigns and teams.','/products/front-print.webp',null),
('Custom Back Branding','Custom Printing','Custom back graphics, logos and sponsor layouts.','/products/back-print.webp',null);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('product-images','product-images',true,10485760,array['image/png','image/jpeg','image/webp','image/gif']),
('artwork','artwork',false,10485760,array['image/png','image/jpeg','image/webp','image/svg+xml','application/pdf'])
on conflict(id) do nothing;
create policy "anyone can view product images" on storage.objects for select to anon,authenticated using(bucket_id='product-images');
create policy "admin can upload product images" on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_admin());
create policy "customer can upload own artwork" on storage.objects for insert to authenticated with check(bucket_id='artwork' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "customer can view own artwork and admin all" on storage.objects for select to authenticated using(bucket_id='artwork' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()));
-- To grant admin to an existing, trusted user, run manually in SQL Editor:
-- update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR-ADMIN-EMAIL');
-- Do not put service_role keys or admin credentials in client-side environment variables.
