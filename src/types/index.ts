export interface ProcessedImage {
  original: string;
  processed: string;
  width: number;
  height: number;
}

export interface PosterCustomization {
  headshot: ProcessedImage | null;
  emoji: string | null;
}

export interface CanvasPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}