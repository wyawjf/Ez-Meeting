import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { 
  Mic, 
  Play, 
  Square, 
  Pause,
  Settings, 
  Languages,
  Save,
  X,
  Trash2,
  Crown,
  User,
  Zap,
  Brain,
  Globe,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  PictureInPicture,
  ExternalLink,
  Tv,
  Monitor,
  MicIcon,
  Volume2,
  Wifi,
  WifiOff,
  Info,
  ArrowDown,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { LanguageContext } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { FloatingSubtitleWidget } from './FloatingSubtitleWidget';
import { FloatingSubtitleWindow } from './FloatingSubtitleWindow';

// Import utilities and constants
import { 
  RealtimeTranscript,
  languages,
  getRecordingTypes,
  getTranscriptionEngines,
  getTranslationServices,
  getFloatingModes
} from './constants/mainPageConstants';

import { translateText } from './utils/translationServices';
import { 
  checkWebSpeechSupport,
  initializeWebSpeech,
  createProcessWebSpeechResult
} from './utils/speechRecognitionUtils';
import { 
  setupAudioLevelMonitoring,
  checkBrowserCompatibility,
  connectMicrophone as connectMicrophoneUtil,
  formatRecordingDuration
} from './utils/audioUtils';

// Import time tracking utilities
import {
  addTimeUsage,
  getTodayUsage,
  ACCOUNT_LIMITS,
  initializeTimeTracking,
  type AccountType
} from './utils/timeTrackingUtils';
import { useAuth } from './contexts/AuthContext';
import { LoginPrompt } from './LoginPrompt';

export function MainPage() {
  const { t, language } = useContext(LanguageContext);
  const { user } = useAuth();
  
  // Basic recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [translationEnabled, setTranslationEnabled] = useState(true);
  const [translationService, setTranslationService] = useState<'mymemory' | 'libretranslate' | 'google-free'>('mymemory');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('zh');
  
  // Time tracking states
  const [accountType, setAccountTypeState] = useState<AccountType>(user?.accountType || 'free');
  const [remainingMinutes, setRemainingMinutes] = useState(150);
  const [usedMinutesToday, setUsedMinutesToday] = useState(0);
  const [monthlyUsedMinutes, setMonthlyUsedMinutes] = useState(0);
  const [remainingMonthlyMinutes, setRemainingMonthlyMinutes] = useState(1000);
  const [effectiveRemainingMinutes, setEffectiveRemainingMinutes] = useState(150);
  
  // Floating display states
  const [floatingMode, setFloatingMode] = useState<'none' | 'widget' | 'window' | 'pip'>('none');
  const [showFloatingWidget, setShowFloatingWidget] = useState(false);
  const [showFloatingWindow, setShowFloatingWindow] = useState(false);
  const [pipVideoRef, setPipVideoRef] = useState<HTMLVideoElement | null>(null);
  
  // Engine and connection states - Always default to web-speech first
  const [transcriptionEngine, setTranscriptionEngine] = useState<'web-speech' | 'openai'>('web-speech');
  const [webSpeechSupported, setWebSpeechSupported] = useState(false);
  const [openaiAvailable, setOpenaiAvailable] = useState(false);
  const [openaiError, setOpenaiError] = useState<string | null>(null);
  const [openaiLastChecked, setOpenaiLastChecked] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error' | 'requesting'>('disconnected');
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [microphoneSupported, setMicrophoneSupported] = useState(true);
  const [browserInfo, setBrowserInfo] = useState('');
  
  // Real-time transcription states
  const [realtimeTranscripts, setRealtimeTranscripts] = useState<RealtimeTranscript[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunksProcessed, setChunksProcessed] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Subtitle display states - simplified for better auto-scroll
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [lastScrollTime, setLastScrollTime] = useState(0);
  
  // Session states
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionType, setSessionType] = useState('meeting');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSessionTitle, setSaveSessionTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Translation and speech states
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isWebSpeechActive, setIsWebSpeechActive] = useState(false);
  const [webSpeechError, setWebSpeechError] = useState<string | null>(null);
  
  // Debug and monitoring states
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Login prompt states
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptFeature, setLoginPromptFeature] = useState('');
  
  // Refs
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get computed values
  const recordingTypes = getRecordingTypes(language);
  const transcriptionEngines = getTranscriptionEngines(language);
  const translationServices = getTranslationServices(language);
  const floatingModes = getFloatingModes(language);

  // Add debug message
  const addDebugMessage = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev.slice(-8), `[${timestamp}] ${message}`]);
    console.log(`[Debug] ${message}`);
  }, []);

  // Enhanced scroll to bottom function
  const scrollToBottom = useCallback((force = false) => {
    if (!scrollViewportRef.current) {
      addDebugMessage('ScrollViewport ref not available');
      return;
    }

    // Always scroll to bottom when recording, unless user recently scrolled
    const now = Date.now();
    const shouldScroll = force || !isUserScrolling || (now - lastScrollTime > 2000);
    
    if (shouldScroll) {
      try {
        const element = scrollViewportRef.current;
        element.scrollTop = element.scrollHeight;
        addDebugMessage(`Auto-scrolled to bottom: ${element.scrollTop}/${element.scrollHeight}`);
      } catch (error) {
        addDebugMessage(`Scroll error: ${error}`);
      }
    } else {
      addDebugMessage('Auto-scroll skipped - user recently scrolled');
    }
  }, [isUserScrolling, lastScrollTime, addDebugMessage]);

  // Handle scroll events - simplified logic
  const handleScroll = useCallback(() => {
    if (!scrollViewportRef.current) return;
    
    const now = Date.now();
    const element = scrollViewportRef.current;
    const { scrollTop, scrollHeight, clientHeight } = element;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    
    // Update user scrolling state
    if (!isAtBottom) {
      setIsUserScrolling(true);
      setLastScrollTime(now);
      addDebugMessage('User scrolling detected');
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Auto-disable user scrolling after 3 seconds of no scroll activity
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
        addDebugMessage('Auto-scroll re-enabled');
      }, 3000);
    } else if (isUserScrolling) {
      // User scrolled back to bottom
      setIsUserScrolling(false);
      addDebugMessage('User scrolled to bottom - auto-scroll enabled');
    }
  }, [addDebugMessage]);

  // Force scroll to bottom - for button click
  const handleScrollToBottom = useCallback(() => {
    setIsUserScrolling(false);
    setLastScrollTime(0);
    scrollToBottom(true);
    addDebugMessage('Force scroll to bottom triggered');
  }, [scrollToBottom, addDebugMessage]);

  // Auto scroll when new transcripts arrive - simplified logic
  useEffect(() => {
    if (realtimeTranscripts.length > 0 && isRecording) {
      // Always try to scroll when new content arrives during recording
      setTimeout(() => {
        scrollToBottom();
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [realtimeTranscripts.length, isRecording, scrollToBottom]);

  // Enhanced Web Speech API detection
  const checkWebSpeechSupportCallback = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      const supported = !!SpeechRecognition;
      
      addDebugMessage(`Web Speech API check: ${supported ? 'Supported' : 'Not supported'}`);
      
      if (supported) {
        try {
          const testRecognition = new SpeechRecognition();
          testRecognition.continuous = true;
          testRecognition.interimResults = true;
          addDebugMessage('Web Speech API instance created successfully');
          return true;
        } catch (error) {
          addDebugMessage(`Web Speech API instance creation failed: ${error}`);
          return false;
        }
      }
      
      return supported;
    } catch (error) {
      addDebugMessage(`Web Speech API detection error: ${error}`);
      return false;
    }
  }, [addDebugMessage]);

  // Update time states from user profile and server
  const updateTimeStates = useCallback(async () => {
    if (!user) {
      setAccountTypeState('free');
      setRemainingMinutes(ACCOUNT_LIMITS.free);
      setUsedMinutesToday(0);
      setMonthlyUsedMinutes(0);
      setRemainingMonthlyMinutes(1000);
      setEffectiveRemainingMinutes(ACCOUNT_LIMITS.free);
      return;
    }
    
    try {
      setAccountTypeState(user.accountType);
      const usage = await getTodayUsage();
      setUsedMinutesToday(usage.usedMinutes);
      setMonthlyUsedMinutes(usage.monthlyUsedMinutes || 0);
      setRemainingMinutes(usage.remainingMinutes || 0);
      setRemainingMonthlyMinutes(usage.remainingMonthlyMinutes || 0);
      setEffectiveRemainingMinutes(usage.effectiveRemainingMinutes || 0);
      
      localStorage.setItem('last-known-usage', JSON.stringify(usage));
      addDebugMessage(`Time usage updated: ${usage.usedMinutes}/${usage.dailyLimit} daily`);
    } catch (error) {
      console.error('Error updating time states:', error);
      addDebugMessage(`Error updating time states: ${error.message}`);
      const currentDailyLimit = ACCOUNT_LIMITS[user.accountType];
      setRemainingMinutes(currentDailyLimit);
      setEffectiveRemainingMinutes(currentDailyLimit);
    }
  }, [user, addDebugMessage]);

  // Improved OpenAI API test with better error handling and throttling
  const testOpenAIAPI = useCallback(async (forceCheck = false) => {
    const now = Date.now();
    const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    // Throttle API checks to avoid consuming quota unnecessarily
    if (!forceCheck && now - openaiLastChecked < CHECK_INTERVAL) {
      addDebugMessage('Skipping OpenAI API check - recently checked');
      return { success: openaiAvailable, reason: 'throttled', silent: true };
    }
    
    try {
      addDebugMessage('Checking OpenAI API availability...');
      setOpenaiLastChecked(now);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-851310fa/test-openai`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        addDebugMessage('OpenAI API is available and working');
        setOpenaiAvailable(true);
        setOpenaiError(null);
        return { success: true };
      } else {
        // Handle different error types silently
        let errorType = 'unknown';
        let errorMessage = 'Unknown error';
        
        if (result.error) {
          if (typeof result.error === 'object') {
            errorType = result.error.type || result.error.code || 'unknown';
            errorMessage = result.error.message || 'Unknown error';
          } else if (typeof result.error === 'string') {
            errorMessage = result.error;
            if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
              errorType = 'quota_exceeded';
            } else if (errorMessage.includes('auth') || errorMessage.includes('key')) {
              errorType = 'auth_error';
            }
          }
        }
        
        addDebugMessage(`OpenAI API error: ${errorType} - ${errorMessage}`);
        
        if (errorType === 'insufficient_quota' || errorType === 'quota_exceeded') {
          setOpenaiError('quota_exceeded');
          setOpenaiAvailable(false);
          
          // Auto-switch to web-speech if currently on openai
          if (transcriptionEngine === 'openai') {
            setTranscriptionEngine('web-speech');
            addDebugMessage('Auto-switched to Web Speech due to OpenAI quota limit');
          }
          
          return { success: false, reason: 'quota_exceeded', silent: true };
        } else if (errorType === 'invalid_api_key' || errorType === 'authentication' || errorType === 'auth_error') {
          setOpenaiError('auth_error');
          setOpenaiAvailable(false);
          return { success: false, reason: 'auth_error', silent: true };
        } else {
          setOpenaiError('general_error');
          setOpenaiAvailable(false);
          return { success: false, reason: 'general_error', silent: true };
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        addDebugMessage('OpenAI API check timed out');
        setOpenaiError('timeout');
      } else {
        addDebugMessage(`OpenAI API check failed: ${error.message}`);
        setOpenaiError('network_error');
      }
      
      setOpenaiAvailable(false);
      return { success: false, reason: error.name === 'AbortError' ? 'timeout' : 'network_error', silent: true };
    }
  }, [addDebugMessage, openaiLastChecked, openaiAvailable, transcriptionEngine]);

  // Initialize app and check compatibility
  useEffect(() => {
    const initializeApp = async () => {
      try {
        addDebugMessage('Initializing Ez Meeting application...');
        
        // Initialize time tracking
        initializeTimeTracking();
        if (user) {
          await updateTimeStates();
        }

        // Check browser and feature support
        const userAgent = navigator.userAgent;
        let browserName = 'Unknown';
        let isSupported = true;
        
        if (userAgent.includes('Chrome')) {
          browserName = 'Chrome';
        } else if (userAgent.includes('Edge')) {
          browserName = 'Edge';
        } else if (userAgent.includes('Firefox')) {
          browserName = 'Firefox';
          isSupported = false;
        } else if (userAgent.includes('Safari')) {
          browserName = 'Safari';
          isSupported = false;
        }
        
        setBrowserInfo(browserName);
        addDebugMessage(`Browser: ${browserName}, Web Speech supported: ${isSupported}`);

        // Check microphone support
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          setMicrophoneSupported(true);
          addDebugMessage('Microphone API supported');
        } else {
          setMicrophoneSupported(false);
          addDebugMessage('Microphone API not supported');
        }

        // Check Web Speech API support
        const webSpeechSupport = checkWebSpeechSupportCallback();
        setWebSpeechSupported(webSpeechSupport);
        
        if (!webSpeechSupport && !isSupported) {
          // Show browser compatibility warning only once
          setTimeout(() => {
            toast.warning(
              language === 'zh' 
                ? `检测到${browserName}浏览器。为获得最佳录音体验，建议使用Chrome或Edge浏览器。` 
                : `${browserName} detected. For best recording experience, please use Chrome or Edge browser.`,
              { duration: 8000 }
            );
          }, 2000);
        }

        // Check OpenAI API availability (with throttling)
        await testOpenAIAPI(false);

        addDebugMessage('Application initialization completed');
        
      } catch (error) {
        console.error('Error during app initialization:', error);
        addDebugMessage(`App initialization error: ${error}`);
      }
    };

    initializeApp();
  }, [user, updateTimeStates, addDebugMessage, language, checkWebSpeechSupportCallback, testOpenAIAPI]);

  // Update recording duration
  const updateRecordingDuration = useCallback(() => {
    if (recordingStartTimeRef.current && !isPaused) {
      const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      setRecordingDuration(elapsed);
    }
  }, [isPaused]);

  // Setup audio level monitoring wrapper
  const setupAudioLevelMonitoringWrapper = useCallback((stream: MediaStream) => {
    const { audioContext, analyser } = setupAudioLevelMonitoring(
      stream, isRecording, isPaused, setAudioLevel, addDebugMessage
    );
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  }, [isRecording, isPaused, addDebugMessage]);

  // Enhanced connect microphone with proper error handling
  const connectMicrophone = useCallback(async (): Promise<MediaStream | null> => {
    try {
      addDebugMessage('Requesting microphone permission...');
      setConnectionStatus('requesting');
      setPermissionState('prompt');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone API not supported in this browser');
      }

      const constraints = { 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 16000 },
          channelCount: { ideal: 1 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!stream || !stream.active) {
        throw new Error('Failed to get active microphone stream');
      }

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available');
      }

      addDebugMessage(`Microphone connected: ${audioTracks[0].label || 'Default'}`);

      streamRef.current = stream;
      setConnectionStatus('connected');
      setPermissionState('granted');
      
      setupAudioLevelMonitoringWrapper(stream);
      
      toast.success(
        language === 'zh' 
          ? '麦克风连接成功' 
          : 'Microphone connected successfully'
      );

      return stream;
    } catch (error) {
      console.error('Error connecting microphone:', error);
      addDebugMessage(`Microphone connection error: ${error}`);
      setConnectionStatus('error');
      
      if (error.name === 'NotAllowedError') {
        setPermissionState('denied');
        toast.error(
          language === 'zh' 
            ? '麦克风权限被拒绝。请点击浏览器地址栏的锁图标，允许麦克风访问后刷新页面。' 
            : 'Microphone permission denied. Please click the lock icon in the address bar, allow microphone access, and refresh the page.'
        );
      } else if (error.name === 'NotFoundError') {
        toast.error(
          language === 'zh' 
            ? '未找到麦克风设备，请检查设备连接' 
            : 'No microphone device found. Please check device connection.'
        );
      } else if (error.name === 'NotReadableError') {
        toast.error(
          language === 'zh' 
            ? '麦克风被其他应用占用，请关闭其他使用麦克风的应用' 
            : 'Microphone is being used by another application. Please close other apps using the microphone.'
        );
      } else {
        toast.error(
          language === 'zh' 
            ? `麦克风连接失败：${error.message}` 
            : `Failed to connect microphone: ${error.message}`
        );
      }
      
      return null;
    }
  }, [addDebugMessage, setupAudioLevelMonitoringWrapper, language]);

  // Create process web speech result function
  const processWebSpeechResult = createProcessWebSpeechResult(
    translationEnabled,
    targetLanguage,
    sourceLanguage,
    translationService,
    chunksProcessed,
    setRealtimeTranscripts,
    setChunksProcessed,
    () => {},
    0,
    realtimeTranscripts.length,
    addDebugMessage,
    language,
    setIsTranslating,
    setTranslationError
  );

  // Enhanced start recording with better error handling
  const startRealtimeRecording = useCallback(async () => {
    // Check time limits for authenticated users
    if (user && effectiveRemainingMinutes <= 0) {
      const isMonthlyLimitReached = user.accountType === 'free' && remainingMonthlyMinutes <= 0;
      const isDailyLimitReached = remainingMinutes <= 0;
      
      let errorMessage = '';
      if (isMonthlyLimitReached) {
        errorMessage = language === 'zh' 
          ? '本月免费时间已用完，请下月再试或升级到Pro账户' 
          : 'Monthly free time limit reached. Please try again next month or upgrade to Pro.';
      } else if (isDailyLimitReached) {
        errorMessage = language === 'zh' 
          ? '今日免费时间已用完，请明天再试或升级到Pro账户' 
          : 'Daily free time limit reached. Please try again tomorrow or upgrade to Pro.';
      } else {
        errorMessage = language === 'zh' 
          ? '免费时间已用完，请升级到Pro账户' 
          : 'Free time limit reached. Please upgrade to Pro.';
      }
      
      toast.error(errorMessage);
      return;
    }

    try {
      setIsProcessing(true);
      addDebugMessage(`Starting recording with ${transcriptionEngine} engine...`);
      
      // Handle OpenAI engine selection with improved fallback
      let actualEngine = transcriptionEngine;
      
      if (transcriptionEngine === 'openai') {
        if (!openaiAvailable) {
          addDebugMessage('OpenAI not available, switching to Web Speech');
          actualEngine = 'web-speech';
          setTranscriptionEngine('web-speech');
        } else {
          // Quick re-check of OpenAI availability before starting
          const apiTest = await testOpenAIAPI(true);
          if (!apiTest.success) {
            addDebugMessage('OpenAI API check failed during start, falling back to Web Speech');
            actualEngine = 'web-speech';
            setTranscriptionEngine('web-speech');
          }
        }
      }

      // Ensure we have Web Speech for fallback
      if (actualEngine === 'web-speech' && !webSpeechSupported) {
        throw new Error(
          language === 'zh' 
            ? '当前浏览器不支持语音识别。请使用Chrome或Edge浏览器以获得最佳体验。' 
            : 'Speech recognition not supported in this browser. Please use Chrome or Edge for the best experience.'
        );
      }

      if (!microphoneSupported) {
        throw new Error(
          language === 'zh' 
            ? '当前浏览器不支持麦克风访问，请使用现代浏览器' 
            : 'Microphone access not supported in this browser. Please use a modern browser.'
        );
      }
      
      // Reset states - including scroll states
      setRealtimeTranscripts([]);
      setChunksProcessed(0);
      setIsPaused(false);
      setTranslationError(null);
      setRecordingDuration(0);
      setWebSpeechError(null);
      setIsUserScrolling(false);
      setLastScrollTime(0);
      
      // Connect microphone
      let stream = streamRef.current;
      if (!stream || !stream.active) {
        addDebugMessage('Connecting to microphone...');
        stream = await connectMicrophone();
        if (!stream) {
          throw new Error(
            language === 'zh' 
              ? '无法访问麦克风。请检查浏览器权限设置。' 
              : 'Cannot access microphone. Please check browser permission settings.'
          );
        }
      }
      
      recordingStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(updateRecordingDuration, 1000);
      
      // Initialize speech recognition (always use Web Speech as it's most reliable)
      if (webSpeechSupported) {
        try {
          const speechRecognition = initializeWebSpeech(
            sourceLanguage,
            addDebugMessage,
            language,
            isRecording,
            isPaused,
            actualEngine,
            setIsWebSpeechActive,
            setWebSpeechError,
            setPermissionState,
            setConnectionStatus,
            processWebSpeechResult
          );
          setRecognition(speechRecognition);
          
          speechRecognition.start();
          addDebugMessage('Web Speech Recognition started successfully');
          
          toast.success(
            language === 'zh' 
              ? `开始${actualEngine === 'openai' ? 'AI高精度' : '免费语音'}识别${translationEnabled ? ' + 实时翻译' : ''}` 
              : `Started ${actualEngine === 'openai' ? 'AI high-accuracy' : 'free speech'} recognition${translationEnabled ? ' + real-time translation' : ''}`
          );
        } catch (speechError) {
          console.error('Speech recognition start error:', speechError);
          addDebugMessage(`Speech recognition error: ${speechError}`);
          throw new Error(
            language === 'zh' 
              ? '语音识别启动失败。请检查麦克风权限并确保使用支持的浏览器。' 
              : 'Failed to start speech recognition. Please check microphone permissions and ensure you are using a supported browser.'
          );
        }
      }
      
      setIsRecording(true);
      addDebugMessage('Recording started successfully');

    } catch (error) {
      console.error('Error starting recording:', error);
      addDebugMessage(`Recording start error: ${error}`);
      
      // Clean up on error
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      toast.error(
        language === 'zh' 
          ? `启动录音失败：${error instanceof Error ? error.message : '未知错误'}` 
          : `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
    }
  }, [transcriptionEngine, webSpeechSupported, microphoneSupported, openaiAvailable, translationEnabled, language, connectMicrophone, addDebugMessage, updateRecordingDuration, testOpenAIAPI, sourceLanguage, isRecording, isPaused, processWebSpeechResult, user, effectiveRemainingMinutes, remainingMonthlyMinutes, remainingMinutes]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    setIsPaused(true);
    
    if (recognition && isWebSpeechActive) {
      recognition.stop();
      addDebugMessage('Web Speech Recognition paused');
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    setAudioLevel(0);
    addDebugMessage('Recording paused');
    
    toast.info(language === 'zh' ? '录音已暂停' : 'Recording paused');
  }, [recognition, isWebSpeechActive, addDebugMessage, language]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (user && effectiveRemainingMinutes <= 0) {
      toast.error(language === 'zh' ? '免费时间已用完，无法继续录音' : 'Free time limit reached. Cannot continue recording.');
      return;
    }

    setIsPaused(false);
    
    if (webSpeechSupported) {
      const speechRecognition = initializeWebSpeech(
        sourceLanguage,
        addDebugMessage,
        language,
        true,
        false,
        transcriptionEngine,
        setIsWebSpeechActive,
        setWebSpeechError,
        setPermissionState,
        setConnectionStatus,
        processWebSpeechResult
      );
      setRecognition(speechRecognition);
      speechRecognition.start();
      addDebugMessage('Web Speech Recognition resumed');
    }
    
    durationIntervalRef.current = setInterval(updateRecordingDuration, 1000);
    addDebugMessage('Recording resumed');
    
    toast.success(language === 'zh' ? '录音已恢复' : 'Recording resumed');
  }, [webSpeechSupported, sourceLanguage, addDebugMessage, language, updateRecordingDuration, processWebSpeechResult, user, effectiveRemainingMinutes, transcriptionEngine]);

  // Stop recording and show save dialog
  const stopRecording = useCallback(() => {
    const defaultTitle = sessionTitle.trim() || 
      `${recordingTypes.find(t => t.value === sessionType)?.label} - ${new Date().toLocaleString()}`;
    
    setSaveSessionTitle(defaultTitle);
    setShowSaveDialog(true);
    
    if (!isPaused) {
      pauseRecording();
    }
  }, [sessionTitle, sessionType, recordingTypes, isPaused, pauseRecording]);

  // Save session
  const saveSession = useCallback(async () => {
    if (!saveSessionTitle.trim()) {
      toast.error(language === 'zh' ? '请输入会话名称' : 'Please enter session name');
      return;
    }

    setIsSaving(true);
    
    try {
      addDebugMessage('Saving session...');

      const sessionDurationMinutes = Math.max(1, Math.ceil(recordingDuration / 60));
      if (sessionDurationMinutes > 0 && user) {
        try {
          await addTimeUsage(sessionDurationMinutes, sessionType, saveSessionTitle);
          addDebugMessage(`Successfully added ${sessionDurationMinutes} minutes to time usage`);
          await updateTimeStates();
        } catch (error) {
          console.error('Error adding time usage:', error);
          toast.error(language === 'zh' ? '时间记录失败，但会话已保存' : 'Time tracking failed, but session saved');
        }
      }

      if (recognition && isWebSpeechActive) {
        recognition.stop();
        setRecognition(null);
        setIsWebSpeechActive(false);
        addDebugMessage('Web Speech Recognition stopped');
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        addDebugMessage('Audio context closed');
      }

      const sessionData = {
        id: `session_${Date.now()}`,
        title: saveSessionTitle,
        type: sessionType,
        date: new Date().toISOString().split('T')[0],
        duration: formatRecordingDuration(recordingDuration),
        durationMinutes: sessionDurationMinutes,
        durationSeconds: recordingDuration,
        transcripts: realtimeTranscripts,
        engine: transcriptionEngine,
        translationEnabled: translationEnabled,
        translationService: translationService,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        wordCount: realtimeTranscripts.reduce((acc, t) => acc + t.original.split(' ').length, 0),
        createdAt: new Date().toISOString(),
        userId: user?.id
      };

      if (user) {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-851310fa/user/save-note`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData),
          });

          if (!response.ok) {
            throw new Error('Failed to save to server');
          }
        } catch (serverError) {
          console.error('Server save failed, falling back to local storage:', serverError);
          const existingSessions = JSON.parse(localStorage.getItem('ezmeeting-sessions') || '[]');
          existingSessions.unshift(sessionData);
          localStorage.setItem('ezmeeting-sessions', JSON.stringify(existingSessions.slice(0, 50)));
        }
      } else {
        const existingSessions = JSON.parse(localStorage.getItem('ezmeeting-sessions') || '[]');
        existingSessions.unshift(sessionData);
        localStorage.setItem('ezmeeting-sessions', JSON.stringify(existingSessions.slice(0, 50)));
      }

      addDebugMessage(`Session saved: ${sessionData.id}`);
      
      // Reset states
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
      setRecordingDuration(0);
      setRealtimeTranscripts([]);
      setChunksProcessed(0);
      recordingStartTimeRef.current = null;
      
      // Close floating displays
      setFloatingMode('none');
      setShowFloatingWidget(false);
      setShowFloatingWindow(false);
      
      if (user) {
        updateTimeStates();
      }
      
      setShowSaveDialog(false);
      setSaveSessionTitle('');
      
      toast.success(
        language === 'zh' 
          ? `会话已保存：${saveSessionTitle}${user ? `，用时${sessionDurationMinutes}分钟` : ''}` 
          : `Session saved: ${saveSessionTitle}${user ? `, ${sessionDurationMinutes} minutes used` : ''}`
      );

      setTimeout(() => {
        window.location.href = '/notes';
      }, 2000);

    } catch (error) {
      console.error('Error saving session:', error);
      addDebugMessage(`Save session error: ${error}`);
      toast.error(language === 'zh' ? '保存会话时出错' : 'Error saving session');
    } finally {
      setIsSaving(false);
    }
  }, [saveSessionTitle, sessionType, recordingDuration, realtimeTranscripts, transcriptionEngine, translationEnabled, translationService, sourceLanguage, targetLanguage, recognition, isWebSpeechActive, addDebugMessage, language, updateTimeStates, user]);

  // Discard session
  const discardSession = useCallback(() => {
    if (!confirm(
      language === 'zh' 
        ? '确定要丢弃这次录音吗？所有录音内容将会丢失！' 
        : 'Are you sure you want to discard this recording? All recording content will be lost!'
    )) {
      return;
    }

    if (recognition && isWebSpeechActive) {
      recognition.stop();
      setRecognition(null);
      setIsWebSpeechActive(false);
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    setAudioLevel(0);
    setRecordingDuration(0);
    setRealtimeTranscripts([]);
    setChunksProcessed(0);
    recordingStartTimeRef.current = null;
    
    // Close floating displays
    setFloatingMode('none');
    setShowFloatingWidget(false);
    setShowFloatingWindow(false);
    
    setShowSaveDialog(false);
    setSaveSessionTitle('');
    
    addDebugMessage('Session discarded without saving');
    toast.info(language === 'zh' ? '录音已丢弃，未消耗使用时间' : 'Recording discarded, no time consumed');
  }, [recognition, isWebSpeechActive, addDebugMessage, language]);

  // Handle recording control
  const handleRecordingControl = () => {
    if (!user) {
      setLoginPromptFeature(language === 'zh' ? '录音功能' : 'Recording Feature');
      setShowLoginPrompt(true);
      return;
    }

    if (!isRecording) {
      startRealtimeRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  // Handle floating mode change
  const handleFloatingModeChange = (mode: 'none' | 'widget' | 'window' | 'pip') => {
    setFloatingMode(mode);
    
    setShowFloatingWidget(false);
    setShowFloatingWindow(false);
    
    if (mode === 'widget') {
      setShowFloatingWidget(true);
    } else if (mode === 'window') {
      setShowFloatingWindow(true);
    }
    
    toast.success(
      language === 'zh' 
        ? `悬浮模式已切换至：${floatingModes.find(m => m.value === mode)?.name}` 
        : `Floating mode switched to: ${floatingModes.find(m => m.value === mode)?.name}`
    );
  };

  // Handle engine change with improved availability check
  const handleEngineChange = (engine: 'web-speech' | 'openai') => {
    if (engine === 'openai') {
      if (!openaiAvailable) {
        // Show specific error message based on the error type
        let message = '';
        switch (openaiError) {
          case 'quota_exceeded':
            message = language === 'zh' 
              ? 'OpenAI API 配额已用完，当前使用免费语音识别' 
              : 'OpenAI API quota exceeded. Currently using free speech recognition.';
            break;
          case 'auth_error':
            message = language === 'zh' 
              ? 'OpenAI API 需要配置，当前使用免费语音识别' 
              : 'OpenAI API requires configuration. Currently using free speech recognition.';
            break;
          case 'timeout':
            message = language === 'zh' 
              ? 'OpenAI API 连接超时，当前使用免费语音识别' 
              : 'OpenAI API connection timeout. Currently using free speech recognition.';
            break;
          default:
            message = language === 'zh' 
              ? 'OpenAI API 当前不可用，使用免费语音识别' 
              : 'OpenAI API currently unavailable. Using free speech recognition.';
        }
        
        toast.info(message, { duration: 5000 });
        return;
      }
    }
    
    if (engine === 'web-speech' && !webSpeechSupported) {
      toast.warning(
        language === 'zh' 
          ? '当前浏览器不支持语音识别，建议使用Chrome或Edge浏览器' 
          : 'Speech recognition not supported in current browser. Please use Chrome or Edge.'
      );
      return;
    }
    
    setTranscriptionEngine(engine);
    addDebugMessage(`Transcription engine changed to: ${engine}`);
  };

  // Get OpenAI status message with improved details
  const getOpenAIStatusMessage = () => {
    if (openaiAvailable) return null;
    
    switch (openaiError) {
      case 'quota_exceeded':
        return language === 'zh' ? 'API配额已用完' : 'Quota exceeded';
      case 'auth_error':
        return language === 'zh' ? '需要配置API' : 'API setup required';
      case 'network_error':
        return language === 'zh' ? '网络连接错���' : 'Network error';
      case 'timeout':
        return language === 'zh' ? '连接超时' : 'Timeout';
      default:
        return language === 'zh' ? '暂时不可用' : 'Unavailable';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recognition) {
        recognition.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [recognition]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900">
      {/* Time Balance for authenticated users */}
      {user && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-slate-500/10 border-b border-indigo-200/50 dark:border-indigo-700/50 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{t('main.timeBalance')}</span>
              <Badge 
                variant={accountType === 'pro' ? 'default' : 'secondary'} 
                className={`text-xs px-2 py-1 ${
                  accountType === 'pro' 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {accountType === 'pro' ? (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    Pro
                  </>
                ) : (
                  language === 'zh' ? '免费版' : 'Free'
                )}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-indigo-600 dark:text-indigo-400">
                  {accountType === 'free' ? effectiveRemainingMinutes : '∞'}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'zh' ? '今日可用' : 'Available'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="font-bold text-purple-600 dark:text-purple-400">
                  {usedMinutesToday}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'zh' ? '已用' : 'Used'}
                </div>
              </div>
              
              {accountType === 'free' && (
                <div className="text-center">
                  <div className="font-bold text-slate-600 dark:text-slate-400">
                    {remainingMonthlyMinutes}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'zh' ? '本月剩余' : 'Monthly'}
                  </div>
                </div>
              )}
            </div>
            
            {/* 今日时间使用进度条 */}
            {accountType === 'free' && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                  <span>{language === 'zh' ? '今日使用进度' : 'Daily Usage Progress'}</span>
                  <span className="font-mono">
                    {usedMinutesToday} / {ACCOUNT_LIMITS.free} {language === 'zh' ? '分钟' : 'min'}
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={(usedMinutesToday / ACCOUNT_LIMITS.free) * 100} 
                    className="h-2 bg-slate-200/70 dark:bg-slate-700/70"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30"></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500">
                  <span>{Math.round((usedMinutesToday / ACCOUNT_LIMITS.free) * 100)}% {language === 'zh' ? '已使用' : 'used'}</span>
                  <span>{Math.round((effectiveRemainingMinutes / ACCOUNT_LIMITS.free) * 100)}% {language === 'zh' ? '剩余' : 'remaining'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest Mode Alert */}
      {!user && (
        <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-700 mx-6 mt-4 mb-2">
          <User className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">{t('auth.guestMode')}</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{t('auth.guestModeDesc')}</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setLoginPromptFeature(language === 'zh' ? '时间管理' : 'Time Management');
                  setShowLoginPrompt(true);
                }}
                className="ml-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                {t('auth.loginToUse')}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* OpenAI Quota Warning */}
      {openaiError === 'quota_exceeded' && (
        <Alert className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-700 mx-6 mt-4 mb-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  {language === 'zh' ? 'OpenAI API 配额已用完' : 'OpenAI API Quota Exceeded'}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  {language === 'zh' 
                    ? '当前已自动切换到免费语音识别，功能不受影响' 
                    : 'Automatically switched to free speech recognition. Functionality not affected.'
                  }
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Main Content Grid - Properly Aligned */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Panel - Settings */}
            <div className="xl:col-span-3 space-y-4">
              {/* Combined Settings Card */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base text-slate-800 dark:text-slate-200">
                    <Settings className="h-4 w-4" />
                    <span>{language === 'zh' ? '设置' : 'Settings'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Session Title */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-700 dark:text-slate-300">{language === 'zh' ? '会话标题' : 'Session Title'}</Label>
                    <Input
                      placeholder={language === 'zh' ? '输入会话标题（可选）' : 'Enter session title (optional)'}
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      disabled={isRecording}
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 h-9 text-sm"
                    />
                  </div>

                  {/* Session Type */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-700 dark:text-slate-300">{language === 'zh' ? '会话类型' : 'Session Type'}</Label>
                    <Select value={sessionType} onValueChange={setSessionType} disabled={isRecording}>
                      <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {recordingTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="bg-slate-200 dark:bg-slate-600" />

                  {/* Language Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Languages className="h-4 w-4 text-indigo-600" />
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{language === 'zh' ? '语言设置' : 'Languages'}</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">{t('main.sourceLanguage')}</Label>
                      <Select value={sourceLanguage} onValueChange={setSourceLanguage} disabled={isRecording}>
                        <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">{t('main.targetLanguage')}</Label>
                      <Select value={targetLanguage} onValueChange={setTargetLanguage} disabled={isRecording}>
                        <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="space-y-1">
                        <Label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                          <Globe className="h-3 w-3" />
                          <span>{language === 'zh' ? '实时翻译' : 'Translation'}</span>
                        </Label>
                      </div>
                      <Switch
                        checked={translationEnabled}
                        onCheckedChange={setTranslationEnabled}
                        disabled={isRecording}
                      />
                    </div>
                  </div>

                  <Separator className="bg-slate-200 dark:bg-slate-600" />

                  {/* Engine Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-700 dark:text-slate-300">{language === 'zh' ? '转录引擎' : 'Engine'}</Label>
                    <Select value={transcriptionEngine} onValueChange={handleEngineChange} disabled={isRecording}>
                      <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transcriptionEngines.map((engine) => (
                          <SelectItem key={engine.value} value={engine.value}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                {engine.value === 'web-speech' ? (
                                  <Zap className="h-3 w-3 text-purple-500" />
                                ) : (
                                  <Brain className="h-3 w-3 text-indigo-500" />
                                )}
                                <span className="text-sm">{engine.label}</span>
                              </div>
                              {engine.value === 'openai' && !openaiAvailable && (
                                <Badge variant="secondary" className="text-xs ml-2">
                                  {getOpenAIStatusMessage()}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {transcriptionEngine === 'openai' && !openaiAvailable && (
                      <Alert className="mt-2">
                        <Info className="h-3 w-3" />
                        <AlertDescription className="text-xs">
                          {openaiError === 'quota_exceeded' ? (
                            language === 'zh' 
                              ? 'OpenAI API 配额已用完，已自动使用免费语音识别' 
                              : 'OpenAI API quota exceeded. Using free speech recognition.'
                          ) : (
                            language === 'zh' 
                              ? 'OpenAI API 暂时不可用，建议使用免费语音识别' 
                              : 'OpenAI API unavailable. Using free speech recognition.'
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Separator className="bg-slate-200 dark:bg-slate-600" />

                  {/* Floating Mode */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-700 dark:text-slate-300">{language === 'zh' ? '悬浮模式' : 'Floating Mode'}</Label>
                    <Select value={floatingMode} onValueChange={handleFloatingModeChange}>
                      <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {floatingModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            <div className="flex items-center space-x-2">
                              {mode.value === 'none' && <Monitor className="h-3 w-3" />}
                              {mode.value === 'widget' && <PictureInPicture className="h-3 w-3" />}
                              {mode.value === 'window' && <ExternalLink className="h-3 w-3" />}
                              {mode.value === 'pip' && <Tv className="h-3 w-3" />}
                              <span className="text-sm">{mode.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Recording & Subtitles */}
            <div className="xl:col-span-9 space-y-6">
              {/* Recording Status */}
              {isRecording && (
                <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-slate-500/10 border border-purple-200/50 dark:border-purple-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-500 animate-pulse' : 'bg-purple-500 animate-pulse'}`}></div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {isPaused ? (language === 'zh' ? '录音已暂停' : 'Recording Paused') : (language === 'zh' ? '正在录音' : 'Recording')}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {realtimeTranscripts.length} {language === 'zh' ? '段转录内容' : 'transcripts'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="font-mono text-lg px-3 py-1 bg-slate-100 dark:bg-slate-700">
                        {formatRecordingDuration(recordingDuration)}
                      </Badge>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {Math.ceil(recordingDuration / 60)} {language === 'zh' ? '分钟消耗' : 'min used'}
                      </p>
                    </div>
                  </div>
                  
                  {audioLevel > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{language === 'zh' ? '音频电平' : 'Audio Level'}</span>
                        <span>{Math.round(audioLevel)}%</span>
                      </div>
                      <Progress 
                        value={audioLevel} 
                        className="h-1 bg-slate-200 dark:bg-slate-700"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Main Recording Controls */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="space-y-3">
                      <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                        {!isRecording 
                          ? (language === 'zh' ? '开始录音识别' : 'Start Recording Recognition')
                          : isPaused 
                            ? (language === 'zh' ? '录音已暂停' : 'Recording Paused')
                            : (language === 'zh' ? '录音进行中' : 'Recording in Progress')
                        }
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        {!isRecording 
                          ? (language === 'zh' ? '点击开始按钮开始实时语音识别和翻译' : 'Click start button to begin real-time speech recognition and translation')
                          : (language === 'zh' ? '使用控制按钮管理录音状态' : 'Use control buttons to manage recording status')
                        }
                      </p>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <Button
                        size="lg"
                        onClick={handleRecordingControl}
                        disabled={isProcessing}
                        className={`h-16 px-12 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                          !isRecording 
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white' 
                            : isPaused 
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
                              : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            {language === 'zh' ? '启动中...' : 'Starting...'}
                          </>
                        ) : !isRecording ? (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            {t('main.startRecognition')}
                          </>
                        ) : isPaused ? (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            {language === 'zh' ? '继续录音' : 'Resume Recording'}
                          </>
                        ) : (
                          <>
                            <Pause className="h-5 w-5 mr-2" />
                            {language === 'zh' ? '暂停录音' : 'Pause Recording'}
                          </>
                        )}
                      </Button>
                      
                      {isRecording && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={stopRecording}
                          disabled={isProcessing}
                          className="h-12 px-8 rounded-lg bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          {t('main.stopRecognition')}
                        </Button>
                      )}
                    </div>

                    {/* System Status Indicators with improved OpenAI status */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs max-w-2xl mx-auto">
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                        webSpeechSupported 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                          : 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
                      }`}>
                        {webSpeechSupported ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        <span>{language === 'zh' ? '语音识别' : 'Speech'}</span>
                      </div>
                      
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                        microphoneSupported 
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                          : 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
                      }`}>
                        {microphoneSupported ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        <span>{language === 'zh' ? '麦克风' : 'Microphone'}</span>
                      </div>

                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                        openaiAvailable 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                          : openaiError === 'quota_exceeded'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
                      }`}>
                        {openaiAvailable ? (
                          <Wifi className="h-3 w-3" />
                        ) : openaiError === 'quota_exceeded' ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <WifiOff className="h-3 w-3" />
                        )}
                        <span>OpenAI</span>
                      </div>

                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                        connectionStatus === 'connected' 
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                          : connectionStatus === 'requesting'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
                      }`}>
                        {connectionStatus === 'connected' ? <CheckCircle className="h-3 w-3" /> : 
                         connectionStatus === 'requesting' ? <Loader2 className="h-3 w-3 animate-spin" /> : 
                         <AlertCircle className="h-3 w-3" />}
                        <span>{language === 'zh' ? '连接状态' : 'Connection'}</span>
                      </div>
                    </div>

                    {/* Browser recommendation */}
                    {browserInfo && (browserInfo === 'Firefox' || browserInfo === 'Safari') && (
                      <Alert className="max-w-2xl mx-auto bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                          {language === 'zh' 
                            ? `检测到${browserInfo}浏览器，推荐使用Chrome或Edge获得最佳录音体验。` 
                            : `${browserInfo} detected. Chrome or Edge recommended for best recording experience.`
                          }
                        </AlertDescription>
                      </Alert>
                    )}

                    {!user && (
                      <Alert className="max-w-2xl mx-auto bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-700">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm text-indigo-800 dark:text-indigo-200">
                          {language === 'zh' ? '登录后可使用完整的录音和保存功能。' : 'Login to access full recording and saving features.'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Subtitles */}
              {isRecording && (
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                      <div className="flex items-center space-x-3">
                        <Activity className="h-5 w-5 text-purple-500" />
                        <span className="text-lg">{t('main.realtimeSubtitles')}</span>
                        <Badge variant="secondary" className="text-xs animate-pulse bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          {t('main.realtime')}
                        </Badge>
                      </div>
                      {isUserScrolling && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleScrollToBottom}
                          className="flex items-center space-x-1 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 border-indigo-200 dark:border-indigo-700"
                        >
                          <ArrowDown className="h-3 w-3" />
                          <span>{language === 'zh' ? '回到底部' : 'Scroll Down'}</span>
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div 
                      ref={scrollViewportRef}
                      onScroll={handleScroll}
                      className="h-[45rem] w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto p-6 space-y-4"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      {realtimeTranscripts.length === 0 ? (
                        <div className="text-center text-slate-500 dark:text-slate-400 py-24">
                          <div className="animate-pulse space-y-4">
                            <div className="h-16 w-16 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800 rounded-full mx-auto flex items-center justify-center">
                              <Volume2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <p className="text-lg">{t('main.listening')}</p>
                            <p className="text-sm max-w-md mx-auto">{language === 'zh' ? '请开始说话，系统将实时转录和翻译您的语音...' : 'Please start speaking, the system will transcribe and translate your speech in real time...'}</p>
                          </div>
                        </div>
                      ) : (
                        realtimeTranscripts.map((transcript, index) => (
                          <div key={index} className="space-y-3 p-5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>{transcript.timestamp}</span>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" size="sm" className="text-xs">
                                  {transcript.source === 'web-speech' ? 'Web Speech' : 'OpenAI'}
                                </Badge>
                                <Badge variant="outline" size="sm" className="text-xs">
                                  {Math.round((transcript.confidence || 0.9) * 100)}%
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="text-base leading-relaxed font-medium text-slate-800 dark:text-slate-200">
                                {transcript.original}
                              </div>
                              {transcript.translation !== transcript.original && (
                                <div className="text-base leading-relaxed text-indigo-700 dark:text-indigo-300 border-l-3 border-indigo-300 dark:border-indigo-600 pl-4 bg-indigo-50/50 dark:bg-indigo-950/20 py-3 rounded-r-lg">
                                  {transcript.translation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Save Dialog */}
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogContent className="max-w-lg bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Save className="h-5 w-5" />
                  <span>{language === 'zh' ? '保存录音会话' : 'Save Recording Session'}</span>
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  {language === 'zh' 
                    ? `录音时长：${formatRecordingDuration(recordingDuration)}，包含${realtimeTranscripts.length}段转录内容。`
                    : `Recording duration: ${formatRecordingDuration(recordingDuration)}, with ${realtimeTranscripts.length} transcripts.`
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">{language === 'zh' ? '会话标题' : 'Session Title'}</Label>
                  <Input
                    value={saveSessionTitle}
                    onChange={(e) => setSaveSessionTitle(e.target.value)}
                    placeholder={language === 'zh' ? '输入会话标题' : 'Enter session title'}
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                  />
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-sm space-y-3 border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">{language === 'zh' ? '录音时长：' : 'Duration:'}</span>
                    <span className="font-mono text-lg text-slate-800 dark:text-slate-200">{formatRecordingDuration(recordingDuration)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">{language === 'zh' ? '转录片段：' : 'Transcripts:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{realtimeTranscripts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">{language === 'zh' ? '单词总数：' : 'Word count:'}</span>
                    <span className="text-slate-800 dark:text-slate-200">{realtimeTranscripts.reduce((acc, t) => acc + t.original.split(' ').length, 0)}</span>
                  </div>
                  <Separator className="bg-slate-200 dark:bg-slate-600" />
                  <div className="flex justify-between items-center text-base font-medium">
                    <span className="text-slate-800 dark:text-slate-200">{language === 'zh' ? '消耗时间：' : 'Time consumed:'}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{Math.ceil(recordingDuration / 60)} {t('main.minutes')}</span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={saveSession}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {language === 'zh' ? '保存会话' : 'Save Session'}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={discardSession}
                    className="flex-1 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {language === 'zh' ? '丢弃录音' : 'Discard Recording'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                    disabled={isSaving}
                    className="flex-1 border-slate-200 dark:border-slate-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Login Prompt */}
          <LoginPrompt
            open={showLoginPrompt}
            onOpenChange={setShowLoginPrompt}
            feature={loginPromptFeature}
            description={
              language === 'zh' 
                ? '使用录音功能需要先登录账户，登录后可以保存录音记录并追踪使用时间。'
                : 'Recording features require login. After login, you can save recordings and track usage time.'
            }
          />

          {/* Floating Widgets */}
          {showFloatingWidget && (
            <FloatingSubtitleWidget
              transcripts={realtimeTranscripts}
              isRecording={isRecording}
              onClose={() => {
                setShowFloatingWidget(false);
                setFloatingMode('none');
              }}
            />
          )}

          {showFloatingWindow && (
            <FloatingSubtitleWindow
              transcripts={realtimeTranscripts}
              isRecording={isRecording}
              onClose={() => {
                setShowFloatingWindow(false);
                setFloatingMode('none');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}