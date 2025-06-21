# Popverse.ai - IP角色AI批量生成系统

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-green.svg)

基于Next.js 15开发的AI驱动的IP角色生成与周边商品设计平台，支持一键从真实图片生成卡通IP形象，并自动生成完整的周边产品线。

## ✨ 核心功能

### 🎨 AI IP形象生成
- **智能图片识别**: 上传真实照片，AI自动提取人物特征
- **多风格支持**: Kawaii软萌治愈、Cyberpunk赛博朋克、国潮新中式等预设风格
- **自定义描述**: 支持自然语言描述生成个性化IP形象
- **高质量输出**: 1024x1024高分辨率，适合商品制作

### 🛍️ 周边商品生成
- **一键生成**: 从IP形象自动生成30+种周边商品
- **商品类型**: 手机壳、钥匙扣、T恤、马克杯、贴纸、徽章等
- **3D建模**: 集成Tripo3D API，支持3D手办模型生成
- **批量处理**: 支持批量生成和下载

### 👤 用户系统
- **Supabase认证**: 安全的用户注册和登录系统
- **个人收藏**: 保存和管理生成的IP形象
- **订阅管理**: 支持免费和付费套餐
- **使用统计**: 实时显示配额使用情况

### 💰 支付系统
- **CREEM集成**: 支持多种支付方式
- **订阅计划**: 灵活的定价策略
- **自动计费**: 月度和年度订阅选项

## 🛠️ 技术架构

### 前端技术栈
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript 5.8.3
- **样式**: Tailwind CSS 3.4.17
- **组件**: Radix UI + Shadcn/ui
- **状态管理**: React Context API
- **图标**: Lucide React

### 后端服务
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **文件存储**: Supabase Storage
- **API路由**: Next.js API Routes

### AI & 第三方服务
- **AI图像生成**: Sparrow API
- **3D建模**: Tripo3D API
- **支付处理**: CREEM Payment Gateway
- **部署**: Vercel/Netlify

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm/yarn/pnpm/bun

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd cleanup-pictures-clone
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
# 或
pnpm install
# 或
bun install
```

3. **环境变量配置**
创建 `.env.local` 文件：
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wrfvysakckcmvquvwuei.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API
SPARROW_API_KEY=sk-TFpWwowemj3EvpydtjwuIolhiuEgG8WW1LugZs3HHF4eb4z9

# 3D建模
TRIPO3D_API_KEY=your_tripo3d_api_key

# 支付
CREEM_API_KEY=your_creem_api_key
CREEM_SECRET_KEY=your_creem_secret_key
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── subscription/  # 订阅管理
│   │   ├── payments/      # 支付处理
│   │   ├── ip/           # IP生成相关
│   │   └── tasks/        # 任务管理
│   ├── auth/             # 认证页面
│   ├── workshop/         # 工作台页面
│   └── payment/          # 支付相关页面
├── components/            # React组件
│   ├── ui/               # 基础UI组件
│   ├── HeroSection.tsx   # 主页面组件
│   ├── Pricing.tsx       # 定价组件
│   └── ...
├── contexts/             # React Context
├── lib/                  # 工具库
│   ├── ai-api.ts        # AI API封装
│   ├── supabase.ts      # 数据库操作
│   ├── creem-api.ts     # 支付API
│   └── tripo3d-api.ts   # 3D建模API
└── ...
```

## 🎯 主要页面

### 首页 (/)
- 图片上传和IP生成界面
- 风格选择和自定义描述
- 实时生成进度显示

### 工作台 (/workshop)
- IP形象详情展示
- 周边商品生成和预览
- 批量下载功能

### 个人中心 (/profile)
- 用户信息管理
- 订阅状态显示
- 使用统计

### 任务管理 (/tasks)
- 生成任务列表
- 任务状态跟踪
- 历史记录查看

## 🔧 开发工具

### 代码质量
```bash
# 代码检查和格式化
npm run lint
npm run format
```

### 构建和部署
```bash
# 生产构建
npm run build

# 生产运行
npm run start
```

## 📊 数据库架构

### 主要表结构
- `users`: 用户信息
- `user_ip_characters`: 用户IP形象收藏
- `generation_tasks`: 生成任务记录
- `user_subscriptions`: 用户订阅信息
- `usage_quotas`: 使用配额统计

## 🎨 设计系统

### 颜色主题
- 主色调: `cleanup-green` (#10B981)
- 辅助色: 灰色系列
- 状态色: 成功(绿色)、错误(红色)、警告(黄色)

### 组件规范
- 使用 Radix UI 作为基础组件
- Tailwind CSS 进行样式定制
- 响应式设计，支持移动端

## 🔐 安全特性

- Supabase 行级安全策略 (RLS)
- JWT 身份验证
- API 密钥加密存储
- CSRF 保护

## 📈 性能优化

- Next.js 15 App Router
- 图片懒加载和优化
- API 路由缓存
- Suspense 数据获取

## 🚀 部署状态

✅ **生产就绪**: 已修复所有TypeScript错误，通过构建测试

### 部署选项
- **Vercel**: 推荐，零配置部署
- **Netlify**: 支持静态导出
- **自托管**: 支持 Docker 部署

## 📝 更新日志

### 最新版本特性
- ✅ 用户订阅状态实时显示
- ✅ 智能定价卡片优化
- ✅ 当前计划识别功能
- ✅ 配额可视化界面
- ✅ TypeScript类型安全改进
- ✅ Next.js构建优化

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系我们

- 项目主页: [Popverse.ai](https://popverse.ai)
- 技术支持: support@popverse.ai
- 商务合作: business@popverse.ai

---

**Popverse.ai** - 让每个人都能拥有专属的IP形象 🎨
