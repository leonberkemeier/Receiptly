import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DatabaseReceipt } from '../types';

const Receipts: React.FC = () => {
  const [receipts, setReceipts] = useState<DatabaseReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        // Get the API base URL
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const apiUrl = `${API_BASE_URL}/api/receipts/`;
        
        console.log('Fetching receipts from:', apiUrl);
        
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        console.log('Receipts API response:', { ok: response.ok, status: response.status, result });

        if (response.ok) {
          // FastAPI returns array directly for GET /api/receipts
          setReceipts(Array.isArray(result) ? result : result.receipts || []);
        } else {
          setError(result.detail || result.error || 'Failed to fetch receipts');
        }
      } catch (err) {
        setError('Network error occurred');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string, currency: string = 'EUR'): string => {
    const num = parseFloat(amount);
    if (isNaN(num)) return `${amount} ${currency}`;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency?.toUpperCase() || 'EUR'
    }).format(num);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4">Loading receipts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Receipts</h1>
          <p className="text-base-content/70">
            Manage and view all your saved receipts
          </p>
        </div>
        <Link to="/" className="btn btn-primary">
          Upload New Receipt
        </Link>
      </div>

      {receipts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold mb-2">No receipts yet</h2>
          <p className="text-base-content/60 mb-6">
            Upload your first receipt to get started
          </p>
          <Link to="/" className="btn btn-primary">
            Upload Receipt
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="card-title text-lg">
                    Receipt #{receipt.id.slice(-6)}
                  </h2>
                  <div className="badge badge-primary badge-outline">
                    {receipt.items.length} items
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">Date:</span>
                    <span className="font-medium">{formatDate(receipt.date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">Total:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(receipt.total, 'EUR')}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-base-content/60 mb-2">Items Preview:</h3>
                  <div className="space-y-1">
                    {receipt.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="truncate flex-1 mr-2">{item.name}</span>
                        <span className="font-medium">
                          {formatCurrency(item.price, 'EUR')}
                        </span>
                      </div>
                    ))}
                    {receipt.items.length > 3 && (
                      <div className="text-xs text-base-content/50">
                        +{receipt.items.length - 3} more items...
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-actions justify-end">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/receipts/${receipt.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Receipts;