export class ReplicateService {
  private apiKey: string;
  private backendUrl: string = 'http://localhost:3001';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async cartoonifyImage(imageDataUrl: string, seed?: number): Promise<string> {
    try {
      if (!this.apiKey) {
        console.warn('No Replicate API key provided, using fallback');
        return this.fallbackGrayscale(imageDataUrl);
      }

      // Get image dimensions to maintain aspect ratio
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageDataUrl;
      });

      const aspectRatio = img.width / img.height;
      const aspectRatioString = aspectRatio > 1 
        ? `${Math.round(aspectRatio * 16)}:9` 
        : `9:${Math.round(16 / aspectRatio)}`;
      
      // Call our backend endpoint
      const response = await fetch(`${this.backendUrl}/api/transform-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl,
          aspectRatio: aspectRatioString,
          seed,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Check if fallback is available for memory errors
        if (response.status === 503 && error.fallbackAvailable) {
          console.log('Primary model failed due to memory, trying fallback...');
          
          // Try the fallback endpoint
          const fallbackResponse = await fetch(`${this.backendUrl}/api/transform-image-fallback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageDataUrl,
              aspectRatio: aspectRatioString,
            }),
          });

          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            console.log('Fallback successful:', fallbackResult);
            
            if (!fallbackResult.outputUrl) {
              throw new Error('No output URL from fallback');
            }
            
            return fallbackResult.outputUrl;
          } else {
            const fallbackError = await fallbackResponse.json();
            console.error('Fallback also failed:', fallbackError);
            
            // Show user-friendly error with suggestion
            throw new Error(
              'Image processing failed due to high server load. ' +
              'Please try with a smaller image (max 1024x1024) or try again later.'
            );
          }
        }
        
        // For other errors, throw with details
        throw new Error(error.details || error.error || 'Backend API error');
      }

      const result = await response.json();
      console.log('Backend response:', result);
      
      if (!result.outputUrl) {
        throw new Error('No output URL from backend');
      }

      // The backend returns a URL, we need to return it as-is
      // The imageProcessing service will handle converting it to base64
      console.log('Returning output URL:', result.outputUrl);
      return result.outputUrl;
      
    } catch (error) {
      console.error('Error in cartoonify:', error);
      
      // Check if it's a memory-related error
      if (error instanceof Error && 
          (error.message.includes('memory') || 
           error.message.includes('server load'))) {
        // Re-throw to let the UI handle it appropriately
        throw error;
      }
      
      // For other errors, fallback to grayscale conversion
      console.log('Falling back to client-side grayscale conversion');
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
        
        // Create a high contrast black and white sketch effect
        // First pass: Draw with high contrast
        ctx.filter = 'grayscale(100%) contrast(200%) brightness(100%)';
        ctx.drawImage(img, 0, 0);
        
        // Get image data for edge detection
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply threshold to create sketch-like effect
        const threshold = 128;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          // Create stark black/white contrast
          const value = avg > threshold ? 255 : avg < threshold * 0.3 ? 0 : avg;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Apply additional filter for sketch effect
        ctx.globalCompositeOperation = 'multiply';
        ctx.filter = 'blur(0.5px) contrast(110%)';
        ctx.drawImage(canvas, 0, 0);
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  }
}