import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Crown, 
  Download, 
  Calendar, 
  Settings, 
  LogOut, 
  Star, 
  TrendingUp, 
  Clock,
  User,
  FileText,
  Activity,
  BarChart3,
  History,
  Globe2,
  Shield,
  Zap,
  Target,
  Gauge,
  RefreshCw,
  Bug,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { LoginPrompt } from './LoginPrompt';
import {
  getTodayUsage,
  ACCOUNT_LIMITS,
  type AccountType
} from './utils/timeTrackingUtils';
import { publicAnonKey } from '../utils/supabase/info';
import { apiRoutes } from '../utils/api/endpoints';

export function UserDashboard() {
  const { t, language } = useContext(LanguageContext);
  const { user, refreshUser, setupWyattAdmin } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [defaultSourceLang, setDefaultSourceLang] = useState('en');
  const [defaultTargetLang, setDefaultTargetLang] = useState('zh');
  const [autoDetection, setAutoDetection] = useState(true);
  const [adminDebugInfo, setAdminDebugInfo] = useState<any>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Time tracking states (for user info display)
  const [accountType, setAccountType] = useState<AccountType>('free');
  const [usedMinutesToday, setUsedMinutesToday] = useState(0);
  const [remainingMinutes, setRemainingMinutes] = useState(150);
  const [remainingMonthlyMinutes, setRemainingMonthlyMinutes] = useState(1000);

  // Update time states from user profile
  const updateTimeStates = useCallback(async () => {
    if (!user) {
      setAccountType('free');
      setRemainingMinutes(ACCOUNT_LIMITS.free);
      setUsedMinutesToday(0);
      setRemainingMonthlyMinutes(1000);
      return;
    }
    
    try {
      setAccountType(user.accountType || 'free');
      const usage = await getTodayUsage();
      setUsedMinutesToday(usage.usedMinutes || 0);
      setRemainingMinutes(usage.remainingMinutes || 0);
      setRemainingMonthlyMinutes(usage.remainingMonthlyMinutes || 0);
    } catch (error) {
      console.error('Error updating time states:', error);
    }
  }, [user]);

  useEffect(() => {
    updateTimeStates();
  }, [updateTimeStates]);

  // Mock user data
  const userInfo = {
    name: user?.profile?.name || user?.user_metadata?.name || 'User123',
    email: user?.email || 'user@example.com',
    plan: accountType === 'pro' ? 'Pro' : accountType === 'enterprise' ? 'Enterprise' : 'Free',
    validUntil: '2024-02-18'
  };

  const usageHistory = [
    { 
      date: '2024-01-18', 
      minutes: 45,
      duration: language === 'zh' ? '45分钟' : '45 minutes', 
      type: t('dashboard.type.meeting') 
    },
    { 
      date: '2024-01-17', 
      minutes: 80,
      duration: language === 'zh' ? '1小时20分钟' : '1 hour 20 minutes', 
      type: t('dashboard.type.course') 
    },
    { 
      date: '2024-01-16', 
      minutes: 25,
      duration: language === 'zh' ? '25分钟' : '25 minutes', 
      type: t('dashboard.type.interview') 
    },
    { 
      date: '2024-01-15', 
      minutes: 105,
      duration: language === 'zh' ? '1小时45分钟' : '1 hour 45 minutes', 
      type: t('dashboard.type.lecture') 
    },
    { 
      date: '2024-01-14', 
      minutes: 18,
      duration: language === 'zh' ? '18分钟' : '18 minutes', 
      type: t('dashboard.type.video') 
    },
  ];

  const subtitleHistory = [
    {
      id: 1,
      name: language === 'zh' ? '产品发布会_20240118.srt' : 'Product_Launch_20240118.srt',
      date: '2024-01-18',
      duration: '45:30',
      minutes: 45,
      size: '12.5 KB'
    },
    {
      id: 2,
      name: language === 'zh' ? 'AI课程_第3讲_20240117.srt' : 'AI_Course_Lesson3_20240117.srt',
      date: '2024-01-17',
      duration: '1:20:15',
      minutes: 80,
      size: '28.3 KB'
    },
    {
      id: 3,
      name: language === 'zh' ? '技术面试_模拟_20240116.txt' : 'Tech_Interview_Mock_20240116.txt',
      date: '2024-01-16',
      duration: '25:45',
      minutes: 25,
      size: '8.7 KB'
    },
    {
      id: 4,
      name: language === 'zh' ? '学术讲座_深度学习_20240115.srt' : 'Academic_Lecture_DeepLearning_20240115.srt',
      date: '2024-01-15',
      duration: '1:45:20',
      minutes: 105,
      size: '45.2 KB'
    }
  ];

  const languages = [
    { code: 'zh', name: '中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
  ];

  const handleDownload = (fileId: number) => {
    console.log(`下载文件 ID: ${fileId}`);
  };

  const handleLogout = () => {
    console.log('用户登出');
  };

  const totalMinutesThisMonth = usageHistory.reduce((sum, record) => sum + record.minutes, 0);
  const totalFiles = subtitleHistory.length;
  const totalDays = new Set(usageHistory.map(record => record.date)).size;

  // Check if user is admin
  const isAdmin = user?.profile?.role === 'admin' || user?.profile?.role === 'super_admin';
  
  // Debug logging for admin check
  useEffect(() => {
    if (user) {
      console.log('UserDashboard - User info:', {
        email: user.email,
        profileRole: user?.profile?.role,
        accountType: user?.accountType || user?.profile?.accountType,
        isAdmin,
        fullProfile: user.profile
      });
    }
  }, [user, isAdmin]);

  // Check admin status from server
  const checkAdminStatus = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(apiRoutes.absolute(`/check-admin/${user.email}`), {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminDebugInfo(data);
        console.log('Admin check result:', data);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  // Force admin setup for specific email
  const forceAdminSetup = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(apiRoutes.absolute('/force-admin'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          forceAdmin: true
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Force admin result:', data);
        await refreshUser(); // Refresh user data
        await checkAdminStatus(); // Refresh debug info
      } else {
        const error = await response.json();
        console.error('Force admin failed:', error);
      }
    } catch (error) {
      console.error('Error forcing admin setup:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900">
        {/* Guest Mode Alert */}
        <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-700 mx-6 mt-4 mb-2">
          <User className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">{t('dashboard.loginToAccess')}</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{t('dashboard.loginToAccessDesc')}</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowLoginPrompt(true)}
                className="ml-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                {t('auth.loginToUse')}
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="h-20 w-20 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">{t('dashboard.loginToAccess')}</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">{t('dashboard.loginToAccessDesc')}</p>
                  </div>
                  <Button
                    onClick={() => setShowLoginPrompt(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    {t('auth.loginToUse')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <LoginPrompt
          open={showLoginPrompt}
          onOpenChange={setShowLoginPrompt}
          feature={language === 'zh' ? '用户中心' : 'User Dashboard'}
          description={t('dashboard.loginToAccessDesc')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900">
      {/* Time Balance for authenticated users */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-slate-500/10 border-b border-indigo-200/50 dark:border-indigo-700/50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Clock className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{t('main.timeBalance')}</span>
            <Badge 
              variant={accountType === 'pro' ? 'default' : 'secondary'} 
              className={`text-xs px-2 py-1 ${
                accountType === 'pro' 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {accountType === 'pro' || accountType === 'enterprise' ? (
                <>
                  <Crown className="h-3 w-3 mr-1" />
                  {accountType === 'pro' ? 'Pro' : 'Enterprise'}
                </>
              ) : (
                language === 'zh' ? '免费版' : 'Free'
              )}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="font-bold text-indigo-600 dark:text-indigo-400">
                {accountType === 'free' ? remainingMinutes : '∞'}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {language === 'zh' ? '今日可用' : 'Available'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-bold text-purple-600 dark:text-purple-400">
                {usedMinutesToday}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {language === 'zh' ? '已用' : 'Used'}
              </div>
            </div>
            
            {accountType === 'free' && (
              <div className="text-center">
                <div className="font-bold text-slate-600 dark:text-slate-400">
                  {remainingMonthlyMinutes}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'zh' ? '本月剩余' : 'Monthly'}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 今日时间使用进度条 */}
        {accountType === 'free' && (
          <div className="max-w-7xl mx-auto mt-3 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
              <span>{language === 'zh' ? '今日使用进度' : 'Daily Usage Progress'}</span>
              <span className="font-mono">
                {usedMinutesToday} / {ACCOUNT_LIMITS.free} {language === 'zh' ? '分钟' : 'min'}
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={(usedMinutesToday / ACCOUNT_LIMITS.free) * 100} 
                className="h-2 bg-slate-200/70 dark:bg-slate-700/70"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30"></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500">
              <span>{Math.round((usedMinutesToday / ACCOUNT_LIMITS.free) * 100)}% {language === 'zh' ? '已使用' : 'used'}</span>
              <span>{Math.round((remainingMinutes / ACCOUNT_LIMITS.free) * 100)}% {language === 'zh' ? '剩余' : 'remaining'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {language === 'zh' ? '用户中心' : 'User Dashboard'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                {language === 'zh' ? '管理您的账户信息和使用统计' : 'Manage your account information and usage statistics'}
              </p>
            </div>
          </div>

          {/* Admin Access Card - Show for admins */}
          {isAdmin && (
            <div className="mb-6">
              <Card className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-purple-200/50 dark:border-purple-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                          {language === 'zh' ? '管理员功能' : 'Admin Functions'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {language === 'zh' ? '您拥有管理员权限，可以访问后台管理系统' : 'You have admin privileges and can access the management system'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                        <Shield className="h-3 w-3 mr-1" />
                        {user?.profile?.role === 'super_admin' ? 
                          (language === 'zh' ? '超级管理员' : 'Super Admin') : 
                          (language === 'zh' ? '管理员' : 'Admin')
                        }
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => refreshUser()}
                          variant="outline"
                          className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {language === 'zh' ? '刷新权限' : 'Refresh'}
                        </Button>
                        <Button
                          onClick={() => window.open('/admin', '_blank')}
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          {language === 'zh' ? '进入管理后台' : 'Access Admin Panel'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Admin Debug Panel - For Wyatt Wang only */}
          {user?.email === 'awyawjf2000@gmail.com' && (
            <div className="mb-6">
              <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-200/50 dark:border-amber-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Bug className="h-5 w-5 text-amber-600" />
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        管理员权限调试面板
                      </h3>
                    </div>
                    <Button
                      onClick={() => setShowDebugPanel(!showDebugPanel)}
                      variant="outline"
                      size="sm"
                      className="border-amber-200 dark:border-amber-700"
                    >
                      {showDebugPanel ? '隐藏' : '显示'} Debug
                    </Button>
                  </div>
                  
                  {showDebugPanel && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            {isAdmin ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm font-medium">前端检查</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Role: {user?.profile?.role || 'undefined'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            isAdmin: {isAdmin ? 'true' : 'false'}
                          </p>
                        </div>
                        
                        <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            {adminDebugInfo?.isAdmin ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm font-medium">服务端检查</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Role: {adminDebugInfo?.role || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            isAdmin: {adminDebugInfo?.isAdmin ? 'true' : 'false'}
                          </p>
                        </div>
                        
                        <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">邮箱检查</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {user?.email}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            匹配: {user?.email === 'awyawjf2000@gmail.com' ? 'true' : 'false'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Button
                          onClick={checkAdminStatus}
                          variant="outline"
                          size="sm"
                          className="border-blue-200 dark:border-blue-700"
                        >
                          检查服务端权限
                        </Button>
                        <Button
                          onClick={forceAdminSetup}
                          variant="outline"
                          size="sm"
                          className="border-green-200 dark:border-green-700"
                        >
                          强制设置管理员
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              // Try the force admin API
                              await forceAdminSetup();
                              // Wait a bit then refresh user
                              setTimeout(async () => {
                                await refreshUser();
                                window.location.reload(); // Force page reload to ensure all components get updated
                              }, 2000);
                            } catch (error) {
                              console.error('Force refresh failed:', error);
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="border-purple-200 dark:border-purple-700"
                        >
                          完全刷新权限
                        </Button>
                        <Button
                          onClick={() => refreshUser()}
                          variant="outline"
                          size="sm"
                          className="border-purple-200 dark:border-purple-700"
                        >
                          刷新用户数据
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              const result = await setupWyattAdmin();
                              if (result.success) {
                                await refreshUser();
                                setTimeout(() => window.location.reload(), 1000);
                              }
                            } catch (error) {
                              console.error('Wyatt admin setup failed:', error);
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="border-indigo-200 dark:border-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Wyatt 管理员设置
                        </Button>
                      </div>
                      
                      {adminDebugInfo && (
                        <div className="p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">调试信息:</h4>
                          <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-auto">
                            {JSON.stringify(adminDebugInfo, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Info Header */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                    <Crown className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-lg text-slate-800 dark:text-slate-200">{t('dashboard.currentPlan')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {userInfo.plan}
                    </span>
                    <Badge className={`${
                      accountType === 'pro' || accountType === 'enterprise' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      <Star className="h-3 w-3 mr-1" />
                      {t('dashboard.active')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('dashboard.validUntil')}{userInfo.validUntil}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                  >
                    {t('dashboard.upgradePlan')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-lg flex items-center justify-center">
                    <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-lg text-slate-800 dark:text-slate-200">{t('dashboard.dailyTimeUsage')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{t('dashboard.todayUsed')}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {usedMinutesToday} / {accountType === 'free' ? ACCOUNT_LIMITS.free : '∞'} {t('main.minutes')}
                      </span>
                    </div>
                    {accountType === 'free' && (
                      <Progress value={(usedMinutesToday / ACCOUNT_LIMITS.free) * 100} className="h-2" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {accountType === 'free' 
                      ? `${t('dashboard.todayRemaining')} ${remainingMinutes} ${t('main.minutes')}`
                      : t('dashboard.nextReset') + ' ' + t('dashboard.tomorrow')
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-gradient-to-r from-slate-100 to-indigo-100 dark:from-slate-800 dark:to-indigo-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <CardTitle className="text-lg text-slate-800 dark:text-slate-200">{t('dashboard.monthlyStats')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.transcriptionTime')}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {Math.floor(totalMinutesThisMonth / 60)}{t('dashboard.hours')}{totalMinutesThisMonth % 60}{t('dashboard.minutes')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.subtitleFiles')}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{totalFiles}{t('dashboard.files')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.usageDays')}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{totalDays}{t('dashboard.days')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
            <Tabs defaultValue="usage" className="space-y-6">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 dark:bg-slate-700/50">
                  <TabsTrigger value="usage" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>{t('dashboard.usageRecord')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center space-x-2">
                    <History className="h-4 w-4" />
                    <span>{t('dashboard.subtitleHistory')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>{t('dashboard.settings')}</span>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="usage" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">{t('dashboard.timeUsageRecord')}</h3>
                  </div>
                  <div className="rounded-lg border border-slate-200/50 dark:border-slate-600/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200/50 dark:border-slate-600/50">
                          <TableHead className="text-slate-700 dark:text-slate-300">{t('dashboard.date')}</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300">{t('dashboard.duration')}</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300">{t('dashboard.type')}</TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '效率' : 'Efficiency'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usageHistory.map((record, index) => (
                          <TableRow key={index} className="border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                            <TableCell className="text-slate-700 dark:text-slate-300">{record.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700">
                                {record.duration}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">{record.type}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-400 to-green-600" 
                                    style={{ width: `${Math.min(100, (record.minutes / 60) * 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                  {Math.round((record.minutes / 60) * 100)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">{t('dashboard.subtitleHistoryFiles')}</h3>
                  </div>
                  <ScrollArea className="h-[400px] w-full rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-slate-50/50 dark:bg-slate-900/50 p-4">
                    <div className="space-y-4">
                      {subtitleHistory.map((file) => (
                        <Card key={file.id} className="p-4 bg-white/60 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2 flex-1">
                              <h4 className="font-medium text-slate-800 dark:text-slate-200">{file.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{file.date}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{file.duration}</span>
                                </span>
                                <span>{t('dashboard.size')}: {file.size}</span>
                                <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                                  {file.minutes} {t('main.minutes')}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(file.id)}
                              className="ml-4 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {t('dashboard.download')}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <div className="grid gap-6">
                    <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                          <Globe2 className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                          {t('dashboard.languagePreferences')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('dashboard.defaultSourceLanguage')}</label>
                            <Select value={defaultSourceLang} onValueChange={setDefaultSourceLang}>
                              <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {languages.map((lang) => (
                                  <SelectItem key={lang.code} value={lang.code}>
                                    {lang.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('dashboard.defaultTargetLanguage')}</label>
                            <Select value={defaultTargetLang} onValueChange={setDefaultTargetLang}>
                              <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {languages.map((lang) => (
                                  <SelectItem key={lang.code} value={lang.code}>
                                    {lang.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-600/50">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('dashboard.autoLanguageDetection')}</label>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {t('dashboard.autoLanguageDetectionDesc')}
                            </p>
                          </div>
                          <Switch checked={autoDetection} onCheckedChange={setAutoDetection} />
                        </div>

                        <div className="pt-4">
                          <Button className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
                            {t('dashboard.saveSettings')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                          <Shield className="h-5 w-5 mr-2 text-slate-600 dark:text-slate-400" />
                          {t('dashboard.accountManagement')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('dashboard.username')}</label>
                            <p className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50">
                              {userInfo.name}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('dashboard.email')}</label>
                            <p className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-slate-200/50 dark:border-slate-600/50">
                              {userInfo.email}
                            </p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-600/50">
                          <Button
                            variant="destructive"
                            onClick={handleLogout}
                            className="w-full md:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            {t('dashboard.logout')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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