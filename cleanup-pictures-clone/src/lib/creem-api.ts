import { CREEM_CONFIG } from './creem-config';

export interface CreemCheckoutSession {
  id: string;
  url: string;
  customer_id?: string;
  product_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CreemSubscription {
  id: string;
  customer_id: string;
  product_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  current_period_start: number;
  current_period_end: number;
  created: number;
}

export interface CreemCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreemPaymentLink {
  id: string;
  url: string;
  product_id: string;
  customer_email?: string;
  success_url: string;
  cancel_url: string;
}

export class CreemAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = CREEM_CONFIG.API_KEY;
    this.baseUrl = CREEM_CONFIG.BASE_URL;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'x-api-key': this.apiKey, // Creem 使用 x-api-key 而不是 Authorization
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log('Making Creem API request:', {
      url,
      method: options.method || 'GET',
      headers: { ...headers, 'x-api-key': '[REDACTED]' }, // 不记录 API key
      body: options.body
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('Creem API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Creem API error response:', errorData);
      throw new Error(`Creem API Error (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    console.log('Creem API success response:', data);
    return data;
  }

  // Create or get customer
  async createCustomer(email: string, name?: string, userId?: string): Promise<CreemCustomer> {
    return this.makeRequest('/v1/customers', {
      method: 'POST',
      body: JSON.stringify({
        email,
        name,
        metadata: userId ? { user_id: userId } : undefined,
      }),
    });
  }

  // Create checkout session - 后端主导模式 (Backend-driven approach)
  async createCheckoutSessionDirect(
    productId: string,
    customerEmail: string,
    successUrl: string,
    cancelUrl: string,
    userId?: string
  ): Promise<CreemPaymentLink> {
    const payload = {
      product_id: productId,
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: userId ? { user_id: userId } : undefined,
    };

    console.log('🔑 后端创建 Creem Checkout Session (类似 Stripe 模式)');
    console.log('载荷:', { ...payload, metadata: payload.metadata ? '[REDACTED]' : undefined });

    // 标准 Checkout Session 端点 (基于 Stripe 模式)
    const endpoints = [
      '/v1/checkout/sessions', // 主要端点 - 类似 Stripe
      '/v1/checkout',          // 简化版本
      '/checkout/sessions',    // 无版本号
      '/checkout',             // 最简版本
      '/v1/payment-links',     // Payment Links (备选)
      '/payment-links'         // 简化 Payment Links
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const result = await this.makeRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        
        console.log(`Success with endpoint ${endpoint}:`, result);
        
        return {
          id: result.id || result.payment_link_id || `link_${Date.now()}`,
          url: result.url || result.payment_url || result.checkout_url || result.link,
          product_id: productId,
          customer_email: customerEmail,
          success_url: successUrl,
          cancel_url: cancelUrl,
        };
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    throw new Error('所有 Creem API 端点都失败了，请检查 API 密钥和端点配置');
  }

  // Create subscription using different approaches
  async createSubscription(
    productId: string,
    customerEmail: string,
    successUrl: string,
    cancelUrl: string,
    userId?: string
  ): Promise<any> {
    // Method 1: Try direct subscription creation
    const subscriptionPayload = {
      product_id: productId,
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: userId ? { user_id: userId } : undefined,
    };

    const subscriptionEndpoints = [
      '/v1/subscriptions',
      '/v1/products/subscribe',
      '/v1/checkout/subscription',
      '/api/v1/subscriptions'
    ];

    for (const endpoint of subscriptionEndpoints) {
      try {
        console.log(`Trying subscription endpoint: ${endpoint}`);
        return await this.makeRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(subscriptionPayload),
        });
      } catch (error) {
        console.log(`Subscription endpoint ${endpoint} failed:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    // Method 2: Try customer + subscription approach
    try {
      const customer = await this.createCustomer(customerEmail, undefined, userId);
      return await this.makeRequest('/v1/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          customer_id: customer.id,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });
    } catch (error) {
      console.log('Customer + subscription approach failed:', error);
    }

    throw new Error('无法创建订阅，所有方法都失败了');
  }

  // Main checkout session creation method
  async createCheckoutSession(
    productId: string,
    customerEmail: string,
    successUrl: string,
    cancelUrl: string,
    userId?: string
  ): Promise<CreemCheckoutSession> {
    console.log('Creating Creem checkout session with params:', {
      productId,
      customerEmail,
      successUrl,
      cancelUrl,
      userId
    });

    try {
      // Try direct checkout session creation first (based on official docs)
      const checkoutSession = await this.createCheckoutSessionDirect(productId, customerEmail, successUrl, cancelUrl, userId);
      return {
        id: checkoutSession.id,
        url: checkoutSession.url,
        product_id: productId,
        success_url: successUrl,
        cancel_url: cancelUrl,
      };
    } catch (checkoutError) {
      console.log('Direct checkout session creation failed, trying subscription approach:', checkoutError);
      
      try {
        // Try subscription approach
        const subscription = await this.createSubscription(productId, customerEmail, successUrl, cancelUrl, userId);
        return {
          id: subscription.id || `session_${Date.now()}`,
          url: subscription.checkout_url || subscription.payment_url || subscription.url || `${successUrl}?fallback=true`,
          product_id: productId,
          success_url: successUrl,
          cancel_url: cancelUrl,
        };
      } catch (subscriptionError) {
        console.error('Both payment link and subscription creation failed');
        throw new Error(`Creem API 集成失败: Checkout Error: ${checkoutError instanceof Error ? checkoutError.message : checkoutError}, Subscription Error: ${subscriptionError instanceof Error ? subscriptionError.message : subscriptionError}`);
      }
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string): Promise<CreemSubscription> {
    return this.makeRequest(`/v1/subscriptions/${subscriptionId}`);
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<CreemSubscription> {
    return this.makeRequest(`/v1/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  // Get customer subscriptions
  async getCustomerSubscriptions(customerId: string): Promise<CreemSubscription[]> {
    const response = await this.makeRequest(`/v1/customers/${customerId}/subscriptions`);
    return response.data || [];
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Pick<CreemSubscription, 'product_id'>>
  ): Promise<CreemSubscription> {
    return this.makeRequest(`/v1/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
}

export const creemAPI = new CreemAPI();