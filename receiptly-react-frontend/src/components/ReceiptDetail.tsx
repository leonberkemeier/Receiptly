import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DatabaseReceipt, ReceiptItem } from '../types';

const ReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<DatabaseReceipt | null>(null);
  const [editedReceipt, setEditedReceipt] = useState<DatabaseReceipt | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!id) {
        setError('No receipt ID provided');
        setLoading(false);
        return;
      }

      try {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const apiUrl = `${API_BASE_URL}/api/receipts/${id}`;
        
        console.log('Fetching receipt from:', apiUrl);
        
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        console.log('Receipt API response:', { ok: response.ok, status: response.status, result });

        if (response.ok) {
          setReceipt(result);
          setEditedReceipt(result); // Initialize edited version
        } else {
          setError(result.detail || result.error || 'Failed to fetch receipt');
        }
      } catch (err) {
        setError('Network error occurred');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  // Handle keyboard events for image modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showImageModal) {
        closeImageModal();
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (date: string, time: string): string => {
    if (!date || !time) return '';
    
    try {
      let dateTime: Date;
      
      // Try ISO format with T separator
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
      
      // Fallback to raw string
      return `${date} ${time}`;
    } catch {
      return `${date} ${time}`;
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

  const calculateSubtotal = (receiptToCalculate?: DatabaseReceipt | null): string => {
    const targetReceipt = receiptToCalculate || receipt;
    if (!targetReceipt) return '0.00';
    
    const subtotal = targetReceipt.items
      .filter(item => item.price && !isNaN(parseFloat(item.price)))
      .reduce((sum, item) => {
        const price = parseFloat(item.price);
        const quantity = parseFloat(item.quantity) || 1;
        return sum + (price * quantity);
      }, 0);
    
    return subtotal.toFixed(2);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSaveMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedReceipt(receipt); // Reset to original
    setSaveMessage(null);
  };

  const handleSaveEdit = async () => {
    if (!editedReceipt || !id) return;

    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = `${API_BASE_URL}/api/receipts/${id}`;
      
      // Prepare update data (exclude readonly fields)
      const updateData = {
        date: editedReceipt.date,
        time: editedReceipt.time,
        total: editedReceipt.total,
        imageData: editedReceipt.imageData,
        store: editedReceipt.store,
        address: editedReceipt.address
      };
      
      console.log('Updating receipt:', updateData);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setReceipt(result);
        setEditedReceipt(result);
        setIsEditing(false);
        setSaveMessage('Receipt updated successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setError(result.detail || result.error || 'Failed to update receipt');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateReceiptField = (field: keyof DatabaseReceipt, value: string) => {
    if (editedReceipt) {
      setEditedReceipt({
        ...editedReceipt,
        [field]: value
      });
    }
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string) => {
    if (editedReceipt) {
      const updatedItems = editedReceipt.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      );
      setEditedReceipt({
        ...editedReceipt,
        items: updatedItems
      });
    }
  };

  const addItem = () => {
    if (editedReceipt) {
      const newItem = {
        id: `temp_${Date.now()}`,
        name: '',
        price: '0.00',
        quantity: '1'
      };
      setEditedReceipt({
        ...editedReceipt,
        items: [...editedReceipt.items, newItem]
      });
    }
  };

  const removeItem = (index: number) => {
    if (editedReceipt) {
      setEditedReceipt({
        ...editedReceipt,
        items: editedReceipt.items.filter((_, i) => i !== index)
      });
    }
  };

  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4">Loading receipt details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
        <div className="mt-6 text-center">
          <Link to="/receipts" className="btn btn-primary">
            Back to Receipts
          </Link>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-2xl font-bold mb-2">Receipt not found</h2>
        <p className="text-base-content/60 mb-6">
          The receipt you're looking for doesn't exist or has been deleted.
        </p>
        <Link to="/receipts" className="btn btn-primary">
          Back to Receipts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/receipts" className="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Receipts
          </Link>
          <div className="badge badge-outline">Receipt #{receipt.id.slice(-6)}</div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">
            Receipt Details {isEditing && <span className="text-warning">(Editing)</span>}
          </h1>
          {!isEditing && (
            <button className="btn btn-primary btn-sm" onClick={handleEdit}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Receipt
            </button>
          )}
        </div>
        
        {saveMessage && (
          <div className="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{saveMessage}</span>
          </div>
        )}
        
        <p className="text-base-content/70">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text text-xs">Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={editedReceipt?.date || ''}
                  onChange={(e) => updateReceiptField('date', e.target.value)}
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text text-xs">Time</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered input-sm w-full"
                  value={editedReceipt?.time || ''}
                  onChange={(e) => updateReceiptField('time', e.target.value)}
                />
              </div>
            </div>
          ) : (
            formatDateTime(receipt.date, receipt.time)
          )}
        </p>
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="label">
                <span className="label-text text-xs">Store Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={editedReceipt?.store || ''}
                onChange={(e) => updateReceiptField('store', e.target.value)}
                placeholder="Store name (optional)"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text text-xs">Store Address</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={editedReceipt?.address || ''}
                onChange={(e) => updateReceiptField('address', e.target.value)}
                placeholder="Store address (optional)"
              />
            </div>
          </div>
        ) : (
          (receipt.store || receipt.address) && (
            <p className="text-sm text-base-content/60 mt-1">
              {receipt.store && `${receipt.store}`}
              {receipt.store && receipt.address && ` • `}
              {receipt.address && receipt.address}
            </p>
          )
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Receipt Image */}
        {receipt.imageData && (
          <div className="lg:col-span-1">
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <h2 className="card-title mb-4">Original Receipt</h2>
                <div className="flex justify-center">
                  <img 
                    src={receipt.imageData} 
                    alt="Original Receipt" 
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={openImageModal}
                  />
                </div>
                <p className="text-xs text-center text-base-content/60 mt-2">
                  Click image to enlarge
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Details */}
        <div className={`space-y-6 ${receipt.imageData ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {/* Items */}
          <div className="card bg-base-200 shadow-md">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">
                  Items ({isEditing ? editedReceipt?.items.length || 0 : receipt.items.length})
                </h2>
                {isEditing && (
                  <button className="btn btn-primary btn-sm" onClick={addItem}>
                    Add Item
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                      {isEditing && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditing ? editedReceipt?.items || [] : receipt.items).map((item, index) => (
                      <tr key={item.id}>
                        <td className="font-medium">
                          {isEditing ? (
                            <input
                              type="text"
                              className="input input-bordered input-sm w-full"
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                              placeholder="Item name"
                            />
                          ) : (
                            item.name
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="input input-bordered input-sm w-20"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              placeholder="1"
                            />
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="input input-bordered input-sm w-24"
                              value={item.price}
                              onChange={(e) => updateItem(index, 'price', e.target.value)}
                              placeholder="0.00"
                            />
                          ) : (
                            formatCurrency(item.price, 'EUR')
                          )}
                        </td>
                        <td className="font-medium">
                          {formatCurrency(
                            (parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2), 
                            'EUR'
                          )}
                        </td>
                        {isEditing && (
                          <td>
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => removeItem(index)}
                              disabled={(editedReceipt?.items.length || 0) <= 1}
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card bg-base-200 shadow-md">
            <div className="card-body">
              <h2 className="card-title mb-4">Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-base-300 rounded">
                  <span className="text-sm font-medium text-base-content/60">
                    Subtotal (calculated):
                  </span>
                  <span className="font-mono text-lg">
                    {formatCurrency(calculateSubtotal(isEditing ? editedReceipt : receipt), 'EUR')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded border border-primary/20">
                  <span className="text-lg font-bold">
                    Total:
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="input input-bordered input-sm font-mono text-right w-32"
                      value={editedReceipt?.total || ''}
                      onChange={(e) => updateReceiptField('total', e.target.value)}
                      placeholder="0.00"
                    />
                  ) : (
                    <span className="font-mono text-2xl font-bold text-primary">
                      {formatCurrency(receipt.total, 'EUR')}
                    </span>
                  )}
                </div>

                {(() => {
                  const currentReceipt = isEditing ? editedReceipt : receipt;
                  if (!currentReceipt) return null;
                  
                  const subtotal = parseFloat(calculateSubtotal(currentReceipt));
                  const total = parseFloat(currentReceipt.total || '0');
                  return subtotal !== total && (
                    <div className="alert alert-info">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span className="text-sm">
                        Difference: {formatCurrency(
                          (total - subtotal).toFixed(2), 
                          'EUR'
                        )} (taxes, fees, or discounts)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Receipt Metadata */}
          <div className="card bg-base-200 shadow-md">
            <div className="card-body">
              <h2 className="card-title mb-4">Receipt Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-base-content/60">Receipt ID:</span>
                  <p className="font-mono font-medium">{receipt.id}</p>
                </div>
                <div>
                  <span className="text-base-content/60">Date & Time:</span>
                  <p className="font-medium">{formatDateTime(receipt.date, receipt.time)}</p>
                </div>
                <div>
                  <span className="text-base-content/60">Created:</span>
                  <p className="font-medium">{formatDate(receipt.createdAt.toString())}</p>
                </div>
                <div>
                  <span className="text-base-content/60">Last Updated:</span>
                  <p className="font-medium">{formatDate(receipt.updatedAt.toString())}</p>
                </div>
                {receipt.store && (
                  <div>
                    <span className="text-base-content/60">Store:</span>
                    <p className="font-medium">{receipt.store}</p>
                  </div>
                )}
                {receipt.address && (
                  <div>
                    <span className="text-base-content/60">Address:</span>
                    <p className="font-medium">{receipt.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center gap-4">
        <Link to="/receipts" className="btn btn-outline">
          Back to All Receipts
        </Link>
        {isEditing ? (
          <>
            <button 
              className="btn btn-error"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              className={`btn btn-success ${saving ? 'loading' : ''}`}
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={handleEdit}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Receipt
          </button>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && receipt?.imageData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={closeImageModal}>
          <div className="relative max-w-full max-h-full">
            <button 
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
              onClick={closeImageModal}
              aria-label="Close image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={receipt.imageData} 
              alt="Receipt Full Size" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking on image
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptDetail;