// Setup audio level monitoring
export const setupAudioLevelMonitoring = (
  stream: MediaStream,
  isRecording: boolean,
  isPaused: boolean,
  setAudioLevel: (level: number) => void,
  addDebugMessage: (message: string) => void
): { audioContext: AudioContext | null; analyser: AnalyserNode | null } => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    microphone.connect(analyser);
    
    const updateAudioLevel = () => {
      if (analyser && (isRecording && !isPaused)) {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(Math.round((average / 255) * 100));
        requestAnimationFrame(updateAudioLevel);
      } else if (isPaused) {
        setAudioLevel(0);
      }
    };
    
    updateAudioLevel();
    addDebugMessage('Audio level monitoring setup successfully');
    
    return { audioContext, analyser };
  } catch (error) {
    console.error('Error setting up audio level monitoring:', error);
    addDebugMessage(`Audio monitoring error: ${error}`);
    return { audioContext: null, analyser: null };
  }
};

// Check browser compatibility and environment
export const checkBrowserCompatibility = (
  language: 'zh' | 'en',
  addDebugMessage: (message: string) => void,
  setBrowserInfo: (info: string) => void,
  setMicrophoneSupported: (supported: boolean) => void,
  setConnectionStatus: (status: 'disconnected' | 'connected' | 'error' | 'requesting') => void,
  checkWebSpeechSupport: () => boolean
): boolean => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  }
  
  setBrowserInfo(browser);
  addDebugMessage(`Browser detected: ${browser}`);
  
  // Check if running on HTTPS or localhost
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  
  // Check if MediaDevices API is supported
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  
  // Check Web Speech API support
  const webSpeechSupport = checkWebSpeechSupport();
  
  if (!hasMediaDevices) {
    setMicrophoneSupported(false);
    setConnectionStatus('error');
    addDebugMessage('MediaDevices API not supported');
    return false;
  }
  
  if (!isSecure) {
    console.warn('Microphone access requires HTTPS or localhost');
    setMicrophoneSupported(false);
    setConnectionStatus('error');
    addDebugMessage('HTTPS required for microphone access');
    return false;
  }
  
  addDebugMessage(`Environment check passed - HTTPS: ${isSecure}, MediaDevices: ${hasMediaDevices}, WebSpeech: ${webSpeechSupport}`);
  return hasMediaDevices && isSecure;
};

// Request microphone permission
export const connectMicrophone = async (
  microphoneSupported: boolean,
  language: 'zh' | 'en',
  addDebugMessage: (message: string) => void,
  setIsRequestingPermission: (requesting: boolean) => void,
  setConnectionStatus: (status: 'disconnected' | 'connected' | 'error' | 'requesting') => void,
  setPermissionState: (state: 'unknown' | 'granted' | 'denied' | 'prompt') => void,
  setShowPermissionHelp: (show: boolean) => void,
  setShowDetailedHelp: (show: boolean) => void,
  streamRef: React.MutableRefObject<MediaStream | null>,
  setupAudioLevelMonitoring: (stream: MediaStream) => void
): Promise<MediaStream | null> => {
  if (!microphoneSupported) {
    setShowDetailedHelp(true);
    return null;
  }

  try {
    setIsRequestingPermission(true);
    setConnectionStatus('requesting');
    addDebugMessage('Requesting microphone permission...');
    
    // Clear any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      addDebugMessage('Cleared existing stream');
    }
    
    // Request access to microphone
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: { ideal: 16000 },
        channelCount: { ideal: 1 }
      } 
    });
    
    // Store the stream reference
    streamRef.current = stream;
    setPermissionState('granted');
    setConnectionStatus('connected');
    setShowPermissionHelp(false);
    setShowDetailedHelp(false);
    
    // Setup audio level monitoring
    setupAudioLevelMonitoring(stream);
    
    addDebugMessage('Microphone access granted successfully');
    
    return stream;
  } catch (error: any) {
    console.error('Error requesting microphone permission:', error);
    addDebugMessage(`Permission error: ${error.name} - ${error.message}`);
    
    setPermissionState('denied');
    setConnectionStatus('error');
    setShowPermissionHelp(true);
    
    return null;
  } finally {
    setIsRequestingPermission(false);
  }
};

// Format recording duration
export const formatRecordingDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};