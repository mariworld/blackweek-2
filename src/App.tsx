import React, { useState, useRef } from 'react';
import { Canvas } from 'fabric';
import { ImageUpload } from './components/ImageUpload';
import { EmojiPicker } from './components/EmojiPicker';
import { PosterPreview } from './components/PosterPreview';
import { DownloadButton } from './components/DownloadButton';
import { ImageProcessingService } from './services/imageProcessing';
import { ProcessedImage } from './types';
import posterImage from './assets/no-emoji-BW_poster2.jpg';
import { config } from './config';

function App() {
  const [processedHeadshot, setProcessedHeadshot] = useState<ProcessedImage | null>(null);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<Canvas | null>(null);

  // Initialize image processing service with API key from config
  const imageProcessor = useRef(new ImageProcessingService(config.REPLICATE_API_KEY));

  const handleImageSelect = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const processed = await imageProcessor.current.processHeadshot(imageDataUrl);
      setProcessedHeadshot(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      console.error('Image processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (selectedEmojis.length < 4) {
      setSelectedEmojis([...selectedEmojis, emoji]);
    } else {
      alert('You can add up to 4 emojis only');
    }
  };

  const removeEmoji = (index: number) => {
    setSelectedEmojis(selectedEmojis.filter((_, i) => i !== index));
  };

  const resetPoster = () => {
    setProcessedHeadshot(null);
    setSelectedEmojis([]);
    setError(null);
  };

  const canDownload = processedHeadshot !== null || selectedEmojis.length > 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
            BLACKWEEK 2025
          </h1>
          <p className="text-sm sm:text-lg text-gray-400 uppercase tracking-wider">
            Poster Customizer
          </p>
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
            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Step 1: Upload Your Headshot
              </h2>
              <ImageUpload onImageSelect={handleImageSelect} isProcessing={isProcessing} />
              
              {processedHeadshot && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-green-400 font-medium">
                    ✓ Headshot processed successfully
                  </p>
                  <button
                    onClick={() => setProcessedHeadshot(null)}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Change photo
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Step 2: Add Emojis ({selectedEmojis.length}/4)
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
                className="px-6 py-3 rounded-lg font-semibold text-white bg-gray-800 hover:bg-gray-700 transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4 text-white text-center lg:text-left">
              Preview
            </h2>
            <PosterPreview
              posterImage={posterImage}
              headshot={processedHeadshot}
              emojis={selectedEmojis}
              canvasRef={canvasRef}
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