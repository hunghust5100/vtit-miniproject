export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
}
