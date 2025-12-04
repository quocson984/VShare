'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar,
  Package,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import Image from 'next/image';
import DateRangePicker from '@/components/DateRangePicker';

interface Booking {
  _id: string;
  equipmentId: {
    _id: string;
    name: string;
    images: string[];
    pricePerDay: number;
  };
  renterId: {
    _id: string;
    fullname?: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  ownerId: {
    _id: string;
    fullname?: string;
    email: string;
    phone?: string;
  };
  startDate: string;
  endDate: string;
  basePrice: number;
  serviceFee: number;
  insuranceFee: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateRange({ from: firstDay, to: lastDay });
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/rentals');
      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    // Exclude pending status
    if (booking.status === 'pending') {
      return false;
    }
    
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    
    // Filter by date range
    let matchesDateRange = true;
    if (dateRange.from || dateRange.to) {
      const bookingDate = new Date(booking.createdAt);
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && bookingDate >= fromDate;
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && bookingDate <= toDate;
      }
    }
    
    return matchesStatus && matchesDateRange;
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ xác nhận', icon: Clock },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Đã xác nhận', icon: CheckCircle },
      ongoing: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đang thuê', icon: CheckCircle },
      reviewing: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Đang xem xét', icon: AlertCircle },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Hoàn thành', icon: CheckCircle },
      canceled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã hủy', icon: XCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Thất bại', icon: XCircle },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ thanh toán', icon: Clock },
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã thanh toán', icon: CheckCircle },
      refunded: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Đã hoàn tiền', icon: AlertCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Thất bại', icon: XCircle },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Đơn thuê</h1>
      </div>

      <div className="p-8">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Tổng đơn thuê</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {filteredBookings.length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Doanh thu từ phí dịch vụ</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {filteredBookings
              .reduce((sum, b) => sum + b.serviceFee, 0)
              .toLocaleString('vi-VN')}đ
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Doanh thu từ phí bảo hiểm</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {filteredBookings
              .reduce((sum, b) => sum + b.insuranceFee, 0)
              .toLocaleString('vi-VN')}đ
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng thời gian</label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              minDate={new Date(2020, 0, 1)}
            />
          </div>

          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="ongoing">Đang thuê</option>
              <option value="completed">Hoàn thành</option>
              <option value="canceled">Đã hủy</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thiết bị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người thuê
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chủ sở hữu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày bắt đầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày kết thúc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá thuê
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phí dịch vụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phí bảo hiểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {booking.equipmentId?.images?.[0] ? (
                          <Image
                            src={booking.equipmentId.images[0]}
                            alt={booking.equipmentId.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate" title={booking.equipmentId?.name || 'N/A'}>
                          {booking.equipmentId?.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.renterId?.fullname || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.ownerId?.fullname || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(booking.startDate).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(booking.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.basePrice?.toLocaleString('vi-VN') || '0'}đ
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.serviceFee?.toLocaleString('vi-VN') || '0'}đ
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.insuranceFee?.toLocaleString('vi-VN') || '0'}đ
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(booking.createdAt).toLocaleDateString('vi-VN')} {new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg min-w-[600px] max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết đơn thuê</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Equipment Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Thiết bị</h3>
                <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
                  {selectedBooking.equipmentId?.images?.[0] && (
                    <Image
                      src={selectedBooking.equipmentId.images[0]}
                      alt={selectedBooking.equipmentId.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedBooking.equipmentId?.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedBooking.equipmentId?.pricePerDay?.toLocaleString('vi-VN')}đ/ngày
                    </p>
                  </div>
                </div>
              </div>

              {/* Rental Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <p className="text-gray-900">{new Date(selectedBooking.startDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <p className="text-gray-900">{new Date(selectedBooking.endDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số ngày thuê</label>
                  <p className="text-gray-900">{calculateDays(selectedBooking.startDate, selectedBooking.endDate)} ngày</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tổng giá</label>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedBooking.totalPrice.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>

              {/* Renter Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Người thuê</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-900"><span className="font-medium">Tên:</span> {selectedBooking.renterId?.fullname || 'N/A'}</p>
                  <p className="text-gray-900"><span className="font-medium">Email:</span> {selectedBooking.renterId?.email}</p>
                  <p className="text-gray-900"><span className="font-medium">SĐT:</span> {selectedBooking.renterId?.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Owner Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Chủ thiết bị</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-900"><span className="font-medium">Tên:</span> {selectedBooking.ownerId?.fullname || 'N/A'}</p>
                  <p className="text-gray-900"><span className="font-medium">Email:</span> {selectedBooking.ownerId?.email}</p>
                  <p className="text-gray-900"><span className="font-medium">SĐT:</span> {selectedBooking.ownerId?.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái đơn</label>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái thanh toán</label>
                  {getPaymentBadge(selectedBooking.paymentStatus)}
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo đơn</label>
                <p className="text-gray-900">{new Date(selectedBooking.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
