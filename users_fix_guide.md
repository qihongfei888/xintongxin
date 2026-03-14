# 童心宠伴用户数据修复指南

## 问题分析

当前 Supabase 数据库中只有 `users` 表，没有 `accounts` 表。所有用户数据都存储在 `users` 表中，结构如下：

```sql
create table if not exists public.users (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamp not null default now()
);
```

## 修复步骤

### 步骤 1：查看 `users` 表中的所有用户数据

在 Supabase SQL 编辑器中执行以下查询，查看所有用户数据：

```sql
select * from public.users;
```

### 步骤 2：根据用户名查找用户数据

由于 `users` 表中 `username` 存储在 `data` 字段的 JSON 数据中，我们需要使用 JSON 查询：

```sql
select * from public.users where data->>'username' = '18373186924';
```

### 步骤 3：清理/重置 `users` 表中的错误记录

如果找到错误记录，可以直接删除它，让客户端重新上传：

```sql
delete from public.users where data->>'username' = '18373186924';
```

### 步骤 4：验证修复结果

再次执行查询，确认记录已被删除：

```sql
select * from public.users where data->>'username' = '18373186924';
```

## 注意事项

1. 所有用户数据都存储在 `users` 表的 `data` 字段中，以 JSON 格式存储
2. 用户名 `username` 是 `data` JSON 对象的一个属性
3. 修复后，用户需要重新登录应用，数据会自动重新同步到云端

## 技术说明

- 应用使用 Supabase 作为云存储，同步数据到 `users` 表
- 前端代码通过 `supabaseClient.from('users').upsert()` 方法同步数据
- `users` 表启用了 RLS (Row Level Security)，但当前策略允许所有操作

## 常见问题

### Q: 为什么找不到 `accounts` 表？
A: 应用设计中从未使用 `accounts` 表，所有用户数据都存储在 `users` 表中。

### Q: 如何确认用户数据是否正确同步？
A: 用户登录后，应用会自动将本地数据同步到 `users` 表，您可以通过查询 `users` 表验证数据是否存在。

### Q: 如果删除了用户数据，用户再次登录会发生什么？
A: 用户再次登录时，应用会将本地存储的数据重新同步到 `users` 表，不会丢失数据。