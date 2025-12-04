'use client';

import { useEffect, useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, X, Eye, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Incident {
  _id: string;
  type: string;
  description: string;
  severity?: string;
  status: string;
  images?: string[];
  reporterId: {
    _id: string;
    fullname?: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  bookingId?: {
    _id: string;
    startDate: string;
    endDate: string;
    equipmentId?: {
      name: string;
      images: string[];
    };
  };
  resolution?: string;
  createdAt: string;
}

export default function SupportPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    if (selectedIncident) {
      setResponseText(selectedIncident.resolution || '');
    }
  }, [selectedIncident]);

  const fetchIncidents = async () => {
    try {
      const response = await fetch('/api/admin/support');
      const data = await response.json();
      if (data.success) {
        setIncidents(data.data);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'resolved' | 'rejected') => {
    if (!selectedIncident || !responseText.trim()) {
      alert('Vui lòng nhập phản hồi');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/support', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: selectedIncident._id,
          status,
          resolution: responseText
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchIncidents();
        setSelectedIncident(null);
        setResponseText('');
        alert('Cập nhật thành công');
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = 
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.reporterId?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.reporterId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || incident.type === filterType;
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
    const configs = {
      damage: { bg: 'bg-red-100', text: 'text-red-700', label: 'Hư hỏng' },
      theft: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Mất cắp' },
      late: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Trễ hạn' },
      question: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Câu hỏi' },
      other: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Khác' },
    };
    const config = configs[type as keyof typeof configs] || configs.other;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ xử lý', icon: Clock },
      resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã giải quyết', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Từ chối', icon: X },
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
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Hỗ trợ</h1>
      </div>

      {/* Content */}
      <div className="p-8">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Tổng yêu cầu</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{incidents.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Chờ xử lý</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {incidents.filter(i => i.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Đã giải quyết</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {incidents.filter(i => i.status === 'resolved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Từ chối</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {incidents.filter(i => i.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả loại</option>
            <option value="damage">Hư hỏng</option>
            <option value="theft">Mất cắp</option>
            <option value="late">Trễ hạn</option>
            <option value="question">Câu hỏi</option>
            <option value="other">Khác</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người báo cáo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncidents.map((incident) => (
                <tr key={incident._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {incident.reporterId?.avatar ? (
                        <Image
                          src={incident.reporterId.avatar}
                          alt={incident.reporterId.fullname || incident.reporterId.email}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-sm">
                            {incident.reporterId?.fullname?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {incident.reporterId?.fullname || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{incident.reporterId?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(incident.type)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {incident.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(incident.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(incident.createdAt).toLocaleDateString('vi-VN')} {new Date(incident.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg min-w-[600px] max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết yêu cầu hỗ trợ</h2>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại yêu cầu</label>
                  {getTypeBadge(selectedIncident.type)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  {getStatusBadge(selectedIncident.status)}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedIncident.description}</p>
              </div>

              {/* Images */}
              {selectedIncident.images && selectedIncident.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh đính kèm</label>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedIncident.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <Image
                          src={img}
                          alt={`Evidence ${idx + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reporter Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Người báo cáo</label>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-900">
                    <span className="font-medium">Tên:</span> {selectedIncident.reporterId?.fullname || 'N/A'}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium">Email:</span> {selectedIncident.reporterId?.email}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-medium">SĐT:</span> {selectedIncident.reporterId?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Equipment Info */}
              {selectedIncident.bookingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thiết bị liên quan</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 font-medium">
                      {selectedIncident.bookingId.equipmentId?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Thuê từ {new Date(selectedIncident.bookingId.startDate).toLocaleDateString('vi-VN')} đến{' '}
                      {new Date(selectedIncident.bookingId.endDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              )}

              {/* Resolution */}
              {selectedIncident.resolution && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giải pháp</label>
                  <p className="text-gray-900 bg-green-50 p-4 rounded-lg">{selectedIncident.resolution}</p>
                </div>
              )}

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian tạo</label>
                <p className="text-gray-900">
                  {new Date(selectedIncident.createdAt).toLocaleDateString('vi-VN')} {new Date(selectedIncident.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Response Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phản hồi</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Nhập phản hồi cho yêu cầu này..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
                <button
                  onClick={() => {
                    setSelectedIncident(null);
                    setResponseText('');
                  }}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:cursor-not-allowed"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
