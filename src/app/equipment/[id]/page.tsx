'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Map from '@/components/Map';
import DateRangePicker from '@/components/DateRangePicker';
import ProductCard from '@/components/ProductCard';
import { 
  Star, 
  MapPin, 
  Shield, 
  ArrowLeft,
  Heart,
  Share2,
  User
} from 'lucide-react';

interface Equipment {
  _id: string;
  title: string;
  description: string;
  category: string;
  pricePerDay: number;
  rating: number;
  reviewCount: number;
  images: string[];
  availability: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  owner: {
    _id: string;
    name: string;
    avatar?: string;
    credit?: string;
    status?: string;
  };
  specifications?: Record<string, string>;
  policies?: {
    cancellation: string;
    usage: string;
    damage: string;
  };
  ownerId?: string;
  replacementPrice?: number;
  deposit?: number;
}

interface InsuranceOption {
  id: string;
  name: string;
  description?: string;
  minCoverage?: number;
  maxCoverage?: number;
  status?: string;
}

type BookingRecord = {
  id: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  serviceFee: number;
  insuranceFee: number;
  totalPrice: number;
  status: string;
  checkinTime?: string;
  checkoutTime?: string;
  checkinImages?: string[];
  checkoutImages?: string[];
  insuranceId?: string;
  quantity: number;
  notes?: string;
};

const DEFAULT_INSURANCE_OPTION: InsuranceOption = {
  id: 'none',
  name: 'Không chọn bảo hiểm',
  description: 'Rủi ro do người thuê chịu hoàn toàn',
  minCoverage: 0,
  maxCoverage: 0,
  status: 'active'
};

const statusLabels: Record<string, string> = {
  pending: 'Đang chờ xử lý',
  confirmed: 'Đã xác nhận',
  reviewing: 'Đang kiểm tra',
  completed: 'Hoàn tất',
  failed: 'Thất bại'
};

