import type {ApiResponse} from '@types';

import {BaseApiService} from './base';

interface StartTrialResponse extends ApiResponse {
  data?: {
    trial_started_at: string;
    trial_expires_at: string;
    days_remaining: number;
    quota_gb: number;
  };
}

interface TrialStatusResponse extends ApiResponse {
  data?: {
    trial_available: boolean;
    trial_status: string;
    has_used_trial: boolean;
    trial_started_at?: string;
    trial_expires_at?: string;
    days_remaining?: number;
  };
}

interface VerifyPurchaseRequest {
  platform: 'ios' | 'android';
  receipt_data: string;
  product_id: string;
  transaction_id: string;
}

interface VerifyPurchaseResponse extends ApiResponse {
  data?: {
    subscription_id: string;
    status: string;
    expiry_date: string;
    quota_updated: boolean;
    trial_days_remaining?: number;
  };
}

interface SubscriptionStatusResponse extends ApiResponse {
  data?: {
    tier: string;
    status: string;
    trial_days_remaining: number;
    features: {
      echo_vault_enabled: boolean;
      quota_gb: number;
      used_gb: number;
      mirror_gpt_enabled: boolean;
      echo_map_enabled: boolean;
    };
    core_subscription?: any;
    storage_subscription?: any;
    has_used_trial: boolean;
  };
}

interface RestorePurchasesRequest {
  platform: 'ios' | 'android';
  receipts: Array<string | {purchaseToken: string; productId: string}>;
}

interface RestorePurchasesResponse extends ApiResponse {
  data?: {
    restored_count: number;
    subscriptions: any[];
  };
}

class SubscriptionApiService extends BaseApiService {
  /**
   * Start 14-day free trial (no payment required)
   */
  async startTrial(): Promise<StartTrialResponse> {
    return this.post('/api/subscriptions/start-trial', {});
  }

  /**
   * Get trial status for current user
   */
  async getTrialStatus(): Promise<TrialStatusResponse> {
    return this.get('/api/subscriptions/trial-status');
  }

  /**
   * Verify IAP purchase and activate subscription
   */
  async verifyPurchase(
    request: VerifyPurchaseRequest,
  ): Promise<VerifyPurchaseResponse> {
    return this.post('/api/subscriptions/verify-purchase', request);
  }

  /**
   * Get comprehensive subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    return this.get('/api/subscriptions/status');
  }

  /**
   * Restore purchases from App Store/Play Store
   */
  async restorePurchases(
    request: RestorePurchasesRequest,
  ): Promise<RestorePurchasesResponse> {
    return this.post('/api/subscriptions/restore-purchases', request);
  }

  /**
   * Cancel subscription auto-renewal
   */
  async cancelSubscription(
    subscriptionId: string,
  ): Promise<ApiResponse> {
    return this.post('/api/subscriptions/cancel', {
      subscription_id: subscriptionId,
    });
  }

  /**
   * Get billing history
   */
  async getBillingHistory(): Promise<ApiResponse> {
    return this.get('/api/subscriptions/billing-history');
  }

  /**
   * Check storage quota status
   */
  async getQuotaStatus(): Promise<ApiResponse> {
    return this.get('/api/subscriptions/quota-status');
  }
}

export const subscriptionApiService = new SubscriptionApiService();
export default subscriptionApiService;
