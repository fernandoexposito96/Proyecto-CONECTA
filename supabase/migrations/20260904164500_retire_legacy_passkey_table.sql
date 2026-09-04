-- Native Supabase Auth passkeys replaced the former application-owned WebAuthn
-- credentials. Preserve existing rows for controlled retention/deletion, but
-- remove the legacy table from every browser role's API surface.
revoke all privileges on table public.passkey_credentials from anon, authenticated;
