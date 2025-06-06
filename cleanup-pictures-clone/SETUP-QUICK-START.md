# IP形象生成和周边制作系统 - 快速开始

## 🚀 快速运行指南

### 第一步：安装依赖
```bash
cd cleanup-pictures-clone
npm install
```

### 第二步：配置环境变量
创建 `.env.local` 文件：
```bash
cp .env.example .env.local
```

在 `.env.local` 中填入您的配置：
```env
# Supabase配置 (必需)
NEXT_PUBLIC_SUPABASE_URL=你的supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的supabase匿名密钥

# Tripo3D API配置 (已配置)
TRIPO3D_API_KEY=tsk_BSWrPgLgNGn1dUVsw7yJflHwmCHHY6ISUhRbYHNvIxq

# 麻雀API配置 (已配置)
MAIQUE_API_KEY=sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke
MAIQUE_API_BASE_URL=https://api.apicore.ai
```

### 第三步：初始化数据库
1. 登录到您的 [Supabase 控制台](https://supabase.com/dashboard)
2. 创建新项目或选择现有项目
3. 在 SQL Editor 中运行 `create-tables.sql` 文件

### 第四步：启动开发服务器
```bash
npm run dev
```

🎉 系统将在 http://localhost:3000 启动！

## 📋 功能测试清单

### ✅ 基础功能测试
- [ ] 上传图片 (支持拖拽)
- [ ] 选择预设风格或自定义描述
- [ ] 生成IP形象
- [ ] 图片预览和下载

### ✅ 高级功能测试
- [ ] 用户注册/登录
- [ ] 保存IP形象到个人账户
- [ ] 自动生成左视图和后视图
- [ ] 生成3D模型
- [ ] 批量生成周边商品：
  - [ ] 钥匙扣
  - [ ] 冰箱贴  
  - [ ] 手提袋
  - [ ] 手机壳

## 🔧 故障排除

### 常见问题

**1. API调用失败**
- 检查网络连接
- 确认API keys是否正确
- 查看浏览器控制台错误信息

**2. 数据库连接失败**
- 确认 Supabase URL 和 Key 是否正确
- 检查数据库表是否已创建
- 确认 RLS (Row Level Security) 已正确配置

**3. 图片上传失败**
- 检查图片格式 (支持 JPG, PNG, WebP)
- 确认图片大小不超过 10MB
- 检查 Supabase Storage 配置

### 开发者调试

启用调试模式：
```bash
# 在浏览器控制台中查看详细日志
localStorage.setItem('debug', 'true')
```

查看API调用详情：
```javascript
// 在浏览器控制台中
console.log('Current API Config:', {
  maqueAPI: 'https://api.apicore.ai',
  tripo3D: 'Configured'
});
```

## 📞 技术支持

如果遇到问题，请检查：
1. 浏览器控制台错误信息
2. 网络请求状态
3. API响应内容
4. 数据库连接状态

## 🎯 下一步

系统成功运行后，您可以：
1. 测试完整的IP生成到周边制作流程
2. 自定义更多周边商品类型
3. 集成更多AI模型
4. 添加用户管理功能
5. 扩展商品展示和订购功能

Happy creating! 🎨✨