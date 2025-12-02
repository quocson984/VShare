'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { MessageSquare, Plus, X, AlertCircle, CheckCircle, Clock, Upload } from 'lucide-react';

interface Incident {
  id: string;
  bookingId?: string;
  equipmentTitle?: string;
  description: string;
  type: 'damage' | 'theft' | 'late' | 'other' | 'question';
  severity?: 'minor' | 'major' | 'critical';
  status: 'pending' | 'resolved' | 'rejected';
  images?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  id: string;
  equipmentTitle: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function SupportPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; fullname: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    bookingId: '',
    type: 'question' as 'damage' | 'theft' | 'late' | 'other' | 'question',
    severity: 'minor' as 'minor' | 'major' | 'critical',
    description: '',
    images: [] as string[]
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(savedUser);
    setUser(userData);
    fetchIncidents(userData.id);
    fetchBookings(userData.id);
    setIsLoading(false);
  }, [router]);

  const fetchIncidents = async (userId: string) => {
    try {
      const response = await fetch(`/api/incidents?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setIncidents(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    }
  };

  const fetchBookings = async (userId: string) => {
    try {
      const response = await fetch(`/api/dashboard/rentals?userId=${userId}&role=renter`);
      const data = await response.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        reporterId: user.id,
        type: formData.type,
        description: formData.description,
        images: formData.images
      };

      // Only add booking-related fields if a booking is selected
      if (formData.bookingId && formData.type !== 'question') {
        payload.bookingId = formData.bookingId;
        payload.severity = formData.severity;
      }

      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Gửi yêu cầu hỗ trợ thành công!');
        setShowForm(false);
        setFormData({
          bookingId: '',
          type: 'question',
          severity: 'minor',
          description: '',
          images: []
        });
        fetchIncidents(user.id);
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting incident:', error);
      alert('Không thể gửi yêu cầu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh quá lớn (max 5MB)');
      return;
    }

    try {
      const formDataImg = new FormData();
      formDataImg.append('image', file);

      const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'adff3abaf78ebaa6413008156d63d754';
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: 'POST',
        body: formDataImg
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const imageUrl = result.data.display_url || result.data.url;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl]
        }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Lỗi upload ảnh');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800' }
    };
    
    const badge = badges[status] || badges.pending;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>{badge.label}</span>;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      damage: 'Hư hỏng',
      theft: 'Mất cắp',
      late: 'Trễ hẹn',
      other: 'Khác',
      question: 'Câu hỏi'
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideSearch={true} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hỗ trợ</h1>
            <p className="text-gray-600 mt-1">Báo cáo sự cố hoặc đặt câu hỏi</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Tạo yêu cầu mới</span>
          </button>
        </div>

        {/* Incidents List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lịch sử yêu cầu</h2>
          </div>
          
          {incidents.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có yêu cầu hỗ trợ nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(incident.status)}
                        <h3 className="font-medium text-gray-900">{getTypeLabel(incident.type)}</h3>
                        {getStatusBadge(incident.status)}
                        {incident.severity && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            incident.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {incident.severity === 'critical' ? 'Nghiêm trọng' :
                             incident.severity === 'major' ? 'Quan trọng' : 'Nhỏ'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                      {incident.equipmentTitle && (
                        <p className="text-sm text-gray-500">Thiết bị: {incident.equipmentTitle}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">{formatDate(incident.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Incident Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Tạo yêu cầu hỗ trợ</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại yêu cầu *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="question">Câu hỏi</option>
                    <option value="damage">Hư hỏng thiết bị</option>
                    <option value="theft">Mất cắp</option>
                    <option value="late">Trễ hẹn</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                {/* Booking (only if not question) */}
                {formData.type !== 'question' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đơn thuê *
                      </label>
                      <select
                        value={formData.bookingId}
                        onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        required
                      >
                        <option value="">Chọn đơn thuê</option>
                        {bookings.map((booking) => (
                          <option key={booking.id} value={booking.id}>
                            {booking.equipmentTitle} - {new Date(booking.startDate).toLocaleDateString('vi-VN')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mức độ nghiêm trọng *
                      </label>
                      <select
                        value={formData.severity}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        required
                      >
                        <option value="minor">Nhỏ</option>
                        <option value="major">Quan trọng</option>
                        <option value="critical">Nghiêm trọng</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả chi tiết *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    rows={5}
                    placeholder="Mô tả chi tiết vấn đề của bạn..."
                    maxLength={1000}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 ký tự</p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh (tùy chọn)
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      <span>Tải ảnh lên</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx)
                            }))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Incident Detail Modal */}
        {selectedIncident && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết yêu cầu</h3>
                <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(selectedIncident.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">{getTypeLabel(selectedIncident.type)}</h4>
                    <p className="text-sm text-gray-500">{formatDate(selectedIncident.createdAt)}</p>
                  </div>
                  {getStatusBadge(selectedIncident.status)}
                </div>

                {selectedIncident.equipmentTitle && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Thiết bị</h5>
                    <p className="text-sm text-gray-900">{selectedIncident.equipmentTitle}</p>
                  </div>
                )}

                {selectedIncident.severity && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Mức độ</h5>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      selectedIncident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      selectedIncident.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedIncident.severity === 'critical' ? 'Nghiêm trọng' :
                       selectedIncident.severity === 'major' ? 'Quan trọng' : 'Nhỏ'}
                    </span>
                  </div>
                )}

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Mô tả</h5>
                  <p className="text-sm text-gray-900">{selectedIncident.description}</p>
                </div>

                {selectedIncident.notes && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Ghi chú từ admin</h5>
                    <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">{selectedIncident.notes}</p>
                  </div>
                )}

                {selectedIncident.images && selectedIncident.images.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Hình ảnh</h5>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedIncident.images.map((img, idx) => (
                        <img key={idx} src={img} alt="" className="w-full h-32 object-cover rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
