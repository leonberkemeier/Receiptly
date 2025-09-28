// Mock API for development and testing
// This simulates the FastAPI backend responses

interface MockUser {
  id: string;
  email: string;
  name: string;
}

interface MockReceipt {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: string;
    quantity: string;
  }>;
  total: string;
  date: string;
  time: string;
  imageData?: string;
  store?: string;
  address?: string;
  processedAt?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock database
let users: MockUser[] = [
  {
    id: '1',
    email: 'demo@receiptly.com',
    name: 'Demo User'
  }
];

let receipts: MockReceipt[] = [
  {
    id: 'receipt_1',
    items: [
      { id: 'item_1', name: 'Coffee', price: '4.50', quantity: '1' },
      { id: 'item_2', name: 'Sandwich', price: '8.99', quantity: '1' },
    ],
    total: '13.49',
    date: '2023-12-01',
    time: '14:30',
    store: 'Demo Café',
    address: '123 Main St',
    createdAt: '2023-12-01T14:30:00.000Z',
    updatedAt: '2023-12-01T14:30:00.000Z',
  }
];

// Mock JWT token generation
const generateToken = (userId: string): string => {
  return `mock_token_${userId}_${Date.now()}`;
};

// Simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Authentication endpoints
  login: async (email: string, password: string) => {
    await delay();
    
    if (email === 'demo@receiptly.com' && password === 'demo123') {
      const user = users.find(u => u.email === email);
      if (user) {
        return {
          success: true,
          user,
          token: generateToken(user.id)
        };
      }
    }
    
    throw new Error('Invalid credentials');
  },

  register: async (name: string, email: string, password: string) => {
    await delay();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }
    
    const newUser: MockUser = {
      id: `user_${Date.now()}`,
      email,
      name
    };
    
    users.push(newUser);
    
    return {
      success: true,
      user: newUser,
      token: generateToken(newUser.id)
    };
  },

  // Upload endpoint
  uploadReceipt: async (file: File) => {
    await delay(2000); // Simulate processing time
    
    // Convert file to base64
    const reader = new FileReader();
    const imageData = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    
    // Mock AI extraction results with German time
    const receiptDate = new Date();
    // Set to German timezone (CET/CEST)
    const germanTime = new Date(receiptDate.toLocaleString("en-US", {timeZone: "Europe/Berlin"}));
    germanTime.setHours(12, 45, 0, 0); // Set to 12:45 German time
    
    return {
      success: true,
      data: {
        items: [
          { name: 'Kaffee', price: '3.20', quantity: '1' },
          { name: 'Croissant', price: '2.80', quantity: '1' },
        ],
        total: '6.00',
        date: germanTime.toISOString().split('T')[0],
        time: '12:45', // German time format
        store: 'Bäckerei Schmidt',
        address: 'Hauptstraße 123, Berlin',
        imageData
      }
    };
  },

  // Receipts endpoints
  saveReceipt: async (receiptData: any) => {
    await delay();
    
    const now = new Date().toISOString();
    const newReceipt: MockReceipt = {
      id: `receipt_${Date.now()}`,
      items: receiptData.items.map((item: any, index: number) => ({
        id: `item_${Date.now()}_${index}`,
        ...item
      })),
      total: receiptData.total,
      date: receiptData.date,
      time: receiptData.time,
      imageData: receiptData.imageData,
      store: receiptData.store,
      address: receiptData.address,
      processedAt: receiptData.processedAt,
      source: receiptData.source,
      createdAt: now,
      updatedAt: now,
    };
    
    receipts.unshift(newReceipt);
    
    return {
      success: true,
      id: newReceipt.id,
      receipt: newReceipt
    };
  },

  getReceipts: async () => {
    await delay();
    
    return {
      success: true,
      receipts
    };
  }
};

// Override fetch for development
export const setupMockApi = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    console.log('Mock API intercepting:', {
      url,
      method: init?.method || 'GET'
    });
    
    try {
      // Mock n8n webhook endpoint - matches original Svelte FormData approach
      if (url.includes('webhook/receipt-analysis') && init?.method === 'POST') {
        const formData = init.body as FormData;
        const file = formData.get('image') as File;
        console.log('Mock n8n webhook received FormData with file:', {
          fileName: file?.name,
          fileSize: file?.size,
          fileType: file?.type
        });
        
        // Simulate n8n processing with longer delay
        await delay(3000);
        
        // Return receipt data directly (like the original Svelte version expects)
        // Use German time and German receipt items
        const receiptDate = new Date();
        const germanTime = new Date(receiptDate.toLocaleString("en-US", {timeZone: "Europe/Berlin"}));
        germanTime.setHours(14, 30, 0, 0); // Set to 14:30 German time
        
        return new Response(JSON.stringify({
          items: [
            { name: 'Milchkaffee', price: '4.20', quantity: '1' },
            { name: 'Buttercroissant', price: '2.80', quantity: '1' },
            { name: 'Orangensaft', price: '3.50', quantity: '1' },
          ],
          total: '10.50',
          date: germanTime.toISOString().split('T')[0],
          time: '14:30', // German time (24-hour format)
          store: 'Café München',
          address: 'Marienplatz 15, München'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (url.includes('/api/auth/login') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        const result = await mockApi.login(body.email, body.password);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (url.includes('/api/auth/register') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        const result = await mockApi.register(body.name, body.email, body.password);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (url.includes('/api/upload') && init?.method === 'POST') {
        const formData = init.body as FormData;
        const file = formData.get('image') as File;
        const result = await mockApi.uploadReceipt(file);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (url.includes('/api/receipts') && init?.method === 'POST') {
        console.log('Mock API: Handling POST /api/receipts', {
          url,
          body: init.body,
          headers: init.headers
        });
        
        const body = JSON.parse(init.body as string);
        console.log('Mock API: Parsed receipt data:', body);
        
        const result = await mockApi.saveReceipt(body);
        console.log('Mock API: Save result:', result);
        
        // Return the receipt object directly like FastAPI does
        return new Response(JSON.stringify(result.receipt), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (url.includes('/api/receipts/') && url.match(/\/api\/receipts\/[^/]+$/) && (!init?.method || init?.method === 'GET')) {
        // Handle single receipt by ID
        const receiptId = url.split('/').pop();
        const receipt = receipts.find(r => r.id === receiptId);
        
        if (receipt) {
          return new Response(JSON.stringify(receipt), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            detail: 'Receipt not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      if (url.includes('/api/receipts/') && url.match(/\/api\/receipts\/[^/]+$/) && init?.method === 'PUT') {
        // Handle updating receipt by ID
        const receiptId = url.split('/').pop();
        const receiptIndex = receipts.findIndex(r => r.id === receiptId);
        
        if (receiptIndex !== -1) {
          const updateData = JSON.parse(init.body as string);
          const now = new Date().toISOString();
          
          // Update the receipt with new data
          receipts[receiptIndex] = {
            ...receipts[receiptIndex],
            ...updateData,
            updatedAt: now,
          };
          
          console.log('Mock API: Updated receipt:', receipts[receiptIndex]);
          
          return new Response(JSON.stringify(receipts[receiptIndex]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            detail: 'Receipt not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      if (url.includes('/api/receipts') && (!init?.method || init?.method === 'GET')) {
        const result = await mockApi.getReceipts();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Fallback to original fetch
      return originalFetch(input, init);
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
};