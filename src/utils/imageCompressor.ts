/**
 * Image compression and validation utility for CLO.EAST
 * Reduces image size client-side for blazing fast uploads to Firebase Storage
 */

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compresses an image file in-browser using HTML5 Canvas
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<CompressionResult> {
  const originalSize = file.size;

  // If already tiny (< 80KB) or non-standard format
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    const previewUrl = URL.createObjectURL(file);
    return {
      file,
      previewUrl,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio bounded dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const previewUrl = URL.createObjectURL(file);
          resolve({
            file,
            previewUrl,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 0,
          });
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        const outputFormat = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const previewUrl = URL.createObjectURL(file);
              resolve({
                file,
                previewUrl,
                originalSize,
                compressedSize: originalSize,
                compressionRatio: 0,
              });
              return;
            }

            const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const compressedFileName = `${cleanBase}_opt.jpg`;
            const compressedFile = new File([blob], compressedFileName, {
              type: outputFormat,
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);
            const compressedSize = compressedFile.size;
            const compressionRatio = Math.round(
              ((originalSize - compressedSize) / originalSize) * 100
            );

            resolve({
              file: compressedFile,
              previewUrl,
              originalSize,
              compressedSize,
              compressionRatio: Math.max(0, compressionRatio),
            });
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => {
        const previewUrl = URL.createObjectURL(file);
        resolve({
          file,
          previewUrl,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 0,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      const previewUrl = URL.createObjectURL(file);
      resolve({
        file,
        previewUrl,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
      });
    };

    reader.readAsDataURL(file);
  });
}
