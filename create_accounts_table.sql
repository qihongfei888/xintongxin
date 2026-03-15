-- 创建 accounts 表用于用户认证
create table if not exists public.accounts (
  id text primary key,
  user_id text not null unique,
  username text not null unique,
  password text not null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

-- 启用 RLS (Row Level Security)
alter table public.accounts enable row level security;

-- 创建 RLS 策略，允许所有操作
create policy "accounts_manage" 
on public.accounts
for all
using (true)
with check (true);

-- 创建索引以提高查询性能
create index if not exists idx_accounts_username on public.accounts(username);
create index if not exists idx_accounts_user_id on public.accounts(user_id);

-- 插入管理员账号（可选）
-- insert into public.accounts (id, user_id, username, password) 
-- values ('admin_1', 'admin_18844162799', '18844162799', 'QW200124.');

-- 插入示例用户账号（可选）
-- insert into public.accounts (id, user_id, username, password) 
-- values ('user_1', 'user_18373186924', '18373186924', 'password123');
