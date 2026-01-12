import api from './api';
import type { Settings } from '../types/settings';

export interface UploadResponse {
  url: string;
  message: string;
}

export const settingsService = {
  getSettings: () => api.get<Settings>('/settings'),
  updateSettings: (settings: Settings) => api.put<Settings>('/settings', settings),

  // Upload media file for About Us section
  uploadAboutUsMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'about-us');

    return api.post<UploadResponse>('/settings/upload-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};