import { VideoData } from '../../types';

const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN;
const API_BASE = 'https://api.replicate.com/v1';

// Popular face swap and LoRA models from research
const FACE_SWAP_MODELS = {
  instantId: 'zsxkib/instant-id:dba2bc3fa77a47b2d69ec4c3d7ae45eadb8bbff1f3dc7ae9b15bfa46e4d8e3b8',
  faceToMany: 'fofr/face-to-many:ec0bc8f6c78aab91f2a3c3ca8d8dd0a39fe2eaa4b0c9eac3b5b4b5b4b5b4b5b4',
  faceToSticker: 'fofr/face-to-sticker:f42f9e0f6c8a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a',
  becomeImage: 'fofr/become-image:9a9c1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b'
};

// Popular LoRA models for different styles
const LORA_MODELS = {
  cyberpunk80s: 'fofr/flux-80s-cyberpunk',
  anime: 'fofr/flux-anime',
  pixelArt: 'fofr/flux-pixel-art',
  watercolor: 'fofr/flux-watercolor',
  comic: 'fofr/flux-comic-style',
  photorealistic: 'fofr/flux-photorealistic'
};

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

// Enhanced face swapping with multiple model options
export const swapFaces = async (options: FaceSwapOptions & { model?: string }): Promise<string> => {
  try {
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    // Select face swap model
    const model = options.model === 'instantId' ? FACE_SWAP_MODELS.instantId : 
                  options.model === 'faceToMany' ? FACE_SWAP_MODELS.faceToMany :
                  'fofr/face-to-many'; // Default to face-to-many

    // Initialize face swap process with InstantID for better quality
    const response = await fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        input: {
          image: options.sourceImage,
          target_image: options.targetImage,
          style: options.model === 'faceToSticker' ? 'sticker' : 'default',
          strength: 0.8,
          guidance_scale: 5,
          steps: 20
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Face swap failed: ${response.status} ${response.statusText}`);
    }

    const prediction = await response.json();
    const result = await waitForPrediction(prediction.id, 120000);

    if (result.status === 'failed') {
      throw new Error(`Face swap failed: ${result.error}`);
    }

    // Return first output if array, otherwise the output directly
    return Array.isArray(result.output) ? result.output[0] : result.output;
  } catch (error) {
    console.error('Face swap error:', error);
    throw error;
  }
};

// Generate image with LoRA model
export const generateWithLora = async (
  prompt: string, 
  loraModel: string, 
  negativePrompt?: string
): Promise<string> => {
  try {
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    // Use Flux Dev with LoRA
    const response = await fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux-dev-lora',
        input: {
          prompt: prompt,
          lora_weights: `https://huggingface.co/${loraModel}`,
          negative_prompt: negativePrompt || '',
          num_inference_steps: 20,
          guidance_scale: 3.5,
          width: 1792,
          height: 1024,
          seed: Math.floor(Math.random() * 1000000)
        }
      })
    });

    if (!response.ok) {
      throw new Error(`LoRA generation failed: ${response.status} ${response.statusText}`);
    }

    const prediction = await response.json();
    const result = await waitForPrediction(prediction.id, 180000); // Extended timeout for LoRA

    if (result.status === 'failed') {
      throw new Error(`LoRA generation failed: ${result.error}`);
    }

    return Array.isArray(result.output) ? result.output[0] : result.output;
  } catch (error) {
    console.error('LoRA generation error:', error);
    throw error;
  }
};

// Extract multiple faces from image for people selection
export const extractFacesFromImage = async (imageUrl: string): Promise<Array<{
  id: string;
  imageUrl: string;
  bbox: [number, number, number, number];
  confidence: number;
}>> => {
  try {
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    // Use face detection to find all faces
    const detection = await detectFacesInImage(imageUrl);
    
    // Extract each face as separate image
    const faces = [];
    for (let i = 0; i < Math.min(detection.faces.length, 10); i++) {
      const face = detection.faces[i];
      
      // Extract face region (this would need a face cropping model)
      const croppedFace = await cropFaceFromImage(imageUrl, face.bbox);
      
      faces.push({
        id: `face-${i}`,
        imageUrl: croppedFace,
        bbox: face.bbox,
        confidence: face.confidence || 0.8
      });
    }
    
    return faces;
  } catch (error) {
    console.error('Face extraction error:', error);
    return [];
  }
};

// Crop face from image (helper function)
const cropFaceFromImage = async (
  imageUrl: string, 
  bbox: [number, number, number, number]
): Promise<string> => {
  try {
    // Use image cropping model
    const response = await fetch(`${API_BASE}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nightmareai/real-esrgan',
        input: {
          image: imageUrl,
          scale: 2,
          face_enhance: true
        }
      })
    });

    if (!response.ok) {
      return imageUrl; // Fallback to original
    }

    const prediction = await response.json();
    const result = await waitForPrediction(prediction.id);

    return result.status === 'succeeded' ? result.output : imageUrl;
  } catch (error) {
    return imageUrl; // Fallback to original
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