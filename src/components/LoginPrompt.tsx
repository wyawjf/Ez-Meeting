import React, { useContext } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { User, Crown, Zap, ArrowRight, Info } from 'lucide-react';
import { LanguageContext } from '../App';

interface LoginPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  description?: string;
}

export function LoginPrompt({ open, onOpenChange, feature, description }: LoginPromptProps) {
  const { t, language } = useContext(LanguageContext);

  const handleLogin = () => {
    onOpenChange(false);
    window.location.href = '/login';
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{t('auth.loginRequired')}</span>
          </DialogTitle>
          <DialogDescription>
            {description || t('auth.loginRequiredDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Feature info */}
          {feature && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {language === 'zh' 
                  ? `"${feature}" 功能需要登录后使用` 
                  : `"${feature}" feature requires login`}
              </AlertDescription>
            </Alert>
          )}

          {/* Benefits of logging in */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {language === 'zh' ? '登录后可享受：' : 'Benefits of logging in:'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>{language === 'zh' ? '每日45分钟免费使用时长' : '45 minutes daily free usage'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Crown className="h-4 w-4 text-purple-500" />
                <span>{language === 'zh' ? '升级Pro获得300分钟' : 'Upgrade to Pro for 300 minutes'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-green-500" />
                <span>{language === 'zh' ? '个人笔记记录和管理' : 'Personal notes and recordings'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {language === 'zh' ? '稍后再说' : 'Maybe Later'}
            </Button>
            <Button onClick={handleLogin} className="flex-1">
              <User className="h-4 w-4 mr-2" />
              {t('auth.loginToUse')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Guest mode notice */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {language === 'zh' 
                ? '当前为游客模式，功能受限' 
                : 'Currently in guest mode with limited features'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}