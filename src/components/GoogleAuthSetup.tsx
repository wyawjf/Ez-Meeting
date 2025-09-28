import React, { useState, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { 
  Chrome, 
  ExternalLink, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Info,
  Copy,
  Shield,
  Globe,
  Key,
  Users,
  Zap
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';

interface GoogleAuthSetupProps {
  onClose?: () => void;
}

export function GoogleAuthSetup({ onClose }: GoogleAuthSetupProps) {
  const { t, language } = useContext(LanguageContext);
  const { signInWithGoogle } = useAuth();
  const [testing, setTesting] = useState(false);

  // Test Google OAuth
  const handleTestGoogleAuth = async () => {
    setTesting(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        toast.success(
          language === 'zh' 
            ? 'Google OAuth 配置正常，正在跳转...' 
            : 'Google OAuth configured correctly, redirecting...'
        );
      } else {
        toast.error(
          language === 'zh' 
            ? `Google登录测试失败: ${result.error}` 
            : `Google login test failed: ${result.error}`
        );
      }
    } catch (error) {
      toast.error(
        language === 'zh' 
          ? 'Google登录测试出错' 
          : 'Google login test error'
      );
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(
      language === 'zh' ? '已复制到剪贴板' : 'Copied to clipboard'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Chrome className="h-8 w-8 text-blue-500" />
          <h2 className="text-2xl font-bold">
            {language === 'zh' ? 'Google OAuth 设置' : 'Google OAuth Setup'}
          </h2>
        </div>
        <p className="text-muted-foreground">
          {language === 'zh' 
            ? '为Ez Meeting配置Google账户快速登录功能' 
            : 'Configure Google account quick login for Ez Meeting'}
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>
              {language === 'zh' ? '当前状态' : 'Current Status'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {language === 'zh' ? 'Google OAuth 集成' : 'Google OAuth Integration'}
            </span>
            <Badge variant="secondary">
              {language === 'zh' ? '代码已就绪' : 'Code Ready'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {language === 'zh' ? 'Supabase 配置' : 'Supabase Configuration'}
            </span>
            <Badge variant="outline">
              {language === 'zh' ? '需要设置' : 'Setup Required'}
            </Badge>
          </div>
          
          <Separator />
          
          <Button 
            onClick={handleTestGoogleAuth} 
            disabled={testing}
            className="w-full"
            variant="outline"
          >
            <Chrome className="h-4 w-4 mr-2" />
            {testing 
              ? (language === 'zh' ? '测试中...' : 'Testing...') 
              : (language === 'zh' ? '测试 Google 登录' : 'Test Google Login')
            }
          </Button>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-500" />
            <span>
              {language === 'zh' ? 'Google登录优势' : 'Google Login Benefits'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <div>
              <div className="font-medium text-sm">
                {language === 'zh' ? '一键快速登录' : 'One-Click Quick Login'}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'zh' 
                  ? '用户无需记忆额外密码，使用Google账户即可快速登录' 
                  : 'Users can quickly login without remembering additional passwords'}
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <div className="font-medium text-sm">
                {language === 'zh' ? '安全可靠' : 'Secure & Reliable'}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'zh' 
                  ? '基于Google OAuth 2.0标准，安全性由Google保障' 
                  : 'Based on Google OAuth 2.0 standard with Google-backed security'}
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Users className="h-4 w-4 text-purple-500 mt-0.5" />
            <div>
              <div className="font-medium text-sm">
                {language === 'zh' ? '用户体验优秀' : 'Excellent User Experience'}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'zh' 
                  ? '减少注册流程，提高用户转化率和留存率' 
                  : 'Reduces registration steps, improves user conversion and retention'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>
              {language === 'zh' ? '配置步骤' : 'Setup Instructions'}
            </span>
          </CardTitle>
          <CardDescription>
            {language === 'zh' 
              ? '在Supabase仪表板中配置Google OAuth Provider' 
              : 'Configure Google OAuth Provider in Supabase Dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                1
              </Badge>
              <span className="font-medium">
                {language === 'zh' ? '创建 Google OAuth 应用' : 'Create Google OAuth App'}
              </span>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === 'zh' 
                  ? '前往 Google Cloud Console 创建新的 OAuth 2.0 客户端' 
                  : 'Go to Google Cloud Console to create a new OAuth 2.0 client'}
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {language === 'zh' ? '打开 Google Cloud Console' : 'Open Google Cloud Console'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                2
              </Badge>
              <span className="font-medium">
                {language === 'zh' ? '配置重定向 URL' : 'Configure Redirect URLs'}
              </span>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === 'zh' 
                  ? '在Google OAuth应用中添加以下重定向URL：' 
                  : 'Add the following redirect URL to your Google OAuth app:'}
              </p>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <code className="text-xs">
                    https://[your-project-id].supabase.co/auth/v1/callback
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard('https://[your-project-id].supabase.co/auth/v1/callback')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {language === 'zh' 
                    ? '请将 [your-project-id] 替换为您的实际 Supabase 项目ID' 
                    : 'Replace [your-project-id] with your actual Supabase project ID'}
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <Separator />

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                3
              </Badge>
              <span className="font-medium">
                {language === 'zh' ? '在 Supabase 中配置' : 'Configure in Supabase'}
              </span>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === 'zh' 
                  ? '在 Supabase 仪表板的 Authentication > Providers 中启用 Google' 
                  : 'Enable Google in Supabase Dashboard under Authentication > Providers'}
              </p>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  {language === 'zh' ? '需要填入的信息：' : 'Required information:'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted p-2 rounded">
                    <div className="font-medium">Client ID</div>
                    <div className="text-muted-foreground">
                      {language === 'zh' ? '从Google Console获取' : 'From Google Console'}
                    </div>
                  </div>
                  <div className="bg-muted p-2 rounded">
                    <div className="font-medium">Client Secret</div>
                    <div className="text-muted-foreground">
                      {language === 'zh' ? '从Google Console获取' : 'From Google Console'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Step 4 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                4
              </Badge>
              <span className="font-medium">
                {language === 'zh' ? '测试配置' : 'Test Configuration'}
              </span>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === 'zh' 
                  ? '配置完成后，使用上方的测试按钮验证Google登录功能' 
                  : 'After configuration, use the test button above to verify Google login functionality'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>
              {language === 'zh' ? '更多帮助' : 'Additional Help'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {language === 'zh' 
              ? '查看 Supabase 官方文档获取详细的Google OAuth配置指南：' 
              : 'Check Supabase official documentation for detailed Google OAuth configuration guide:'}
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://supabase.com/docs/guides/auth/social-login/auth-google', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {language === 'zh' ? '查看官方文档' : 'View Official Documentation'}
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {onClose && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            {language === 'zh' ? '关闭' : 'Close'}
          </Button>
        </div>
      )}

      {/* Status Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {language === 'zh' 
            ? '⚠️ 重要提醒：您必须完成上述Supabase配置步骤后，Google登录功能才能正常工作。完成配置后，用户就可以在登录页面看到并使用"使用Google登录"按钮了。' 
            : '⚠️ Important: You must complete the Supabase configuration steps above for Google login to work. After configuration, users will be able to see and use the "Continue with Google" button on the login page.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}