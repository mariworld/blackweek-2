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

export interface ImageEditOptions {
  seed?: number;
}

export interface ImageEditRequest {
  imageUrl: string;
  prompt: string;
  seed?: number;
}

export interface ImageEditResponse {
  success: boolean;
  outputUrl: string;
  predictionId: string;
}

export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
}

export class CudaMemoryError extends Error {
  constructor(message: string, public readonly suggestions?: string[]) {
    super(message);
    this.name = 'CudaMemoryError';
  }
}

export interface ImageProcessingError {
  type: 'cuda_memory' | 'api_error' | 'network_error' | 'unknown';
  message: string;
  details?: string;
  suggestions?: string[];
  fallbackAvailable?: boolean;
}