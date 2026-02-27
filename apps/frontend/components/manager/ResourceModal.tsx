'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { uploadEventResource } from '@/lib/api/client';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  eventId: string;
}

export default function ResourceModal({ isOpen, onClose, onUpload, eventId }: ResourceModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('Drag file here or click to upload');
  const [fileError, setFileError] = useState('');
  const [regRequired, setRegRequired] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setFileError('file size cannot exceed 50MB');
        setFileName('Drag file here or click to upload');
        setSelectedFile(null);
        e.target.value = '';
      } else {
        setFileError('');
        setFileName(file.name);
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setFileError('please select a file to upload');
      return;
    }

    if (!eventId) {
      setFileError('event id not found');
      return;
    }

    try {
      setIsUploading(true);
      setFileError('');
      
      await uploadEventResource(eventId, selectedFile, regRequired);
      
      // 重置状态
      setSelectedFile(null);
      setFileName('Drag file here or click to upload');
      setRegRequired(false);
      
      // 触发父组件的刷新
      onUpload();
      onClose();
    } catch (error: any) {
      setFileError(error.message || 'upload failed, please try again later');
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
          <h3 className="text-xl font-bold text-slate-900">Upload Resource</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 relative">
            <input
              type="file"
              id="resourceFileInput"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-sm text-slate-500">{fileName}</p>
            <p className="text-xs text-slate-400 mt-1">Max size: 50MB</p>
          </div>
          {fileError && (
            <p className="text-xs text-red-500 text-center font-medium">
              {fileError}
            </p>
          )}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={regRequired}
              onChange={(e) => setRegRequired(e.target.checked)}
              disabled={isUploading}
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
            />
            <span className="text-sm font-medium text-slate-700">Require Registration to Download</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-herenow-orange)' }}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

