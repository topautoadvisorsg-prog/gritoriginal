import { useState, useCallback } from "react";

interface FighterImageUploadOptions {
  onSuccess?: (response: FighterImageUploadResponse) => void;
  onError?: (error: Error) => void;
}

interface FighterImageUploadResponse {
  fighterId: string;
  imageType: "face" | "body";
  imageUrl: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function useFighterImageUpload(options: FighterImageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: JPG, PNG, WebP`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: 5MB`;
    }
    return null;
  }, []);

  const uploadFighterImage = useCallback(
    async (
      fighterId: string,
      imageType: "face" | "body",
      file: File
    ): Promise<FighterImageUploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        setProgress(10);
        const urlResponse = await fetch("/api/fighter/image/request-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fighterId,
            imageType,
            name: file.name,
            size: file.size,
            contentType: file.type,
          }),
        });

        if (!urlResponse.ok) {
          const errorData = await urlResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get upload URL");
        }

        const { uploadURL, objectPath } = await urlResponse.json();

        setProgress(30);
        const uploadResponse = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to storage");
        }

        setProgress(70);
        const confirmResponse = await fetch("/api/fighter/image/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fighterId, imageType, objectPath }),
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to confirm upload");
        }

        const result = await confirmResponse.json();
        setProgress(100);

        const response: FighterImageUploadResponse = {
          fighterId: result.fighterId,
          imageType: result.imageType,
          imageUrl: result.imageUrl,
        };

        options.onSuccess?.(response);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [validateFile, options]
  );

  return {
    uploadFighterImage,
    isUploading,
    error,
    progress,
    ALLOWED_TYPES,
    MAX_FILE_SIZE,
  };
}
