import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DatabaseReceipt } from '../types';

const Receipts: React.FC = () => {
  const [receipts, setReceipts] = useState<DatabaseReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{show: boolean; receipt: DatabaseReceipt | null}>({show: false, receipt: null});
  const [deleting, setDeleting] = useState<string | null>(null); // Track which receipt is being deleted
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
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

  const openDeleteModal = (receipt: DatabaseReceipt) => {
    setDeleteModal({show: true, receipt});
    setDeleteMessage(null);
  };

  const closeDeleteModal = () => {
    setDeleteModal({show: false, receipt: null});
  };

  const confirmDelete = async () => {
    if (!deleteModal.receipt) return;

    const receiptId = deleteModal.receipt.id;
    setDeleting(receiptId);
    setError(null);
    setDeleteMessage(null);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = `${API_BASE_URL}/api/receipts/${receiptId}`;
      
      console.log('Deleting receipt:', receiptId);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove the receipt from the local state
        setReceipts(prevReceipts => prevReceipts.filter(r => r.id !== receiptId));
        setDeleteMessage(`Receipt #${receiptId.slice(-6)} deleted successfully!`);
        closeDeleteModal();
        
        // Clear success message after 3 seconds
        setTimeout(() => setDeleteMessage(null), 3000);
      } else {
        const result = await response.json();
        setError(result.detail || result.error || 'Failed to delete receipt');
      }
    } catch (err) {
      setError('Network error occurred while deleting receipt');
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
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

      {deleteMessage && (
        <div className="alert alert-success mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{deleteMessage}</span>
        </div>
      )}

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

                <div className="card-actions justify-between">
                  <button
                    className={`btn btn-error btn-sm ${deleting === receipt.id ? 'loading' : ''}`}
                    onClick={() => openDeleteModal(receipt)}
                    disabled={deleting === receipt.id}
                    title="Delete receipt"
                  >
                    {deleting === receipt.id ? '' : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Delete
                  </button>
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

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeDeleteModal}>
          <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-base-content">
                  Delete Receipt
                </h3>
                <p className="text-sm text-base-content/60">
                  Are you sure you want to delete this receipt?
                </p>
              </div>
            </div>
            
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Receipt #{deleteModal.receipt.id.slice(-6)}</span>
                <span className="badge badge-outline">{deleteModal.receipt.items.length} items</span>
              </div>
              <div className="text-sm text-base-content/60">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{formatDate(deleteModal.receipt.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">{formatCurrency(deleteModal.receipt.total, 'EUR')}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-6">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-warning">This action cannot be undone</p>
                  <p className="text-base-content/70">The receipt and all its data will be permanently deleted.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="btn btn-outline"
                onClick={closeDeleteModal}
                disabled={deleting === deleteModal.receipt.id}
              >
                Cancel
              </button>
              <button 
                className={`btn btn-error ${deleting === deleteModal.receipt.id ? 'loading' : ''}`}
                onClick={confirmDelete}
                disabled={deleting === deleteModal.receipt.id}
              >
                {deleting === deleteModal.receipt.id ? 'Deleting...' : 'Delete Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts;