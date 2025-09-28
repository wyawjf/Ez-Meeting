import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import * as kv from './kv_store.tsx';
import { supabaseAdminClient } from './services/supabaseClient.ts';
import { requireAdminUser, requireAuthenticatedUser, getUserProfile } from './services/auth.ts';
import { logAdminAction } from './services/audit.ts';

const app = new Hono();

// Enhanced CORS middleware for figma.site support
app.use('*', cors({
  origin: [
    'http://localhost:3000', 
    'https://localhost:3000',
    'https://ezmeeting.figma.site',
    'https://*.figma.site',
    /https:\/\/.*\.figma\.site$/
  ],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  exposeHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
  credentials: true,
}));

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalMinutesUsed: number;
  totalMinutesToday: number;
  totalRevenue: number;
  proUsers: number;
  enterpriseUsers: number;
}


// POST /auth/register - User registration endpoint
app.post('/auth/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    console.log('Creating new user account:', email);

    // Create user with Supabase Auth
    const { data, error } = await supabaseAdminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('User creation failed:', error);
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      return c.json({ error: 'User creation failed - no user data returned' }, 500);
    }

    console.log('User created successfully:', data.user.id);

    // Create user profile in our database
    const userProfile = {
      id: data.user.id,
      email: data.user.email,
      name,
      role: 'user',
      accountType: 'free',
      createdAt: new Date().toISOString(),
      isActive: true,
      preferences: {
        sourceLanguage: 'auto',
        targetLanguage: 'zh',
        autoLanguageDetection: true,
      }
    };

    // Save user profile
    await kv.set(`user_profile_${data.user.id}`, userProfile);
    
    // Set user role
    await kv.set(`user_role_${data.user.id}`, 'user');

    // Initialize time tracking
    const today = new Date().toISOString().split('T')[0];
    const usageData = {
      userId: data.user.id,
      date: today,
      usedMinutes: 0,
      dailyLimit: 150 // Free account limit
    };
    await kv.set(`time_usage_${data.user.id}_${today}`, usageData);

    console.log('User profile created successfully');

    return c.json({ 
      success: true, 
      message: 'User registered successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        name
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed. Please try again.' }, 500);
  }
});

// POST /admin/setup-admin - Set up initial admin
app.post('/admin/setup-admin', async (c) => {
  try {
    const { supabaseUser, role: currentRole } = await requireAuthenticatedUser(c.req.raw);

    // Allow setup only for specific email or if no admins exist
    console.log('🔒 Checking admin setup eligibility...');

    // Check if this is the first admin setup (no existing admins)
    const existingAdmins = await kv.getByPrefix('user_role_');
    const hasAdmins = existingAdmins.some(role => role === 'admin' || role === 'super_admin');

    // Allow setup if no admins exist OR if current user is already an admin OR if this is Wyatt's email
    const isCurrentUserAdmin = currentRole === 'admin' || currentRole === 'super_admin';
    const isWyattEmail = supabaseUser.email === 'awyawjf2000@gmail.com';

    if (hasAdmins && !isCurrentUserAdmin && !isWyattEmail) {
      return c.json({ error: 'Admin setup not allowed. Admins already exist and you are not authorized.' }, 403);
    }

    console.log('Setting up admin for user:', {
      userId: supabaseUser.id,
      email: supabaseUser.email,
      currentRole: currentRole,
      isCurrentUserAdmin
    });

    // Set user as super admin
    await kv.set(`user_role_${supabaseUser.id}`, 'super_admin');

    // Update user profile
    const userProfile = await kv.get(`user_profile_${supabaseUser.id}`) || {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Admin',
      accountType: 'pro', // Give admin pro account
      createdAt: new Date().toISOString(),
      isActive: true
    };

    userProfile.role = 'super_admin';
    userProfile.accountType = 'pro'; // Upgrade to pro
    await kv.set(`user_profile_${supabaseUser.id}`, userProfile);

    // Log the action
    await logAdminAction(supabaseUser.id, 'SETUP_ADMIN', supabaseUser.id, {
      email: supabaseUser.email,
      setupTime: new Date().toISOString()
    });

    return c.json({
      success: true,
      message: 'Super admin privileges granted successfully',
      user: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        role: 'super_admin',
        accountType: 'pro'
      }
    });

  } catch (error) {
    if (error instanceof Error && (error.message.includes('authorization') || error.message.includes('Invalid token'))) {
      return c.json({ error: error.message }, 401);
    }
    console.error('Admin setup error:', error);
    return c.json({ error: 'Failed to setup admin privileges' }, 500);
  }
});

