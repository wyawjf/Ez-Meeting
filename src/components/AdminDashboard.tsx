import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import {
  Shield,
  Users,
  Crown,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  Download,
  RefreshCw,
  BarChart3,
  Calendar,
  Eye,
  AlertCircle,
  CheckCircle,
  Star,
  Zap
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { apiRoutes } from '../utils/api/endpoints';
import { toast } from 'sonner@2.0.3';

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
}

interface AdminUser {
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

interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId?: string;
  details?: any;
  createdAt: string;
}

interface UsageAnalytics {
  date: string;
  totalMinutes: number;
  uniqueUsers: number;
  sessions: number;
}

export function AdminDashboard() {
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  
  // States
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [analytics, setAnalytics] = useState<UsageAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // User management states
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userAccountFilter, setUserAccountFilter] = useState('');
  const [userTotal, setUserTotal] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(0);

  // Load system statistics
  const loadStats = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(apiRoutes.admin('/stats'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        throw new Error('Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error(language === 'zh' ? '加载统计数据失败' : 'Failed to load statistics');
    }
  }, [user?.access_token, language]);

  // Load users
  const loadUsers = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const params = new URLSearchParams({
        page: userPage.toString(),
        limit: '20',
        search: userSearch,
        role: userRoleFilter,
        accountType: userAccountFilter
      });

      const response = await fetch(`${apiRoutes.admin('/users')}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setUserTotal(data.pagination.total);
        setUserTotalPages(data.pagination.totalPages);
      } else {
        throw new Error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(language === 'zh' ? '加载用户数据失败' : 'Failed to load users');
    }
  }, [user?.access_token, userPage, userSearch, userRoleFilter, userAccountFilter, language]);

  // Load admin logs
  const loadLogs = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(`${apiRoutes.admin('/logs')}?page=1&limit=50`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      } else {
        throw new Error('Failed to load logs');
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error(language === 'zh' ? '加载日志失败' : 'Failed to load logs');
    }
  }, [user?.access_token, language]);

  // Load usage analytics
  const loadAnalytics = useCallback(async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(`${apiRoutes.admin('/usage-analytics')}?days=30`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        throw new Error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error(language === 'zh' ? '加载分析数据失败' : 'Failed to load analytics');
    }
  }, [user?.access_token, language]);

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    if (!user?.access_token) return;
    
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
        loadUsers();
      } else {
        throw new Error('Failed to update role');
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
        toast.success(language === 'zh' ? '账户类型更新成功' : 'Account type updated successfully');
        loadUsers();
        loadStats(); // Refresh stats
      } else {
        throw new Error('Failed to update account type');
      }
    } catch (error) {
      console.error('Error updating account type:', error);
      toast.error(language === 'zh' ? '更新账户类型失败' : 'Failed to update account type');
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch(apiRoutes.admin(`/users/${userId}/status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        toast.success(language === 'zh' ? '用户状态更新成功' : 'User status updated successfully');
        loadUsers();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(language === 'zh' ? '更新用户状态失败' : 'Failed to update user status');
    }
  };

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadLogs(),
        loadAnalytics()
      ]);
      setLoading(false);
    };

    if (user?.access_token) {
      loadData();
    }
  }, [loadStats, loadUsers, loadLogs, loadAnalytics, user?.access_token]);

  // Reload users when filters change
  useEffect(() => {
    if (user?.access_token) {
      loadUsers();
    }
  }, [loadUsers, userPage, userSearch, userRoleFilter, userAccountFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US');
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
              {language === 'zh' ? '加载管理员数据...' : 'Loading admin data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-slate-500/10 border-b border-indigo-200/50 dark:border-indigo-700/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {language === 'zh' ? 'Ez Meeting 管理后台' : 'Ez Meeting Admin Panel'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {language === 'zh' ? '系统管理和数据监控' : 'System management and data monitoring'}
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
          {/* Main Tabs */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-4 bg-slate-100/50 dark:bg-slate-700/50">
                  <TabsTrigger value="overview" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>{language === 'zh' ? '概览' : 'Overview'}</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{language === 'zh' ? '用户管理' : 'Users'}</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>{language === 'zh' ? '数据分析' : 'Analytics'}</span>
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>{language === 'zh' ? '操作日志' : 'Logs'}</span>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="overview" className="space-y-6">
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
                            <p className="text-sm text-purple-600 dark:text-purple-400">{language === 'zh' ? '今日使用' : 'Today Usage'}</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats?.totalMinutesToday || 0}m</p>
                          </div>
                          <Clock className="h-8 w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-700/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-amber-600 dark:text-amber-400">{language === 'zh' ? '总收入' : 'Total Revenue'}</p>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">¥{stats?.totalRevenue || 0}</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-amber-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                          <Crown className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                          {language === 'zh' ? '套餐分布' : 'Plan Distribution'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Free</span>
                          <span className="font-medium">{(stats?.totalUsers || 0) - (stats?.proUsers || 0) - (stats?.enterpriseUsers || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Pro</span>
                          <span className="font-medium">{stats?.proUsers || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Enterprise</span>
                          <span className="font-medium">{stats?.enterpriseUsers || 0}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                          <TrendingUp className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                          {language === 'zh' ? '今日新增' : 'Today Growth'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '新用户' : 'New Users'}</span>
                          <span className="font-medium text-green-600">{stats?.newUsersToday || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '使用时长' : 'Usage Time'}</span>
                          <span className="font-medium">{stats?.totalMinutesToday || 0} min</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                          <Activity className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                          {language === 'zh' ? '系统状态' : 'System Status'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '服务状态' : 'Service Status'}</span>
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {language === 'zh' ? '正常' : 'Healthy'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '总使用时长' : 'Total Usage'}</span>
                          <span className="font-medium">{Math.round((stats?.totalMinutesUsed || 0) / 60)}h</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-6">
                  {/* User Management Header */}
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                        {language === 'zh' ? '用户管理' : 'User Management'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {language === 'zh' ? `共 ${userTotal} 个用户` : `${userTotal} users total`}
                      </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder={language === 'zh' ? '搜索用户...' : 'Search users...'}
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-10 w-full md:w-64 bg-white/50 dark:bg-slate-700/50"
                        />
                      </div>

                      <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                        <SelectTrigger className="w-full md:w-40 bg-white/50 dark:bg-slate-700/50">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder={language === 'zh' ? '角色' : 'Role'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{language === 'zh' ? '所有角色' : 'All Roles'}</SelectItem>
                          <SelectItem value="user">{language === 'zh' ? '用户' : 'User'}</SelectItem>
                          <SelectItem value="admin">{language === 'zh' ? '管理员' : 'Admin'}</SelectItem>
                          <SelectItem value="super_admin">{language === 'zh' ? '超级管理员' : 'Super Admin'}</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={userAccountFilter} onValueChange={setUserAccountFilter}>
                        <SelectTrigger className="w-full md:w-40 bg-white/50 dark:bg-slate-700/50">
                          <SelectValue placeholder={language === 'zh' ? '套餐' : 'Plan'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{language === 'zh' ? '所有套餐' : 'All Plans'}</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="rounded-lg border border-slate-200/50 dark:border-slate-600/50 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200/50 dark:border-slate-600/50">
                          <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '用户' : 'User'}</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '角色' : 'Role'}</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '套餐' : 'Plan'}</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '状态' : 'Status'}</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '使用情况' : 'Usage'}</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '注册时间' : 'Created'}</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '操作' : 'Actions'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium text-slate-800 dark:text-slate-200">
                                  {user.name || user.email?.split('@')[0]}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{getAccountTypeBadge(user.accountType)}</TableCell>
                            <TableCell>
                              <Badge className={user.isActive 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }>
                                {user.isActive 
                                  ? (language === 'zh' ? '活跃' : 'Active')
                                  : (language === 'zh' ? '禁用' : 'Disabled')
                                }
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                  {language === 'zh' ? '今日' : 'Today'}: {user.usageToday}m
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {language === 'zh' ? '总计' : 'Total'}: {user.totalUsage}m
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                  {formatDate(user.createdAt)}
                                </p>
                                {user.lastLoginAt && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {language === 'zh' ? '最后登录' : 'Last login'}: {formatDate(user.lastLoginAt)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Select
                                  value={user.role}
                                  onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                                >
                                  <SelectTrigger className="w-24 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">{language === 'zh' ? '用户' : 'User'}</SelectItem>
                                    <SelectItem value="admin">{language === 'zh' ? '管理员' : 'Admin'}</SelectItem>
                                    <SelectItem value="super_admin">{language === 'zh' ? '超管' : 'Super'}</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={user.accountType}
                                  onValueChange={(newType) => updateUserAccountType(user.id, newType)}
                                >
                                  <SelectTrigger className="w-24 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleUserStatus(user.id, !user.isActive)}
                                  className="h-8 w-8 p-0"
                                >
                                  {user.isActive ? (
                                    <UserX className="h-3 w-3 text-red-500" />
                                  ) : (
                                    <UserCheck className="h-3 w-3 text-green-500" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {userTotalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {language === 'zh' ? `第 ${userPage} 页，共 ${userTotalPages} 页` : `Page ${userPage} of ${userTotalPages}`}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(userPage - 1)}
                          disabled={userPage === 1}
                        >
                          {language === 'zh' ? '上一页' : 'Previous'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserPage(userPage + 1)}
                          disabled={userPage === userTotalPages}
                        >
                          {language === 'zh' ? '下一页' : 'Next'}
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
                      {language === 'zh' ? '使用情况分析（最近30天）' : 'Usage Analytics (Last 30 Days)'}
                    </h3>
                    
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                              {analytics.reduce((sum, day) => sum + day.totalMinutes, 0)}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '总使用分钟数' : 'Total Minutes'}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {analytics.reduce((sum, day) => sum + day.sessions, 0)}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '总会话数' : 'Total Sessions'}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {Math.round((analytics.reduce((sum, day) => sum + day.totalMinutes, 0) / analytics.length) || 0)}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '日均使用分钟数' : 'Avg Daily Minutes'}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="rounded-lg border border-slate-200/50 dark:border-slate-600/50 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-200/50 dark:border-slate-600/50">
                            <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '日期' : 'Date'}</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '使用分钟数' : 'Minutes Used'}</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '活跃用户' : 'Active Users'}</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '会话数' : 'Sessions'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.slice(-15).reverse().map((day) => (
                            <TableRow key={day.date} className="border-slate-200/50 dark:border-slate-600/50">
                              <TableCell className="text-slate-800 dark:text-slate-200">{formatDate(day.date)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                                  {day.totalMinutes}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                  {day.uniqueUsers}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                  {day.sessions}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
                      {language === 'zh' ? '管理员操作日志' : 'Admin Activity Logs'}
                    </h3>
                    
                    <ScrollArea className="h-[600px] w-full rounded-lg border border-slate-200/50 dark:border-slate-600/50 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="p-4 space-y-4">
                        {logs.map((log) => (
                          <Card key={log.id} className="p-4 bg-white/60 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-600/50">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {log.action}
                                  </Badge>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {formatDateTime(log.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                  <span className="font-medium">{log.adminName}</span> {log.action.toLowerCase().replace(/_/g, ' ')}
                                  {log.targetId && (
                                    <span className="text-slate-600 dark:text-slate-400"> (ID: {log.targetId.slice(0, 8)}...)</span>
                                  )}
                                </p>
                                {log.details && (
                                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}