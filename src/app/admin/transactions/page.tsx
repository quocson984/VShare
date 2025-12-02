'use client';

import { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  Clock,
  X,
  Eye
} from 'lucide-react';
import DateRangePicker from '@/components/DateRangePicker';

interface Payment {
  _id: string;
  amount: number;
  status: string;
  method: string;
  bookingId?: {
    _id: string;
    renterId: {
      fullname?: string;
      email: string;
    };
    equipmentId: {
      name: string;
    };
  };
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Payout {
  _id: string;
  amount: number;
  status: string;
  ownerId: {
    _id: string;
    fullname?: string;
    email: string;
    phone?: string;
  };
  bookingId?: {
    _id: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
  };
  createdAt: string;
}

export default function TransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'payouts'>('payments');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateRange({ from: firstDay, to: lastDay });
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions');
      const data = await response.json();
      if (data.success) {
        setPayments(data.data.payments || []);
        setPayouts(data.data.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    // Filter by date range
    let matchesDateRange = true;
    if (dateRange.from || dateRange.to) {
      const paymentDate = new Date(payment.createdAt);
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && paymentDate >= fromDate;
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && paymentDate <= toDate;
      }
    }
    
    return matchesStatus && matchesDateRange;
  });

  const filteredPayouts = payouts.filter(payout => {
    const matchesStatus = filterStatus === 'all' || payout.status === filterStatus;
    
    // Filter by date range
    let matchesDateRange = true;
    if (dateRange.from || dateRange.to) {
      const payoutDate = new Date(payout.createdAt);
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && payoutDate >= fromDate;
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && payoutDate <= toDate;
      }
    }
    
    return matchesStatus && matchesDateRange;
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ xử lý', icon: Clock },
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã thanh toán', icon: CheckCircle },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Hoàn thành', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Thất bại', icon: X },
      refunded: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Đã hoàn tiền', icon: CheckCircle },
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

  const totalPayments = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPayouts = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayouts = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Giao dịch</h1>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng thu</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {totalPayments.toLocaleString('vi-VN')}đ
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng chi</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {totalPayouts.toLocaleString('vi-VN')}đ
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payout chờ</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {pendingPayouts.toLocaleString('vi-VN')}đ
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'payments'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Thanh toán ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'payouts'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Payout ({payouts.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6">
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
                <option value="pending">Chờ xử lý</option>
                <option value="paid">Đã thanh toán</option>
                <option value="completed">Hoàn thành</option>
                <option value="failed">Thất bại</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
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
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.bookingId?.renterId?.fullname || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.bookingId?.renterId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedBooking(payment.bookingId)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        Thanh toán đơn thuê
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {payment.amount.toLocaleString('vi-VN')}đ
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.paidAt 
                          ? `${new Date(payment.paidAt).toLocaleDateString('vi-VN')} ${new Date(payment.paidAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                          : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payouts Table */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chủ thiết bị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nội dung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
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
                {filteredPayouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payout.ownerId?.fullname || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payout.ownerId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        Payout cho chủ thiết bị
                      </div>
                      <div className="text-xs text-gray-500">
                        {payout.ownerId?.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {payout.amount.toLocaleString('vi-VN')}đ
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(payout.createdAt).toLocaleDateString('vi-VN')} {new Date(payout.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg min-w-[500px] max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn thuê</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mã đơn</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedBooking._id}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Thiết bị</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedBooking.equipmentId?.name || 'N/A'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Người thuê</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedBooking.renterId?.fullname || 'N/A'}</p>
                <p className="text-sm text-gray-500">{selectedBooking.renterId?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ngày bắt đầu</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.startDate ? new Date(selectedBooking.startDate).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ngày kết thúc</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.endDate ? new Date(selectedBooking.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Giá cơ bản</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.basePrice?.toLocaleString('vi-VN') || 0}đ
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phí dịch vụ</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.serviceFee?.toLocaleString('vi-VN') || 0}đ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phí bảo hiểm</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.insuranceFee?.toLocaleString('vi-VN') || 0}đ
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tổng tiền</h3>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedBooking.totalPrice?.toLocaleString('vi-VN') || 0}đ
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Trạng thái</h3>
                <p className="mt-1 text-sm text-gray-900 capitalize">{selectedBooking.status}</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