// GET /admin/stats - Get system statistics
app.get('/admin/stats', async (c) => {
  try {
    const { supabaseUser } = await requireAdminUser(c.req.raw);

    // Get all users
    const users = await kv.getByPrefix('user_profile_');
    const usageRecords = await kv.getByPrefix('time_usage_');
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Calculate statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      const lastLogin = user.lastLoginAt;
      if (!lastLogin) return false;
      const daysDiff = (now.getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    }).length;
    
    const newUsersToday = users.filter(user => 
      user.createdAt && user.createdAt.startsWith(today)
    ).length;
    
    const proUsers = users.filter(user => user.accountType === 'pro').length;
    const enterpriseUsers = users.filter(user => user.accountType === 'enterprise').length;
    
    // Calculate usage statistics
    const totalMinutesUsed = usageRecords.reduce((sum, record) => 
      sum + (record.usedMinutes || 0), 0
    );
    
    const todaysUsage = usageRecords.filter(record => 
      record.date === today
    ).reduce((sum, record) => sum + (record.usedMinutes || 0), 0);
    
    // Mock revenue calculation (in real app, this would come from payment records)
    const totalRevenue = proUsers * 29 + enterpriseUsers * 99;

    const stats: SystemStats = {
      totalUsers,
      activeUsers,
      newUsersToday,
      totalMinutesUsed,
      totalMinutesToday: todaysUsage,
      totalRevenue,
      proUsers,
      enterpriseUsers
    };

    await logAdminAction(supabaseUser.id, 'VIEW_STATS');

    return c.json({ stats });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Admin stats error:', error);
    return c.json({ error: 'Failed to get admin statistics' }, 500);
  }
});

