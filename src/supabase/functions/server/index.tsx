import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import adminApp from './admin.tsx';

const app = new Hono();

// Enhanced CORS middleware to support figma.site domains
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

// Add logging
app.use('*', logger(console.log));

// Health check endpoint
app.get('/make-server-851310fa/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    cors: 'enabled for figma.site'
  });
});

// Special endpoint to setup Wyatt Wang as admin (no auth required)
app.post('/make-server-851310fa/setup-wyatt-admin', async (c) => {
  try {
    console.log('🎯 Setting up Wyatt Wang admin privileges...');
    
    // Import KV store
    const kvModule = await import('./server/kv_store.tsx');
    const kv = kvModule;
    
    // Set Wyatt's email and admin role directly
    const wyattEmail = 'awyawjf2000@gmail.com';
    
    // Find user by email in all profiles
    const allProfiles = await kv.getByPrefix('user_profile_');
    let wyattProfile = allProfiles.find(profile => profile.email === wyattEmail);
    
    if (wyattProfile) {
      console.log('Found Wyatt profile, updating to admin:', wyattProfile.id);
      
      // Set role to super_admin
      await kv.set(`user_role_${wyattProfile.id}`, 'super_admin');
      
      // Update profile
      wyattProfile.role = 'super_admin';
      wyattProfile.accountType = 'pro';
      await kv.set(`user_profile_${wyattProfile.id}`, wyattProfile);
      
      return c.json({ 
        success: true, 
        message: 'Wyatt Wang admin privileges granted successfully',
        user: {
          id: wyattProfile.id,
          email: wyattProfile.email,
          role: 'super_admin',
          accountType: 'pro'
        }
      });
    } else {
      // Create placeholder profile for Wyatt
      const wyattId = crypto.randomUUID();
      const newProfile = {
        id: wyattId,
        email: wyattEmail,
        name: 'Wyatt Wang',
        role: 'super_admin',
        accountType: 'pro',
        createdAt: new Date().toISOString(),
        isActive: true,
        preferences: {
          sourceLanguage: 'auto',
          targetLanguage: 'zh',
          autoLanguageDetection: true,
        }
      };
      
      await kv.set(`user_profile_${wyattId}`, newProfile);
      await kv.set(`user_role_${wyattId}`, 'super_admin');
      
      console.log('Created Wyatt profile with admin privileges');
      
      return c.json({ 
        success: true, 
        message: 'Wyatt Wang admin profile created successfully',
        user: {
          id: wyattId,
          email: wyattEmail,
          role: 'super_admin',
          accountType: 'pro'
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Wyatt admin setup error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Public pricing endpoint (no authentication required)
app.get('/make-server-851310fa/pricing-plans', async (c) => {
  try {
    // Import KV store
    const kvModule = await import('./kv_store.tsx');
    const kv = kvModule;
    
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
        dailyMinutes: 150,
        monthlyMinutes: 1000,
        isActive: true
      },
      {
        id: 'pro',
        accountType: 'pro',
        name: 'Pro Plan',
        description: 'Professional features for business users',
        features: ['Unlimited usage', 'Advanced translation', 'Priority support', 'Meeting recording'],
        prices: { CNY: 99, USD: 14.99, EUR: 12.99, GBP: 11.99 },
        dailyMinutes: -1,
        monthlyMinutes: -1,
        isActive: true
      },
      {
        id: 'enterprise',
        accountType: 'enterprise',
        name: 'Enterprise Plan',
        description: 'Enterprise features for teams',
        features: ['Unlimited usage', 'Team management', 'Enterprise security', '24/7 dedicated support', 'Custom integrations'],
        prices: { CNY: 299, USD: 49.99, EUR: 39.99, GBP: 34.99 },
        dailyMinutes: -1,
        monthlyMinutes: -1,
        isActive: true
      }
    ];

    return c.json({ 
      success: true, 
      plans: plans.length > 0 ? plans : defaultPlans 
    });
    
  } catch (error) {
    console.error('Error getting public pricing plans:', error);
    
    // Return default plans on error
    return c.json({ 
      success: true, 
      plans: [
        {
          id: 'free',
          accountType: 'free',
          name: 'Free Plan',
          description: 'Basic features for personal use',
          features: ['150 minutes per day', 'Basic translation', 'Export functionality'],
          prices: { CNY: 0, USD: 0, EUR: 0, GBP: 0 },
          dailyMinutes: 150,
          monthlyMinutes: 1000,
          isActive: true
        },
        {
          id: 'pro',
          accountType: 'pro',
          name: 'Pro Plan',
          description: 'Professional features for business users',
          features: ['Unlimited usage', 'Advanced translation', 'Priority support', 'Meeting recording'],
          prices: { CNY: 99, USD: 14.99, EUR: 12.99, GBP: 11.99 },
          dailyMinutes: -1,
          monthlyMinutes: -1,
          isActive: true
        },
        {
          id: 'enterprise',
          accountType: 'enterprise',
          name: 'Enterprise Plan',
          description: 'Enterprise features for teams',
          features: ['Unlimited usage', 'Team management', 'Enterprise security', '24/7 dedicated support', 'Custom integrations'],
          prices: { CNY: 299, USD: 49.99, EUR: 39.99, GBP: 34.99 },
          dailyMinutes: -1,
          monthlyMinutes: -1,
          isActive: true
        }
      ]
    });
  }
});

// Payment routes
app.post('/make-server-851310fa/payment/create-session', async (c) => {
  try {
    // Import KV store
    const kvModule = await import('./kv_store.tsx');
    const kv = kvModule;
    
    // Verify user authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.substring(7);
    
    // Get request data
    const { planId, currency, amount, paymentMethod, paymentData, successUrl, cancelUrl } = await c.req.json();
    
    // Validate required fields
    if (!planId || !currency || !amount || !paymentMethod) {
      return c.json({ error: 'Missing required payment parameters' }, 400);
    }

    // Create payment session ID
    const sessionId = crypto.randomUUID();
    const paymentSession = {
      id: sessionId,
      planId,
      currency,
      amount,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      successUrl,
      cancelUrl
    };

    // Store payment session
    await kv.set(`payment_session_${sessionId}`, paymentSession);

    // For demo purposes, we'll simulate different payment flows
    if (paymentMethod === 'card') {
      // In a real implementation, you would:
      // 1. Create a Stripe payment intent
      // 2. Return the client secret for Stripe Elements
      // 3. Handle the payment confirmation
      
      // Demo: Simulate successful card payment
      setTimeout(async () => {
        try {
          paymentSession.status = 'completed';
          paymentSession.completedAt = new Date().toISOString();
          await kv.set(`payment_session_${sessionId}`, paymentSession);
          
          // Update user account type (this would be done in webhook handler)
          // For demo, we'll do it here
          console.log('Payment completed for session:', sessionId);
        } catch (error) {
          console.error('Error completing payment:', error);
        }
      }, 3000);

      return c.json({
        success: true,
        sessionId,
        paymentIntentId: `pi_demo_${sessionId}`,
        message: 'Payment processing initiated'
      });
      
    } else if (paymentMethod === 'paypal') {
      // PayPal redirect URL (in real implementation, use PayPal SDK)
      const redirectUrl = `https://www.paypal.com/checkoutnow?token=demo_${sessionId}`;
      return c.json({
        success: true,
        sessionId,
        redirectUrl,
        message: 'Redirecting to PayPal'
      });
      
    } else if (paymentMethod === 'alipay') {
      // Alipay redirect URL (in real implementation, use Alipay SDK)
      const redirectUrl = `https://openapi.alipay.com/gateway.do?demo_session=${sessionId}`;
      return c.json({
        success: true,
        sessionId,
        redirectUrl,
        message: 'Redirecting to Alipay'
      });
      
    } else if (paymentMethod === 'wechat') {
      // WeChat Pay QR code URL (in real implementation, use WeChat Pay SDK)
      const qrCodeUrl = `https://pay.weixin.qq.com/qr/demo_${sessionId}`;
      return c.json({
        success: true,
        sessionId,
        qrCodeUrl,
        message: 'WeChat Pay QR code generated'
      });
    }

    return c.json({ error: 'Unsupported payment method' }, 400);
    
  } catch (error) {
    console.error('Payment session creation error:', error);
    return c.json({ error: 'Failed to create payment session' }, 500);
  }
});

// Payment webhook handler (for production use)
app.post('/make-server-851310fa/payment/webhook', async (c) => {
  try {
    // Import KV store
    const kvModule = await import('./kv_store.tsx');
    const kv = kvModule;
    
    // In a real implementation, you would:
    // 1. Verify webhook signature (Stripe, PayPal, etc.)
    // 2. Handle different webhook events
    // 3. Update user account status
    // 4. Send confirmation emails
    
    const { sessionId, status, paymentIntentId } = await c.req.json();
    
    if (status === 'completed' && sessionId) {
      // Get payment session
      const paymentSession = await kv.get(`payment_session_${sessionId}`);
      
      if (paymentSession) {
        paymentSession.status = 'completed';
        paymentSession.completedAt = new Date().toISOString();
        paymentSession.paymentIntentId = paymentIntentId;
        
        await kv.set(`payment_session_${sessionId}`, paymentSession);
        
        // Update user account type based on plan
        // This would be implemented based on your user management system
        console.log('Webhook processed for session:', sessionId);
      }
    }

    return c.json({ success: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// Get payment session status
app.get('/make-server-851310fa/payment/session/:sessionId', async (c) => {
  try {
    // Import KV store
    const kvModule = await import('./kv_store.tsx');
    const kv = kvModule;
    
    const sessionId = c.req.param('sessionId');
    const paymentSession = await kv.get(`payment_session_${sessionId}`);
    
    if (!paymentSession) {
      return c.json({ error: 'Payment session not found' }, 404);
    }

    return c.json({
      success: true,
      session: paymentSession
    });
    
  } catch (error) {
    console.error('Error getting payment session:', error);
    return c.json({ error: 'Failed to get payment session' }, 500);
  }
});

// Payment configuration routes for super admin
app.get('/make-server-851310fa/admin/payment-config', async (c) => {
  try {
    // Import KV store
    const kvModule = await import('./kv_store.tsx');
    const kv = kvModule;
    
    // Verify admin authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Get payment configuration
    const config = await kv.get('payment_config');
    
    return c.json({
      success: true,
      config: config || {
        stripe: { enabled: false, publishableKey: '', secretKey: '', webhookSecret: '', accountId: '' },
        paypal: { enabled: false, clientId: '', clientSecret: '', mode: 'sandbox', webhookId: '' },
        alipay: { enabled: false, appId: '', privateKey: '', publicKey: '', partnerId: '' },
        wechatPay: { enabled: false, appId: '', mchId: '', apiKey: '', certPath: '' },
        bankAccount: { accountName: '', bankName: '', accountNumber: '', routingNumber: '', swift: '', country: '' },
        taxSettings: { vatNumber: '', taxId: '', businessAddress: '', defaultTaxRate: 0 }
      }
    });
    
  } catch (error) {
    console.error('Error getting payment config:', error);
    return c.json({ error: 'Failed to get payment configuration' }, 500);
  }
});

app.post('/make-server-851310fa/admin/payment-config', async (c) => {
  try {
    // Import KV store
    const kvModule = await import('./kv_store.tsx');
    const kv = kvModule;
    
    // Verify admin authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { config } = await c.req.json();
    
    if (!config) {
      return c.json({ error: 'Payment configuration data required' }, 400);
    }

    // Save encrypted payment configuration
    // In production, you should encrypt sensitive data like API keys
    await kv.set('payment_config', config);
    
    console.log('Payment configuration updated by admin');
    
    return c.json({
      success: true,
      message: 'Payment configuration saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving payment config:', error);
    return c.json({ error: 'Failed to save payment configuration' }, 500);
  }
});

// AI Analysis routes
app.post('/make-server-851310fa/ai/analyze-notes', async (c) => {
  try {
    // Import KV store
    const kvModule = await import('./kv_store.tsx');
    const kv = kvModule;
    
    // Verify user authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.substring(7);
    
    // Get request data
    const { noteId, transcripts, accountType } = await c.req.json();
    
    // Check if user has permission (Pro or Enterprise only)
    if (!accountType || (accountType !== 'pro' && accountType !== 'enterprise')) {
      return c.json({ 
        error: 'AI analysis requires Pro or Enterprise account',
        requiresUpgrade: true 
      }, 403);
    }

    // Validate required fields
    if (!noteId || !transcripts || !Array.isArray(transcripts)) {
      return c.json({ error: 'Missing note ID or transcripts' }, 400);
    }

    // Check if analysis already exists
    const existingAnalysis = await kv.get(`ai_analysis_${noteId}`);
    if (existingAnalysis) {
      return c.json({
        success: true,
        analysis: existingAnalysis,
        cached: true
      });
    }

    // Prepare content for analysis
    const content = transcripts
      .map((transcript, index) => `[${index + 1}] ${transcript.original}`)
      .join('\n\n');

    if (content.length < 10) {
      return c.json({ error: 'Content too short for analysis' }, 400);
    }

    // Call OpenRouter API with Mistral model
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterApiKey) {
      console.error('OpenRouter API key not configured');
      return c.json({ error: 'AI service not configured' }, 500);
    }

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ezmeeting.app',
        'X-Title': 'Ez Meeting'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in analyzing meeting transcripts and notes. Please provide a comprehensive analysis including key points, action items, decisions made, and a concise summary. Format your response in clear sections with bullet points where appropriate. Respond in the same language as the input content.'
          },
          {
            role: 'user',
            content: `Please analyze the following transcript and provide:\n1. Main topics discussed\n2. Key decisions or conclusions\n3. Action items (if any)\n4. Summary\n\nTranscript:\n${content}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        top_p: 0.9
      })
    });

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      return c.json({ error: 'AI analysis failed' }, 500);
    }

    const openrouterData = await openrouterResponse.json();
    const analysis = openrouterData.choices?.[0]?.message?.content;

    if (!analysis) {
      return c.json({ error: 'No analysis generated' }, 500);
    }

    // Cache the analysis
    const analysisData = {
      content: analysis,
      generatedAt: new Date().toISOString(),
      model: 'mistralai/mistral-7b-instruct',
      wordCount: content.split(' ').length
    };

    await kv.set(`ai_analysis_${noteId}`, analysisData);

    return c.json({
      success: true,
      analysis: analysisData,
      cached: false
    });
    
  } catch (error) {
    console.error('AI analysis error:', error);
    return c.json({ error: 'AI analysis failed' }, 500);
  }
});

// Get cached AI analysis
app.get('/make-server-851310fa/ai/analysis/:noteId', async (c) => {
  try {
    // Import KV store
    const kvModule = await import('./kv_store.tsx');
    const kv = kvModule;
    
    const noteId = c.req.param('noteId');
    const analysis = await kv.get(`ai_analysis_${noteId}`);
    
    if (!analysis) {
      return c.json({ error: 'Analysis not found' }, 404);
    }

    return c.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('Error getting analysis:', error);
    return c.json({ error: 'Failed to get analysis' }, 500);
  }
});

// AI Analysis translation endpoint
app.post('/make-server-851310fa/ai/translate-analysis', async (c) => {
  try {
    // Import KV store
    const kvModule = await import('./kv_store.tsx');
    const kv = kvModule;
    
    // Verify user authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.substring(7);
    
    // Get request data
    const { noteId, originalContent, targetLanguage, accountType } = await c.req.json();
    
    // Check if user has permission (Pro or Enterprise only)
    if (!accountType || (accountType !== 'pro' && accountType !== 'enterprise')) {
      return c.json({ 
        error: 'AI analysis translation requires Pro or Enterprise account',
        requiresUpgrade: true 
      }, 403);
    }

    // Validate required fields
    if (!noteId || !originalContent || !targetLanguage) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create cache key for translated content
    const translationCacheKey = `ai_translation_${noteId}_${targetLanguage}`;
    
    // Check if translation already exists
    const existingTranslation = await kv.get(translationCacheKey);
    if (existingTranslation) {
      return c.json({
        success: true,
        translatedContent: existingTranslation,
        cached: true
      });
    }

    // Call OpenRouter API for translation
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterApiKey) {
      console.error('OpenRouter API key not configured');
      return c.json({ error: 'Translation service not configured' }, 500);
    }

    // Language mapping for translation
    const languageNames = {
      'zh': 'Chinese',
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
      'ko': 'Korean',
      'pt': 'Portuguese',
      'it': 'Italian',
      'ru': 'Russian',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'tr': 'Turkish'
    };

    const targetLanguageName = languageNames[targetLanguage as keyof typeof languageNames] || 'English';
    const systemPrompt = `You are a professional translator. Translate the following AI analysis content into ${targetLanguageName}. Maintain the original structure, formatting, and meaning. Keep technical terms and proper nouns where appropriate. Preserve any bullet points, numbered lists, and section headers.`;

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ezmeeting.app',
        'X-Title': 'Ez Meeting'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: originalContent
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        top_p: 0.9
      })
    });

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter translation API error:', errorText);
      return c.json({ error: 'Translation failed' }, 500);
    }

    const openrouterData = await openrouterResponse.json();
    const translatedContent = openrouterData.choices?.[0]?.message?.content;

    if (!translatedContent) {
      return c.json({ error: 'No translation generated' }, 500);
    }

    // Cache the translation
    await kv.set(translationCacheKey, translatedContent);

    return c.json({
      success: true,
      translatedContent,
      cached: false
    });
    
  } catch (error) {
    console.error('Translation error:', error);
    return c.json({ error: 'Translation failed' }, 500);
  }
});

// Set super admin route (for initial setup)
app.post('/make-server-851310fa/admin/set-super-admin', async (c) => {
  try {
    // Import KV store
    const kvModule = await import('./kv_store.tsx');
    const kv = kvModule;
    
    const { email } = await c.req.json();
    
    // Only allow setting Wyatt Wang as super admin
    if (email !== 'awyawjf2000@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Set user as super admin
    await kv.set(`user_role_${email}`, 'super_admin');
    
    console.log(`Set ${email} as super admin`);
    
    return c.json({
      success: true,
      message: 'Super admin role assigned successfully'
    });
    
  } catch (error) {
    console.error('Error setting super admin:', error);
    return c.json({ error: 'Failed to set super admin role' }, 500);
  }
});

// Mount admin routes
app.route('/make-server-851310fa', adminApp);

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ 
    error: 'Internal server error', 
    message: err.message,
    timestamp: new Date().toISOString()
  }, 500);
});

// Handle preflight requests
app.options('*', (c) => {
  return new Response(null, { status: 200 });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found', path: c.req.path }, 404);
});

// Start the server
console.log('🚀 Starting Ez Meeting server with enhanced CORS support...');
console.log('📍 Allowed origins: localhost, figma.site domains');

Deno.serve(app.fetch);