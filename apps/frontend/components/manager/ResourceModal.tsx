'use client';

import { useState, useRef } from 'react';
import { X, Upload, Link2, FileText, Image as ImageIcon, Film, Music, Archive } from 'lucide-react';

interface Resource {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  require_registration: boolean;
  created_at: string;
}

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  resources: Resource[];
  onResourceUploaded: () => void;
}

export default function ResourceModal({ isOpen, onClose, eventId, resources, onResourceUploaded }: ResourceModalProps) {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [requireRegistration, setRequireRegistration] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('File size cannot exceed 50MB');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const { uploadEventResource } = await import('@/lib/api/client');
      await uploadEventResource(eventId, file, requireRegistration);
      onResourceUploaded();
      onClose();
      setFileName('');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!fileUrl) {
      setError('Please enter a file URL');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const { uploadEventResource } = await import('@/lib/api/client');
      await uploadEventResource(eventId, fileUrl, fileName || 'Resource', requireRegistration);
      onResourceUploaded();
      onClose();
      setFileUrl('');
      setFileName('');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (fileType.includes('video')) return <Film className="w-8 h-8 text-purple-500" />;
    if (fileType.includes('audio')) return <Music className="w-8 h-8 text-green-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    return <Archive className="w-8 h-8 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col transition-transform duration-300 ${
          isOpen ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">Resources & Materials</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-colors ${
                uploadMode === 'file'
                  ? 'bg-[#FF6B3D] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload File
            </button>
            <button
              onClick={() => setUploadMode('url')}
              className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-colors ${
                uploadMode === 'url'
                  ? 'bg-[#FF6B3D] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Link2 className="w-4 h-4 inline mr-2" />
              Add URL
            </button>
          </div>

          {/* Upload Area */}
          {uploadMode === 'file' ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? 'border-[#FF6B3D] bg-orange-50' : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const file = e.dataTransfer.files[0];
                if (file) {
                  const input = fileInputRef.current;
                  if (input) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    input.files = dt.files;
                    handleFileSelect({ target: input } as any);
                  }
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
              />
              <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p className="text-slate-600 mb-1">Drag and drop your file here, or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-[#FF6B3D] font-semibold hover:underline disabled:opacity-50"
              >
                browse files
              </button>
              <p className="text-xs text-slate-400 mt-3">PDF, DOC, PPT, XLS, ZIP (max 50MB)</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Resource Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., Presentation Slides, Workshop Materials"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF6B3D] focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://example.com/resource.pdf"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF6B3D] focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-500 text-center font-medium">{error}</p>
          )}

          {/* Registration Toggle */}
          <label className="flex items-center gap-3 mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={requireRegistration}
              onChange={(e) => setRequireRegistration(e.target.checked)}
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
            />
            <span className="text-sm font-medium text-slate-700">Require Registration to Download</span>
          </label>

          {/* Existing Resources */}
          {resources && resources.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Existing Resources</h4>
              <div className="space-y-2">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    {getFileIcon(resource.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{resource.file_name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(resource.file_size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          {uploadMode === 'url' && (
            <button
              onClick={handleUrlUpload}
              disabled={uploading || !fileUrl}
              className="px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: '#FF6B3D' }}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                'Add Resource'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
