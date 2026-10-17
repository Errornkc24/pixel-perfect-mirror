
create type public.app_role as enum ('owner','staff','customer');
create type public.order_status as enum ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('owner','staff'))
$$;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'owner'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text, last_name text, email text, phone text, instagram text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profile own select" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin(auth.uid()));
create policy "profile own insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profile own update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name',''),' ',1)),
    coalesce(new.raw_user_meta_data->>'last_name', nullif(substr(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name',''), length(split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name',''),' ',1))+2),'')))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  full_name text not null, phone text not null,
  line1 text not null, landmark text, city text not null, state text not null, pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "addr own" on public.addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique, description text, image_url text, sort int not null default 0
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "cat read" on public.categories for select to anon, authenticated using (true);
create policy "cat admin" on public.categories for all to authenticated using (public.has_role(auth.uid(),'owner')) with check (public.has_role(auth.uid(),'owner'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique,
  short_description text, description text,
  scent_notes text[] not null default '{}',
  burn_time text, size text,
  price numeric(10,2) not null check (price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  images text[] not null default '{}',
  stock int not null default 0 check (stock >= 0),
  featured boolean not null default false,
  bestseller boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "prod read" on public.products for select to anon, authenticated using (archived = false or public.is_admin(auth.uid()));
create policy "prod admin" on public.products for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.cart_items (
  user_id uuid not null, product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null check (quantity > 0), updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create policy "cart own" on public.cart_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create sequence public.order_number_seq start 1001;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('TC' || nextval('public.order_number_seq')),
  user_id uuid not null,
  status order_status not null default 'placed',
  subtotal numeric(10,2) not null, shipping numeric(10,2) not null, total numeric(10,2) not null,
  payment_method text not null default 'cod',
  payment_status text not null default 'pending',
  shipping_address jsonb not null,
  contact jsonb not null,
  courier text, tracking_number text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "orders admin update" on public.orders for update to authenticated using (public.is_admin(auth.uid()));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid, name text not null, image text, price numeric(10,2) not null, quantity int not null
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "items read" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin(auth.uid()))));

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status order_status not null, note text, changed_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.order_status_history to authenticated;
grant all on public.order_status_history to service_role;
alter table public.order_status_history enable row level security;
create policy "hist read" on public.order_status_history for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin(auth.uid()))));

create table public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  change int not null, new_stock int not null, reason text not null, note text, changed_by uuid,
  order_id uuid, created_at timestamptz not null default now()
);
grant select on public.stock_adjustments to authenticated;
grant all on public.stock_adjustments to service_role;
alter table public.stock_adjustments enable row level security;
create policy "stock log admin" on public.stock_adjustments for select to authenticated using (public.is_admin(auth.uid()));

