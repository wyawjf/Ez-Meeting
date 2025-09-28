import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Check, 
  Crown, 
  Star, 
  Zap, 
  Clock, 
  Users, 
  Shield, 
  Headphones, 
  Sparkles,
  Globe,
  DollarSign,
  Euro,
  Banknote,
  CircleDollarSign,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Settings
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { PaymentModal } from './PaymentModal';

// Types
interface PricingPlan {
  id: string;
  accountType: 'free' | 'pro' | 'enterprise' | 'custom';
  name: string;
  description: string;
  features: string[];
  
  // Pricing structure (supports both old and new formats)
  prices?: {
    CNY: number;
    USD: number;
    EUR: number;
    GBP: number;
  };
  monthlyPrice?: number;
  yearlyPrice?: number;
  yearlyDiscount?: number;
  
  // Usage limits
  dailyMinutes: number;
  monthlyMinutes: number;
  maxNotes?: number;
  aiSummaryLimit?: number;
  
  // Display settings
  isActive: boolean;
  isPopular?: boolean;
  displayOrder?: number;
  trialDays?: number;
}

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  icon: React.ComponentType<any>;
  locale: string;
}

// Currency configurations
const CURRENCIES: Record<string, CurrencyInfo> = {
  CNY: { code: 'CNY', symbol: '¥', name: '人民币', icon: Banknote, locale: 'zh-CN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', icon: DollarSign, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', icon: Euro, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', icon: CircleDollarSign, locale: 'en-GB' }
};

