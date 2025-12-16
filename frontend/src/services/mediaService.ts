// src/services/mediaService.ts
import api from './api';
import type { Media } from '../types/media';

export interface UploadResponse {
  url: string;
  message: string;
}

export const mediaService = {
  // Upload a single file
  uploadFile: (file: File, activityId: number, folder: 'images' | 'videos' = 'images') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('activityId', activityId.toString());
    formData.append('folder', folder);

    return api.post<UploadResponse>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get all media for an activity
  getMediaByActivity: (activityId: number) => 
    api.get<Media[]>(`/media/activity/${activityId}`),

  // Delete media
  deleteMedia: (mediaId: number) => 
    api.delete<{ message: string }>(`/media/${mediaId}`),
};