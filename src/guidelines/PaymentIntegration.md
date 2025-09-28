# Ez Meeting 支付系统集成指南 / Payment Integration Guide

## 概述 / Overview

Ez Meeting 支持多种支付方式，包括信用卡、PayPal、支付宝和微信支付。本指南将帮助您配置和集成完整的支付系统。

Ez Meeting supports multiple payment methods including credit cards, PayPal, Alipay, and WeChat Pay. This guide will help you configure and integrate the complete payment system.

## 支持的支付方式 / Supported Payment Methods

### 1. 信用卡支付 (Stripe) / Credit Card (Stripe)

**推荐用于国际市场 / Recommended for International Markets**

#### 配置步骤 / Setup Steps:

1. **注册 Stripe 账户 / Create Stripe Account**
   - 访问 https://stripe.com
   - 注册商家账户
   - 完成身份验证和银行账户绑定

2. **获取 API 密钥 / Get API Keys**
   ```bash
   # 测试环境 / Test Environment
   STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   STRIPE_SECRET_KEY=sk_test_xxx
   
   # 生产环境 / Production Environment  
   STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   STRIPE_SECRET_KEY=sk_live_xxx
   ```

3. **配置 Webhook**
   - 在 Stripe Dashboard 中设置 Webhook URL:
   - `https://your-domain.supabase.co/functions/v1/make-server-851310fa/payment/webhook`
   - 监听事件: `payment_intent.succeeded`, `payment_intent.payment_failed`

#### 代码集成 / Code Integration:

```typescript
// 在环境变量中添加 / Add to environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 创建支付意图 / Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100, // Stripe uses cents
  currency: currency.toLowerCase(),
  metadata: {
    planId: planId,
    userId: userId
  }
});
```

### 2. PayPal 支付 / PayPal Payment

**适合全球用户 / Suitable for Global Users**

#### 配置步骤 / Setup Steps:

1. **注册 PayPal 开发者账户 / Create PayPal Developer Account**
   - 访问 https://developer.paypal.com
   - 创建应用程序
   - 获取 Client ID 和 Secret

2. **配置环境变量 / Configure Environment Variables**
   ```bash
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_client_secret
   PAYPAL_MODE=sandbox # 或 live
   ```

3. **设置 Webhook**
   - PayPal Webhook URL: `https://your-domain.supabase.co/functions/v1/make-server-851310fa/payment/webhook`
   - 监听事件: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

### 3. 支付宝 (Alipay) / Alipay Payment

**适合中国市场 / Suitable for Chinese Market**

#### 配置步骤 / Setup Steps:

1. **注册支付宝开放平台账户**
   - 访问 https://open.alipay.com
   - 创建应用并获得 APPID
   - 配置公私钥对

2. **配置环境变量**
   ```bash
   ALIPAY_APP_ID=your_app_id
   ALIPAY_PRIVATE_KEY=your_private_key
   ALIPAY_PUBLIC_KEY=alipay_public_key
   ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
   ```

### 4. 微信支付 (WeChat Pay) / WeChat Pay

**适合中国市场 / Suitable for Chinese Market**

#### 配置步骤 / Setup Steps:

1. **注册微信支付商户号**
   - 访问 https://pay.weixin.qq.com
   - 申请商户号并完成认证
   - 获取 API 密钥

2. **配置环境变量**
   ```bash
   WECHAT_PAY_APP_ID=your_app_id
   WECHAT_PAY_MCH_ID=your_merchant_id
   WECHAT_PAY_API_KEY=your_api_key
   WECHAT_PAY_CERT_PATH=path_to_cert
   ```

## 收款配置 / Payment Collection Setup

### 银行账户配置 / Bank Account Configuration

1. **Stripe 收款**
   - 在 Stripe Dashboard 中添加银行账户
   - 支持全球 40+ 个国家/地区
   - 自动转账到银行账户

2. **PayPal 收款**
   - 绑定银行账户或信用卡
   - 支持全球 200+ 个国家/地区
   - 手动或自动提现

3. **支付宝收款**
   - 绑定中国大陆银行账户
   - 支持人民币结算
   - T+1 自动结算

4. **微信支付收款**
   - 绑定中国大陆银行账户
   - 支持人民币结算
   - T+1 自动结算

### 税务配置 / Tax Configuration

```typescript
// 配置税率 / Configure tax rates
const TAX_RATES = {
  'US': 0.08,    // 美国销售税 / US Sales Tax
  'CN': 0.06,    // 中国增值税 / China VAT
  'EU': 0.20,    // 欧盟增值税 / EU VAT
  'GB': 0.20,    // 英国增值税 / UK VAT
};

// 计算含税价格 / Calculate price with tax
const calculateTotalPrice = (basePrice: number, country: string) => {
  const taxRate = TAX_RATES[country] || 0;
  return basePrice * (1 + taxRate);
};
```