export function PricingPage() {
  const { t, language } = useContext(LanguageContext);
  const { user } = useAuth();
  
  // States
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('CNY');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingPurchase, setProcessingPurchase] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  // Load pricing plans from backend (public endpoint)
  const loadPricingPlans = async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 Loading pricing plans from backend...');
      
      // Use the public pricing endpoint (not admin endpoint)
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-851310fa/pricing-plans`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Received pricing data:', data);
        
        if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          // Convert and filter active plans
          const convertedPlans = data.plans
            .filter((plan: any) => plan.isActive !== false) // Only show active plans
            .map((plan: any) => convertBackendPlan(plan))
            .sort((a: PricingPlan, b: PricingPlan) => {
              // Sort by displayOrder if available, otherwise by default order
              const orderA = a.displayOrder || getDefaultOrder(a.accountType);
              const orderB = b.displayOrder || getDefaultOrder(b.accountType);
              return orderA - orderB;
            });
          
          console.log('✅ Converted pricing plans:', convertedPlans);
          setPricingPlans(convertedPlans);
          setError(null);
          return;
        }
      }

      // If backend fails, use default plans
      console.log('⚠️ Backend failed, using default plans');
      setPricingPlans(getDefaultPricingPlans());
      setError(null);
      
    } catch (error) {
      console.error('❌ Error loading pricing plans:', error);
      setPricingPlans(getDefaultPricingPlans());
      setError('Failed to load pricing plans');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Convert backend plan format to frontend format
  const convertBackendPlan = (backendPlan: any): PricingPlan => {
    console.log('🔄 Converting backend plan:', backendPlan);
    
    // Handle both old and new format data
    const monthlyPrice = backendPlan.monthlyPrice || backendPlan.prices?.USD || 0;
    const yearlyPrice = backendPlan.yearlyPrice || (monthlyPrice * 12 * (1 - (backendPlan.yearlyDiscount || 0) / 100));
    
    // Generate prices for all currencies based on USD
    const prices = backendPlan.prices || {
      CNY: Math.round(monthlyPrice * 7.2), // Approximate exchange rate
      USD: monthlyPrice,
      EUR: Math.round(monthlyPrice * 0.85 * 100) / 100,
      GBP: Math.round(monthlyPrice * 0.8 * 100) / 100
    };
    
    const converted: PricingPlan = {
      id: backendPlan.id,
      accountType: backendPlan.accountType,
      name: backendPlan.name || getLocalizedPlanName(backendPlan.accountType),
      description: backendPlan.description || getLocalizedPlanDescription(backendPlan.accountType),
      features: backendPlan.features || getDefaultFeatures(backendPlan.accountType),
      prices,
      monthlyPrice,
      yearlyPrice,
      yearlyDiscount: backendPlan.yearlyDiscount || 0,
      dailyMinutes: backendPlan.dailyMinutes !== undefined ? backendPlan.dailyMinutes : getDefaultDailyMinutes(backendPlan.accountType),
      monthlyMinutes: backendPlan.monthlyMinutes !== undefined ? backendPlan.monthlyMinutes : getDefaultMonthlyMinutes(backendPlan.accountType),
      maxNotes: backendPlan.maxNotes,
      aiSummaryLimit: backendPlan.aiSummaryLimit,
      isActive: backendPlan.isActive !== false,
      isPopular: backendPlan.isPopular || backendPlan.accountType === 'pro',
      displayOrder: backendPlan.displayOrder,
      trialDays: backendPlan.trialDays || 0
    };
    
    console.log('✅ Converted plan:', converted);
    return converted;
  };

  // Get default order for sorting
  const getDefaultOrder = (accountType: string): number => {
    const orders = { free: 1, pro: 2, enterprise: 3, custom: 4 };
    return orders[accountType as keyof typeof orders] || 5;
  };

  // Get default daily minutes for account types
  const getDefaultDailyMinutes = (accountType: string): number => {
    const defaults = { free: 150, pro: -1, enterprise: -1, custom: 150 };
    return defaults[accountType as keyof typeof defaults] || 150;
  };

  // Get default monthly minutes for account types
  const getDefaultMonthlyMinutes = (accountType: string): number => {
    const defaults = { free: 1000, pro: -1, enterprise: -1, custom: 1000 };
    return defaults[accountType as keyof typeof defaults] || 1000;
  };

  // Get default features for account types
  const getDefaultFeatures = (accountType: string): string[] => {
    const features = {
      free: [
        language === 'zh' ? '每日 150 分钟转录' : '150 minutes daily transcription',
        language === 'zh' ? '基础语音识别' : 'Basic speech recognition',
        language === 'zh' ? '标准翻译质量' : 'Standard translation quality',
        language === 'zh' ? '导出功能' : 'Export functionality',
        language === 'zh' ? '基础客服支持' : 'Basic customer support'
      ],
      pro: [
        language === 'zh' ? '无限制使用时长' : 'Unlimited usage time',
        language === 'zh' ? '高精度语音识别' : 'High-accuracy speech recognition',
        language === 'zh' ? '专业级翻译质量' : 'Professional translation quality',
        language === 'zh' ? 'AI智能总结' : 'AI-powered summaries',
        language === 'zh' ? '优先客服支持' : 'Priority customer support',
        language === 'zh' ? '会议录音与转录' : 'Meeting recording & transcription',
        language === 'zh' ? '高级导出格式' : 'Advanced export formats'
      ],
      enterprise: [
        language === 'zh' ? '无限制团队使用' : 'Unlimited team usage',
        language === 'zh' ? '企业级安全保护' : 'Enterprise-grade security',
        language === 'zh' ? '定制化集成方案' : 'Custom integration solutions',
        language === 'zh' ? '团队协作工具' : 'Team collaboration tools',
        language === 'zh' ? '数据分析报告' : 'Data analytics & reporting',
        language === 'zh' ? '24/7 专属客服' : '24/7 dedicated support',
        language === 'zh' ? 'API 接口访问' : 'API access',
        language === 'zh' ? '私有云部署选项' : 'Private cloud deployment option'
      ],
      custom: [
        language === 'zh' ? '自定义功能配置' : 'Custom feature configuration',
        language === 'zh' ? '专属客服支持' : 'Dedicated customer support',
        language === 'zh' ? '灵活的使用限制' : 'Flexible usage limits'
      ]
    };
    return features[accountType as keyof typeof features] || [];
  };

  // Get default pricing plans (fallback)
  const getDefaultPricingPlans = (): PricingPlan[] => [
    {
      id: 'free',
      accountType: 'free',
      name: language === 'zh' ? '免费版' : 'Free Plan',
      description: language === 'zh' ? '适合个人用户体验基础功能' : 'Perfect for individuals to try basic features',
      features: getDefaultFeatures('free'),
      prices: { CNY: 0, USD: 0, EUR: 0, GBP: 0 },
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyDiscount: 0,
      dailyMinutes: 150,
      monthlyMinutes: 1000,
      maxNotes: 50,
      aiSummaryLimit: 0,
      isActive: true,
      isPopular: false,
      displayOrder: 1,
      trialDays: 0
    },
    {
      id: 'pro',
      accountType: 'pro',
      name: language === 'zh' ? 'Pro 专业版' : 'Pro Plan',
      description: language === 'zh' ? '适合商务人士和专业用户的高级功能' : 'Advanced features for business professionals',
      features: getDefaultFeatures('pro'),
      prices: { CNY: 99, USD: 14.99, EUR: 12.99, GBP: 11.99 },
      monthlyPrice: 14.99,
      yearlyPrice: 149.99,
      yearlyDiscount: 17,
      dailyMinutes: -1,
      monthlyMinutes: -1,
      maxNotes: 500,
      aiSummaryLimit: 50,
      isActive: true,
      isPopular: true,
      displayOrder: 2,
      trialDays: 7
    },
    {
      id: 'enterprise',
      accountType: 'enterprise',
      name: language === 'zh' ? '企业版' : 'Enterprise Plan',
      description: language === 'zh' ? '为大型团队和企业定制的全方位解决方案' : 'Comprehensive solution for large teams and enterprises',
      features: getDefaultFeatures('enterprise'),
      prices: { CNY: 299, USD: 49.99, EUR: 39.99, GBP: 34.99 },
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      yearlyDiscount: 17,
      dailyMinutes: -1,
      monthlyMinutes: -1,
      maxNotes: -1,
      aiSummaryLimit: -1,
      isActive: true,
      isPopular: false,
      displayOrder: 3,
      trialDays: 14
    }
  ];

  // Get localized plan names
  const getLocalizedPlanName = (accountType: string) => {
    const names = {
      free: language === 'zh' ? '免费版' : 'Free Plan',
      pro: language === 'zh' ? 'Pro 专业版' : 'Pro Plan',
      enterprise: language === 'zh' ? '企业版' : 'Enterprise Plan',
      custom: language === 'zh' ? '自定义方案' : 'Custom Plan'
    };
    return names[accountType as keyof typeof names] || accountType;
  };

  // Get localized plan descriptions
  const getLocalizedPlanDescription = (accountType: string) => {
    const descriptions = {
      free: language === 'zh' ? '适合个人用户体验基础功能' : 'Perfect for individuals to try basic features',
      pro: language === 'zh' ? '适合商务人士和专业用户的高级功能' : 'Advanced features for business professionals',
      enterprise: language === 'zh' ? '为大型团队和企业定制的全方位解决方案' : 'Comprehensive solution for large teams and enterprises',
      custom: language === 'zh' ? '为特殊需求定制的专属方案' : 'Tailored solution for specific requirements'
    };
    return descriptions[accountType as keyof typeof descriptions] || '';
  };

  // Format currency price
  const formatPrice = (amount: number, currency: string) => {
    if (amount === 0) return language === 'zh' ? '免费' : 'Free';
    
    const currencyInfo = CURRENCIES[currency];
    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'CNY' ? 0 : 2,
      maximumFractionDigits: currency === 'CNY' ? 0 : 2,
    }).format(amount);
  };

  // Handle currency change
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    localStorage.setItem('ezmeeting-preferred-currency', currency);
  };

  // Handle purchase
  const handlePurchase = async (plan: PricingPlan) => {
    if (!user) {
      toast.error(language === 'zh' ? '请先登录以购买套餐' : 'Please login to purchase a plan');
      window.location.href = '/login';
      return;
    }

    if (plan.accountType === 'free') {
      toast.info(language === 'zh' ? '您已在使用免费版本' : 'You are already using the free plan');
      return;
    }

    // Open payment modal
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  // Get plan badge
  const getPlanBadge = (accountType: string) => {
    const configs = {
      free: { 
        icon: Zap, 
        label: 'Free', 
        className: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' 
      },
      pro: { 
        icon: Star, 
        label: 'Pro', 
        className: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
      },
      enterprise: { 
        icon: Crown, 
        label: 'Enterprise', 
        className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
      },
      custom: {
        icon: Settings,
        label: 'Custom',
        className: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
      }
    };
    
    const config = configs[accountType as keyof typeof configs] || configs.free;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`text-xs font-medium ${config.className}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Initialize data
  useEffect(() => {
    // Load saved currency preference
    const savedCurrency = localStorage.getItem('ezmeeting-preferred-currency');
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setSelectedCurrency(savedCurrency);
    } else {
      // Auto-detect currency based on language
      const defaultCurrency = language === 'zh' ? 'CNY' : 'USD';
      setSelectedCurrency(defaultCurrency);
    }

    loadPricingPlans();
  }, []);

  // Refresh when language changes
  useEffect(() => {
    if (!loading && pricingPlans.length > 0) {
      // Re-localize plan names and descriptions when language changes
      const updatedPlans = pricingPlans.map(plan => ({
        ...plan,
        name: plan.name.includes('Plan') || plan.name.includes('版') 
          ? getLocalizedPlanName(plan.accountType) 
          : plan.name, // Keep custom names as-is
        description: plan.description.includes('features') || plan.description.includes('功能')
          ? getLocalizedPlanDescription(plan.accountType)
          : plan.description, // Keep custom descriptions as-is
        features: plan.features.length === getDefaultFeatures(plan.accountType).length
          ? getDefaultFeatures(plan.accountType)
          : plan.features // Keep custom features as-is
      }));
      setPricingPlans(updatedPlans);
    }
  }, [language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400">
              {language === 'zh' ? '加载定价信息...' : 'Loading pricing information...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-slate-500/10"></div>
        <div className="relative px-6 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {language === 'zh' ? '选择适合您的套餐' : 'Choose Your Perfect Plan'}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                {language === 'zh' 
                  ? '从免费体验到企业级解决方案，Ez Meeting 为不同需求提供灵活的定价选择。'
                  : 'From free trials to enterprise solutions, Ez Meeting offers flexible pricing for every need.'
                }
              </p>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {language === 'zh' ? '选择货币：' : 'Select Currency:'}
                </span>
              </div>
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCIES).map(([code, currency]) => {
                    const IconComponent = currency.icon;
                    return (
                      <SelectItem key={code} value={code}>
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{currency.symbol} {currency.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPricingPlans()}
                disabled={isRefreshing}
                className="border-slate-200 dark:border-slate-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {language === 'zh' ? '刷新' : 'Refresh'}
              </Button>
            </div>

            {error && (
              <div className="flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className={`grid gap-8 ${pricingPlans.length <= 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {pricingPlans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={`relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 ${
                  plan.isPopular ? 'ring-2 ring-indigo-500 ring-opacity-50 scale-105' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {language === 'zh' ? '最受欢迎' : 'Most Popular'}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center space-y-4 pt-8">
                  <div className="flex items-center justify-center space-x-3">
                    {getPlanBadge(plan.accountType)}
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                  </div>
                  
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {plan.description}
                  </p>

                  <div className="space-y-2">
                    <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {plan.prices 
                        ? formatPrice(plan.prices[selectedCurrency as keyof typeof plan.prices], selectedCurrency)
                        : formatPrice(plan.monthlyPrice || 0, selectedCurrency)
                      }
                    </div>
                    {((plan.prices && plan.prices[selectedCurrency as keyof typeof plan.prices] > 0) || (plan.monthlyPrice && plan.monthlyPrice > 0)) && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {language === 'zh' ? '每月' : 'per month'}
                      </div>
                    )}
                    {plan.yearlyDiscount && plan.yearlyDiscount > 0 && (
                      <div className="text-xs text-green-600">
                        {language === 'zh' ? `年付可省 ${plan.yearlyDiscount}%` : `Save ${plan.yearlyDiscount}% annually`}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Usage Info */}
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-indigo-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {plan.dailyMinutes === -1 
                          ? (language === 'zh' ? '无限制使用' : 'Unlimited Usage')
                          : language === 'zh' 
                            ? `每日 ${plan.dailyMinutes} 分钟`
                            : `${plan.dailyMinutes} minutes daily`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <Check className="h-4 w-4 text-green-500" />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={() => handlePurchase(plan)}
                    disabled={processingPurchase === plan.id}
                    className={`w-full ${
                      plan.accountType === 'free'
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        : plan.accountType === 'pro'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                        : plan.accountType === 'enterprise'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white'
                    }`}
                  >
                    {processingPurchase === plan.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {language === 'zh' ? '处理中...' : 'Processing...'}
                      </>
                    ) : plan.accountType === 'free' ? (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '开始免费使用' : 'Start Free'}
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '立即购买' : 'Buy Now'}
                      </>
                    )}
                  </Button>

                  {/* Contact Sales for Enterprise */}
                  {plan.accountType === 'enterprise' && (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs border-slate-200 dark:border-slate-700"
                        onClick={() => {
                          toast.info(language === 'zh' ? '请联系客服：support@ezmeeting.com' : 'Contact sales: support@ezmeeting.com');
                        }}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {language === 'zh' ? '联系销售' : 'Contact Sales'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center space-y-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {language === 'zh' ? '为什么选择 Ez Meeting？' : 'Why Choose Ez Meeting?'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="flex flex-col items-center space-y-2">
                  <Shield className="h-8 w-8 text-indigo-500" />
                  <h3 className="font-medium">{language === 'zh' ? '安全可靠' : 'Secure & Reliable'}</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {language === 'zh' ? '企业级数据加密和隐私保护' : 'Enterprise-grade encryption and privacy protection'}
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Headphones className="h-8 w-8 text-indigo-500" />
                  <h3 className="font-medium">{language === 'zh' ? '专业客服' : 'Professional Support'}</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {language === 'zh' ? '7x24小时技术支持和客户服务' : '24/7 technical support and customer service'}
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Sparkles className="h-8 w-8 text-indigo-500" />
                  <h3 className="font-medium">{language === 'zh' ? '持续创新' : 'Continuous Innovation'}</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {language === 'zh' ? '定期功能更新和性能优化' : 'Regular feature updates and performance optimization'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400">
              {language === 'zh' ? (
                <>
                  * 所有套餐均支持随时取消，无额外费用。如需帮助，请联系我们的客服团队。
                </>
              ) : (
                <>
                  * All plans support cancellation at any time with no additional fees. Contact our support team if you need help.
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        selectedCurrency={selectedCurrency}
      />
    </div>
  );
}