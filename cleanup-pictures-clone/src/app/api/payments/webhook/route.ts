import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CREEM_CONFIG } from '@/lib/creem-config';
import { 
  createUserSubscription, 
  updateUserSubscription, 
  getUserSubscription 
} from '@/lib/supabase';
import { SubscriptionPlan } from '@/lib/creem-config';
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Creem signatures are typically prefixed with 'sha256='
    const receivedSignature = signature.startsWith('sha256=') 
      ? signature.slice(7) 
      : signature;
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (error) {
    console.error('签名验证失败:', error);
    return false;
  }
}

function getSubscriptionPlanFromProductId(productId: string): SubscriptionPlan | null {
  if (productId === CREEM_CONFIG.PLANS.PERSONAL.id) {
    return 'personal';
  }
  if (productId === CREEM_CONFIG.PLANS.TEAM.id) {
    return 'team';
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('creem-signature') || '';
    
    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, CREEM_CONFIG.WEBHOOK_SECRET)) {
      console.error('Webhook签名验证失败');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    console.log('收到Creem webhook事件:', event.type, event.id);

    const supabase = createServerComponentClient({ cookies });

    switch (event.type) {
      case 'subscription.created':
      case 'subscription.activated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        const customerId = subscription.customer_id;
        const productId = subscription.product_id;
        
        if (!userId) {
          console.error('Webhook事件缺少用户ID');
          return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        const plan = getSubscriptionPlanFromProductId(productId);
        if (!plan) {
          console.error('未知的产品ID:', productId);
          return NextResponse.json({ error: 'Unknown product ID' }, { status: 400 });
        }

        // Create or update user subscription
        const existingSubscription = await getUserSubscription(userId);
        
        if (existingSubscription) {
          await updateUserSubscription(existingSubscription.id, {
            plan,
            creem_subscription_id: subscription.id,
            creem_customer_id: customerId,
            status: 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });
        } else {
          await createUserSubscription(userId, plan, subscription.id, customerId);
        }

        console.log(`用户 ${userId} 的订阅已激活:`, plan);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        
        if (!userId) {
          console.error('Webhook事件缺少用户ID');
          return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        const existingSubscription = await getUserSubscription(userId);
        if (existingSubscription) {
          await updateUserSubscription(existingSubscription.id, {
            status: 'cancelled',
          });
        }

        console.log(`用户 ${userId} 的订阅已取消`);
        break;
      }

      case 'subscription.past_due': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        
        if (!userId) {
          console.error('Webhook事件缺少用户ID');
          return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        const existingSubscription = await getUserSubscription(userId);
        if (existingSubscription) {
          await updateUserSubscription(existingSubscription.id, {
            status: 'past_due',
          });
        }

        console.log(`用户 ${userId} 的订阅已逾期`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription_id;
        
        // You can add additional logic here for successful payments
        console.log('支付成功:', subscriptionId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription_id;
        
        // You can add additional logic here for failed payments
        console.log('支付失败:', subscriptionId);
        break;
      }

      default:
        console.log('未处理的webhook事件类型:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('处理webhook事件失败:', error);
    
    return NextResponse.json(
      { 
        error: '处理webhook事件失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}