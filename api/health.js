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

  try {
    const hasApiKey = !!process.env.VITE_REPLICATE_API_KEY;
    
    res.json({ 
      status: 'ok', 
      apiKeyConfigured: hasApiKey,
      apiKeyPrefix: hasApiKey ? process.env.VITE_REPLICATE_API_KEY.substring(0, 10) + '...' : 'not set',
      environment: 'vercel',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ 
      status: 'error', 
      apiKeyConfigured: !!process.env.VITE_REPLICATE_API_KEY,
      error: error.message,
      environment: 'vercel'
    });
  }
}