import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import {
  Shield,
  Users,
  Crown,
  DollarSign,
  Activity,
  Settings,
  Search,
  Filter,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Star,
  Zap,
  Lock,
  Unlock,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Database,
  MoreHorizontal,
  Edit3,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Euro,
  Banknote,
  CircleDollarSign,
  Save,
  Loader2
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { apiRoutes } from '../utils/api/endpoints';
import { toast } from 'sonner@2.0.3';
import { PaymentConfigPanel } from './PaymentConfigPanel';
import { PricingManagementPanel } from './PricingManagementPanel';

// Types
interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalMinutesUsed: number;
  totalMinutesToday: number;
  totalRevenue: number;
  proUsers: number;
  enterpriseUsers: number;
  freeUsers: number;
  monthlyRevenue: number;
  conversionRate: number;
  churnRate: number;
}

interface ManagementUser {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin' | 'super_admin';
  accountType: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  usageToday: number;
  totalUsage: number;
}

interface NewUserFormData {
  email: string;
  name: string;
  password: string;
  role: 'user' | 'admin' | 'super_admin';
  accountType: 'free' | 'pro' | 'enterprise';
  isActive: boolean;
}

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

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  icon: React.ComponentType<any>;
}

// Currency configurations
const CURRENCIES: Record<string, CurrencyInfo> = {
  CNY: { code: 'CNY', symbol: '¥', name: '人民币', icon: Banknote },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', icon: DollarSign },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', icon: Euro },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', icon: CircleDollarSign }
};

