import type { ApiResponse } from '@types';

import { BaseApiService } from './base';
import { ApiErrorHandler } from './errorHandler';

export interface CreateEchoRequest {
  title: string;
  category: string;
  echo_type: 'TEXT' | 'AUDIO' | 'VIDEO';
  recipient_id?: string;
  guardian_id?: string;
  content?: string; // For text echoes
  release_date?: string; // ISO 8601 date string for scheduled release
  unlock_on_death?: boolean; // If true, echo is released when creator dies (verified by guardian)
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
    motif?: string;
  };
  scheduled_at?: string; // ISO date string
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

  async getInboxEchoes(): Promise<ApiResponse<EchoResponse[]>> {
    const response = await this.makeRequest<EchoResponse[]>(
      '/api/echoes/inbox',
      'GET',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Inbox echoes retrieved');
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

  async uploadMedia(uploadUrl: string, fileUri: string, contentType: string): Promise<void> {
    // Step 1: Read the local file into a blob
    let blob: Blob;
    try {
      const fileResponse = await fetch(fileUri);
      if (!fileResponse.ok) {
        throw new Error(`Failed to read local file: ${fileResponse.status}`);
      }
      blob = await fileResponse.blob();
    } catch (error: any) {
      console.error('Failed to read media file:', error);
      throw new Error(`Cannot read media file: ${error.message}`);
    }

    // Step 2: PUT the blob to the presigned S3 URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });

    if (!uploadResponse.ok) {
      const body = await uploadResponse.text().catch(() => '');
      console.error('S3 upload failed:', uploadResponse.status, body);
      throw new Error(`Media upload failed (${uploadResponse.status})`);
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

