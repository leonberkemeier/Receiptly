# Frontend-Backend Integration Guide

## 🔗 Connecting React Frontend to FastAPI Backend

This guide explains how to connect your Receiptly React frontend to the FastAPI backend.

## ⚙️ Configuration

### Environment Variables

The frontend is configured via the `.env` file:

```env
# Backend API Configuration  
REACT_APP_API_BASE_URL=http://localhost:8000

# Development Settings
REACT_APP_ENVIRONMENT=development
REACT_APP_USE_MOCK_API=false  # Set to true to use mock data instead of backend
```

### Mock API vs Real Backend

- **Mock API** (`REACT_APP_USE_MOCK_API=true`): Uses simulated data for testing UI
- **Real Backend** (`REACT_APP_USE_MOCK_API=false`): Connects to your FastAPI server

## 🚀 Quick Start

### 1. Start the Backend

```bash
# In the backend directory
cd ../receiptly-react-backend
./start.sh
```

The backend will be available at `http://localhost:8000`

### 2. Configure Frontend

Make sure your `.env` file has:
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_USE_MOCK_API=false
```

### 3. Test Integration

```bash
# Test the connection
node test-integration.js

# Start the frontend
npm start
```

## 🧪 Testing

### Automated Integration Test

Run the integration test to verify backend connectivity:

```bash
node test-integration.js
```

This will:
- Check backend health
- Test API endpoints
- Verify receipt creation
- Show configuration status

### Manual Testing

1. **Upload a Receipt**: Go to the upload page and upload an image
2. **Review & Save**: Edit the extracted data and click "Save Receipt"  
3. **View Receipts**: Check the receipts list to see your saved data
4. **View Details**: Click "View Details" on any receipt to see the full detail page

### Test Receipt Details

```bash
node test-receipt-detail.js
```

This will test the receipt detail API endpoint and verify the "View Details" functionality works.

## 🔧 API Endpoints Used

The frontend connects to these backend endpoints:

- `GET /api/receipts/` - Fetch all receipts
- `POST /api/receipts/` - Create new receipt
- `GET /api/receipts/{id}` - Get specific receipt details
- `PUT /api/receipts/{id}` - Update receipt
- `DELETE /api/receipts/{id}` - Delete receipt
- `GET /health` - Backend health check

## 🐛 Troubleshooting

### Receipt Not Saving

1. **Check Backend Status**: Make sure backend is running at `http://localhost:8000`
2. **Check Console**: Open browser DevTools to see API errors
3. **Verify Configuration**: Ensure `REACT_APP_USE_MOCK_API=false`
4. **Test API**: Run `node test-integration.js`

### Blank Screen After Save

This was a known issue that has been fixed. The frontend now:
- Handles FastAPI response format correctly
- Redirects to receipts list after successful save
- Shows proper error messages on failure

### Network Errors

- Ensure backend is running on the correct port
- Check CORS configuration (already set up for localhost)
- Verify firewall isn't blocking connections

## 📊 Data Flow

```
Frontend Upload → n8n Processing → Review Component → FastAPI → PostgreSQL
```

1. **Upload**: User uploads receipt image
2. **Processing**: n8n extracts text and data  
3. **Review**: User reviews/edits extracted data
4. **Save**: Frontend sends to FastAPI backend
5. **Storage**: Backend saves to PostgreSQL via Prisma

## 🔀 Switching Between Mock and Real API

### Use Mock API (for UI testing)
```bash
echo "REACT_APP_USE_MOCK_API=true" >> .env
npm start
```

### Use Real Backend (for full integration)
```bash
echo "REACT_APP_USE_MOCK_API=false" >> .env
# Make sure backend is running
npm start
```

## 📝 Response Formats

### FastAPI Backend Response
```json
{
  "id": "receipt_123",
  "date": "2024-01-15",
  "time": "14:30",
  "total": "25.99",
  "items": [
    {
      "id": "item_456",
      "name": "Coffee", 
      "price": "4.99",
      "quantity": "1"
    }
  ],
  "createdAt": "2024-01-15T14:30:00.000Z",
  "updatedAt": "2024-01-15T14:30:00.000Z"
}
```

The frontend automatically handles this format and displays the data correctly.

## 📚 Further Reading

- [FastAPI Backend Setup](../receiptly-react-backend/README.md)
- [API Documentation](http://localhost:8000/docs) (when backend is running)
- [Database Schema](../receiptly-react-backend/prisma/schema.prisma)