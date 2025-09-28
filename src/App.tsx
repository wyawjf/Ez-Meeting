import React, { useState, createContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainPage } from './components/MainPage';
import { PricingPage } from './components/PricingPage';
import { UserDashboard } from './components/UserDashboard';
import { NotesPage } from './components/NotesPage';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { ManagementPage } from './components/ManagementPage';
import { AdminSetupPage } from './components/AdminSetupPage';
import { SetSuperAdmin } from './components/SetSuperAdmin';
import { AdminRoute } from './components/AdminRoute';
import { Header } from './components/Header';
import { AuthProvider } from './components/contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { Toaster } from './components/ui/sonner';
import { translations } from './components/translations';

// Language Context
export const LanguageContext = createContext<{
  language: 'zh' | 'en';
  setLanguage: (lang: 'zh' | 'en') => void;
  t: (key: string, params?: Record<string, string>) => string;
}>({
  language: 'zh',
  setLanguage: () => {},
  t: (key: string) => key,
});

// Theme Context
export const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}>({
  theme: 'light',
  setTheme: () => {},
});

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isLoading, setIsLoading] = useState(true);

  const t = (key: string, params?: Record<string, string>) => {
    let translation = translations[language][key] || key;
    
    // Replace parameters in translation
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
    }
    
    return translation;
  };

  // Initialize app
  useEffect(() => {
    console.log('🚀 Ez Meeting App initializing...');
    
    // Load saved preferences
    try {
      const savedTheme = localStorage.getItem('ezmeeting-theme') as 'light' | 'dark';
      const savedLanguage = localStorage.getItem('ezmeeting-language') as 'zh' | 'en';
      
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
        console.log('🎨 Loaded saved theme:', savedTheme);
      }
      
      if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
        console.log('🌐 Loaded saved language:', savedLanguage);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
    
    // Quick loading for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Ez Meeting App loaded successfully');
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Apply theme
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Save theme preference
      localStorage.setItem('ezmeeting-theme', theme);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, [theme]);

  // Save language preference
  useEffect(() => {
    try {
      localStorage.setItem('ezmeeting-language', language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }, [language]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-background text-foreground">
                <Header />
                <main>
                  <Routes>
                    {/* Default route */}
                    <Route path="/" element={<Navigate to="/main" replace />} />
                    <Route path="/main" element={<MainPage />} />
                    <Route path="/notes" element={<NotesPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route 
                      path="/dashboard" 
                      element={<UserDashboard />}
                    />
                    {/* Admin Setup Page - accessible to everyone for initial setup */}
                    <Route path="/admin-setup" element={<AdminSetupPage />} />
                    {/* Temporary route to set super admin */}
                    <Route path="/set-super-admin" element={<SetSuperAdmin />} />
                    {/* Management routes - restricted to admin and super_admin only */}
                    <Route 
                      path="/management" 
                      element={
                        <AdminRoute requiredRole="admin">
                          <ManagementPage />
                        </AdminRoute>
                      } 
                    />
                    <Route 
                      path="/management/*" 
                      element={
                        <AdminRoute requiredRole="admin">
                          <ManagementPage />
                        </AdminRoute>
                      } 
                    />
                    {/* Admin routes - restricted to admin and super_admin only */}
                    <Route 
                      path="/admin" 
                      element={
                        <AdminRoute requiredRole="admin">
                          <AdminDashboard />
                        </AdminRoute>
                      } 
                    />
                    <Route 
                      path="/admin/*" 
                      element={
                        <AdminRoute requiredRole="admin">
                          <AdminDashboard />
                        </AdminRoute>
                      } 
                    />
                    <Route 
                      path="/login" 
                      element={
                        <ProtectedRoute requireAuth={false}>
                          <LoginPage />
                        </ProtectedRoute>
                      } 
                    />
                    {/* Handle preview routes */}
                    <Route path="/preview_page.html" element={<Navigate to="/main" replace />} />
                    <Route path="/preview" element={<Navigate to="/main" replace />} />
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/main" replace />} />
                  </Routes>
                </main>
                
                {/* Global toast notifications */}
                <Toaster 
                  position="top-right"
                  expand={true}
                  richColors
                  closeButton
                />
              </div>
            </Router>
          </AuthProvider>
        </LanguageContext.Provider>
      </ThemeContext.Provider>
    </ErrorBoundary>
  );
}