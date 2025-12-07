import api from './api';
import type { Category } from '../types/activity';

export const categoryService = {
  getAllCategories: () => api.get<Category[]>('/categories'),
  
  getCategoryById: (id: number) => api.get<Category>(`/categories/${id}`),
  
  createCategory: (category: Partial<Category>) => 
    api.post<Category>('/categories', category),
  
  updateCategory: (id: number, category: Partial<Category>) => 
    api.put<Category>(`/categories/${id}`, category),
  
  deleteCategory: (id: number) => 
    api.delete(`/categories/${id}`),
};