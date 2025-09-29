import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ReceiptItem } from '../types';
import { authenticatedFetch } from '../utils/api';

const Review: React.FC = () => {
  const [receiptData, setReceiptData] = useState<Receipt | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = sessionStorage.getItem('receiptData');
    if (storedData) {
      try {
        setReceiptData(JSON.parse(storedData));
      } catch (e) {
        console.error('Failed to parse receipt data:', e);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const addItem = () => {
    if (receiptData) {
      setReceiptData({
        ...receiptData,
        items: [...receiptData.items, { name: '', price: '0.00', quantity: '1' }]
      });
    }
  };

  const removeItem = (index: number) => {
    if (receiptData) {
      setReceiptData({
        ...receiptData,
        items: receiptData.items.filter((_, i) => i !== index)
      });
    }
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string) => {
    if (receiptData) {
      const updatedItems = receiptData.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      );
      setReceiptData({
        ...receiptData,
        items: updatedItems
      });
    }
  };

  const updateReceiptField = (field: keyof Receipt, value: string) => {
    if (receiptData) {
      setReceiptData({
        ...receiptData,
        [field]: value
      });
    }
  };

  const saveReceipt = async () => {
    if (!receiptData) return;

    setSaving(true);
    setError(null);

    try {
      console.log('Starting receipt save...', {
        receiptData,
        apiBaseUrl: process.env.REACT_APP_API_BASE_URL
      });
      
      console.log('About to make API call to /api/receipts');
      
      // Send to your PostgreSQL backend API with authentication
      const response = await authenticatedFetch('/api/receipts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...receiptData,
          // Add metadata
          processedAt: new Date().toISOString(),
          source: 'n8n_analysis'
        })
      });

      console.log('API Response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

      const result = await response.json();
      console.log('API Response body:', result);

      if (response.ok) {
        // FastAPI returns the receipt object directly
        setSuccess(true);
        sessionStorage.removeItem('receiptData');

        setTimeout(() => {
          navigate('/receipts');
        }, 1500);
      } else {
        setError(result.detail || result.error || 'Failed to save receipt');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Save error details:', err);
    } finally {
      setSaving(false);
    }
  };

  const calculateSubtotal = (): string => {
    if (!receiptData) return '0.00';
    
    const subtotal = receiptData.items
      .filter(item => item.price && !isNaN(parseFloat(item.price)))
      .reduce((sum, item) => {
        const price = parseFloat(item.price);
        const quantity = parseFloat(item.quantity) || 1;
        return sum + (price * quantity);
      }, 0);
    
    return subtotal.toFixed(2);
  };

  const formatDateTime = (date: string, time: string): string => {
    if (!date || !time) return '';
    
    try {
      // Try various date/time combinations
      let dateTime: Date;
      
      // First try ISO format with T separator
      try {
        dateTime = new Date(`${date}T${time}`);
        if (!isNaN(dateTime.getTime())) {
          return dateTime.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch {}
      
      // Try with space separator
      try {
        dateTime = new Date(`${date} ${time}`);
        if (!isNaN(dateTime.getTime())) {
          return dateTime.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch {}
      
      // Try parsing each part separately
      try {
        const datePart = new Date(date);
        const timeParts = time.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        
        if (timeParts && !isNaN(datePart.getTime())) {
          const hours = parseInt(timeParts[1], 10);
          const minutes = parseInt(timeParts[2], 10);
          const seconds = timeParts[3] ? parseInt(timeParts[3], 10) : 0;
          
          dateTime = new Date(datePart);
          dateTime.setHours(hours, minutes, seconds);
          
          if (!isNaN(dateTime.getTime())) {
            return dateTime.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        }
      } catch {}
      
      // Fallback to raw string
      return `${date} ${time}`;
    } catch {
      return `${date} ${time}`;
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Receipt saved successfully!</span>
        </div>
        <p className="text-base-content/60 mt-4">Redirecting to receipt details...</p>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4">Loading receipt data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Review & Edit Receipt</h1>
        <p className="text-base-content/70">
          Please review the extracted information and make any necessary corrections.
        </p>
        {receiptData.date && receiptData.time && (
          <p className="text-sm text-base-content/60 mt-2">
            Receipt from: {formatDateTime(receiptData.date, receiptData.time)}
          </p>
        )}
        {receiptData.store && (
          <p className="text-sm text-base-content/60">
            Store: {receiptData.store}
            {receiptData.address && ` • ${receiptData.address}`}
          </p>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Receipt Image */}
          {receiptData.imageData && (
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h2 className="card-title mb-4">Original Receipt</h2>
                <div className="flex justify-center">
                  <img 
                    src={receiptData.imageData} 
                    alt="Original Receipt" 
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="card bg-base-200 shadow-md">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Receipt Items</h2>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={addItem}
                >
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {receiptData.items.map((item, index) => (
                  <div key={index} className="p-4 bg-base-100 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-base-content/60">
                        Item {index + 1}
                      </span>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => removeItem(index)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-2">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-xs">Name</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered input-sm w-full"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          placeholder="Item name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-xs">Price</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-xs">Quantity</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            placeholder="1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="space-y-6">
          {/* Receipt Details */}
          <div className="card bg-base-200 shadow-md">
            <div className="card-body">
              <h2 className="card-title mb-4">Receipt Details</h2>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs">Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={receiptData.date}
                    onChange={(e) => updateReceiptField('date', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs">Time</span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered input-sm"
                    value={receiptData.time}
                    onChange={(e) => updateReceiptField('time', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs">Store Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={receiptData.store || ''}
                    onChange={(e) => updateReceiptField('store', e.target.value)}
                    placeholder="Store name (optional)"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs">Store Address</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={receiptData.address || ''}
                    onChange={(e) => updateReceiptField('address', e.target.value)}
                    placeholder="Store address (optional)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Totals Section */}
          <div className="card bg-base-200 shadow-md">
            <div className="card-body">
              <h3 className="font-semibold mb-4">Totals</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-base-300 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${parseFloat(calculateSubtotal()) === parseFloat(receiptData.total) ? 'text-success' : ''}`}>
                      Subtotal (calculated):
                    </span>
                    {parseFloat(calculateSubtotal()) === parseFloat(receiptData.total) && (
                      <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`font-mono text-lg ${parseFloat(calculateSubtotal()) === parseFloat(receiptData.total) ? 'text-success' : ''}`}>
                    {calculateSubtotal()}
                  </span>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Total</span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered input-sm font-mono font-bold"
                    value={receiptData.total}
                    onChange={(e) => updateReceiptField('total', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {parseFloat(calculateSubtotal()) !== parseFloat(receiptData.total) && (
                  <div className="alert alert-warning">
                    <span className="text-xs">
                      Difference: {(parseFloat(receiptData.total) - parseFloat(calculateSubtotal())).toFixed(2)}
                      (This could be taxes, fees, or discounts)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="card bg-base-200 shadow-md">
            <div className="card-body">
              <div className="space-y-2">
                <button
                  className={`btn btn-primary w-full ${saving ? 'loading' : ''}`}
                  onClick={saveReceipt}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Receipt'}
                </button>
                <button
                  className="btn btn-ghost w-full"
                  onClick={() => navigate('/')}
                >
                  Back to Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;