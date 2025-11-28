'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, CreditCard, Shield, Camera } from 'lucide-react';

export default function DashboardProfilePage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    
    setUser(JSON.parse(savedUser));
    setLoading(false);
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2">Dashboard</h2>
          </div>

          <nav className="space-y-2">
            <Link
              href="/dashboard/equipments"
              className="w-full flex items-center space-x-2 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <Camera className="h-5 w-5" />
              <span>Thiết bị</span>
            </Link>

            <Link
              href="/dashboard/profile"
              className="w-full flex items-center space-x-2 px-4 py-3 bg-gray-700 text-white rounded-lg"
            >
              <User className="h-5 w-5" />
              <span>Hồ sơ</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Hồ sơ của tôi</h1>

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-orange-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.fullname || 'Người dùng'}</h2>
                  <p className="text-gray-500">{user.email}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {user.role === 'admin' ? 'Quản trị viên' : user.role === 'moderator' ? 'Kiểm duyệt viên' : 'Người dùng'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 
                      user.status === 'unverified' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Đã kích hoạt' : 
                       user.status === 'unverified' ? 'Chưa xác minh' : 
                       'Bị khóa'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Số điện thoại</p>
                      <p className="text-sm font-medium text-gray-900">{user.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Địa chỉ</p>
                      <p className="text-sm font-medium text-gray-900">{user.address || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Ví</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user.wallet?.toLocaleString('vi-VN') || '0'} VNĐ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Mức độ tin cậy</p>
                      <p className="text-sm font-medium text-gray-900">
                        {user.credit === 'trusted' ? 'Tin cậy' : 'Hạn chế'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <div className="pt-4">
                  <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    Chỉnh sửa thông tin
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            {user.status === 'unverified' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-yellow-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                      Tài khoản chưa được xác minh
                    </h3>
                    <p className="text-yellow-800 mb-4">
                      Để sử dụng đầy đủ tính năng và tăng độ tin cậy, vui lòng hoàn tất xác minh danh tính.
                    </p>
                    <Link
                      href="/verify"
                      className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Xác minh ngay
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
