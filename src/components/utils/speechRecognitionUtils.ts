import { webSpeechLanguages, RealtimeTranscript } from '../constants/mainPageConstants';
import { translateText } from './translationServices';

// Check Web Speech API support
export const checkWebSpeechSupport = (addDebugMessage: (message: string) => void): boolean => {
  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  const supported = !!SpeechRecognition;
  
  if (supported) {
    addDebugMessage('Web Speech API is supported');
  } else {
    addDebugMessage('Web Speech API is not supported in this browser');
  }
  
  return supported;
};

// Initialize Web Speech Recognition
export const initializeWebSpeech = (
  sourceLanguage: string,
  addDebugMessage: (message: string) => void,
  language: 'zh' | 'en',
  isRecording: boolean,
  isPaused: boolean,
  transcriptionEngine: string,
  setIsWebSpeechActive: (active: boolean) => void,
  setWebSpeechError: (error: string | null) => void,
  setPermissionState: (state: 'unknown' | 'granted' | 'denied' | 'prompt') => void,
  setConnectionStatus: (status: 'disconnected' | 'connected' | 'error' | 'requesting') => void,
  processWebSpeechResult: (text: string, confidence: number) => Promise<void>
): SpeechRecognition => {
  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  // Configure recognition
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = webSpeechLanguages[sourceLanguage] || 'en-US';
  
  addDebugMessage(`Initialized Web Speech with language: ${recognition.lang}`);

  // Handle results
  recognition.onresult = async (event: SpeechRecognitionEvent) => {
    // Skip if paused
    if (isPaused) return;
    
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const confidence = event.results[i][0].confidence;

      if (event.results[i].isFinal) {
        finalTranscript += transcript;
        
        // Process final transcript
        if (finalTranscript.trim()) {
          await processWebSpeechResult(finalTranscript.trim(), confidence || 0.9);
        }
      } else {
        interimTranscript += transcript;
      }
    }

    // Show interim results in debug
    if (interimTranscript) {
      addDebugMessage(`Interim: "${interimTranscript.substring(0, 50)}..."`);
    }
  };

  // Handle errors
  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error('Speech recognition error:', event.error);
    addDebugMessage(`Speech recognition error: ${event.error}`);
    setWebSpeechError(event.error);
    
    if (event.error === 'not-allowed') {
      setPermissionState('denied');
      setConnectionStatus('error');
    } else if (event.error === 'no-speech') {
      addDebugMessage('No speech detected, continuing...');
    }
  };

  // Handle start/end events
  recognition.onstart = () => {
    addDebugMessage('Web Speech Recognition started');
    setIsWebSpeechActive(true);
    setWebSpeechError(null);
  };

  recognition.onend = () => {
    addDebugMessage('Web Speech Recognition ended');
    setIsWebSpeechActive(false);
    
    // Restart if still recording and not paused (for continuous recognition)
    if (isRecording && !isPaused && transcriptionEngine === 'web-speech') {
      setTimeout(() => {
        try {
          recognition.start();
          addDebugMessage('Restarting Web Speech Recognition');
        } catch (error) {
          console.error('Error restarting recognition:', error);
          addDebugMessage(`Error restarting recognition: ${error}`);
        }
      }, 100);
    }
  };

  return recognition;
};

// Process Web Speech result
export const createProcessWebSpeechResult = (
  translationEnabled: boolean,
  targetLanguage: string,
  sourceLanguage: string,
  translationService: 'mymemory' | 'libretranslate' | 'google-free',
  chunksProcessed: number,
  setRealtimeTranscripts: React.Dispatch<React.SetStateAction<RealtimeTranscript[]>>,
  setChunksProcessed: React.Dispatch<React.SetStateAction<number>>,
  setTokenUsage: React.Dispatch<React.SetStateAction<number>>,
  maxTokens: number,
  realtimeTranscriptsLength: number,
  addDebugMessage: (message: string) => void,
  language: 'zh' | 'en',
  setIsTranslating: (isTranslating: boolean) => void,
  setTranslationError: (error: string | null) => void
) => {
  return async (originalText: string, confidence: number) => {
    try {
      addDebugMessage(`Processing Web Speech result: "${originalText}"`);
      
      let translatedText = originalText;
      
      // Only translate if translation is enabled and target language is different
      if (translationEnabled && targetLanguage !== sourceLanguage && originalText.trim()) {
        try {
          addDebugMessage(`Starting translation from ${sourceLanguage} to ${targetLanguage}`);
          translatedText = await translateText(
            originalText, 
            sourceLanguage, 
            targetLanguage, 
            translationService,
            addDebugMessage,
            setIsTranslating,
            setTranslationError
          );
          addDebugMessage(`Translation completed: "${translatedText.substring(0, 30)}..."`);
        } catch (error) {
          console.error('Translation error:', error);
          addDebugMessage(`Translation error: ${error}`);
          translatedText = originalText;
        }
      }

      // Create transcript entry
      const newTranscript: RealtimeTranscript = {
        timestamp: new Date().toLocaleTimeString(),
        original: originalText,
        translation: translationEnabled ? translatedText : originalText,
        chunkIndex: chunksProcessed,
        confidence: confidence,
        source: 'web-speech'
      };

      // Add to transcripts
      setRealtimeTranscripts(prev => [...prev, newTranscript]);
      setChunksProcessed(prev => prev + 1);
      
      // Update token usage (simulate for consistency)
      const estimatedTokens = Math.ceil(originalText.length / 4);
      setTokenUsage(prev => Math.min(prev + estimatedTokens, maxTokens));
      
      addDebugMessage(`Added Web Speech transcript with confidence: ${Math.round(confidence * 100)}%`);
      
    } catch (error) {
      console.error('Error processing Web Speech result:', error);
      addDebugMessage(`Error processing result: ${error}`);
    }
  };
};