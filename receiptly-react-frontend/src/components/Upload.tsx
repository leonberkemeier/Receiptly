import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { n8nService } from '../services/n8nService';

const Upload: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadStatus('Uploading image...');

    try {
      // Validate file size and type
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      setUploadStatus('Sending to n8n for analysis...');
      
      // Send to n8n for analysis
      const result = await n8nService.analyzeReceipt(file, user.id);

      if (result.success && result.data) {
        // Convert file to base64 for preview
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Prepare receipt data with image
        const receiptData = {
          ...result.data,
          imageData: imageData
        };

        // Store in session and navigate to review
        sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
        navigate('/review');
      } else {
        throw new Error(result.error || 'Failed to analyze receipt');
      }
    } catch (err) {
      console.error('Upload/analysis error:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Upload Your Receipt</h1>
        <p className="text-lg text-base-content/70">
          Drag and drop your receipt image or click to browse files
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div 
        className={`border-2 border-dashed border-base-300 rounded-lg p-12 text-center transition-colors
          ${dragOver ? 'border-primary bg-primary/5' : ''}
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && openFileDialog()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileSelect}
        />
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p className="text-lg font-medium">Processing your receipt...</p>
            {uploadStatus && (
              <p className="text-sm text-base-content/60 mt-1">{uploadStatus}</p>
            )}
            <p className="text-xs text-base-content/50 mt-2">
              AI analysis may take 1-2 minutes
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg className="w-16 h-16 text-base-content/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium mb-2">
              {dragOver ? 'Drop your receipt here' : 'Drag & drop your receipt image'}
            </p>
            <p className="text-base-content/60 mb-4">or</p>
            <button className="btn btn-primary">
              Browse Files
            </button>
            <p className="text-sm text-base-content/50 mt-4">
              Supported formats: PNG, JPG, JPEG (Max 10MB)
            </p>
            <p className="text-xs text-base-content/50 mt-2">
              Images will be analyzed using n8n + AI
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-base-content/60">
          Your receipt will be processed using AI to extract item details, prices, and totals.
          You'll be able to review and edit the information before saving.
        </p>
      </div>
    </div>
  );
};

export default Upload;