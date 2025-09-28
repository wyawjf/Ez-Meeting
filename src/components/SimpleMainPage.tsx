import React, { useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Mic, Play, Settings, Timer, User } from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';

export function SimpleMainPage() {
  const { t, language } = useContext(LanguageContext);
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('app.title')}</h1>
        <p className="text-muted-foreground">
          {language === 'zh' ? '智能实时字幕翻译系统' : 'Smart Real-time Subtitle Translation System'}
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Timer className="h-5 w-5 mr-2" />
              {language === 'zh' ? '使用状态' : 'Usage Status'}
            </span>
            {user ? (
              <Badge variant="default">
                {user.accountType === 'free' ? 
                  (language === 'zh' ? '免费用户' : 'Free User') : 
                  (language === 'zh' ? 'Pro用户' : 'Pro User')
                }
              </Badge>
            ) : (
              <Badge variant="secondary">
                {language === 'zh' ? '游客模式' : 'Guest Mode'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === 'zh' ? `欢迎回来，${user.name}！` : `Welcome back, ${user.name}!`}
              </p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-muted p-3 rounded">
                  <div className="text-lg font-semibold">45</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'zh' ? '每日分钟数' : 'Daily Minutes'}
                  </div>
                </div>
                <div className="bg-muted p-3 rounded">
                  <div className="text-lg font-semibold">0</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'zh' ? '今日已用' : 'Used Today'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {language === 'zh' ? '您正在以游客模式浏览，功能受限' : 'You are browsing in guest mode with limited functionality'}
              </p>
              <Button onClick={() => window.location.href = '/login'}>
                <User className="h-4 w-4 mr-2" />
                {language === 'zh' ? '登录使用完整功能' : 'Login for Full Features'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            {language === 'zh' ? '录音控制' : 'Recording Controls'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <Button size="lg" disabled={!user} className="w-full max-w-sm">
              <Play className="h-5 w-5 mr-2" />
              {user ? 
                (language === 'zh' ? '开始录音' : 'Start Recording') :
                (language === 'zh' ? '登录后使用' : 'Login to Use')
              }
            </Button>
            
            {!user && (
              <p className="text-sm text-muted-foreground">
                {language === 'zh' ? '登录后可使用录音、翻译、导出等功能' : 'Login to use recording, translation, export and other features'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Mic className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-semibold mb-1">
              {language === 'zh' ? '实时录音' : 'Real-time Recording'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {language === 'zh' ? '高质量音频录制' : 'High-quality audio recording'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Settings className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold mb-1">
              {language === 'zh' ? '智能翻译' : 'Smart Translation'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {language === 'zh' ? '多语言实时翻译' : 'Multi-language real-time translation'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <h3 className="font-semibold mb-1">
              {language === 'zh' ? '云端存储' : 'Cloud Storage'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {language === 'zh' ? '安全的笔记存储' : 'Secure note storage'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'zh' ? '快速操作' : 'Quick Actions'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/notes'}>
              {language === 'zh' ? '查看笔记' : 'View Notes'}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
              {language === 'zh' ? '套餐价格' : 'Pricing Plans'}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              {language === 'zh' ? '用户中心' : 'Dashboard'}
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {language === 'zh' ? '刷新页面' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}