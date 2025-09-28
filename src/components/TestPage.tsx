import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function TestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Ez Meeting 应用测试页面
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">🎯 应用状态</h3>
                <ul className="space-y-1 text-sm">
                  <li>✅ React 组件渲染正常</li>
                  <li>✅ Tailwind CSS 样式加载</li>
                  <li>✅ UI 组件库正常</li>
                  <li>✅ 路由系统工作</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">🔧 系统信息</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>浏览器: {navigator.userAgent.split(' ')[0]}</li>
                  <li>时间: {new Date().toLocaleString()}</li>
                  <li>主题: 自动检测</li>
                  <li>语言: 中文</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={() => window.location.href = '/main'}>
                前往主页面
              </Button>
              <Button onClick={() => window.location.href = '/login'} variant="outline">
                前往登录页面
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                刷新页面
              </Button>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">如果您看到这个页面:</h4>
              <p className="text-sm text-muted-foreground">
                说明应用基本功能正常，可以尝试导航到其他页面。如果其他页面出现黑屏，
                可能是特定组件的问题。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}