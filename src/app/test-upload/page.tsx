'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import ImageUpload from '@/components/ImageUpload';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function TestUploadPage() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ type: 'success' | 'error'; text: string }[]>([]);

  const handleUploadSuccess = (imageUrl: string) => {
    setUploadedUrls(prev => [...prev, imageUrl]);
    setMessages(prev => [...prev, { type: 'success', text: `Upload thành công: ${imageUrl}` }]);
  };

  const handleUploadError = (error: string) => {
    setMessages(prev => [...prev, { type: 'error', text: `Lỗi upload: ${error}` }]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const clearUploadedImages = () => {
    setUploadedUrls([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Image Upload</h1>
          <p className="text-gray-600">
            Test tính năng upload hình ảnh sử dụng ImgBB API. Hệ thống hỗ trợ upload nhiều file, 
            kéo thả, và preview hình ảnh.
          </p>
        </div>

        {/* Upload Component */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Hình Ảnh</h2>
          
          <ImageUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            multiple={true}
            maxFiles={10}
            className="mb-4"
          />
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
              <button
                onClick={clearMessages}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Xóa tất cả
              </button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 p-3 rounded-lg ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-sm break-all">{message.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded URLs List */}
        {uploadedUrls.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                URLs Đã Upload ({uploadedUrls.length})
              </h3>
              <button
                onClick={clearUploadedImages}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Xóa tất cả
              </button>
            </div>
            
            <div className="space-y-3">
              {uploadedUrls.map((url, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {/* Image Preview */}
                    <div className="flex-shrink-0">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                    
                    {/* URL Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          Hình ảnh #{index + 1}
                        </h4>
                        <button
                          onClick={() => navigator.clipboard.writeText(url)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                        >
                          Copy URL
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 break-all font-mono bg-gray-50 p-2 rounded">
                        {url}
                      </p>
                      
                      <div className="mt-2 flex space-x-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Xem ảnh gốc
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Documentation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Documentation</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Endpoint</h4>
              <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                POST /api/upload
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Request Format</h4>
              <p className="text-sm text-gray-600">Content-Type: multipart/form-data</p>
              <p className="text-sm text-gray-600">Field: image (File)</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Supported Formats</h4>
              <p className="text-sm text-gray-600">JPEG, PNG, GIF, BMP, WebP</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">File Size Limit</h4>
              <p className="text-sm text-gray-600">32MB per file</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Response Example</h4>
              <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-x-auto">
{`{
  "success": true,
  "data": {
    "url": "https://i.ibb.co/...",
    "deleteUrl": "https://ibb.co/...",
    "displayUrl": "https://i.ibb.co/...",
    "thumbUrl": "https://i.ibb.co/...",
    "filename": "image.jpg",
    "size": 1234567
  },
  "message": "Upload hình ảnh thành công"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}