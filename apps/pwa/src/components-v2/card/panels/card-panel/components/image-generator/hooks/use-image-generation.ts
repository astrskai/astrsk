import { useState, useCallback } from 'react';
import { UniqueEntityID } from '@/shared/domain';
import { GeneratedImageService } from '@/app/services/generated-image-service';
import { toast } from 'sonner';
import { useNanoBananaGenerator } from '@/app/hooks/use-nano-banana-generator';
import { useSeedreamGenerator } from '@/app/hooks/use-seedream-generator';
import { IMAGE_MODELS } from '@/app/stores/model-store';

interface ImageGenerationConfig {
  prompt: string;
  userPrompt?: string; // Original user prompt for display
  style?: string;
  aspectRatio?: string;
  imageToImage: boolean;
  imageUrl?: string;
  selectedModel: string;
}

interface UseImageGenerationProps {
  cardId?: string;
  onSuccess?: () => void;
}

interface UseImageGenerationReturn {
  isGeneratingImage: boolean;
  generateImage: (config: ImageGenerationConfig) => Promise<void>;
}

export const useImageGeneration = ({
  cardId,
  onSuccess
}: UseImageGenerationProps): UseImageGenerationReturn => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Nano banana generator hook
  const { generateCustomImage, generateImageToImage } = useNanoBananaGenerator();
  
  // Seedream generator hook
  const { generateSeedreamImage, generateSeedreamImageToImage } = useSeedreamGenerator();

  // Helper to convert URL to base64 with aggressive size reduction
  const urlToBase64 = useCallback(async (url: string): Promise<{ base64: string; mimeType: string }> => {
    // If the URL is already a base64 data URL, extract and reprocess it
    if (url.startsWith('data:')) {
      // Extract the actual base64 data
      const base64Match = url.match(/base64,(.+)/);
      if (base64Match) {
        // Convert base64 back to blob to reprocess
        const base64 = base64Match[1];
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        url = URL.createObjectURL(blob);
      }
    }
    
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Create canvas to resize image very aggressively
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      
      img.onload = () => {
        // Set small dimensions - max 256px for better quality while staying under token limit
        const MAX_SIZE = 256*4;
        let { width, height } = img;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress very aggressively - ensure white background for JPEG
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fillRect(0, 0, width, height);
        ctx!.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with very high compression (0.1 quality) - ALWAYS as JPEG
        canvas.toBlob(
          (compressedBlob) => {
            if (!compressedBlob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1];
              const mimeType = 'image/jpeg'; // Always return JPEG
              
              resolve({ base64, mimeType });
            };
            reader.onerror = reject;
            reader.readAsDataURL(compressedBlob);
          },
          'image/jpeg', // Force JPEG output
          0.1 // Very low quality for maximum compression
        );
      };
      
      img.onerror = reject;
      img.crossOrigin = 'anonymous'; // Handle CORS
      img.src = url;
    });
  }, []);

  const generateImage = useCallback(async (config: ImageGenerationConfig) => {
    setIsGeneratingImage(true);
    
    try {
      let result;
      
      // Check which model to use
      if (config.selectedModel === IMAGE_MODELS.SEEDDREAM_4_0) {
        // Use Seedream generator
        if (config.imageToImage && config.imageUrl) {
          // Image-to-image generation with base64
          const { base64, mimeType } = await urlToBase64(config.imageUrl);
          result = await generateSeedreamImageToImage({
            prompt: config.prompt,
            image: `data:${mimeType};base64,${base64}`,
            size: "1368x2048",
            watermark: true
          });
        } else {
          // Text-to-image generation
          result = await generateSeedreamImage({
            prompt: config.prompt,
            size: "1368x2048",
            watermark: true,
            sequentialImageGeneration: "disabled"
          });
        }
      } else {
        // Use Nano Banana generator (default)
        if (config.imageToImage && config.imageUrl) {
          // Image-to-image generation with base64
          const { base64, mimeType } = await urlToBase64(config.imageUrl);
          result = await generateImageToImage({
            inputImageBase64: base64,
            inputImageMimeType: mimeType,
            prompt: config.prompt,
            style: config.style,
            aspectRatio: config.aspectRatio,
          });
        } else {
          // Text-to-image generation
          result = await generateCustomImage({
            prompt: config.prompt,
            style: config.style,
            aspectRatio: config.aspectRatio,
          });
        }
      }

      if (!result) {
        throw new Error("No result from generation");
      }

      // Check for success flag if present
      if ('success' in result && !result.success) {
        throw new Error(result.error || "Generation failed");
      }

      console.log('Generation result:', result);

      // Handle different response formats
      let imageData;
      
      if (result.images && result.images.length > 0) {
        // Nano Banana and Seedream return array of images
        imageData = result.images[0];
        console.log('Using first image from array:', imageData);
      } else if (result.image) {
        // Some APIs return single image
        imageData = result.image;
        console.log('Using single image:', imageData);
      } else {
        console.error('No image found in result:', result);
        throw new Error("No image generated");
      }

      // Fetch the image from Convex storage URL
      console.log('Fetching from Convex storage:', imageData.url);
      const response = await fetch(imageData.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      
      const file = new File([blob], `generated-${Date.now()}.${imageData.format || 'png'}`, { 
        type: imageData.mimeType || blob.type || 'image/png' 
      });
      
      // Save the generated image with the original user prompt for display
      const saveResult = await GeneratedImageService.saveFileToGeneratedImage.execute({
        file,
        prompt: config.userPrompt || config.prompt, // Use original user prompt if provided
        style: config.style,
        aspectRatio: config.aspectRatio,
        associatedCardId: cardId ? new UniqueEntityID(cardId) : undefined,
      });

      if (saveResult.isSuccess) {
        console.log('Image saved successfully, calling onSuccess callback');
        onSuccess?.();
        toast.success('Image generated successfully!');
      } else {
        console.error('Failed to save image:', saveResult.getError());
        throw new Error(saveResult.getError() || 'Failed to save generated image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  }, [cardId, generateCustomImage, generateImageToImage, generateSeedreamImage, generateSeedreamImageToImage, onSuccess, urlToBase64]);

  return {
    isGeneratingImage,
    generateImage
  };
};