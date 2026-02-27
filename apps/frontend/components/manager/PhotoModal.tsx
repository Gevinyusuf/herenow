'use client';

import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  eventId: string;
}

export default function PhotoModal({ isOpen, onClose, onUpload, eventId }: PhotoModalProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size cannot exceed 10MB');
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError(null);

      const { uploadGalleryPhoto } = await import('@/lib/api/client');
      await uploadGalleryPhoto(eventId, file);
      
      onUpload();
      setImageUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadError(error.message || 'Upload failed, please try again');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      setUploadError('Please enter an image URL');
      return;
    }

    // 验证 URL 格式
    try {
      new URL(imageUrl);
    } catch {
      setUploadError('Please enter a valid URL');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const { uploadGalleryPhoto } = await import('@/lib/api/client');
      await uploadGalleryPhoto(eventId, undefined, imageUrl);
      
      onUpload();
      setImageUrl('');
    } catch (error: any) {
      console.error('Upload from URL failed:', error);
      setUploadError(error.message || 'Upload failed, please try again');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 transition-transform duration-300 ${
          isOpen ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">Add Photos</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex border-b border-slate-200 mb-4">
          <button
            onClick={() => {
              setActiveTab('file');
              setUploadError(null);
            }}
            className={`w-1/2 pb-2 text-sm font-semibold transition ${
              activeTab === 'file'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-slate-500 border-b-2 border-transparent hover:text-slate-700'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => {
              setActiveTab('url');
              setUploadError(null);
            }}
            className={`w-1/2 pb-2 text-sm font-medium transition ${
              activeTab === 'url'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-slate-500 border-b-2 border-transparent hover:text-slate-700'
            }`}
          >
            Image URL
          </button>
        </div>
        
        {activeTab === 'file' ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={handleFileSelect}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 cursor-pointer transition"
            >
              <Upload size={32} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-500 mb-1">Click to browse files</p>
              <p className="text-xs text-slate-400">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && imageUrl.trim() && !isUploading) {
                  handleUrlSubmit();
                }
              }}
              className="form-input w-full rounded-xl p-3 text-sm"
              placeholder="https://example.com/image.jpg"
              disabled={isUploading}
            />
            <p className="text-xs text-slate-400 mt-2">Enter an image URL to download and add to gallery</p>
          </div>
        )}
        
        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {uploadError}
          </div>
        )}
        
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          {activeTab === 'url' && (
            <button
              onClick={handleUrlSubmit}
              disabled={isUploading || !imageUrl.trim()}
              className="px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-herenow-orange)' }}
            >
              {isUploading ? 'Uploading...' : 'Add to Gallery'}
            </button>
          )}
        </div>
        
        {isUploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Uploading...</span>
          </div>
        )}
      </div>
    </div>
  );
}

