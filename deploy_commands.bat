@echo off

REM 部署指令 - 童心宠伴应用
REM 本脚本包含部署到GitHub Pages的完整步骤

echo ===============================
echo 童心宠伴应用部署指令
echo ===============================
echo.

REM 1. 初始化Git仓库
echo 1. 初始化Git仓库...
git init
echo.

REM 2. 配置Git用户信息
echo 2. 配置Git用户信息...
echo 请输入您的GitHub用户名:
set /p github_username=
git config user.name "%github_username%"
echo 请输入您的GitHub邮箱:
set /p github_email=
git config user.email "%github_email%"
echo.

REM 3. 添加远程仓库
echo 3. 添加远程仓库...
echo 请输入您的GitHub仓库URL (格式: https://github.com/用户名/仓库名.git):
set /p repo_url=
git remote add origin %repo_url%
echo.

REM 4. 创建.gitignore文件
echo 4. 创建.gitignore文件...
if not exist ".gitignore" (
echo # 依赖包
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 编辑器目录和文件
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln

# 操作系统文件
Thumbs.db
.DS_Store

# 环境变量文件
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 构建输出
build/
dist/

# 临时文件
*.tmp
*.temp
*.log
> .gitignore
echo .gitignore文件创建成功！
) else (
echo .gitignore文件已存在，跳过创建步骤。
)
echo.

REM 5. 添加所有文件到Git
echo 5. 添加所有文件到Git...
git add .
echo.

REM 6. 提交代码
echo 6. 提交代码...
git commit -m "初始化童心宠伴应用"
echo.

REM 7. 推送到GitHub
echo 7. 推送到GitHub...
git push -u origin main
echo.

REM 8. 配置GitHub Pages
echo 8. 配置GitHub Pages...
echo 请按照以下步骤在GitHub上配置Pages:
echo 1. 登录GitHub，进入您的仓库
echo 2. 点击 "Settings" 选项卡
echo 3. 找到 "Pages" 部分
echo 4. 在 "Source" 下拉菜单中选择 "main" 分支
echo 5. 点击 "Save" 按钮
echo 6. 等待几分钟，GitHub Pages会自动部署您的应用
echo.
echo 部署完成！您的应用将在 https://%github_username%.github.io/仓库名 访问
echo.
echo ===============================
echo 部署指令执行完成
echo ===============================

pause