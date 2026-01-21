import { API_CONFIG } from '@constants/config';
import type { DeviceRegisterRequest, DeviceRegisterResponse } from '@types';


import { BaseApiService } from '../base';


export class RegisterDeviceService extends BaseApiService {
  async registerDevice(request: DeviceRegisterRequest): Promise<DeviceRegisterResponse> {
    try {
      const response = await this.makeRequest<any>(
        API_CONFIG.ENDPOINTS.REGISTER_DEVICE.REGISTER,
        'POST',
        request,
        true,
      );

      return {
        success: response.success,
        data: response.data,
        error: response.error,
      };
    } catch (error) {
      console.error('RegisterDeviceService - error calling /register-device:', error);
      throw error;
    }
  }

  async unregisterDevice(token: string): Promise<DeviceRegisterResponse> {
    try {
      const response = await this.makeRequest<any>(
        API_CONFIG.ENDPOINTS.REGISTER_DEVICE.UNREGISTER,
        'POST',
        { device_token: token },
        true,
      );

      return {
        success: response.success,
        data: response.data,
        error: response.error,
      };
    } catch (error) {
      console.error('RegisterDeviceService - error calling /unregister-device:', error);
      throw error;
    }
  }
}

export const registerDeviceApiService = new RegisterDeviceService();