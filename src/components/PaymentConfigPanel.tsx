import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  Euro, 
  Banknote, 
  Building2, 
  Shield, 
  Key, 
  Check, 
  AlertTriangle, 
  Save, 
  Eye, 
  EyeOff,
  Copy,
  RefreshCw,
  Globe,
  Settings,
  Wallet,
  Lock,
  Info
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

// Types
interface PaymentConfig {
  stripe: {
    enabled: boolean;
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    accountId: string;
  };
  paypal: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
    webhookId: string;
  };
  alipay: {
    enabled: boolean;
    appId: string;
    privateKey: string;
    publicKey: string;
    partnerId: string;
  };
  wechatPay: {
    enabled: boolean;
    appId: string;
    mchId: string;
    apiKey: string;
    certPath: string;
  };
  bankAccount: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    swift: string;
    country: string;
  };
  taxSettings: {
    vatNumber: string;
    taxId: string;
    businessAddress: string;
    defaultTaxRate: number;
  };
}

export function PaymentConfigPanel() {
  const { t, language } = useContext(LanguageContext);
  const { user } = useAuth();
  
  // States
  const [config, setConfig] = useState<PaymentConfig>({
    stripe: {
      enabled: false,
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
      accountId: '',
    },
    paypal: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      mode: 'sandbox',
      webhookId: '',
    },
    alipay: {
      enabled: false,
      appId: '',
      privateKey: '',
      publicKey: '',
      partnerId: '',
    },
    wechatPay: {
      enabled: false,
      appId: '',
      mchId: '',
      apiKey: '',
      certPath: '',
    },
    bankAccount: {
      accountName: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      swift: '',
      country: '',
    },
    taxSettings: {
      vatNumber: '',
      taxId: '',
      businessAddress: '',
      defaultTaxRate: 0,
    },
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('stripe');

  // Load payment configuration
  const loadPaymentConfig = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-851310fa/admin/payment-config`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error loading payment config:', error);
      toast.error(language === 'zh' ? '加载收款配置失败' : 'Failed to load payment configuration');
    } finally {
      setLoading(false);
    }
  };

  // Save payment configuration
  const savePaymentConfig = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-851310fa/admin/payment-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(language === 'zh' ? '收款配置保存成功' : 'Payment configuration saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving payment config:', error);
      toast.error(language === 'zh' ? '保存收款配置失败' : 'Failed to save payment configuration');
    } finally {
      setSaving(false);
    }
  };

  // Toggle secret visibility
  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(language === 'zh' ? `${label} 已复制到剪贴板` : `${label} copied to clipboard`);
  };

  // Update config
  const updateConfig = (path: string[], value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      let current = newConfig;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i] as keyof typeof current] as any;
      }
      
      current[path[path.length - 1] as keyof typeof current] = value;
      return newConfig;
    });
  };

  // Initialize
  useEffect(() => {
    loadPaymentConfig();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'zh' ? '加载收款配置...' : 'Loading payment configuration...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">
            {language === 'zh' ? '收款配置' : 'Payment Configuration'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {language === 'zh' 
              ? '配置各种支付方式的收款账户信息和相关设置' 
              : 'Configure payment account information and settings for various payment methods'
            }
          </p>
        </div>
        <Button onClick={savePaymentConfig} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              {language === 'zh' ? '保存中...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {language === 'zh' ? '保存配置' : 'Save Configuration'}
            </>
          )}
        </Button>
      </div>

      {/* Security Notice */}
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          {language === 'zh' 
            ? '敏感信息将被加密存储。请确保API密钥和私钥的安全性，不要与他人分享。'
            : 'Sensitive information will be encrypted and stored securely. Please ensure the security of API keys and private keys, and do not share them with others.'
          }
        </AlertDescription>
      </Alert>

      {/* Payment Methods Configuration */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="stripe" className="text-xs">
            <CreditCard className="h-3 w-3 mr-1" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="paypal" className="text-xs">
            <Wallet className="h-3 w-3 mr-1" />
            PayPal
          </TabsTrigger>
          <TabsTrigger value="alipay" className="text-xs">
            <DollarSign className="h-3 w-3 mr-1" />
            {language === 'zh' ? '支付宝' : 'Alipay'}
          </TabsTrigger>
          <TabsTrigger value="wechat" className="text-xs">
            <Banknote className="h-3 w-3 mr-1" />
            {language === 'zh' ? '微信' : 'WeChat'}
          </TabsTrigger>
          <TabsTrigger value="bank" className="text-xs">
            <Building2 className="h-3 w-3 mr-1" />
            {language === 'zh' ? '银行' : 'Bank'}
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            {language === 'zh' ? '税务' : 'Tax'}
          </TabsTrigger>
        </TabsList>

        {/* Stripe Configuration */}
        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-indigo-500" />
                    <span>Stripe {language === 'zh' ? '配置' : 'Configuration'}</span>
                  </CardTitle>
                  <CardDescription>
                    {language === 'zh' 
                      ? '配置Stripe信用卡支付服务，支持全球40+国家收款'
                      : 'Configure Stripe credit card payment service, supporting payments from 40+ countries worldwide'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.stripe.enabled}
                    onCheckedChange={(enabled) => updateConfig(['stripe', 'enabled'], enabled)}
                  />
                  <Badge variant={config.stripe.enabled ? 'default' : 'secondary'}>
                    {config.stripe.enabled ? (language === 'zh' ? '已启用' : 'Enabled') : (language === 'zh' ? '已禁用' : 'Disabled')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-publishable">
                    {language === 'zh' ? '可发布密钥' : 'Publishable Key'}
                    <span className="text-green-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="stripe-publishable"
                      placeholder="pk_live_..."
                      value={config.stripe.publishableKey}
                      onChange={(e) => updateConfig(['stripe', 'publishableKey'], e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0"
                      onClick={() => copyToClipboard(config.stripe.publishableKey, 'Publishable Key')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripe-secret">
                    {language === 'zh' ? '私钥' : 'Secret Key'}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="stripe-secret"
                      type={showSecrets['stripe-secret'] ? 'text' : 'password'}
                      placeholder="sk_live_..."
                      value={config.stripe.secretKey}
                      onChange={(e) => updateConfig(['stripe', 'secretKey'], e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0"
                      onClick={() => toggleSecretVisibility('stripe-secret')}
                    >
                      {showSecrets['stripe-secret'] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripe-webhook">
                    {language === 'zh' ? 'Webhook密钥' : 'Webhook Secret'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="stripe-webhook"
                      type={showSecrets['stripe-webhook'] ? 'text' : 'password'}
                      placeholder="whsec_..."
                      value={config.stripe.webhookSecret}
                      onChange={(e) => updateConfig(['stripe', 'webhookSecret'], e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0"
                      onClick={() => toggleSecretVisibility('stripe-webhook')}
                    >
                      {showSecrets['stripe-webhook'] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripe-account">
                    {language === 'zh' ? '账户ID' : 'Account ID'}
                  </Label>
                  <Input
                    id="stripe-account"
                    placeholder="acct_..."
                    value={config.stripe.accountId}
                    onChange={(e) => updateConfig(['stripe', 'accountId'], e.target.value)}
                  />
                </div>
              </div>
              
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                  {language === 'zh' 
                    ? 'Webhook URL: https://your-domain.supabase.co/functions/v1/make-server-851310fa/payment/webhook'
                    : 'Webhook URL: https://your-domain.supabase.co/functions/v1/make-server-851310fa/payment/webhook'
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PayPal Configuration */}
        <TabsContent value="paypal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-blue-500" />
                    <span>PayPal {language === 'zh' ? '配置' : 'Configuration'}</span>
                  </CardTitle>
                  <CardDescription>
                    {language === 'zh' 
                      ? '配置PayPal支付服务，支持全球200+国家收款'
                      : 'Configure PayPal payment service, supporting payments from 200+ countries worldwide'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.paypal.enabled}
                    onCheckedChange={(enabled) => updateConfig(['paypal', 'enabled'], enabled)}
                  />
                  <Badge variant={config.paypal.enabled ? 'default' : 'secondary'}>
                    {config.paypal.enabled ? (language === 'zh' ? '已启用' : 'Enabled') : (language === 'zh' ? '已禁用' : 'Disabled')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-id">
                    {language === 'zh' ? '客户端ID' : 'Client ID'}
                    <span className="text-green-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="paypal-client-id"
                    value={config.paypal.clientId}
                    onChange={(e) => updateConfig(['paypal', 'clientId'], e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-secret">
                    {language === 'zh' ? '客户端密钥' : 'Client Secret'}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="paypal-client-secret"
                      type={showSecrets['paypal-secret'] ? 'text' : 'password'}
                      value={config.paypal.clientSecret}
                      onChange={(e) => updateConfig(['paypal', 'clientSecret'], e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0"
                      onClick={() => toggleSecretVisibility('paypal-secret')}
                    >
                      {showSecrets['paypal-secret'] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paypal-mode">
                    {language === 'zh' ? '运行模式' : 'Mode'}
                  </Label>
                  <select
                    id="paypal-mode"
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-background"
                    value={config.paypal.mode}
                    onChange={(e) => updateConfig(['paypal', 'mode'], e.target.value)}
                  >
                    <option value="sandbox">{language === 'zh' ? '沙盒模式' : 'Sandbox'}</option>
                    <option value="live">{language === 'zh' ? '生产模式' : 'Live'}</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paypal-webhook">
                    {language === 'zh' ? 'Webhook ID' : 'Webhook ID'}
                  </Label>
                  <Input
                    id="paypal-webhook"
                    value={config.paypal.webhookId}
                    onChange={(e) => updateConfig(['paypal', 'webhookId'], e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Account Configuration */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-green-500" />
                <span>{language === 'zh' ? '银行账户信息' : 'Bank Account Information'}</span>
              </CardTitle>
              <CardDescription>
                {language === 'zh' 
                  ? '配置收款银行账户信息，用于接收资金转账'
                  : 'Configure bank account information for receiving fund transfers'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">
                    {language === 'zh' ? '账户名称' : 'Account Name'}
                  </Label>
                  <Input
                    id="account-name"
                    value={config.bankAccount.accountName}
                    onChange={(e) => updateConfig(['bankAccount', 'accountName'], e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank-name">
                    {language === 'zh' ? '银行名称' : 'Bank Name'}
                  </Label>
                  <Input
                    id="bank-name"
                    value={config.bankAccount.bankName}
                    onChange={(e) => updateConfig(['bankAccount', 'bankName'], e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account-number">
                    {language === 'zh' ? '账户号码' : 'Account Number'}
                  </Label>
                  <Input
                    id="account-number"
                    value={config.bankAccount.accountNumber}
                    onChange={(e) => updateConfig(['bankAccount', 'accountNumber'], e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="routing-number">
                    {language === 'zh' ? '路由号码' : 'Routing Number'}
                  </Label>
                  <Input
                    id="routing-number"
                    value={config.bankAccount.routingNumber}
                    onChange={(e) => updateConfig(['bankAccount', 'routingNumber'], e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="swift">
                    {language === 'zh' ? 'SWIFT代码' : 'SWIFT Code'}
                  </Label>
                  <Input
                    id="swift"
                    value={config.bankAccount.swift}
                    onChange={(e) => updateConfig(['bankAccount', 'swift'], e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">
                    {language === 'zh' ? '国家/地区' : 'Country/Region'}
                  </Label>
                  <Input
                    id="country"
                    value={config.bankAccount.country}
                    onChange={(e) => updateConfig(['bankAccount', 'country'], e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-500" />
                <span>{language === 'zh' ? '税务设置' : 'Tax Settings'}</span>
              </CardTitle>
              <CardDescription>
                {language === 'zh' 
                  ? '配置税务相关信息和税率设置'
                  : 'Configure tax-related information and tax rate settings'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vat-number">
                    {language === 'zh' ? '增值税号' : 'VAT Number'}
                  </Label>
                  <Input
                    id="vat-number"
                    value={config.taxSettings.vatNumber}
                    onChange={(e) => updateConfig(['taxSettings', 'vatNumber'], e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tax-id">
                    {language === 'zh' ? '税务ID' : 'Tax ID'}
                  </Label>
                  <Input
                    id="tax-id"
                    value={config.taxSettings.taxId}
                    onChange={(e) => updateConfig(['taxSettings', 'taxId'], e.target.value)}
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="business-address">
                    {language === 'zh' ? '营业地址' : 'Business Address'}
                  </Label>
                  <Textarea
                    id="business-address"
                    value={config.taxSettings.businessAddress}
                    onChange={(e) => updateConfig(['taxSettings', 'businessAddress'], e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-tax-rate">
                    {language === 'zh' ? '默认税率 (%)' : 'Default Tax Rate (%)'}
                  </Label>
                  <Input
                    id="default-tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={config.taxSettings.defaultTaxRate}
                    onChange={(e) => updateConfig(['taxSettings', 'defaultTaxRate'], parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}