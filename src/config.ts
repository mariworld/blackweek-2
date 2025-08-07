// Configuration for the BlackWeek Poster app
export const config = {
  // Add your Replicate API key here
  // Get your key from: https://replicate.com/account/api-tokens
  REPLICATE_API_KEY: import.meta.env.VITE_REPLICATE_API_KEY || '',
  
  // Model configuration
  REPLICATE_MODEL: 'black-forest-labs/flux-kontext-pro:7b958dd6cf90c84f0db0cc456ed5efed6e321bb1ae8c96a4fc088ac982e16ab7',
  
  // Prompt for image transformation
  TRANSFORMATION_PROMPT: 'Make this photo grey scale cartoon sketch silhouette',
};