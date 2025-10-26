'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

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
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Không có thông tin xác minh</h2>
          <p className="text-gray-600 mb-6">
            Chưa có thông tin xác minh nào được tìm thấy cho tài khoản của bạn.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register" className="btn-primary py-2 px-6">
              Đăng ký xác minh
            </Link>
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
              <Link href="/register" className="btn-primary py-2 px-6">
                Thử lại
              </Link>
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
            <p className="text-gray-600">
              Chúng tôi đang xác minh thông tin của bạn. Quá trình này có thể mất tối đa 24 giờ.
            </p>
            <div className="flex justify-center mt-6">
              <div className="w-full max-w-md bg-orange-50 rounded-md p-4 border border-orange-100">
                <p className="text-sm text-orange-800 font-medium mb-1">
                  Thông tin xác minh đã được gửi lúc:
                </p>
                <p className="text-sm text-gray-700">
                  {verificationStatus ? formatDate(verificationStatus.createdAt) : ''}
                </p>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <Link href="/" className="btn-primary py-2 px-6 flex items-center">
                Xem sản phẩm
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
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

      <Footer />
    </div>
  );
}