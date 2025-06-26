export interface MediaFile {
  file: File;
  url: string;
  type: "image" | "video";
  duration?: number;
  dimensions: { width: number; height: number };
  size: number;
  format: string;
}

export const clientMediaProcessor = {
  async processMediaFile(file: File, options?: any, onProgress?: (progress: number) => void) {
    onProgress?.(50);
    const url = URL.createObjectURL(file);
    onProgress?.(100);
    return {
      file,
      url,
      type: file.type.startsWith("image/") ? "image" : "video",
      dimensions: { width: 1280, height: 720 },
      size: file.size,
      format: file.type.split("/")[1]
    } as MediaFile;
  },
  
  isFormatSupported(file: File): boolean {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    return supportedTypes.includes(file.type);
  }
};
