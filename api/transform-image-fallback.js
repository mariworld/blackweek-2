const Replicate = require('replicate');

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.VITE_REPLICATE_API_KEY,
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageDataUrl, aspectRatio, seed } = req.body;

    if (!imageDataUrl) {
      return res.status(400).json({ error: 'No image provided' });
    }

    console.log('Using FLUX Dev model as fallback...');

    // Preprocess image to reduce memory usage even more
    let processedImageData;
    try {
      const sharp = require('sharp');
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Even smaller size for fallback
      const processedBuffer = await sharp(buffer)
        .resize(768, 768, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 70 })
        .toBuffer();
      
      processedImageData = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
      console.log('Image preprocessed for fallback');
    } catch (preError) {
      console.log('Fallback preprocessing failed, using original:', preError.message);
      processedImageData = imageDataUrl;
    }

    // Use FLUX Dev model with lower requirements
    const prediction = await replicate.predictions.create({
      version: "f2ab8a5bfe79f02f0dde7a32f8c5b1ef0c2e6f14f5e2e3ae885ffcab126d6253",
      input: {
        prompt: "transform into black and white cartoon sketch drawing, pencil sketch, line art, high contrast, simple silhouette style",
        image: processedImageData,
        prompt_strength: 0.8,
        num_outputs: 1,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        output_format: "jpeg",
        output_quality: 80,
        ...(seed !== undefined && { seed: parseInt(seed) })
      }
    });

    console.log('Fallback prediction created:', prediction.id);

    // Poll for completion
    let currentPrediction = prediction;
    let pollCount = 0;
    const maxPolls = 60;
    
    while (
      currentPrediction.status !== 'succeeded' && 
      currentPrediction.status !== 'failed' &&
      currentPrediction.status !== 'canceled' &&
      pollCount < maxPolls
    ) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentPrediction = await replicate.predictions.get(currentPrediction.id);
      console.log(`Fallback prediction status: ${currentPrediction.status}`);
      pollCount++;
    }

    if (currentPrediction.status === 'succeeded') {
      let outputUrl;
      if (Array.isArray(currentPrediction.output) && currentPrediction.output.length > 0) {
        outputUrl = currentPrediction.output[0];
      } else if (typeof currentPrediction.output === 'string') {
        outputUrl = currentPrediction.output;
      }

      console.log('Fallback processing completed successfully');
      
      return res.json({ 
        success: true, 
        outputUrl,
        usedFallback: true,
        predictionId: currentPrediction.id
      });
    } else {
      throw new Error(`Fallback prediction failed: ${currentPrediction.error || currentPrediction.status}`);
    }

  } catch (error) {
    console.error('Fallback processing error:', error);
    res.status(500).json({ 
      error: 'Fallback processing also failed',
      details: error.message,
      suggestion: 'Please try with a smaller image or try again later.'
    });
  }
};