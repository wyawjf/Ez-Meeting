import React, { useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Shield, 
  Crown, 
  CheckCircle, 
  AlertCircle,
  Settings,
  User,
  Zap,
  RefreshCw
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

export function AdminSetupPage() {
  const { language } = useContext(LanguageContext);
  const { user, setupWyattAdmin, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [email, setEmail] = useState('awyawjf2000@gmail.com');

  const handleSetupAdmin = async () => {
    setLoading(true);
    try {
      const result = await setupWyattAdmin();
      setSetupResult(result);
      
      if (result.success) {
        toast.success(
          language === 'zh' 
            ? 'Wyatt Wang 管理员权限设置成功！' 
            : 'Wyatt Wang admin privileges setup successfully!'
        );
        
        // Refresh user data after 2 seconds
        setTimeout(async () => {
          if (user?.email === 'awyawjf2000@gmail.com') {
            await refreshUser();
            // Force page reload to ensure all components update
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }, 2000);
      } else {
        toast.error(
          language === 'zh' 
            ? `设置失败：${result.error}` 
            : `Setup failed: ${result.error}`
        );
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast.error(
        language === 'zh' ? '设置过程中出现错误' : 'Error occurred during setup'
      );
    } finally {
      setLoading(false);
    }
  };

  const isWyattEmail = user?.email === 'awyawjf2000@gmail.com';
  const currentRole = user?.profile?.role;
  const currentAccountType = user?.profile?.accountType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {language === 'zh' ? 'Wyatt Wang 管理员权限设置' : 'Wyatt Wang Admin Setup'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {language === 'zh' 
                ? '为 Wyatt Wang (awyawjf2000@gmail.com) 设置管理员权限' 
                : 'Setup admin privileges for Wyatt Wang (awyawjf2000@gmail.com)'}
            </p>
          </div>
        </div>

        {/* Current User Status */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
              <User className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              {language === 'zh' ? '当前用户状态' : 'Current User Status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'zh' ? '邮箱' : 'Email'}:
                    </span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'zh' ? '姓名' : 'Name'}:
                    </span>
                    <span className="font-medium">{user.profile?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'zh' ? '是否为目标邮箱' : 'Is Target Email'}:
                    </span>
                    <Badge className={isWyattEmail ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}>
                      {isWyattEmail ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {language === 'zh' ? '是' : 'Yes'}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {language === 'zh' ? '否' : 'No'}
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'zh' ? '当前角色' : 'Current Role'}:
                    </span>
                    <Badge className={currentRole === 'admin' || currentRole === 'super_admin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}>
                      <Shield className="h-3 w-3 mr-1" />
                      {currentRole === 'admin' ? (language === 'zh' ? '管理员' : 'Admin') : 
                       currentRole === 'super_admin' ? (language === 'zh' ? '超级管理员' : 'Super Admin') :
                       (language === 'zh' ? '普通用户' : 'User')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'zh' ? '账户类型' : 'Account Type'}:
                    </span>
                    <Badge className={currentAccountType === 'pro' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}>
                      {currentAccountType === 'pro' ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Pro
                        </>
                      ) : currentAccountType === 'enterprise' ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Enterprise
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-1" />
                          Free
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'zh' ? '请先登录以查看用户状态' : 'Please login first to view user status'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Admin Setup Section */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
              <Settings className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              {language === 'zh' ? '管理员权限设置' : 'Admin Privileges Setup'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  {language === 'zh' ? '目标邮箱' : 'Target Email'}
                </Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="awyawjf2000@gmail.com"
                  disabled
                  className="mt-1 bg-slate-50 dark:bg-slate-700"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'zh' ? '此邮箱将被授予管理员权限' : 'This email will be granted admin privileges'}
                </p>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">
                      {language === 'zh' ? '将会执行以下操作：' : 'The following actions will be performed:'}
                    </div>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>{language === 'zh' ? '设置 Wyatt Wang 为管理员角色' : 'Set Wyatt Wang as admin role'}</li>
                      <li>{language === 'zh' ? '升级账户为 Pro 类型' : 'Upgrade account to Pro type'}</li>
                      <li>{language === 'zh' ? '启用所有管理功能权限' : 'Enable all admin functionality permissions'}</li>
                      <li>{language === 'zh' ? '允许访问管理后台和用户管理' : 'Allow access to admin panel and user management'}</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleSetupAdmin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {language === 'zh' ? '设置中...' : 'Setting up...'}
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    {language === 'zh' ? '设置 Wyatt Wang 为管理员' : 'Setup Wyatt Wang as Admin'}
                  </>
                )}
              </Button>
            </div>

            {/* Setup Result */}
            {setupResult && (
              <Alert className={setupResult.success ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/30' : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30'}>
                {setupResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={setupResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                  <div className="space-y-2">
                    <div className="font-medium">
                      {setupResult.success 
                        ? (language === 'zh' ? '✅ 设置成功！' : '✅ Setup Successful!') 
                        : (language === 'zh' ? '❌ 设置失败' : '❌ Setup Failed')}
                    </div>
                    <div className="text-sm">
                      {setupResult.success 
                        ? (language === 'zh' ? 'Wyatt Wang 已成功获得管理员权限。页面将自动刷新以更新权限状态。' : 'Wyatt Wang has been successfully granted admin privileges. The page will refresh automatically to update permission status.')
                        : `${language === 'zh' ? '错误：' : 'Error: '}${setupResult.error}`}
                    </div>
                    {setupResult.success && setupResult.data?.debug && (
                      <div className="text-xs mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                        <div>{language === 'zh' ? '调试信息：' : 'Debug Info:'}</div>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(setupResult.data.debug, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-slate-200">
              {language === 'zh' ? '使用说明' : 'Instructions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p>
                {language === 'zh' 
                  ? '1. 点击上方按钮为 Wyatt Wang (awyawjf2000@gmail.com) 设置管理员权限'
                  : '1. Click the button above to setup admin privileges for Wyatt Wang (awyawjf2000@gmail.com)'}
              </p>
              <p>
                {language === 'zh' 
                  ? '2. 设置成功后，该账户将获得：管理员角色、Pro账户类型、完整管理权限'
                  : '2. After successful setup, the account will receive: Admin role, Pro account type, full management permissions'}
              </p>
              <p>
                {language === 'zh' 
                  ? '3. 如果 Wyatt Wang 已经登录，页面将自动刷新以应用新权限'
                  : '3. If Wyatt Wang is already logged in, the page will refresh automatically to apply new permissions'}
              </p>
              <p>
                {language === 'zh' 
                  ? '4. 管理员可以访问顶部导航栏的"管理"和"管理后台"选项'
                  : '4. Admins can access "Management" and "Admin Panel" options in the top navigation'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}