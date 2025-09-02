export default async function handler(req, res) {
  console.log('[Cloudinary API] Request received:', {
    method: req.method,
    timestamp: new Date().toISOString(),
    hasImage: !!req.body?.image
  });

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.error('[Cloudinary API] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;

  if (!image) {
    console.error('[Cloudinary API] No image provided in request');
    return res.status(400).json({ error: 'No image provided' });
  }

  console.log('[Cloudinary API] Image data received, size:', image.length, 'characters');

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = process.env.VITE_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('[Cloudinary API] Missing credentials:', { 
      cloudName: !!cloudName, 
      apiKey: !!apiKey, 
      apiSecret: !!apiSecret,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ error: 'Cloudinary credentials not configured' });
  }

  console.log('[Cloudinary API] Credentials validated successfully');

  try {
    console.log('[Cloudinary API] Starting image upload process...');
    
    // Convert data URL to base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    console.log('[Cloudinary API] Base64 data prepared, size:', base64Data.length, 'characters');
    
    // Upload directly using the upload API with base64
    const uploadStartTime = Date.now();
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: `data:image/png;base64,${base64Data}`,
          upload_preset: 'ml_default', // This needs to be created in Cloudinary dashboard as unsigned
          api_key: apiKey,
        }),
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[Cloudinary API] Initial upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText,
        duration: Date.now() - uploadStartTime + 'ms'
      });
      console.log('[Cloudinary API] Attempting unsigned upload fallback...');
      
      // Try unsigned upload without API key
      const unsignedResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: `data:image/png;base64,${base64Data}`,
            upload_preset: 'ml_default',
          }),
        }
      );
      
      if (!unsignedResponse.ok) {
        const unsignedError = await unsignedResponse.text();
        console.error('[Cloudinary API] Unsigned upload also failed:', {
          status: unsignedResponse.status,
          error: unsignedError
        });
        throw new Error(`Upload failed: ${unsignedError}`);
      }
      
      console.log('[Cloudinary API] Unsigned upload successful!');
      
      const uploadData = await unsignedResponse.json();
      const publicId = uploadData.public_id;
      
      console.log('[Cloudinary API] Upload successful via unsigned method:', {
        publicId,
        uploadDuration: Date.now() - uploadStartTime + 'ms'
      });
      
      // Generate URL with background removal
      const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/e_background_removal/f_png/${publicId}`;
      
      console.log('[Cloudinary API] ✅ SUCCESS - Background removal URL generated:', transformedUrl);
      
      return res.status(200).json({ 
        transformedImageUrl: transformedUrl,
        cloudinaryUrl: transformedUrl 
      });
    }

    const uploadData = await uploadResponse.json();
    const publicId = uploadData.public_id;
    
    console.log('[Cloudinary API] Upload successful via signed method:', {
      publicId,
      uploadDuration: Date.now() - uploadStartTime + 'ms',
      format: uploadData.format,
      bytes: uploadData.bytes,
      width: uploadData.width,
      height: uploadData.height
    });

    // Generate URL with background removal transformation
    const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/e_background_removal/f_png/${publicId}`;
    
    console.log('[Cloudinary API] ✅ SUCCESS - Background removal URL generated:', transformedUrl);

    // Return the URL directly - let the frontend fetch it
    return res.status(200).json({ 
      transformedImageUrl: transformedUrl,
      cloudinaryUrl: transformedUrl 
    });

  } catch (error) {
    console.error('[Cloudinary API] ❌ FAILED - Processing error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message 
    });
  }
}