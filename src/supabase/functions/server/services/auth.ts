import * as kv from '../kv_store.tsx';
import { supabaseAdminClient } from './supabaseClient.ts';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface AuthenticatedUserContext {
  supabaseUser: any;
  profile: any | null;
  role: UserRole;
  isAdmin: boolean;
}

const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin'];

const buildDefaultProfile = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  role: 'user' as UserRole,
  accountType: 'free',
  createdAt: new Date().toISOString(),
  isActive: true,
  preferences: {
    sourceLanguage: 'auto',
    targetLanguage: 'zh',
    autoLanguageDetection: true,
  },
});

export const extractBearerToken = (request: Request): string => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization header');
  }
  return authHeader.substring(7);
};

export const getSupabaseUserFromToken = async (token: string) => {
  const { data, error } = await supabaseAdminClient.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error('Invalid token');
  }
  return data.user;
};

export const getUserProfile = async (userId: string) => {
  return await kv.get(`user_profile_${userId}`);
};

export const resolveUserRole = async (userId: string, fallbackRole: UserRole = 'user'): Promise<UserRole> => {
  const storedRole = await kv.get(`user_role_${userId}`);
  if (storedRole && (ADMIN_ROLES as string[]).includes(storedRole)) {
    return storedRole as UserRole;
  }
  if (storedRole === 'user') {
    return 'user';
  }
  return fallbackRole;
};

export const requireAuthenticatedUser = async (request: Request): Promise<AuthenticatedUserContext> => {
  const token = extractBearerToken(request);
  const supabaseUser = await getSupabaseUserFromToken(token);

  const profile = (await getUserProfile(supabaseUser.id)) || buildDefaultProfile(supabaseUser);
  const role = await resolveUserRole(supabaseUser.id, profile.role || 'user');
  const isAdmin = ADMIN_ROLES.includes(role);

  return {
    supabaseUser,
    profile,
    role,
    isAdmin,
  };
};

export const requireAdminUser = async (request: Request): Promise<AuthenticatedUserContext> => {
  const context = await requireAuthenticatedUser(request);
  if (!context.isAdmin) {
    throw new Error('Access denied. Admin privileges required.');
  }
  return context;
};
