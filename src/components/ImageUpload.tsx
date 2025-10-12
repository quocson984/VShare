'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onUploadSuccess?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

interface UploadedImage {
  url: string;
  thumbUrl?: string;
  filename: string;
  size: number;
}

export default function ImageUpload({
  onUploadSuccess,
  onUploadError,
  multiple = false,
  maxFiles = 5,
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (uploading) return;

    const fileArray = Array.from(files);
    
    // Check file limits
    if (!multiple && fileArray.length > 1) {
      onUploadError?.('Chỉ được upload 1 file');
      return;
    }

    if (uploadedImages.length + fileArray.length > maxFiles) {
      onUploadError?.(`Tối đa ${maxFiles} hình ảnh`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = fileArray.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        return {
          url: result.data.url,
          thumbUrl: result.data.thumbUrl,
          filename: result.data.filename,
          size: result.data.size
        };
      });

      const results = await Promise.all(uploadPromises);
      
      if (multiple) {
        setUploadedImages(prev => [...prev, ...results]);
      } else {
        setUploadedImages(results);
      }

      results.forEach(result => {
        onUploadSuccess?.(result.url);
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi upload hình ảnh';
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-orange-500 bg-orange-50' 
            : uploading 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-25'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={uploading ? undefined : openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center space-y-3">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="text-gray-600">Đang upload...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-gray-700 font-medium">
                  Kéo thả hình ảnh vào đây hoặc click để chọn
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Hỗ trợ: JPEG, PNG, GIF, BMP, WebP (tối đa 32MB)
                  {multiple && ` - Tối đa ${maxFiles} files`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Hình ảnh đã upload ({uploadedImages.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.thumbUrl || image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove button */}
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* File info */}
                <div className="mt-1 text-xs text-gray-500 truncate">
                  <p className="truncate">{image.filename}</p>
                  <p>{(image.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}