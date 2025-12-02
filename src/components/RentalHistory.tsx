'use client';

import { useState, useEffect } from 'react';
import { Calendar, Package, ChevronDown, ChevronUp, User, Mail, Phone, MapPin, X } from 'lucide-react';

interface Booking {
  id: string;
  equipmentId: string;
  equipmentTitle: string;
  equipmentImage?: string;
  equipmentImages?: string[];
  startDate: string;
  endDate: string;
  totalPrice: number;
  quantity?: number;
  serialNumbers?: string[];
  status: 'pending' | 'ongoing' | 'completed' | 'canceled' | 'failed' | 'reviewing';
  createdAt: string;
  ownerName?: string;
  renterName?: string;
  ownerId?: string;
  renterId?: string;
  ownerEmail?: string;
  renterEmail?: string;
  ownerPhone?: string;
  renterPhone?: string;
}

interface UserProfile {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  bio?: string;
}

interface RentalHistoryProps {
  defaultExpanded?: boolean;
  showHeader?: boolean;
  searchQuery?: string;
  statusFilter?: string;
  startDateFilter?: string;
  endDateFilter?: string;
}

export default function RentalHistory({ 
  defaultExpanded = false, 
  showHeader = true,
  searchQuery = '',
  statusFilter = 'all',
  startDateFilter = '',
  endDateFilter = ''
}: RentalHistoryProps) {
  const [activeTab, setActiveTab] = useState<'rented' | 'renting'>('rented');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

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

    // Date range filter
    if (startDateFilter) {
      filtered = filtered.filter(booking => {
        const bookingStart = new Date(booking.startDate);
        const filterStart = new Date(startDateFilter);
        return bookingStart >= filterStart;
      });
    }
    if (endDateFilter) {
      filtered = filtered.filter(booking => {
        const bookingEnd = new Date(booking.endDate);
        const filterEnd = new Date(endDateFilter);
        return bookingEnd <= filterEnd;
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, statusFilter, startDateFilter, endDateFilter]);

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
      const role = activeTab === 'rented' ? 'renter' : 'owner';
      const endpoint = `/api/dashboard/rentals?userId=${accountId}&role=${role}`;

      console.log('📡 Fetching rentals:', { endpoint, accountId, role });
      const response = await fetch(endpoint);
      const data = await response.json();
      console.log('✅ Rentals data:', data);
      
      if (data.success) {
        setBookings(data.data || []);
        console.log('📋 Sample booking:', data.data[0]);
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
      ongoing: { label: 'Đang thuê', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Hoàn thành', color: 'bg-gray-100 text-gray-800' },
      canceled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
      failed: { label: 'Thất bại', color: 'bg-red-100 text-red-800' },
      reviewing: { label: 'Đang kiểm tra', color: 'bg-blue-100 text-blue-800' }
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

  const handleViewProfile = async (userId: string, userName: string) => {
    console.log('🔍 Opening profile for:', { userId, userName });
    setLoadingProfile(true);
    try {
      const url = `/api/user/profile?userId=${userId}`;
      console.log('📡 Fetching profile from:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('✅ Profile data received:', data);
      
      if (data.success && data.data) {
        setSelectedProfile(data.data);
      } else {
        console.warn('⚠️ API returned no data, using fallback');
        // Fallback if API fails
        setSelectedProfile({
          id: userId,
          fullname: userName,
          email: '',
          phone: '',
          address: '',
          bio: ''
        });
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      // Fallback
      setSelectedProfile({
        id: userId,
        fullname: userName,
        email: '',
        phone: '',
        address: '',
        bio: ''
      });
    } finally {
      setLoadingProfile(false);
      console.log('✅ Profile modal should be visible now');
    }
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
                      Serial Numbers
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
                      <td className="px-6 py-4">
                        {booking.serialNumbers && booking.serialNumbers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {booking.serialNumbers.map((serial, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded"
                              >
                                {serial}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
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
                        <button
                          onClick={() => {
                            const userId = activeTab === 'rented' ? booking.ownerId : booking.renterId;
                            const userName = activeTab === 'rented' ? booking.ownerName : booking.renterName;
                            if (userId && userName) {
                              handleViewProfile(userId, userName);
                            }
                          }}
                          className="text-sm text-orange-600 hover:text-orange-800 hover:underline cursor-pointer"
                        >
                          {activeTab === 'rented' ? (booking.ownerName || 'Unknown') : (booking.renterName || 'Unknown')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Thông tin người dùng</h3>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {loadingProfile ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {/* Avatar and Name */}
                <div className="flex items-center space-x-4">
                  {selectedProfile.avatar ? (
                    <img 
                      src={selectedProfile.avatar} 
                      alt={selectedProfile.fullname}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-orange-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedProfile.fullname}</h4>
                    {selectedProfile.bio && (
                      <p className="text-sm text-gray-500 mt-1">{selectedProfile.bio}</p>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  {selectedProfile.email && (
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">{selectedProfile.email}</span>
                    </div>
                  )}
                  {selectedProfile.phone && (
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">{selectedProfile.phone}</span>
                    </div>
                  )}
                  {selectedProfile.address && (
                    <div className="flex items-center space-x-3 text-gray-700">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">{selectedProfile.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button
                onClick={() => setSelectedProfile(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
