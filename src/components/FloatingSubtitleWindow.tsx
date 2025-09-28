import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Mic, 
  Play, 
  Pause, 
  Square,
  Settings,
  X,
  Volume2,
  Type,
  Palette,
  Eye,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { LanguageContext } from '../App';

interface FloatingWindowProps {
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

export function FloatingSubtitleWindow({
  isVisible,
  onClose,
  isRecording,
  isPaused,
  realtimeTranscripts,
  translationEnabled,
  onPause,
  onResume,
  onStop
}: FloatingWindowProps) {
  const { language } = useContext(LanguageContext);
  
  // Window reference
  const windowRef = useRef<Window | null>(null);
  
  // Settings states
  const [fontSize, setFontSize] = useState(18);
  const [opacity, setOpacity] = useState(95);
  const [backgroundColor, setBackgroundColor] = useState('dark');
  const [textColor, setTextColor] = useState('white');
  const [maxLines, setMaxLines] = useState(3);
  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('floating-window-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFontSize(settings.fontSize || 18);
      setOpacity(settings.opacity || 95);
      setBackgroundColor(settings.backgroundColor || 'dark');
      setTextColor(settings.textColor || 'white');
      setMaxLines(settings.maxLines || 3);
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
    localStorage.setItem('floating-window-settings', JSON.stringify(settings));
  }, [fontSize, opacity, backgroundColor, textColor, maxLines]);
  
