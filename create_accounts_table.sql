-- 创建 accounts 表用于用户认证
create table if not exists public.accounts (
  id text primary key,
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

-- 插入管理员账号（可选）
-- insert into public.accounts (id, username, password) 
-- values ('admin_1', '18844162799', 'QW200124.');

-- 插入示例用户账号（可选）
-- insert into public.accounts (id, username, password) 
-- values ('user_1', '18373186924', 'password123');
