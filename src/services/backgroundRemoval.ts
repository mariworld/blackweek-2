declare global {
  interface Window {
    SelfieSegmentation: any;
    mediapipe?: any;
  }
}

export class BackgroundRemovalService {
  private segmenter: any | null = null;
  private isInitialized = false;
  private initializationError: Error | null = null;

  constructor() {
    // Don't initialize immediately, wait for explicit initialization
  }

  private async waitForMediaPipe(maxAttempts = 50): Promise<any> {
    console.log('Waiting for MediaPipe to load...');
    
    for (let i = 0; i < maxAttempts; i++) {
      // Check multiple possible locations
      const SelfieSegmentation = 
        window.SelfieSegmentation || 
        (window as any).mediapipe?.SelfieSegmentation ||
        (window as any).SelfieSegmentation;
      
      if (SelfieSegmentation) {
        console.log('MediaPipe SelfieSegmentation found!');
        return SelfieSegmentation;
      }
      
      // Log what we're seeing for debugging
      if (i === 0) {
        console.log('Global window properties:', Object.keys(window).filter(k => k.includes('mediapipe') || k.includes('Selfie')));
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('MediaPipe SelfieSegmentation failed to load after ' + (maxAttempts * 100) + 'ms');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationError) throw this.initializationError;
    
    try {
      // Wait for MediaPipe to be available
      const SelfieSegmentation = await this.waitForMediaPipe();
      
      console.log('Creating SelfieSegmentation instance...');
      this.segmenter = new SelfieSegmentation({
        locateFile: (file: string) => {
          const url = `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
          console.log('Loading MediaPipe file:', url);
          return url;
        },
      });

      this.segmenter.setOptions({
        modelSelection: 1,
        selfieMode: true,
      });
      
      await this.segmenter.initialize();
      this.isInitialized = true;
      console.log('MediaPipe initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      this.initializationError = error as Error;
      throw error;
    }
  }

  async removeBackground(imageDataUrl: string): Promise<string> {
    try {
      await this.initialize();
    } catch (error) {
      console.error('MediaPipe initialization failed, falling back to no background removal');
      // Return original image if MediaPipe fails
      return imageDataUrl;
    }

    if (!this.segmenter) {
      console.error('Segmenter not initialized');
      return imageDataUrl;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          this.segmenter.onResults((results: any) => {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
            
            ctx.globalCompositeOperation = 'source-in';
            ctx.drawImage(img, 0, 0);
            ctx.restore();
            
            resolve(canvas.toDataURL('image/png'));
          });
          
          await this.segmenter.send({ image: img });
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  }
}