import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { 
  Shield, 
  Settings, 
  Users, 
  Database,
  Chrome,
  Key,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  TestTube,
  Globe,
  Lock
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { GoogleAuthSetup } from './GoogleAuthSetup';

export function AdminPanel() {
  const { t, language } = useContext(LanguageContext);
  const { user, signInWithGoogle } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [testing, setTesting] = useState(false);
  const [authStats, setAuthStats] = useState({
    totalUsers: 0,
    googleUsers: 0,
    emailUsers: 0,
    phoneUsers: 0
  });

  // Test Google OAuth configuration
  const testGoogleAuth = async () => {
    setTesting(true);
    try {
      // This will attempt to redirect to Google OAuth
      const result = await signInWithGoogle();
      
      if (result.success) {
        toast.success(
          language === 'zh' 
            ? 'Google OAuth 配置测试通过！正在重定向...' 
            : 'Google OAuth configuration test passed! Redirecting...'
        );
      } else {
        toast.error(
          language === 'zh' 
            ? `Google OAuth 测试失败: ${result.error}` 
            : `Google OAuth test failed: ${result.error}`
        );
      }
    } catch (error) {
      toast.error(
        language === 'zh' 
          ? 'Google OAuth 测试出现错误' 
          : 'Google OAuth test error'
      );
    } finally {
      setTesting(false);
    }
  };

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, this would fetch from your backend
    setAuthStats({
      totalUsers: 1247,
      googleUsers: 892,
      emailUsers: 301,
      phoneUsers: 54
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(
      language === 'zh' ? '已复制到剪贴板' : 'Copied to clipboard'
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
          <Shield className="h-8 w-8 text-blue-500" />
          <span>
            {language === 'zh' ? 'Ez Meeting 管理面板' : 'Ez Meeting Admin Panel'}
          </span>
        </h1>
        <p className="text-muted-foreground">
          {language === 'zh' 
            ? '管理用户认证、OAuth配置和系统设置' 
            : 'Manage user authentication, OAuth configuration and system settings'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{authStats.totalUsers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'zh' ? '总用户数' : 'Total Users'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Chrome className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{authStats.googleUsers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'zh' ? 'Google 用户' : 'Google Users'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{authStats.emailUsers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'zh' ? '邮箱用户' : 'Email Users'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{authStats.phoneUsers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'zh' ? '手机用户' : 'Phone Users'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            {language === 'zh' ? '概览' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="google-oauth">
            {language === 'zh' ? 'Google OAuth' : 'Google OAuth'}
          </TabsTrigger>
          <TabsTrigger value="users">
            {language === 'zh' ? '用户管理' : 'User Management'}
          </TabsTrigger>
          <TabsTrigger value="settings">
            {language === 'zh' ? '系统设置' : 'System Settings'}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>
                  {language === 'zh' ? '认证系统状态' : 'Authentication System Status'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {language === 'zh' ? '邮箱登录' : 'Email Login'}
                    </span>
                    <Badge variant="default">
                      {language === 'zh' ? '已启用' : 'Enabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {language === 'zh' ? '手机登录' : 'Phone Login'}
                    </span>
                    <Badge variant="default">
                      {language === 'zh' ? '已启用' : 'Enabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {language === 'zh' ? 'Google OAuth' : 'Google OAuth'}
                    </span>
                    <Badge variant="outline">
                      {language === 'zh' ? '需要配置' : 'Setup Required'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm font-medium">
                    {language === 'zh' ? '用户登录方式分布' : 'User Login Method Distribution'}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Google: {((authStats.googleUsers / authStats.totalUsers) * 100).toFixed(1)}%</span>
                      <span>{authStats.googleUsers}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Email: {((authStats.emailUsers / authStats.totalUsers) * 100).toFixed(1)}%</span>
                      <span>{authStats.emailUsers}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Phone: {((authStats.phoneUsers / authStats.totalUsers) * 100).toFixed(1)}%</span>
                      <span>{authStats.phoneUsers}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'zh' 
                    ? '当前Google OAuth尚未配置。配置后用户可以使用Google账户快速登录，这将显著提升用户体验和转化率。' 
                    : 'Google OAuth is not yet configured. Once configured, users can quickly login with their Google accounts, significantly improving user experience and conversion rates.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google OAuth Tab */}
        <TabsContent value="google-oauth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Chrome className="h-5 w-5 text-blue-500" />
                <span>
                  {language === 'zh' ? 'Google OAuth 配置' : 'Google OAuth Configuration'}
                </span>
              </CardTitle>
              <CardDescription>
                {language === 'zh' 
                  ? '配置Google登录功能，让用户可以使用Google账户快速登录' 
                  : 'Configure Google login functionality for users to quickly sign in with their Google accounts'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Test */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {language === 'zh' ? '快速测试' : 'Quick Test'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'zh' 
                      ? '测试当前Google OAuth配置是否正常工作' 
                      : 'Test if current Google OAuth configuration is working'}
                  </div>
                </div>
                <Button onClick={testGoogleAuth} disabled={testing}>
                  {testing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'zh' ? '测试中...' : 'Testing...'}
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      {language === 'zh' ? '测试登录' : 'Test Login'}
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Configuration Guide */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {language === 'zh' ? '配置指南' : 'Configuration Guide'}
                  </div>
                  <Dialog open={showGoogleSetup} onOpenChange={setShowGoogleSetup}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '查看配置指南' : 'View Setup Guide'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {language === 'zh' ? 'Google OAuth 配置指南' : 'Google OAuth Setup Guide'}
                        </DialogTitle>
                        <DialogDescription>
                          {language === 'zh' 
                            ? '按照以下步骤配置Google OAuth登录功能' 
                            : 'Follow these steps to configure Google OAuth login functionality'}
                        </DialogDescription>
                      </DialogHeader>
                      <GoogleAuthSetup onClose={() => setShowGoogleSetup(false)} />
                    </DialogContent>
                  </Dialog>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {language === 'zh' 
                      ? '配置Google OAuth需要在Google Cloud Console和Supabase仪表板中进行设置。详细步骤请查看配置指南。' 
                      : 'Configuring Google OAuth requires setup in both Google Cloud Console and Supabase Dashboard. See the setup guide for detailed steps.'}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>
                  {language === 'zh' ? '用户统计' : 'User Statistics'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">{authStats.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'zh' ? '总注册用户' : 'Total Registered Users'}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {Math.round((authStats.googleUsers / authStats.totalUsers) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'zh' ? 'Google登录用户占比' : 'Google Login User Ratio'}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-500">
                    {Math.round((authStats.emailUsers / authStats.totalUsers) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'zh' ? '邮箱登录用户占比' : 'Email Login User Ratio'}
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'zh' 
                    ? 'Google登录功能配置完成后，预计可以将用户注册转化率提升30-50%，并显著改善用户登录体验。' 
                    : 'Once Google login is configured, it is expected to increase user registration conversion rates by 30-50% and significantly improve user login experience.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>
                  {language === 'zh' ? '认证设置' : 'Authentication Settings'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {language === 'zh' ? '允许邮箱注册' : 'Allow Email Registration'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'zh' ? '用户可以使用邮箱和密码注册账户' : 'Users can register with email and password'}
                    </div>
                  </div>
                  <Badge variant="default">
                    {language === 'zh' ? '已启用' : 'Enabled'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {language === 'zh' ? '允许手机注册' : 'Allow Phone Registration'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'zh' ? '用户可以使用手机号和短信验证码注册' : 'Users can register with phone number and SMS verification'}
                    </div>
                  </div>
                  <Badge variant="default">
                    {language === 'zh' ? '已启用' : 'Enabled'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {language === 'zh' ? 'Google OAuth 登录' : 'Google OAuth Login'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'zh' ? '用户可以使用Google账户快速登录' : 'Users can quickly login with Google accounts'}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {language === 'zh' ? '待配置' : 'Pending Setup'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  {language === 'zh' 
                    ? '所有认证设置的更改都需要在Supabase仪表板中进行配置。Ez Meeting应用会自动同步这些设置。' 
                    : 'All authentication setting changes need to be configured in the Supabase dashboard. The Ez Meeting app will automatically sync these settings.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}