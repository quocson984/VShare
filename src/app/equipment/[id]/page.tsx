'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Map from '@/components/Map';
import DateRangePicker from '@/components/DateRangePicker';
import ProductCard from '@/components/ProductCard';
import { 
  Calendar, 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  Camera,
  ArrowLeft,
  Heart,
  Share2,
  User,
  DollarSign,
  CheckCircle
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
    rating: number;
    reviewCount: number;
    joinedDate: string;
  };
  specifications?: Record<string, string>;
  policies?: {
    cancellation: string;
    usage: string;
    damage: string;
  };
}

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
  const [totalDays, setTotalDays] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Similar equipment
  const [similarEquipment, setSimilarEquipment] = useState<any[]>([]);

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
          setEquipment(equipmentData.data);
          setTotalPrice(equipmentData.data.pricePerDay);
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

  // Calculate total price when dates change
  useEffect(() => {
    if (dateRange.from && dateRange.to && equipment) {
      const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (days > 0) {
        setTotalDays(days);
        setTotalPrice(days * equipment.pricePerDay);
      }
    }
  }, [dateRange, equipment]);

  const handleBooking = () => {
    if (!dateRange.from || !dateRange.to) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }
    setShowBookingForm(true);
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
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="font-medium">{equipment.rating}</span>
                <span className="ml-1">({equipment.reviewCount} đánh giá)</span>
              </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="lg:col-span-1">
            <img
              src={equipment.images[selectedImage] || equipment.images[0]}
              alt={equipment.title}
              className="w-full h-80 lg:h-96 object-cover rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {equipment.images.slice(0, 4).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${equipment.title} ${index + 1}`}
                className={`w-full h-36 lg:h-44 object-cover rounded-lg cursor-pointer border-2 ${
                  selectedImage === index ? 'border-orange-500' : 'border-transparent'
                } hover:border-orange-300`}
                onClick={() => setSelectedImage(index)}
              />
            ))}
          </div>
        </div>

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
                  <h3 className="font-semibold text-gray-900">Chủ sở hữu: {equipment.owner.name}</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{equipment.owner.rating} ({equipment.owner.reviewCount} đánh giá)</span>
                    <span className="mx-2">•</span>
                    <span>Tham gia từ {new Date(equipment.owner.joinedDate).getFullYear()}</span>
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
            {equipment.specifications && (
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

            {/* Policies */}
            {equipment.policies && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Chính sách</h2>
                <div className="space-y-4">
                  {equipment.policies.cancellation && (
                    <div>
                      <h4 className="font-medium text-gray-900">Hủy đặt:</h4>
                      <p className="text-gray-700">{equipment.policies.cancellation}</p>
                    </div>
                  )}
                  {equipment.policies.usage && (
                    <div>
                      <h4 className="font-medium text-gray-900">Sử dụng:</h4>
                      <p className="text-gray-700">{equipment.policies.usage}</p>
                    </div>
                  )}
                  {equipment.policies.damage && (
                    <div>
                      <h4 className="font-medium text-gray-900">Bồi thường:</h4>
                      <p className="text-gray-700">{equipment.policies.damage}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-sm font-medium">{equipment.rating}</span>
                  <span className="text-sm text-gray-600 ml-1">({equipment.reviewCount} đánh giá)</span>
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

                {dateRange.from && dateRange.to && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>{equipment.pricePerDay.toLocaleString('vi-VN')}đ x {totalDays} ngày</span>
                      <span>{(equipment.pricePerDay * totalDays).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Phí dịch vụ</span>
                      <span>{Math.round(totalPrice * 0.05).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Tổng cộng</span>
                      <span>{(totalPrice + Math.round(totalPrice * 0.05)).toLocaleString('vi-VN')}đ</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                    Tổng: {(totalPrice + Math.round(totalPrice * 0.05)).toLocaleString('vi-VN')}đ
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
                  onClick={() => {
                    alert('Tính năng thanh toán sẽ được triển khai sau!');
                    setShowBookingForm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}