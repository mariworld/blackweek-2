import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, FabricText } from 'fabric';
import type { ProcessedImage } from '../types';

interface PosterPreviewProps {
  posterImage: string;
  headshot: ProcessedImage | null;
  emojis: string[];
  canvasRef: React.MutableRefObject<Canvas | null>;
  imageScale?: number;
}

export const PosterPreview: React.FC<PosterPreviewProps> = ({
  posterImage,
  headshot,
  emojis,
  canvasRef,
  imageScale = 1.0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1066 });

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const aspectRatio = 800 / 1066;
        const newWidth = Math.min(containerWidth - 32, 800); // 32px for padding
        const newHeight = newWidth / aspectRatio;
        setCanvasSize({ width: newWidth, height: newHeight });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    if (!fabricCanvasRef.current || !containerRef.current) return;

    // Initialize Fabric canvas
    const canvas = new Canvas(fabricCanvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: 'white',
      selection: true,
    });

    canvasRef.current = canvas;

    // Load base poster
    FabricImage.fromURL(posterImage).then((img) => {
      if (!img) return;
      
      img.set({
        left: 0,
        top: 0,
        scaleX: canvasSize.width / (img.width || 1),
        scaleY: canvasSize.height / (img.height || 1),
        selectable: false,
        evented: false,
      });
      
      canvas.add(img);
      canvas.sendObjectToBack(img);
    });

    return () => {
      canvas.dispose();
    };
  }, [posterImage, canvasRef, canvasSize]);

  useEffect(() => {
    if (!canvasRef.current || !headshot) return;

    // Remove existing headshot if any
    const existingHeadshot = canvasRef.current.getObjects().find(
      obj => (obj as any).data?.type === 'headshot'
    );
    if (existingHeadshot) {
      canvasRef.current.remove(existingHeadshot);
    }

    // Add processed headshot
    FabricImage.fromURL(headshot.processed).then((img) => {
      if (!img) return;
      
      // Scale proportionally to canvas size and apply user scale
      const scale = canvasSize.width / 800;
      const targetWidth = 200 * scale * imageScale;
      const imgScale = targetWidth / (img.width || 1);
      
      img.set({
        left: 250 * scale,
        top: 200 * scale,
        scaleX: imgScale,
        scaleY: imgScale,
        data: { type: 'headshot' },
        selectable: true,
        evented: true,
        hasControls: false,
        hasBorders: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
      });
      
      canvasRef.current?.add(img);
    });
  }, [headshot, canvasRef, canvasSize, imageScale]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get existing emoji objects
    const existingEmojiObjects = canvasRef.current.getObjects().filter(
      obj => (obj as any).data?.type === 'emoji'
    );
    
    // Create a map of existing emojis by their index
    const existingMap = new Map<number, any>();
    existingEmojiObjects.forEach(obj => {
      const index = (obj as any).data?.index;
      if (index !== undefined) {
        existingMap.set(index, obj);
      }
    });

    // Scale factor for responsive sizing
    const scale = canvasSize.width / 800;

    // Add only new emojis
    emojis.forEach((emoji, index) => {
      if (!existingMap.has(index)) {
        const emojiText = new FabricText(emoji, {
          left: (500 + (index % 2) * 150) * scale,
          top: (300 + Math.floor(index / 2) * 120) * scale,
          fontSize: 100 * scale,
          fontFamily: 'Arial',
          data: { type: 'emoji', index },
          selectable: true,
          evented: true,
          hasControls: false,
          hasBorders: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
        });
        
        canvasRef.current?.add(emojiText);
      }
    });
    
    // Remove emojis that are no longer in the selection
    existingEmojiObjects.forEach(obj => {
      const index = (obj as any).data?.index;
      if (index === undefined || index >= emojis.length) {
        canvasRef.current?.remove(obj);
      }
    });
  }, [emojis, canvasRef, canvasSize]);

  return (
    <div ref={containerRef} className="bg-black/50 rounded-lg p-4 shadow-inner">
      <div className="flex justify-center">
        <canvas 
          ref={fabricCanvasRef} 
          className="max-w-full h-auto shadow-xl rounded"
          style={{ maxHeight: '70vh' }}
        />
      </div>
      {(headshot || emojis.length > 0) && (
        <p className="text-sm text-gray-400 mt-3 text-center">
          Click and drag elements to reposition them
        </p>
      )}
    </div>
  );
};