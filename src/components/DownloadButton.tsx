import React from 'react';
import { Canvas } from 'fabric';
import { downloadImage } from '../utils/canvasUtils';

interface DownloadButtonProps {
  canvasRef: React.MutableRefObject<Canvas | null>;
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ canvasRef, disabled }) => {
  const handleDownload = () => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL({
      format: 'jpeg',
      quality: 0.95,
      multiplier: 2, // Higher resolution for download
    });

    const filename = `blackweek-2025-custom-${Date.now()}.jpg`;
    downloadImage(dataUrl, filename);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
        disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
          : 'bg-white text-black hover:bg-gray-200 active:scale-95'
      }`}
    >
      Download Poster
    </button>
  );
};