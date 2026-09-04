-- CONECTA API least privilege.
-- The product is authenticated-only: anonymous clients do not query public data.
-- RLS remains the row boundary; these grants remove capabilities that bypass it
-- (TRUNCATE) or are never required by browser clients (REFERENCES/TRIGGER).

revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;
revoke all privileges on all functions in schema public from anon;

revoke truncate, references, trigger
  on all tables in schema public
  from authenticated;

-- Private functions are policy helpers or trigger internals. Remove PostgreSQL's
-- implicit PUBLIC execute grant while preserving existing explicit role grants.
revoke execute on all functions in schema private from public;
revoke execute on all functions in schema private from anon;

-- Safe defaults for future objects owned by the migration role.
alter default privileges in schema public revoke all privileges on tables from anon;
alter default privileges in schema public revoke all privileges on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from anon;
