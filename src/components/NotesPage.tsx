import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { AIAnalysisButton } from './AIAnalysisButton';
import { AIAnalysisSidebar } from './AIAnalysisSidebar';
import { 
  Search,
  Filter,
  SortDesc,
  SortAsc,
  Play,
  Download,
  Trash2,
  FileText,
  Clock,
  Calendar,
  User,
  BookOpen,
  Briefcase,
  GraduationCap,
  Presentation,
  Video,
  Crown,
  ArrowLeft,
  Eye,
  MoreHorizontal,
  Star,
  Archive,
  Share2,
  Edit3,
  Copy,
  ExternalLink,
  Activity,
  Volume2,
  Languages,
  Globe,
  Brain,
  Zap,
  Info,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Lock
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { LoginPrompt } from './LoginPrompt';
import { publicAnonKey } from '../utils/supabase/info';
import { apiRoutes } from '../utils/api/endpoints';
import { formatRecordingDuration } from './utils/audioUtils';
import { 
  addTimeUsage,
  getTodayUsage,
  ACCOUNT_LIMITS,
  type AccountType
} from './utils/timeTrackingUtils';

// Types
interface SessionData {
  id: string;
  title: string;
  type: string;
  date: string;
  duration: string;
  durationMinutes: number;
  durationSeconds: number;
  transcripts: any[];
  engine: string;
  translationEnabled: boolean;
  translationService: string;
  sourceLanguage: string;
  targetLanguage: string;
  wordCount: number;
  createdAt: string;
  userId?: string;
}

export function NotesPage() {
  const { t, language } = useContext(LanguageContext);
  const { user } = useAuth();
  
  // Session data states
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'duration'>('latest');
  
  // Detail view states
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(false);
  
  // Time tracking states (for user info display)
  const [accountType, setAccountType] = useState<AccountType>('free');
  const [usedMinutesToday, setUsedMinutesToday] = useState(0);
  const [remainingMinutes, setRemainingMinutes] = useState(150);
  const [remainingMonthlyMinutes, setRemainingMonthlyMinutes] = useState(1500);
  
  // Auth states
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Session types for filtering
  const sessionTypes = [
    { value: 'all', label: language === 'zh' ? '全部' : 'All', icon: FileText },
    { value: 'meeting', label: language === 'zh' ? '会议' : 'Meeting', icon: Briefcase },
    { value: 'course', label: language === 'zh' ? '课程' : 'Course', icon: BookOpen },
    { value: 'interview', label: language === 'zh' ? '面试' : 'Interview', icon: User },
    { value: 'lecture', label: language === 'zh' ? '讲座' : 'Lecture', icon: Presentation },
    { value: 'video', label: language === 'zh' ? '视频' : 'Video', icon: Video }
  ];

  // Sort options
  const sortOptions = [
    { value: 'latest', label: language === 'zh' ? '最新' : 'Latest', icon: SortDesc },
    { value: 'oldest', label: language === 'zh' ? '最旧' : 'Oldest', icon: SortAsc },
    { value: 'duration', label: language === 'zh' ? '时长' : 'Duration', icon: Clock }
  ];

  // Update time states from user profile
  const updateTimeStates = useCallback(async () => {
    if (!user) {
      setAccountType('free');
      setRemainingMinutes(ACCOUNT_LIMITS.free);
      setUsedMinutesToday(0);
      setRemainingMonthlyMinutes(1500);
      return;
    }
    
    try {
      setAccountType(user.accountType);
      const usage = await getTodayUsage();
      setUsedMinutesToday(usage.usedMinutes || 0);
      setRemainingMinutes(usage.remainingMinutes || 0);
      setRemainingMonthlyMinutes(usage.remainingMonthlyMinutes || 0);
    } catch (error) {
      console.error('Error updating time states:', error);
    }
  }, [user]);

  // Load sessions from server or local storage
  const loadSessions = useCallback(async () => {
    setLoading(true);
    
    try {
      let loadedSessions: SessionData[] = [];
      
      if (user) {
        // Load from server for authenticated users
        try {
          const response = await fetch(apiRoutes.user('/get-notes'), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            loadedSessions = data.notes || [];
          } else {
            throw new Error('Failed to load from server');
          }
        } catch (serverError) {
          console.error('Server load failed, falling back to local storage:', serverError);
          // Fallback to local storage
          const localSessions = localStorage.getItem('ezmeeting-sessions');
          if (localSessions) {
            loadedSessions = JSON.parse(localSessions);
          }
        }
      } else {
        // Load from local storage for guests
        const localSessions = localStorage.getItem('ezmeeting-sessions');
        if (localSessions) {
          loadedSessions = JSON.parse(localSessions);
        }
      }

      // Sort by creation date (newest first) by default
      loadedSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setSessions(loadedSessions);
      setFilteredSessions(loadedSessions);
      
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error(language === 'zh' ? '加载笔记失败' : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [user, language]);

  // Apply filters and search
  const applyFilters = useCallback(() => {
    let filtered = [...sessions];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => 
        session.title.toLowerCase().includes(query) ||
        session.transcripts.some(transcript => 
          transcript.original?.toLowerCase().includes(query) ||
          transcript.translation?.toLowerCase().includes(query)
        )
      );
    }
    
    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(session => session.type === selectedType);
    }
    
    // Apply sorting
    switch (sortOrder) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'duration':
        filtered.sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));
        break;
    }
    
    setFilteredSessions(filtered);
  }, [sessions, searchQuery, selectedType, sortOrder]);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!confirm(language === 'zh' ? '确定要删除这个笔记吗？' : 'Are you sure you want to delete this note?')) {
      return;
    }
    
    try {
      if (user) {
        // Delete from server
        try {
          const response = await fetch(apiRoutes.user('/delete-note'), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ noteId: sessionId }),
          });

          if (!response.ok) {
            throw new Error('Failed to delete from server');
          }
        } catch (serverError) {
          console.error('Server delete failed, updating local storage:', serverError);
        }
      }
      
      // Update local storage
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      localStorage.setItem('ezmeeting-sessions', JSON.stringify(updatedSessions));
      
      // Close detail view if deleted session was selected
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setShowDetails(false);
      }
      
      toast.success(language === 'zh' ? '笔记已删除' : 'Note deleted successfully');
      
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(language === 'zh' ? '删除失败' : 'Failed to delete note');
    }
  }, [sessions, selectedSession, user, language]);

  // Export session content
  const exportSession = useCallback((session: SessionData, format: 'txt' | 'srt' = 'txt') => {
    try {
      let content = '';
      
      if (format === 'txt') {
        content = `${session.title}\n`;
        content += `${language === 'zh' ? '日期' : 'Date'}: ${session.date}\n`;
        content += `${language === 'zh' ? '时长' : 'Duration'}: ${session.duration}\n`;
        content += `${language === 'zh' ? '类型' : 'Type'}: ${session.type}\n\n`;
        
        session.transcripts.forEach((transcript, index) => {
          content += `[${index + 1}] ${transcript.timestamp || ''}\n`;
          content += `${language === 'zh' ? '原文' : 'Original'}: ${transcript.original}\n`;
          if (transcript.translation !== transcript.original) {
            content += `${language === 'zh' ? '翻译' : 'Translation'}: ${transcript.translation}\n`;
          }
          content += '\n';
        });
      } else if (format === 'srt') {
        session.transcripts.forEach((transcript, index) => {
          const startTime = index * 5; // Assume 5 seconds per transcript
          const endTime = startTime + 5;
          
          content += `${index + 1}\n`;
          content += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
          content += `${transcript.original}\n`;
          if (transcript.translation !== transcript.original) {
            content += `${transcript.translation}\n`;
          }
          content += '\n';
        });
      }
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${session.title}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(language === 'zh' ? '导出成功' : 'Export successful');
      
    } catch (error) {
      console.error('Error exporting session:', error);
      toast.error(language === 'zh' ? '导出失败' : 'Export failed');
    }
  }, [language]);

  // Format SRT timestamp
  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0').replace('.', ',')}`;
  };

  // Get session type info
  const getSessionTypeInfo = (type: string) => {
    const typeInfo = sessionTypes.find(t => t.value === type);
    return typeInfo || sessionTypes[0];
  };

  // Initialize component
  useEffect(() => {
    updateTimeStates();
    loadSessions();
  }, [updateTimeStates, loadSessions]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // If showing details, render detail view
  if (showDetails && selectedSession) {
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
                    {accountType === 'free' ? remainingMinutes : '∞'}
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
                    <span>{Math.round((remainingMinutes / ACCOUNT_LIMITS.free) * 100)}% {language === 'zh' ? '剩余' : 'remaining'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex h-[calc(100vh-180px)]">
          {/* Main Content */}
          <div className={`flex-1 overflow-y-auto ${showAISidebar ? 'pr-0' : 'pr-6'} pl-6 py-6`}>
            <div className="max-w-5xl mx-auto space-y-6">
            {/* Detail Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedSession(null);
                  }}
                  className="border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('notes.backToList')}
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {selectedSession.title}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedSession.date} • {selectedSession.duration} • {selectedSession.wordCount} {language === 'zh' ? '字' : 'words'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportSession(selectedSession, 'txt')}
                  className="border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  TXT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportSession(selectedSession, 'srt')}
                  className="border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  SRT
                </Button>
                <Button
                  variant={showAISidebar ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAISidebar(!showAISidebar)}
                  className={showAISidebar ? 
                    "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white" :
                    "border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                  }
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {language === 'zh' ? 'AI分析' : 'AI Analysis'}
                  {accountType === 'pro' || accountType === 'enterprise' ? (
                    <Sparkles className="h-3 w-3 ml-1 text-yellow-300" />
                  ) : (
                    <Lock className="h-3 w-3 ml-1" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSession(selectedSession.id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === 'zh' ? '删除' : 'Delete'}
                </Button>
              </div>
            </div>

            {/* Session Info */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="h-12 w-12 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                      {React.createElement(getSessionTypeInfo(selectedSession.type).icon, { className: "h-5 w-5 text-indigo-600 dark:text-indigo-400" })}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '类型' : 'Type'}</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{getSessionTypeInfo(selectedSession.type).label}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="h-12 w-12 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '时长' : 'Duration'}</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{selectedSession.duration}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="h-12 w-12 bg-gradient-to-r from-indigo-100 to-slate-100 dark:from-indigo-900 dark:to-slate-900 rounded-full flex items-center justify-center mx-auto mb-2">
                      {selectedSession.engine === 'web-speech' ? (
                        <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '引擎' : 'Engine'}</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedSession.engine === 'web-speech' ? 'Web Speech' : 'OpenAI'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="h-12 w-12 bg-gradient-to-r from-slate-100 to-purple-100 dark:from-slate-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Globe className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{language === 'zh' ? '翻译' : 'Translation'}</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedSession.translationEnabled ? (language === 'zh' ? '已启用' : 'Enabled') : (language === 'zh' ? '未启用' : 'Disabled')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transcripts */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <span>{t('notes.fullTranscript')}</span>
                  <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    {selectedSession.transcripts.length} {language === 'zh' ? '段' : 'segments'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh] w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50 p-6">
                  {selectedSession.transcripts.length === 0 ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-20">
                      <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{language === 'zh' ? '暂无转录内容' : 'No transcription content'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedSession.transcripts.map((transcript, index) => (
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
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            </div>
          </div>
          
          {/* AI Analysis Sidebar */}
          {showAISidebar && (
            <div className="w-96 h-full">
              <AIAnalysisSidebar
                noteId={selectedSession.id}
                transcripts={selectedSession.transcripts}
                title={selectedSession.title}
                accountType={accountType}
                isVisible={showAISidebar}
                onToggle={() => setShowAISidebar(!showAISidebar)}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

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
                  {accountType === 'free' ? remainingMinutes : '∞'}
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
                  <span>{Math.round((remainingMinutes / ACCOUNT_LIMITS.free) * 100)}% {language === 'zh' ? '剩余' : 'remaining'}</span>
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
                <p className="font-medium text-amber-800 dark:text-amber-200">{t('notes.loginToViewNotes')}</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{t('notes.loginToViewNotesDesc')}</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowLoginPrompt(true)}
                className="ml-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                {t('auth.loginToUse')}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t('notes.title')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                {t('notes.subtitle')}
              </p>
            </div>
            
            {/* Quick Stats */}
            {sessions.length > 0 && (
              <div className="flex justify-center">
                <div className="inline-flex items-center space-x-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-700/50 rounded-xl px-6 py-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{sessions.length}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{language === 'zh' ? '总笔记' : 'Total Notes'}</div>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60)}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{language === 'zh' ? '总时长(分钟)' : 'Total Minutes'}</div>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-600 dark:text-slate-400">
                      {sessions.reduce((acc, s) => acc + (s.wordCount || 0), 0)}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{language === 'zh' ? '总字数' : 'Total Words'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search and Filter Controls */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder={t('notes.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>
                </div>
                
                {/* Type Filter */}
                <div className="w-48">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            {React.createElement(type.icon, { className: "h-4 w-4" })}
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sort */}
                <div className="w-40">
                  <Select value={sortOrder} onValueChange={(value: 'latest' | 'oldest' | 'duration') => setSortOrder(value)}>
                    <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            {React.createElement(option.icon, { className: "h-4 w-4" })}
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">{language === 'zh' ? '加载中...' : 'Loading...'}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50">
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <div className="h-20 w-20 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">{t('notes.noNotes')}</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">{t('notes.noNotesDesc')}</p>
                  </div>
                  <Button
                    onClick={() => window.location.href = '/main'}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('notes.createFirstNote')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSessions.map((session) => {
                const typeInfo = getSessionTypeInfo(session.type);
                return (
                  <Card key={session.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-700/50 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-200 cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                            {React.createElement(typeInfo.icon, { className: "h-5 w-5 text-indigo-600 dark:text-indigo-400" })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              {session.title}
                            </CardTitle>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{typeInfo.label}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {session.engine === 'web-speech' ? 'Web Speech' : 'OpenAI'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Session Stats */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{session.duration}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">{language === 'zh' ? '录音时长' : 'Duration'}</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{session.transcripts.length}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">{language === 'zh' ? '转录段数' : 'Segments'}</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-slate-600 dark:text-slate-400">{session.wordCount}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">{language === 'zh' ? '字数' : 'Words'}</div>
                          </div>
                        </div>
                        
                        {/* Session Info */}
                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3" />
                            <span>{session.date}</span>
                          </div>
                          {session.translationEnabled && (
                            <div className="flex items-center space-x-1">
                              <Languages className="h-3 w-3" />
                              <span className="text-xs">{language === 'zh' ? '翻译' : 'Translation'}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-slate-600/50">
                          {/* AI Analysis Button - Full Width */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <AIAnalysisButton
                              noteId={session.id}
                              transcripts={session.transcripts}
                              title={session.title}
                              accountType={accountType}
                              className="w-full"
                            />
                          </div>
                          
                          {/* Other Action Buttons */}
                          <div className="flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSession(session);
                                setShowDetails(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/30"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {t('notes.viewDetails')}
                            </Button>
                            
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportSession(session, 'txt');
                                }}
                                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(session.id);
                                }}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Login Prompt */}
      <LoginPrompt
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        feature={language === 'zh' ? '笔记管理' : 'Notes Management'}
        description={t('notes.loginToViewNotesDesc')}
      />
    </div>
  );
}