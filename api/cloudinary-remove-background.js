export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = process.env.VITE_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Missing Cloudinary credentials:', { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret });
    return res.status(500).json({ error: 'Cloudinary credentials not configured' });
  }

  try {
    // Convert data URL to base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Upload directly using the upload API with base64
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
      console.error('Cloudinary upload error:', errorText);
      
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
        throw new Error(`Upload failed: ${unsignedError}`);
      }
      
      const uploadData = await unsignedResponse.json();
      const publicId = uploadData.public_id;
      
      // Generate URL with background removal
      const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/e_background_removal/f_png/${publicId}`;
      
      return res.status(200).json({ 
        transformedImageUrl: transformedUrl,
        cloudinaryUrl: transformedUrl 
      });
    }

    const uploadData = await uploadResponse.json();
    const publicId = uploadData.public_id;

    // Generate URL with background removal transformation
    const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/e_background_removal/f_png/${publicId}`;

    // Return the URL directly - let the frontend fetch it
    return res.status(200).json({ 
      transformedImageUrl: transformedUrl,
      cloudinaryUrl: transformedUrl 
    });

  } catch (error) {
    console.error('Cloudinary processing error:', error);
    return res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message 
    });
  }
}