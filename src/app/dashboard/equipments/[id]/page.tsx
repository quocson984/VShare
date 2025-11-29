'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  User, 
  Clock,
  XCircle,
  Trash2,
  AlertCircle,
  Save,
  EyeOff,
  Settings,
  List,
  Upload
} from 'lucide-react';

interface Equipment {
  id: string;
  title: string;
  description: string;
  brand: string;
  model: string;
  category: string;
  quantity: number;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  replacementPrice: number;
  deposit: number;
  status: 'available' | 'unavailable';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
  images: string[];
  specifications?: Record<string, string>;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  id: string;
  renterId: string;
  renterName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export default function EquipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params?.id as string;
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<Partial<Equipment>>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'bookings'>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    if (equipmentId) {
      fetchEquipmentDetails();
      fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentId]);

  useEffect(() => {
    if (equipment) {
      setFormData({
        title: equipment.title,
        description: equipment.description,
        brand: equipment.brand,
        model: equipment.model,
        category: equipment.category,
        quantity: equipment.quantity,
        pricePerDay: equipment.pricePerDay,
        pricePerWeek: equipment.pricePerWeek,
        pricePerMonth: equipment.pricePerMonth,
        replacementPrice: equipment.replacementPrice,
        deposit: equipment.deposit,
        address: equipment.address,
        specifications: equipment.specifications
      });
      setUploadedImages(equipment.images);
    }
  }, [equipment]);

  const fetchEquipmentDetails = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const accountId = localStorage.getItem('accountId');
      if (!accountId) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/equipment/${equipmentId}`);
      const data = await response.json();
      
      if (data.success) {
        setEquipment(data.data);
      } else {
        setError(data.message || 'Không thể tải thông tin thiết bị');
      }
    } catch (err: unknown) {
      setError('Lỗi khi tải thiết bị: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/bookings?detailed=true`);
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleInputChange = (field: keyof Equipment, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!equipment) return;
    
    setIsProcessing(true);
    
    try {
      const accountId = localStorage.getItem('accountId');
      if (!accountId) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const response = await fetch('/api/equipment/owner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          equipmentId: equipment.id,
          ownerId: accountId,
          updates: {
            ...formData,
            images: uploadedImages
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchEquipmentDetails();
        setHasChanges(false);
        alert('Đã lưu thay đổi thành công');
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (err: unknown) {
      alert('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!equipment) return;
    
    setIsProcessing(true);
    
    try {
      const accountId = localStorage.getItem('accountId');
      const newStatus = equipment.status === 'available' ? 'unavailable' : 'available';
      
      const response = await fetch('/api/equipment/owner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          equipmentId: equipment.id,
          ownerId: accountId,
          updates: { status: newStatus }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchEquipmentDetails();
        alert(`Trạng thái thiết bị đã được cập nhật thành ${newStatus === 'available' ? 'Có sẵn' : 'Không có sẵn'}`);
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (err: unknown) {
      alert('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!equipment) return;
    
    if (!confirm('Bạn có chắc chắn muốn xóa thiết bị này? Hành động này không thể hoàn tác.')) {
      return;
    }

    setIsProcessing(true);
    
    try {
      const accountId = localStorage.getItem('accountId');
      
      const response = await fetch(`/api/equipment/owner?equipmentId=${equipment.id}&ownerId=${accountId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Thiết bị đã được xóa thành công');
        router.push('/dashboard/equipments');
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (err: unknown) {
      alert('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
      active: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-800' },
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header hideSearch={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy thiết bị</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/dashboard/equipments"
              className="inline-flex items-center text-orange-600 hover:text-orange-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideSearch={true} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/dashboard/equipments"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Link>

        {/* Status and Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Trạng thái</label>
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      equipment.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {equipment.status === 'available' ? 'Có sẵn' : 'Không có sẵn'}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Duyệt</label>
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      equipment.approvalStatus === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : equipment.approvalStatus === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {equipment.approvalStatus === 'approved' ? 'Đã duyệt' 
                        : equipment.approvalStatus === 'rejected' ? 'Bị từ chối' 
                        : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isProcessing}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Lưu
                  </button>
                  <button
                    onClick={handleStatusToggle}
                    disabled={isProcessing || equipment.approvalStatus !== 'approved'}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    {equipment.status === 'available' ? 'Ẩn' : 'Hiện'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isProcessing}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </button>
                </div>
              </div>
        </div>

        {equipment.approvalStatus === 'rejected' && equipment.approvalNotes && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Thiết bị bị từ chối duyệt</p>
              <p className="text-sm text-red-700 mt-1">{equipment.approvalNotes}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'info'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Thông tin chung
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'bookings'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <List className="h-4 w-4 inline mr-2" />
                Lịch đặt ({bookings.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'info' ? (
          <div className="space-y-6">
            {/* Thông tin chung */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chung</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên sản phẩm
                  </label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thương hiệu
                        </label>
                        <input
                          type="text"
                          value={formData.brand || ''}
                          onChange={(e) => handleInputChange('brand', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Loại
                        </label>
                        <select
                          value={formData.category || ''}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="Màn hình">Màn hình</option>
                          <option value="Camera">Camera</option>
                          <option value="Laptop">Laptop</option>
                          <option value="Micro">Micro</option>
                          <option value="Đèn">Đèn</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mô tả sản phẩm */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Mô tả sản phẩm</h3>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nhập mô tả chi tiết về thiết bị..."
                  />
                </div>

                {/* Trích dẫn */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trích dẫn</h3>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="Trích dẫn sản phẩm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Hình ảnh sản phẩm */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh sản phẩm</h3>
                  
                  {/* Display existing images */}
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={image}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => {
                            setUploadedImages(prev => prev.filter((_, i) => i !== index));
                            setHasChanges(true);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add more button */}
                    <button className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-orange-500 hover:bg-orange-50">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-500 mt-2">Thêm ảnh</span>
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    hoặc <button className="text-orange-600 hover:underline">Thêm từ URL</button>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Giá thuê</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá/Ngày (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={formData.pricePerDay || ''}
                        onChange={(e) => handleInputChange('pricePerDay', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá/Tuần (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={formData.pricePerWeek || ''}
                        onChange={(e) => handleInputChange('pricePerWeek', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá/Tháng (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={formData.pricePerMonth || ''}
                        onChange={(e) => handleInputChange('pricePerMonth', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        value={formData.quantity || ''}
                        onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiền cọc (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={formData.deposit || ''}
                        onChange={(e) => handleInputChange('deposit', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá thay thế (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={formData.replacementPrice || ''}
                        onChange={(e) => handleInputChange('replacementPrice', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ</h3>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Nhập địa chỉ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch đặt thiết bị</h3>
                
                {isLoadingBookings ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải lịch đặt...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có lịch đặt nào</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <User className="h-5 w-5 text-gray-400" />
                              <span className="font-medium text-gray-900">{booking.renterName}</span>
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                <span className="font-medium">{formatPrice(booking.totalPrice)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <Clock className="h-4 w-4 inline mr-1" />
                            {formatDate(booking.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
