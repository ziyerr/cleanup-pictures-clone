# Creem Payment Integration Guide

## 概述

本文档描述了在 Popverse AI 项目中集成 Creem 支付系统的完整实现。Creem 是一个现代化的支付处理平台，支持订阅管理和 webhook 事件处理。

## 环境配置

### 测试环境密钥

```bash
# .env.local
CREEM_API_KEY=creem_test_34pgtHBhVEZn1dPMGGiHX6
CREEM_WEBHOOK_SECRET=whsec_4qpDxzWYPUkGVAQ1GmVyS8
CREEM_BASE_URL=https://api.creem.io
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 订阅计划配置

1. **个人IP用户** - $5/月
   - Product ID: `prod_VrBhCm27NvLKSK9dGs71K`
   - 最多生成 10 个IP形象
   - 每月生成 100 个周边图
   - 每月生成 10 个3D模型

2. **团队IP版** - $20/月
   - Product ID: `prod_6UUqhLnJqe2hffURjudIJt`
   - 最多生成 100 个IP形象
   - 每月生成 1000 个周边图
   - 每月生成 50 个3D模型

## 数据库架构

### 新增表结构

#### 1. user_subscriptions 表
```sql
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('free', 'personal', 'team', 'enterprise')) DEFAULT 'free',
    creem_subscription_id TEXT,
    creem_customer_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')) DEFAULT 'inactive',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. user_quotas 表
```sql
CREATE TABLE public.user_quotas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
    ip_characters_used INTEGER DEFAULT 0,
    ip_characters_limit INTEGER DEFAULT 2,
    merchandise_monthly_used INTEGER DEFAULT 0,
    merchandise_monthly_limit INTEGER DEFAULT 2,
    models_monthly_used INTEGER DEFAULT 0,
    models_monthly_limit INTEGER DEFAULT 1,
    period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API 端点

### 1. 创建支付会话
```
POST /api/payments/create-checkout
```

**请求体:**
```json
{
  "planId": "personal" | "team"
}
```

**响应:**
```json
{
  "success": true,
  "checkout_url": "https://checkout.creem.io/...",
  "session_id": "cs_..."
}
```

### 2. Webhook 处理
```
POST /api/payments/webhook
```

处理的事件类型:
- `subscription.created`
- `subscription.activated`
- `subscription.cancelled`
- `subscription.expired`
- `subscription.past_due`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. 获取订阅信息
```
GET /api/subscription
```

**响应:**
```json
{
  "success": true,
  "subscription": {
    "plan": "personal",
    "status": "active",
    ...
  },
  "quota": {
    "ip_characters_used": 3,
    "ip_characters_limit": 10,
    ...
  }
}
```

### 4. 取消订阅
```
POST /api/subscription/cancel
```

## 核心文件结构

```
src/
├── lib/
│   ├── creem-config.ts      # Creem 配置和类型定义
│   ├── creem-api.ts         # Creem API 客户端
│   └── supabase.ts          # 订阅管理函数
├── app/
│   ├── api/
│   │   ├── payments/
│   │   │   ├── create-checkout/route.ts
│   │   │   └── webhook/route.ts
│   │   └── subscription/
│   │       ├── route.ts
│   │       └── cancel/route.ts
│   └── payment/
│       ├── success/page.tsx
│       └── cancel/page.tsx
└── components/
    └── Pricing.tsx          # 更新的定价组件
```

## 使用流程

### 1. 用户订阅流程

1. 用户在定价页面选择计划
2. 点击订阅按钮 → 调用 `/api/payments/create-checkout`
3. 重定向到 Creem 支付页面
4. 用户完成支付
5. Creem 发送 webhook 到 `/api/payments/webhook`
6. 系统创建/更新用户订阅和配额
7. 重定向到成功页面 `/payment/success`

### 2. 配额检查流程

```typescript
// 在生成 IP 形象前检查配额
const { canProceed, message } = await checkUserQuota(userId, 'ip_character');
if (!canProceed) {
  throw new Error(message);
}

// 生成成功后递增配额
await incrementUserQuota(userId, 'ip_character');
```

## 关键函数

### 订阅管理
- `createUserSubscription()` - 创建用户订阅
- `getUserSubscription()` - 获取用户订阅
- `updateUserSubscription()` - 更新订阅状态

### 配额管理
- `createUserQuota()` - 创建用户配额
- `getUserQuota()` - 获取用户配额
- `checkUserQuota()` - 检查配额限制
- `incrementUserQuota()` - 递增配额使用量

### Creem API
- `creemAPI.createCheckoutSession()` - 创建支付会话
- `creemAPI.getSubscription()` - 获取订阅详情
- `creemAPI.cancelSubscription()` - 取消订阅

## 安全考虑

1. **Webhook 签名验证**: 使用 HMAC-SHA256 验证所有 webhook 请求
2. **环境变量**: 所有敏感信息通过环境变量管理
3. **用户认证**: 所有 API 端点都要求用户认证
4. **行级安全**: 数据库使用 RLS 确保用户只能访问自己的数据

## 测试

### 测试 Webhook
使用 Creem 提供的测试事件来验证 webhook 处理:

```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "creem-signature: sha256=..." \
  -d '{"type": "subscription.created", "data": {...}}'
```

### 测试支付流程
1. 在本地启动开发服务器
2. 访问定价页面
3. 选择付费计划并完成支付
4. 验证订阅状态和配额更新

## 故障排除

### 常见问题

1. **Webhook 签名验证失败**
   - 检查 `CREEM_WEBHOOK_SECRET` 是否正确
   - 确保签名计算逻辑正确

2. **支付会话创建失败**
   - 验证 `CREEM_API_KEY` 是否有效
   - 检查产品 ID 是否正确

3. **订阅状态未更新**
   - 检查 webhook 端点是否可访问
   - 验证数据库连接和权限

## 生产部署

### 环境变量更新
```bash
# 生产环境
CREEM_API_KEY=creem_live_...
CREEM_WEBHOOK_SECRET=whsec_live_...
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Webhook 端点配置
在 Creem 仪表板中配置 webhook 端点:
```
https://your-domain.com/api/payments/webhook
```

### 监控
建议设置以下监控:
- Webhook 事件处理成功率
- 支付转换率
- 订阅状态异常
- API 错误率

## 后续优化

1. **缓存优化**: 缓存用户订阅和配额信息
2. **批量处理**: 优化 webhook 事件的批量处理
3. **错误重试**: 实现 webhook 事件的重试机制
4. **分析报告**: 添加订阅和收入分析功能
5. **优惠券系统**: 集成促销码和折扣功能