const normalizeBooking = (booking: any): BookingRecord => ({
  id: booking._id?.toString() ?? booking.id,
  startDate: booking.startDate,
  endDate: booking.endDate,
  basePrice: booking.basePrice ?? 0,
  serviceFee: booking.serviceFee ?? 0,
  insuranceFee: booking.insuranceFee ?? 0,
  totalPrice: booking.totalPrice ?? 0,
  status: booking.status ?? 'confirmed',
  checkinTime: booking.checkinTime,
  checkoutTime: booking.checkoutTime,
  checkinImages: booking.checkinImages,
  checkoutImages: booking.checkoutImages,
  insuranceId: booking.insuranceId,
  quantity: booking.quantity ?? 1,
  notes: booking.notes
});

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const estimateInsuranceFee = (option: InsuranceOption | null, days: number) => {
  if (!option || option.id === 'none') {
    return 0;
  }
  const coverage = ((option.minCoverage ?? 0) + (option.maxCoverage ?? 0)) / 2;
  return Math.max(15000, Math.round(coverage * 0.0015 * Math.max(1, days)));
};

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [liked, setLiked] = useState(false);
  
  // Booking state
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Similar equipment
  const [similarEquipment, setSimilarEquipment] = useState<any[]>([]);
  const [insuranceOptions, setInsuranceOptions] = useState<InsuranceOption[]>([DEFAULT_INSURANCE_OPTION]);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState(DEFAULT_INSURANCE_OPTION.id);
  const [bookingRecord, setBookingRecord] = useState<BookingRecord | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Calculate price instantly using useMemo (no delay)
  const { totalDays, totalPrice } = useMemo(() => {
    if (!dateRange.from || !dateRange.to || !equipment) {
      return { totalDays: 1, totalPrice: 0 };
    }

    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // RULE: Don't charge for first day (pickup) and last day (return)
    let chargeableDays = 0;
    let hasWeekend = false;
    let consecutiveWeekendDays = 0;

    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1); // Skip first day

    while (currentDate < endDate) { // Stop before last day
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Weekend day
        consecutiveWeekendDays++;
        if (!hasWeekend) {
          hasWeekend = true;
        }
      } else {
        // Weekday
        // If we just finished a weekend period, count it as 1 day
        if (hasWeekend && consecutiveWeekendDays > 0) {
          chargeableDays += 1;
          hasWeekend = false;
          consecutiveWeekendDays = 0;
        }
        chargeableDays += 1;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // If loop ended while in weekend period, count it
    if (hasWeekend && consecutiveWeekendDays > 0) {
      chargeableDays += 1;
    }

    chargeableDays = Math.max(1, chargeableDays);
    return {
      totalDays: chargeableDays,
      totalPrice: chargeableDays * equipment.pricePerDay
    };
  }, [dateRange, equipment]);

  // Calculate insurance fee instantly
  const insuranceFee = useMemo(() => {
    const selectedOption = insuranceOptions.find((opt) => opt.id === selectedInsuranceId) ?? null;
    return estimateInsuranceFee(selectedOption, Math.max(1, totalDays));
  }, [selectedInsuranceId, insuranceOptions, totalDays]);

  // Calculate service fee (5% of base price)
  const serviceFee = useMemo(() => {
    return Math.round(totalPrice * 0.05);
  }, [totalPrice]);

  // Calculate final total
  const finalTotal = useMemo(() => {
    return totalPrice + serviceFee + insuranceFee;
  }, [totalPrice, serviceFee, insuranceFee]);

  // Fetch equipment details, booked dates, and similar equipment
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch equipment details
        const [equipmentRes, bookedDatesRes, similarRes] = await Promise.all([
          fetch(`/api/equipment/${params.id}`),
          fetch(`/api/equipment/${params.id}/bookings`),
          fetch(`/api/equipment/${params.id}/similar`)
        ]);
        
        const equipmentData = await equipmentRes.json();
        const bookedDatesData = await bookedDatesRes.json();
        const similarData = await similarRes.json();

        if (equipmentData.success) {
          setEquipment(equipmentData.equipment || equipmentData.data);
        } else {
          setError(equipmentData.message || 'Không tìm thấy thiết bị');
        }
        
        // Process booked dates
        if (bookedDatesData.success) {
          const dates: Date[] = [];
          bookedDatesData.data.forEach((booking: { start: string; end: string }) => {
            const start = new Date(booking.start);
            const end = new Date(booking.end);
            
            // Add all dates in the range
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              dates.push(new Date(d));
            }
          });
          setBookedDates(dates);
        }
        
        // Set similar equipment
        if (similarData.success) {
          setSimilarEquipment(similarData.data);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Lỗi kết nối server');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  useEffect(() => {
    const controller = new AbortController();
    const loadInsurance = async () => {
      try {
        const response = await fetch('/api/insurance', { signal: controller.signal });
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const normalized = data.data.map((item: any, index: number) => ({
            id: item._id?.toString() ?? item.id ?? `insurance-${index}`,
            name: item.name,
            description: item.description,
            minCoverage: item.minCoverage,
            maxCoverage: item.maxCoverage,
            status: item.status
          }));
          setInsuranceOptions([DEFAULT_INSURANCE_OPTION, ...normalized]);
        }
      } catch (err) {
        console.error('Unable to load insurance packages:', err);
      }
    };

    loadInsurance();
    return () => {
      controller.abort('Component unmounted');
    };
  }, []);

  const handleBooking = () => {
    console.log('=== handleBooking called ===');
    
    // Check if user is logged in first (MUST have accountId)
    const accountId = localStorage.getItem('accountId');
    console.log('accountId from localStorage:', accountId);
    console.log('accountId type:', typeof accountId);
    console.log('accountId truthiness:', !!accountId);
    
    if (!accountId || accountId === 'null' || accountId === 'undefined' || accountId.trim() === '') {
      console.log('No valid accountId - redirecting to login');
      showToast('Vui lòng đăng nhập để đặt thuê thiết bị', 'error');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      return;
    }

    // Check user verification status
    const userStr = localStorage.getItem('user');
    console.log('user from localStorage:', userStr);
    
    if (!userStr || userStr === 'null' || userStr === 'undefined') {
      console.log('No valid user data - redirecting to login');
      showToast('Vui lòng đăng nhập để đặt thuê thiết bị', 'error');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      console.log('User status:', userData.status);
      console.log('User data:', userData);
      
      if (userData.status !== 'verified') {
        console.log('User not verified - redirecting to verify');
        showToast('Bạn cần xác minh tài khoản trước khi thuê thiết bị', 'error');
        setTimeout(() => {
          router.push('/verify');
        }, 1500);
        return;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      showToast('Lỗi xác thực thông tin người dùng', 'error');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      return;
    }
    
    console.log('✓ User is logged in and verified - proceeding');

    if (!dateRange.from || !dateRange.to) {
      showToast('Vui lòng chọn ngày bắt đầu và kết thúc', 'error');
      return;
    }
    
    // Calculate total days
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Validate minimum 3 days
    if (totalDays < 3) {
      showToast('Đặt lịch phải tối thiểu 3 ngày (bao gồm ngày nhận và trả)', 'error');
      return;
    }
    
    setShowBookingForm(true);
  };

  const handleBookingConfirm = async () => {
    if (!equipment || !dateRange.from || !dateRange.to) {
      return;
    }

    // Get logged in user ID
    const accountId = localStorage.getItem('accountId');
    if (!accountId) {
      showToast('Vui lòng đăng nhập để đặt thuê thiết bị', 'error');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      return;
    }

    // Check user verification status
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      if (userData.status === 'unverified') {
        showToast('Bạn cần xác minh tài khoản trước khi thuê thiết bị', 'error');
        setTimeout(() => {
          router.push('/verify');
        }, 2000);
        return;
      }
    }

    setBookingSubmitting(true);
    try {
      const startDate = new Date(dateRange.from).toISOString();
      const endDate = new Date(dateRange.to).toISOString();
      const ownerCandidate = equipment.ownerId || equipment.owner._id;
      const ownerId = /^[0-9a-fA-F]{24}$/.test(ownerCandidate || '') ? ownerCandidate! : '000000000000000000000001';
      const payload: Record<string, any> = {
        equipmentId: equipment._id,
        startDate,
        endDate,
        renterId: accountId,
        ownerId,
        quantity: 1,
        notes: `Đặt thuê từ trang ${equipment.title}`
      };

      if (selectedInsuranceId !== DEFAULT_INSURANCE_OPTION.id) {
        payload.insuranceId = selectedInsuranceId;
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('Booking response status:', response.status);
      const text = await response.text();
      console.log('Booking response text:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Server trả về response không hợp lệ');
      }
      
      if (!data.success) {
        console.error('Booking error details:', data);
        throw new Error(data.message || data.error || 'Không thể tạo đơn thuê.');
      }

      const bookingId = data.data._id || data.data.id;
      setBookingRecord(normalizeBooking(data.data));
      setShowBookingForm(false);
      showToast('Đang chuyển sang trang thanh toán...', 'success');
      
      // Redirect to payment page
      setTimeout(() => {
        router.push(`/payment?bookingId=${bookingId}`);
      }, 1000);
    } catch (err) {
      console.error('Booking API error:', err);
      showToast(err instanceof Error ? err.message : 'Không thể tạo đơn thuê', 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="text-center py-20">
          <div className="text-red-500 mb-4">{error}</div>
          <button 
            onClick={() => router.back()}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const mapMarkers = equipment.location?.coordinates ? [{
    id: equipment._id,
    position: [equipment.location.coordinates[1], equipment.location.coordinates[0]] as [number, number],
    title: equipment.title,
    description: `${equipment.pricePerDay.toLocaleString('vi-VN')}đ/ngày`
  }] : [];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay lại kết quả tìm kiếm
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {/* Title and Actions */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{equipment.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{equipment.location?.address}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setLiked(!liked)}
              className={`p-2 rounded-full border ${liked ? 'bg-red-50 border-red-200' : 'bg-white border-gray-300'} hover:bg-gray-50`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
            </button>
            <button className="p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50">
              <Share2 className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Images Gallery */}
        {equipment.images && equipment.images.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className="lg:col-span-1">
              <img
                src={equipment.images[selectedImage] || equipment.images[0]}
                alt={equipment.title}
                className="w-full h-80 lg:h-96 object-cover rounded-lg"
              />
            </div>
          </div>
        ) : (
          <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center mb-8">
            <div className="text-center text-gray-500">
              <p>Chưa có hình ảnh</p>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Owner Info */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  {equipment.owner.avatar ? (
                    <img src={equipment.owner.avatar} alt={equipment.owner.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{equipment.owner.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {equipment.owner.credit && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        equipment.owner.credit === 'trusted' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {equipment.owner.credit === 'trusted' ? 'Đáng tin cậy' : 'Hạn chế'}
                      </span>
                    )}
                    {equipment.owner.status && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        equipment.owner.status === 'active' 
                          ? 'bg-blue-100 text-blue-800' 
                          : equipment.owner.status === 'unverified'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {equipment.owner.status === 'active' ? 'Hoạt động' : equipment.owner.status === 'unverified' ? 'Chưa xác minh' : 'Bị cấm'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mô tả thiết bị</h2>
              <p className="text-gray-700 leading-relaxed">{equipment.description}</p>
            </div>

            {/* Specifications */}
            {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông số kỹ thuật</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(equipment.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Vị trí</h2>
              <div className="h-64 rounded-lg overflow-hidden">
                <Map
                  center={equipment.location?.coordinates ? 
                    [equipment.location.coordinates[1], equipment.location.coordinates[0]] : 
                    [10.8231, 106.6297]}
                  markers={mapMarkers}
                  zoom={15}
                  height="100%"
                  className="h-full w-full"
                />
              </div>
              <p className="text-gray-600 mt-2">{equipment.location?.address}</p>
            </div>

          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-gray-200 rounded-lg p-6 bg-white shadow-lg">
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-gray-900">
                    {equipment.pricePerDay.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-gray-600 ml-1">/ngày</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn ngày thuê
                  </label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    disabledDates={bookedDates}
                    minDate={new Date()}
                  />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-sm text-gray-700">
                  <p className="font-medium text-gray-900 mb-3">Gói bảo hiểm</p>
                  <div className="space-y-3">
                    {insuranceOptions.map((option) => {
                      const optionFee = estimateInsuranceFee(option, Math.max(1, totalDays));
                      return (
                        <label
                          key={option.id}
                          className={`flex items-start space-x-3 rounded-lg p-3 border ${selectedInsuranceId === option.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white'} cursor-pointer`}
                        >
                          <input
                            type="radio"
                            name="insurance"
                            value={option.id}
                            checked={selectedInsuranceId === option.id}
                            onChange={() => setSelectedInsuranceId(option.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{option.name}</span>
                              <span className="text-orange-600 font-semibold">
                                {option.id === DEFAULT_INSURANCE_OPTION.id ? 'Miễn phí' : formatCurrency(optionFee)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                            {typeof option.minCoverage === 'number' && typeof option.maxCoverage === 'number' && option.id !== DEFAULT_INSURANCE_OPTION.id && (
                              <p className="text-xs text-gray-400 mt-1">
                                Phạm vi bảo hiểm: {formatCurrency(option.minCoverage)} – {formatCurrency(option.maxCoverage)}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {dateRange.from && dateRange.to && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>{equipment.pricePerDay.toLocaleString('vi-VN')}đ x {totalDays} ngày</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Phí dịch vụ</span>
                      <span>{formatCurrency(serviceFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Bảo hiểm</span>
                      <span>{formatCurrency(insuranceFee)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Tổng cộng</span>
                      <span>{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={!dateRange.from || !dateRange.to || equipment.availability !== 'available'}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {equipment.availability !== 'available' ? 'Không khả dụng' : 'Đặt thuê ngay'}
                </button>

                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-1" />
                  <span>Thanh toán an toàn và bảo mật</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {bookingRecord && (
          <div className="mt-12 border border-gray-200 rounded-lg bg-gray-50 p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-500">Đơn thuê đã tạo</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(bookingRecord.totalPrice ?? 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(bookingRecord.startDate).toLocaleDateString('vi-VN')} →{' '}
                  {new Date(bookingRecord.endDate).toLocaleDateString('vi-VN')}
                </p>
                <p className="text-xs text-gray-500">
                  Phí dịch vụ {formatCurrency(bookingRecord.serviceFee ?? 0)} · Bảo hiểm{' '}
                  {formatCurrency(bookingRecord.insuranceFee ?? 0)}
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                  {statusLabels[bookingRecord.status] ?? 'Đang xử lý'}
                </span>
                <Link
                  href="/my-equipment"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700"
                >
                  Theo dõi & check-in
                </Link>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Đơn thuê này được quản lý tại mục <span className="font-semibold">Thiết bị của tôi</span>.
              Bạn có thể kiểm tra tiến trình, upload hình ảnh, và ghi nhận check-in/check-out ở trang đó bất cứ lúc nào.
            </p>
          </div>
        )}

        {/* Similar Equipment Section */}
        {similarEquipment.length > 0 && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Thiết bị tương tự gần đây
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarEquipment.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/equipment/${item.id}`)}
                  className="cursor-pointer hover:shadow-lg transition-shadow rounded-lg border border-gray-200 overflow-hidden"
                >
                  <ProductCard
                    id={item.id}
                    name={item.title}
                    price={item.pricePerDay}
                    image={item.image}
                    rating={item.rating}
                    reviewCount={item.reviewCount}
                    location={item.location}
                    category="camera"
                    available={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Xác nhận đặt thuê</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{equipment.title}</h4>
                <p className="text-sm text-gray-600">{equipment.location?.address}</p>
                <div className="mt-2 text-sm">
                  <div>Từ: {dateRange.from?.toLocaleDateString('vi-VN')}</div>
                  <div>Đến: {dateRange.to?.toLocaleDateString('vi-VN')}</div>
                  <div className="font-medium mt-1">
                    Tổng: {formatCurrency(finalTotal)}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBookingConfirm}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed"
                  disabled={bookingSubmitting}
                >
                  {bookingSubmitting ? 'Đang tạo đơn...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[300px] px-4 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 ${
              toast.type === 'success' 
                ? 'bg-green-500' 
                : toast.type === 'error' 
                ? 'bg-red-500' 
                : 'bg-blue-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{toast.message}</span>
              <button
                onClick={() => setToasts(toasts.filter(t => t.id !== toast.id))}
                className="ml-4 text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}