import { projectId } from '../supabase/info.tsx';

const normalizePath = (path?: string) => {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
};

const withPrefix = (prefix: string) => (path?: string) => {
  const normalized = normalizePath(path);
  return `${API_BASE_URL}${prefix}${normalized}`;
};

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-851310fa`;

export const apiRoutes = {
  base: API_BASE_URL,
  absolute: (path?: string) => `${API_BASE_URL}${normalizePath(path)}`,
  admin: withPrefix('/admin'),
  user: withPrefix('/user'),
  payment: withPrefix('/payment'),
  ai: withPrefix('/ai'),
};

export type ApiRouteBuilder = typeof apiRoutes;
