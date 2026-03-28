import { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/shared/components/ui/slider';

interface ImageCropDialogProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  imageType: 'face' | 'body';
  onCropComplete: (blob: Blob) => Promise<void>;
}

const TARGET_DIMENSIONS = {
  face: { width: 400, height: 400, aspect: 1 },
  body: { width: 400, height: 600, aspect: 2 / 3 },
};

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedBlob(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  targetWidth: number,
  targetHeight: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      'image/jpeg',
      0.92
    );
  });
}

export const ImageCropDialog = ({
  open,
  onClose,
  imageSrc,
  imageType,
  onCropComplete,
}: ImageCropDialogProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [zoomPct, setZoomPct] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  const { aspect, width: targetWidth, height: targetHeight } = TARGET_DIMENSIONS[imageType];

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    },
    [aspect]
  );

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop, targetWidth, targetHeight);
      await onCropComplete(blob);
      onClose();
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const label = imageType === 'face' ? 'Face (400×400)' : 'Body (400×600)';
  const imgStyle: React.CSSProperties = { width: `${zoomPct}%`, maxWidth: 'none' };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image — {label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drag the crop box to frame the image. The crop is locked to the correct aspect ratio.
          </p>

          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              min={50}
              max={300}
              step={5}
              value={[zoomPct]}
              onValueChange={([v]) => setZoomPct(v)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {zoomPct}%
            </span>
          </div>

          <div className="overflow-auto rounded-lg border border-border bg-muted/30 max-h-[50vh]">
            <ReactCrop
              crop={crop}
              onChange={(_, pct) => setCrop(pct)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              keepSelection
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={imgStyle}
              />
            </ReactCrop>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing || !completedCrop}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Confirm & Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
