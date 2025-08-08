export class CloudinaryBackgroundRemovalService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '';
    this.apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || '';
  }

  async removeBackground(imageDataUrl: string): Promise<string> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      console.error('Cloudinary credentials not configured');
      return imageDataUrl;
    }

    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', 'ml_default'); // You may need to create an unsigned upload preset in Cloudinary
      
      // Upload to Cloudinary
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      const publicId = uploadData.public_id;

      // Generate URL with background removal transformation
      const transformedUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/e_background_removal/${publicId}.png`;
      
      // Fetch the transformed image
      const transformedResponse = await fetch(transformedUrl);
      if (!transformedResponse.ok) {
        throw new Error('Failed to fetch transformed image');
      }

      const transformedBlob = await transformedResponse.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(transformedBlob);
      });
      
    } catch (error) {
      console.error('Cloudinary background removal failed:', error);
      return imageDataUrl;
    }
  }
}

// Alternative approach using signed upload with backend proxy
export class CloudinaryBackgroundRemovalServiceWithProxy {
  async removeBackground(imageDataUrl: string): Promise<string> {
    try {
      // Send to backend API for signed upload
      const response = await fetch('/api/cloudinary-remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.transformedImageUrl;
      
    } catch (error) {
      console.error('Cloudinary background removal failed:', error);
      return imageDataUrl;
    }
  }
}