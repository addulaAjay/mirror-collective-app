import type { DeviceRegisterRequest, DeviceRegisterResponse } from '@types';

import { API_CONFIG } from '@constants/config';

import { BaseApiService } from '../base';


export class RegisterDeviceService extends BaseApiService {
  async registerDevice(request: DeviceRegisterRequest): Promise<DeviceRegisterResponse> {
    console.log('RegisterDeviceService - request payload:', request);

    try {
      const response = await this.makeRequest<any>(
        API_CONFIG.ENDPOINTS.REGISTER_DEVICE.REGISTER,
        'POST',
        request,
        false,
      );

      console.log('RegisterDeviceService - response:', response);

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
}

export const registerDeviceApiService = new RegisterDeviceService();