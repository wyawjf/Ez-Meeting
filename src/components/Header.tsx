import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from './ui/dropdown-menu';
import { 
  Sun, 
  Moon, 
  Globe, 
  User, 
  LogOut, 
  Crown, 
  Settings,
  Shield,
  ChevronDown,
  Activity,
  BarChart3
} from 'lucide-react';
import { LanguageContext, ThemeContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { apiRoutes } from '../utils/api/endpoints';

export function Header() {
  const { language, setLanguage, t } = useContext(LanguageContext);
  const { theme, setTheme } = useContext(ThemeContext);
  const { user, signOut, refreshUser } = useAuth();
  const location = useLocation();
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false);

  // Set up admin privileges if needed (for first-time setup)
  const setupAdminPrivileges = async () => {
    if (!user?.access_token || isSettingUpAdmin) return;
    
    setIsSettingUpAdmin(true);
    try {
      const response = await fetch(apiRoutes.admin('/setup-admin'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Admin setup successful:', data);
        // Refresh user data to get updated role
        setTimeout(() => {
          refreshUser();
        }, 1000);
      } else {
        const error = await response.json();
        console.log('Admin setup response:', error.error);
      }
    } catch (error) {
      console.error('Error setting up admin:', error);
    } finally {
      setIsSettingUpAdmin(false);
    }
  };

  // Auto-setup admin on first login (for testing)
  useEffect(() => {
    if (user && !user.profile?.role) {
      setupAdminPrivileges();
    }
  }, [user]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const userRole = user?.profile?.role || 'user';
  const accountType = user?.profile?.accountType || 'free';
  
  // Check if user is admin or super_admin
  const isAdminEmail = user?.email === 'awyawjf2000@gmail.com';
  const isAdmin = (userRole === 'admin' || userRole === 'super_admin') || isAdminEmail;
  
  // Debug logging for admin check
  useEffect(() => {
    if (user) {
      console.log('🔍 Header - Admin Check Debug:', {
        email: user.email,
        profileRole: userRole,
        accountType,
        isAdminEmail,
        isAdmin,
        navItemsCount: navItems.length,
        fullProfile: user.profile
      });
    }
  }, [user, userRole, accountType, isAdmin, isAdminEmail]);

  const navItems = [
    { path: '/main', label: t('nav.main') },
    { path: '/notes', label: t('nav.notes') },
    { path: '/pricing', label: t('nav.pricing') },
    { path: '/dashboard', label: t('nav.dashboard') },
    ...(isAdmin ? [{ path: '/management', label: t('nav.management') }] : [])
  ];

  // Debug logging for navItems
  useEffect(() => {
    console.log('📋 Navigation Items Debug:', {
      totalItems: navItems.length,
      items: navItems,
      isAdmin,
      hasManagement: navItems.some(item => item.path === '/management')
    });
  }, [navItems, isAdmin]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getAccountBadge = () => {
    if (accountType === 'pro') {
      return (
        <Badge className="text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white ml-2">
          <Crown className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      );
    } else if (accountType === 'enterprise') {
      return (
        <Badge className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white ml-2">
          <Crown className="h-3 w-3 mr-1" />
          Enterprise
        </Badge>
      );
    }
    return null;
  };

  const getRoleBadge = () => {
    if (userRole === 'super_admin') {
      return (
        <Badge className="text-xs bg-gradient-to-r from-purple-500 to-purple-600 text-white ml-2">
          <Shield className="h-3 w-3 mr-1" />
          {language === 'zh' ? '超管' : 'Super'}
        </Badge>
      );
    } else if (userRole === 'admin') {
      return (
        <Badge className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-2">
          <Shield className="h-3 w-3 mr-1" />
          {language === 'zh' ? '管理员' : 'Admin'}
        </Badge>
      );
    }
    return null;
  };

  const getUserDisplayName = () => {
    if (user?.profile?.name) return user.profile.name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/main" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('app.title')}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive(item.path) ? "secondary" : "ghost"}
                size="sm"
                className={`relative ${
                  isActive(item.path) 
                    ? 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-700 dark:text-indigo-300' 
                    : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-950 dark:hover:to-purple-950'
                }`}
              >
                {item.label}
                {item.path === '/management' && isAdmin && (
                  <Badge className="ml-2 h-4 w-4 rounded-full bg-blue-500 text-[10px] text-white p-0 flex items-center justify-center">
                    M
                  </Badge>
                )}
              </Button>
            </Link>
          ))}
          

        </nav>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="h-8 w-8 p-0"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="h-8 w-8 p-0"
          >
            <Globe className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 px-3">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {getUserDisplayName()}
                  </span>
                  {getAccountBadge()}
                  {getRoleBadge()}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{getUserDisplayName()}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    {isSettingUpAdmin && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {language === 'zh' ? '设置管理员权限中...' : 'Setting up admin...'}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('nav.dashboard')}</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/management" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{t('nav.management')}</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('auth.signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="h-8 gap-2 px-3">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.login')}</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}