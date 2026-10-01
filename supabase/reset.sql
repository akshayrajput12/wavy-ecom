-- =============================================================================
-- wavy: RESET. Wipes the store's application data so you can start clean.
--
--   *** IRREVERSIBLE. There is no undo. Take a backup first if you might want anything back
--   *** (Dashboard > Database > Backups, or: pg_dump "$DB_URL" > backup.sql).
--
-- DELETES (TRUNCATE ... RESTART IDENTITY CASCADE) every table in schema `public`, found
-- dynamically, so tables added by future migrations are covered too:
--   catalogue (categories, collections, products, variants, media, inventory + ledger),
--   carts, checkouts, orders, payments, refunds, shipments, returns, reviews, coupons, offers,
--   campaigns, testimonials, home sections, FAQs, pages, blog, SEO overrides, redirects,
--   addresses, wishlists, analytics, support tickets, notification log, audit log,
--   store settings, shipping zones/methods, payment gateway rows and integration config rows.
--   (seed.sql re-creates the settings, gateway and integration rows with their defaults.)
--   Also GST invoices and their numbering (migration 0021), so numbering restarts at 1. Meant for
--   a pre-launch clean-up: do not run it once real invoices have been issued to customers.
--
-- KEEPS (so the owner can still sign in to /admin):
--   profiles          app profile of every auth user (holds the effective admin role)
--   staff_members     staff invites / roles
--   permissions       RBAC permission catalogue (reference data from migration 0002)
--   role_permissions  role -> permission map    (reference data from migration 0002)
--   Supabase-managed schemas are never touched: auth (users, sessions), storage (files),
--   supabase_migrations (migration history) and anything owned by an extension.
--   To keep more tables (e.g. payment_gateways, integration_configs), add them to `keep` below.
--
-- HOW TO RUN (as the `postgres` role, on the database you really mean to wipe):
--   Supabase SQL editor: paste this file, Run.
--   psql:                psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/reset.sql
-- THEN RUN seed.sql to load the catalogue and the store defaults:
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql   (or paste it in the SQL editor)
--
-- Optional "full wipe" blocks at the bottom are commented out: staff, uploaded files, auth users.
-- =============================================================================

begin;

do $$
declare
  -- Tables that are never truncated. The RBAC/login tables keep the owner able to reach /admin.
  keep    text[] := array['profiles', 'staff_members', 'permissions', 'role_permissions'];
  targets text;
  blocker text;
begin
  select string_agg(format('public.%I', c.relname), ', ' order by c.relname)
    into targets
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind in ('r', 'p')                     -- tables + partitioned parents
     and not c.relispartition                        -- partitions go with their parent
     and c.relname <> all (keep)
     and c.relname not in ('schema_migrations', '_prisma_migrations')   -- schema meta, if a tool keeps it in public
     and not exists (select 1 from pg_depend d       -- tables owned by an extension
                      where d.classid = 'pg_class'::regclass and d.objid = c.oid and d.deptype = 'e');

  -- CASCADE would silently empty a kept table that references a truncated one. Refuse instead.
  select string_agg(format('%s -> %s', con.conrelid::regclass, con.confrelid::regclass), ', ')
    into blocker
    from pg_constraint con
    join pg_class src on src.oid = con.conrelid
    join pg_class dst on dst.oid = con.confrelid
    join pg_namespace sn on sn.oid = src.relnamespace
    join pg_namespace dn on dn.oid = dst.relnamespace
   where con.contype = 'f'
     and sn.nspname = 'public' and src.relname = any (keep)
     and dn.nspname = 'public' and dst.relname <> all (keep);
  if blocker is not null then
    raise exception 'reset aborted: kept table(s) reference wiped table(s): %', blocker
      using hint = 'Add the referenced table to keep, or drop it from keep.';
  end if;

  if targets is null then
    raise notice 'reset: nothing to truncate';
    return;
  end if;
  raise notice 'reset: truncating %', targets;
  execute 'truncate table ' || targets || ' restart identity cascade';
end $$;

commit;

-- =============================================================================
-- OPTIONAL FULL WIPE. Uncomment only what you want. Each block is independent.
-- =============================================================================

-- (a) Staff: remove every staff invite/role (the trigger demotes their profiles to customer).
--     Afterwards NOBODY is an admin until you run:  select public.bootstrap_super_admin('you@example.com');
--     permissions / role_permissions stay: they are reference data the app needs.
-- delete from public.staff_members;

-- (b) Uploaded files in the app's storage buckets (product, category, collection, content,
--     review and return images, invoice PDFs). Newer Supabase versions block direct deletes on
--     storage tables; if this errors, empty the buckets in Dashboard > Storage instead.
-- delete from storage.objects
--  where bucket_id in ('product-media', 'category-media', 'collection-media', 'content-media',
--                      'review-media', 'return-evidence', 'invoices');

-- (c) Every sign-in account except yours (cascades to their profiles; staff rows lose the link).
--     Replace the email first.
-- delete from auth.users where lower(email) <> lower('owner@example.com');