export function ManagementPage() {
  const { t, language } = useContext(LanguageContext);
  const { user } = useAuth();
  
  // States
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<ManagementUser[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  
  // User management states
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userAccountFilter, setUserAccountFilter] = useState('all');
  const [userTotal, setUserTotal] = useState(0);
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);
  const [usersPerPage, setUsersPerPage] = useState(10);
  
  // Delete user dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ManagementUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Add user dialog states
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState<NewUserFormData>({
    email: '',
    name: '',
    password: '',
    role: 'user',
    accountType: 'free',
    isActive: true
  });

  // Pricing management states
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // Initialize default pricing plans
  const initializeDefaultPricingPlans = (): PricingPlan[] => [
    {
      id: 'free',
      accountType: 'free',
      name: language === 'zh' ? '免费版' : 'Free Plan',
      description: language === 'zh' ? '基础功能，适合个人用户' : 'Basic features for personal use',
      features: [
        language === 'zh' ? '每日150分钟' : '150 minutes per day',
        language === 'zh' ? '基础翻译功能' : 'Basic translation',
        language === 'zh' ? '导出功能' : 'Export functionality'
      ],
      prices: { CNY: 0, USD: 0, EUR: 0, GBP: 0 },
      dailyMinutes: 150,
      monthlyMinutes: 1000,
      isActive: true
    },
    {
      id: 'pro',
      accountType: 'pro',
      name: language === 'zh' ? 'Pro版' : 'Pro Plan',
      description: language === 'zh' ? '专业功能，适合商务用户' : 'Professional features for business users',
      features: [
        language === 'zh' ? '无限制使用' : 'Unlimited usage',
        language === 'zh' ? '高级翻译功能' : 'Advanced translation',
        language === 'zh' ? '优先客服支持' : 'Priority support',
        language === 'zh' ? '会议记录功能' : 'Meeting recording'
      ],
      prices: { CNY: 99, USD: 14.99, EUR: 12.99, GBP: 11.99 },
      dailyMinutes: -1,
      monthlyMinutes: -1,
      isActive: true
    },
    {
      id: 'enterprise',
      accountType: 'enterprise',
      name: language === 'zh' ? '企业版' : 'Enterprise Plan',
      description: language === 'zh' ? '企业级功能，适合团队使用' : 'Enterprise features for teams',
      features: [
        language === 'zh' ? '无限制使用' : 'Unlimited usage',
        language === 'zh' ? '团队管理功能' : 'Team management',
        language === 'zh' ? '企业级安全' : 'Enterprise security',
        language === 'zh' ? '24/7专属客服' : '24/7 dedicated support',
        language === 'zh' ? '自定义集成' : 'Custom integrations'
      ],
      prices: { CNY: 299, USD: 49.99, EUR: 39.99, GBP: 34.99 },
      dailyMinutes: -1,
      monthlyMinutes: -1,
      isActive: true
    }
  ];

  // Load all data
  const loadData = async () => {
    if (!user?.access_token) {
      setStats({
        totalUsers: 0, activeUsers: 0, newUsersToday: 0, totalMinutesUsed: 0,
        totalMinutesToday: 0, totalRevenue: 0, proUsers: 0, enterpriseUsers: 0,
        freeUsers: 0, monthlyRevenue: 0, conversionRate: 0, churnRate: 0
      });
      setUsers([]);
      setPricingPlans(initializeDefaultPricingPlans());
      return;
    }
    
    try {
      // Load stats
      try {
        const statsResponse = await fetch(apiRoutes.admin('/stats'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.warn('Failed to load stats:', error);
      }

      // Load users with pagination
      try {
        const params = new URLSearchParams({
          page: userPage.toString(),
          limit: usersPerPage.toString(),
          search: userSearch,
          role: userRoleFilter === 'all' ? '' : userRoleFilter,
          accountType: userAccountFilter === 'all' ? '' : userAccountFilter
        });

        const usersResponse = await fetch(`${apiRoutes.admin('/users')}?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setUsers(data.users || []);
          setUserTotal(data.pagination?.total || 0);
        } else {
          setUsers([]);
          setUserTotal(0);
        }
      } catch (error) {
        console.warn('Failed to load users:', error);
      }

      // Load pricing plans
      try {
        const pricingResponse = await fetch(apiRoutes.admin('/pricing-plans'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (pricingResponse.ok) {
          const data = await pricingResponse.json();
          setPricingPlans(data.plans || initializeDefaultPricingPlans());
        } else {
          setPricingPlans(initializeDefaultPricingPlans());
        }
      } catch (error) {
        console.warn('Failed to load pricing plans:', error);
        setPricingPlans(initializeDefaultPricingPlans());
      }

      setError(null);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load management data');
    }
  };

  // Save pricing plan
  const savePricingPlan = async (plan: PricingPlan) => {
    if (!user?.access_token) return;
    
    setIsSavingPricing(true);
    try {
      const response = await fetch(apiRoutes.admin('/pricing-plans'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plan),
      });

      if (response.ok) {
        toast.success(language === 'zh' ? '定价方案保存成功' : 'Pricing plan saved successfully');
        await loadData();
        setPricingDialogOpen(false);
        setEditingPlan(null);
      } else {
        throw new Error('Failed to save pricing plan');
      }
    } catch (error) {
      console.error('Error saving pricing plan:', error);
      toast.error(language === 'zh' ? '保存定价方案失败' : 'Failed to save pricing plan');
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Create manual user function
  const createManualUser = async () => {
    if (!user?.access_token) return;
    
    // Basic validation
    if (!newUserForm.email || !newUserForm.name || !newUserForm.password) {
      toast.error(language === 'zh' ? '请填写所有必填字段' : 'Please fill in all required fields');
      return;
    }

    if (newUserForm.password.length < 6) {
      toast.error(language === 'zh' ? '密码至少需要6个字符' : 'Password must be at least 6 characters');
      return;
    }

    setIsCreatingUser(true);
    try {
      const response = await fetch(apiRoutes.admin('/create-manual-user'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserForm),
      });

      if (response.ok) {
        toast.success(language === 'zh' ? '用户创建成功' : 'User created successfully');
        await loadData();
        setAddUserDialogOpen(false);
        // Reset form
        setNewUserForm({
          email: '',
          name: '',
          password: '',
          role: 'user',
          accountType: 'free',
          isActive: true
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(language === 'zh' ? '创建用户失败' : 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Update user role with permission check
  const updateUserRole = async (userId: string, newRole: string) => {
    if (!user?.access_token) return;
    
    const currentUserRole = user?.profile?.role || 'user';
    const targetUser = users.find(u => u.id === userId);
    const targetUserRole = targetUser?.role || 'user';
    
    // Admin and super admin can modify other super admins or promote to super admin
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin' && targetUserRole === 'super_admin') {
      toast.error(language === 'zh' ? '只有管理员或超级管理员可以修改其他超级管理员的权限' : 'Only Admin or Super Admin can modify other Super Admin permissions');
      return;
    }
    
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin' && newRole === 'super_admin') {
      toast.error(language === 'zh' ? '只有管理员或超级管理员可以将用户提升为超级管理员' : 'Only Admin or Super Admin can promote users to Super Admin');
      return;
    }
    
    try {
      const response = await fetch(apiRoutes.admin(`/users/${userId}/role`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success(language === 'zh' ? '用户角色更新成功' : 'User role updated successfully');
        await loadData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(language === 'zh' ? '更新用户角色失败' : 'Failed to update user role');
    }
  };

  // Update user account type
  const updateUserAccountType = async (userId: string, newAccountType: string) => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(apiRoutes.admin(`/users/${userId}/account-type`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountType: newAccountType }),
      });

      if (response.ok) {
        toast.success(language === 'zh' ? '用户账户类型更新成功' : 'User account type updated successfully');
        await loadData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update account type');
      }
    } catch (error) {
      console.error('Error updating account type:', error);
      toast.error(language === 'zh' ? '更新用户账户类型失败' : 'Failed to update user account type');
    }
  };

  // Delete user function
  const deleteUser = async (userId: string) => {
    if (!user?.access_token) return;
    
    setIsDeletingUser(true);
    try {
      const response = await fetch(apiRoutes.admin(`/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(language === 'zh' ? '用户删除成功' : 'User deleted successfully');
        await loadData();
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(language === 'zh' ? '删除用户失败' : 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(userTotal / usersPerPage);
  const hasNextPage = userPage < totalPages;
  const hasPrevPage = userPage > 1;

  // Get page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, userPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Search and filter handlers
  const handleSearchChange = (value: string) => {
    setUserSearch(value);
    setUserPage(1);
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await loadData();
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to initialize management data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.access_token) {
      initializeData();
    } else {
      setLoading(false);
    }
  }, [user?.access_token, userPage, userSearch, userRoleFilter, userAccountFilter, usersPerPage]);

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    const currencyInfo = CURRENCIES[currency];
    if (amount === 0) return language === 'zh' ? '免费' : 'Free';
    return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
  };

  // Check permissions
  const canModifyUser = (targetUser: ManagementUser) => {
    const currentUserRole = user?.profile?.role || 'user';
    const targetUserRole = targetUser.role;
    
    if (currentUserRole === 'super_admin') return true;
    // Allow admin to modify all user types including super_admin
    if (currentUserRole === 'admin') return true;
    return false;
  };

  // Check if current user can promote to super admin
  const canPromoteToSuperAdmin = (targetUser: ManagementUser) => {
    const currentUserRole = user?.profile?.role || 'user';
    // Allow both admin and super_admin to promote users to super_admin
    return (currentUserRole === 'admin' || currentUserRole === 'super_admin') && targetUser.role !== 'super_admin';
  };

  const canDeleteUser = (targetUser: ManagementUser) => {
    const currentUserRole = user?.profile?.role || 'user';
    const targetUserRole = targetUser.role;
    
    if (currentUserRole === 'super_admin' && targetUser.id !== user?.id) return true;
    // Allow admin to delete all user types including super_admin (except themselves)
    if (currentUserRole === 'admin' && targetUser.id !== user?.id) return true;
    return false;
  };

  const isCurrentUserSuperAdmin = () => {
    return user?.profile?.role === 'super_admin';
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'super_admin': { label: language === 'zh' ? '超级管理员' : 'Super Admin', color: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' },
      'admin': { label: language === 'zh' ? '管理员' : 'Admin', color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' },
      'user': { label: language === 'zh' ? '用户' : 'User', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>;
  };

  const getAccountTypeBadge = (accountType: string) => {
    const typeConfig = {
      'enterprise': { label: 'Enterprise', icon: Crown, color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' },
      'pro': { label: 'Pro', icon: Star, color: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' },
      'free': { label: 'Free', icon: Zap, color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' }
    };
    
    const config = typeConfig[accountType as keyof typeof typeConfig] || typeConfig.free;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`text-xs ${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400">
              {language === 'zh' ? '加载管理数据...' : 'Loading management data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6 max-w-md">
            <div className="h-16 w-16 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                {language === 'zh' ? '需要登录' : 'Login Required'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {language === 'zh' 
                  ? '请先登录以访问管理功能。'
                  : 'Please login first to access management features.'}
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              {language === 'zh' ? '前往登录' : 'Go to Login'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900">
      {/* Management Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-slate-500/10 border-b border-indigo-200/50 dark:border-indigo-700/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {language === 'zh' ? '系统管理' : 'System Management'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {language === 'zh' ? '用户管理、定价方案和系统配置' : 'User management, pricing plans and system configuration'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'zh' ? '刷新' : 'Refresh'}
            </Button>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <Activity className="h-3 w-3 mr-1" />
              {language === 'zh' ? '在线' : 'Online'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{language === 'zh' ? '总用户数' : 'Total Users'}</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats?.totalUsers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/50 dark:border-green-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">{language === 'zh' ? '活跃用户' : 'Active Users'}</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats?.activeUsers || 0}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-50 dark:from-purple-950/30 dark:to-purple-950/30 border-purple-200/50 dark:border-purple-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">{language === 'zh' ? '今日新增' : 'New Today'}</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats?.newUsersToday || 0}</p>
                  </div>
                  <UserPlus className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 dark:text-amber-400">{language === 'zh' ? '月收入' : 'Monthly Revenue'}</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">¥{stats?.monthlyRevenue || 0}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {language === 'zh' ? '用户管理' : 'User Management'}
              </TabsTrigger>
              {isCurrentUserSuperAdmin() && (
                <TabsTrigger value="pricing" className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '定价管理' : 'Pricing Management'}
                </TabsTrigger>
              )}
              {isCurrentUserSuperAdmin() && (
                <TabsTrigger value="payment" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '支付配置' : 'Payment Config'}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      {language === 'zh' ? '用户管理' : 'User Management'}
                    </CardTitle>
                    <div className="flex items-center space-x-4">
                      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            {language === 'zh' ? '添加用户' : 'Add User'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>{language === 'zh' ? '创建新用户' : 'Create New User'}</DialogTitle>
                            <DialogDescription>
                              {language === 'zh' ? '手动创建一个新用户账户' : 'Manually create a new user account'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="email">{language === 'zh' ? '邮箱' : 'Email'}</Label>
                              <Input
                                id="email"
                                type="email"
                                value={newUserForm.email}
                                onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                                placeholder={language === 'zh' ? '输入邮箱地址' : 'Enter email address'}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="name">{language === 'zh' ? '姓名' : 'Name'}</Label>
                              <Input
                                id="name"
                                value={newUserForm.name}
                                onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                                placeholder={language === 'zh' ? '输入用户姓名' : 'Enter user name'}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="password">{language === 'zh' ? '密码' : 'Password'}</Label>
                              <Input
                                id="password"
                                type="password"
                                value={newUserForm.password}
                                onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                                placeholder={language === 'zh' ? '输入密码' : 'Enter password'}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>{language === 'zh' ? '角色' : 'Role'}</Label>
                                <Select value={newUserForm.role} onValueChange={(value: 'user' | 'admin' | 'super_admin') => setNewUserForm({...newUserForm, role: value})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">{language === 'zh' ? '用户' : 'User'}</SelectItem>
                                    <SelectItem value="admin">{language === 'zh' ? '管理员' : 'Admin'}</SelectItem>
                                    {(user?.profile?.role === 'admin' || user?.profile?.role === 'super_admin') && (
                                      <SelectItem value="super_admin">{language === 'zh' ? '超级管理员' : 'Super Admin'}</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>{language === 'zh' ? '账户类型' : 'Account Type'}</Label>
                                <Select value={newUserForm.accountType} onValueChange={(value: 'free' | 'pro' | 'enterprise') => setNewUserForm({...newUserForm, accountType: value})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                              {language === 'zh' ? '取消' : 'Cancel'}
                            </Button>
                            <Button onClick={createManualUser} disabled={isCreatingUser}>
                              {isCreatingUser && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              {language === 'zh' ? '创建用户' : 'Create User'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search and Filters */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder={language === 'zh' ? '搜索用户...' : 'Search users...'}
                        value={userSearch}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={language === 'zh' ? '角色筛选' : 'Filter by role'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'zh' ? '所有角色' : 'All Roles'}</SelectItem>
                        <SelectItem value="user">{language === 'zh' ? '用户' : 'User'}</SelectItem>
                        <SelectItem value="admin">{language === 'zh' ? '管理员' : 'Admin'}</SelectItem>
                        <SelectItem value="super_admin">{language === 'zh' ? '超级管理员' : 'Super Admin'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={userAccountFilter} onValueChange={setUserAccountFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={language === 'zh' ? '账户筛选' : 'Filter by account'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'zh' ? '所有账户' : 'All Accounts'}</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Users Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'zh' ? '用户' : 'User'}</TableHead>
                          <TableHead>{language === 'zh' ? '角色' : 'Role'}</TableHead>
                          <TableHead>{language === 'zh' ? '账户类型' : 'Account'}</TableHead>
                          <TableHead>{language === 'zh' ? '状态' : 'Status'}</TableHead>
                          <TableHead>{language === 'zh' ? '创建时间' : 'Created'}</TableHead>
                          <TableHead className="text-right">{language === 'zh' ? '操作' : 'Actions'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((userItem) => (
                          <TableRow key={userItem.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{userItem.name || userItem.email}</div>
                                <div className="text-sm text-slate-500">{userItem.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getRoleBadge(userItem.role)}
                            </TableCell>
                            <TableCell>
                              {getAccountTypeBadge(userItem.accountType)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={userItem.isActive ? "default" : "secondary"}>
                                {userItem.isActive 
                                  ? (language === 'zh' ? '活跃' : 'Active')
                                  : (language === 'zh' ? '非活跃' : 'Inactive')
                                }
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(userItem.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              {canModifyUser(userItem) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>{language === 'zh' ? '用户操作' : 'User Actions'}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    
                                    {/* Role Management */}
                                    <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wide">
                                      {language === 'zh' ? '角色管理' : 'Role Management'}
                                    </DropdownMenuLabel>
                                    {userItem.role !== 'user' && (
                                      <DropdownMenuItem onClick={() => updateUserRole(userItem.id, 'user')}>
                                        <Users className="h-4 w-4 mr-2" />
                                        {language === 'zh' ? '设为用户' : 'Set as User'}
                                      </DropdownMenuItem>
                                    )}
                                    {userItem.role !== 'admin' && (
                                      <DropdownMenuItem onClick={() => updateUserRole(userItem.id, 'admin')}>
                                        <Shield className="h-4 w-4 mr-2" />
                                        {language === 'zh' ? '设为管理员' : 'Set as Admin'}
                                      </DropdownMenuItem>
                                    )}
                                    {canPromoteToSuperAdmin(userItem) && (
                                      <DropdownMenuItem 
                                        onClick={() => updateUserRole(userItem.id, 'super_admin')}
                                        className="text-purple-600 dark:text-purple-400 font-medium"
                                      >
                                        <Crown className="h-4 w-4 mr-2" />
                                        {language === 'zh' ? '设为超级管理员' : 'Set as Super Admin'}
                                      </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuSeparator />
                                    
                                    {/* Account Type Management */}
                                    <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wide">
                                      {language === 'zh' ? '账户类型' : 'Account Type'}
                                    </DropdownMenuLabel>
                                    {userItem.accountType !== 'free' && (
                                      <DropdownMenuItem onClick={() => updateUserAccountType(userItem.id, 'free')}>
                                        <Zap className="h-4 w-4 mr-2" />
                                        {language === 'zh' ? '设为免费版' : 'Set as Free'}
                                      </DropdownMenuItem>
                                    )}
                                    {userItem.accountType !== 'pro' && (
                                      <DropdownMenuItem onClick={() => updateUserAccountType(userItem.id, 'pro')}>
                                        <Star className="h-4 w-4 mr-2" />
                                        {language === 'zh' ? '设为Pro版' : 'Set as Pro'}
                                      </DropdownMenuItem>
                                    )}
                                    {userItem.accountType !== 'enterprise' && (
                                      <DropdownMenuItem onClick={() => updateUserAccountType(userItem.id, 'enterprise')}>
                                        <Crown className="h-4 w-4 mr-2" />
                                        {language === 'zh' ? '设为企业版' : 'Set as Enterprise'}
                                      </DropdownMenuItem>
                                    )}
                                    
                                    {canDeleteUser(userItem) && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                          onClick={() => {
                                            setUserToDelete(userItem);
                                            setDeleteDialogOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          {language === 'zh' ? '删除用户' : 'Delete User'}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {language === 'zh' 
                          ? `显示 ${((userPage - 1) * usersPerPage) + 1} 到 ${Math.min(userPage * usersPerPage, userTotal)} 项，共 ${userTotal} 项`
                          : `Showing ${((userPage - 1) * usersPerPage) + 1} to ${Math.min(userPage * usersPerPage, userTotal)} of ${userTotal} entries`
                        }
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(1)}
                          disabled={!hasPrevPage}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(userPage - 1)}
                          disabled={!hasPrevPage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {getPageNumbers().map((page) => (
                          <Button
                            key={page}
                            variant={page === userPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUserPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(userPage + 1)}
                          disabled={!hasNextPage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(totalPages)}
                          disabled={!hasNextPage}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Management Tab */}
            {isCurrentUserSuperAdmin() && (
              <TabsContent value="pricing" className="space-y-6">
                <PricingManagementPanel />
              </TabsContent>
            )}

            {/* Payment Configuration Tab */}
            {isCurrentUserSuperAdmin() && (
              <TabsContent value="payment">
                <PaymentConfigPanel />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'zh' ? '确认删除用户' : 'Confirm Delete User'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'zh' 
                ? `您确定要删除用户 "${userToDelete?.name || userToDelete?.email}" 吗？此操作无法撤销。`
                : `Are you sure you want to delete user "${userToDelete?.name || userToDelete?.email}"? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'zh' ? '取消' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUser(userToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingUser}
            >
              {isDeletingUser && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'zh' ? '删除' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pricing Plan Edit Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'zh' ? '编辑定价方案' : 'Edit Pricing Plan'}</DialogTitle>
            <DialogDescription>
              {language === 'zh' ? '修改定价方案的详细信息' : 'Modify the pricing plan details'}
            </DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'zh' ? '方案名称' : 'Plan Name'}</Label>
                <Input
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'zh' ? '描述' : 'Description'}</Label>
                <Input
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'zh' ? '价格设置' : 'Pricing'}</Label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(editingPlan.prices).map(([currency, price]) => (
                    <div key={currency} className="space-y-1">
                      <Label className="text-xs">{currency}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          prices: {
                            ...editingPlan.prices,
                            [currency]: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPricingDialogOpen(false)}>
              {language === 'zh' ? '取消' : 'Cancel'}
            </Button>
            <Button onClick={() => editingPlan && savePricingPlan(editingPlan)} disabled={isSavingPricing}>
              {isSavingPricing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'zh' ? '保存' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}