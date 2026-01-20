export interface DeviceRegisterRequest {
  user_id?: string; // Optional because we use auth token on backend
  device_token: string;
  platform: string;
}

export interface DeviceRegisterResponse {
  success: boolean;
  data?: any;
  error?: string;
}