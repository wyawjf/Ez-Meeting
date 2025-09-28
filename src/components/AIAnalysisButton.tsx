import React, { useState, useContext } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Brain, 
  Sparkles, 
  Crown, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  FileText,
  Target,
  Lightbulb,
  Star,
  Zap,
  Lock,
  ArrowRight,
  Copy,
  Download,
  RefreshCw,
  Languages,
  Globe
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

// Types
interface AIAnalysisButtonProps {
  noteId: string;
  transcripts: any[];
  title: string;
  accountType: 'free' | 'pro' | 'enterprise';
  className?: string;
}

interface AIAnalysis {
  content: string;
  generatedAt: string;
  model: string;
  wordCount: number;
  originalContent?: string;
  isTranslated?: boolean;
  translatedLanguage?: string;
}

export function AIAnalysisButton({ noteId, transcripts, title, accountType, className }: AIAnalysisButtonProps) {
  const { t, language } = useContext(LanguageContext);
  const { user } = useAuth();
  
  // States
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('zh');
  const [showTranslateOptions, setShowTranslateOptions] = useState(false);

  // Check if user has access
  const hasAccess = accountType === 'pro' || accountType === 'enterprise';

  // Language options for translation
  const languageOptions = [
    { value: 'zh', label: '中文 (Chinese)' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'de', label: 'Deutsch (German)' },
    { value: 'ja', label: '日本語 (Japanese)' },
    { value: 'ko', label: '한국어 (Korean)' },
    { value: 'pt', label: 'Português (Portuguese)' },
    { value: 'it', label: 'Italiano (Italian)' },
    { value: 'ru', label: 'Русский (Russian)' },
    { value: 'ar', label: 'العربية (Arabic)' },
    { value: 'hi', label: 'हिन्दी (Hindi)' },
    { value: 'th', label: 'ไทย (Thai)' },
    { value: 'vi', label: 'Tiếng Việt (Vietnamese)' },
    { value: 'tr', label: 'Türkçe (Turkish)' }
  ];

  // Handle AI analysis
  const handleAnalyze = async () => {
    if (!hasAccess) {
      toast.error(
        language === 'zh' 
          ? 'AI分析功能需要Pro或企业版账户' 
          : 'AI analysis requires Pro or Enterprise account'
      );
      return;
    }

    if (!user) {
      toast.error(
        language === 'zh' 
          ? '请先登录以使用AI分析功能' 
          : 'Please login to use AI analysis'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check for cached analysis first
      const cachedResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-851310fa/ai/analysis/${noteId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (cachedResponse.ok) {
        const cachedData = await cachedResponse.json();
        if (cachedData.success && cachedData.analysis) {
          setAnalysis({
            ...cachedData.analysis,
            originalContent: cachedData.analysis.content,
            isTranslated: false
          });
          setShowDialog(true);
          setLoading(false);
          return;
        }
      }

      // Generate new analysis
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-851310fa/ai/analyze-notes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            noteId,
            transcripts,
            accountType
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setAnalysis({
          ...data.analysis,
          originalContent: data.analysis.content,
          isTranslated: false
        });
        setShowDialog(true);
        toast.success(
          language === 'zh' 
            ? data.cached ? 'AI分析已加载' : 'AI分析完成！'
            : data.cached ? 'AI analysis loaded' : 'AI analysis completed!'
        );
      } else if (data.requiresUpgrade) {
        setError(
          language === 'zh' 
            ? 'AI分析功能需要Pro或企业版账户。请升级您的账户以使用此功能。'
            : 'AI analysis requires Pro or Enterprise account. Please upgrade your account to use this feature.'
        );
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setError(
        language === 'zh' 
          ? 'AI分析失败，请稍后重试。'
          : 'AI analysis failed. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Copy analysis to clipboard
  const copyAnalysis = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis.content);
      toast.success(
        language === 'zh' ? 'AI分析已复制到剪贴板' : 'AI analysis copied to clipboard'
      );
    }
  };

  // Export analysis
  const exportAnalysis = () => {
    if (analysis) {
      const content = `${title}\n${language === 'zh' ? 'AI智能分析' : 'AI Analysis'}\n\n${analysis.content}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}_AI_Analysis.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(
        language === 'zh' ? 'AI分析已导出' : 'AI analysis exported'
      );
    }
  };

  // Handle translation
  const handleTranslate = async () => {
    if (!analysis || !hasAccess || !user) return;

    setTranslating(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-851310fa/ai/translate-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            noteId,
            originalContent: analysis.originalContent || analysis.content,
            targetLanguage: selectedLanguage,
            accountType
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setAnalysis({
          ...analysis,
          content: data.translatedContent,
          isTranslated: true,
          translatedLanguage: selectedLanguage
        });
        setShowTranslateOptions(false);
        toast.success(
          language === 'zh' 
            ? '翻译完成！'
            : 'Translation completed!'
        );
      } else {
        throw new Error(data.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setError(
        language === 'zh' 
          ? '翻译失败，请稍后重试。'
          : 'Translation failed. Please try again later.'
      );
    } finally {
      setTranslating(false);
    }
  };

  // Reset to original content
  const resetToOriginal = () => {
    if (analysis && analysis.originalContent) {
      setAnalysis({
        ...analysis,
        content: analysis.originalContent,
        isTranslated: false,
        translatedLanguage: undefined
      });
      setShowTranslateOptions(false);
    }
  };

  // Format analysis content for display
  const formatAnalysisContent = (content: string) => {
    const sections = content.split('\n\n').filter(section => section.trim());
    
    return sections.map((section, index) => {
      const lines = section.split('\n');
      const title = lines[0];
      const content = lines.slice(1);
      
      // Check if it's a section header
      if (title.match(/^\d+\.|^##|^###|^[A-Z][^:]*:$/)) {
        return (
          <div key={index} className="space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center">
              {getSectionIcon(title)}
              {title.replace(/^\d+\.\s*/, '').replace(/^#+\s*/, '')}
            </h4>
            <div className="space-y-2 pl-6">
              {content.map((line, lineIndex) => (
                <p key={lineIndex} className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {line.trim()}
                </p>
              ))}
            </div>
          </div>
        );
      } else {
        return (
          <p key={index} className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {section}
          </p>
        );
      }
    });
  };

  // Get appropriate icon for section
  const getSectionIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('topic') || lowerTitle.includes('主题') || lowerTitle.includes('议题')) {
      return <FileText className="h-4 w-4 mr-2 text-blue-500" />;
    }
    if (lowerTitle.includes('decision') || lowerTitle.includes('conclusion') || lowerTitle.includes('决定') || lowerTitle.includes('结论')) {
      return <CheckCircle className="h-4 w-4 mr-2 text-green-500" />;
    }
    if (lowerTitle.includes('action') || lowerTitle.includes('行动') || lowerTitle.includes('待办')) {
      return <Target className="h-4 w-4 mr-2 text-orange-500" />;
    }
    if (lowerTitle.includes('summary') || lowerTitle.includes('总结') || lowerTitle.includes('摘要')) {
      return <Lightbulb className="h-4 w-4 mr-2 text-purple-500" />;
    }
    
    return <ArrowRight className="h-4 w-4 mr-2 text-slate-500" />;
  };

  return (
    <>
      <Button
        variant={hasAccess ? "default" : "outline"}
        size="sm"
        onClick={handleAnalyze}
        disabled={loading || transcripts.length === 0}
        className={`${className} ${
          hasAccess 
            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {language === 'zh' ? '分析中...' : 'Analyzing...'}
          </>
        ) : (
          <>
            <Brain className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              {language === 'zh' ? 'AI智能分析' : 'AI Analysis'}
            </span>
            <span className="sm:hidden">AI</span>
            {hasAccess && (
              <Sparkles className="h-3 w-3 ml-1 text-yellow-300" />
            )}
          </>
        )}
        
        {!hasAccess && (
          <Lock className="h-3 w-3 ml-1" />
        )}
      </Button>

      {/* AI Analysis Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span>{language === 'zh' ? 'AI智能分析' : 'AI Analysis'}</span>
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                {hasAccess ? 'Pro' : 'Premium'}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {title}
              {analysis && (
                <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(analysis.generatedAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                  </span>
                  <span className="flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    {analysis.wordCount} {language === 'zh' ? '词' : 'words'}
                  </span>
                  <span className="flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    Mistral 7B
                  </span>
                  {analysis.isTranslated && (
                    <span className="flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      {languageOptions.find(opt => opt.value === analysis.translatedLanguage)?.label}
                    </span>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {error}
                  {!hasAccess && (
                    <div className="mt-3">
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                        onClick={() => window.location.href = '/pricing'}
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '升级账户' : 'Upgrade Account'}
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Translation Options */}
            {analysis && showTranslateOptions && (
              <Card className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Languages className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                      <label className="text-sm font-medium text-green-700 dark:text-green-300">
                        {language === 'zh' ? '选择翻译语言' : 'Select Translation Language'}
                      </label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger className="w-48 border-green-200 dark:border-green-700 bg-white/80 dark:bg-slate-800/80">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languageOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTranslate}
                          disabled={translating}
                          className="border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
                        >
                          {translating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Globe className="h-4 w-4 mr-2" />
                              {language === 'zh' ? '翻译' : 'Translate'}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTranslateOptions(false)}
                          className="hover:bg-green-50 dark:hover:bg-green-900/30"
                        >
                          {language === 'zh' ? '取消' : 'Cancel'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis && (
              <Card className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200/50 dark:border-purple-700/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Star className="h-5 w-5 mr-2 text-purple-500" />
                      {language === 'zh' ? '分析结果' : 'Analysis Results'}
                      {analysis.isTranslated && (
                        <Badge className="ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <Globe className="h-3 w-3 mr-1" />
                          {language === 'zh' ? '已翻译' : 'Translated'}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyAnalysis}
                        className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '复制' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportAnalysis}
                        className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '导出' : 'Export'}
                      </Button>
                      {!showTranslateOptions && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTranslateOptions(true)}
                          className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                        >
                          <Languages className="h-4 w-4 mr-2" />
                          {language === 'zh' ? '翻译' : 'Translate'}
                        </Button>
                      )}
                      {analysis.isTranslated && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetToOriginal}
                          className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {language === 'zh' ? '原文' : 'Original'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAnalysis(null);
                          handleAnalyze();
                        }}
                        className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {language === 'zh' ? '重新分析' : 'Re-analyze'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[50vh] w-full rounded-lg border border-purple-200/50 dark:border-purple-700/50 bg-white/60 dark:bg-slate-900/60 p-6">
                    <div className="space-y-6">
                      {formatAnalysisContent(analysis.content)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {!hasAccess && !error && (
              <Card className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-700/50">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-16 w-16 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-full flex items-center justify-center mx-auto">
                    <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'zh' ? 'AI智能分析' : 'AI Smart Analysis'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {language === 'zh' 
                        ? '使用AI技术分析您的笔记内容，提取关键信息、总结要点并生成行动项。支持多语言翻译。'
                        : 'Use AI technology to analyze your notes, extract key information, summarize main points, and generate action items. Multi-language translation supported.'
                      }
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        {language === 'zh' ? '关键话题提取' : 'Key Topics'}
                      </div>
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        {language === 'zh' ? '决策总结' : 'Decision Summary'}
                      </div>
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        {language === 'zh' ? '行动项识别' : 'Action Items'}
                      </div>
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        {language === 'zh' ? '多语言翻译' : 'Multi-language Translation'}
                      </div>
                    </div>
                    <Separator />
                    <Button 
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                      onClick={() => window.location.href = '/pricing'}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {language === 'zh' ? '升级到Pro版' : 'Upgrade to Pro'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}