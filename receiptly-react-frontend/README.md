# Receiptly React

A React equivalent of the Receiptly application for receipt management with AI-powered extraction.

## Features

- **🔐 User Authentication**: Login/Register system with protected routes
- **📤 Upload Interface**: Drag & drop receipt images with file validation
- **🤖 AI Processing**: Sends images to n8n webhook for AI analysis (OpenAI Vision, Google Vision, etc.)
- **✏️ Review & Edit**: Interactive interface to review and modify extracted data
- **📊 Receipt Management**: View and manage all saved receipts
- **📱 Responsive Design**: Built with TailwindCSS and DaisyUI
- **🔒 Protected Routes**: Secure access to application features

## Tech Stack

- React 18 with TypeScript
- React Router for navigation
- TailwindCSS with DaisyUI for styling
- Zod for data validation
- Session storage for temporary data

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Demo Login

For development and testing, use these demo credentials:
- **Email**: `demo@receiptly.com`
- **Password**: `demo123`

Or create a new account using the registration form.

## n8n Integration Workflow

The application integrates with n8n for AI-powered receipt analysis:

1. **Upload**: User uploads receipt image in React app
2. **Send to n8n**: Image converted to base64 and sent to n8n webhook
3. **AI Analysis**: n8n processes image using AI services (OpenAI Vision, Google Vision, etc.)
4. **Return Results**: n8n returns structured JSON with extracted receipt data
5. **Review & Edit**: User can review and modify the extracted information
6. **Save to Database**: Final data saved to PostgreSQL via backend API

### n8n Webhook Configuration

**Webhook URL**: Set `REACT_APP_N8N_WEBHOOK_URL` in your `.env` file  
**Expected Format**: See `N8N_INTEGRATION.md` for detailed webhook setup

## API Integration

This frontend expects the following API endpoints:

**Authentication:**
- `POST /api/auth/login` - User login with email/password
- `POST /api/auth/register` - User registration

**Receipt Management:**
- `POST /api/upload` - Upload and process receipt images
- `GET /api/receipts` - Fetch all saved receipts  
- `POST /api/receipts` - Save new receipt data

**Note:** All receipt endpoints require Bearer token authentication.

## Components

**Authentication:**
- **Login**: User login form with demo credentials
- **Register**: User registration form with validation
- **AuthContext**: Authentication state management
- **ProtectedRoute**: Route protection wrapper

**Core Features:**
- **Layout**: Main application layout with user navigation
- **Upload**: File upload with drag & drop functionality  
- **Review**: Receipt data review and editing interface
- **Receipts**: List view of all saved receipts

## Available Scripts

### `npm start`
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner in interactive watch mode.

## Original Version

This React application is based on the Svelte version located in the `../Receiptly` directory and maintains feature parity while following React patterns and best practices.
