import React, { useCallback } from 'react';
import { validateImageFile, readFileAsDataURL } from '../utils/fileUtils';

interface ImageUploadProps {
  onImageSelect: (imageDataUrl: string) => void;
  isProcessing: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, isProcessing }) => {
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file) {
        try {
          validateImageFile(file);
          const dataUrl = await readFileAsDataURL(file);
          onImageSelect(dataUrl);
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Failed to upload image');
        }
      }
    },
    [onImageSelect]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          validateImageFile(file);
          const dataUrl = await readFileAsDataURL(file);
          onImageSelect(dataUrl);
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Failed to upload image');
        }
      }
    },
    [onImageSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        isProcessing 
          ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed' 
          : 'border-gray-600 hover:border-gray-400 bg-black/50 cursor-pointer'
      }`}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isProcessing}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="space-y-2">
        <svg
          className="mx-auto h-12 w-12 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        
        <div>
          <p className="text-lg font-medium text-white">
            {isProcessing ? 'Processing...' : 'Upload your headshot'}
          </p>
          <p className="text-sm text-gray-400">
            Drag and drop or click to select
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPEG, PNG, or WebP (max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
};