import api from './api';
import type { Settings } from '../types/settings';

export const settingsService = {
  getSettings: () => api.get<Settings>('/settings'),
  updateSettings: (settings: Settings) => api.put<Settings>('/settings', settings),
};