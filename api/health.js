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

  try {
    // Test if we can access Replicate API
    const testResponse = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        'Authorization': `Token ${process.env.VITE_REPLICATE_API_KEY}`
      }
    });
    
    res.json({ 
      status: 'ok', 
      apiKeyConfigured: !!process.env.VITE_REPLICATE_API_KEY,
      apiKeyPrefix: process.env.VITE_REPLICATE_API_KEY ? process.env.VITE_REPLICATE_API_KEY.substring(0, 10) + '...' : 'not set',
      replicateAuth: testResponse.ok ? 'working' : `failed: ${testResponse.status}`,
      environment: 'vercel'
    });
  } catch (error) {
    res.json({ 
      status: 'error', 
      apiKeyConfigured: !!process.env.VITE_REPLICATE_API_KEY,
      error: error.message,
      environment: 'vercel'
    });
  }
};