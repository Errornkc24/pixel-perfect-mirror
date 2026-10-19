alter table public.products add column if not exists low_stock_threshold int not null default 5 check (low_stock_threshold >= 0);

create or replace function public.store_has_owner() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'owner')
$$;

create or replace function public.claim_owner() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  perform pg_advisory_xact_lock(4242);
  if exists (select 1 from user_roles where role = 'owner') then return false; end if;
  insert into user_roles (user_id, role) values (auth.uid(), 'owner') on conflict do nothing;
  return true;
end $$;

create or replace function public.admin_adjust_stock(_product_id uuid, _change int, _reason text, _note text default null)
returns int language plpgsql security definer set search_path = public as $$
declare _new int;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Not allowed'; end if;
  if _change = 0 then raise exception 'Change cannot be zero'; end if;
  select stock + _change into _new from products where id = _product_id for update;
  if not found then raise exception 'Product not found'; end if;
  if _new < 0 then raise exception 'Stock cannot go below zero'; end if;
  update products set stock = _new where id = _product_id;
  insert into stock_adjustments (product_id, change, new_stock, reason, note, changed_by)
  values (_product_id, _change, _new, coalesce(nullif(trim(_reason),''),'manual'), _note, auth.uid());
  return _new;
end $$;

create or replace function public.admin_update_order(_order_id uuid, _status order_status, _note text default null, _courier text default null, _tracking text default null)
returns void language plpgsql security definer set search_path = public as $$
declare _o record; _it record; _new int;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Not allowed'; end if;
  select * into _o from orders where id = _order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if _o.status = 'cancelled' then raise exception 'This order is already cancelled'; end if;
  if _o.status = 'delivered' and _status <> 'delivered' then raise exception 'Delivered orders cannot be changed'; end if;
  update orders set status = _status,
    courier = coalesce(nullif(trim(_courier),''), courier),
    tracking_number = coalesce(nullif(trim(_tracking),''), tracking_number),
    payment_status = case when _status = 'delivered' then 'paid' else payment_status end,
    updated_at = now()
  where id = _order_id;
  if _status <> _o.status then
    insert into order_status_history (order_id, status, note, changed_by) values (_order_id, _status, _note, auth.uid());
  end if;
  if _status = 'cancelled' then
    for _it in select * from order_items where order_id = _order_id and product_id is not null loop
      update products set stock = stock + _it.quantity where id = _it.product_id returning stock into _new;
      if found then
        insert into stock_adjustments (product_id, change, new_stock, reason, note, changed_by, order_id)
        values (_it.product_id, _it.quantity, _new, 'order_cancelled', 'Cancelled by store', auth.uid(), _order_id);
      end if;
    end loop;
  end if;
end $$;

create or replace function public.admin_team() returns table(user_id uuid, email text, name text, role app_role)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'owner') then raise exception 'Only the owner can manage the team'; end if;
  return query select r.user_id, p.email, trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), r.role
    from user_roles r left join profiles p on p.id = r.user_id
    where r.role in ('owner','staff') order by r.role, p.email;
end $$;

create or replace function public.admin_set_role(_email text, _role app_role, _grant boolean)
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid;
begin
  if not public.has_role(auth.uid(),'owner') then raise exception 'Only the owner can manage the team'; end if;
  if _role not in ('owner','staff') then raise exception 'Invalid role'; end if;
  select id into _uid from profiles where lower(email) = lower(trim(_email)) limit 1;
  if _uid is null then raise exception 'No account found with that email. Ask them to sign up first.'; end if;
  if _grant then
    insert into user_roles (user_id, role) values (_uid, _role) on conflict do nothing;
  else
    if _role = 'owner' and (select count(*) from user_roles where role='owner') <= 1 then
      raise exception 'The store needs at least one owner';
    end if;
    delete from user_roles where user_id = _uid and role = _role;
  end if;
end $$;