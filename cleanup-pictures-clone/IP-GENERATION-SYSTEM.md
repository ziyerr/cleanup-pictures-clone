# IP形象生成和周边制作系统

## 功能概述

本系统实现了完整的IP形象生成、保存和周边商品制作流程，具体包括：

### 主要功能

1. **IP形象生成**
   - 使用麻雀API (gpt-image-1模型) 生成高质量IP形象
   - 支持上传参考图片和自定义提示词

2. **用户认证系统**
   - 用户注册/登录功能
   - 自动检查登录状态
   - 未登录时自动弹出登录窗口

3. **IP形象保存**
   - 登录后自动保存生成的IP形象到用户账户
   - 支持为每个IP形象命名

4. **多视图生成**
   - 自动生成IP形象的左视图
   - 自动生成IP形象的后视图
   - 为3D建模提供全方位视角

5. **3D模型生成**
   - 集成Tripo3D API
   - 基于多视图生成高质量3D模型
   - 支持模型下载和预览

6. **周边商品生成**
   - 钥匙扣设计图生成
   - 冰箱贴设计图生成
   - 手提袋设计图生成
   - 手机壳设计图生成

## 技术架构

### 前端技术栈
- **框架**: Next.js 15 with React 18
- **UI库**: Tailwind CSS + Radix UI
- **状态管理**: React Hooks
- **类型检查**: TypeScript

### 后端服务
- **数据库**: Supabase (PostgreSQL)
- **文件存储**: Supabase Storage
- **用户认证**: 自定义认证系统

### AI服务集成
- **麻雀API**: 图像生成服务
  - Key: `sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke`
  - 文档: https://doc.apicore.ai/api-301177868
  - 模型: gpt-image-1

- **Tripo3D**: 3D模型生成服务
  - Key: `tsk_BSWrPgLgNGn1dUVsw7yJflHwmCHHY6ISUhRbYHNvIxq`
  - 文档: https://platform.tripo3d.ai/docs/introduction

## 数据库结构

### 用户表 (users)
```sql
- id: UUID (主键)
- username: TEXT (用户名，唯一)
- email: TEXT (邮箱，可选)
- password_hash: TEXT (密码哈希)
- created_at: TIMESTAMPTZ (创建时间)
```

### 生成任务表 (generation_tasks)
```sql
- id: UUID (主键)
- user_id: UUID (用户ID)
- status: TEXT (任务状态: pending/processing/completed/failed)
- task_type: TEXT (任务类型: ip_generation/multi_view/3d_model/merchandise)
- prompt: TEXT (生成提示词)
- original_image_url: TEXT (原始图片URL)
- result_image_url: TEXT (结果图片URL)
- result_data: JSONB (结果数据，如3D模型URL)
- error_message: TEXT (错误信息)
- created_at: TIMESTAMPTZ (创建时间)
- updated_at: TIMESTAMPTZ (更新时间)
```

### 用户IP形象表 (user_ip_characters)
```sql
- id: UUID (主键)
- user_id: UUID (用户ID)
- name: TEXT (IP形象名称)
- main_image_url: TEXT (主图片URL)
- left_view_url: TEXT (左视图URL)
- back_view_url: TEXT (后视图URL)
- model_3d_url: TEXT (3D模型URL)
- merchandise_urls: JSONB (周边商品图片URLs)
- created_at: TIMESTAMPTZ (创建时间)
```

## 使用流程

### 1. IP形象生成流程
```
用户上传图片/输入提示词
↓
点击"生成IP形象"
↓
系统调用麻雀API生成图像
↓
显示生成结果
```

### 2. 保存和周边生成流程
```
用户点击"保存IP形象并立即生成周边"
↓
检查登录状态
↓
未登录则弹出登录窗口
↓
用户登录成功
↓
保存IP形象到用户表
↓
创建多视图生成任务 (左视图 + 后视图)
↓
等待多视图生成完成
↓
创建3D模型生成任务
↓
创建周边商品生成任务 (4种商品并行生成)
↓
轮询检查所有任务完成状态
↓
显示最终结果 (多视图 + 3D模型 + 周边商品)
```

## 核心组件

### IPGenerationFlow.tsx
主要的IP生成流程组件，包含：
- IP形象生成界面
- 用户认证集成
- 周边商品生成流程
- 任务状态管理和显示

### AuthModal.tsx
用户认证模态框：
- 登录/注册表单
- 错误处理
- 成功后的回调处理

### ai-api.ts
AI API集成模块：
- 麻雀API调用
- 任务管理
- 多视图生成
- 周边商品生成

### tripo3d-api.ts
Tripo3D API集成：
- 3D模型生成
- 任务轮询
- 结果处理

### supabase.ts
数据库操作模块：
- 用户管理
- 任务管理
- 文件上传

## 环境配置

需要配置以下环境变量：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=你的supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的supabase匿名密钥

# Tripo3D API配置
TRIPO3D_API_KEY=tsk_BSWrPgLgNGn1dUVsw7yJflHwmCHHY6ISUhRbYHNvIxq

# 麻雀API配置 
MAIQUE_API_KEY=sk-1eEdZF3JuFocE3eyrFBnmE1IgMFwbGcwPfMciRMdxF1Zl8Ke
MAIQUE_API_BASE_URL=https://api.apicore.ai
```

## 安装和运行

1. **安装依赖**
```bash
npm install
```

2. **配置环境变量**
```bash
cp .env.example .env.local
# 编辑 .env.local 文件，填入正确的配置
```

3. **初始化数据库**
```bash
# 在Supabase控制台中运行 create-tables.sql
```

4. **启动开发服务器**
```bash
npm run dev
```

## API文档参考

- [麻雀API文档](https://doc.apicore.ai/api-301177868)
- [Tripo3D API文档](https://platform.tripo3d.ai/docs/introduction)
- [Supabase文档](https://supabase.com/docs)

## 注意事项

1. **API调用限制**: 请注意各API服务的调用频率限制
2. **文件存储**: 生成的图片会自动上传到Supabase存储
3. **任务超时**: 3D模型生成可能需要较长时间，系统设置了2小时的超时时间
4. **错误处理**: 系统包含完整的错误处理和用户提示机制

## 功能扩展

系统架构支持以下扩展：
- 添加更多周边商品类型
- 集成更多AI模型
- 添加用户收藏和分享功能
- 批量处理功能
- 商品预览和订购功能