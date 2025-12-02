'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Users, 
  Calendar, 
  Camera, 
  Mail, 
  CreditCard,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin' && userData.role !== 'moderator') {
      alert('Bạn không có quyền truy cập trang này');
      router.push('/');
      return;
    }

    setUser(userData);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accountId');
    router.push('/login');
  };

  const menuItems = [
    {
      name: 'Khách hàng',
      href: '/admin/customers',
      icon: Users,
    },
    {
      name: 'Đơn thuê',
      href: '/admin/rentals',
      icon: Calendar,
    },
    {
      name: 'Hỗ trợ',
      href: '/admin/support',
      icon: Mail,
    },
    {
      name: 'Giao dịch',
      href: '/admin/transactions',
      icon: CreditCard,
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image src="/icon.png" alt="VShare" width={32} height={32} className="w-8 h-8" />
          <span className="text-2xl font-bold text-gray-900">VShare</span>
          <span className="text-sm text-gray-500 ml-2">Admin</span>
        </div>

        {/* User Dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.fullname}</p>
              <p className="text-xs text-gray-500">{user.role === 'admin' ? 'Quản trị viên' : 'Người kiểm duyệt'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 font-semibold text-sm">
                {user.fullname?.charAt(0).toUpperCase()}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <Link
              href="/admin/profile"
              className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm border-b border-gray-100"
            >
              <Users className="w-4 h-4" />
              <span>Hồ sơ cá nhân</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-3 hover:bg-red-50 text-red-600 text-sm w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-orange-600 text-white font-semibold shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.name}</p>
                </div>
              </Link>
            );
          })}
        </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
