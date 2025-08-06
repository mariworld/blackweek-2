const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Replicate = require('replicate');

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.VITE_REPLICATE_API_KEY,
});

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test if we can list models
    const testResponse = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        'Authorization': `Token ${process.env.VITE_REPLICATE_API_KEY}`
      }
    });
    
    res.json({ 
      status: 'ok', 
      apiKeyConfigured: !!process.env.VITE_REPLICATE_API_KEY,
      apiKeyPrefix: process.env.VITE_REPLICATE_API_KEY ? process.env.VITE_REPLICATE_API_KEY.substring(0, 10) + '...' : 'not set',
      replicateAuth: testResponse.ok ? 'working' : `failed: ${testResponse.status}`
    });
  } catch (error) {
    res.json({ 
      status: 'error', 
      apiKeyConfigured: !!process.env.VITE_REPLICATE_API_KEY,
      error: error.message 
    });
  }
});

// Test available models endpoint
app.get('/api/test-models', async (req, res) => {
  try {
    // List some popular models to verify API access
    const models = [
      'stability-ai/sdxl',
      'black-forest-labs/flux-schnell',
      'black-forest-labs/flux-dev'
    ];

    const results = {};
    
    for (const modelId of models) {
      const [owner, name] = modelId.split('/');
      const response = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}`, {
        headers: {
          'Authorization': `Token ${process.env.VITE_REPLICATE_API_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        results[modelId] = {
          available: true,
          latest_version: data.latest_version?.id || 'unknown'
        };
      } else {
        results[modelId] = {
          available: false,
          error: response.status
        };
      }
    }

    res.json({ models: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check if error is CUDA memory related
function isCudaMemoryError(error) {
  const errorMessage = error.message || error.toString();
  return errorMessage.includes('CUDA out of memory') || 
         errorMessage.includes('OutOfMemoryError') ||
         errorMessage.includes('memory');
}

// Helper function to preprocess image
async function preprocessImage(dataUrl) {
  const sharp = require('sharp');
  
  // Extract base64 data
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Resize and compress
  const processedBuffer = await sharp(buffer)
    .resize(1024, 1024, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ quality: 80 })
    .toBuffer();
  
  // Convert back to base64
  return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
}

// Image processing endpoint with async predictions and retry logic
app.post('/api/transform-image', async (req, res) => {
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelays = [2000, 4000, 6000]; // 2s, 4s, 6s
  
  async function attemptProcessing() {
    try {
      const { imageDataUrl, aspectRatio, seed } = req.body;

      if (!imageDataUrl) {
        return res.status(400).json({ error: 'No image provided' });
      }

      console.log(`Processing image with FLUX Kontext Pro (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      console.log('API Key available:', !!process.env.VITE_REPLICATE_API_KEY);

      // Preprocess image to reduce memory usage
      let processedImageData;
      try {
        processedImageData = await preprocessImage(imageDataUrl);
        console.log('Image preprocessed successfully');
      } catch (preError) {
        console.log('Image preprocessing failed, using original:', preError.message);
        processedImageData = imageDataUrl;
      }

      // Create prediction using FLUX Kontext Pro
      const prediction = await replicate.predictions.create({
        version: "0f1178f5a27e9aa2d2d39c8a43c110f7fa7cbf64062ff04a04cd40899e546065",
        input: {
          // prompt: "Make this a greyscale stylized sketch, most importantly, make the face/skin darker, keep the person's head and their clothing intact. It should look like a portrait.",
          prompt: "Greyscale conversion only, darken face and skin areas, keep ALL existing elements: glasses if present, earrings, facial hair, clothing, hair style - preserve everything exactly as shown, no removal or modification of any features, maintain photographic accuracy, only adjust lighting and convert to greyscale",
          // prompt: "Make this greyscale, enhance to make it look like a portrait, dont change the face, and make the background simple. make it elevated. remove the background",
          input_image: processedImageData,
          ...(seed !== undefined && { seed: parseInt(seed) })
        }
      });

      console.log('Prediction created:', prediction.id);

      // Poll for completion
      let currentPrediction = prediction;
      let pollCount = 0;
      const maxPolls = 60; // 1 minute max
      
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
        // Extract output URL
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
          suggestion: 'Consider using a smaller image (max 1024x1024) or trying the FLUX Dev model instead.',
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
});

// Fallback endpoint using FLUX Dev (less memory intensive)
app.post('/api/transform-image-fallback', async (req, res) => {
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
      version: "f2ab8a5bfe79f02f0dde7a32f8c5b1ef0c2e6f14f5e2e3ae885ffcab126d6253", // FLUX dev version
      input: {
        prompt: "Make this a greyscale stylized sketch, most importantly, make the face/skin darker, keep the person's head and their clothing intact. It should look like a portrait.",
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
});

// FLUX Kontext Pro image editing endpoint
app.post('/api/edit-image', async (req, res) => {
  try {
    const { imageUrl, prompt, seed } = req.body;

    if (!imageUrl || !prompt) {
      return res.status(400).json({ 
        error: 'Missing required parameters: imageUrl and prompt are required' 
      });
    }

    console.log('Starting FLUX Kontext Pro image edit...');
    console.log('Prompt:', prompt);

    // Prepare input for FLUX Kontext Pro
    const input = {
      prompt: prompt,
      input_image: imageUrl
    };

    // Add optional seed if provided
    if (seed !== undefined && seed !== null) {
      input.seed = parseInt(seed);
    }

    // Run FLUX Kontext Pro model
    const prediction = await replicate.predictions.create({
      version: "0f1178f5a27e9aa2d2d39c8a43c110f7fa7cbf64062ff04a04cd40899e546065",
      input: input
    });

    console.log('Prediction created:', prediction.id);

    // Poll for completion
    let currentPrediction = prediction;
    while (
      currentPrediction.status !== 'succeeded' && 
      currentPrediction.status !== 'failed' &&
      currentPrediction.status !== 'canceled'
    ) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      currentPrediction = await replicate.predictions.get(currentPrediction.id);
      console.log('Prediction status:', currentPrediction.status);
    }

    if (currentPrediction.status === 'succeeded') {
      console.log('Edit completed successfully');
      
      // Extract output URL
      let outputUrl;
      if (Array.isArray(currentPrediction.output) && currentPrediction.output.length > 0) {
        outputUrl = currentPrediction.output[0];
      } else if (typeof currentPrediction.output === 'string') {
        outputUrl = currentPrediction.output;
      } else {
        throw new Error('Unexpected output format from model');
      }

      res.json({
        success: true,
        outputUrl: outputUrl,
        predictionId: currentPrediction.id
      });
    } else {
      throw new Error(`Prediction ${currentPrediction.status}: ${currentPrediction.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Error editing image:', error);
    res.status(500).json({ 
      error: 'Failed to edit image',
      details: error.message 
    });
  }
});

// Webhook endpoint for async predictions (optional)
app.post('/api/replicate-webhook', async (req, res) => {
  try {
    const prediction = req.body;
    console.log('Webhook received for prediction:', prediction.id);
    console.log('Status:', prediction.status);
    
    // Here you could store the result in a database or notify the frontend
    // For now, just log it
    if (prediction.status === 'succeeded') {
      console.log('Edit completed via webhook:', prediction.output);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Backend server accessible on network at http://[YOUR_IP]:${PORT}`);
  console.log(`API key configured: ${!!process.env.VITE_REPLICATE_API_KEY}`);
  
  // Show network interfaces
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  console.log('\nAvailable network addresses:');
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(interface => {
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`  ${interfaceName}: http://${interface.address}:${PORT}`);
      }
    });
  });
});