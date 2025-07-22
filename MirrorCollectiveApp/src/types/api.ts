export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface ResetPasswordData {
  email: string;
  resetCode: string;
  newPassword: string;
}