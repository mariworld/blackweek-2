module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    apiKeySet: !!process.env.VITE_REPLICATE_API_KEY,
    method: req.method,
    url: req.url
  });
};