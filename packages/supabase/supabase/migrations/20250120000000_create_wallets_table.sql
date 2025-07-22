create table wallets (
    id uuid primary key default gen_random_uuid(),
    user_id text,
    address text not null unique,
    encrypted_private_key text not null,
    type text not null check (type in ('master', 'minor')),
    name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Optional: Index for quick lookup by user
create index idx_wallets_user_id on wallets(user_id);