'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import OwnerDashboard from '@/components/OwnerDashboard';

export default function DashboardEquipmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(savedUser);
    setUser(userData);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideSearch={true} />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quản lý thiết bị</h2>
            <nav className="space-y-1">
              <Link
                href="/dashboard/equipments"
                className="flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg"
              >
                Tất cả thiết bị
              </Link>
              <Link
                href="/dashboard/equipments?tab=rented"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Đã thuê
              </Link>
              <Link
                href="/dashboard/equipments?tab=renting"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Đang thuê
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <OwnerDashboard />
          </div>
        </main>
      </div>
    </div>
  );
}
