// Service for interacting with n8n webhook for receipt analysis

import { n8nConfig, N8nWebhookResponse } from '../config/n8n';
import { getAuthToken } from '../utils/api';

export class N8nService {
  private static instance: N8nService;

  public static getInstance(): N8nService {
    if (!N8nService.instance) {
      N8nService.instance = new N8nService();
    }
    return N8nService.instance;
  }


  /**
   * Send image to n8n webhook for analysis (matches original Svelte implementation)
   */
  public async analyzeReceipt(file: File, userId: string): Promise<N8nWebhookResponse> {
    try {
      // Get auth token for user identification
      const authToken = getAuthToken();
      
      // Prepare FormData exactly like the original Svelte version
      const formData = new FormData();
      formData.append('image', file);

      console.log('Sending receipt to n8n for analysis...', {
        webhookUrl: n8nConfig.webhookUrl,
        userId: userId,
        imageSize: file.size,
        fileName: file.name,
        fileType: file.type
      });

      // Send to n8n webhook exactly like the original Svelte version
      const response = await fetch(n8nConfig.webhookUrl, {
        method: 'POST',
        body: formData, // Send FormData, not JSON
        headers: {
          // Don't set Content-Type - let browser set multipart/form-data with boundary
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
          'X-User-ID': userId,
        },
        signal: AbortSignal.timeout(n8nConfig.requestTimeout)
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
      }

      // The original Svelte version expects the receipt data directly from n8n
      const receiptData = await response.json();
      
      console.log('n8n webhook response:', receiptData);

      // Return in the format expected by the React app
      return {
        success: true,
        status: 'completed',
        data: receiptData
      };

    } catch (error) {
      console.error('Error analyzing receipt with n8n:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Receipt analysis timed out. Please try again.');
        }
        throw new Error(`Analysis failed: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred during analysis');
    }
  }

}

export const n8nService = N8nService.getInstance();