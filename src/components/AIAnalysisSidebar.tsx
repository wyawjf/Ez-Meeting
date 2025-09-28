import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
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
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { LanguageContext } from '../App';
import { useAuth } from './contexts/AuthContext';
import { publicAnonKey } from '../utils/supabase/info';
import { apiRoutes } from '../utils/api/endpoints';
import { toast } from 'sonner@2.0.3';

// Types
interface AIAnalysisSidebarProps {
  noteId: string;
  transcripts: any[];
  title: string;
  accountType: 'free' | 'pro' | 'enterprise';
  isVisible: boolean;
  onToggle: () => void;
}

interface AIAnalysis {
  content: string;
  generatedAt: string;
  model: string;
  wordCount: number;
}

export function AIAnalysisSidebar({ 
  noteId, 
  transcripts, 
  title, 
  accountType, 
  isVisible, 
  onToggle 
}: AIAnalysisSidebarProps) {
  const { t, language } = useContext(LanguageContext);
  const { user } = useAuth();
  
  // States
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has access
  const hasAccess = accountType === 'pro' || accountType === 'enterprise';

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
        apiRoutes.ai(`/analysis/${noteId}`),
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
          setAnalysis(cachedData.analysis);
          setLoading(false);
          return;
        }
      }

      // Generate new analysis
      const response = await fetch(
        apiRoutes.ai('/analyze-notes'),
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
        setAnalysis(data.analysis);
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
                <p key={lineIndex} className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                  {line.trim()}
                </p>
              ))}
            </div>
          </div>
        );
      } else {
        return (
          <p key={index} className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
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

  // Auto-load analysis on component mount
  useEffect(() => {
    if (isVisible && hasAccess && !analysis && !loading) {
      handleAnalyze();
    }
  }, [isVisible, hasAccess, noteId]);

  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 border-l border-purple-200/50 dark:border-purple-700/50">
      {/* Header */}
      <div className="p-4 border-b border-purple-200/50 dark:border-purple-700/50 bg-white/60 dark:bg-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                {language === 'zh' ? 'AI智能分析' : 'AI Analysis'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {hasAccess ? 'Pro' : 'Premium'} {language === 'zh' ? '功能' : 'Feature'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {!hasAccess ? (
          // Premium Feature Preview
          <div className="p-4 h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-full flex items-center justify-center">
              <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                {language === 'zh' ? 'AI智能分析' : 'AI Smart Analysis'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {language === 'zh' 
                  ? '使用AI技术分析您的笔记内容，提取关键信息、总结要点并生成行动项。'
                  : 'Use AI technology to analyze your notes, extract key information, summarize main points, and generate action items.'
                }
              </p>
            </div>
            <div className="space-y-3 w-full">
              <div className="space-y-2 text-sm">
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
                  {language === 'zh' ? '智能摘要' : 'Smart Summary'}
                </div>
              </div>
              <Separator />
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                onClick={() => window.location.href = '/pricing'}
              >
                <Crown className="h-4 w-4 mr-2" />
                {language === 'zh' ? '升级到Pro版' : 'Upgrade to Pro'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 h-full flex flex-col space-y-4">
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant={analysis ? "outline" : "default"}
                size="sm"
                onClick={handleAnalyze}
                disabled={loading || transcripts.length === 0}
                className={analysis ? 
                  "border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30" :
                  "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    {language === 'zh' ? '分析中...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Brain className="h-3 w-3 mr-2" />
                    {analysis ? 
                      (language === 'zh' ? '重新分析' : 'Re-analyze') :
                      (language === 'zh' ? '开始分析' : 'Start Analysis')
                    }
                  </>
                )}
              </Button>
              
              {analysis && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAnalysis}
                    className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportAnalysis}
                    className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>

            {/* Analysis Content */}
            <div className="flex-1 min-h-0">
              {error && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {analysis && (
                <Card className="h-full bg-white/60 dark:bg-slate-800/60 border-purple-200/50 dark:border-purple-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center">
                        <Star className="h-4 w-4 mr-2 text-purple-500" />
                        {language === 'zh' ? '分析结果' : 'Analysis Results'}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Mistral
                      </Badge>
                    </div>
                    {analysis && (
                      <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(analysis.generatedAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                        </span>
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {analysis.wordCount} {language === 'zh' ? '词' : 'words'}
                        </span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 h-full">
                    <ScrollArea className="h-full">
                      <div className="space-y-4 pr-4">
                        {formatAnalysisContent(analysis.content)}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {!analysis && !loading && !error && (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="space-y-3">
                    <div className="h-12 w-12 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center mx-auto">
                      <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {language === 'zh' ? '准备开始AI分析' : 'Ready for AI Analysis'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {language === 'zh' 
                          ? '点击"开始分析"按钮来生成智能总结'
                          : 'Click "Start Analysis" to generate smart summary'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}