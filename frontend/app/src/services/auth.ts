import api from './api';
import type { LoginRequest, AuthResponse } from './types';

export const loginAPI = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/v1/auth/login', data);
  return response.data;
};

export const registerAPI = async (data: any): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/v1/auth/register', data);
  return response.data;
};
