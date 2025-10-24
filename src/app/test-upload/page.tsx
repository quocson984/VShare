'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Upload, Image as ImageIcon, CheckCircle, XCircle, Loader } from 'lucide-react';
import Image from 'next/image';

export default function TestUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 32MB)
    if (file.size > 32 * 1024 * 1024) {
      setError('File quá lớn (tối đa 32MB)');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadResult(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file để upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload thất bại');
      }

      setUploadResult(result);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Test Image Upload API
            </h1>
            <p className="text-gray-600">
              Test chức năng upload hình ảnh sử dụng IMGBB API
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Image
              </h2>

              {/* File Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn hình ảnh
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click để chọn file hoặc kéo thả vào đây
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Hỗ trợ: JPEG, PNG, GIF, BMP, WebP (tối đa 32MB)
                    </span>
                  </label>
                </div>
              </div>

              {/* File Info */}
              {selectedFile && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">File đã chọn:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Tên:</strong> {selectedFile.name}</p>
                    <p><strong>Kích thước:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><strong>Loại:</strong> {selectedFile.type}</p>
                  </div>
                </div>
              )}

              {/* Preview */}
              {previewUrl && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Preview:</h3>
                  <div className="relative w-full h-64 border rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      style={{ objectFit: 'contain' }}
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                {uploadResult ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                ) : error ? (
                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                ) : (
                  <ImageIcon className="h-5 w-5 mr-2" />
                )}
                Kết quả
              </h2>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-700 font-medium">Lỗi:</span>
                  </div>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              )}

              {/* Success Display */}
              {uploadResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-700 font-medium">Upload thành công!</span>
                    </div>
                    <p className="text-green-600 text-sm">{uploadResult.message}</p>
                  </div>

                  {/* Uploaded Image */}
                  {uploadResult.data?.url && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Hình ảnh đã upload:</h3>
                      <div className="relative w-full h-64 border rounded-lg overflow-hidden">
                        <Image
                          src={uploadResult.data.url}
                          alt="Uploaded image"
                          fill
                          style={{ objectFit: 'contain' }}
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  )}

                  {/* API Response Details */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Chi tiết API Response:</h3>
                    <div className="bg-gray-50 rounded-md p-4">
                      <pre className="text-xs text-gray-700 overflow-auto">
                        {JSON.stringify(uploadResult, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Image URLs */}
                  {uploadResult.data && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">URLs:</h3>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Display URL:</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={uploadResult.data.url}
                              readOnly
                              className="flex-1 text-xs p-2 border rounded bg-gray-50"
                            />
                            <button
                              onClick={() => navigator.clipboard.writeText(uploadResult.data.url)}
                              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        {uploadResult.data.thumbUrl && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Thumbnail URL:</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={uploadResult.data.thumbUrl}
                                readOnly
                                className="flex-1 text-xs p-2 border rounded bg-gray-50"
                              />
                              <button
                                onClick={() => navigator.clipboard.writeText(uploadResult.data.thumbUrl)}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              {!uploadResult && !error && (
                <div className="text-center text-gray-500 py-8">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Chọn file và upload để xem kết quả</p>
                </div>
              )}
            </div>
          </div>

          {/* API Information */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Thông tin API</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Endpoint:</strong> <code className="bg-blue-100 px-2 py-1 rounded">/api/upload</code></p>
                <p><strong>Method:</strong> POST</p>
                <p><strong>Content-Type:</strong> multipart/form-data</p>
              </div>
              <div>
                <p><strong>Field name:</strong> image</p>
                <p><strong>Max size:</strong> 32MB</p>
                <p><strong>Supported formats:</strong> JPEG, PNG, GIF, BMP, WebP</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}