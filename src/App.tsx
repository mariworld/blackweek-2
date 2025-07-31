import { useState, useRef } from 'react';
import { Canvas } from 'fabric';
import { ImageUpload } from './components/ImageUpload';
import { EmojiPicker } from './components/EmojiPicker';
import { PosterPreview } from './components/PosterPreview';
import { DownloadButton } from './components/DownloadButton';
import { ImageProcessingService } from './services/imageProcessing';
import type { ProcessedImage } from './types';
import posterImage from './assets/no-emoji-BW_poster2.jpg';
import blackweekLogo from './assets/blackweek-logo.svg';
import { config } from './config';

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedHeadshot, setProcessedHeadshot] = useState<ProcessedImage | null>(null);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [imageScale, setImageScale] = useState(1.0);
  const [showBackgroundTip, setShowBackgroundTip] = useState(false);
  const canvasRef = useRef<Canvas | null>(null);

  // Initialize image processing service with API key from config
  const imageProcessor = useRef(new ImageProcessingService(config.REPLICATE_API_KEY));

  const handleImageSelect = async (imageDataUrl: string) => {
    setOriginalImage(imageDataUrl);
    await processImage(imageDataUrl);
  };

  const processImage = async (imageDataUrl: string, isRegenerate: boolean = false) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const processed = await imageProcessor.current.processHeadshot(imageDataUrl, removeBackground, isRegenerate);
      setProcessedHeadshot(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      console.error('Image processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerate = async () => {
    if (originalImage) {
      await processImage(originalImage, true);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmojis([...selectedEmojis, emoji]);
  };

  const removeEmoji = (index: number) => {
    setSelectedEmojis(selectedEmojis.filter((_, i) => i !== index));
  };

  const resetPoster = () => {
    setOriginalImage(null);
    setProcessedHeadshot(null);
    setSelectedEmojis([]);
    setError(null);
    setImageScale(1.0);
  };

  const canDownload = processedHeadshot !== null || selectedEmojis.length > 0;

  return (
    <div className="min-h-screen bg-black text-white font-suisse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={blackweekLogo} 
              alt="BLACKWEEK 2025" 
              className="h-12 sm:h-16 lg:h-20 w-auto"
            />
          </div>
          {!config.REPLICATE_API_KEY && (
            <p className="text-xs text-yellow-500 mt-2">
              Using local sketch filter (Replicate API key not configured)
            </p>
          )}
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 max-w-2xl mx-auto">
            <p className="font-medium">Error: {error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="border border-gray-800 rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-white">
                Step 1: Upload Your Headshot
              </h2>
              <ImageUpload onImageSelect={handleImageSelect} isProcessing={isProcessing} />
              
              <div className="mt-4">
                <div className="relative">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={removeBackground}
                      onChange={(e) => {
                        setRemoveBackground(e.target.checked);
                        if (e.target.checked && !showBackgroundTip) {
                          setShowBackgroundTip(true);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                      disabled={isProcessing}
                    />
                    <span className="text-gray-300 flex items-center gap-1">
                      Remove background after AI processing
                      <button
                        type="button"
                        onClick={() => setShowBackgroundTip(!showBackgroundTip)}
                        className="text-gray-400 hover:text-gray-200 ml-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </span>
                  </label>
                  
                  {showBackgroundTip && (
                    <div className="absolute z-10 mt-2 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-bold text-white">Background Removal Tips</h4>
                        <button
                          onClick={() => setShowBackgroundTip(false)}
                          className="text-gray-400 hover:text-white ml-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-2 text-xs text-gray-300">
                        <p>⚠️ <span className="font-semibold">Important:</span> Background removal may accidentally cut parts of your image.</p>
                        <p>For best results:</p>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                          <li>Use a clean, well-lit headshot</li>
                          <li>Ensure good contrast between you and the background</li>
                          <li>Avoid busy patterns or similar colors to the background</li>
                          <li>Center yourself in the frame with some space around</li>
                        </ul>
                        <p className="mt-2 text-yellow-400">💡 Tip: If important parts get cut, try disabling background removal and using a plain background instead.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {processedHeadshot && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-green-400 font-semibold">
                      ✓ Headshot processed successfully
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRegenerate}
                        disabled={isProcessing}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={() => {
                          setOriginalImage(null);
                          setProcessedHeadshot(null);
                          setImageScale(1.0);
                        }}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Change photo
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Image Scale: {(imageScale * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={imageScale}
                      onChange={(e) => setImageScale(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>50%</span>
                      <span>100%</span>
                      <span>200%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-gray-800 rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-white">
                Step 2: Add Emojis ({selectedEmojis.length})
              </h2>
              <EmojiPicker
                selectedEmojis={selectedEmojis}
                onEmojiSelect={handleEmojiSelect}
              />
              {selectedEmojis.length > 0 && (
                <div className="mt-4 p-3 bg-black/50 rounded border border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Selected emojis (click to remove):</p>
                  <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                    {selectedEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => removeEmoji(index)}
                        className="text-2xl p-2 bg-gray-800 rounded hover:bg-red-900/50 transition-colors"
                        title="Click to remove"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <DownloadButton canvasRef={canvasRef} disabled={!canDownload} />
              <button
                onClick={resetPoster}
                className="px-6 py-3 rounded-lg font-bold text-white bg-gray-800 hover:bg-gray-700 transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="border border-gray-800 rounded-lg shadow-xl p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-4 text-white text-center lg:text-left">
              Preview
            </h2>
            <PosterPreview
              posterImage={posterImage}
              headshot={processedHeadshot}
              emojis={selectedEmojis}
              canvasRef={canvasRef}
              imageScale={imageScale}
            />
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p className="font-bold">BLACKWEEK 2025</p>
          <p>Economic Forum & Culture Festival</p>
          <p className="mt-1">Oct 6-9 • NYC</p>
        </footer>
      </div>
    </div>
  );
}

export default App;