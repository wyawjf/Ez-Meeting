import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { apiRoutes } from '../../utils/api/endpoints';

// Supabase client
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// User interface
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
  access_token: string;
  // Backward compatibility - direct accountType access
  accountType?: 'free' | 'pro' | 'enterprise';
  // Additional profile data from backend
  profile?: {
    name: string;
    accountType: 'free' | 'pro' | 'enterprise';
    role: 'user' | 'admin' | 'super_admin';
    membershipExpiry?: string;
    profilePicture?: string;
    createdAt: string;
    lastLoginAt?: string;
    preferences: {
      sourceLanguage: string;
      targetLanguage: string;
      autoLanguageDetection: boolean;
    };
  };
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithPhone: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  sendPhoneOTP: (phone: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  setupWyattAdmin: () => Promise<{ success: boolean; error?: string; data?: any }>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    checkAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_IN' && session) {
        await loadUserWithProfile(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check current auth state
  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Checking auth state, session:', session);
      
      if (session && session.user) {
        await loadUserWithProfile(session);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Load user with profile data from backend
  const loadUserWithProfile = async (session: any) => {
    try {
      console.log('Loading user profile for session:', session.user.id);
      
      // Create user object with session data
      const baseUser: User = {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata,
        access_token: session.access_token,
        // Add accountType property at the root level for backward compatibility
        accountType: 'free', // Default value, will be overridden by profile
      };

      // Try to load profile from backend
      try {
        const response = await fetch(apiRoutes.user('/profile'), {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const { profile } = await response.json();
          console.log('Successfully loaded profile from server:', profile);
          baseUser.profile = profile;
          // Update root-level accountType for backward compatibility
          baseUser.accountType = profile.accountType || 'free';
        } else {
          console.log('Profile API failed, creating default profile');
          throw new Error('Profile not found');
        }
      } catch (profileError) {
        console.log('Using default profile due to error:', profileError);
        // Create default profile if backend fails
        baseUser.profile = {
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          accountType: 'free',
          role: 'user',
          createdAt: new Date().toISOString(),
          preferences: {
            sourceLanguage: 'auto',
            targetLanguage: 'zh',
            autoLanguageDetection: true,
          },
        };
        // Update root-level accountType for backward compatibility
        baseUser.accountType = 'free';
      }

      console.log('Setting user state with profile:', baseUser);
      setUser(baseUser);
      
      // Force a small delay to ensure state is updated
      setTimeout(() => {
        console.log('User state should be updated now');
      }, 100);
      
    } catch (error) {
      console.error('Critical error loading user profile:', error);
      // Still set basic user info even if everything fails
      const fallbackUser = {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata,
        access_token: session.access_token,
        accountType: 'free' as 'free' | 'pro' | 'enterprise',
        profile: {
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          accountType: 'free' as 'free' | 'pro' | 'enterprise',
          role: 'user' as 'user' | 'admin' | 'super_admin',
          createdAt: new Date().toISOString(),
          preferences: {
            sourceLanguage: 'auto',
            targetLanguage: 'zh',
            autoLanguageDetection: true,
          },
        },
      };
      
      console.log('Setting fallback user:', fallbackUser);
      setUser(fallbackUser);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase sign in error:', error);
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        console.log('Sign in successful, session created:', data.session.user.id);
        console.log('Loading user profile...');
        
        await loadUserWithProfile(data.session);
        await updateLastLogin(data.session.access_token);
        
        console.log('Sign in process completed successfully');
        return { success: true };
      } else {
        console.error('Sign in succeeded but no session/user data received');
        return { success: false, error: 'Login failed: No session created' };
      }
    } catch (error) {
      console.error('Sign in failed with exception:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/main`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Google login failed. Please try again.' };
    }
  };

  // Send phone OTP
  const sendPhoneOTP = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to send verification code.' };
    }
  };

  // Sign in with phone and OTP
  const signInWithPhone = async (phone: string, code: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        await loadUserWithProfile(data.session);
        await updateLastLogin(data.session.access_token);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Phone verification failed. Please try again.' };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Starting registration for:', email);
      
      // Use server-side registration endpoint
        const response = await fetch(apiRoutes.absolute('/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        
        // Now sign in the user automatically
        console.log('Auto-signing in after registration...');
        const signInResult = await signIn(email, password);
        
        if (signInResult.success) {
          console.log('Auto sign-in after registration successful');
          return { success: true };
        } else {
          console.error('Auto sign-in failed:', signInResult.error);
          return { success: false, error: 'Registration successful but auto-login failed. Please try logging in manually.' };
        }
      } else {
        const error = await response.json();
        console.error('Registration failed:', error);
        return { success: false, error: error.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      return { success: false, error: 'Sign up failed. Please try again.' };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log('Signing out');
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Update user profile
  const updateProfile = async (updates: any) => {
    try {
      if (!user?.access_token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(apiRoutes.user('/update-profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const { profile } = await response.json();
        setUser(prev => prev ? { ...prev, profile } : null);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Failed to update profile' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to update profile' };
    }
  };

  // Update last login timestamp
  const updateLastLogin = async (accessToken: string) => {
    try {
      await fetch(apiRoutes.user('/save-time-usage'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          minutes: 0,
          date: new Date().toISOString().split('T')[0]
        }),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  // Refresh user data with force profile refresh
  const refreshUser = async () => {
    if (user?.access_token) {
      try {
        console.log('Force refreshing user profile...');
        
        // Call force refresh endpoint
        const response = await fetch(apiRoutes.user('/refresh-profile'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const { profile } = await response.json();
          console.log('Force refresh successful, updated profile:', profile);
          
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              profile,
              accountType: profile.accountType || 'free'
            };
          });
        } else {
          console.log('Force refresh failed, falling back to normal refresh');
          // Fallback to normal refresh
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await loadUserWithProfile(session);
          }
        }
      } catch (error) {
        console.error('Error during force refresh:', error);
        // Fallback to normal refresh
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await loadUserWithProfile(session);
        }
      }
    }
  };

  // Special setup for Wyatt Wang admin privileges
  const setupWyattAdmin = async () => {
    try {
      console.log('🎯 Setting up Wyatt Wang admin privileges...');
      
      const response = await fetch(apiRoutes.absolute('/setup-wyatt-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Wyatt admin setup successful:', data);
        
        // If user is logged in and is Wyatt, refresh their profile
        if (user?.access_token && user.email === 'awyawjf2000@gmail.com') {
          console.log('🔄 Refreshing Wyatt\'s profile after admin setup...');
          await refreshUser();
        }
        
        return { success: true, data };
      } else {
        const error = await response.json();
        console.error('❌ Wyatt admin setup failed:', error);
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('❌ Wyatt admin setup error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signInWithPhone,
    sendPhoneOTP,
    signUp,
    signOut,
    updateProfile,
    refreshUser,
    setupWyattAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;