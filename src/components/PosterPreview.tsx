import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, FabricText } from 'fabric';
import type { ProcessedImage } from '../types';

interface PosterPreviewProps {
  posterImage: string;
  headshot: ProcessedImage | null;
  emojis: string[];
  canvasRef: React.MutableRefObject<Canvas | null>;
  imageScale?: number;
  removeBackground?: boolean | null;
}

export const PosterPreview: React.FC<PosterPreviewProps> = ({
  posterImage,
  headshot,
  emojis,
  canvasRef,
  imageScale = 1.0,
  removeBackground,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1066 });
  const [showDragHint, setShowDragHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Auto-hide drag hint after 5 seconds
  useEffect(() => {
    if (showDragHint && (headshot || emojis.length > 0)) {
      const timer = setTimeout(() => {
        setShowDragHint(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showDragHint, headshot, emojis]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let lastWidth = window.innerWidth;
    
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const aspectRatio = 800 / 1066;
        const newWidth = Math.min(containerWidth - 32, 800); // 32px for padding
        const newHeight = newWidth / aspectRatio;
        setCanvasSize({ width: newWidth, height: newHeight });
      }
    };

    const handleResize = () => {
      // Only handle actual window width changes, not height changes from mobile browser UI
      const currentWidth = window.innerWidth;
      if (Math.abs(currentWidth - lastWidth) > 10) {
        lastWidth = currentWidth;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updateCanvasSize, 300);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
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

  // Track user interactions in a separate effect
  useEffect(() => {
    if (!canvasRef.current) return;

    const handleObjectMoving = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        setShowDragHint(false);
      }
    };

    canvasRef.current.on('object:moving', handleObjectMoving);

    return () => {
      canvasRef.current?.off('object:moving', handleObjectMoving);
    };
  }, [hasInteracted]);

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
      
      // Center the image on the canvas and move it up by 125 units
      const centerX = (canvasSize.width / 2) - ((img.width || 0) * imgScale / 2);
      const centerY = (canvasSize.height / 2) - ((img.height || 0) * imgScale / 2) - (125 * scale);
      
      img.set({
        left: centerX,
        top: centerY,
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
        stroke: removeBackground === false ? 'black' : undefined,
        strokeWidth: removeBackground === false ? 2 : 0,
        borderColor: '#60A5FA',
        borderScaleFactor: 2,
        cornerColor: '#60A5FA',
        cornerSize: 8,
        transparentCorners: false,
      });
      
      canvasRef.current?.add(img);
    });
  }, [headshot, canvasRef, canvasSize, imageScale, removeBackground]);

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

    // Define preset positions for up to 5 emojis
    const presetPositions = [
      { left: 200, top: 780 },  // 1st emoji: bottom left
      { left: 625, top: 300 },  // 2nd emoji: mid right
      { left: 560, top: 380 },  // 3rd emoji: mid right
      { left: 525, top: 470 },  // 4th emoji: mid right
      { left: 650, top: 490 },  // 5th emoji: mid right
    ];

    // Add only new emojis
    emojis.forEach((emoji, index) => {
      if (!existingMap.has(index) && index < 5) {
        const position = presetPositions[index];
        // First emoji is larger (100), emojis 2-5 are smaller (60)
        const emojiSize = index === 0 ? 130 : 60;
        const emojiText = new FabricText(emoji, {
          left: position.left * scale,
          top: position.top * scale,
          fontSize: emojiSize * scale,
          fontFamily: 'Arial',
          data: { type: 'emoji', index },
          selectable: true,
          evented: true,
          hasControls: false,
          hasBorders: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          borderColor: '#60A5FA',
          borderScaleFactor: 2,
          cornerColor: '#60A5FA',
          cornerSize: 8,
          transparentCorners: false,
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
    <div ref={containerRef} className="bg-black/50 rounded-lg p-4 shadow-inner relative">
      {/* Animated hint overlay */}
      {showDragHint && (headshot || emojis.length > 0) && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="bg-black/80 rounded-lg p-6 max-w-sm mx-4 animate-pulse">
            <div className="text-center">
              <div className="text-4xl mb-3">👆</div>
              <h3 className="text-white font-bold text-lg mb-2">Drag & Drop to Customize!</h3>
              <p className="text-gray-300 text-sm">
                Click and drag your photo and emojis to position them exactly where you want on the poster
              </p>
              <p className="text-gray-400 text-xs mt-2">
                This message will disappear once you start dragging
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-center relative">
        <canvas 
          ref={fabricCanvasRef} 
          className="max-w-full h-auto shadow-xl rounded"
          style={{ 
            maxHeight: '70vh',
            touchAction: 'manipulation' // Allow touch but prevent unwanted gestures
          }}
        />
      </div>
      
      {(headshot || emojis.length > 0) && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-2xl">💡</span>
            <p className="text-white font-medium">
              Pro tip: Drag elements to reposition them on your poster!
            </p>
          </div>
          
          {!hasInteracted && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 mx-auto max-w-md">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-lg">ℹ️</span>
                <div className="text-xs text-blue-200">
                  <p className="font-semibold mb-1">How to customize your poster:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Click on any photo or emoji</li>
                    <li>Drag it to your desired position</li>
                    <li>Release to place it there</li>
                    <li>You can reposition elements as many times as you want!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};