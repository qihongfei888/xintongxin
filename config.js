/**
 * Supabase 配置（部署时替换为自己的项目）
 * 见 Supabase部署指南.md
 */
window.SUPABASE_URL = 'https://cuipqszkjsxixmbrvwdg.supabase.co';
window.SUPABASE_KEY = 'sb_publishable_kV8fI-YCfPQy2m2akpOdXg_JXrRurE9';

/**
 * R2 宠物照片根地址（末尾不要加 /）
 * 照片已上传到 R2 时填写，系统会从该地址加载 pets/类型/growing|mature/xxx.jpg
 * 留空则使用本地 photos/ 路径
 */
window.R2_PETS_BASE_URL = 'https://pub-45fa76a5448b4757a1b35d47aef4fc65.r2.dev/pets';
