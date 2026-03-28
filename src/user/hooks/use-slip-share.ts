import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export function useSlipShare() {
  const captureAndShare = useCallback(async (element: HTMLElement, filename: string = 'grit-pick') => {
    try {
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 1, // Already rendering at 1080px, no need to upscale
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          return;
        }

        // Create file URL
        const imageUrl = URL.createObjectURL(blob);
        
        // Try native share API first (mobile)
        if (navigator.share && navigator.canShare({ files: [new File([blob], `${filename}.png`, { type: 'image/png' })] })) {
          try {
            await navigator.share({
              files: [new File([blob], `${filename}.png`, { type: 'image/png' })],
              title: 'My GRIT Pick',
              text: 'Check out my fight pick on GRIT!',
            });
            toast.success('Shared successfully!');
          } catch (shareError) {
            console.error('Share failed:', shareError);
            // Fall through to download option
          }
        } else {
          // Fallback: download image
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Image downloaded! Share it manually to social media.');
        }

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(imageUrl), 100);
      }, 'image/png');
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to generate share image');
    }
  }, []);

  const downloadImage = useCallback(async (element: HTMLElement, filename: string = 'grit-pick') => {
    try {
      const canvas = await html2canvas(element, {
        scale: 1,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  }, []);

  return { captureAndShare, downloadImage };
}
