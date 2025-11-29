'use client';

import { useState, useEffect } from 'react';
import { Calendar, Package, ChevronDown, ChevronUp } from 'lucide-react';

interface Booking {
  id: string;
  equipmentId: string;
  equipmentTitle: string;
  equipmentImages: string[];
  startDate: string;
  endDate: string;
  totalPrice: number;
  quantity?: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  ownerName?: string;
  renterName?: string;
}

interface RentalHistoryProps {
  defaultExpanded?: boolean;
  showHeader?: boolean;
  searchQuery?: string;
  statusFilter?: string;
}

export default function RentalHistory({ 
  defaultExpanded = false, 
  showHeader = true,
  searchQuery = '',
  statusFilter = 'all'
}: RentalHistoryProps) {
  const [activeTab, setActiveTab] = useState<'rented' | 'renting'>('rented');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (isExpanded) {
      fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isExpanded]);

  // Apply filters whenever bookings or filter criteria change
  useEffect(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(booking => 
        booking.equipmentTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, statusFilter]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) return;
      
      const user = JSON.parse(savedUser);
      const accountId = user.id;
      if (!accountId) return;

      // Tab "rented" = thiết bị mình thuê (là renter)
      // Tab "renting" = thiết bị cho thuê (là owner)
      const endpoint = activeTab === 'rented' 
        ? `/api/bookings?renterId=${accountId}`
        : `/api/bookings?ownerId=${accountId}`;

      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
      active: { label: 'Đang thuê', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Hoàn thành', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' }
    };
    
    const badge = badges[status] || badges.pending;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>{badge.label}</span>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header - Collapsible */}
      {showHeader && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Lịch sử thuê</h2>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
      )}

      {/* Content */}
      {isExpanded && (
        <div className={showHeader ? "border-t border-gray-200" : ""}>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('rented')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'rented'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Thuê
              </button>
              <button
                onClick={() => setActiveTab('renting')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'renting'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Cho thuê
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {bookings.length === 0 
                    ? (activeTab === 'rented' ? 'Bạn chưa thuê thiết bị nào' : 'Chưa có ai thuê thiết bị của bạn')
                    : 'Không tìm thấy đơn thuê phù hợp với bộ lọc'}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên thiết bị
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày bắt đầu
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày kết thúc
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {activeTab === 'rented' ? 'Chủ thiết bị' : 'Người thuê'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.equipmentTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.quantity || 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(booking.startDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(booking.endDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatPrice(booking.totalPrice)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {activeTab === 'rented' ? (booking.ownerName || 'Unknown') : (booking.renterName || 'Unknown')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
