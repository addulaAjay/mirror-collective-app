import { BaseApiService } from '../base';
import { API_CONFIG } from '../../../constants/config';
import { DeviceRegisterRequest, DeviceRegisterResponse } from '../../../types/register';

export class RegisterDeviceService extends BaseApiService {
  async registerDevice(request: DeviceRegisterRequest): Promise<DeviceRegisterResponse> {
    const response = await this.makeRequest<any>(
      API_CONFIG.ENDPOINTS.REGISTER_DEVICE.REGISTER,
      'POST',
      request,
      false,
    );

    return {
      success: response.success,
      data: response.data,
      error: response.error,
    };
  }
}

export const registerDeviceApiService = new RegisterDeviceService();