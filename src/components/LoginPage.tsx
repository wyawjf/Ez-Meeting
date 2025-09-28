import React, { useState, useContext, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { toast } from 'sonner@2.0.3';
import { 
  Mail, 
  Phone, 
  Lock, 
  User, 
  Loader2, 
  Eye, 
  EyeOff,
  Chrome,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Smartphone
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';

export function LoginPage() {
  const { t, language } = useContext(LanguageContext);
  const { user, signIn, signInWithGoogle, signInWithPhone, sendPhoneOTP, signUp } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Email/Password form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Phone form
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showPhoneOTPDialog, setShowPhoneOTPDialog] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/main" replace />;
  }

  // Auto-redirect on user state change
  useEffect(() => {
    if (user) {
      console.log('User logged in, redirecting to main page');
      navigate('/main', { replace: true });
    }
  }, [user, navigate]);

  // Handle email/password sign in
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(language === 'zh' ? '请填写邮箱和密码' : 'Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting to sign in with:', email);
      const result = await signIn(email, password);
      
      if (!result.success) {
        setError(result.error || (language === 'zh' ? '登录失败，请检查账号密码' : 'Login failed, please check your credentials'));
      } else {
        toast.success(language === 'zh' ? '登录成功！' : 'Login successful!');
        
        // Give a short delay for the auth state to update, then manually navigate
        setTimeout(() => {
          console.log('Login successful, navigating to main page');
          navigate('/main', { replace: true });
        }, 500);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(language === 'zh' ? '登录过程中发生错误' : 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Handle email/password sign up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name) {
      setError(language === 'zh' ? '请填写所有必填字段' : 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError(language === 'zh' ? '密码确认不匹配' : 'Password confirmation does not match');
      return;
    }

    if (password.length < 6) {
      setError(language === 'zh' ? '密码至少需要6位字符' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signUp(email, password, name);
      
      if (!result.success) {
        setError(result.error || (language === 'zh' ? '注册失败，请重试' : 'Sign up failed, please try again'));
      } else {
        toast.success(language === 'zh' ? '注册并登录成功！' : 'Registration and login successful!');
        
        // Give a short delay for the auth state to update, then manually navigate
        setTimeout(() => {
          console.log('Sign up successful, navigating to main page');
          navigate('/main', { replace: true });
        }, 500);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError(language === 'zh' ? '注册过程中发生错误' : 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    const result = await signInWithGoogle();
    
    if (!result.success) {
      setError(result.error || (language === 'zh' ? 'Google登录失败' : 'Google login failed'));
      setLoading(false);
    }
    // Note: Google OAuth will redirect, so we don't set loading to false here
  };

  // Handle phone OTP send
  const handleSendPhoneOTP = async () => {
    if (!phone) {
      setError(language === 'zh' ? '请输入手机号' : 'Please enter phone number');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError(language === 'zh' ? '请输入有效的手机号（包含国家代码）' : 'Please enter a valid phone number (include country code)');
      return;
    }

    setPhoneLoading(true);
    setError('');

    const result = await sendPhoneOTP(phone);
    
    if (result.success) {
      setOtpSent(true);
      setShowPhoneOTPDialog(true);
      toast.success(language === 'zh' ? '验证码已发送' : 'Verification code sent');
    } else {
      setError(result.error || (language === 'zh' ? '发送验证码失败' : 'Failed to send verification code'));
    }
    
    setPhoneLoading(false);
  };

  // Handle phone OTP verification
  const handlePhoneOTPVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError(language === 'zh' ? '请输入6位验证码' : 'Please enter 6-digit verification code');
      return;
    }

    setPhoneLoading(true);
    setError('');

    try {
      const result = await signInWithPhone(phone, otp);
      
      if (result.success) {
        toast.success(language === 'zh' ? '登录成功！' : 'Login successful!');
        setShowPhoneOTPDialog(false);
        
        // Give a short delay for the auth state to update, then manually navigate
        setTimeout(() => {
          console.log('Phone login successful, navigating to main page');
          navigate('/main', { replace: true });
        }, 500);
      } else {
        setError(result.error || (language === 'zh' ? '验证码错误' : 'Invalid verification code'));
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      setError(language === 'zh' ? '验证过程中发生错误' : 'An error occurred during verification');
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Ez Meeting</h1>
          <p className="text-muted-foreground">
            {language === 'zh' 
              ? '智能字幕翻译，让沟通无国界' 
              : 'Smart subtitle translation for seamless communication'}
          </p>
        </div>

        {/* Main Auth Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isSignUp 
                ? (language === 'zh' ? '创建账户' : 'Create Account')
                : (language === 'zh' ? '登录账户' : 'Sign In')
              }
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? (language === 'zh' ? '注册新账户开始使用Ez Meeting' : 'Sign up for a new account to start using Ez Meeting')
                : (language === 'zh' ? '登录您的账户继续使用' : 'Sign in to your account to continue')
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Auth Tabs */}
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{language === 'zh' ? '邮箱' : 'Email'}</span>
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{language === 'zh' ? '手机' : 'Phone'}</span>
                </TabsTrigger>
              </TabsList>

              {/* Email Tab */}
              <TabsContent value="email" className="space-y-4">
                <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-4">
                  {/* Name field for sign up */}
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {language === 'zh' ? '姓名' : 'Name'}
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder={language === 'zh' ? '请输入您的姓名' : 'Enter your name'}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Email field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {language === 'zh' ? '邮箱地址' : 'Email Address'}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={language === 'zh' ? '请输入邮箱地址' : 'Enter your email address'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {language === 'zh' ? '密码' : 'Password'}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={language === 'zh' ? '请输入密码' : 'Enter your password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Confirm Password field for sign up */}
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        {language === 'zh' ? '确认密码' : 'Confirm Password'}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder={language === 'zh' ? '请再次输入密码' : 'Enter password again'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {language === 'zh' ? '处理中...' : 'Processing...'}
                      </>
                    ) : isSignUp ? (
                      language === 'zh' ? '创建账户' : 'Create Account'
                    ) : (
                      language === 'zh' ? '登录' : 'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Tab */}
              <TabsContent value="phone" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {language === 'zh' ? '手机号码' : 'Phone Number'}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={language === 'zh' ? '+86 138****8888' : '+1 555****1234'}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'zh' 
                        ? '请输入包含国家代码的完整手机号码' 
                        : 'Please enter phone number with country code'}
                    </p>
                  </div>

                  <Button 
                    onClick={handleSendPhoneOTP} 
                    className="w-full" 
                    disabled={phoneLoading || otpSent}
                  >
                    {phoneLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {language === 'zh' ? '发送中...' : 'Sending...'}
                      </>
                    ) : otpSent ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '验证码已发送' : 'Code Sent'}
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '发送验证码' : 'Send Verification Code'}
                      </>
                    )}
                  </Button>

                  {otpSent && (
                    <p className="text-sm text-center text-muted-foreground">
                      {language === 'zh' 
                        ? '验证码已发送到您的手机，请在弹出窗口中输入' 
                        : 'Verification code sent to your phone, please enter it in the popup'}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {language === 'zh' ? '或者' : 'OR'}
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-11 border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'zh' ? '正在跳转...' : 'Redirecting...'}
                </>
              ) : (
                <>
                  <Chrome className="h-5 w-5 mr-2 text-blue-500" />
                  <span className="font-medium">
                    {language === 'zh' ? '使用 Google 快速登录' : 'Continue with Google'}
                  </span>
                </>
              )}
            </Button>

            {/* Toggle Sign In/Up */}
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setEmail('');
                  setPassword('');
                  setName('');
                  setConfirmPassword('');
                }}
                className="text-sm"
              >
                {isSignUp 
                  ? (language === 'zh' ? '已有账户？立即登录' : 'Already have an account? Sign in')
                  : (language === 'zh' ? '没有账户？立即注册' : "Don't have an account? Sign up")
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Phone OTP Dialog */}
        <Dialog open={showPhoneOTPDialog} onOpenChange={setShowPhoneOTPDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {language === 'zh' ? '输入验证码' : 'Enter Verification Code'}
              </DialogTitle>
              <DialogDescription>
                {language === 'zh' 
                  ? `我们已向 ${phone} 发送了6位验证码` 
                  : `We sent a 6-digit code to ${phone}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPhoneOTPDialog(false);
                    setOtp('');
                    setError('');
                  }}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '返回' : 'Back'}
                </Button>
                <Button
                  onClick={handlePhoneOTPVerify}
                  disabled={phoneLoading || otp.length !== 6}
                  className="flex-1"
                >
                  {phoneLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'zh' ? '验证中...' : 'Verifying...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {language === 'zh' ? '验证' : 'Verify'}
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    handleSendPhoneOTP();
                  }}
                  disabled={phoneLoading}
                  className="text-sm"
                >
                  {language === 'zh' ? '重新发送验证码' : 'Resend code'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            {language === 'zh' 
              ? '登录即表示您同意我们的服务条款和隐私政策' 
              : 'By signing in, you agree to our Terms of Service and Privacy Policy'}
          </p>
        </div>
      </div>
    </div>
  );
}