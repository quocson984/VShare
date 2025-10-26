'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import Image from 'next/image';

interface VerificationData {
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt?: string | null;
  notes?: string | null;
  frontCccd?: string | null;
  backCccd?: string | null;
  selfie?: string | null;
}

interface UserData {
  id: string;
  email: string;
  fullname: string;
  phone: string;
  address: string;
  role: string;
  identityNumber: string;
  identityFullname: string;
  createdAt: string;
  verification: VerificationData;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminVerificationDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  const fetchVerifications = async (status: string = currentStatus, page: number = currentPage) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/admin/verifications?status=${status}&page=${page}&limit=10`);
      const data = await response.json();

      console.log(data);
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch verifications');
      }
    } catch (err: any) {
      setError('Error fetching verifications: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [currentStatus, currentPage]);

  const handleStatusChange = (status: 'pending' | 'verified' | 'rejected') => {
    setCurrentStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/admin/verifications/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          action,
          notes: actionNotes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        await fetchVerifications();
        setSelectedUser(null);
        setActionNotes('');
        alert(`Verification ${action}d successfully!`);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
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
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'pending':
      default:
        return 'text-orange-600 bg-orange-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-orange-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Verification Dashboard</h2>
              <p className="text-gray-600">Review and approve user identity verifications</p>
            </div>
          </div>
          <button
            onClick={() => fetchVerifications()}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex space-x-2">
          {[
            { key: 'pending', label: 'Pending', count: pagination?.totalCount || 0 },
            { key: 'verified', label: 'Verified', count: 0 },
            { key: 'rejected', label: 'Rejected', count: 0 }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStatus === key
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading verifications...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <XCircle className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-red-600">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No {currentStatus} verifications found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.fullname}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{user.identityFullname}</div>
                          <div className="text-sm text-gray-500">{user.identityNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(user.verification.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.verification.status)}`}>
                            {user.verification.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.verification.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Review</span>
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
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
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
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Review Verification - {selectedUser.fullname}
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div><strong>Name:</strong> {selectedUser.fullname}</div>
                      <div><strong>Email:</strong> {selectedUser.email}</div>
                      <div><strong>Phone:</strong> {selectedUser.phone}</div>
                      <div><strong>Address:</strong> {selectedUser.address}</div>
                      <div><strong>Role:</strong> {selectedUser.role}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Identity Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div><strong>ID Number:</strong> {selectedUser.identityNumber}</div>
                      <div><strong>ID Name:</strong> {selectedUser.identityFullname}</div>
                      <div><strong>Submitted:</strong> {formatDate(selectedUser.verification.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {/* Identity Documents */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Identity Documents</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedUser.verification.frontCccd && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Front CCCD/CMND</label>
                        <div className="mt-1 border rounded-lg p-2">
                          <Image
                            src={selectedUser.verification.frontCccd}
                            alt="Front CCCD"
                            width={200}
                            height={120}
                            className="rounded"
                          />
                        </div>
                      </div>
                    )}
                    {selectedUser.verification.backCccd && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Back CCCD/CMND</label>
                        <div className="mt-1 border rounded-lg p-2">
                          <Image
                            src={selectedUser.verification.backCccd}
                            alt="Back CCCD"
                            width={200}
                            height={120}
                            className="rounded"
                          />
                        </div>
                      </div>
                    )}
                    {selectedUser.verification.selfie && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Selfie</label>
                        <div className="mt-1 border rounded-lg p-2">
                          <Image
                            src={selectedUser.verification.selfie}
                            alt="Selfie"
                            width={200}
                            height={120}
                            className="rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Add notes for the verification decision..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedUser.id, 'reject')}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleAction(selectedUser.id, 'approve')}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
