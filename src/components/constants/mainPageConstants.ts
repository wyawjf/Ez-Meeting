export interface RealtimeTranscript {
  timestamp: string;
  original: string;
  translation: string;
  chunkIndex: number;
  confidence?: number;
  source: 'web-speech' | 'openai';
}

// Web Speech API语言映射
export const webSpeechLanguages = {
  'zh': 'zh-CN',
  'en': 'en-US',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'es': 'es-ES',
  'pt': 'pt-BR',
};

// 翻译服务映射
export const translationLanguages = {
  'zh': 'zh',
  'en': 'en',
  'ja': 'ja', 
  'ko': 'ko',
  'fr': 'fr',
  'de': 'de',
  'es': 'es',
  'pt': 'pt',
};

export const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
];

export const getRecordingTypes = (language: 'zh' | 'en') => [
  { value: 'meeting', label: language === 'zh' ? '会议' : 'Meeting' },
  { value: 'course', label: language === 'zh' ? '课程' : 'Course' },
  { value: 'interview', label: language === 'zh' ? '面试' : 'Interview' },
  { value: 'lecture', label: language === 'zh' ? '讲座' : 'Lecture' },
];

export const getTranscriptionEngines = (language: 'zh' | 'en') => [
  { 
    value: 'web-speech', 
    label: language === 'zh' ? '免费语音识别' : 'Free Speech Recognition',
    description: language === 'zh' ? '使用浏览器内置语音识别，完全免费' : 'Browser built-in speech recognition, completely free',
    icon: 'Zap',
    badge: language === 'zh' ? '免费' : 'Free'
  },
  { 
    value: 'openai', 
    label: language === 'zh' ? 'AI 高精度识别' : 'AI High-Accuracy Recognition',
    description: language === 'zh' ? '使用OpenAI Whisper，准确度更高但需要API密钥' : 'Uses OpenAI Whisper, higher accuracy but requires API key',
    icon: 'Brain',
    badge: language === 'zh' ? '高精度' : 'High Accuracy'
  },
];

export const getTranslationServices = (language: 'zh' | 'en') => [
  {
    value: 'mymemory',
    name: 'MyMemory',
    description: language === 'zh' ? '完全免费，无需注册，每日10000字符' : 'Completely free, no registration, 10k chars/day',
    icon: 'Zap',
    badge: language === 'zh' ? '推荐' : 'Recommended'
  },
  {
    value: 'libretranslate',
    name: 'LibreTranslate',
    description: language === 'zh' ? '开源免费，可能需要等待' : 'Open source free, may have delays',
    icon: 'Globe',
    badge: language === 'zh' ? '开源' : 'Open Source'
  },
  {
    value: 'google-free',
    name: 'Google Translate (Free)',
    description: language === 'zh' ? '谷歌翻译免费版，有限制' : 'Google Translate free version, limited',
    icon: 'Brain',
    badge: language === 'zh' ? '高质量' : 'High Quality'
  }
];

export const getFloatingModes = (language: 'zh' | 'en') => [
  {
    value: 'none',
    name: language === 'zh' ? '无悬浮显示' : 'No Floating Display',
    description: language === 'zh' ? '仅在当前页面显示字幕' : 'Display subtitles only on current page',
    icon: 'Monitor',
    badge: language === 'zh' ? '默认' : 'Default'
  },
  {
    value: 'widget',
    name: language === 'zh' ? '页面悬浮窗' : 'Page Floating Widget',
    description: language === 'zh' ? '在当前页面创建可拖拽的悬浮窗口' : 'Create draggable floating widget on current page',
    icon: 'PictureInPicture',
    badge: language === 'zh' ? '推荐' : 'Recommended'
  },
  {
    value: 'window',
    name: language === 'zh' ? '独立浏览器窗口' : 'Separate Browser Window',
    description: language === 'zh' ? '打开新的浏览器窗口显示字幕（跨标签页可用）' : 'Open new browser window for subtitles (works across tabs)',
    icon: 'ExternalLink',
    badge: language === 'zh' ? '跨页面' : 'Cross-Page'
  },
  {
    value: 'pip',
    name: language === 'zh' ? 'Picture-in-Picture' : 'Picture-in-Picture',
    description: language === 'zh' ? '使用画中画功能显示字幕（实验性）' : 'Use Picture-in-Picture for subtitles (experimental)',
    icon: 'Tv',
    badge: language === 'zh' ? '实验性' : 'Experimental'
  }
];