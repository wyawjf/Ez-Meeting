import React, { useState, useContext } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Crown, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { LanguageContext } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export function SetSuperAdmin() {
  const { language } = useContext(LanguageContext);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSuperAdmin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-851310fa/admin/set-super-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'awyawjf2000@gmail.com'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        toast.success('Wyatt Wang has been set as super admin successfully!');
      } else {
        throw new Error(data.error || 'Failed to set super admin');
      }
    } catch (error) {
      console.error('Error setting super admin:', error);
      setError(error instanceof Error ? error.message : 'Failed to set super admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Crown className="h-5 w-5 text-amber-500" />
          <span>{language === 'zh' ? '设置超级管理员' : 'Set Super Admin'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'zh' 
              ? '点击下方按钮将 Wyatt Wang (awyawjf2000@gmail.com) 设置为超级管理员'
              : 'Click the button below to set Wyatt Wang (awyawjf2000@gmail.com) as super admin'
            }
          </p>
          
          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {language === 'zh' 
                  ? 'Wyatt Wang 已成功设置为超级管理员！'
                  : 'Wyatt Wang has been successfully set as super admin!'
                }
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={setSuperAdmin}
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'zh' ? '设置中...' : 'Setting...'}
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {language === 'zh' ? '已完成' : 'Completed'}
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" />
                {language === 'zh' ? '设置超级管理员' : 'Set Super Admin'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}