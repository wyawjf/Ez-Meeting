import React, { useContext } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LanguageContext } from '../App';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Shield, 
  User, 
  Clock
} from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
}

export function AdminRoute({ children, requiredRole = 'admin' }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const { language } = useContext(LanguageContext);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-12 w-12 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                {language === 'zh' ? '验证权限中...' : 'Verifying Permissions...'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {language === 'zh' ? '请稍等' : 'Please wait'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Require login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-red-200/50 dark:border-red-700/50">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-16 w-16 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-full flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                {language === 'zh' ? '需要登录' : 'Login Required'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {language === 'zh' 
                  ? '您需要登录才能访问此页面。'
                  : 'You need to be logged in to access this page.'}
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              {language === 'zh' ? '前往登录' : 'Go to Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has required permissions
  const userRole = user?.profile?.role || 'user';
  const hasPermission = checkPermission(userRole, requiredRole);

  console.log('🔒 Admin route access check:', {
    email: user.email,
    userRole,
    requiredRole,
    hasPermission
  });

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-red-200/50 dark:border-red-700/50">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-16 w-16 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                {language === 'zh' ? '访问被拒绝' : 'Access Denied'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {language === 'zh' 
                  ? `当前角色：${getRoleDisplayName(userRole, language)}，需要：${getRoleDisplayName(requiredRole, language)}`
                  : `Current role: ${getRoleDisplayName(userRole, language)}, Required: ${getRoleDisplayName(requiredRole, language)}`}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Badge variant="destructive">
                  <User className="h-3 w-3 mr-1" />
                  {getRoleDisplayName(userRole, language)}
                </Badge>
                <span className="text-slate-400">→</span>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  {getRoleDisplayName(requiredRole, language)}
                </Badge>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'zh' 
                  ? '请联系管理员获取相应权限。'
                  : 'Please contact an administrator for the required permissions.'}
              </p>
            </div>

            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="w-full border-slate-200 dark:border-slate-700"
              >
                {language === 'zh' ? '返回用户中心' : 'Back to Dashboard'}
              </Button>
              <Button 
                onClick={() => window.location.href = '/main'}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                {language === 'zh' ? '返回主页' : 'Back to Home'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Helper function to check permissions
function checkPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'user': 1,
    'admin': 2,
    'super_admin': 3
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

// Helper function to get role display name
function getRoleDisplayName(role: string, language: 'zh' | 'en'): string {
  const roleNames = {
    'user': language === 'zh' ? '普通用户' : 'User',
    'admin': language === 'zh' ? '管理员' : 'Admin',
    'super_admin': language === 'zh' ? '超级管理员' : 'Super Admin'
  };

  return roleNames[role as keyof typeof roleNames] || role;
}