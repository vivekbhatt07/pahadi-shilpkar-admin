import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  MAX_UPLOAD_SIZE_BYTES,
  prepareImageForUpload,
} from '@/helpers/image-upload';
import {
  useUploadAvatar,
  useUploadBrandImage,
  useUploadImages,
} from '@/hooks/upload';

const MAX_IMAGES_PER_UPLOAD = 5;
const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];
const BRAND_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
];

type TUploadImageButtonProps = {
  onUploaded: (urls: string[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  /**
   * Which backend endpoint to use — POST /upload/images (default), /avatar,
   * or /brand-image for logos and favicons.
   */
  variant?: 'images' | 'avatar' | 'brand';
};

/**
 * Uploads via the backend (`POST /api/upload/images`, `/avatar` or
 * `/brand-image`). On failure — including 503 "Image upload is not configured
 * on the server" — the caller's paste-a-URL field stays usable; this button
 * is purely additive.
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
  const uploadBrandImage = useUploadBrandImage();
  // Re-encoding the photos first — see prepareImageForUpload
  const [isPreparing, setIsPreparing] = useState(false);
  const isUploading =
    isPreparing ||
    uploadImages.isPending ||
    uploadAvatar.isPending ||
    uploadBrandImage.isPending;
  const isBrand = variant === 'brand';
  const acceptedTypes = isBrand ? BRAND_MIME_TYPES : ACCEPTED_MIME_TYPES;

  const validate = (files: File[]) => {
    if (variant === 'images' && files.length > MAX_IMAGES_PER_UPLOAD) {
      toast.error(`Select up to ${MAX_IMAGES_PER_UPLOAD} images at a time`);
      return false;
    }
    for (const file of files) {
      if (!acceptedTypes.includes(file.type)) {
        toast.error(
          isBrand
            ? 'Use a PNG, JPG, WebP, SVG or ICO file'
            : 'Only image files are allowed',
        );
        return false;
      }
      if (isBrand && file.size > MAX_UPLOAD_SIZE_BYTES) {
        toast.error(`${file.name} is over 2MB`);
        return false;
      }
    }
    return true;
  };

  // Each photo is scaled to 2000px at most, without its metadata, and to
  // fit 2MB
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

    // A logo goes up exactly as it was made: re-encoding would soften its
    // edges, and the browser can't redraw an ICO or keep an SVG a vector
    const ready = isBrand ? files : await prepare(files);
    if (!ready) return;

    try {
      if (variant === 'avatar') {
        const response = await uploadAvatar.mutateAsync(ready[0]);
        if (response.data) onUploaded([response.data.url]);
      } else if (isBrand) {
        const response = await uploadBrandImage.mutateAsync(ready[0]);
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
        accept={
          isBrand
            ? `${acceptedTypes.join(',')},.svg,.ico`
            : acceptedTypes.join(',')
        }
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
