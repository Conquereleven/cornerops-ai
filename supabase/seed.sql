insert into public.customers (
  id, external_user_id, name, email, whatsapp, preferred_language
) values
  ('10000000-0000-4000-8000-000000000001', '1', 'Rodrigo Morales', 'rodrigo@example.com', '+971500000001', 'es'),
  ('10000000-0000-4000-8000-000000000002', '2', 'Aisha Khan', 'aisha@example.com', '+971500000002', 'en'),
  ('10000000-0000-4000-8000-000000000003', '3', 'Omar Haddad', 'omar@example.com', '+971500000003', 'en'),
  ('10000000-0000-4000-8000-000000000004', '4', 'Mariana López', 'mariana@example.com', '+971500000004', 'es')
on conflict (external_user_id) do update set
  name = excluded.name,
  email = excluded.email,
  whatsapp = excluded.whatsapp,
  preferred_language = excluded.preferred_language;

insert into public.products (
  sku, name, category, available, price_aed, stock, description, languages,
  b2b_available, keywords, active
) values
  ('TAJIN-142G', 'Tajín Clásico 142g', 'Condiments', true, 12, 40, 'Mexican chili-lime seasoning for fruit, snacks, and drinks.', array['es','en'], true, array['tajin','seasoning'], true),
  ('VAL-370ML', 'Valentina Salsa Picante 370ml', 'Hot Sauces', true, 14, 22, 'Classic Mexican hot sauce with balanced heat and acidity.', array['es','en'], true, array['valentina','hot sauce'], true),
  ('PULP-20PK', 'Pulparindo', 'Mexican Candy', true, 24, 18, 'Sweet, salty, and spicy tamarind candy.', array['es','en'], true, array['pulparindo','tamarindo'], true),
  ('CHILE-GUAJ-250', 'Chile Guajillo Seco', 'Dried Chiles', true, 19, 15, 'Dried guajillo peppers for marinades, sauces, and adobos.', array['es','en'], true, array['chiles secos','guajillo'], true),
  ('CHILE-ANCHO-250', 'Chile Ancho Seco', 'Dried Chiles', true, 21, 17, 'Dried ancho chile with mild heat and deep flavor.', array['es','en'], true, array['chiles secos','ancho'], true),
  ('CHILE-PASILLA-250', 'Chile Pasilla Seco', 'Dried Chiles', true, 22, 13, 'Dried pasilla chile for moles, sauces, and stews.', array['es','en'], true, array['chiles secos','pasilla'], true),
  ('SALSA-MEX-MIX', 'Salsas mexicanas', 'Mexican Sauces', true, 28, 34, 'Selection of authentic Mexican sauces.', array['es','en'], true, array['salsa','tomatillo'], true),
  ('DULCE-MIX-500', 'Dulces mexicanos', 'Mexican Candy', true, 35, 11, 'Assorted Mexican sweets for sharing and gifting.', array['es','en'], true, array['dulces','candy'], true),
  ('MAIZ-MIX', 'Productos de maíz', 'Corn Products', true, 18, 52, 'Corn tortillas and pantry products for Mexican cuisine.', array['es','en'], true, array['maiz','tortillas'], true),
  ('PINATA-MED-01', 'Piñata mexicana mediana', 'Party', true, 75, 8, 'Traditional Mexican party piñata in assorted designs.', array['es','en'], true, array['pinata','piñata','fiesta'], true),
  ('TOMATILLO-400G', 'Tomatillo mexicano 400g', 'Mexican Ingredients', true, 17, 26, 'Tomatillos for salsa verde and Mexican recipes.', array['es','en'], true, array['tomatillo','salsa verde'], true),
  ('CHAMOY-1L', 'Chamoy mexicano 1L', 'Condiments', true, 28, 30, 'Sweet, sour, and spicy chamoy sauce.', array['es','en'], true, array['chamoy','salsa'], true)
on conflict (sku) do update set
  name = excluded.name,
  category = excluded.category,
  available = excluded.available,
  price_aed = excluded.price_aed,
  stock = excluded.stock,
  description = excluded.description,
  languages = excluded.languages,
  b2b_available = excluded.b2b_available,
  keywords = excluded.keywords,
  active = excluded.active;

insert into public.orders (
  id, order_number, user_id, customer_name, status, payment_status,
  delivery_status, estimated_delivery, created_at
) values
  ('20000000-0000-4000-8000-000000000123', '123', '1', 'Rodrigo Morales', 'preparing', 'paid', 'pending_pickup', '2026-06-18', '2026-06-13T10:00:00Z'),
  ('20000000-0000-4000-8000-000000000119', '119', '2', 'Aisha Khan', 'shipped', 'paid', 'in_transit', '2026-06-16', '2026-06-11T08:30:00Z'),
  ('20000000-0000-4000-8000-000000000117', '117', '3', 'Omar Haddad', 'confirmed', 'pending', 'not_scheduled', '2026-06-20', '2026-06-12T15:10:00Z'),
  ('20000000-0000-4000-8000-000000000110', '110', '1', 'Rodrigo Morales', 'delivered', 'paid', 'delivered', '2026-06-10', '2026-06-07T12:00:00Z'),
  ('20000000-0000-4000-8000-000000000104', '104', '4', 'Mariana López', 'cancelled', 'refunded', 'cancelled', null, '2026-06-05T09:45:00Z')
on conflict (order_number) do update set
  user_id = excluded.user_id,
  customer_name = excluded.customer_name,
  status = excluded.status,
  payment_status = excluded.payment_status,
  delivery_status = excluded.delivery_status,
  estimated_delivery = excluded.estimated_delivery;

insert into public.order_items (order_id, sku, name, quantity, price_aed)
select id, 'TAJIN-142G', 'Tajín Clásico 142g', 2, 12 from public.orders where order_number = '123'
on conflict (order_id, sku) do update set quantity = excluded.quantity, price_aed = excluded.price_aed;

insert into public.order_items (order_id, sku, name, quantity, price_aed)
select id, 'VAL-370ML', 'Valentina Salsa Picante 370ml', 6, 14 from public.orders where order_number = '119'
on conflict (order_id, sku) do update set quantity = excluded.quantity, price_aed = excluded.price_aed;

insert into public.order_items (order_id, sku, name, quantity, price_aed)
select id, 'PULP-20PK', 'Pulparindo', 3, 24 from public.orders where order_number = '117'
on conflict (order_id, sku) do update set quantity = excluded.quantity, price_aed = excluded.price_aed;

insert into public.order_items (order_id, sku, name, quantity, price_aed)
select id, 'MAIZ-MIX', 'Productos de maíz', 4, 18 from public.orders where order_number = '110'
on conflict (order_id, sku) do update set quantity = excluded.quantity, price_aed = excluded.price_aed;

insert into public.order_items (order_id, sku, name, quantity, price_aed)
select id, 'CHILE-GUAJ-250', 'Chile Guajillo Seco', 2, 19 from public.orders where order_number = '104'
on conflict (order_id, sku) do update set quantity = excluded.quantity, price_aed = excluded.price_aed;
