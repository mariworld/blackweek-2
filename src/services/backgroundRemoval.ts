export class BackgroundRemovalService {
  private cloudName: string = 'dbkdfyboi';

  async removeBackground(imageDataUrl: string): Promise<string> {
    try {
      console.log('Starting Cloudinary background removal...');
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', 'ml_default');
      
      console.log('Uploading to Cloudinary...');
      
      // Upload to Cloudinary
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
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload successful:', uploadData);
      
      const publicId = uploadData.public_id;
      
      // Generate URL with background removal transformation (Method 1 - proven to work)
      const transformedUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/e_background_removal/${publicId}`;
      
      console.log('Fetching transformed image from:', transformedUrl);
      
      // Fetch the transformed image
      const transformedResponse = await fetch(transformedUrl);
      if (!transformedResponse.ok) {
        throw new Error('Failed to fetch transformed image');
      }
      
      // Convert to blob and then to data URL
      const transformedBlob = await transformedResponse.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('Background removal complete');
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(transformedBlob);
      });
      
    } catch (error) {
      console.error('Cloudinary background removal failed:', error);
      console.log('Returning original image');
      return imageDataUrl;
    }
  }
}