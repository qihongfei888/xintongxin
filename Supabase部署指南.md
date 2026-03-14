# Supabase 部署指南（含多端数据同步）

**说明**：本项目已**取消 Bmob 部署**，云同步统一使用 **Supabase**。请勿再配置或引用 Bmob SDK。

按以下步骤部署后，**同一账号在手机、电脑、平板等多端登录，数据会自动同步**（以云端为准，新覆盖旧）。

---

## 零、部署前准备

- 确保项目中有 **config.js**（若没有，可复制 **config.example.js** 为 config.js，再填写第四步的 URL 和 Key）。
- **supabase.min.js** 可选：有则优先本地加载，无则自动从 CDN 加载，不影响部署。

---

## 一、创建 Supabase 项目

1. 打开 [https://supabase.com](https://supabase.com) 并登录。
2. 点击 **New project**。
3. 填写：
   - **Name**：例如 `xintongxin` 或 `童心宠伴`。
   - **Database Password**：设一个强密码并保存（用于直接连库，可选）。
   - **Region**：选离用户最近的区域（如 `East Asia (Tokyo)`）。
4. 点击 **Create new project**，等待约 1～2 分钟创建完成。

---

## 二、建表（执行 SQL）

1. 在项目左侧菜单打开 **SQL Editor**。
2. 点击 **New query**。
3. 复制本仓库中的 **`supabase-schema.sql`** 全部内容，粘贴到编辑器。
4. 点击 **Run**（或 Ctrl+Enter）执行。

执行成功后，会看到 `public.users` 表（字段：`id`, `data`, `updated_at`）。无需再建 RLS 策略即可用 anon key 读写（当前前端直连方式）。

---

## 三、获取 API 配置

1. 左侧菜单打开 **Settings** → **API**。
2. 记下两处：
   - **Project URL**（例如 `https://xxxxx.supabase.co`）→ 用作 `supabaseUrl`。
   - **Project API keys** 中的 **anon public** → 用作 `supabaseKey`（不要用 `service_role` 在前端）。

---

## 四、在前端配置 URL 和 Key

1. 打开项目中的 **`config.js`**（若没有此文件，先复制 **config.example.js** 为 config.js）。
2. 将 **SUPABASE_URL** 和 **SUPABASE_KEY** 改为你自己的值：

```javascript
window.SUPABASE_URL = 'https://你的项目ID.supabase.co';
window.SUPABASE_KEY = '你的 anon public key';
```

保存后，前端会连到你自己的 Supabase 项目，数据只存在你的库里。无需修改 `app.js`。

---

## 五、多端数据同步如何保证

- **同一账号**：用同一用户名/密码在不同设备登录后，会得到同一个 **userId**，对应 Supabase `users` 表中的同一行。
- **打开/刷新页面**：会先读本地缓存，再在**有网时**调用 `syncFromCloud()`，用云端的 `data` 和 `updated_at` 与本地比较，**以更新的一方为准**（新覆盖旧），因此多端看到的最终一致。
- **某一端修改并保存**：先写本地，再在约 2.5 秒防抖后上传到 Supabase（`syncToCloud`），其他端在**下次打开页面**或**切回标签页**时会自动拉取最新数据（`syncFromCloud`）。
- **无网**：仅用本地数据；有网后会自动上传未同步的变更（离线队列）并拉取云端最新，多端最终一致。

因此：**部署好 Supabase 并配置好 URL/Key 后，多端用户数据同步由现有逻辑保证**，无需再改代码。

---

## 六、自检清单

- [ ] **零**：已有 `config.js`（可从 config.example.js 复制）。
- [ ] **一**：Supabase 项目已创建。
- [ ] **二**：SQL 已执行，存在 `public.users` 表。
- [ ] **三**：已从 Settings → API 复制 Project URL 和 anon public key。
- [ ] **四**：已在 `config.js` 中填写 `SUPABASE_URL` 和 `SUPABASE_KEY`。
- [ ] 在浏览器打开应用，登录后做一次修改并保存；在 Supabase **Table Editor** 中打开 `users` 表，应能看到对应用户的一行且 `data` / `updated_at` 已更新。
- [ ] 在另一台设备（或另一浏览器）用同一账号登录，应能看到刚修改的数据（若未立刻看到，刷新或切出再切回标签页即可）。

---

## 七、可选：启用 RLS（行级安全）

若希望按用户隔离（每人只能读写自己的行），可再执行：

```sql
alter table public.users enable row level security;

create policy "users_own_row"
  on public.users for all
  using (true)
  with check (true);
```

当前前端用 anon key 且按 `id`（业务用户 ID）读写，若未使用 Supabase Auth，上面 `using (true) with check (true)` 表示允许所有 anon 读写；若后续接入 Supabase Auth，可改为 `auth.uid()::text = id` 等策略。

完成以上步骤即完成 Supabase 部署，并保证多端用户数据同步。
