import Replicate from 'replicate';

export class ReplicateService {
  private replicate: Replicate;

  constructor(apiToken: string) {
    this.replicate = new Replicate({
      auth: apiToken,
    });
  }

  async cartoonifyImage(imageDataUrl: string): Promise<string> {
    try {
      // Using a cartoon/sketch style model
      const output = await this.replicate.run(
        "tencentarc/photomaker-style:467d062309da518648ba89d226490e02b8ed09b5abc15026e54e31c5a8cd0769",
        {
          input: {
            input_image: imageDataUrl,
            style_name: "Comic book",
            style_strength: 0.8,
            negative_prompt: "realistic, photo, 3d render",
          }
        }
      );

      // The output might be an array or a single URL
      const resultUrl = Array.isArray(output) ? output[0] : output;
      
      // Convert to base64 if needed
      if (typeof resultUrl === 'string' && resultUrl.startsWith('http')) {
        const response = await fetch(resultUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      
      return resultUrl as string;
    } catch (error) {
      console.error('Error in cartoonify:', error);
      // Fallback to grayscale conversion if API fails
      return this.fallbackGrayscale(imageDataUrl);
    }
  }

  private fallbackGrayscale(imageDataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw grayscale version
        ctx.filter = 'grayscale(100%) contrast(1.2)';
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  }
}