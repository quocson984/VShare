'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface PaymentData {
  paymentId: string;
  bookingId: string;
  amount: number;
  content: string;
  qrData: {
    accountNumber: string;
    bank: string;
    amount: number;
    content: string;
  };
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [status, setStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    if (!bookingId) {
      setError('Không tìm thấy thông tin booking');
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        console.log('Initializing payment for booking:', bookingId);
        const response = await fetch('/api/payment/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId })
        });

        console.log('Payment init response status:', response.status);
        const text = await response.text();
        console.log('Payment init response text:', text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse init response:', e);
          throw new Error('Server trả về response không hợp lệ');
        }

        console.log('Payment init data:', data);
        console.log('data.success:', data.success);
        console.log('data.data:', data.data);
        console.log('data.message:', data.message);
        console.log('data.error:', data.error);

        if (!data.success) {
          console.error('Init failed. Full response:', JSON.stringify(data, null, 2));
          throw new Error(data.message || data.error || 'Không thể khởi tạo thanh toán');
        }

        if (!data.data) {
          console.error('data.data is missing:', data);
          throw new Error('Response data is missing');
        }

        setPaymentData(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Payment init error:', err);
        setError(err instanceof Error ? err.message : 'Lỗi khởi tạo thanh toán');
        setLoading(false);
      }
    };

    init();
  }, [bookingId]);

  useEffect(() => {
    if (status === 'pending' && paymentData) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/payment/check?bookingId=${bookingId}`);
          const data = await response.json();

          if (data.success && data.data.status === 'paid') {
            setStatus('paid');
            setTimeout(() => {
              router.push(`/booking/${bookingId}`);
            }, 3000);
          }
        } catch (err) {
          console.error('Payment check error:', err);
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(pollInterval);
    }
  }, [status, paymentData, bookingId, router]);

  useEffect(() => {
    if (status === 'pending' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (countdown === 0 && status === 'pending') {
      setStatus('failed');
    }
  }, [countdown, status]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Đang khởi tạo thanh toán...</span>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lỗi thanh toán</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const qrUrl = `https://qr.sepay.vn/img?acc=${paymentData.qrData.accountNumber}&bank=${paymentData.qrData.bank}&amount=${paymentData.qrData.amount}&des=${encodeURIComponent(paymentData.qrData.content)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {status === 'paid' ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Thanh toán thành công!</h2>
            <p className="text-gray-600 mb-6">Đơn thuê của bạn đã được xác nhận</p>
            <div className="animate-pulse text-sm text-gray-500">
              Đang chuyển hướng...
            </div>
          </div>
        ) : status === 'failed' ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Hết thời gian thanh toán</h2>
            <p className="text-gray-600 mb-6">Vui lòng thử lại</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Quay lại
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Thanh toán đơn thuê</h2>
              <div className="flex items-center text-orange-600">
                <Clock className="h-5 w-5 mr-1" />
                <span className="font-mono font-semibold">{formatTime(countdown)}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Quét mã QR hoặc chuyển khoản với nội dung chính xác để đơn thuê được xác nhận tự động
              </p>
            </div>

            <div className="text-center mb-6">
              <div className="inline-block bg-white p-4 rounded-lg shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="QR Code thanh toán"
                  className="w-64 h-64 mx-auto"
                />
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Ngân hàng:</span>
                <span className="font-semibold">ACB - Á Châu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tài khoản:</span>
                <span className="font-semibold font-mono">{paymentData.qrData.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-semibold text-orange-600 text-lg">
                  {formatCurrency(paymentData.qrData.amount)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Nội dung:</span>
                <span className="font-semibold font-mono text-right break-all">
                  {paymentData.qrData.content}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mr-2"></div>
              <span className="text-sm text-gray-600">Đang chờ xác nhận thanh toán...</span>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Hủy và quay lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
