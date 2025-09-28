import * as kv from '../kv_store.tsx';

export interface AdminLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetId?: string;
  details?: any;
  createdAt: string;
}

export const logAdminAction = async (adminId: string, action: string, targetId?: string, details?: any) => {
  const logEntry: AdminLogEntry = {
    id: crypto.randomUUID(),
    adminId,
    action,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  };

  await kv.set(`admin_log_${logEntry.id}`, logEntry);

  const existingLogs = await kv.getByPrefix('admin_log_');
  if (existingLogs.length > 1000) {
    const sortedLogs = existingLogs.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    for (let i = 1000; i < sortedLogs.length; i++) {
      await kv.del(`admin_log_${sortedLogs[i].id}`);
    }
  }
};
