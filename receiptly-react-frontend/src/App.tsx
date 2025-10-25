import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Upload from './components/Upload';
import Review from './components/Review';
import Receipts from './components/Receipts';
import ReceiptDetail from './components/ReceiptDetail';
import Tracker from './components/Tracker';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Upload />} />
            <Route path="receiptly" element={<Upload />} />
            <Route path="review" element={<Review />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="receipts/:id" element={<ReceiptDetail />} />
            <Route path="tracker" element={<Tracker />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
