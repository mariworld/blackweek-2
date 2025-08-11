export class BackgroundRemovalService {
  private cloudName: string = 'dj5tdrmz8';

  async removeBackground(imageDataUrl: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      console.log('[Cloudinary BG Removal] Starting background removal process...');
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      console.log('[Cloudinary BG Removal] Image blob created, size:', blob.size, 'bytes');
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', 'ml_default');
      
      console.log('[Cloudinary BG Removal] Uploading to Cloudinary cloud:', this.cloudName);
      
      // Upload to Cloudinary
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('[Cloudinary BG Removal] Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[Cloudinary BG Removal] ❌ Upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: errorText,
          cloud: this.cloudName
        });
        throw new Error(`Upload failed with status ${uploadResponse.status}: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('[Cloudinary BG Removal] ✅ Upload successful:', {
        publicId: uploadData.public_id,
        format: uploadData.format,
        bytes: uploadData.bytes,
        url: uploadData.secure_url
      });
      
      const publicId = uploadData.public_id;
      
      // Generate URL with background removal transformation
      const transformedUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/e_background_removal/${publicId}`;
      
      console.log('[Cloudinary BG Removal] Fetching transformed image from:', transformedUrl);
      
      // Fetch the transformed image
      const transformedResponse = await fetch(transformedUrl);
      console.log('[Cloudinary BG Removal] Transform response status:', transformedResponse.status);
      
      if (!transformedResponse.ok) {
        console.error('[Cloudinary BG Removal] ❌ Failed to fetch transformed image:', {
          status: transformedResponse.status,
          statusText: transformedResponse.statusText,
          url: transformedUrl
        });
        
        // Handle specific status codes
        if (transformedResponse.status === 420) {
          console.error('[Cloudinary BG Removal] ⚠️ Status 420: Rate limit or transformation limit exceeded');
          console.log('[Cloudinary BG Removal] Tip: Check your Cloudinary account limits or wait before retrying');
        }
        
        throw new Error(`Failed to fetch transformed image (status ${transformedResponse.status})`);
      }
      
      // Convert to blob and then to data URL
      const transformedBlob = await transformedResponse.blob();
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(transformedBlob);
      });
      
      const duration = Date.now() - startTime;
      console.log('[Cloudinary BG Removal] ✅ SUCCESS - Background removal completed in', duration, 'ms');
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[Cloudinary BG Removal] ❌ FAILED - Background removal error after', duration, 'ms:', {
        error: (error as Error).message,
        stack: (error as Error).stack
      });
      console.log('[Cloudinary BG Removal] ⚠️ Returning original image due to error');
      
      // Throw the error instead of silently returning original
      throw error;
    }
  }
}