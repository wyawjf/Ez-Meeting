// Time tracking utilities for Ez Meeting with user authentication
// Manages daily time limits, usage tracking, and account types

import { projectId } from '../../utils/supabase/info';
import { apiRoutes } from '../../utils/api/endpoints';

export interface TimeUsage {
  date: string;
  usedMinutes: number;
  sessions: TimeSession[];
  userId?: string;
}

export interface TimeSession {
  id: string;
  title: string;
  type: string;
  minutes: number;
  timestamp: string;
}

export type AccountType = 'free' | 'pro' | 'enterprise';

export const ACCOUNT_LIMITS = {
  free: 150,    // 150 minutes per day for free accounts
  pro: 9999,    // Unlimited daily for pro accounts  
  enterprise: 9999, // Unlimited for enterprise
} as const;

export const MONTHLY_LIMITS = {
  free: 1000,   // 1000 minutes per month for free accounts (CHANGED from 1500)
  pro: null,    // No monthly limit for pro accounts
  enterprise: null, // No monthly limit for enterprise
} as const;

// Get current date string (YYYY-MM-DD)
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Get auth token from session storage or localStorage
function getAuthToken(): string | null {
  // Try to get from localStorage (Supabase default storage)
  const supabaseSession = localStorage.getItem('sb-' + projectId.replace(/[^a-zA-Z0-9]/g, '') + '-auth-token');
  if (supabaseSession) {
    try {
      const session = JSON.parse(supabaseSession);
      return session.access_token;
    } catch (e) {
      console.error('Error parsing auth token:', e);
    }
  }
  return null;
}

