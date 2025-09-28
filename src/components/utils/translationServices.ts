import { translationLanguages } from '../constants/mainPageConstants';

// MyMemory 翻译API
export const translateWithMyMemory = async (text: string, fromLang: string, toLang: string): Promise<string> => {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    } else {
      throw new Error('Invalid response from MyMemory API');
    }
  } catch (error) {
    console.error('MyMemory translation error:', error);
    throw error;
  }
};

// LibreTranslate API
export const translateWithLibreTranslate = async (text: string, fromLang: string, toLang: string): Promise<string> => {
  try {
    const url = 'https://libretranslate.de/translate';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: fromLang,
        target: toLang,
        format: 'text'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`LibreTranslate API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.translatedText) {
      return data.translatedText;
    } else {
      throw new Error('Invalid response from LibreTranslate API');
    }
  } catch (error) {
    console.error('LibreTranslate translation error:', error);
    throw error;
  }
};

// Google Translate Free (通过代理)
export const translateWithGoogleFree = async (text: string, fromLang: string, toLang: string): Promise<string> => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    } else {
      throw new Error('Invalid response from Google Translate API');
    }
  } catch (error) {
    console.error('Google Translate Free error:', error);
    throw error;
  }
};

// 统一翻译函数
export const translateText = async (
  text: string, 
  from: string, 
  to: string, 
  service: 'mymemory' | 'libretranslate' | 'google-free',
  addDebugMessage: (message: string) => void,
  setIsTranslating: (isTranslating: boolean) => void,
  setTranslationError: (error: string | null) => void
): Promise<string> => {
  if (!text.trim() || from === to) {
    return text;
  }

  setIsTranslating(true);
  setTranslationError(null);
  
  try {
    const fromLang = translationLanguages[from] || from;
    const toLang = translationLanguages[to] || to;
    
    addDebugMessage(`Translating with ${service}: "${text.substring(0, 30)}..."`);
    
    let translatedText = '';
    
    switch (service) {
      case 'mymemory':
        translatedText = await translateWithMyMemory(text, fromLang, toLang);
        break;
      case 'libretranslate':
        translatedText = await translateWithLibreTranslate(text, fromLang, toLang);
        break;
      case 'google-free':
        translatedText = await translateWithGoogleFree(text, fromLang, toLang);
        break;
      default:
        throw new Error(`Unknown translation service: ${service}`);
    }
    
    addDebugMessage(`Translation result: "${translatedText.substring(0, 30)}..."`);
    return translatedText;
    
  } catch (error) {
    console.error('Translation error:', error);
    addDebugMessage(`Translation failed: ${error}`);
    setTranslationError(error instanceof Error ? error.message : 'Translation failed');
    
    // 翻译失败时返回原文
    return text;
  } finally {
    setIsTranslating(false);
  }
};