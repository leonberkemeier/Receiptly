// n8n Integration Configuration

export const n8nConfig = {
  // n8n webhook URL for receipt processing
  webhookUrl: process.env.REACT_APP_N8N_WEBHOOK_URL! ,
  
  // Polling interval for checking analysis status (in milliseconds)
  pollingInterval: 2000, // 2 seconds
  
  // Maximum number of polling attempts
  maxPollingAttempts: 60, // 2 minutes total (60 * 2 seconds)
  
  // Timeout for the webhook request (in milliseconds)
  requestTimeout: 30000, // 30 seconds
};

// The original Svelte version sends FormData with File object
// No need for a specific request interface since we use FormData

export interface N8nWebhookResponse {
  success: boolean;
  data?: {
    items: Array<{
      name: string;
      price: string;
      quantity: string;
    }>;
    total: string;
    date: string;
    time: string;
    store?: string;
    address?: string;
  };
  error?: string;
  status?: 'completed' | 'failed';
}