// Make authenticated API call
async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(apiRoutes.absolute(endpoint), {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${error}`);
  }

  return response.json();
}

// Initialize time tracking (run on app start)
export function initializeTimeTracking(): void {
  // Time tracking is now handled by the backend with user authentication
  // This function is kept for compatibility but the real initialization happens on the server
  console.log('Time tracking initialized for authenticated user');
}

// Get current account type (from user profile)
export function getCurrentAccountType(): AccountType {
  // This will be fetched from the user profile in the auth context
  // For now, return free as default
  return 'free';
}

// Set account type (through user profile update)
export function setAccountType(accountType: AccountType): void {
  // This should be done through the user profile update API
  console.log('Account type should be updated through user profile API:', accountType);
}

// Get today's usage data from server
export async function getTodayUsage(): Promise<TimeUsage & { 
  dailyLimit?: number; 
  monthlyLimit?: number; 
  monthlyUsedMinutes?: number;
  remainingMinutes?: number;
  remainingMonthlyMinutes?: number;
  effectiveRemainingMinutes?: number;
  hasTimeRemaining?: boolean;
}> {
  try {
    const data = await makeAuthenticatedRequest('/user/time-usage');
    console.log('Got time usage from server:', data);
    return {
      date: data.date,
      usedMinutes: data.usedMinutes,
      sessions: data.sessions || [],
      userId: data.userId,
      dailyLimit: data.dailyLimit,
      monthlyLimit: data.monthlyLimit,
      monthlyUsedMinutes: data.monthlyUsedMinutes,
      remainingMinutes: data.remainingMinutes,
      remainingMonthlyMinutes: data.remainingMonthlyMinutes,
      effectiveRemainingMinutes: data.effectiveRemainingMinutes,
      hasTimeRemaining: data.hasTimeRemaining,
    };
  } catch (error) {
    console.error('Error getting today usage:', error);
    // Fallback to local storage for offline mode
    const today = getCurrentDateString();
    const usageKey = `ezmeeting-time-usage-${today}`;
    const stored = localStorage.getItem(usageKey);
    
    if (stored) {
      const storedData = JSON.parse(stored);
      // Add missing fields for fallback
      return {
        ...storedData,
        dailyLimit: ACCOUNT_LIMITS.free,
        monthlyLimit: MONTHLY_LIMITS.free,
        monthlyUsedMinutes: 0,
        remainingMinutes: Math.max(0, ACCOUNT_LIMITS.free - (storedData.usedMinutes || 0)),
        remainingMonthlyMinutes: MONTHLY_LIMITS.free,
        effectiveRemainingMinutes: Math.max(0, ACCOUNT_LIMITS.free - (storedData.usedMinutes || 0)),
        hasTimeRemaining: true,
      };
    }
    
    return {
      date: today,
      usedMinutes: 0,
      sessions: [],
      dailyLimit: ACCOUNT_LIMITS.free,
      monthlyLimit: MONTHLY_LIMITS.free,
      monthlyUsedMinutes: 0,
      remainingMinutes: ACCOUNT_LIMITS.free,
      remainingMonthlyMinutes: MONTHLY_LIMITS.free,
      effectiveRemainingMinutes: ACCOUNT_LIMITS.free,
      hasTimeRemaining: true,
    };
  }
}

// Get remaining minutes for today
export function getRemainingMinutesToday(): number {
  // This should be calculated on the server, but we'll provide a local fallback
  const accountType = getCurrentAccountType();
  const dailyLimit = ACCOUNT_LIMITS[accountType];
  
  // Try to get from last known usage (this will be updated by the auth context)
  const lastKnownUsage = localStorage.getItem('last-known-usage');
  if (lastKnownUsage) {
    try {
      const usage = JSON.parse(lastKnownUsage);
      return Math.max(0, dailyLimit - usage.usedMinutes);
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  return dailyLimit; // Default to full limit
}

// Check if user has remaining time
export function hasTimeRemaining(): boolean {
  return getRemainingMinutesToday() > 0;
}

// Add time usage for a session (server-side)
export async function addTimeUsage(minutes: number, sessionType: string = 'meeting', sessionTitle?: string): Promise<void> {
  if (minutes <= 0) return;
  
  try {
    await makeAuthenticatedRequest('/user/add-time-usage', {
      method: 'POST',
      body: JSON.stringify({
        minutes,
        sessionType,
        sessionTitle: sessionTitle || `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`,
      }),
    });
    
    console.log(`Added ${minutes} minutes of usage for ${sessionType}`);
  } catch (error) {
    console.error('Error adding time usage:', error);
    
    // Fallback to local storage
    const today = getCurrentDateString();
    const usageKey = `ezmeeting-time-usage-${today}`;
    const stored = localStorage.getItem(usageKey);
    
    let todayUsage: TimeUsage;
    if (stored) {
      todayUsage = JSON.parse(stored);
    } else {
      todayUsage = {
        date: today,
        usedMinutes: 0,
        sessions: [],
      };
    }
    
    const sessionId = `session_${Date.now()}`;
    const newSession: TimeSession = {
      id: sessionId,
      title: sessionTitle || `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`,
      type: sessionType,
      minutes,
      timestamp: new Date().toISOString(),
    };
    
    const updatedUsage: TimeUsage = {
      ...todayUsage,
      usedMinutes: todayUsage.usedMinutes + minutes,
      sessions: [...todayUsage.sessions, newSession],
    };
    
    localStorage.setItem(usageKey, JSON.stringify(updatedUsage));
    localStorage.setItem('last-known-usage', JSON.stringify(updatedUsage));
  }
}

// Get usage history from server
export async function getUsageHistory(days: number = 7): Promise<TimeUsage[]> {
  try {
    // This would be implemented as a server endpoint
    // For now, return today's usage
    const todayUsage = await getTodayUsage();
    return [todayUsage];
  } catch (error) {
    console.error('Error getting usage history:', error);
    
    // Fallback to local storage
    const history: TimeUsage[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const usageKey = `ezmeeting-time-usage-${dateString}`;
      const stored = localStorage.getItem(usageKey);
      
      if (stored) {
        history.push(JSON.parse(stored));
      } else {
        history.push({
          date: dateString,
          usedMinutes: 0,
          sessions: [],
        });
      }
    }
    
    return history.reverse(); // Oldest first
  }
}

// Format minutes to human readable string (Chinese)
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }
  
  return `${hours}小时${remainingMinutes}分钟`;
}

// Format minutes to human readable string (English)
export function formatMinutesEn(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

// Get account type display info
export function getAccountTypeInfo(accountType: AccountType, language: 'zh' | 'en') {
  const info = {
    free: {
      zh: { name: '免费版', limit: '每日150分钟，每月1000分钟' }, // UPDATED
      en: { name: 'Free', limit: '150 min/day, 1000 min/month' } // UPDATED
    },
    pro: {
      zh: { name: 'Pro版', limit: '无限制' },
      en: { name: 'Pro', limit: 'Unlimited' }
    },
    enterprise: {
      zh: { name: '企业版', limit: '无限制' },
      en: { name: 'Enterprise', limit: 'Unlimited' }
    }
  };
  
  return info[accountType][language];
}

// Clean up old usage data (keep last 30 days)
export function cleanupOldUsageData(): void {
  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  
  // Find all time usage keys and remove old ones
  const keys = Object.keys(localStorage);
  const usageKeys = keys.filter(key => key.startsWith('ezmeeting-time-usage-'));
  
  usageKeys.forEach(key => {
    const dateString = key.replace('ezmeeting-time-usage-', '');
    const date = new Date(dateString);
    
    if (date < cutoffDate) {
      localStorage.removeItem(key);
    }
  });
}

// Compatibility exports for existing code
export const getTodayDateString = getCurrentDateString;
export const getDailyUsage = getTodayUsage;
export const getMonthlyStats = () => ({
  totalMinutes: 0,
  totalSessions: 0,
  daysUsed: 0,
  averageDailyMinutes: 0
});
export const getTimeUntilReset = () => '明天 00:00';