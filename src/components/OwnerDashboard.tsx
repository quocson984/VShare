'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
  available: number;
  unavailable: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function OwnerDashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [counts, setCounts] = useState<StatusCounts>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    available: 0,
    unavailable: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'available' | 'unavailable'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredEquipment(equipment);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = equipment.filter(item =>
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.brand.toLowerCase().includes(lowercaseQuery) ||
      item.category.toLowerCase().includes(lowercaseQuery)
    );
    setFilteredEquipment(filtered);
  };

  const fetchEquipment = async (status: string = currentStatus, page: number = currentPage) => {
    setIsLoading(true);
    setError('');
    
    try {
      const accountId = localStorage.getItem('accountId');
      if (!accountId) {
        setError('Người dùng chưa đăng nhập');
        return;
      }

      const response = await fetch(`/api/equipment/owner?ownerId=${accountId}&status=${status}&page=${page}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setEquipment(data.data.equipment);
        setFilteredEquipment(data.data.equipment);
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

  const handleStatusChange = (status: typeof currentStatus) => {
    setCurrentStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusToggle = async (equipmentId: string, newStatus: 'available' | 'unavailable') => {
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
          equipmentId,
          ownerId: accountId,
          updates: { status: newStatus }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchEquipment();
        alert(`Trạng thái thiết bị đã được cập nhật thành ${newStatus}`);
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (equipmentId: string) => {
    showConfirm(
      'Xóa thiết bị',
      'Bạn có chắc chắn muốn xóa thiết bị này?',
      async () => {
        closeConfirm();
        setIsProcessing(true);
        
        try {
          const accountId = localStorage.getItem('accountId');
          if (!accountId) {
            throw new Error('Người dùng chưa đăng nhập');
          }

          const response = await fetch(`/api/equipment/owner?equipmentId=${equipmentId}&ownerId=${accountId}`, {
            method: 'DELETE'
          });

          const data = await response.json();
          
          if (data.success) {
            await fetchEquipment();
            showToast('Thiết bị đã được xóa thành công', 'success');
          } else {
            showToast('Lỗi: ' + data.message, 'error');
          }
        } catch (err: any) {
          showToast('Lỗi: ' + err.message, 'error');
        } finally {
          setIsProcessing(false);
        }
      }
    );
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
      year: 'numeric'
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
      {/* Header with Search and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-orange-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Thiết bị của tôi</h2>
              <p className="text-gray-600">Quản lý thiết bị cho thuê của bạn</p>
            </div>
          </div>
          <Link
            href="/dashboard/equipments/new"
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm thiết bị</span>
          </Link>
        </div>

        {/* Search Bar and Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thiết bị..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-5 w-5 text-gray-600" />
            <span>Lọc</span>
          </button>
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
        ) : filteredEquipment.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không tìm thấy thiết bị</p>
            <Link
              href="/dashboard/equipments/new"
              className="inline-block mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Thêm thiết bị đầu tiên
            </Link>
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
                      Hãng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá/Ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEquipment.map((item) => (
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
                            <Link 
                              href={`/dashboard/equipments/${item.id}`}
                              className="text-sm font-medium text-orange-600 hover:text-orange-800 hover:underline"
                            >
                              {item.title}
                            </Link>
                            <div className="text-sm text-gray-500">{item.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.brand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(item.pricePerDay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status === 'available' ? 'Có sẵn' : 'Không có sẵn'}
                        </span>
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

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Chi tiết thiết bị - {selectedEquipment.title}
                </h3>
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin cơ bản</h4>
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

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Hình ảnh</h4>
                  {selectedEquipment.images && selectedEquipment.images.length > 0 ? (
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
                  ) : (
                    <div className="text-gray-500 text-sm">Chưa có hình ảnh</div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Đóng
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

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeConfirm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  closeConfirm();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
