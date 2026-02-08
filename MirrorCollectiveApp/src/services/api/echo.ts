import type { ApiResponse } from '@types';
import { BaseApiService } from './base';
import { ApiErrorHandler } from './errorHandler';

export interface CreateEchoRequest {
  title: string;
  category: string;
  echo_type: 'TEXT' | 'AUDIO' | 'VIDEO';
  recipient_id?: string;
  content?: string; // For text echoes
}

export interface EchoResponse {
  echo_id: string;
  title: string;
  category: string;
  echo_type: 'TEXT' | 'AUDIO' | 'VIDEO';
  created_at: string;
  media_url?: string;
  content?: string;
  recipient?: {
    recipient_id: string;
    name: string;
    email: string;
  };
}

export interface UploadUrlResponse {
  upload_url: string;
  media_url: string;
  expires_in: number;
}

export interface Guardian {
  guardian_id: string;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface Recipient {
  recipient_id: string;
  name: string;
  email: string;
  relationship?: string;
  motif?: string;
  created_at: string;
}

export interface CreateGuardianRequest {
  name: string;
  email: string;
}

export interface CreateRecipientRequest {
  name: string;
  email: string;
  relationship?: string;
  motif?: string;
}

export class EchoApiService extends BaseApiService {
  
// ========== ECHOES ==========

  async getEchoes(): Promise<ApiResponse<EchoResponse[]>> {
    const response = await this.makeRequest<EchoResponse[]>(
      '/api/echoes',
      'GET',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echoes retrieved');
  }

  async getEcho(id: string): Promise<ApiResponse<EchoResponse>> {
    const response = await this.makeRequest<EchoResponse>(
      `/api/echoes/${id}`,
      'GET',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echo retrieved');
  }

  async createEcho(data: CreateEchoRequest): Promise<ApiResponse<EchoResponse>> {
    const response = await this.makeRequest<EchoResponse>(
      '/api/echoes',
      'POST',
      data,
      true // requiresAuth
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echo created successfully');
  }

  async updateEcho(id: string, data: Partial<CreateEchoRequest> & { media_url?: string }): Promise<ApiResponse<EchoResponse>> {
    const response = await this.makeRequest<EchoResponse>(
      `/api/echoes/${id}`,
      'PATCH',
      data,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echo updated successfully');
  }

  async deleteEcho(id: string): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(
      `/api/echoes/${id}`,
      'DELETE',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echo deleted');
  }

  async getUploadUrl(fileType: string, echoId: string): Promise<ApiResponse<UploadUrlResponse>> {
    // fileType should be MIME type like 'audio/m4a' or 'video/mp4'
    const response = await this.makeRequest<UploadUrlResponse>(
      '/api/echoes/upload-url',
      'POST',
      { file_type: fileType, echo_id: echoId },
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Upload URL retrieved');
  }

  async uploadMedia(uploadUrl: string, fileUri: string, contentType: string): Promise<Response> {
    // For React Native, we need to read the file and upload as blob
    // The file URI comes from the audio recorder (e.g., file:///path/to/recording.m4a)
    
    try {
      // Use XMLHttpRequest for React Native file uploads to S3
      // This is more reliable than fetch for binary uploads
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', contentType);
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(null, { status: xhr.status, statusText: xhr.statusText }));
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
        
        // For React Native, we can use the file URI directly with XHR
        // React Native's XHR implementation handles file:// URIs
        fetch(fileUri)
          .then(res => res.blob())
          .then(blob => {
            xhr.send(blob);
          })
          .catch(err => {
            // Fallback: try direct URI upload (works on some RN versions)
            xhr.send({ uri: fileUri, type: contentType, name: 'media' } as any);
          });
      });
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // ========== GUARDIANS ==========

  async getGuardians(): Promise<ApiResponse<Guardian[]>> {
    const response = await this.makeRequest<Guardian[]>(
      '/api/guardians',
      'GET',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Guardians retrieved');
  }

  async addGuardian(data: CreateGuardianRequest): Promise<ApiResponse<Guardian>> {
    const response = await this.makeRequest<Guardian>(
      '/api/guardians',
      'POST',
      data,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Guardian added');
  }

  async removeGuardian(id: string): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(
      `/api/guardians/${id}`,
      'DELETE',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Guardian removed');
  }

  // ========== RECIPIENTS ==========

  async getRecipients(): Promise<ApiResponse<Recipient[]>> {
    const response = await this.makeRequest<Recipient[]>(
      '/api/recipients',
      'GET',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Recipients retrieved');
  }

  async addRecipient(data: CreateRecipientRequest): Promise<ApiResponse<Recipient>> {
    const response = await this.makeRequest<Recipient>(
      '/api/recipients',
      'POST',
      data,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Recipient added');
  }

  async removeRecipient(id: string): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(
      `/api/recipients/${id}`,
      'DELETE',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Recipient removed');
  }
}

export const echoApiService = new EchoApiService();

