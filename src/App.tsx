import { useState, useRef } from 'react';
import { Canvas } from 'fabric';
import { ImageUpload } from './components/ImageUpload';
import { EmojiPicker } from './components/EmojiPicker';
import { PosterPreview } from './components/PosterPreview';
import { DownloadButton } from './components/DownloadButton';
import { ImageProcessingService } from './services/imageProcessing';
import type { ProcessedImage } from './types';
import posterImage from './assets/no-emoji-BW_poster3.png';
import blackweekLogo from './assets/blackweek-logo.svg';
import { config } from './config';

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedHeadshot, setProcessedHeadshot] = useState<ProcessedImage | null>(null);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeBackground, setRemoveBackground] = useState<boolean | null>(null);
  const [imageScale, setImageScale] = useState(1.0);
  const [showBackgroundTip, setShowBackgroundTip] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select-mode' | 'upload' | 'confirm' | 'processed'>('select-mode');
  const [showRegenerateTip, setShowRegenerateTip] = useState(false);
  const canvasRef = useRef<Canvas | null>(null);

  // Initialize image processing service with API key from config
  const imageProcessor = useRef(new ImageProcessingService(config.REPLICATE_API_KEY));

  const handleImageSelect = (imageDataUrl: string) => {
    setOriginalImage(imageDataUrl);
    setUploadStep('confirm');
  };

  const handleProcessImage = async () => {
    if (originalImage && removeBackground !== null) {
      await processImage(originalImage);
      setUploadStep('processed');
    }
  };

  const processImage = async (imageDataUrl: string, isRegenerate: boolean = false) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const processed = await imageProcessor.current.processHeadshot(imageDataUrl, removeBackground ?? false, isRegenerate);
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
    setRemoveBackground(null);
    setUploadStep('select-mode');
    setShowBackgroundTip(false);
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
                Step 1: Create Your Portrait
              </h2>
              
              {/* Step 1: Choose Background Mode */}
              {uploadStep === 'select-mode' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300 mb-4">First, choose how you want your portrait to appear:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setRemoveBackground(false);
                        setUploadStep('upload');
                      }}
                      className="p-4 border-2 border-gray-700 rounded-lg hover:border-blue-500 transition-all hover:bg-gray-800"
                    >
                      <div className="text-3xl mb-2">🖼️</div>
                      <h3 className="font-bold text-white mb-1">Keep Background</h3>
                      <p className="text-xs text-gray-400"></p>
                    </button>
                    
                    <button
                      onClick={() => {
                        setRemoveBackground(true);
                        setShowBackgroundTip(true);
                        setUploadStep('upload');
                      }}
                      className="p-4 border-2 border-gray-700 rounded-lg hover:border-blue-500 transition-all hover:bg-gray-800"
                    >
                      <div className="text-3xl mb-2">✂️</div>
                      <h3 className="font-bold text-white mb-1">Remove Background</h3>
                      <p className="text-xs text-gray-400">Works best with simple backgrounds (may not be perfect)</p>
                    </button>
                  </div>
                  
                  {showBackgroundTip && removeBackground && (
                    <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-400 text-lg">⚠️</span>
                        <div className="flex-1 text-sm text-yellow-200">
                          <p className="font-semibold mb-1">Background Removal Notice:</p>
                          <p className="text-xs">AI background removal may accidentally cut parts of your image. For best results, use a photo with:</p>
                          <ul className="list-disc list-inside mt-1 text-xs ml-2">
                            <li>Good lighting and contrast</li>
                            <li>Clear separation from background</li>
                            <li>Simple, uncluttered background</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Step 2: Upload Image */}
              {uploadStep === 'upload' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-300">
                      Mode: <span className="font-semibold text-white">{removeBackground ? 'Remove Background' : 'Keep Background'}</span>
                    </p>
                    <button
                      onClick={() => {
                        setUploadStep('select-mode');
                        setShowBackgroundTip(false);
                      }}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Change mode
                    </button>
                  </div>
                  
                  <ImageUpload onImageSelect={handleImageSelect} isProcessing={false} />
                </div>
              )}
              
              {/* Step 3: Confirm and Process */}
              {uploadStep === 'confirm' && originalImage && (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={originalImage} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300">
                      Ready to process with: <span className="font-semibold text-white">{removeBackground ? 'Background Removal' : 'Original Background'}</span>
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleProcessImage}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 disabled:bg-gray-700 text-black rounded-lg font-bold transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? 'Processing...' : 'Process Image'}
                      </button>
                      <button
                        onClick={() => {
                          setOriginalImage(null);
                          setUploadStep('upload');
                        }}
                        disabled={isProcessing}
                        className="px-4 py-2 border border-gray-600 hover:bg-gray-800 text-gray-300 rounded-lg transition-colors"
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 4: Processed Result */}
              {uploadStep === 'processed' && processedHeadshot && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-green-400 font-semibold">
                      ✓ Portrait ready!
                    </p>
                    <div className="flex gap-2 items-center">
                      <div className="relative">
                        <button
                          onClick={handleRegenerate}
                          disabled={isProcessing}
                          onMouseEnter={() => setShowRegenerateTip(true)}
                          onMouseLeave={() => setShowRegenerateTip(false)}
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <span>🔄</span> Regenerate
                        </button>
                        
                        {showRegenerateTip && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45"></div>
                            <p className="text-xs text-gray-300 leading-relaxed">
                              <span className="font-semibold text-white">Tip:</span> If your portrait appears too dark or unclear, try:
                            </p>
                            <ul className="text-xs text-gray-400 mt-1 space-y-1 ml-3">
                              <li>• Regenerating for a different style</li>
                              <li>• Using a photo with better lighting</li>
                              <li>• Choosing a photo with higher contrast</li>
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          setOriginalImage(null);
                          setProcessedHeadshot(null);
                          setImageScale(1.0);
                          setUploadStep('select-mode');
                          setRemoveBackground(null);
                        }}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Portrait Size: {(imageScale * 100).toFixed(0)}%</label>
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
              removeBackground={removeBackground}
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