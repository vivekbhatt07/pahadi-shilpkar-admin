import api from '@/api';
import type { ApiResponse, UploadedImage } from '@/types/api';

export const uploadService = {
  /** 1–5 files, each ≤2MB, jpg/jpeg/png/gif/webp. Same order as sent. */
  images: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const { data } = await api.post<ApiResponse<{ images: UploadedImage[] }>>(
      '/upload/images',
      formData,
    );
    return data;
  },

  /** Single file, ≤2MB. Auto-cropped 200×200 by the server. */
  avatar: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post<ApiResponse<UploadedImage>>(
      '/upload/avatar',
      formData,
    );
    return data;
  },

  /** A logo or favicon, ≤2MB, jpg/png/webp/svg/ico. Stored exactly as sent. */
  brandImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post<ApiResponse<UploadedImage>>(
      '/upload/brand-image',
      formData,
    );
    return data;
  },
};
