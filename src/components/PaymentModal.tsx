import React, { useState, useContext } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { 
  CreditCard, 
  Check, 
  Shield, 
  Lock, 
  AlertCircle, 
  Star, 
  Crown, 
  Zap,
  X,
  DollarSign,
  Euro,
  Banknote,
  CircleDollarSign
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { apiRoutes } from '../utils/api/endpoints';
import { toast } from 'sonner@2.0.3';

// Types
interface PricingPlan {
  id: string;
  accountType: 'free' | 'pro' | 'enterprise';
  name: string;
  description: string;
  features: string[];
  prices: {
    CNY: number;
    USD: number;
    EUR: number;
    GBP: number;
  };
  dailyMinutes: number;
  monthlyMinutes: number;
  isActive: boolean;
}

interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
  selectedCurrency: string;
}

// Currency configurations
const CURRENCIES = {
  CNY: { code: 'CNY', symbol: '¥', name: '人民币', icon: Banknote },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', icon: DollarSign },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', icon: Euro },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', icon: CircleDollarSign }
};

export function PaymentModal({ isOpen, onClose, plan, selectedCurrency }: PaymentModalProps) {
  const { t, language } = useContext(LanguageContext);
  const { user } = useAuth();
  
  // Payment form states
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'alipay' | 'wechat'>('card');

  if (!plan) return null;

  // Format price
  const formatPrice = (amount: number, currency: string) => {
    if (amount === 0) return language === 'zh' ? '免费' : 'Free';
    const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES];
    return `${currencyInfo.symbol}${amount.toFixed(currency === 'CNY' ? 0 : 2)}`;
  };

  // Validate payment form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (paymentMethod === 'card') {
      if (!paymentData.cardNumber || paymentData.cardNumber.length < 16) {
        newErrors.cardNumber = language === 'zh' ? '请输入有效的卡号' : 'Please enter a valid card number';
      }
      
      if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
        newErrors.expiryDate = language === 'zh' ? '请输入有效的过期日期 (MM/YY)' : 'Please enter a valid expiry date (MM/YY)';
      }
      
      if (!paymentData.cvv || paymentData.cvv.length < 3) {
        newErrors.cvv = language === 'zh' ? '请输入有效的CVV' : 'Please enter a valid CVV';
      }
      
      if (!paymentData.cardholderName.trim()) {
        newErrors.cardholderName = language === 'zh' ? '请输入持卡人姓名' : 'Please enter cardholder name';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle payment submission
  const handlePayment = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    try {
      // Create payment session
      const response = await fetch(apiRoutes.payment('/create-session'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          currency: selectedCurrency,
          amount: plan.prices[selectedCurrency as keyof typeof plan.prices],
          paymentMethod,
          paymentData: paymentMethod === 'card' ? paymentData : undefined,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?payment=cancelled`
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.redirectUrl) {
          // Redirect to payment processor (Stripe, PayPal, etc.)
          window.location.href = data.redirectUrl;
        } else if (data.paymentIntentId) {
          // Handle successful payment
          toast.success(
            language === 'zh' 
              ? `${plan.name} 购买成功！您的账户将在几分钟内升级。` 
              : `${plan.name} purchased successfully! Your account will be upgraded in a few minutes.`
          );
          onClose();
          
          // Refresh user data
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        throw new Error(data.error || 'Payment failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(
        language === 'zh' 
          ? '支付处理失败，请重试或联系客服。' 
          : 'Payment processing failed. Please try again or contact support.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Get plan badge
  const getPlanBadge = (accountType: string) => {
    const configs = {
      pro: { icon: Star, label: 'Pro', className: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' },
      enterprise: { icon: Crown, label: 'Enterprise', className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' }
    };
    
    const config = configs[accountType as keyof typeof configs];
    if (!config) return null;
    
    const IconComponent = config.icon;
    return (
      <Badge className={`text-xs font-medium ${config.className}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-indigo-500" />
              <span>{language === 'zh' ? '完成支付' : 'Complete Payment'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {language === 'zh' 
              ? '安全支付，享受Ez Meeting专业服务' 
              : 'Secure payment for Ez Meeting professional services'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200/50 dark:border-indigo-700/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getPlanBadge(plan.accountType)}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatPrice(plan.prices[selectedCurrency as keyof typeof plan.prices], selectedCurrency)}
                  </div>
                  <div className="text-sm text-slate-500">
                    {language === 'zh' ? '每月' : 'per month'}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{plan.description}</p>
              <div className="grid grid-cols-2 gap-2">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-slate-600 dark:text-slate-400">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">{language === 'zh' ? '选择支付方式' : 'Select Payment Method'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="h-12 text-sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {language === 'zh' ? '信用卡' : 'Credit Card'}
              </Button>
              <Button
                variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('paypal')}
                className="h-12 text-sm"
              >
                PayPal
              </Button>
              {selectedCurrency === 'CNY' && (
                <>
                  <Button
                    variant={paymentMethod === 'alipay' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('alipay')}
                    className="h-12 text-sm"
                  >
                    支付宝
                  </Button>
                  <Button
                    variant={paymentMethod === 'wechat' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('wechat')}
                    className="h-12 text-sm"
                  >
                    微信支付
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Credit Card Form */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <Separator />
              <h3 className="font-medium">{language === 'zh' ? '银行卡信息' : 'Card Information'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="cardNumber">{language === 'zh' ? '卡号' : 'Card Number'}</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                      setPaymentData({ ...paymentData, cardNumber: value });
                    }}
                    className={errors.cardNumber ? 'border-red-500' : ''}
                  />
                  {errors.cardNumber && (
                    <p className="text-sm text-red-500">{errors.cardNumber}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">{language === 'zh' ? '过期日期' : 'Expiry Date'}</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={paymentData.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setPaymentData({ ...paymentData, expiryDate: value });
                    }}
                    className={errors.expiryDate ? 'border-red-500' : ''}
                  />
                  {errors.expiryDate && (
                    <p className="text-sm text-red-500">{errors.expiryDate}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={paymentData.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setPaymentData({ ...paymentData, cvv: value });
                    }}
                    className={errors.cvv ? 'border-red-500' : ''}
                  />
                  {errors.cvv && (
                    <p className="text-sm text-red-500">{errors.cvv}</p>
                  )}
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="cardholderName">{language === 'zh' ? '持卡人姓名' : 'Cardholder Name'}</Label>
                  <Input
                    id="cardholderName"
                    placeholder={language === 'zh' ? '张三' : 'John Smith'}
                    value={paymentData.cardholderName}
                    onChange={(e) => setPaymentData({ ...paymentData, cardholderName: e.target.value })}
                    className={errors.cardholderName ? 'border-red-500' : ''}
                  />
                  {errors.cardholderName && (
                    <p className="text-sm text-red-500">{errors.cardholderName}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Alternative Payment Methods Info */}
          {paymentMethod !== 'card' && (
            <div className="space-y-4">
              <Separator />
              <div className="text-center py-8">
                <div className="text-lg font-medium mb-2">
                  {paymentMethod === 'paypal' && 'PayPal'}
                  {paymentMethod === 'alipay' && '支付宝'}
                  {paymentMethod === 'wechat' && '微信支付'}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {language === 'zh' 
                    ? '点击"完成支付"后将跳转到对应支付平台'
                    : 'You will be redirected to the payment platform after clicking "Complete Payment"'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-700/50">
            <Shield className="h-4 w-4 text-green-600" />
            <div className="text-sm text-green-700 dark:text-green-300">
              <Lock className="h-3 w-3 inline mr-1" />
              {language === 'zh' 
                ? '您的支付信息经过256位SSL加密保护，完全安全可靠。'
                : 'Your payment information is protected with 256-bit SSL encryption and is completely secure.'
              }
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col space-y-3 sm:space-y-0">
          <div className="flex items-center justify-between w-full text-sm text-slate-600 dark:text-slate-400">
            <span>{language === 'zh' ? '总计' : 'Total'}</span>
            <span className="font-medium text-lg">
              {formatPrice(plan.prices[selectedCurrency as keyof typeof plan.prices], selectedCurrency)}
              <span className="text-sm ml-1">{language === 'zh' ? '每月' : '/month'}</span>
            </span>
          </div>
          
          <div className="flex space-x-3 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {language === 'zh' ? '处理中...' : 'Processing...'}
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '完成支付' : 'Complete Payment'}
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            {language === 'zh' 
              ? '支付成功后，您的账户将立即升级。如有问题，请联系客服。'
              : 'Your account will be upgraded immediately after successful payment. Contact support if you need help.'
            }
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}