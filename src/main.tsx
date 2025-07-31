import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

declare global {
  interface Window {
    SelfieSegmentation: any;
  }
}

// Ensure MediaPipe is loaded before rendering the app
const initializeApp = async () => {
  // Log initial state
  console.log('Initializing app...');
  console.log('MediaPipe available on load:', typeof window.SelfieSegmentation !== 'undefined');
  
  // Give MediaPipe scripts time to load if not available immediately
  if (typeof window.SelfieSegmentation === 'undefined') {
    console.log('Waiting for MediaPipe to load...');
    let attempts = 0;
    while (typeof window.SelfieSegmentation === 'undefined' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    console.log(`MediaPipe loaded after ${attempts * 100}ms:`, typeof window.SelfieSegmentation !== 'undefined');
  }
  
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Start the app
initializeApp().catch(console.error);