  // Create floating window
  const createFloatingWindow = () => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.focus();
      return;
    }
    
    const windowFeatures = [
      'width=400',
      'height=300',
      'left=100',
      'top=100',
      'resizable=yes',
      'scrollbars=no',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'status=no',
      'alwaysRaised=yes',
      'dependent=yes'
    ].join(',');
    
    const newWindow = window.open('', 'FloatingSubtitles', windowFeatures);
    
    if (!newWindow) {
      alert(language === 'zh' 
        ? '无法打开悬浮窗口，请检查浏览器的弹窗拦截设置' 
        : 'Unable to open floating window, please check browser popup settings'
      );
      return;
    }
    
    windowRef.current = newWindow;
    
    // Create the window content
    const windowContent = createWindowHTML();
    newWindow.document.write(windowContent);
    newWindow.document.close();
    
    // Set up window event listeners
    newWindow.addEventListener('beforeunload', () => {
      windowRef.current = null;
      onClose();
    });
    
    // Update window content when data changes
    updateWindowContent();
  };
  
  // Create HTML content for the floating window
  const createWindowHTML = () => {
    const getBackgroundColor = () => {
      switch (backgroundColor) {
        case 'dark': return '#000000';
        case 'light': return '#ffffff';
        case 'blue': return '#1e3a8a';
        case 'green': return '#14532d';
        default: return '#000000';
      }
    };
    
    const getTextColor = () => {
      switch (textColor) {
        case 'white': return '#ffffff';
        case 'black': return '#000000';
        case 'yellow': return '#fde047';
        case 'green': return '#86efac';
        default: return '#ffffff';
      }
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ez Meeting - ${language === 'zh' ? '实时字幕' : 'Live Subtitles'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: ${getBackgroundColor()};
            color: ${getTextColor()};
            opacity: ${opacity / 100};
            overflow: hidden;
            height: 100vh;
            padding: 8px;
          }
          
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
            margin-bottom: 8px;
            font-size: 11px;
            user-select: none;
          }
          
          .status {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: ${isPaused ? '#eab308' : isRecording ? '#ef4444' : '#6b7280'};
            animation: ${!isPaused && isRecording ? 'pulse 2s infinite' : 'none'};
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .controls {
            display: flex;
            gap: 2px;
          }
          
          .control-btn {
            background: none;
            border: none;
            color: ${getTextColor()};
            padding: 2px 4px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 10px;
            opacity: 0.7;
            transition: opacity 0.2s;
          }
          
          .control-btn:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.1);
          }
          
          .content {
            height: calc(100vh - 40px);
            overflow-y: auto;
            padding: 4px;
          }
          
          .subtitle-item {
            margin-bottom: 8px;
            padding: 6px 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            font-size: ${fontSize}px;
            line-height: 1.4;
          }
          
          .subtitle-original {
            margin-bottom: 4px;
            opacity: 0.8;
          }
          
          .subtitle-translation {
            font-weight: 500;
          }
          
          .listening {
            text-align: center;
            padding: 20px;
            opacity: 0.6;
            font-size: 12px;
          }
          
          .mic-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .settings-panel {
            position: absolute;
            top: 30px;
            right: 8px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 6px;
            padding: 12px;
            min-width: 200px;
            font-size: 11px;
            z-index: 1000;
          }
          
          .setting-item {
            margin-bottom: 8px;
          }
          
          .setting-label {
            display: block;
            margin-bottom: 2px;
            font-weight: 500;
          }
          
          .setting-slider {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            outline: none;
            -webkit-appearance: none;
          }
          
          .setting-slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: ${getTextColor()};
            border-radius: 50%;
            cursor: pointer;
          }
          
          .setting-select {
            width: 100%;
            padding: 2px 4px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            color: ${getTextColor()};
            font-size: 10px;
          }
          
          .minimized {
            height: 40px !important;
          }
          
          .minimized .content {
            display: none;
          }
        </style>
      </head>
      <body class="${isMinimized ? 'minimized' : ''}">
        <div class="header">
          <div class="status">
            <div class="status-dot"></div>
            <span>${language === 'zh' ? '实时字幕' : 'Live Subtitles'}</span>
            ${isRecording ? (isPaused ? (language === 'zh' ? ' - 已暂停' : ' - Paused') : (language === 'zh' ? ' - 录音中' : ' - Recording')) : (language === 'zh' ? ' - 未录音' : ' - Stopped')}
          </div>
          <div class="controls">
            ${isRecording ? `
              <button class="control-btn" onclick="parent.postMessage({type: '${isPaused ? 'resume' : 'pause'}'}, '*')" title="${isPaused ? (language === 'zh' ? '继续' : 'Resume') : (language === 'zh' ? '暂停' : 'Pause')}">
                ${isPaused ? '▶️' : '⏸️'}
              </button>
              <button class="control-btn" onclick="parent.postMessage({type: 'stop'}, '*')" title="${language === 'zh' ? '停止' : 'Stop'}">⏹️</button>
            ` : ''}
            <button class="control-btn" onclick="toggleSettings()" title="${language === 'zh' ? '设置' : 'Settings'}">⚙️</button>
            <button class="control-btn" onclick="toggleMinimize()" title="${language === 'zh' ? '最小化' : 'Minimize'}">${isMinimized ? '🔼' : '🔽'}</button>
            <button class="control-btn" onclick="parent.postMessage({type: 'close'}, '*')" title="${language === 'zh' ? '关闭' : 'Close'}">❌</button>
          </div>
        </div>
        
        <div class="settings-panel" id="settingsPanel" style="display: none;">
          <div class="setting-item">
            <label class="setting-label">${language === 'zh' ? '字体大小' : 'Font Size'}: <span id="fontSizeValue">${fontSize}</span>px</label>
            <input type="range" class="setting-slider" min="12" max="32" value="${fontSize}" oninput="updateFontSize(this.value)">
          </div>
          <div class="setting-item">
            <label class="setting-label">${language === 'zh' ? '透明度' : 'Opacity'}: <span id="opacityValue">${opacity}</span>%</label>
            <input type="range" class="setting-slider" min="30" max="100" value="${opacity}" oninput="updateOpacity(this.value)">
          </div>
          <div class="setting-item">
            <label class="setting-label">${language === 'zh' ? '显示行数' : 'Max Lines'}: <span id="maxLinesValue">${maxLines}</span></label>
            <input type="range" class="setting-slider" min="1" max="10" value="${maxLines}" oninput="updateMaxLines(this.value)">
          </div>
        </div>
        
        <div class="content" id="content">
          ${isRecording ? `
            <div class="listening">
              <div class="mic-icon">🎙️</div>
              ${isPaused ? 
                (language === 'zh' ? '录音已暂停' : 'Recording paused') : 
                (language === 'zh' ? '正在监听音频...' : 'Listening to audio...')
              }
            </div>
          ` : `
            <div class="listening">
              <div class="mic-icon">🎤</div>
              ${language === 'zh' ? '录音未启动' : 'Recording not started'}
            </div>
          `}
        </div>
        
        <script>
          let settingsVisible = false;
          let isMinimizedState = ${isMinimized};
          
          function toggleSettings() {
            const panel = document.getElementById('settingsPanel');
            settingsVisible = !settingsVisible;
            panel.style.display = settingsVisible ? 'block' : 'none';
          }
          
          function toggleMinimize() {
            isMinimizedState = !isMinimizedState;
            document.body.classList.toggle('minimized', isMinimizedState);
            parent.postMessage({type: 'minimize', minimized: isMinimizedState}, '*');
          }
          
          function updateFontSize(value) {
            document.getElementById('fontSizeValue').textContent = value;
            const items = document.querySelectorAll('.subtitle-item');
            items.forEach(item => item.style.fontSize = value + 'px');
            parent.postMessage({type: 'updateSetting', setting: 'fontSize', value: parseInt(value)}, '*');
          }
          
          function updateOpacity(value) {
            document.getElementById('opacityValue').textContent = value;
            document.body.style.opacity = value / 100;
            parent.postMessage({type: 'updateSetting', setting: 'opacity', value: parseInt(value)}, '*');
          }
          
          function updateMaxLines(value) {
            document.getElementById('maxLinesValue').textContent = value;
            parent.postMessage({type: 'updateSetting', setting: 'maxLines', value: parseInt(value)}, '*');
          }
          
          // Keep window on top (doesn't work in all browsers)
          window.focus();
          setInterval(() => {
            if (!document.hidden) {
              window.focus();
            }
          }, 5000);
        </script>
      </body>
      </html>
    `;
  };
  
  // Update window content with latest transcripts
  const updateWindowContent = () => {
    if (!windowRef.current || windowRef.current.closed) return;
    
    const latestTranscripts = realtimeTranscripts.slice(-maxLines);
    const contentDiv = windowRef.current.document.getElementById('content');
    
    if (!contentDiv) return;
    
    if (latestTranscripts.length === 0) {
      contentDiv.innerHTML = `
        <div class="listening">
          <div class="mic-icon">🎙️</div>
          ${isRecording ? 
            (isPaused ? 
              (language === 'zh' ? '录音已暂停' : 'Recording paused') : 
              (language === 'zh' ? '正在监听音频...' : 'Listening to audio...')
            ) : 
            (language === 'zh' ? '录音未启动' : 'Recording not started')
          }
        </div>
      `;
    } else {
      const subtitlesHTML = latestTranscripts.map(transcript => `
        <div class="subtitle-item">
          ${transcript.original ? `<div class="subtitle-original">${transcript.original}</div>` : ''}
          ${translationEnabled && transcript.translation !== transcript.original ? 
            `<div class="subtitle-translation">${transcript.translation}</div>` : 
            (transcript.original ? '' : `<div class="subtitle-translation">${transcript.translation}</div>`)
          }
        </div>
      `).join('');
      
      contentDiv.innerHTML = subtitlesHTML;
      contentDiv.scrollTop = contentDiv.scrollHeight;
    }
  };
  
  // Handle messages from floating window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!windowRef.current || event.source !== windowRef.current) return;
      
      const { type, setting, value, minimized } = event.data;
      
      switch (type) {
        case 'pause':
          onPause();
          break;
        case 'resume':
          onResume();
          break;
        case 'stop':
          onStop();
          break;
        case 'close':
          onClose();
          break;
        case 'minimize':
          setIsMinimized(minimized);
          break;
        case 'updateSetting':
          switch (setting) {
            case 'fontSize':
              setFontSize(value);
              break;
            case 'opacity':
              setOpacity(value);
              break;
            case 'maxLines':
              setMaxLines(value);
              break;
          }
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPause, onResume, onStop, onClose]);
  
  // Create window when visible changes to true
  useEffect(() => {
    if (isVisible) {
      createFloatingWindow();
    } else if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
      windowRef.current = null;
    }
  }, [isVisible]);
  
  // Update window content when data changes
  useEffect(() => {
    updateWindowContent();
  }, [realtimeTranscripts, isRecording, isPaused, translationEnabled, maxLines]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }
    };
  }, []);
  
  return null; // This component doesn't render anything in the main window
}