// GET /admin/users - Get all users with pagination
app.get('/admin/users', async (c) => {
  try {
    const { supabaseUser } = await requireAdminUser(c.req.raw);

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';
    const roleFilter = c.req.query('role') || '';
    const accountTypeFilter = c.req.query('accountType') || '';

    // Get all users
    let users = await kv.getByPrefix('user_profile_');
    
    // Apply filters
    if (search) {
      users = users.filter(user => 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (roleFilter) {
      users = users.filter(user => {
        const userRole = user.role || 'user';
        return userRole === roleFilter;
      });
    }
    
    if (accountTypeFilter) {
      users = users.filter(user => user.accountType === accountTypeFilter);
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    // Pagination
    const total = users.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    // Add usage statistics to each user
    const usersWithStats = await Promise.all(
      paginatedUsers.map(async (user) => {
        const usageToday = await kv.get(`time_usage_${user.id}_${new Date().toISOString().split('T')[0]}`);
        const totalUsage = await kv.getByPrefix(`time_usage_${user.id}_`);
        
        return {
          ...user,
          usageToday: usageToday?.usedMinutes || 0,
          totalUsage: totalUsage.reduce((sum, record) => sum + (record.usedMinutes || 0), 0),
          role: user.role || 'user'
        };
      })
    );

    await logAdminAction(supabaseUser.id, 'VIEW_USERS', undefined, { page, limit, search });

    return c.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Admin users error:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// PUT /admin/users/:userId/role - Update user role
app.put('/admin/users/:userId/role', async (c) => {
  try {
    const { supabaseUser, role: currentUserRole } = await requireAdminUser(c.req.raw);

    const userId = c.req.param('userId');
    const { role } = await c.req.json();

    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Get target user profile
    const userProfile = await kv.get(`user_profile_${userId}`);
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    const targetUserRole = userProfile.role || 'user';

    // Permission check: Only admin and super_admin can modify super_admin roles
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin' && role === 'super_admin') {
      return c.json({ error: 'Only Admin or Super Admin can promote to Super Admin' }, 403);
    }

    // Update user role
    await kv.set(`user_role_${userId}`, role);

    // Update user profile
    const updatedProfile = { ...userProfile, role };
    await kv.set(`user_profile_${userId}`, updatedProfile);

    await logAdminAction(supabaseUser.id, 'UPDATE_USER_ROLE', userId, { oldRole: targetUserRole, newRole: role });

    return c.json({ success: true, message: 'User role updated successfully' });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Admin update role error:', error);
    return c.json({ error: 'Failed to update user role' }, 500);
  }
});

// PUT /admin/users/:userId/account-type - Update user account type
app.put('/admin/users/:userId/account-type', async (c) => {
  try {
    const { supabaseUser } = await requireAdminUser(c.req.raw);

    const userId = c.req.param('userId');
    const { accountType } = await c.req.json();

    if (!['free', 'pro', 'enterprise'].includes(accountType)) {
      return c.json({ error: 'Invalid account type' }, 400);
    }

    // Get current user profile
    const userProfile = await kv.get(`user_profile_${userId}`);
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update user profile
    const updatedProfile = { ...userProfile, accountType };
    await kv.set(`user_profile_${userId}`, updatedProfile);

    await logAdminAction(supabaseUser.id, 'UPDATE_ACCOUNT_TYPE', userId, {
      oldAccountType: userProfile.accountType,
      newAccountType: accountType
    });

    return c.json({ success: true, message: 'Account type updated successfully' });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Admin update account type error:', error);
    return c.json({ error: 'Failed to update account type' }, 500);
  }
});

// DELETE /admin/users/:userId - Delete user
app.delete('/admin/users/:userId', async (c) => {
  try {
    const { supabaseUser, role: currentUserRole } = await requireAdminUser(c.req.raw);

    const userId = c.req.param('userId');

    // Get target user profile
    const userProfile = await kv.get(`user_profile_${userId}`);
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    const targetUserRole = userProfile.role || 'user';

    // Permission check: prevent self-deletion
    if (userId === supabaseUser.id) {
      return c.json({ error: 'Cannot delete your own account' }, 403);
    }

    // Permission check: Admin cannot delete Super Admin
    if (currentUserRole === 'admin' && targetUserRole === 'super_admin') {
      return c.json({ error: 'Admin cannot delete Super Admin accounts' }, 403);
    }

    // Delete user profile and related data
    await kv.del(`user_profile_${userId}`);
    await kv.del(`user_role_${userId}`);

    // Delete usage records
    const usageRecords = await kv.getByPrefix(`time_usage_${userId}_`);
    for (const record of usageRecords) {
      await kv.del(`time_usage_${userId}_${record.date}`);
    }

    // Delete AI analysis records
    const analysisRecords = await kv.getByPrefix(`ai_analysis_`);
    for (const record of analysisRecords) {
      if (record.userId === userId) {
        await kv.del(`ai_analysis_${record.noteId}`);
      }
    }

    await logAdminAction(supabaseUser.id, 'DELETE_USER', userId, {
      deletedUserEmail: userProfile.email,
      deletedUserRole: targetUserRole,
      deletedUserAccountType: userProfile.accountType
    });

    return c.json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Admin delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// POST /admin/create-manual-user - Create user manually by admin
app.post('/admin/create-manual-user', async (c) => {
  try {
    const { supabaseUser, role: currentUserRole } = await requireAdminUser(c.req.raw);

    const { email, name, password, role, accountType, isActive } = await c.req.json();

    if (!email || !name || !password) {
      return c.json({ error: 'Email, name, and password are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    if (!['free', 'pro', 'enterprise'].includes(accountType)) {
      return c.json({ error: 'Invalid account type' }, 400);
    }

    // Permission check: Only admin and super admin can create super admin users
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin' && role === 'super_admin') {
      return c.json({ error: 'Only Admin or Super Admin can create Super Admin accounts' }, 403);
    }

    // Check if user already exists
    const existingUsers = await kv.getByPrefix('user_profile_');
    const existingUser = existingUsers.find(u => u.email === email);
    
    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    // Create user with Supabase Auth
    console.log('Creating manual user account:', email);

    const { data, error } = await supabaseAdminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Manual user creation failed:', error);
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      return c.json({ error: 'User creation failed - no user data returned' }, 500);
    }

    console.log('Manual user created successfully:', data.user.id);

    // Create user profile in our database
    const userProfile = {
      id: data.user.id,
      email: data.user.email,
      name,
      role,
      accountType,
      createdAt: new Date().toISOString(),
      isActive: isActive !== undefined ? isActive : true,
      preferences: {
        sourceLanguage: 'auto',
        targetLanguage: 'zh',
        autoLanguageDetection: true,
      }
    };

    // Save user profile
    await kv.set(`user_profile_${data.user.id}`, userProfile);
    
    // Set user role
    await kv.set(`user_role_${data.user.id}`, role);

    // Initialize time tracking
    const today = new Date().toISOString().split('T')[0];
    const usageData = {
      userId: data.user.id,
      date: today,
      usedMinutes: 0,
      dailyLimit: accountType === 'free' ? 150 : -1
    };
    await kv.set(`time_usage_${data.user.id}_${today}`, usageData);

    await logAdminAction(supabaseUser.id, 'CREATE_MANUAL_USER', data.user.id, {
      email,
      name,
      role,
      accountType,
      isActive: userProfile.isActive
    });

    console.log('Manual user profile created successfully');

    return c.json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role,
        accountType
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Manual user creation error:', error);
    return c.json({ error: 'Failed to create user. Please try again.' }, 500);
  }
});

// PUT /admin/users/:userId/status - Toggle user active status
app.put('/admin/users/:userId/status', async (c) => {
  try {
    const { supabaseUser } = await requireAdminUser(c.req.raw);

    const userId = c.req.param('userId');
    const { isActive } = await c.req.json();

    // Get current user profile
    const userProfile = await kv.get(`user_profile_${userId}`);
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update user profile
    const updatedProfile = { ...userProfile, isActive };
    await kv.set(`user_profile_${userId}`, updatedProfile);

    await logAdminAction(supabaseUser.id, 'UPDATE_USER_STATUS', userId, {
      oldStatus: userProfile.isActive,
      newStatus: isActive
    });

    return c.json({ success: true, message: 'User status updated successfully' });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Admin update status error:', error);
    return c.json({ error: 'Failed to update user status' }, 500);
  }
});

// GET /admin/logs - Get admin activity logs
app.get('/admin/logs', async (c) => {
  try {
    await requireAdminUser(c.req.raw);

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');

    // Get all logs
    let logs = await kv.getByPrefix('admin_log_');
    
    // Sort by creation date (newest first)
    logs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const total = logs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);

    // Add admin names to logs
    const logsWithAdminNames = await Promise.all(
      paginatedLogs.map(async (log) => {
        const adminProfile = await kv.get(`user_profile_${log.adminId}`);
        return {
          ...log,
          adminName: adminProfile?.name || adminProfile?.email || 'Unknown Admin'
        };
      })
    );

    return c.json({
      logs: logsWithAdminNames,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Admin logs error:', error);
    return c.json({ error: 'Failed to get admin logs' }, 500);
  }
});

// GET /admin/pricing-plans - Get pricing plans (admin view)
app.get('/admin/pricing-plans', async (c) => {
  try {
    const { supabaseUser } = await requireAdminUser(c.req.raw);

    // Get pricing plans from KV store
    const plans = await kv.getByPrefix('pricing_plan_');
    
    // Default pricing plans if none exist
    const defaultPlans = [
      {
        id: 'free',
        accountType: 'free',
        name: 'Free Plan',
        description: 'Basic features for personal use',
        features: ['150 minutes per day', 'Basic translation', 'Export functionality'],
        prices: { CNY: 0, USD: 0, EUR: 0, GBP: 0 },
        monthlyPrice: 0,
        yearlyPrice: 0,
        yearlyDiscount: 0,
        dailyMinutes: 150,
        monthlyMinutes: 1000,
        maxNotes: 50,
        aiSummaryLimit: 0,
        isActive: true,
        isPopular: false,
        displayOrder: 1,
        trialDays: 0,
        autoRenewal: false
      },
      {
        id: 'pro',
        accountType: 'pro',
        name: 'Pro Plan',
        description: 'Professional features for business users',
        features: ['Unlimited usage', 'Advanced translation', 'AI summaries', 'Priority support'],
        prices: { CNY: 99, USD: 14.99, EUR: 12.99, GBP: 11.99 },
        monthlyPrice: 14.99,
        yearlyPrice: 149.99,
        yearlyDiscount: 17,
        dailyMinutes: -1,
        monthlyMinutes: -1,
        maxNotes: 500,
        aiSummaryLimit: 50,
        isActive: true,
        isPopular: true,
        displayOrder: 2,
        trialDays: 7,
        autoRenewal: true
      },
      {
        id: 'enterprise',
        accountType: 'enterprise',
        name: 'Enterprise Plan',
        description: 'Enterprise features for teams',
        features: ['Unlimited usage', 'Team management', 'Enterprise security', '24/7 support', 'API access'],
        prices: { CNY: 299, USD: 49.99, EUR: 39.99, GBP: 34.99 },
        monthlyPrice: 49.99,
        yearlyPrice: 499.99,
        yearlyDiscount: 17,
        dailyMinutes: -1,
        monthlyMinutes: -1,
        maxNotes: -1,
        aiSummaryLimit: -1,
        isActive: true,
        isPopular: false,
        displayOrder: 3,
        trialDays: 14,
        autoRenewal: true
      }
    ];

    await logAdminAction(supabaseUser.id, 'VIEW_PRICING_PLANS');

    return c.json({
      success: true,
      plans: plans.length > 0 ? plans : defaultPlans
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Error getting admin pricing plans:', error);
    return c.json({ error: 'Failed to get pricing plans' }, 500);
  }
});

// PUT /admin/pricing-plans - Create or update pricing plan
app.put('/admin/pricing-plans', async (c) => {
  try {
    const { supabaseUser } = await requireAdminUser(c.req.raw);

    const planData = await c.req.json();
    
    if (!planData.id || !planData.name || !planData.accountType) {
      return c.json({ error: 'Missing required plan data' }, 400);
    }

    // Ensure required fields have defaults
    const plan = {
      ...planData,
      updatedAt: new Date().toISOString(),
      createdAt: planData.createdAt || new Date().toISOString()
    };

    // Save pricing plan
    await kv.set(`pricing_plan_${plan.id}`, plan);

    await logAdminAction(supabaseUser.id, 'UPDATE_PRICING_PLAN', plan.id, {
      planName: plan.name,
      accountType: plan.accountType
    });

    return c.json({ 
      success: true, 
      message: 'Pricing plan saved successfully',
      plan 
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Error saving pricing plan:', error);
    return c.json({ error: 'Failed to save pricing plan' }, 500);
  }
});

// DELETE /admin/pricing-plans/:planId - Delete pricing plan
app.delete('/admin/pricing-plans/:planId', async (c) => {
  try {
    const { supabaseUser } = await requireAdminUser(c.req.raw);

    const planId = c.req.param('planId');
    
    // Don't allow deletion of system plans
    if (['free', 'pro', 'enterprise'].includes(planId)) {
      return c.json({ error: 'Cannot delete system pricing plans' }, 403);
    }

    // Get existing plan
    const existingPlan = await kv.get(`pricing_plan_${planId}`);
    if (!existingPlan) {
      return c.json({ error: 'Pricing plan not found' }, 404);
    }

    // Delete pricing plan
    await kv.del(`pricing_plan_${planId}`);

    await logAdminAction(supabaseUser.id, 'DELETE_PRICING_PLAN', planId, {
      planName: existingPlan.name,
      accountType: existingPlan.accountType
    });

    return c.json({ 
      success: true, 
      message: 'Pricing plan deleted successfully' 
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin privileges')) {
      return c.json({ error: error.message }, 403);
    }
    console.error('Error deleting pricing plan:', error);
    return c.json({ error: 'Failed to delete pricing plan' }, 500);
  }
});

// GET /user/profile - Get user profile
app.get('/user/profile', async (c) => {
  try {
    const { supabaseUser, profile, role } = await requireAuthenticatedUser(c.req.raw);

    let storedProfile = await getUserProfile(supabaseUser.id);
    if (!storedProfile) {
      storedProfile = profile;
      await kv.set(`user_profile_${supabaseUser.id}`, storedProfile);
      await kv.set(`user_role_${supabaseUser.id}`, role);
    }

    return c.json({
      success: true,
      user: {
        ...storedProfile,
        role,
      },
      profile: storedProfile,
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('authorization') || error.message.includes('Invalid token')) {
        return c.json({ error: error.message }, 401);
      }
    }
    console.error('Get user profile error:', error);
    return c.json({ error: 'Failed to get user profile' }, 500);
  }
});

export default app;
