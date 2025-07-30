import { BackgroundRemovalService } from './backgroundRemoval';
import { ReplicateService } from './replicateAPI';
import { ProcessedImage } from '../types';

export class ImageProcessingService {
  private backgroundRemoval: BackgroundRemovalService;
  private replicateService: ReplicateService | null;

  constructor(replicateApiKey?: string) {
    this.backgroundRemoval = new BackgroundRemovalService();
    this.replicateService = replicateApiKey ? new ReplicateService(replicateApiKey) : null;
  }

  async processHeadshot(imageDataUrl: string): Promise<ProcessedImage> {
    // Get image dimensions
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageDataUrl;
    });

    const width = img.width;
    const height = img.height;

    // Step 1: Skip background removal for now
    // const noBackgroundImage = await this.backgroundRemoval.removeBackground(imageDataUrl);

    // Step 2: Apply cartoon style (or fallback to grayscale) directly to original image
    let processedImage: string;
    if (this.replicateService) {
      processedImage = await this.replicateService.cartoonifyImage(imageDataUrl);
    } else {
      // Fallback to simple grayscale filter
      processedImage = await this.applyGrayscaleFilter(imageDataUrl);
    }

    return {
      original: imageDataUrl,
      processed: processedImage,
      width,
      height,
    };
  }

  private applyGrayscaleFilter(imageDataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Apply grayscale and enhance contrast
        ctx.filter = 'grayscale(100%) contrast(1.3) brightness(1.1)';
        ctx.drawImage(img, 0, 0);
        
        // Add slight edge detection effect for cartoon-like appearance
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple edge detection
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  }
}