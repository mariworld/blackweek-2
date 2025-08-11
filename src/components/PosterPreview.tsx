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
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 1066;
  const [scale, setScale] = useState(1);
  const [showDragHint, setShowDragHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);

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
    
    const updateScale = () => {
      if (containerRef.current) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const containerWidth = containerRef.current.offsetWidth;
        
        // Simple device detection
        const isMobile = viewportWidth < 768;
        const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
        
        let finalScale;
        
        if (isMobile) {
          // MOBILE: Fit width completely with more padding for comfortable viewing
          const padding = 60; // Increased padding for smaller poster
          const targetWidth = viewportWidth - padding;
          finalScale = targetWidth / CANVAS_WIDTH;
          
          // Don't let it get too small
          const minScale = 0.35; // Minimum 35% of original size
          finalScale = Math.max(finalScale, minScale);
          
          // Cap the scale to ensure it fits horizontally with room to spare
          const maxMobileScale = (viewportWidth - 50) / CANVAS_WIDTH;
          finalScale = Math.min(finalScale, maxMobileScale);
          
          // Show scroll hint if needed for vertical scrolling
          if (CANVAS_HEIGHT * finalScale > viewportHeight * 0.7) {
            setShowScrollHint(true);
            setTimeout(() => setShowScrollHint(false), 5000);
          }
        } else if (isTablet) {
          // TABLET: Balance between width and height
          const padding = 32;
          const maxWidth = Math.min(containerWidth - padding, 700);
          const maxHeight = viewportHeight * 0.65;
          
          const scaleX = maxWidth / CANVAS_WIDTH;
          const scaleY = maxHeight / CANVAS_HEIGHT;
          finalScale = Math.min(scaleX, scaleY, 1);
        } else {
          // DESKTOP: Original sizing
          const padding = 32;
          const maxWidth = Math.min(containerWidth - padding, CANVAS_WIDTH);
          const maxHeight = viewportHeight * 0.7;
          
          const scaleX = maxWidth / CANVAS_WIDTH;
          const scaleY = maxHeight / CANVAS_HEIGHT;
          finalScale = Math.min(scaleX, scaleY, 1);
        }
        
        setScale(finalScale);
      }
    };

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScale, 100);
    };

    const handleOrientationChange = () => {
      // Force immediate update on orientation change
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScale, 200);
    };

    updateScale();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvasRef.current || !containerRef.current) return;

    // Initialize Fabric canvas with scaled dimensions
    const canvas = new Canvas(fabricCanvasRef.current, {
      width: CANVAS_WIDTH * scale,
      height: CANVAS_HEIGHT * scale,
      backgroundColor: 'white',
      selection: true,
    });
    
    // Set CSS size to match
    canvas.setDimensions({
      width: CANVAS_WIDTH * scale,
      height: CANVAS_HEIGHT * scale
    });

    canvasRef.current = canvas;

    // Load base poster
    FabricImage.fromURL(posterImage).then((img) => {
      if (!img) return;
      
      img.set({
        left: 0,
        top: 0,
        scaleX: (CANVAS_WIDTH * scale) / (img.width || 1),
        scaleY: (CANVAS_HEIGHT * scale) / (img.height || 1),
        selectable: false,
        evented: false,
      });
      
      canvas.add(img);
      canvas.sendObjectToBack(img);
    });

    return () => {
      canvas.dispose();
    };
  }, [posterImage, canvasRef, scale]);

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

  // Handle headshot addition/update
  useEffect(() => {
    if (!canvasRef.current || !headshot) return;

    // Check if headshot already exists
    const existingHeadshot = canvasRef.current.getObjects().find(
      obj => (obj as any).data?.type === 'headshot'
    );

    if (existingHeadshot) {
      // Just update the scale of existing headshot
      const targetWidth = 200 * imageScale * scale;
      const imgScale = targetWidth / ((existingHeadshot as any).width || 1);
      
      // Get current position or calculate new center
      const currentLeft = existingHeadshot.left || 0;
      const currentTop = existingHeadshot.top || 0;
      
      // Only recenter if it's at the default position (hasn't been moved by user)
      const isAtDefaultPosition = !existingHeadshot.get('hasMoved');
      
      if (isAtDefaultPosition) {
        const centerX = ((CANVAS_WIDTH * scale) / 2) - (((existingHeadshot as any).width || 0) * imgScale / 2);
        const centerY = ((CANVAS_HEIGHT * scale) / 2) - (((existingHeadshot as any).height || 0) * imgScale / 2) - (125 * scale);
        existingHeadshot.set({
          left: centerX,
          top: centerY,
        });
      }
      
      existingHeadshot.set({
        scaleX: imgScale,
        scaleY: imgScale,
      });
      
      canvasRef.current.renderAll();
    } else {
      // Remove any duplicate headshots first
      const duplicates = canvasRef.current.getObjects().filter(
        obj => (obj as any).data?.type === 'headshot'
      );
      duplicates.forEach(obj => {
        canvasRef.current?.remove(obj);
      });
      
      // Add new headshot
      FabricImage.fromURL(headshot.processed).then((img) => {
        if (!img || !canvasRef.current) return;
        
        // Check one more time for duplicates before adding
        const existingNow = canvasRef.current.getObjects().find(
          obj => (obj as any).data?.type === 'headshot'
        );
        if (existingNow) return; // Don't add if one already exists
        
        // Apply user scale with canvas scale
        const targetWidth = 200 * imageScale * scale;
        const imgScale = targetWidth / (img.width || 1);
        
        // Center the image on the canvas and move it up by 125 units
        const centerX = ((CANVAS_WIDTH * scale) / 2) - ((img.width || 0) * imgScale / 2);
        const centerY = ((CANVAS_HEIGHT * scale) / 2) - ((img.height || 0) * imgScale / 2) - (125 * scale);
        
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
          stroke: removeBackground === false ? '#ececed' : undefined,
          strokeWidth: removeBackground === false ? 2 : 0,
          borderColor: '#f8f8fa',
          borderScaleFactor: 2,
          cornerColor: '#60A5FA',
          cornerSize: 8,
          transparentCorners: false,
          hasMoved: false, // Track if user has moved it
        });
        
        // Listen for when user moves the image
        img.on('modified', () => {
          img.set('hasMoved', true);
        });
        
        canvasRef.current.add(img);
      });
    }
  }, [headshot, canvasRef, imageScale, removeBackground, scale]);

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

    // No scaling needed - canvas is fixed size

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
  }, [emojis, canvasRef, scale]);

  return (
    <div ref={containerRef} className="bg-black/50 rounded-lg p-2 sm:p-4 shadow-inner relative w-full max-w-full">
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
      
      <div className="relative w-full">
        {showScrollHint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-blue-600/90 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-2 animate-pulse">
            <span>👇</span>
            <span>Scroll to see full poster</span>
          </div>
        )}
        <div 
          className="w-full" 
          style={{ 
            maxHeight: '75vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div 
            style={{ 
              width: `${CANVAS_WIDTH * scale}px`,
              height: `${CANVAS_HEIGHT * scale}px`,
              margin: '0 auto',
              position: 'relative',
            }}
          >
            <canvas 
              ref={fabricCanvasRef} 
              className="shadow-xl rounded"
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${CANVAS_WIDTH * scale}px`,
                height: `${CANVAS_HEIGHT * scale}px`,
                touchAction: 'manipulation',
              }}
            />
          </div>
        </div>
      </div>
      
      {(headshot || emojis.length > 0) && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-2xl">💡</span>
            <p className="text-white font-medium">
              Pro tip: Drag headshot/emojis to reposition them on your poster!
            </p>
          </div>
          
          {!hasInteracted && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 mx-auto max-w-md">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-lg">ℹ️</span>
                <div className="text-xs text-blue-200">
                  <p className="font-semibold mb-1">How to customize your poster:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Click on any photo or emoji</li>
                    <li>Drag it to your desired position</li>
                    <li>Release to place it there</li>
                    <li>You can reposition emoji and headshot as many times as you want!</li>
                    <li className="text-yellow-300 font-semibold">⚠️ WARNING: Headshots & emoji should not be moved to cover up the words/brand assets</li>
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