## 订阅管理 / Subscription Management

### 创建订阅 / Create Subscription

```typescript
// Stripe 订阅示例 / Stripe Subscription Example
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{
    price: priceId, // 在 Stripe 中预先创建的价格 ID
  }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});
```

### 订阅状态管理 / Subscription Status Management

```typescript
interface SubscriptionStatus {
  id: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

// 更新用户订阅状态 / Update user subscription status
const updateUserSubscription = async (userId: string, subscription: SubscriptionStatus) => {
  await kv.set(`user_subscription_${userId}`, subscription);
  
  // 更新用户账户类型 / Update user account type
  const userProfile = await kv.get(`user_profile_${userId}`);
  if (userProfile) {
    userProfile.accountType = getAccountTypeFromSubscription(subscription);
    await kv.set(`user_profile_${userId}`, userProfile);
  }
};
```

## 安全最佳实践 / Security Best Practices

### 1. API 密钥安全 / API Key Security

```typescript
// 使用环境变量存储敏感信息 / Use environment variables for sensitive data
const config = {
  stripe: {
    secretKey: Deno.env.get('STRIPE_SECRET_KEY'),
    publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
  },
  paypal: {
    clientId: Deno.env.get('PAYPAL_CLIENT_ID'),
    clientSecret: Deno.env.get('PAYPAL_CLIENT_SECRET'),
  }
};

// 永远不要在前端暴露私钥 / Never expose private keys in frontend
```

### 2. Webhook 验证 / Webhook Verification

```typescript
// Stripe Webhook 签名验证 / Stripe Webhook Signature Verification
const verifyStripeWebhook = (payload: string, signature: string) => {
  const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  try {
    return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
};
```

### 3. 金额验证 / Amount Validation

```typescript
// 验证支付金额 / Validate payment amount
const validatePaymentAmount = (planId: string, amount: number, currency: string) => {
  const expectedPrice = getPlanPrice(planId, currency);
  if (Math.abs(amount - expectedPrice) > 0.01) {
    throw new Error('Payment amount mismatch');
  }
};
```

## 测试配置 / Testing Configuration

### 测试卡号 / Test Card Numbers

```typescript
// Stripe 测试卡号 / Stripe Test Card Numbers
const TEST_CARDS = {
  visa: '4242424242424242',
  visa_debit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002',
  insufficient_funds: '4000000000009995'
};
```

### PayPal 沙盒 / PayPal Sandbox

```typescript
// PayPal 沙盒配置 / PayPal Sandbox Configuration
const paypalConfig = {
  mode: 'sandbox', // 或 'live'
  client_id: 'your_sandbox_client_id',
  client_secret: 'your_sandbox_client_secret'
};
```

## 错误处理 / Error Handling

### 常见错误类型 / Common Error Types

```typescript
interface PaymentError {
  type: 'card_error' | 'invalid_request_error' | 'api_error';
  code: string;
  message: string;
  param?: string;
}

// 错误处理函数 / Error handling function
const handlePaymentError = (error: PaymentError) => {
  switch (error.type) {
    case 'card_error':
      return '银行卡信息有误，请检查后重试';
    case 'invalid_request_error':
      return '请求参数错误，请联系客服';
    case 'api_error':
      return '支付服务暂时不可用，请稍后重试';
    default:
      return '支付处理失败，请重试';
  }
};
```

## 部署清单 / Deployment Checklist

### 生产环境配置 / Production Configuration

- [ ] 配置生产环境 API 密钥
- [ ] 设置 Webhook URL
- [ ] 配置银行账户信息
- [ ] 启用 HTTPS
- [ ] 配置域名验证
- [ ] 设置监控和日志
- [ ] 配置税务设置
- [ ] 测试所有支付流程

### 合规性检查 / Compliance Checklist

- [ ] PCI DSS 合规 (如果处理信用卡信息)
- [ ] GDPR 合规 (欧盟用户)
- [ ] 税务合规 (各国税法)
- [ ] 退款政策设置
- [ ] 服务条款更新
- [ ] 隐私政策更新

## 技术支持 / Technical Support

### 支付服务商文档 / Payment Provider Documentation

- **Stripe**: https://stripe.com/docs
- **PayPal**: https://developer.paypal.com/docs
- **支付宝**: https://open.alipay.com/docs
- **微信支付**: https://pay.weixin.qq.com/wiki/doc/api/index.html

### 联系方式 / Contact Information

如需技术支持，请联系：
- 邮箱: support@ezmeeting.com
- 微信: ezmeeting_support
- QQ群: 123456789

For technical support, please contact:
- Email: support@ezmeeting.com
- WeChat: ezmeeting_support
- QQ Group: 123456789