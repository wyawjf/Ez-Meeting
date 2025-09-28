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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Star, 
  Crown, 
  Zap, 
  DollarSign, 
  Euro, 
  Banknote, 
  CircleDollarSign, 
  CreditCard, 
  Timer, 
  Brain, 
  FileText, 
  CheckCircle, 
  XCircle,
  Loader2,
  Copy,
  AlertTriangle,
  Info,
  Settings
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { apiRoutes } from '../utils/api/endpoints';
import { toast } from 'sonner@2.0.3';

// Simplified Types for better compatibility
interface SimplePricingPlan {
  id: string;
  accountType: 'free' | 'pro' | 'enterprise' | 'custom';
  name: string;
  description: string;
  features: string[];
  
  // Pricing
  monthlyPrice: number; // USD
  yearlyPrice: number; // USD
  yearlyDiscount: number; // percentage
  
  // Limits
  dailyMinutes: number; // -1 for unlimited
  monthlyMinutes: number; // -1 for unlimited
  maxNotes: number; // -1 for unlimited
  aiSummaryLimit: number; // -1 for unlimited, 0 for disabled
  
  // Settings
  isActive: boolean;
  isPopular: boolean;
  displayOrder: number;
  trialDays: number;
  autoRenewal: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Account type configurations
const ACCOUNT_TYPES = {
  free: { label: 'Free', icon: Zap, color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
  pro: { label: 'Pro', icon: Star, color: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' },
  enterprise: { label: 'Enterprise', icon: Crown, color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' },
  custom: { label: 'Custom', icon: Settings, color: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white' }
};

export function PricingManagementPanel() {
  const { t, language } = useContext(LanguageContext);
  const { user } = useAuth();
  
  // States
  const [plans, setPlans] = useState<SimplePricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SimplePricingPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SimplePricingPlan | null>(null);

  // Create a new empty plan
  const createEmptyPlan = (): SimplePricingPlan => ({
    id: `custom_${Date.now()}`,
    accountType: 'custom',
    name: '',
    description: '',
    features: [],
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: 20,
    dailyMinutes: 150,
    monthlyMinutes: 1000,
    maxNotes: 100,
    aiSummaryLimit: 0,
    isActive: true,
    isPopular: false,
    displayOrder: 999,
    trialDays: 0,
    autoRenewal: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Load pricing plans
  const loadPricingPlans = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(apiRoutes.admin('/pricing-plans'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const convertedPlans = (data.plans || []).map(convertToPlan);
        setPlans(convertedPlans.length > 0 ? convertedPlans : getDefaultPlans());
      } else {
        setPlans(getDefaultPlans());
      }
    } catch (error) {
      console.error('Error loading pricing plans:', error);
      toast.error(language === 'zh' ? '加载定价方案失败' : 'Failed to load pricing plans');
      setPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  };

  // Convert old format to new format
  const convertToPlan = (oldPlan: any): SimplePricingPlan => ({
    id: oldPlan.id,
    accountType: oldPlan.accountType,
    name: oldPlan.name,
    description: oldPlan.description,
    features: oldPlan.features || [],
    monthlyPrice: oldPlan.prices?.USD || oldPlan.monthlyPrice || 0,
    yearlyPrice: oldPlan.yearlyPrice || (oldPlan.prices?.USD || 0) * 10,
    yearlyDiscount: oldPlan.yearlyDiscount || 17,
    dailyMinutes: oldPlan.dailyMinutes || 150,
    monthlyMinutes: oldPlan.monthlyMinutes || 1000,
    maxNotes: oldPlan.maxNotes || 100,
    aiSummaryLimit: oldPlan.aiSummaryLimit || 0,
    isActive: oldPlan.isActive !== undefined ? oldPlan.isActive : true,
    isPopular: oldPlan.isPopular || false,
    displayOrder: oldPlan.displayOrder || 1,
    trialDays: oldPlan.trialDays || 0,
    autoRenewal: oldPlan.autoRenewal !== undefined ? oldPlan.autoRenewal : true,
    createdAt: oldPlan.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Get default plans
  const getDefaultPlans = (): SimplePricingPlan[] => [
    {
      id: 'free',
      accountType: 'free',
      name: language === 'zh' ? '免费版' : 'Free Plan',
      description: language === 'zh' ? '基础功能，适合个人用户' : 'Basic features for personal use',
      features: [
        language === 'zh' ? '每日150分钟使用' : '150 minutes per day',
        language === 'zh' ? '基础翻译功能' : 'Basic translation',
        language === 'zh' ? '笔记导出' : 'Notes export',
        language === 'zh' ? '多语言支持' : 'Multi-language support'
      ],
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
      trialDays: 0,
      autoRenewal: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'pro',
      accountType: 'pro',
      name: language === 'zh' ? 'Pro版' : 'Pro Plan',
      description: language === 'zh' ? '专业功能，适合商务用户' : 'Professional features for business users',
      features: [
        language === 'zh' ? '无限制使用时间' : 'Unlimited usage time',
        language === 'zh' ? '高级翻译功能' : 'Advanced translation',
        language === 'zh' ? 'AI智能总结' : 'AI-powered summaries',
        language === 'zh' ? '优先客服支持' : 'Priority support',
        language === 'zh' ? '会议记录导出' : 'Meeting recording export',
        language === 'zh' ? '多种导出格式' : 'Multiple export formats'
      ],
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
      trialDays: 7,
      autoRenewal: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'enterprise',
      accountType: 'enterprise',
      name: language === 'zh' ? '企业版' : 'Enterprise Plan',
      description: language === 'zh' ? '企业级功能，适合团队使用' : 'Enterprise features for teams',
      features: [
        language === 'zh' ? '无限制使用时间' : 'Unlimited usage time',
        language === 'zh' ? '无限AI智能总结' : 'Unlimited AI summaries',
        language === 'zh' ? '团队管理功能' : 'Team management',
        language === 'zh' ? 'API接口访问' : 'API access',
        language === 'zh' ? '自定义集成' : 'Custom integrations',
        language === 'zh' ? '高级数据分析' : 'Advanced analytics',
        language === 'zh' ? '24/7专属客服' : '24/7 dedicated support',
        language === 'zh' ? '无限存储空间' : 'Unlimited storage'
      ],
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
      trialDays: 14,
      autoRenewal: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Save pricing plan
  const savePricingPlan = async (plan: SimplePricingPlan) => {
    if (!user?.access_token) return;

    // Validation
    if (!plan.name.trim()) {
      toast.error(language === 'zh' ? '请输入方案名称' : 'Please enter plan name');
      return;
    }

    if (!plan.description.trim()) {
      toast.error(language === 'zh' ? '请输入方案描述' : 'Please enter plan description');
      return;
    }

    setSaving(true);
    try {
      // Convert to old format for backend compatibility
      const backendPlan = {
        id: plan.id,
        accountType: plan.accountType,
        name: plan.name,
        description: plan.description,
        features: plan.features,
        prices: { 
          CNY: plan.monthlyPrice * 7, 
          USD: plan.monthlyPrice, 
          EUR: plan.monthlyPrice * 0.85, 
          GBP: plan.monthlyPrice * 0.8 
        },
        dailyMinutes: plan.dailyMinutes,
        monthlyMinutes: plan.monthlyMinutes,
        isActive: plan.isActive,
        yearlyPrice: plan.yearlyPrice,
        yearlyDiscount: plan.yearlyDiscount,
        maxNotes: plan.maxNotes,
        aiSummaryLimit: plan.aiSummaryLimit,
        isPopular: plan.isPopular,
        displayOrder: plan.displayOrder,
        trialDays: plan.trialDays,
        autoRenewal: plan.autoRenewal,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(apiRoutes.admin('/pricing-plans'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPlan),
      });

      if (response.ok) {
        toast.success(language === 'zh' ? '定价方案保存成功' : 'Pricing plan saved successfully');
        await loadPricingPlans();
        setEditDialogOpen(false);
        setEditingPlan(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save pricing plan');
      }
    } catch (error) {
      console.error('Error saving pricing plan:', error);
      toast.error(language === 'zh' ? '保存定价方案失败' : 'Failed to save pricing plan');
    } finally {
      setSaving(false);
    }
  };

  // Delete pricing plan
  const deletePricingPlan = async (planId: string) => {
    if (!user?.access_token) return;

    try {
      const response = await fetch(apiRoutes.admin(`/pricing-plans/${planId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(language === 'zh' ? '定价方案删除成功' : 'Pricing plan deleted successfully');
        await loadPricingPlans();
        setDeleteDialogOpen(false);
        setPlanToDelete(null);
      } else {
        throw new Error('Failed to delete pricing plan');
      }
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
      toast.error(language === 'zh' ? '删除定价方案失败' : 'Failed to delete pricing plan');
    }
  };

  // Update plan field
  const updatePlanField = (field: keyof SimplePricingPlan, value: any) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, [field]: value });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount === 0) return language === 'zh' ? '免费' : 'Free';
    if (amount === -1) return language === 'zh' ? '无限制' : 'Unlimited';
    return `${amount.toFixed(2)}`;
  };

  // Get plan badge
  const getPlanBadge = (accountType: string, isPopular: boolean) => {
    const config = ACCOUNT_TYPES[accountType as keyof typeof ACCOUNT_TYPES] || ACCOUNT_TYPES.custom;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center space-x-2">
        <Badge className={`text-xs ${config.color}`}>
          <IconComponent className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
        {isPopular && (
          <Badge className="text-xs bg-gradient-to-r from-pink-500 to-red-500 text-white">
            {language === 'zh' ? '热门' : 'Popular'}
          </Badge>
        )}
      </div>
    );
  };

  // Initialize
  useEffect(() => {
    loadPricingPlans();
  }, [user?.access_token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'zh' ? '加载定价方案...' : 'Loading pricing plans...'}
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
            {language === 'zh' ? '定价管理' : 'Pricing Management'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {language === 'zh' 
              ? '管理订阅计划、价格设置和功能权限' 
              : 'Manage subscription plans, pricing settings and feature permissions'
            }
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingPlan(createEmptyPlan());
            setEditDialogOpen(true);
          }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {language === 'zh' ? '添加方案' : 'Add Plan'}
        </Button>
      </div>

      {/* Pricing Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>{language === 'zh' ? '订阅方案列表' : 'Subscription Plans'}</span>
          </CardTitle>
          <CardDescription>
            {language === 'zh' 
              ? '查看和管理所有可用的订阅方案，包括价格、功能和权限设置'
              : 'View and manage all available subscription plans, including pricing, features and permission settings'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'zh' ? '方案' : 'Plan'}</TableHead>
                <TableHead>{language === 'zh' ? '月费' : 'Monthly'}</TableHead>
                <TableHead>{language === 'zh' ? '年费' : 'Yearly'}</TableHead>
                <TableHead>{language === 'zh' ? '使用限制' : 'Usage Limits'}</TableHead>
                <TableHead>{language === 'zh' ? '状态' : 'Status'}</TableHead>
                <TableHead>{language === 'zh' ? '操作' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.sort((a, b) => a.displayOrder - b.displayOrder).map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="space-y-2">
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-slate-500">{plan.description}</div>
                      </div>
                      {getPlanBadge(plan.accountType, plan.isPopular)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(plan.monthlyPrice)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{formatCurrency(plan.yearlyPrice)}</div>
                      {plan.yearlyDiscount > 0 && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                          -{plan.yearlyDiscount}%
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-3 w-3" />
                        <span>
                          {plan.dailyMinutes === -1 
                            ? (language === 'zh' ? '无限' : 'Unlimited')
                            : `${plan.dailyMinutes}${language === 'zh' ? '分/日' : 'min/day'}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Brain className="h-3 w-3" />
                        <span>
                          {plan.aiSummaryLimit === 0 
                            ? (language === 'zh' ? '无AI' : 'No AI')
                            : plan.aiSummaryLimit === -1 
                              ? (language === 'zh' ? 'AI无限' : 'AI Unlimited')
                              : `AI ${plan.aiSummaryLimit}/月`
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-3 w-3" />
                        <span>
                          {plan.maxNotes === -1 
                            ? (language === 'zh' ? '无限笔记' : 'Unlimited notes')
                            : `${plan.maxNotes}${language === 'zh' ? '笔记' : ' notes'}`
                          }
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {plan.isActive ? (
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {language === 'zh' ? '启用' : 'Active'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          <XCircle className="h-3 w-3 mr-1" />
                          {language === 'zh' ? '禁用' : 'Inactive'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPlan(plan);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        {language === 'zh' ? '编辑' : 'Edit'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPlan = { 
                            ...plan, 
                            id: `${plan.id}_copy_${Date.now()}`,
                            name: `${plan.name} (${language === 'zh' ? '副本' : 'Copy'})`,
                            accountType: 'custom' as const,
                            createdAt: new Date().toISOString()
                          };
                          setEditingPlan(newPlan);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {language === 'zh' ? '复制' : 'Copy'}
                      </Button>
                      {plan.accountType === 'custom' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPlanToDelete(plan);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {language === 'zh' ? '删除' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {plans.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                {language === 'zh' ? '暂无定价方案' : 'No pricing plans found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id.includes('_copy_') || editingPlan?.id.startsWith('custom_') 
                ? (language === 'zh' ? '添加定价方案' : 'Add Pricing Plan')
                : (language === 'zh' ? '编辑定价方案' : 'Edit Pricing Plan')
              }
            </DialogTitle>
            <DialogDescription>
              {language === 'zh' 
                ? '配置订阅计划的基本信息和价格设置'
                : 'Configure subscription plan basic information and pricing settings'
              }
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">
                    {language === 'zh' ? '方案名称' : 'Plan Name'}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="plan-name"
                    value={editingPlan.name}
                    onChange={(e) => updatePlanField('name', e.target.value)}
                    placeholder={language === 'zh' ? '输入方案名称' : 'Enter plan name'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account-type">{language === 'zh' ? '账户类型' : 'Account Type'}</Label>
                  <Select
                    value={editingPlan.accountType}
                    onValueChange={(value) => updatePlanField('accountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">
                  {language === 'zh' ? '方案描述' : 'Description'}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={editingPlan.description}
                  onChange={(e) => updatePlanField('description', e.target.value)}
                  placeholder={language === 'zh' ? '输入方案描述' : 'Enter plan description'}
                  rows={2}
                />
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-3">
                <h4 className="font-medium">{language === 'zh' ? '价格设置' : 'Pricing'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'zh' ? '月费 (USD)' : 'Monthly Price (USD)'}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingPlan.monthlyPrice}
                      onChange={(e) => updatePlanField('monthlyPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'zh' ? '年费 (USD)' : 'Yearly Price (USD)'}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingPlan.yearlyPrice}
                      onChange={(e) => updatePlanField('yearlyPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'zh' ? '年费折扣 (%)' : 'Yearly Discount (%)'}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={editingPlan.yearlyDiscount}
                      onChange={(e) => updatePlanField('yearlyDiscount', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Usage Limits */}
              <div className="space-y-3">
                <h4 className="font-medium">{language === 'zh' ? '使用限制' : 'Usage Limits'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'zh' ? '每日分钟数 (-1为无限)' : 'Daily Minutes (-1 for unlimited)'}</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={editingPlan.dailyMinutes}
                      onChange={(e) => updatePlanField('dailyMinutes', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'zh' ? '最大笔记数 (-1为无限)' : 'Max Notes (-1 for unlimited)'}</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={editingPlan.maxNotes}
                      onChange={(e) => updatePlanField('maxNotes', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'zh' ? 'AI总结次数/月 (0=禁用, -1=无限)' : 'AI Summaries/month (0=disabled, -1=unlimited)'}</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={editingPlan.aiSummaryLimit}
                      onChange={(e) => updatePlanField('aiSummaryLimit', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'zh' ? '试用天数' : 'Trial Days'}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingPlan.trialDays}
                      onChange={(e) => updatePlanField('trialDays', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Settings */}
              <div className="space-y-3">
                <h4 className="font-medium">{language === 'zh' ? '方案设置' : 'Plan Settings'}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingPlan.isActive}
                      onCheckedChange={(checked) => updatePlanField('isActive', checked)}
                    />
                    <Label>{language === 'zh' ? '启用' : 'Active'}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingPlan.isPopular}
                      onCheckedChange={(checked) => updatePlanField('isPopular', checked)}
                    />
                    <Label>{language === 'zh' ? '热门' : 'Popular'}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingPlan.autoRenewal}
                      onCheckedChange={(checked) => updatePlanField('autoRenewal', checked)}
                    />
                    <Label>{language === 'zh' ? '自动续费' : 'Auto Renewal'}</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'zh' ? '显示顺序' : 'Display Order'}</Label>
                    <Input
                      type="number"
                      value={editingPlan.displayOrder}
                      onChange={(e) => updatePlanField('displayOrder', parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>{language === 'zh' ? '功能列表 (每行一个)' : 'Features (one per line)'}</Label>
                <Textarea
                  value={editingPlan.features.join('\n')}
                  onChange={(e) => updatePlanField('features', e.target.value.split('\n').filter(f => f.trim()))}
                  placeholder={language === 'zh' ? '输入功能列表...' : 'Enter features list...'}
                  rows={4}
                />
              </div>

              {/* Warning for system plans */}
              {['free', 'pro', 'enterprise'].includes(editingPlan.accountType) && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    {language === 'zh' 
                      ? '⚠️ 注意：您正在编辑系统内置的定价方案，建议谨慎修改以避免影响现有用户。'
                      : '⚠️ Warning: You are editing a built-in pricing plan. Please modify carefully to avoid affecting existing users.'
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button 
              onClick={() => editingPlan && savePricingPlan(editingPlan)}
              disabled={saving}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'zh' ? '保存中...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '保存方案' : 'Save Plan'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'zh' ? '确认删除' : 'Confirm Delete'}</DialogTitle>
            <DialogDescription>
              {language === 'zh' 
                ? `确定要删除"${planToDelete?.name}"定价方案吗？此操作无法撤销。`
                : `Are you sure you want to delete the "${planToDelete?.name}" pricing plan? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => planToDelete && deletePricingPlan(planToDelete.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'zh' ? '删除' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}