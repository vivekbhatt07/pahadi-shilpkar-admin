import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { prepareImageForUpload } from '@/helpers/image-upload';
import { useUploadAvatar, useUploadImages } from '@/hooks/upload';

const MAX_IMAGES_PER_UPLOAD = 5;
const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

type TUploadImageButtonProps = {
  onUploaded: (urls: string[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  /** Which backend endpoint to use — POST /upload/images (default) or /avatar. */
  variant?: 'images' | 'avatar';
};

/**
 * Uploads via the backend (`POST /api/upload/images` or `/avatar`). On
 * failure — including 503 "Image upload is not configured on the server" —
 * the caller's paste-a-URL field stays usable; this button is purely
 * additive.
 */
const UploadImageButton = ({
  onUploaded,
  disabled,
  multiple = false,
  variant = 'images',
}: TUploadImageButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadImages = useUploadImages();
  const uploadAvatar = useUploadAvatar();
  // Shrinking photos over 2MB first — a phone's usually are
  const [isPreparing, setIsPreparing] = useState(false);
  const isUploading =
    isPreparing || uploadImages.isPending || uploadAvatar.isPending;

  const validate = (files: File[]) => {
    if (variant === 'images' && files.length > MAX_IMAGES_PER_UPLOAD) {
      toast.error(`Select up to ${MAX_IMAGES_PER_UPLOAD} images at a time`);
      return false;
    }
    for (const file of files) {
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        toast.error('Only image files are allowed');
        return false;
      }
    }
    return true;
  };

  // Over 2MB, a photo is scaled down and re-encoded to fit
  const prepare = async (files: File[]) => {
    setIsPreparing(true);
    try {
      return await Promise.all(files.map(prepareImageForUpload));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't read that image",
      );
      return null;
    } finally {
      setIsPreparing(false);
    }
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    if (!validate(files)) return;

    const ready = await prepare(files);
    if (!ready) return;

    try {
      if (variant === 'avatar') {
        const response = await uploadAvatar.mutateAsync(ready[0]);
        if (response.data) onUploaded([response.data.url]);
      } else {
        const response = await uploadImages.mutateAsync(ready);
        const urls = response.data?.images.map((image) => image.url) ?? [];
        if (urls.length > 0) onUploaded(urls);
      }
    } catch {
      // Surfaced via the global mutation-cache error toast.
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(',')}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        startAdornment={
          isUploading ? <Loader2 className="animate-spin" /> : <Upload />
        }
      >
        {isPreparing ? 'Preparing…' : isUploading ? 'Uploading…' : 'Upload'}
      </Button>
    </>
  );
};

export default UploadImageButton;
