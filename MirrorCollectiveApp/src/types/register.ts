export interface DeviceRegisterRequest {
  user_id: string;
  device_token: string;
}

export interface DeviceRegisterResponse {
  success: boolean;
  data?: any;
  error?: string;
}