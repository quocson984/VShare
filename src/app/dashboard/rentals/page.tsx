'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import RentalHistory from '@/components/RentalHistory';
import DateRangePicker from '@/components/DateRangePicker';
import { Search } from 'lucide-react';

export default function DashboardRentalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });

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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Đơn thuê</h1>
          <p className="text-gray-600 mt-1">Quản lý các đơn thuê thiết bị của bạn</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên thiết bị..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex-1">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                minDate={new Date(2020, 0, 1)}
              />
            </div>

            {/* Status Filter */}
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ongoing">Đang thuê</option>
                <option value="completed">Hoàn thành</option>
                <option value="canceled">Đã hủy</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateRange({ from: null, to: null });
              }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
        
        <RentalHistory 
          defaultExpanded={true} 
          showHeader={false}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          startDateFilter={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
          endDateFilter={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
        />
      </div>
    </div>
  );
}
