export class CloudinaryBackgroundRemovalService {
  private cloudName: string = 'dbkdfyboi';

  async removeBackground(imageDataUrl: string): Promise<string> {
    try {
      console.log('Starting Cloudinary AI background removal...');
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Method 1: Upload with background removal in the upload parameters
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', 'ml_default');
      formData.append('background_removal', 'cloudinary_ai'); // Enable AI background removal on upload
      
      console.log('Uploading to Cloudinary with background removal...');
      
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Cloudinary upload failed:', errorText);
        
        // Fallback: Try without background_removal parameter
        return this.removeBackgroundPostUpload(imageDataUrl);
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload response:', uploadData);
      
      // Check if background was removed during upload
      if (uploadData.info && uploadData.info.background_removal) {
        console.log('Background removed during upload');
        
        // Fetch the processed image
        const processedUrl = uploadData.secure_url;
        const imgResponse = await fetch(processedUrl);
        const imgBlob = await imgResponse.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log('Background removal complete (method 1)');
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imgBlob);
        });
      }
      
      // If not removed during upload, apply transformation
      return this.applyBackgroundRemovalTransformation(uploadData.public_id);
      
    } catch (error) {
      console.error('Cloudinary background removal failed:', error);
      return imageDataUrl;
    }
  }

  private async removeBackgroundPostUpload(imageDataUrl: string): Promise<string> {
    try {
      console.log('Trying alternative upload method...');
      
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', 'ml_default');
      
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      return this.applyBackgroundRemovalTransformation(uploadData.public_id);
      
    } catch (error) {
      console.error('Alternative method failed:', error);
      return imageDataUrl;
    }
  }

  private async applyBackgroundRemovalTransformation(publicId: string): Promise<string> {
    console.log('Applying background removal transformation to:', publicId);
    
    // Try different URL formats for the transformation
    const urls = [
      `https://res.cloudinary.com/${this.cloudName}/image/upload/e_background_removal/${publicId}`,
      `https://res.cloudinary.com/${this.cloudName}/image/upload/e_background_removal/f_png/${publicId}`,
      `https://res.cloudinary.com/${this.cloudName}/image/upload/e_background_removal:cloudinary_ai/${publicId}`,
    ];
    
    for (const url of urls) {
      try {
        console.log('Trying URL:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              console.log('Background removal successful with URL:', url);
              resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.log('URL failed:', url, error);
      }
    }
    
    throw new Error('All transformation URLs failed');
  }
}

// Export as default implementation
export { CloudinaryBackgroundRemovalService as BackgroundRemovalService };