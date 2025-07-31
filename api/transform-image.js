import Replicate from 'replicate';

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.VITE_REPLICATE_API_KEY,
});

// Helper function to check if error is CUDA memory related
function isCudaMemoryError(error) {
  const errorMessage = error.message || error.toString();
  return errorMessage.includes('CUDA out of memory') || 
         errorMessage.includes('OutOfMemoryError') ||
         errorMessage.includes('memory');
}

export default async function handler(req, res) {
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

  let retryCount = 0;
  const maxRetries = 3;
  const retryDelays = [2000, 4000, 6000];
  
  async function attemptProcessing() {
    try {
      const { imageDataUrl, aspectRatio, seed } = req.body;

      if (!imageDataUrl) {
        return res.status(400).json({ error: 'No image provided' });
      }

      console.log(`Processing image with FLUX Kontext Pro (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      console.log('API Key available:', !!process.env.VITE_REPLICATE_API_KEY);

      // Create prediction using FLUX Kontext Pro
      const prediction = await replicate.predictions.create({
        version: "0f1178f5a27e9aa2d2d39c8a43c110f7fa7cbf64062ff04a04cd40899e546065",
        input: {
          prompt: "Make this a greyscale cartoon sketch with silhouette style, remove facial features from headshot and keep everything else",
          input_image: imageDataUrl,
          ...(seed !== undefined && { seed: parseInt(seed) })
        }
      });

      console.log('Prediction created:', prediction.id);

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
        console.log(`Prediction status (${pollCount}): ${currentPrediction.status}`);
        pollCount++;
      }

      if (currentPrediction.status === 'succeeded') {
        let outputUrl;
        if (Array.isArray(currentPrediction.output) && currentPrediction.output.length > 0) {
          outputUrl = currentPrediction.output[0];
        } else if (typeof currentPrediction.output === 'string') {
          outputUrl = currentPrediction.output;
        } else {
          throw new Error('Unexpected output format from model');
        }

        console.log('Processing completed successfully');
        
        return res.json({ 
          success: true, 
          outputUrl,
          predictionId: currentPrediction.id
        });
      } else if (currentPrediction.status === 'failed') {
        const error = new Error(currentPrediction.error || 'Prediction failed');
        error.predictionError = currentPrediction.error;
        throw error;
      } else {
        throw new Error(`Prediction timed out or was canceled: ${currentPrediction.status}`);
      }

    } catch (error) {
      console.error('Error processing image:', error);
      
      // Check if it's a CUDA memory error and we have retries left
      if (isCudaMemoryError(error) && retryCount < maxRetries) {
        retryCount++;
        console.log(`CUDA memory error detected. Retrying in ${retryDelays[retryCount - 1]}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelays[retryCount - 1]));
        return attemptProcessing();
      }
      
      // If we've exhausted retries or it's not a memory error
      if (retryCount >= maxRetries && isCudaMemoryError(error)) {
        return res.status(503).json({ 
          error: 'GPU memory exhausted after multiple attempts',
          details: 'The image processing service is experiencing high load. Please try with a smaller image or try again later.',
          suggestion: 'Consider using a smaller image or trying again later.',
          fallbackAvailable: true
        });
      }
      
      // Other errors
      return res.status(500).json({ 
        error: 'Failed to process image',
        details: error.message 
      });
    }
  }
  
  // Start the processing
  await attemptProcessing();
}