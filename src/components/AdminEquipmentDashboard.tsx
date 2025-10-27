'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  User
} from 'lucide-react';
import Image from 'next/image';

interface Equipment {
  id: string;
  title: string;
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
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    fullname: string;
    phone: string;
  };
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface StatusCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminEquipmentDashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [counts, setCounts] = useState<StatusCounts>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  const fetchEquipment = async (status: string = currentStatus, page: number = currentPage) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/admin/equipment?status=${status}&page=${page}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setEquipment(data.data.equipment);
        setPagination(data.data.pagination);
        setCounts(data.data.counts);
      } else {
        setError(data.message || 'Không thể tải danh sách thiết bị');
      }
    } catch (err: any) {
      setError('Lỗi khi tải thiết bị: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [currentStatus, currentPage]);

  const handleStatusChange = (status: 'pending' | 'approved' | 'rejected') => {
    setCurrentStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAction = async (equipmentId: string, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          equipmentId,
          action,
          notes: actionNotes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchEquipment();
        setSelectedEquipment(null);
        setActionNotes('');
        alert(`Thiết bị đã được ${action === 'approve' ? 'duyệt' : 'từ chối'} thành công!`);
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'pending':
      default:
        return 'text-orange-600 bg-orange-100';
    }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-orange-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Duyệt thiết bị</h2>
              <p className="text-gray-600">Xem xét và duyệt danh sách thiết bị</p>
            </div>
          </div>
          <button
            onClick={() => fetchEquipment()}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex space-x-2">
          {[
            { key: 'pending', label: 'Chờ duyệt', count: counts.pending },
            { key: 'approved', label: 'Đã duyệt', count: counts.approved },
            { key: 'rejected', label: 'Từ chối', count: counts.rejected }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStatus === key
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Equipment List */}
      <div className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thiết bị...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <XCircle className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-red-600">{error}</p>
          </div>
        ) : equipment.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không tìm thấy thiết bị {currentStatus}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thiết bị
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chủ sở hữu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá/Ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày gửi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {equipment.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.images.length > 0 ? (
                            <Image
                              src={item.images[0]}
                              alt={item.title}
                              width={50}
                              height={50}
                              className="rounded-lg object-cover mr-3"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.brand} {item.model}</div>
                            <div className="text-sm text-gray-500">{item.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.owner.fullname}</div>
                          <div className="text-sm text-gray-500">{item.owner.email}</div>
                          <div className="text-sm text-gray-500">{item.owner.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(item.pricePerDay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.approvalStatus)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.approvalStatus)}`}>
                            {item.approvalStatus}
                          </span>
                        </div>
                        {item.approvalNotes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {item.approvalNotes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedEquipment(item)}
                          className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Xem xét</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Hiển thị trang <span className="font-medium">{pagination.currentPage}</span> của{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      {selectedEquipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Xem xét thiết bị - {selectedEquipment.title}
                </h3>
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Equipment Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin thiết bị</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div><strong>Tên:</strong> {selectedEquipment.title}</div>
                      <div><strong>Thương hiệu:</strong> {selectedEquipment.brand}</div>
                      <div><strong>Model:</strong> {selectedEquipment.model}</div>
                      <div><strong>Danh mục:</strong> {selectedEquipment.category}</div>
                      <div><strong>Số lượng:</strong> {selectedEquipment.quantity}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Giá cả</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div><strong>Giá/Ngày:</strong> {formatPrice(selectedEquipment.pricePerDay)}</div>
                      {selectedEquipment.pricePerWeek && (
                        <div><strong>Giá/Tuần:</strong> {formatPrice(selectedEquipment.pricePerWeek)}</div>
                      )}
                      {selectedEquipment.pricePerMonth && (
                        <div><strong>Giá/Tháng:</strong> {formatPrice(selectedEquipment.pricePerMonth)}</div>
                      )}
                      <div><strong>Giá thay thế:</strong> {formatPrice(selectedEquipment.replacementPrice)}</div>
                      <div><strong>Tiền cọc:</strong> {formatPrice(selectedEquipment.deposit)}</div>
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin chủ sở hữu</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div><strong>Tên:</strong> {selectedEquipment.owner.fullname}</div>
                      <div><strong>Email:</strong> {selectedEquipment.owner.email}</div>
                      <div><strong>Số điện thoại:</strong> {selectedEquipment.owner.phone}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Hình ảnh</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedEquipment.images.map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          alt={`${selectedEquipment.title} ${index + 1}`}
                          width={200}
                          height={150}
                          className="rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (Tùy chọn)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Thêm ghi chú cho quyết định duyệt..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleAction(selectedEquipment.id, 'reject')}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Đang xử lý...' : 'Từ chối'}
                </button>
                <button
                  onClick={() => handleAction(selectedEquipment.id, 'approve')}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Đang xử lý...' : 'Duyệt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
