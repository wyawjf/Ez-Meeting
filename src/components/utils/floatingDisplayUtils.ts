// 切换悬浮显示模式
export const toggleFloatingMode = (
  mode: 'none' | 'widget' | 'window' | 'pip',
  language: 'zh' | 'en',
  setShowFloatingWidget: (show: boolean) => void,
  setShowFloatingWindow: (show: boolean) => void,
  setFloatingMode: (mode: 'none' | 'widget' | 'window' | 'pip') => void,
  pipVideoRef: HTMLVideoElement | null,
  setPipVideoRef: (ref: HTMLVideoElement | null) => void,
  toast: any
) => {
  // 关闭当前模式
  setShowFloatingWidget(false);
  setShowFloatingWindow(false);
  if (pipVideoRef) {
    document.exitPictureInPicture();
    setPipVideoRef(null);
  }
  
  // 启用新模式
  setFloatingMode(mode);
  
  switch (mode) {
    case 'widget':
      setShowFloatingWidget(true);
      toast.success(
        language === 'zh' 
          ? '页面悬浮窗已启用，您可以拖拽调整位置' 
          : 'Page floating widget enabled, you can drag to adjust position'
      );
      break;
      
    case 'window':
      setShowFloatingWindow(true);
      toast.success(
        language === 'zh' 
          ? '独立浏览器窗口已打开，可在不同标签页间使用' 
          : 'Separate browser window opened, works across different tabs'
      );
      break;
      
    case 'pip':
      // Picture-in-Picture 实现（实验性）
      if ('pictureInPictureEnabled' in document) {
        toast.info(
          language === 'zh' 
            ? 'Picture-in-Picture 功能正在开发中，暂时使用独立窗口' 
            : 'Picture-in-Picture feature is under development, using separate window for now'
        );
        setFloatingMode('window');
        setShowFloatingWindow(true);
      } else {
        toast.error(
          language === 'zh' 
            ? '您的浏览器不支持Picture-in-Picture功能' 
            : 'Your browser does not support Picture-in-Picture feature'
        );
        setFloatingMode('none');
      }
      break;
      
    case 'none':
    default:
      toast.info(
        language === 'zh' 
          ? '悬浮显示已关闭' 
          : 'Floating display disabled'
      );
      break;
  }
};

// Handle export functionality
export const handleExport = (
  format: 'txt' | 'srt',
  realtimeTranscripts: any[],
  translationEnabled: boolean,
  language: 'zh' | 'en',
  toast: any
) => {
  if (realtimeTranscripts.length === 0) {
    toast.error(
      language === 'zh' ? '没有可导出的内容' : 'No content to export'
    );
    return;
  }

  let content = '';
  const filename = `realtime_transcript_${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'txt') {
    content = realtimeTranscripts.map(t => 
      `[${t.timestamp}] ${t.original}${translationEnabled && t.translation !== t.original ? `\n${t.translation}` : ''}\n`
    ).join('\n');
  } else if (format === 'srt') {
    content = realtimeTranscripts.map((t, index) => 
      `${index + 1}\n${t.timestamp} --> ${t.timestamp}\n${t.original}${translationEnabled && t.translation !== t.original ? `\n${t.translation}` : ''}\n`
    ).join('\n');
  }
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast.success(
    language === 'zh' ? '导出成功' : 'Export successful'
  );
};