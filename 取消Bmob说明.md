# 取消 Bmob 部署说明

- **本项目已不再使用 Bmob**，云端同步与存储统一改为 **Supabase**。
- 前端不再加载 Bmob SDK，不请求 Bmob 接口；`app.js` 与 `index.html` 中已无 Bmob 相关代码。
- 部署与多端同步请按 **《Supabase部署指南》** 操作，无需再配置 Bmob 或绑定 Bmob 域名。

若你本地仍有 `Bmob-2.5.30.min.js`、`Bmob同步说明.md`、或旧版含 Bmob 的部署文档，可删除或忽略，以 Supabase 为准即可。
