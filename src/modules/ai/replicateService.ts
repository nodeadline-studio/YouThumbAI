import { VideoData } from '../../types';

const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN;
const API_BASE = 'https://api.replicate.com/v1';

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: any;
  error?: string;
}

interface FaceDetectionResult {
  faces: any[];
}

interface FaceSwapOptions {
  sourceImage: string;
  targetImage: string;
  faceIndex?: number;
}

export const isReplicateConfigured = (): boolean => {
  return !!REPLICATE_API_TOKEN;
};

// Helper function to wait for prediction completion
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
    
    // Brief pause before next status check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Prediction timed out');
};

// Face detection using RetinaFace model
export const detectFacesInImage = async (imageUrl: string): Promise<FaceDetectionResult> => {
  try {
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    // Start face detection process
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
    // Return empty result on error to gracefully degrade
    return { faces: [] };
  }
};

// Advanced face swapping between images
export const swapFaces = async (options: FaceSwapOptions): Promise<string> => {
  try {
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    // Initialize face swap process
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
    const result = await waitForPrediction(prediction.id, 120000); // Extended timeout for complex processing

    if (result.status === 'failed') {
      throw new Error(`Face swap failed: ${result.error}`);
    }

    return result.output;
  } catch (error) {
    throw error;
  }
};

// Complete thumbnail generation with optional face swap
export const generateThumbnailWithFaceSwap = async (
  videoData: VideoData,
  backgroundImageUrl: string,
  enableFaceSwap: boolean = true
): Promise<string> => {
  try {
    if (!enableFaceSwap || !videoData.thumbnailUrl) {
      return backgroundImageUrl;
    }

    // First detect faces in the original thumbnail
    const faceDetection = await detectFacesInImage(videoData.thumbnailUrl);
    
    if (faceDetection.faces.length === 0) {
      return backgroundImageUrl;
    }
    
    // Perform face swap using the detected face
    const enhancedImage = await swapFaces({
      sourceImage: videoData.thumbnailUrl,
      targetImage: backgroundImageUrl,
      faceIndex: 0
    });

    return enhancedImage;
  } catch (error) {
    // Return original background if face swap fails
    return backgroundImageUrl;
  }
};

// Background removal utility
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
    throw error;
  }
};

// Connection test utility
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
    return false;
  }
}; 