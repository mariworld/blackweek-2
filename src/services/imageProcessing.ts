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

  /**
   * Preprocess image to reduce size and memory usage
   */
  private async preprocessImage(imageDataUrl: string, maxSize: number = 1024): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 80% quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  }

  async processHeadshot(imageDataUrl: string): Promise<ProcessedImage> {
    // Get original image dimensions
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageDataUrl;
    });

    const originalWidth = img.width;
    const originalHeight = img.height;

    // Preprocess image if it's too large
    let processedDataUrl = imageDataUrl;
    if (originalWidth > 1024 || originalHeight > 1024) {
      console.log(`Image is ${originalWidth}x${originalHeight}, preprocessing to reduce size...`);
      try {
        processedDataUrl = await this.preprocessImage(imageDataUrl);
        console.log('Image preprocessed successfully');
      } catch (error) {
        console.error('Failed to preprocess image:', error);
        // Continue with original if preprocessing fails
      }
    }

    // Step 1: Skip background removal for now
    // const noBackgroundImage = await this.backgroundRemoval.removeBackground(imageDataUrl);

    // Step 2: Apply cartoon style (or fallback to grayscale) directly to preprocessed image
    let processedImage: string;
    if (this.replicateService) {
      processedImage = await this.replicateService.cartoonifyImage(processedDataUrl);
      
      // If we get a URL instead of base64, load and convert it
      if (processedImage.startsWith('http')) {
        try {
          const response = await fetch(processedImage);
          const blob = await response.blob();
          processedImage = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Failed to load processed image:', error);
          // Fall back to grayscale if we can't load the URL
          processedImage = await this.applyGrayscaleFilter(imageDataUrl);
        }
      }
    } else {
      // Fallback to simple grayscale filter
      processedImage = await this.applyGrayscaleFilter(processedDataUrl);
    }

    return {
      original: imageDataUrl,
      processed: processedImage,
      width: originalWidth,
      height: originalHeight,
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