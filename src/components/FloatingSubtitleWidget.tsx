import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { 
  Mic, 
  MicOff,
  Play, 
  Pause, 
  Square,
  Settings,
  Minimize2,
  Maximize2,
  Move,
  X,
  Volume2,
  Type,
  Palette,
  Eye
} from 'lucide-react';
import { LanguageContext } from '../App';

interface FloatingSubtitleProps {
  isVisible: boolean;
  onClose: () => void;
  // 从主页面传入的状态
  isRecording: boolean;
  isPaused: boolean;
  realtimeTranscripts: Array<{
    timestamp: string;
    original: string;
    translation: string;
    source: string;
  }>;
  translationEnabled: boolean;
  // 控制函数
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function FloatingSubtitleWidget({
  isVisible,
  onClose,
  isRecording,
  isPaused,
  realtimeTranscripts,
  translationEnabled,
  onPause,
  onResume,
  onStop
}: FloatingSubtitleProps) {
  const { language } = useContext(LanguageContext);
  
  // Widget states
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  
  // Settings states
  const [fontSize, setFontSize] = useState(16);
  const [opacity, setOpacity] = useState(90);
  const [backgroundColor, setBackgroundColor] = useState('dark');
  const [textColor, setTextColor] = useState('white');
  const [maxLines, setMaxLines] = useState(3);
  
  // Refs
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('floating-subtitle-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFontSize(settings.fontSize || 16);
      setOpacity(settings.opacity || 90);
      setBackgroundColor(settings.backgroundColor || 'dark');
      setTextColor(settings.textColor || 'white');
      setMaxLines(settings.maxLines || 3);
    }
    
    const savedPosition = localStorage.getItem('floating-subtitle-position');
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      setPosition(pos);
    }
  }, []);
  
  // Save settings
  useEffect(() => {
    const settings = {
      fontSize,
      opacity,
      backgroundColor,
      textColor,
      maxLines
    };
    localStorage.setItem('floating-subtitle-settings', JSON.stringify(settings));
  }, [fontSize, opacity, backgroundColor, textColor, maxLines]);
  
  // Save position
  useEffect(() => {
    localStorage.setItem('floating-subtitle-position', JSON.stringify(position));
  }, [position]);
  
  // Drag functionality
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (dragRef.current && dragRef.current.contains(e.target as Node)) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y
        };
        e.preventDefault();
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 300);
        const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 200);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);
  
  // Get latest transcripts
  const latestTranscripts = realtimeTranscripts.slice(-maxLines);
  
  // Get background color class
  const getBackgroundClass = () => {
    const baseOpacity = opacity / 100;
    switch (backgroundColor) {
      case 'dark':
        return `bg-black`;
      case 'light':
        return `bg-white`;
      case 'blue':
        return `bg-blue-900`;
      case 'green':
        return `bg-green-900`;
      default:
        return `bg-black`;
    }
  };
  
  // Get text color class
  const getTextColorClass = () => {
    switch (textColor) {
      case 'white':
        return 'text-white';
      case 'black':
        return 'text-black';
      case 'yellow':
        return 'text-yellow-300';
      case 'green':
        return 'text-green-300';
      default:
        return 'text-white';
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div
      ref={widgetRef}
      className="fixed z-[9999] select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: opacity / 100
      }}
    >
      <Card className={`${getBackgroundClass()} border-2 border-white/20 shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div
          ref={dragRef}
          className="flex items-center justify-between p-2 bg-black/20 cursor-move"
        >
          <div className="flex items-center space-x-2">
            <Move className="h-4 w-4 text-white/60" />
            <Badge variant="outline" className={`text-xs ${getTextColorClass()} border-white/30`}>
              {language === 'zh' ? '实时字幕' : 'Live Subtitles'}
            </Badge>
            {isRecording && (
              <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Control buttons */}
            {isRecording && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPaused ? onResume : onPause}
                  className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
                >
                  {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStop}
                  className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
                >
                  <Square className="h-3 w-3" />
                </Button>
              </>
            )}
            
            {/* Settings toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
            >
              <Settings className="h-3 w-3" />
            </Button>
            
            {/* Minimize/Maximize */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            
            {/* Close */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Settings Panel */}
        {showSettings && !isMinimized && (
          <div className="p-3 bg-black/30 border-t border-white/20">
            <div className="space-y-3 text-white">
              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Type className="h-3 w-3" />
                  <span className="text-xs">{language === 'zh' ? '字体大小' : 'Font Size'}: {fontSize}px</span>
                </div>
                <Slider
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  max={32}
                  min={12}
                  step={2}
                  className="w-full"
                />
              </div>
              
              {/* Opacity */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Eye className="h-3 w-3" />
                  <span className="text-xs">{language === 'zh' ? '透明度' : 'Opacity'}: {opacity}%</span>
                </div>
                <Slider
                  value={[opacity]}
                  onValueChange={(value) => setOpacity(value[0])}
                  max={100}
                  min={20}
                  step={5}
                  className="w-full"
                />
              </div>
              
              {/* Max Lines */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-3 w-3" />
                  <span className="text-xs">{language === 'zh' ? '显示行数' : 'Max Lines'}: {maxLines}</span>
                </div>
                <Slider
                  value={[maxLines]}
                  onValueChange={(value) => setMaxLines(value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
              
              {/* Background Color */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Palette className="h-3 w-3" />
                    <span className="text-xs">{language === 'zh' ? '背景' : 'Background'}</span>
                  </div>
                  <Select value={backgroundColor} onValueChange={setBackgroundColor}>
                    <SelectTrigger className="h-6 text-xs bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">{language === 'zh' ? '深色' : 'Dark'}</SelectItem>
                      <SelectItem value="light">{language === 'zh' ? '浅色' : 'Light'}</SelectItem>
                      <SelectItem value="blue">{language === 'zh' ? '蓝色' : 'Blue'}</SelectItem>
                      <SelectItem value="green">{language === 'zh' ? '绿色' : 'Green'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Type className="h-3 w-3" />
                    <span className="text-xs">{language === 'zh' ? '文字' : 'Text'}</span>
                  </div>
                  <Select value={textColor} onValueChange={setTextColor}>
                    <SelectTrigger className="h-6 text-xs bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">{language === 'zh' ? '白色' : 'White'}</SelectItem>
                      <SelectItem value="black">{language === 'zh' ? '黑色' : 'Black'}</SelectItem>
                      <SelectItem value="yellow">{language === 'zh' ? '黄色' : 'Yellow'}</SelectItem>
                      <SelectItem value="green">{language === 'zh' ? '绿色' : 'Green'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Subtitle Content */}
        {!isMinimized && (
          <CardContent className="p-3 min-w-[300px] max-w-[500px]">
            {isRecording && latestTranscripts.length > 0 ? (
              <div className="space-y-2">
                {latestTranscripts.map((transcript, index) => (
                  <div key={index} className="space-y-1">
                    <div 
                      className={`${getTextColorClass()} leading-relaxed`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {transcript.original}
                    </div>
                    {translationEnabled && transcript.translation !== transcript.original && (
                      <>
                        <div className="h-px bg-white/20" />
                        <div 
                          className={`${getTextColorClass()} opacity-80 leading-relaxed`}
                          style={{ fontSize: `${Math.max(12, fontSize - 2)}px` }}
                        >
                          {transcript.translation}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {isPaused && (
                  <div className="mt-2 text-center">
                    <Badge variant="outline" className="text-yellow-300 border-yellow-300/30">
                      {language === 'zh' ? '已暂停' : 'Paused'}
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Mic className={`h-8 w-8 mx-auto mb-2 ${getTextColorClass()} opacity-50`} />
                <div className={`text-sm ${getTextColorClass()} opacity-60`}>
                  {isRecording ? 
                    (language === 'zh' ? '等待语音输入...' : 'Waiting for speech...') :
                    (language === 'zh' ? '录音未启动' : 'Recording not started')
                  }
                </div>
              </div>
            )}
          </CardContent>
        )}
        
        {/* Minimized State */}
        {isMinimized && (
          <div className="p-2">
            <div className={`flex items-center space-x-2 ${getTextColorClass()}`}>
              <Mic className="h-4 w-4" />
              <span className="text-xs">
                {isRecording ? 
                  (isPaused ? 
                    (language === 'zh' ? '已暂停' : 'Paused') :
                    (language === 'zh' ? '录音中' : 'Recording')
                  ) :
                  (language === 'zh' ? '未录音' : 'Stopped')
                }
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}