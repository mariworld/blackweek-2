declare global {
  interface Window {
    SelfieSegmentation: any;
  }
}

export class BackgroundRemovalService {
  private segmenter: any;
  private isInitialized = false;

  constructor() {
    // Use the global SelfieSegmentation from the CDN
    const SelfieSegmentation = window.SelfieSegmentation || (window as any).mediapipe?.SelfieSegmentation;
    
    if (!SelfieSegmentation) {
      throw new Error('MediaPipe SelfieSegmentation not loaded');
    }
    
    this.segmenter = new SelfieSegmentation({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      },
    });

    this.segmenter.setOptions({
      modelSelection: 1,
      selfieMode: true,
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await this.segmenter.initialize();
    this.isInitialized = true;
  }

  async removeBackground(imageDataUrl: string): Promise<string> {
    await this.initialize();

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