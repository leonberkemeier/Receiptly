# n8n Integration Guide

This document explains how the React application integrates with n8n for receipt analysis and PostgreSQL for data storage.

## Architecture Overview

```
React App → n8n Webhook → AI Analysis → React App → PostgreSQL
```

### Flow Diagram

1. **User Upload**: User uploads receipt image in React app
2. **Send to n8n**: Image converted to base64 and sent to n8n webhook
3. **AI Processing**: n8n processes image using AI (OpenAI Vision, Tesseract, etc.)
4. **Return Data**: n8n returns structured JSON with receipt data
5. **User Review**: User reviews and edits extracted data in React
6. **Save to Database**: Final data saved to PostgreSQL via backend API

## Required n8n Workflow

### Webhook Configuration

Your n8n webhook should accept:

**URL**: `http://localhost:5678/webhook/receipt-analysis`
**Method**: `POST`

### Expected Request Format

The React app sends a FormData object (exactly like the original Svelte version):

```javascript
// FormData with actual File object
const formData = new FormData();
formData.append('image', imageFile); // File object, not base64

// POST request with multipart/form-data
fetch('http://localhost:5678/webhook/receipt-analysis', {
  method: 'POST',
  body: formData // No JSON, just FormData
});
```

### Expected Response Format

The n8n webhook should return the receipt data directly (like the original Svelte version):

```json
{
  "items": [
    {
      "name": "Coffee Latte",
      "price": "4.50",
      "quantity": "1"
    },
    {
      "name": "Croissant", 
      "price": "3.25",
      "quantity": "1"
    }
  ],
  "total": "7.75",
  "date": "2023-12-01",
  "time": "14:30",
  "store": "Coffee Shop",
  "address": "123 Main Street"
}
```

**Note**: No wrapper object with `success` or `status` - just the receipt data directly.

### Error Response Format

```json
{
  "success": false,
  "error": "Failed to analyze receipt: Invalid image format",
  "status": "failed"
}
```

## n8n Workflow Nodes

Here's a suggested n8n workflow:

### 1. Webhook Node
- **Name**: Receipt Analysis Webhook  
- **HTTP Method**: POST
- **Response**: Return response to webhook

### 2. Set Node (Extract Data)
- Extract image data from webhook
- Set user ID and receipt ID
- Prepare image for AI processing

### 3. AI Vision Node (Choose one)

#### Option A: OpenAI Vision API
```javascript
// OpenAI Vision API call
const response = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://api.openai.com/v1/chat/completions',
  headers: {
    'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
    'Content-Type': 'application/json'
  },
  body: {
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract receipt data from this image. Return JSON with items (name, price, quantity), total, date, time, store name, and address."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${$json.image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  }
});
```

#### Option B: Google Vision API
```javascript
// Google Vision API call
const response = await this.helpers.httpRequest({
  method: 'POST',
  url: `https://vision.googleapis.com/v1/images:annotate?key=${YOUR_GOOGLE_API_KEY}`,
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    requests: [
      {
        image: {
          content: $json.image
        },
        features: [
          {
            type: "TEXT_DETECTION"
          }
        ]
      }
    ]
  }
});
```

### 4. Code Node (Parse AI Response)
```javascript
// Parse AI response and structure data
const aiResponse = $input.first().json;

// Extract structured data from AI response
// This will depend on your AI service response format

return [
  {
    json: {
      success: true,
      status: 'completed',
      data: {
        items: [
          // Parsed items from AI
        ],
        total: "0.00",
        date: "2023-12-01",
        time: "14:30",
        store: "Store Name",
        address: "Store Address"
      }
    }
  }
];
```

### 5. Response Node
Return formatted response to React app

## Environment Variables

Add to your `.env` file:

```env
# n8n Configuration
REACT_APP_N8N_WEBHOOK_URL=http://localhost:5678/webhook/receipt-analysis

# Backend API (for PostgreSQL)
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

## PostgreSQL Database Schema

Your backend should have these tables:

```sql
-- Users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipts table
CREATE TABLE receipts (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    total DECIMAL(10,2),
    date DATE,
    time TIME,
    store VARCHAR,
    address TEXT,
    image_data TEXT, -- base64 encoded image
    processed_at TIMESTAMP,
    source VARCHAR DEFAULT 'n8n_analysis',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipt items table
CREATE TABLE receipt_items (
    id VARCHAR PRIMARY KEY,
    receipt_id VARCHAR REFERENCES receipts(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    price DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Backend API Endpoints

Your backend API should implement:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Receipts
- `GET /api/receipts` - Get user's receipts
- `POST /api/receipts` - Save receipt to PostgreSQL
- `GET /api/receipts/{id}` - Get specific receipt

### Example Receipt Save Endpoint (FastAPI)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .auth import get_current_user

@app.post("/api/receipts")
async def save_receipt(receipt_data: dict, db: Session = Depends(get_db), user = Depends(get_current_user)):
    try:
        # Create receipt record
        receipt = Receipt(
            id=generate_id(),
            user_id=user.id,
            total=receipt_data.get('total'),
            date=receipt_data.get('date'),
            time=receipt_data.get('time'),
            store=receipt_data.get('store'),
            address=receipt_data.get('address'),
            image_data=receipt_data.get('imageData'),
            processed_at=receipt_data.get('processedAt'),
            source=receipt_data.get('source', 'n8n_analysis')
        )
        
        db.add(receipt)
        
        # Create receipt items
        for item_data in receipt_data.get('items', []):
            item = ReceiptItem(
                id=generate_id(),
                receipt_id=receipt.id,
                name=item_data['name'],
                price=float(item_data['price']),
                quantity=int(item_data.get('quantity', 1))
            )
            db.add(item)
        
        db.commit()
        
        return {"success": True, "id": receipt.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

## Testing the Integration

1. **Start n8n**: Make sure your n8n server is running on `http://localhost:5678`
2. **Configure Webhook**: Set up the webhook endpoint in n8n
3. **Test with Mock**: The app includes mock responses for development
4. **Upload Image**: Upload a receipt image in the React app
5. **Verify Flow**: Check n8n logs and database records

## Error Handling

The React app handles:
- **Network errors**: Connection issues with n8n
- **Timeout errors**: Long-running AI analysis
- **Parsing errors**: Invalid response format
- **Validation errors**: Missing required fields

## Performance Considerations

- **Image Size**: Limit to 10MB max
- **Processing Time**: Allow 1-2 minutes for AI analysis
- **Polling**: Check n8n status every 2 seconds
- **Timeout**: Maximum 2 minutes total wait time

## Development Mode

When `NODE_ENV=development`, the app uses mock responses instead of real n8n calls. This allows development without setting up the full n8n workflow.

## Production Deployment

1. Set up n8n server with proper webhook
2. Configure AI service (OpenAI, Google Vision, etc.)
3. Set up PostgreSQL database
4. Deploy backend API with authentication
5. Update environment variables in React app
6. Deploy React app

This integration provides a complete receipt management system with AI-powered extraction and database storage.