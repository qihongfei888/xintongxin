# 童心宠伴应用部署指南

## 项目简介

童心宠伴是一个面向教师的班级管理应用，通过宠物养成和积分系统激励学生积极参与课堂活动。

## 部署步骤

### 1. 准备工作

- 确保您已经安装了Git
- 拥有一个GitHub账号
- 在GitHub上创建一个新的仓库

### 2. 本地部署

#### 方法一：使用部署脚本（推荐）

1. 双击运行 `deploy_commands.bat` 文件
2. 按照提示输入您的GitHub用户名、邮箱和仓库URL
3. 脚本会自动完成Git初始化、提交和推送操作
4. 按照脚本提示在GitHub上配置Pages

#### 方法二：手动部署

1. **初始化Git仓库**
   ```bash
   git init
   ```

2. **配置Git用户信息**
   ```bash
   git config user.name "您的GitHub用户名"
   git config user.email "您的GitHub邮箱"
   ```

3. **添加远程仓库**
   ```bash
   git remote add origin https://github.com/您的用户名/仓库名.git
   ```

4. **添加文件并提交**
   ```bash
   git add .
   git commit -m "初始化童心宠伴应用"
   ```

5. **推送到GitHub**
   ```bash
   git push -u origin main
   ```

### 3. 配置GitHub Pages

1. 登录GitHub，进入您的仓库
2. 点击 "Settings" 选项卡
3. 找到 "Pages" 部分
4. 在 "Source" 下拉菜单中选择 "main" 分支
5. 点击 "Save" 按钮
6. 等待几分钟，GitHub Pages会自动部署您的应用

### 4. 访问应用

部署完成后，您可以通过以下URL访问您的应用：
```
https://您的用户名.github.io/仓库名
```

## 技术说明

### 核心功能

- 学生管理：添加、编辑、删除学生
- 积分系统：加分、减分、积分记录
- 宠物养成：领养、喂养、成长
- 小组管理：创建、编辑、随机分组
- 光荣榜：学生排名、进步之星
- 勋章商店：商品兑换、宠物装扮
- 数据备份：导出、导入数据

### 技术栈

- 前端：HTML5, CSS3, JavaScript
- 数据存储：LocalStorage, IndexedDB
- 云同步：Bmob SDK
- 表格处理：xlsx.full.min.js

### Bmob SDK配置

应用使用本地Bmob SDK文件 (`Bmob-2.7.0.min.js`)，已内置在项目中。

## 故障排除

### Bmob SDK加载失败

- 确保 `Bmob-2.7.0.min.js` 文件存在于项目根目录
- 检查浏览器控制台是否有相关错误信息
- 尝试清除浏览器缓存后重新加载

### 数据同步问题

- 确保网络连接正常
- 检查Bmob初始化是否成功
- 尝试重新登录应用

### 存储空间不足

- 定期使用"导出备份"功能保存数据
- 清理不必要的浏览器缓存
- 考虑使用IndexedDB存储模式（应用会自动切换）

## 联系我们

如有任何问题或建议，请联系管理员。

---

**童心宠伴 - 让班级管理更有趣！**