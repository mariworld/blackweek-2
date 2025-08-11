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
    console.log('[Cloudinary Client] Starting background removal process...');
    
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      console.error('[Cloudinary Client] ❌ Credentials not configured:', {
        hasCloudName: !!this.cloudName,
        hasApiKey: !!this.apiKey,
        hasApiSecret: !!this.apiSecret
      });
      return imageDataUrl;
    }

    console.log('[Cloudinary Client] Credentials validated, cloud name:', this.cloudName);

    try {
      const startTime = Date.now();
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', 'ml_default'); // You may need to create an unsigned upload preset in Cloudinary
      
      // Upload to Cloudinary
      console.log('[Cloudinary Client] Uploading image to Cloudinary...');
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      console.log('[Cloudinary Client] Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        console.error('[Cloudinary Client] ❌ Upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText
        });
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      const publicId = uploadData.public_id;
      
      console.log('[Cloudinary Client] Upload successful:', {
        publicId,
        format: uploadData.format,
        bytes: uploadData.bytes,
        width: uploadData.width,
        height: uploadData.height
      });

      // Generate URL with background removal transformation
      const transformedUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/e_background_removal/${publicId}.png`;
      console.log('[Cloudinary Client] Transformation URL:', transformedUrl);
      
      // Fetch the transformed image
      console.log('[Cloudinary Client] Fetching transformed image...');
      const transformedResponse = await fetch(transformedUrl);
      
      if (!transformedResponse.ok) {
        console.error('[Cloudinary Client] ❌ Failed to fetch transformed image:', {
          status: transformedResponse.status,
          url: transformedUrl
        });
        throw new Error('Failed to fetch transformed image');
      }
      
      console.log('[Cloudinary Client] Transformed image fetched successfully');

      const transformedBlob = await transformedResponse.blob();
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(transformedBlob);
      });
      
      const duration = Date.now() - startTime;
      console.log('[Cloudinary Client] ✅ SUCCESS - Background removal completed:', {
        duration: `${duration}ms`,
        blobSize: transformedBlob.size,
        type: transformedBlob.type
      });
      
      return result;
      
    } catch (error) {
      console.error('[Cloudinary Client] ❌ FAILED - Background removal error:', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      });
      return imageDataUrl;
    }
  }
}

// Alternative approach using signed upload with backend proxy
export class CloudinaryBackgroundRemovalServiceWithProxy {
  async removeBackground(imageDataUrl: string): Promise<string> {
    console.log('[Cloudinary Proxy Client] Starting background removal via API proxy...');
    const startTime = Date.now();
    
    try {
      // Send to backend API for signed upload
      console.log('[Cloudinary Proxy Client] Sending image to backend API...');
      const response = await fetch('/api/cloudinary-remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageDataUrl }),
      });
      
      console.log('[Cloudinary Proxy Client] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[Cloudinary Proxy Client] ❌ API request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      console.log('[Cloudinary Proxy Client] ✅ SUCCESS - Background removal completed:', {
        duration: `${duration}ms`,
        url: data.transformedImageUrl,
        timestamp: new Date().toISOString()
      });
      
      return data.transformedImageUrl;
      
    } catch (error) {
      console.error('[Cloudinary Client] ❌ FAILED - Background removal error:', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      });
      return imageDataUrl;
    }
  }
}