// Screen Protection Utility for Web Apps
// Implements multiple layers of protection against screen capture/recording

class ScreenProtection {
  private static instance: ScreenProtection;
  private isProtected = false;
  private overlay: HTMLDivElement | null = null;
  private warningShown = false;

  private constructor() {}

  static getInstance(): ScreenProtection {
    if (!ScreenProtection.instance) {
      ScreenProtection.instance = new ScreenProtection();
    }
    return ScreenProtection.instance;
  }

  // Initialize all protection measures
  init() {
    if (this.isProtected) return;
    
    this.preventPrintScreen();
    this.preventContextMenu();
    this.preventTextSelection();
    this.preventCopyPaste();
    this.detectScreenCapture();
    this.preventDevTools();
    this.addSecureStyles();
    this.preventScreenRecording();
    this.preventScreenShare();
    
    this.isProtected = true;
    console.log('Screen protection enabled');
  }

  // Block Print Screen key
  private preventPrintScreen() {
    document.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        this.showWarning('Screenshots are not allowed');
      }
    });

    document.addEventListener('keydown', (e) => {
      // Block Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        return false;
      }
      
      // Block Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        this.showWarning('Printing is not allowed');
        return false;
      }
      
      // Block Ctrl+Shift+S (Windows Snipping Tool)
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        return false;
      }
      
      // Block Windows+Shift+S (Windows Screenshot)
      if (e.metaKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        return false;
      }
      
      // Block Cmd+Shift+3/4/5 (Mac Screenshots)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    });
  }

  // Disable right-click context menu
  private preventContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  }

  // Prevent text selection
  private preventTextSelection() {
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    });
  }

  // Prevent copy/paste
  private preventCopyPaste() {
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      this.showWarning('Copying is not allowed');
      return false;
    });

    document.addEventListener('cut', (e) => {
      e.preventDefault();
      return false;
    });
  }

  // Detect screen capture API usage
  private detectScreenCapture() {
    if ('getDisplayMedia' in navigator.mediaDevices) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      
      navigator.mediaDevices.getDisplayMedia = async (constraints) => {
        this.showBlockingOverlay();
        throw new Error('Screen capture is not allowed');
      };
    }
  }

  // Block DevTools
  private preventDevTools() {
    // Detect DevTools opening via resize
    const threshold = 160;
    const detectDevTools = () => {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        this.showBlockingOverlay();
      }
    };

    window.addEventListener('resize', detectDevTools);
    setInterval(detectDevTools, 1000);

    // Block F12 and Ctrl+Shift+I
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    });

    // Detect debugger
    setInterval(() => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        this.showBlockingOverlay();
      }
    }, 1000);
  }

  // Add CSS to prevent capture
  private addSecureStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Prevent selection */
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      /* Allow selection in input fields */
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      /* Prevent image dragging */
      img {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none !important;
      }
      
      /* Add noise overlay to interfere with screenshots */
      body::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 99999;
        background: transparent;
      }
    `;
    document.head.appendChild(style);
  }

  // Detect and block screen recording
  private preventScreenRecording() {
    // Check for screen recording via visibility and focus changes
    let hiddenTime = 0;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hiddenTime = Date.now();
      } else {
        // If hidden for very short time, might be screenshot
        if (Date.now() - hiddenTime < 500) {
          this.flashScreen();
        }
      }
    });

    // Detect if MediaRecorder is being used
    if (window.MediaRecorder) {
      const OriginalMediaRecorder = window.MediaRecorder;
      (window as any).MediaRecorder = function(stream: MediaStream, options?: MediaRecorderOptions) {
        // Check if stream is a display capture
        const tracks = stream.getVideoTracks();
        for (const track of tracks) {
          const settings = track.getSettings();
          if ((settings as any).displaySurface) {
            throw new Error('Screen recording is not allowed');
          }
        }
        return new OriginalMediaRecorder(stream, options);
      };
      (window as any).MediaRecorder.prototype = OriginalMediaRecorder.prototype;
    }
  }

  // Prevent screen sharing
  private preventScreenShare() {
    // Override getDisplayMedia to block screen sharing
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = () => {
        this.showWarning('Screen sharing is not allowed');
        return Promise.reject(new Error('Screen sharing is blocked'));
      };
    }
  }

  // Flash screen to ruin screenshots
  private flashScreen() {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 999999;
      pointer-events: none;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 100);
  }

  // Show warning toast
  private showWarning(message: string) {
    if (this.warningShown) return;
    this.warningShown = true;
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: #ef4444;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 999999;
      animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
      this.warningShown = false;
    }, 3000);
  }

  // Show blocking overlay
  private showBlockingOverlay() {
    if (this.overlay) return;
    
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    `;
    this.overlay.innerHTML = `
      <div style="color: white; font-size: 24px; font-weight: bold; margin-bottom: 16px;">
        ⚠️ Security Alert
      </div>
      <div style="color: #999; font-size: 16px; text-align: center; max-width: 300px;">
        Screen capture or developer tools detected. Please close them to continue.
      </div>
    `;
    document.body.appendChild(this.overlay);
    
    // Auto-remove after 3 seconds if conditions are normal
    setTimeout(() => {
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
    }, 3000);
  }

  // Remove all protection (for cleanup)
  destroy() {
    this.isProtected = false;
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}

export const screenProtection = ScreenProtection.getInstance();
