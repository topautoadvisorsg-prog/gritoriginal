import { useState, useRef } from 'react';
import { Fighter } from '@/shared/types/fighter';
import { Button } from '@/shared/components/ui/button';
import { TabsContent } from '@/shared/components/ui/tabs';
import { Upload, User, Loader2, CheckCircle2 } from 'lucide-react';
import { ImageCropDialog } from './ImageCropDialog';
import { useFighterImageUpload } from '@/shared/hooks/use-fighter-image-upload';
import { toast } from '@/shared/hooks/use-toast';

interface ImagesTabProps {
  fighter: Fighter;
}

export const ImagesTab = ({ fighter }: ImagesTabProps) => {
  const { uploadFighterImage, isUploading, progress } = useFighterImageUpload({
    onSuccess: () => {
      toast({ title: 'Image saved', description: 'Fighter image updated successfully.' });
    },
    onError: (err) => {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    },
  });

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [pendingImageType, setPendingImageType] = useState<'face' | 'body'>('face');
  const [pendingImageSrc, setPendingImageSrc] = useState<string>('');
  const [faceUrl, setFaceUrl] = useState<string>(fighter.imageUrl || '');
  const [bodyUrl, setBodyUrl] = useState<string>(fighter.bodyImageUrl || '');

  const localFaceRef = useRef<HTMLInputElement>(null);
  const localBodyRef = useRef<HTMLInputElement>(null);

  const openCropDialog = (imageType: 'face' | 'body', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPendingImageSrc(e.target?.result as string);
      setPendingImageType(imageType);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (imageType: 'face' | 'body') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    openCropDialog(imageType, file);
  };

  const handleCropComplete = async (blob: Blob) => {
    const file = new File([blob], `${pendingImageType}.jpg`, { type: 'image/jpeg' });
    const result = await uploadFighterImage(fighter.id, pendingImageType, file);
    if (result) {
      if (pendingImageType === 'face') {
        setFaceUrl(result.imageUrl + '?t=' + Date.now());
      } else {
        setBodyUrl(result.imageUrl + '?t=' + Date.now());
      }
    }
  };

  const isPlaceholder = (url: string) => !url || url.includes('placeholder');

  return (
    <TabsContent value="images" className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-6">

        <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Face Image</p>
            <p className="text-xs text-muted-foreground">
              Cropped to 400×400px · Face only, no shoulders
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="h-48 w-48 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {!isPlaceholder(faceUrl) ? (
                <img
                  src={faceUrl}
                  alt={`${fighter.firstName} face`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            {!isPlaceholder(faceUrl) && (
              <div className="flex items-center gap-1 text-xs text-win">
                <CheckCircle2 className="h-3 w-3" />
                Image set
              </div>
            )}

            <input
              ref={localFaceRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange('face')}
              className="hidden"
              data-testid="input-face-image"
            />

            <Button
              type="button"
              onClick={() => localFaceRef.current?.click()}
              disabled={isUploading}
              className="gap-2 w-full"
              data-testid="button-upload-face"
            >
              {isUploading && pendingImageType === 'face' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading {progress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {isPlaceholder(faceUrl) ? 'Upload Face' : 'Replace Face'}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Body Image</p>
            <p className="text-xs text-muted-foreground">
              Cropped to 400×600px · Full body or stance
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="h-48 w-32 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {bodyUrl ? (
                <img
                  src={bodyUrl}
                  alt={`${fighter.firstName} body`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            {bodyUrl && (
              <div className="flex items-center gap-1 text-xs text-win">
                <CheckCircle2 className="h-3 w-3" />
                Image set
              </div>
            )}

            <input
              ref={localBodyRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange('body')}
              className="hidden"
              data-testid="input-body-image"
            />

            <Button
              type="button"
              onClick={() => localBodyRef.current?.click()}
              disabled={isUploading}
              className="gap-2 w-full"
              data-testid="button-upload-body"
            >
              {isUploading && pendingImageType === 'body' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading {progress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {bodyUrl ? 'Replace Body' : 'Upload Body'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {cropDialogOpen && pendingImageSrc && (
        <ImageCropDialog
          open={cropDialogOpen}
          onClose={() => setCropDialogOpen(false)}
          imageSrc={pendingImageSrc}
          imageType={pendingImageType}
          onCropComplete={handleCropComplete}
        />
      )}
    </TabsContent>
  );
};
