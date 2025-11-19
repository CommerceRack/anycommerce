import axios from 'axios';
import type { ApiRequest, ApiResponse, QueueType } from '@/types';

class ApiClient {
  private endpoint: string;
  private dispatchQueue: any = null;

  constructor(endpoint = '/jsonapi/') {
    this.endpoint = endpoint;
    this.initQueue();
  }

  private async initQueue() {
    try {
      const { DispatchQueue, QueueType } = await import('@wasm/anycommerce_wasm');
      this.dispatchQueue = new DispatchQueue(this.endpoint);
    } catch (err) {
      console.error('Failed to initialize dispatch queue:', err);
    }
  }

  async dispatch(requests: ApiRequest[], queueType: QueueType = 0): Promise<ApiResponse> {
    try {
      // Ensure queue is initialized
      if (!this.dispatchQueue) {
        await this.initQueue();
      }

      // Add requests to queue
      for (const request of requests) {
        this.dispatchQueue.push(queueType, request);
      }

      // Get batch
      const batch = this.dispatchQueue.get_batch(queueType);

      // Send to API
      const response = await axios.post(this.endpoint, batch);

      return response.data;
    } catch (err) {
      console.error('API dispatch failed:', err);
      throw err;
    }
  }

  async productGet(pid: string, withVariations = true, withInventory = true): Promise<any> {
    const request: ApiRequest = {
      _cmd: 'appProductGet',
      pid,
      withVariations: withVariations ? 1 : 0,
      withInventory: withInventory ? 1 : 0,
    };

    const response = await this.dispatch([request]);
    return response;
  }

  async cartCreate(): Promise<any> {
    const request: ApiRequest = {
      _cmd: 'appCartCreate',
    };

    // Use immutable queue for cart operations
    const response = await this.dispatch([request], 1);
    return response;
  }

  async cartDetail(cartId: string): Promise<any> {
    const request: ApiRequest = {
      _cmd: 'cartDetail',
      _cartid: cartId,
    };

    const response = await this.dispatch([request], 1);
    return response;
  }

  async cartItemAppend(cartId: string, sku: string, qty: number): Promise<any> {
    const request: ApiRequest = {
      _cmd: 'cartItemAppend',
      _cartid: cartId,
      sku,
      qty,
    };

    const response = await this.dispatch([request], 1);
    return response;
  }

  async categoryList(navcat?: string): Promise<any> {
    const request: ApiRequest = {
      _cmd: 'appCategoryList',
      ...(navcat && { navcat }),
    };

    const response = await this.dispatch([request]);
    return response;
  }

  async publicSearch(query: string): Promise<any> {
    const request: ApiRequest = {
      _cmd: 'appPublicSearch',
      query,
    };

    const response = await this.dispatch([request]);
    return response;
  }
}

export const api = new ApiClient();
export default api;
