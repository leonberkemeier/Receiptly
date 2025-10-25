# Financial Tracker Feature - Setup Instructions

## Overview

I've successfully added a financial tracker feature to your Receiptly application. The application now has two main sections:

1. **Receipts** (`/receiptly`) - Your existing receipt upload and management system
2. **Tracker** (`/tracker`) - New financial income/expense tracker with monthly statistics

## Changes Made

### Backend (Python/FastAPI)

1. **Database Schema** (`prisma/schema.prisma`)
   - Added `Transaction` model with fields: type, amount, category, description, date
   - Added relation to User model

2. **Schemas** (`app/schemas/transactions.py`)
   - Created transaction schemas for API validation
   - Added stats schemas for financial summaries

3. **API Routes** (`app/api/routes/transactions.py`)
   - GET `/api/transactions` - List transactions with filters
   - POST `/api/transactions` - Create new transaction
   - PUT `/api/transactions/{id}` - Update transaction
   - DELETE `/api/transactions/{id}` - Delete transaction
   - GET `/api/transactions/stats` - Get financial statistics
   - GET `/api/transactions/monthly` - Get monthly breakdown

4. **Main App** (`main.py`)
   - Registered transaction routes

### Frontend (React/TypeScript)

1. **Types** (`src/types.ts`)
   - Added Transaction, TransactionCreate, TransactionStats, MonthlyStats types

2. **Components**
   - `TransactionForm.tsx` - Form to add income/expense entries
   - `Tracker.tsx` - Main tracker page with stats, monthly overview, and transaction list

3. **Routing** (`App.tsx`)
   - Added `/tracker` route
   - Updated `/receiptly` as alias for receipt upload

4. **Navigation** (`Layout.tsx`)
   - Updated navigation to show "Receipts" and "Tracker" links

## Setup Instructions

### Step 1: Backend Database Migration

Navigate to the backend directory and run:

```bash
cd /home/archy/Desktop/Server/receiptly-react/receiptly-react-backend

# Activate virtual environment
source venv/bin/activate

# Generate Prisma client with new Transaction model
prisma generate

# Push schema changes to database
prisma db push
```

If you prefer migrations instead:
```bash
prisma migrate dev --name add_transactions
```

### Step 2: Restart Backend Server

```bash
# If using the start script:
./start.sh

# Or manually:
python main.py
```

### Step 3: Frontend (No changes needed)

The frontend should automatically pick up the changes. Just refresh your browser.

## Features

### Tracker Page (`/tracker`)

1. **Add Transactions**
   - Click "+ Add Transaction" button
   - Select type: Income or Expense
   - Enter amount, category, date, and optional description
   - Categories are pre-populated based on type

2. **View Statistics**
   - Total Income, Total Expenses, Net Balance cards
   - All stats update in real-time

3. **Monthly Overview**
   - Table showing last 6 months of financial data
   - Income, expenses, and net balance per month

4. **Transaction List**
   - Filter by: All, Income, or Expense
   - View all transactions with date, category, description, amount
   - Delete individual transactions

### Receipts Page (`/receiptly`)

- Your existing receipt upload and management functionality remains unchanged
- Access via "Receipts" link in navigation

## Navigation

- **Receipts** - Links to `/receiptly` (receipt upload and viewing)
- **Tracker** - Links to `/tracker` (financial tracking)

## API Endpoints

All transaction endpoints require authentication (Bearer token).

### Create Transaction
```bash
POST /api/transactions
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "expense",
  "amount": 50.00,
  "category": "Groceries",
  "description": "Weekly shopping",
  "date": "2025-10-25T00:00:00Z"
}
```

### Get Transactions
```bash
GET /api/transactions?limit=100&type=expense&category=Groceries
Authorization: Bearer <token>
```

### Get Statistics
```bash
GET /api/transactions/stats?start_date=2025-01-01T00:00:00Z
Authorization: Bearer <token>
```

### Get Monthly Stats
```bash
GET /api/transactions/monthly?months=12
Authorization: Bearer <token>
```

## Testing

1. Start the backend server
2. Navigate to http://localhost:3000 (or your frontend URL)
3. Login with your credentials
4. Click "Tracker" in the navigation
5. Click "+ Add Transaction" and create a few test transactions
6. Verify that statistics and monthly overview update correctly

## Notes

- All transactions are user-specific (authenticated)
- Transactions support filtering by type, category, and date range
- Monthly statistics automatically group transactions by month
- The existing receipt functionality is completely unchanged
- Both features share the same authentication system

## Troubleshooting

If you encounter issues:

1. **Backend won't start**: Check that Prisma has generated the client successfully
   ```bash
   prisma generate
   ```

2. **Database errors**: Ensure the Transaction table was created
   ```bash
   prisma db push
   ```

3. **Frontend errors**: Clear browser cache and ensure the backend is running

4. **API errors**: Check the backend logs for detailed error messages
