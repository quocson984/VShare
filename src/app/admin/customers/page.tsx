'use client';

import { useEffect, useState } from 'react';
import { 
  Search, 
  Check, 
  X, 
  Eye, 
  Shield,
  User,
  UserCog,
  Ban,
  CheckCircle,
  Clock,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

interface Verification {
  _id: string;
  status: 'pending' | 'verified' | 'rejected';
  frontCccd?: string;
  backCccd?: string;
  selfie?: string;
  notes?: string;
  createdAt: string;
}

interface Customer {
  _id: string;
  email: string;
  fullname?: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'unverified' | 'banned';
  verifications: Verification[];
  createdAt: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };
  const [currentImage, setCurrentImage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (customerId: string, verificationId: string) => {
    try {
      const response = await fetch('/api/admin/verifications/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: customerId,
          verificationId,
          action: 'approve',
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Đã phê duyệt xác minh', 'success');
        fetchCustomers();
        setSelectedVerification(null);
        setSelectedCustomer(null);
      } else {
        showToast('Lỗi: ' + data.message, 'error');
      }
    } catch (error) {
      showToast('Lỗi khi phê duyệt', 'error');
    }
  };

  const handleRejectVerification = async (customerId: string, verificationId: string, notes: string) => {
    try {
      const response = await fetch('/api/admin/verifications/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: customerId,
          verificationId,
          action: 'reject',
          notes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Đã từ chối xác minh', 'success');
        fetchCustomers();
        setSelectedVerification(null);
        setSelectedCustomer(null);
      } else {
        showToast('Lỗi: ' + data.message, 'error');
      }
    } catch (error) {
      showToast('Lỗi khi từ chối', 'error');
    }
  };

  const handleChangeRole = async (customerId: string, newRole: string) => {
    if (currentUser?.role !== 'admin') {
      showToast('Chỉ admin mới có quyền thay đổi role', 'error');
      return;
    }

    if (!confirm(`Bạn có chắc muốn đổi role thành ${newRole}?`)) return;

    try {
      const response = await fetch('/api/admin/customers/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: customerId, role: newRole }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Đã cập nhật role', 'success');
        fetchCustomers();
        setSelectedCustomer(null);
      } else {
        showToast('Lỗi: ' + data.message, 'error');
      }
    } catch (error) {
      showToast('Lỗi khi cập nhật role', 'error');
    }
  };

  const filteredCustomers = customers
    .filter(customer => {
      // Filter out current user's own account
      if (currentUser && customer._id === currentUser.id) {
        return false;
      }
      
      // Moderators cannot see admin or other moderator accounts
      if (currentUser?.role === 'moderator' && (customer.role === 'admin' || customer.role === 'moderator')) {
        return false;
      }
      
      const matchesSearch = 
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm);
      
      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
      const matchesRole = filterRole === 'all' || customer.role === filterRole;
      
      return matchesSearch && matchesStatus && matchesRole;
    })
    .sort((a, b) => {
      // Priority 1: Unverified status first
      if (a.status === 'unverified' && b.status !== 'unverified') return -1;
      if (a.status !== 'unverified' && b.status === 'unverified') return 1;
      
      // Priority 2: If both unverified, sort by earliest verification submission
      if (a.status === 'unverified' && b.status === 'unverified') {
        const aVerificationTime = a.verifications.length > 0 
          ? new Date(a.verifications[0].createdAt).getTime() 
          : Infinity;
        const bVerificationTime = b.verifications.length > 0 
          ? new Date(b.verifications[0].createdAt).getTime() 
          : Infinity;
        return aVerificationTime - bVerificationTime;
      }
      
      // For other statuses, keep original order
      return 0;
    });

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Hoạt động', icon: CheckCircle },
      unverified: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chưa xác minh', icon: Clock },
      banned: { bg: 'bg-red-100', text: 'text-red-700', label: 'Bị cấm', icon: Ban },
    };
    const config = configs[status as keyof typeof configs] || configs.unverified;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const configs = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin', icon: Shield },
      moderator: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Moderator', icon: UserCog },
      user: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'User', icon: User },
    };
    const config = configs[role as keyof typeof configs] || configs.user;
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
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Khách hàng</h1>
      </div>

      <div className="p-8">

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo email, tên, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="unverified">Chưa xác minh</option>
            <option value="banned">Bị cấm</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Tìm thấy <span className="font-semibold">{filteredCustomers.length}</span> khách hàng
          </p>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Xác minh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const pendingVerification = customer.verifications.find(v => v.status === 'pending');
                
                return (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {customer.avatar ? (
                            <Image
                              src={customer.avatar}
                              alt={customer.fullname || customer.email}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {customer.fullname?.charAt(0).toUpperCase() || customer.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.fullname || 'Chưa cập nhật'}
                          </div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(customer.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {pendingVerification ? (
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setSelectedVerification(pendingVerification);
                          }}
                          className="inline-flex items-center px-3 py-1 border border-orange-300 rounded-md text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100"
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Chờ duyệt
                        </button>
                      ) : customer.verifications.some(v => v.status === 'verified') ? (
                        <span className="inline-flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Đã xác minh
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Chưa gửi</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && !selectedVerification && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg min-w-[500px] max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Thông tin khách hàng</h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar & Basic Info */}
              <div className="flex items-center space-x-4">
                {selectedCustomer.avatar ? (
                  <Image
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.fullname || selectedCustomer.email}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {selectedCustomer.fullname?.charAt(0).toUpperCase() || selectedCustomer.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedCustomer.fullname || 'Chưa cập nhật'}
                  </h3>
                  <p className="text-gray-600">{selectedCustomer.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(selectedCustomer.role)}
                    {getStatusBadge(selectedCustomer.status)}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <p className="text-gray-900">{selectedCustomer.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tham gia</label>
                  <p className="text-gray-900">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Role Management (Admin Only) */}
              {currentUser?.role === 'admin' && (
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quản lý Role (Chỉ Admin)
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleChangeRole(selectedCustomer._id, 'user')}
                      disabled={selectedCustomer.role === 'user'}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedCustomer.role === 'user'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Set User
                    </button>
                    <button
                      onClick={() => handleChangeRole(selectedCustomer._id, 'moderator')}
                      disabled={selectedCustomer.role === 'moderator'}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedCustomer.role === 'moderator'
                          ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      Set Moderator
                    </button>
                    <button
                      onClick={() => handleChangeRole(selectedCustomer._id, 'admin')}
                      disabled={selectedCustomer.role === 'admin'}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedCustomer.role === 'admin'
                          ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      Set Admin
                    </button>
                  </div>
                </div>
              )}

              {/* Verification History */}
              <div className="border-t border-gray-200 pt-6">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Lịch sử xác minh danh tính</h4>
                  <p className="text-sm text-gray-500 mt-1">Danh sách các lần người dùng gửi yêu cầu xác minh CCCD để nâng cấp tài khoản</p>
                </div>
                {selectedCustomer.verifications.length === 0 ? (
                  <p className="text-gray-500">Người dùng chưa gửi yêu cầu xác minh nào</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.verifications.map((verification) => (
                      <div
                        key={verification._id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">
                            {new Date(verification.createdAt).toLocaleString('vi-VN')}
                          </span>
                          {verification.status === 'pending' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                              Chờ duyệt
                            </span>
                          )}
                          {verification.status === 'verified' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Đã duyệt
                            </span>
                          )}
                          {verification.status === 'rejected' && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              Từ chối
                            </span>
                          )}
                        </div>
                        {verification.notes && (
                          <p className="text-sm text-gray-600 mb-2">Ghi chú: {verification.notes}</p>
                        )}
                        <button
                          onClick={() => setSelectedVerification(verification)}
                          className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem hình ảnh
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Review Modal */}
      {selectedVerification && selectedCustomer && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg min-w-[600px] max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Xác minh danh tính</h2>
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedCustomer.fullname || selectedCustomer.email}
                </h3>
                <p className="text-gray-600">
                  Gửi lúc: {new Date(selectedVerification.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {selectedVerification.frontCccd && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mặt trước CCCD
                    </label>
                    <div
                      className="relative aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90"
                      onClick={() => {
                        setCurrentImage(selectedVerification.frontCccd!);
                        setShowImageModal(true);
                      }}
                    >
                      <Image
                        src={selectedVerification.frontCccd}
                        alt="Front CCCD"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {selectedVerification.backCccd && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mặt sau CCCD
                    </label>
                    <div
                      className="relative aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90"
                      onClick={() => {
                        setCurrentImage(selectedVerification.backCccd!);
                        setShowImageModal(true);
                      }}
                    >
                      <Image
                        src={selectedVerification.backCccd}
                        alt="Back CCCD"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {selectedVerification.selfie && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ảnh Selfie
                    </label>
                    <div
                      className="relative aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90"
                      onClick={() => {
                        setCurrentImage(selectedVerification.selfie!);
                        setShowImageModal(true);
                      }}
                    >
                      <Image
                        src={selectedVerification.selfie}
                        alt="Selfie"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedVerification.status === 'pending' && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleApproveVerification(selectedCustomer._id, selectedVerification._id)}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium inline-flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Phê duyệt
                  </button>
                  <button
                    onClick={() => {
                      const notes = prompt('Lý do từ chối:');
                      if (notes) {
                        handleRejectVerification(selectedCustomer._id, selectedVerification._id, notes);
                      }
                    }}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium inline-flex items-center justify-center"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Từ chối
                  </button>
                </div>
              )}

              {selectedVerification.status === 'verified' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Đã được phê duyệt</p>
                </div>
              )}

              {selectedVerification.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-2">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-red-700 font-medium text-center mb-2">Đã bị từ chối</p>
                  {selectedVerification.notes && (
                    <p className="text-sm text-red-600 text-center">Lý do: {selectedVerification.notes}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {showImageModal && currentImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <Image
              src={currentImage}
              alt="Zoom"
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-6 py-3 rounded-lg shadow-lg text-white transition-all transform ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            } animate-slide-in-right`}
          >
            {toast.message}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
