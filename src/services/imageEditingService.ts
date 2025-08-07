export class ImageEditingService {
  private backendUrl: string = 'http://localhost:3001';

  /**
   * Edit an image using FLUX Kontext Pro model with natural language prompts
   * @param imageUrl - URL or base64 encoded image to edit
   * @param prompt - Text description of the edit to make
   * @param options - Optional parameters like seed for reproducible results
   * @returns Promise with the edited image URL
   */
  async editImage(
    imageUrl: string, 
    prompt: string, 
    options: { seed?: number } = {}
  ): Promise<string> {
    try {
      console.log('Sending image edit request to backend...');
      
      const response = await fetch(`${this.backendUrl}/api/edit-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          prompt,
          seed: options.seed
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to edit image');
      }

      const result = await response.json();
      console.log('Image edit response:', result);
      
      if (!result.outputUrl) {
        throw new Error('No output URL received from backend');
      }

      return result.outputUrl;
      
    } catch (error) {
      console.error('Error editing image:', error);
      throw error;
    }
  }

  /**
   * Convert a File or Blob to base64 data URL
   * @param file - File or Blob to convert
   * @returns Promise with base64 data URL
   */
  async fileToDataUrl(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert image URL to base64 (useful for external URLs)
   * @param url - Image URL to convert
   * @returns Promise with base64 data URL
   */
  async urlToDataUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return this.fileToDataUrl(blob);
    } catch (error) {
      console.error('Error converting URL to data URL:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const imageEditingService = new ImageEditingService();