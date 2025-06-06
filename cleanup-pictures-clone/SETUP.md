# IP Character Generation System Setup

这是一个完整的IP形象生成和周边商品制作系统，集成了AI图像生成、3D建模和用户管理功能。

## 功能特性

- ✅ IP形象生成（使用麻雀API的gpt-image-1模型）
- ✅ 任务队列管理（Supabase数据库）
- ✅ 10秒轮询系统检查生成状态
- ✅ 图片上传到Supabase存储
- ✅ 用户注册/登录系统
- ✅ 多视图生成（左视图、后视图）
- ✅ 3D模型生成（Tripo3D API）
- ✅ 周边商品批量生成（钥匙扣、冰箱贴、手提袋、手机壳）

## 设置步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
确保 `.env.local` 文件包含以下配置：
```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://zdoxqffgsefczrtrcvge.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Tripo3D API配置
TRIPO3D_API_KEY=tsk_BSWrPgLgNGn1dUVsw7yJflHwmCHHY6ISUhRbYHNvIxq
```

### 3. 设置Supabase数据库
在Supabase SQL编辑器中运行 `database-schema.sql` 中的所有SQL命令来创建必要的表结构。

### 4. 创建Supabase存储桶
在Supabase仪表板中创建名为 `generated-images` 的公共存储桶。

### 5. 启动开发服务器
```bash
npm run dev
```

## 使用流程

### 1. 生成IP形象
1. 用户上传一张图片并输入提示词
2. 点击"生成IP形象"按钮
3. 系统创建生成任务并开始10秒轮询
4. 生成完成后显示IP形象

### 2. 保存和生成周边
1. 生成IP形象后，点击"保存IP形象并立即生成周边"
2. 如果未登录，会弹出注册/登录窗口
3. 登录后系统会：
   - 保存IP形象到用户表
   - 生成左视图和后视图
   - 使用多视图生成3D模型（Tripo3D API）
   - 批量生成周边商品（钥匙扣、冰箱贴、手提袋、手机壳）

### 3. 查看结果
- 所有生成的图片都会显示在界面上
- 3D模型提供下载链接
- 周边商品以网格形式展示

## API集成详情

### 麻雀API (图像生成)
- 端点: `https://ismaque.org/v1/images/edits`
- 模型: `gpt-image-1`
- 支持图生图编辑和文本提示

### Tripo3D API (3D建模)
- 端点: `https://api.tripo3d.ai/v2`
- 支持单图像和多视图3D建模
- 自动生成纹理和PBR材质

### Supabase (数据库和存储)
- PostgreSQL数据库用于任务管理
- 实时轮询任务状态
- 文件存储用于生成的图片

## 数据库表结构

- `users`: 用户信息
- `generation_tasks`: 生成任务管理
- `user_ip_characters`: 用户保存的IP形象

## 组件架构

- `IPGenerationFlow`: 主要生成流程组件
- `AuthModal`: 用户认证模态框
- `supabase.ts`: 数据库操作
- `ai-api.ts`: AI生成API集成
- `tripo3d-api.ts`: 3D建模API集成

## 注意事项

1. 确保所有API密钥都正确配置
2. Supabase表必须先创建
3. 3D模型生成时间较长（30秒轮询间隔）
4. 图片生成使用10秒轮询间隔
5. 所有敏感信息都存储在环境变量中