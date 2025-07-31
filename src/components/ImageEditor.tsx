import React, { useState } from 'react';
import { imageEditingService } from '../services/imageEditingService';

export const ImageEditor: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setEditedImageUrl(null);
      setError(null);
    }
  };

  const handleEdit = async () => {
    if (!imageFile || !prompt) {
      setError('Please select an image and enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert file to data URL
      const imageDataUrl = await imageEditingService.fileToDataUrl(imageFile);
      
      // Edit the image
      const editedUrl = await imageEditingService.editImage(imageDataUrl, prompt);
      
      setEditedImageUrl(editedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit image');
      console.error('Edit error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">FLUX Kontext Pro Image Editor</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Edit Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the changes you want to make (e.g., 'make it a watercolor painting', 'add a sunset background', 'turn into a pencil sketch')"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            rows={3}
          />
        </div>

        <button
          onClick={handleEdit}
          disabled={isLoading || !imageFile || !prompt}
          className="bg-violet-600 text-white px-6 py-2 rounded-md hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Edit Image'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {imageFile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Original</h3>
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Original"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            {editedImageUrl && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Edited</h3>
                <img
                  src={editedImageUrl}
                  alt="Edited"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};