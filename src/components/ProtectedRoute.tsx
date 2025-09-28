import React, { useContext, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Loader2 } from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { language } = useContext(LanguageContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle authentication state changes
  useEffect(() => {
    // Don't do anything while loading
    if (loading) return;
    
    // If auth is required but user is not authenticated, redirect to login
    if (requireAuth && !user) {
      console.log('ProtectedRoute: Auth required but no user, redirecting to login');
      navigate('/login', { state: { from: location }, replace: true });
      return;
    }
    
    // If user is authenticated but trying to access login/register, redirect to main
    if (!requireAuth && user && (location.pathname === '/login' || location.pathname === '/register')) {
      console.log('ProtectedRoute: User authenticated, redirecting from login to main');
      navigate('/main', { replace: true });
      return;
    }
  }, [user, loading, requireAuth, location, navigate]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {language === 'zh' ? '正在验证登录状态...' : 'Verifying authentication...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to login if auth is required but user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to main if user is authenticated but trying to access login
  if (!requireAuth && user) {
    return <Navigate to="/main" replace />;
  }

  return <>{children}</>;
}