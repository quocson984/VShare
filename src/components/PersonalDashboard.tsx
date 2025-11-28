'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, CheckCircle, Clock, AlertTriangle, ChevronDown, Camera, LogOut } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  fullname: string;
  role: string;
  status: 'active' | 'unverified' | 'banned';
  credit: 'trusted' | 'restricted';
  wallet: number;
  createdAt: string;
}

interface VerificationData {
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

interface PersonalDashboardProps {
  user: UserData;
  onLogout: () => void;
}

export default function PersonalDashboard({ user, onLogout }: PersonalDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchVerificationStatus();
    }
  }, [isOpen, user]);

  const fetchVerificationStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/verification-status?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setVerificationData(data.verification);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!verificationData) return <Clock className="h-4 w-4 text-gray-400" />;
    
    switch (verificationData.status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusText = () => {
    if (!verificationData) return 'Chưa có thông tin';
    
    switch (verificationData.status) {
      case 'verified':
        return 'Đã xác minh';
      case 'rejected':
        return 'Bị từ chối';
      case 'pending':
      default:
        return 'Đang xác minh';
    }
  };

  const getStatusColor = () => {
    if (!verificationData) return 'text-gray-500';
    
    switch (verificationData.status) {
      case 'verified':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending':
      default:
        return 'text-orange-600';
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

  return (
    <div className="relative">
      {/* User Avatar/Name Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-orange-600" />
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user.fullname || user.email}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dashboard Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{user.fullname || 'Người dùng'}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {user.role === 'admin' ? 'Quản trị viên' : user.role === 'moderator' ? 'Kiểm duyệt viên' : 'Người dùng'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4">
            <div className="space-y-2">
              <Link
                href="/dashboard/equipments"
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full"
                onClick={() => setIsOpen(false)}
              >
                <Camera className="h-4 w-4" />
                <span className="text-sm">Thiết bị</span>
              </Link>
              <Link
                href="/dashboard/profile"
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-4 w-4" />
                <span className="text-sm">Hồ sơ</span>
              </Link>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
