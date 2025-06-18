// Creem Payment Configuration
export const CREEM_CONFIG = {
  // Test environment configuration (根据官方文档更新)
  API_KEY: process.env.CREEM_API_KEY || 'creem_test_34pgtHBhVEZn1dPMGGiHX6',
  WEBHOOK_SECRET: process.env.CREEM_WEBHOOK_SECRET || 'whsec_4qpDxzWYPUkGVAQ1GmVyS8',
  BASE_URL: process.env.CREEM_BASE_URL || 'https://test-api.creem.io', // 使用测试环境
  IS_TEST_MODE: process.env.NODE_ENV !== 'production', // 自动检测测试模式
  
  // Product IDs for subscription plans
  PLANS: {
    PERSONAL: {
      id: 'prod_VrBhCm27NvLKSK9dGs71K',
      name: '个人IP用户',
      price: 5,
      currency: 'USD',
      features: {
        ipCharacters: 10,
        merchandiseMonthly: 100,
        modelsMonthly: 10
      }
    },
    TEAM: {
      id: 'prod_6UUqhLnJqe2hffURjudIJt',
      name: '团队IP版',
      price: 20,
      currency: 'USD',
      features: {
        ipCharacters: 100,
        merchandiseMonthly: 1000,
        modelsMonthly: 50
      }
    }
  }
};

// Subscription types
export type SubscriptionPlan = 'free' | 'personal' | 'team' | 'enterprise';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  creem_subscription_id?: string;
  creem_customer_id?: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface UsageQuota {
  id: string;
  user_id: string;
  subscription_id: string;
  ip_characters_used: number;
  ip_characters_limit: number;
  merchandise_daily_used: number;
  merchandise_daily_limit: number;
  merchandise_monthly_used: number;
  merchandise_monthly_limit: number;
  models_monthly_used: number;
  models_monthly_limit: number;
  period_start: string;
  period_end: string;
  daily_reset_date: string;
  created_at: string;
  updated_at: string;
}