import { VideoData } from '../types';

const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN;
const API_BASE = 'https://api.replicate.com/v1';

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: any;
  error?: string;
}

interface FaceDetectionResult {
  faces: Array<{
    bbox: [number, number, number, number]; // [x, y, width, height]
    confidence: number;
    landmarks?: Array<[number, number]>;
  }>;
}

interface FaceSwapOptions {
  sourceImage: string;
  targetImage: string;
  faceIndex?: number;
  preserveOriginalSize?: boolean;
}

// Wait for prediction to complete
const waitForPrediction = async (predictionId: string, maxWaitTime = 60000): Promise<ReplicatePrediction> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(`${API_BASE}/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check prediction status: ${response.status}`);
    }
    
    const prediction = await response.json();
    
    if (prediction.status === 'succeeded' || prediction.status === 'failed') {
      return prediction;
    }
    
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Prediction timed out');
};

// Detect faces in an image using RetinaFace
export const detectFacesInImage = async (imageUrl: string): Promise<FaceDetectionResult> => {
  try {
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    // Start face detection prediction
    const response = await fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "a4a8ba50b4a4a7dd1e0f8b0a3b3b3b3b", // RetinaFace model
        input: {
          image: imageUrl,
          confidence_threshold: 0.5,
          nms_threshold: 0.4
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Face detection failed: ${response.status} ${response.statusText}`);
    }

    const prediction = await response.json();
    const result = await waitForPrediction(prediction.id);

    if (result.status === 'failed') {
      throw new Error(`Face detection failed: ${result.error}`);
    }

    return {
      faces: result.output || []
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    // Return empty result on error to gracefully degrade
    return { faces: [] };
  }
};

// Swap faces between two images
export const swapFaces = async (options: FaceSwapOptions): Promise<string> => {
  try {
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    // Start face swap prediction
    const response = await fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "a07f252abbbd832009640b27f0997b86c2247944e09b9c6bb22faf93c0f00024", // Face swap model
        input: {
          source_image: options.sourceImage,
          target_image: options.targetImage,
          face_restore: true,
          background_enhance: true,
          face_upsample: true,
          upscale: 1,
          codeformer_fidelity: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Face swap failed: ${response.status} ${response.statusText}`);
    }

    const prediction = await response.json();
    const result = await waitForPrediction(prediction.id, 120000); // 2 minutes timeout for face swap

    if (result.status === 'failed') {
      throw new Error(`Face swap failed: ${result.error}`);
    }

    return result.output;
  } catch (error) {
    console.error('Error swapping faces:', error);
    throw error;
  }
};

// Enhanced thumbnail generation with face swap option
export const generateThumbnailWithFaceSwap = async (
  videoData: VideoData,
  backgroundImageUrl: string,
  enableFaceSwap: boolean = true
): Promise<string> => {
  try {
    if (!enableFaceSwap || !videoData.thumbnailUrl) {
      return backgroundImageUrl;
    }

    // First, detect faces in the original thumbnail
    console.log('Detecting faces in thumbnail:', videoData.thumbnailUrl);
    const faceDetection = await detectFacesInImage(videoData.thumbnailUrl);
    
    if (faceDetection.faces.length === 0) {
      console.log('No faces detected, returning background image');
      return backgroundImageUrl;
    }

    console.log(`Found ${faceDetection.faces.length} faces, performing face swap`);
    
    // Perform face swap using the first detected face
    const swappedImage = await swapFaces({
      sourceImage: videoData.thumbnailUrl,
      targetImage: backgroundImageUrl,
      faceIndex: 0
    });

    return swappedImage;
  } catch (error) {
    console.error('Error in face swap generation:', error);
    // Fallback to background image if face swap fails
    return backgroundImageUrl;
  }
};

// Remove background from an image
export const removeBackground = async (imageUrl: string): Promise<string> => {
  try {
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    const response = await fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b12e7624545", // RemBG model
        input: {
          image: imageUrl
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Background removal failed: ${response.status} ${response.statusText}`);
    }

    const prediction = await response.json();
    const result = await waitForPrediction(prediction.id);

    if (result.status === 'failed') {
      throw new Error(`Background removal failed: ${result.error}`);
    }

    return result.output;
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

// Helper function to check if Replicate is configured
export const isReplicateConfigured = (): boolean => {
  return !!REPLICATE_API_TOKEN;
};

// Test the Replicate connection
export const testReplicateConnection = async (): Promise<boolean> => {
  try {
    if (!REPLICATE_API_TOKEN) {
      return false;
    }

    const response = await fetch(`${API_BASE}/models`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error testing Replicate connection:', error);
    return false;
  }
}; 