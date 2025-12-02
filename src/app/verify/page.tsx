'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, AlertTriangle, ArrowRight, RefreshCw, Upload, X } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<{
    status: 'pending' | 'verified' | 'rejected';
    createdAt: string;
    updatedAt?: string | null;
    notes?: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVerificationStatus = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get user ID from localStorage
      const accountId = localStorage.getItem('accountId');
      if (!accountId) {
        setError('Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.');
        return;
      }

      // Fetch verification status from API
      const response = await fetch(`/api/user/verification-status?userId=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải thông tin xác minh');
      }

      const data = await response.json();
      
      if (data.success) {
        setVerificationStatus(data.verification);
      } else {
        throw new Error(data.message || 'Không thể tải thông tin xác minh');
      }
    } catch (err: any) {
      console.error('Error fetching verification status:', err);
      setError(err.message || 'Không thể tải thông tin xác minh. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadedImages.length >= 3) {
      alert('Bạn chỉ có thể upload tối đa 3 ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh quá lớn (max 5MB)');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'adff3abaf78ebaa6413008156d63d754';
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const imageUrl = result.data.display_url || result.data.url;
        setUploadedImages(prev => [...prev, imageUrl]);
      } else {
        alert('Lỗi upload ảnh: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Lỗi kết nối khi upload ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitVerification = async () => {
    if (uploadedImages.length !== 3) {
      alert('Vui lòng upload đủ 3 ảnh xác minh');
      return;
    }

    const accountId = localStorage.getItem('accountId');
    if (!accountId) {
      alert('Không tìm thấy thông tin tài khoản');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: accountId,
          verificationImages: uploadedImages
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Gửi yêu cầu xác minh thành công!');
        setShowUploadForm(false);
        setUploadedImages([]);
        fetchVerificationStatus();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('Không thể gửi yêu cầu xác minh');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusContent = () => {
    if (!verificationStatus) {
      return (
        <div className="text-center p-6">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa xác minh tài khoản</h2>
          <p className="text-gray-600 mb-6">
            Để sử dụng đầy đủ tính năng của VShare, vui lòng xác minh danh tính của bạn bằng cách upload 3 ảnh:
          </p>
          <ul className="text-left text-sm text-gray-600 mb-6 max-w-md mx-auto space-y-2">
            <li className="flex items-start">
              <span className="text-orange-600 mr-2">1.</span>
              <span>Ảnh mặt trước CMND/CCCD</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-600 mr-2">2.</span>
              <span>Ảnh mặt sau CMND/CCCD</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-600 mr-2">3.</span>
              <span>Ảnh selfie cầm CMND/CCCD</span>
            </li>
          </ul>
          <div className="flex justify-center space-x-4">
            <button onClick={() => setShowUploadForm(true)} className="btn-primary py-2 px-6">
              Bắt đầu xác minh
            </button>
          </div>
        </div>
      );
    }

    switch (verificationStatus.status) {
      case 'verified':
        return (
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-green-700 mb-2">Xác minh thành công!</h2>
            <p className="text-gray-600 mb-6">
              Tài khoản của bạn đã được xác minh. Bạn có thể bắt đầu sử dụng đầy đủ tính năng của VShare.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/" className="btn-primary py-2 px-6 flex items-center">
                Đến trang chủ
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        );
        
      case 'rejected':
        return (
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-red-700 mb-2">Xác minh không thành công</h2>
            <p className="text-gray-600 mb-2">
              Rất tiếc, chúng tôi không thể xác minh danh tính của bạn với thông tin đã cung cấp.
            </p>
            {verificationStatus.notes && (
              <div className="bg-red-50 border border-red-100 rounded-md p-4 mb-6">
                <p className="text-sm text-red-800">{verificationStatus.notes}</p>
              </div>
            )}
            <div className="flex justify-center space-x-4">
              <button onClick={() => setShowUploadForm(true)} className="btn-primary py-2 px-6">
                Gửi lại xác minh
              </button>
            </div>
          </div>
        );
        
      case 'pending':
      default:
        return (
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <Clock className="h-16 w-16 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-orange-700 mb-2">Đang xác minh</h2>
            <p className="text-gray-600 mb-4">
              Chúng tôi đang xác minh thông tin của bạn. Quá trình này có thể mất tối đa 24 giờ.
            </p>
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-md bg-orange-50 rounded-md p-4 border border-orange-100">
                <p className="text-sm text-orange-800 font-medium mb-1">
                  Thông tin xác minh đã được gửi lúc:
                </p>
                <p className="text-sm text-gray-700">
                  {verificationStatus ? formatDate(verificationStatus.createdAt) : ''}
                </p>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <Link href="/" className="btn-primary py-2 px-6 flex items-center">
                Xem sản phẩm
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
              <button 
                onClick={() => setShowUploadForm(true)} 
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Xem ảnh đã gửi
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Trạng thái xác minh</h1>
            <p className="text-gray-600 mb-4">
              Kiểm tra trạng thái xác minh tài khoản của bạn
            </p>
            <button
              onClick={fetchVerificationStatus}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 text-sm text-orange-600 hover:text-orange-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {isLoading ? (
              <div className="p-10 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải thông tin xác minh...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="text-red-600 mb-4">
                  <AlertTriangle className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-red-600">{error}</p>
                <button 
                  className="mt-4 text-orange-600 hover:text-orange-800"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </button>
              </div>
            ) : (
              renderStatusContent()
            )}
          </div>

          <div className="mt-6 text-center">
            <Link href="/contact" className="text-orange-600 hover:text-orange-800 text-sm">
              Cần hỗ trợ? Liên hệ với chúng tôi
            </Link>
          </div>
        </div>
      </main>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {verificationStatus?.status === 'pending' ? 'Ảnh xác minh đã gửi' : 'Xác minh danh tính'}
              </h3>
              <button onClick={() => setShowUploadForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {verificationStatus?.status === 'pending' && (verificationStatus as any).frontCccd ? (
                /* Show existing images in view-only mode */
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Ảnh xác minh của bạn đang được xem xét. Bạn không thể thay đổi cho đến khi có kết quả.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {(verificationStatus as any).frontCccd && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Ảnh mặt trước CMND/CCCD</h4>
                        <img 
                          src={(verificationStatus as any).frontCccd}
                          alt="Front ID"
                          className="w-full rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                    {(verificationStatus as any).backCccd && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Ảnh mặt sau CMND/CCCD</h4>
                        <img 
                          src={(verificationStatus as any).backCccd}
                          alt="Back ID"
                          className="w-full rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                    {(verificationStatus as any).selfie && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Ảnh selfie cầm CMND/CCCD</h4>
                        <img 
                          src={(verificationStatus as any).selfie}
                          alt="Selfie"
                          className="w-full rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowUploadForm(false)}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                /* Show upload form for new verification or rejected */
                <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Yêu cầu upload 3 ảnh:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Ảnh mặt trước CMND/CCCD (rõ nét, đầy đủ thông tin)</li>
                  <li>Ảnh mặt sau CMND/CCCD (rõ nét, đầy đủ thông tin)</li>
                  <li>Ảnh selfie cầm CMND/CCCD (thấy rõ mặt và giấy tờ)</li>
                </ol>
              </div>

              {/* Image Upload Grid */}
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="relative">
                    {uploadedImages[index] ? (
                      <div className="relative aspect-square">
                        <img 
                          src={uploadedImages[index]} 
                          alt={`Ảnh ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border-2 border-green-500"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Ảnh {index + 1}
                        </div>
                      </div>
                    ) : (
                      <label className="block aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 cursor-pointer transition-colors">
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 hover:text-orange-500">
                          <Upload className="h-8 w-8 mb-2" />
                          <span className="text-xs">Ảnh {index + 1}</span>
                          {index === 0 && <span className="text-xs mt-1">Mặt trước</span>}
                          {index === 1 && <span className="text-xs mt-1">Mặt sau</span>}
                          {index === 2 && <span className="text-xs mt-1">Selfie</span>}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading || uploadedImages.length > index}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>

              {isUploading && (
                <div className="text-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                  Đang upload ảnh...
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Ảnh phải rõ nét, không bị mờ, không bị che khuất. 
                  Thông tin trên giấy tờ phải đầy đủ và dễ đọc.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  onClick={handleSubmitVerification}
                  disabled={uploadedImages.length !== 3 || isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu xác minh'}
                </button>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Thông tin của bạn sẽ được bảo mật và chỉ dùng cho mục đích xác minh.
              </p>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}