-- SupplyGraph v1.14 managed seller media is private. The UI continues to use
-- verified official source URLs; this bucket is immutable operational evidence.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('seller-product-assets','seller-product-assets',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- No public, anon or authenticated object policies are created intentionally.
