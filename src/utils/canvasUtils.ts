import { Canvas, FabricImage, FabricText } from 'fabric';
import { CanvasPosition } from '../types';

export const createCanvas = (width: number, height: number): Canvas => {
  const canvas = new Canvas(null, {
    width,
    height,
    backgroundColor: 'white',
  });
  return canvas;
};

export const addImageToCanvas = async (
  canvas: Canvas,
  imageUrl: string,
  position: CanvasPosition
): Promise<FabricImage> => {
  const img = await FabricImage.fromURL(imageUrl);
  
  img.set({
    left: position.x,
    top: position.y,
    scaleX: position.width / (img.width || 1),
    scaleY: position.height / (img.height || 1),
  });
  
  canvas.add(img);
  return img;
};

export const addTextToCanvas = (
  canvas: Canvas,
  text: string,
  position: CanvasPosition,
  fontSize: number = 120
): FabricText => {
  const textObj = new FabricText(text, {
    left: position.x,
    top: position.y,
    fontSize,
    fontFamily: 'Arial',
  });
  
  canvas.add(textObj);
  return textObj;
};

export const exportCanvasAsJPEG = (canvas: Canvas, quality: number = 0.9): string => {
  return canvas.toDataURL({
    format: 'jpeg',
    quality,
  });
};

export const downloadImage = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};