-- Place order atomically: validates stock, decrements, writes history
create or replace function public.place_order(_items jsonb, _address jsonb, _contact jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _order_id uuid; _num text;
  _sub numeric := 0; _ship numeric; _it jsonb; _p record; _qty int;
begin
  if _uid is null then raise exception 'Please sign in to place an order'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'Your cart is empty'; end if;
  for _it in select * from jsonb_array_elements(_items) loop
    _qty := (_it->>'quantity')::int;
    if _qty is null or _qty < 1 or _qty > 50 then raise exception 'Invalid quantity'; end if;
    select * into _p from products where id = (_it->>'product_id')::uuid and archived = false for update;
    if not found then raise exception 'A product in your cart is no longer available'; end if;
    if _p.stock < _qty then raise exception 'Only % left of %', _p.stock, _p.name; end if;
    _sub := _sub + _p.price * _qty;
  end loop;
  _ship := case when _sub >= 999 then 0 else 79 end;
  insert into orders (user_id, subtotal, shipping, total, shipping_address, contact)
  values (_uid, _sub, _ship, _sub + _ship, _address, _contact) returning id, order_number into _order_id, _num;
  for _it in select * from jsonb_array_elements(_items) loop
    _qty := (_it->>'quantity')::int;
    select * into _p from products where id = (_it->>'product_id')::uuid;
    insert into order_items (order_id, product_id, name, image, price, quantity)
    values (_order_id, _p.id, _p.name, _p.images[1], _p.price, _qty);
    update products set stock = stock - _qty where id = _p.id;
    insert into stock_adjustments (product_id, change, new_stock, reason, changed_by, order_id)
    values (_p.id, -_qty, _p.stock - _qty, 'sale', _uid, _order_id);
  end loop;
  insert into order_status_history (order_id, status, changed_by) values (_order_id, 'placed', _uid);
  delete from cart_items where user_id = _uid;
  return json_build_object('id', _order_id, 'order_number', _num);
end $$;
revoke all on function public.place_order(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, jsonb) to authenticated;

create or replace function public.cancel_order(_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _o record; _i record; _new int;
begin
  select * into _o from orders where id = _order_id for update;
  if not found or (_o.user_id <> auth.uid() and not public.is_admin(auth.uid())) then raise exception 'Order not found'; end if;
  if _o.user_id = auth.uid() and not public.is_admin(auth.uid()) and _o.status not in ('placed','confirmed') then
    raise exception 'This order is already packed and can no longer be cancelled';
  end if;
  if _o.status = 'cancelled' then return; end if;
  update orders set status = 'cancelled', updated_at = now() where id = _order_id;
  for _i in select * from order_items where order_id = _order_id loop
    if _i.product_id is not null then
      update products set stock = stock + _i.quantity where id = _i.product_id returning stock into _new;
      if found then
        insert into stock_adjustments (product_id, change, new_stock, reason, changed_by, order_id)
        values (_i.product_id, _i.quantity, _new, 'cancellation', auth.uid(), _order_id);
      end if;
    end if;
  end loop;
  insert into order_status_history (order_id, status, changed_by) values (_order_id, 'cancelled', auth.uid());
end $$;
revoke all on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;

insert into public.categories (name, slug, description, image_url, sort) values
('Floral', 'floral', 'Soft blooms and garden petals', '/images/cat-floral.jpg', 1),
('Woody & Warm', 'woody', 'Sandalwood, oud and amber', '/images/cat-woody.jpg', 2),
('Fresh & Calm', 'fresh', 'Clean, airy and soothing', '/images/cat-fresh.jpg', 3),
('Sweet & Cozy', 'sweet', 'Vanilla, caramel and spice', '/images/cat-sweet.jpg', 4);

insert into public.products (name, slug, short_description, description, scent_notes, burn_time, size, price, category_id, images, stock, featured, bestseller, created_at) values
('Lavender Moon', 'lavender-moon', 'Calming lavender with a hush of vanilla', 'Hand-poured soy wax infused with French lavender and a whisper of Madagascar vanilla. Made for slow evenings and deep sleep.', '{Lavender,Vanilla,Chamomile}', '40–45 hours', '200 g', 799, (select id from categories where slug='floral'), '{/images/p-lavender.jpg,/images/p-lavender-2.jpg}', 24, true, true, now() - interval '20 days'),
('Rose & Oud', 'rose-oud', 'Velvet rose wrapped in smoky oud', 'A romantic, luxurious blend of Damask rose and deep oud wood. Our signature evening candle.', '{Damask Rose,Oud,Amber}', '45–50 hours', '220 g', 1199, (select id from categories where slug='woody'), '{/images/p-rose.jpg}', 4, true, true, now() - interval '15 days'),
('Sandalwood Dusk', 'sandalwood-dusk', 'Creamy Mysore sandalwood and cedar', 'Warm, grounding and meditative. Perfect for your puja corner or reading nook.', '{Sandalwood,Cedarwood,Musk}', '40–45 hours', '200 g', 899, (select id from categories where slug='woody'), '{/images/p-sandalwood.jpg}', 18, false, true, now() - interval '12 days'),
('Jasmine Night', 'jasmine-night', 'Night-blooming jasmine and mogra', 'Inspired by mogra garlands on warm summer nights. Heady, floral and nostalgic.', '{Jasmine,Mogra,White Tea}', '35–40 hours', '180 g', 749, (select id from categories where slug='floral'), '{/images/p-jasmine.jpg}', 0, true, false, now() - interval '9 days'),
('Vanilla Ember', 'vanilla-ember', 'Toasted vanilla, caramel and tonka', 'Sweet, cozy and comforting — like a warm dessert by the fireplace.', '{Vanilla Bean,Caramel,Tonka}', '40–45 hours', '200 g', 849, (select id from categories where slug='sweet'), '{/images/p-vanilla.jpg}', 3, true, false, now() - interval '5 days'),
('Eucalyptus Mist', 'eucalyptus-mist', 'Cool eucalyptus with fresh mint', 'Clear your mind and breathe deep. A crisp, spa-like scent for mornings and work-from-home days.', '{Eucalyptus,Spearmint,Sea Salt}', '35–40 hours', '180 g', 699, (select id from categories where slug='fresh'), '{/images/p-eucalyptus.jpg}', 30, false, false, now() - interval '2 days'),
('Cinnamon Chai', 'cinnamon-chai', 'Spiced masala chai in a jar', 'Cardamom, cinnamon and clove simmered with milky sweetness. Monsoon in a candle.', '{Cinnamon,Cardamom,Clove}', '40–45 hours', '200 g', 799, (select id from categories where slug='sweet'), '{/images/p-chai.jpg}', 12, false, true, now() - interval '1 day'),
('Peony Blush', 'peony-blush', 'Airy peony and pink pepper', 'Light, fresh and pretty — a soft bouquet for bedrooms and gifting.', '{Peony,Pink Pepper,Pear}', '35–40 hours', '180 g', 749, (select id from categories where slug='floral'), '{/images/p-peony.jpg}', 9, false, false, now());
